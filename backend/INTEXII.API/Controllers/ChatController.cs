using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Text.Json;
using System.Text.Json.Serialization;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using INTEXII.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private static readonly SemaphoreSlim SchemaLock = new(1, 1);
    private static bool _schemaReady;

    /// <summary>Mutable counter stored in <see cref="IMemoryCache"/> so increments are atomic across threads.</summary>
    private sealed class RateLimitCounter
    {
        public int Count;
    }

    private readonly IntexDbContext _db;
    private readonly ClaudeService _claudeService;
    private readonly ChatContextService _contextService;
    private readonly ChatFileService _fileService;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ChatController> _logger;
    private readonly IConfiguration _configuration;

    public ChatController(
        IntexDbContext db,
        ClaudeService claudeService,
        ChatContextService contextService,
        ChatFileService fileService,
        IMemoryCache cache,
        ILogger<ChatController> logger,
        IConfiguration configuration)
    {
        _db = db;
        _claudeService = claudeService;
        _contextService = contextService;
        _fileService = fileService;
        _cache = cache;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpPost("message")]
    [AllowAnonymous]
    public async Task<IActionResult> Message([FromBody] ChatMessageRequest request, CancellationToken cancellationToken)
    {
        await EnsureChatSchemaAsync(cancellationToken);
        if (!PassesRateLimit())
        {
            return StatusCode(429, new { message = "Rate limit exceeded. Try again shortly." });
        }

        var isAdmin = User.IsInRole(AuthRoles.Admin);
        var internalChat = isAdmin && request.IncludeInternalContext;
        var systemPrompt = internalChat ? BuildAdminSystemPrompt() : BuildPublicSystemPrompt();

        var conversation = await ResolveConversationAsync(request.ConversationId, internalChat, cancellationToken);
        var userId = GetUserId();

        if (!internalChat && TryGetPublicCannedResponse(request.Message, out var cannedMarkdown))
        {
            _db.ChatAuditLogs.Add(new ChatAuditLog
            {
                UserId = userId,
                ConversationId = null,
                Question = request.Message,
                Intent = "public_canned",
                HadDbContext = false,
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync(cancellationToken);

            Response.ContentType = "text/event-stream";
            Response.Headers.CacheControl = "no-cache";
            Response.Headers.Append("Connection", "keep-alive");
            Response.Headers["X-Accel-Buffering"] = "no";

            await WriteSseEventAsync("delta", new { delta = cannedMarkdown }, cancellationToken);
            await WriteSseEventAsync("done", new { conversationId = (int?)null, ok = true }, cancellationToken);
            return new EmptyResult();
        }

        var attachments = new List<ChatAttachmentContent>();
        if (request.AttachmentUploadIds?.Count > 0 && conversation is not null)
        {
            var uploads = await _db.ChatUploads
                .AsNoTracking()
                .Where(u => request.AttachmentUploadIds.Contains(u.UploadId) && u.ConversationId == conversation.ConversationId)
                .ToListAsync(cancellationToken);

            foreach (var upload in uploads)
            {
                var storedPath = Path.Combine(_fileService.GetStorageRoot(), upload.StoredFilename);
                if (!System.IO.File.Exists(storedPath))
                {
                    continue;
                }

                var extracted = await _fileService.ExtractAttachmentAsync(
                    upload.OriginalFilename,
                    upload.ContentType,
                    storedPath,
                    cancellationToken);
                attachments.Add(extracted);
            }
        }

        var history = new List<ChatMessageContent>();
        if (conversation is not null)
        {
            var previous = await _db.ChatMessages
                .AsNoTracking()
                .Where(m => m.ConversationId == conversation.ConversationId)
                .OrderBy(m => m.CreatedAt)
                .Take(60)
                .ToListAsync(cancellationToken);

            foreach (var msg in previous)
            {
                history.Add(new ChatMessageContent(msg.Role, msg.Content, Array.Empty<ChatAttachmentContent>()));
            }
        }

        var contextBlocks = new List<string>();
        var intent = "general";
        if (internalChat)
        {
            var result = await _contextService.BuildContextAsync(request.Message, cancellationToken);
            intent = result.Intent;
            contextBlocks.AddRange(result.Blocks);
        }

        if (internalChat && request.ExternalContext is { Length: > 0 })
        {
            contextBlocks.Add($"--- Uploaded external context ---\n{request.ExternalContext}");
        }

        if (contextBlocks.Count > 0)
        {
            var contextPrefix = "[DATABASE CONTEXT]\n" + string.Join("\n\n", contextBlocks) + "\n[END DATABASE CONTEXT]";
            history.Add(new ChatMessageContent("assistant", contextPrefix, Array.Empty<ChatAttachmentContent>()));
        }

        if (!internalChat)
        {
            history.Add(new ChatMessageContent("assistant", BuildPublicSiteMapBlock(), Array.Empty<ChatAttachmentContent>()));
        }

        history.Add(new ChatMessageContent("user", request.Message, attachments));

        if (conversation is not null)
        {
            var priorUserMessageCount = await _db.ChatMessages
                .CountAsync(m => m.ConversationId == conversation.ConversationId && m.Role == "user", cancellationToken);

            _db.ChatMessages.Add(new ChatMessage
            {
                ConversationId = conversation.ConversationId,
                Role = "user",
                Content = request.Message,
                AttachmentsJson = JsonSerializer.Serialize(request.AttachmentUploadIds ?? Array.Empty<int>()),
                CreatedAt = DateTime.UtcNow
            });
            await _db.SaveChangesAsync(cancellationToken);

            if (priorUserMessageCount == 0 && IsPlaceholderConversationTitle(conversation.Title))
            {
                conversation.Title = DeriveChatTitleFromUserMessage(request.Message);
                conversation.UpdatedAt = DateTime.UtcNow;
                await _db.SaveChangesAsync(cancellationToken);
            }
        }

        _db.ChatAuditLogs.Add(new ChatAuditLog
        {
            UserId = userId,
            ConversationId = conversation?.ConversationId,
            Question = request.Message,
            Intent = intent,
            HadDbContext = contextBlocks.Count > 0,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(cancellationToken);

        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Append("Connection", "keep-alive");
        Response.Headers["X-Accel-Buffering"] = "no";

        var assistantBuilder = new StringBuilder();
        await foreach (var token in _claudeService.StreamResponseAsync(history, systemPrompt, stream: true, cancellationToken))
        {
            assistantBuilder.Append(token);
            await WriteSseEventAsync("delta", new { delta = token }, cancellationToken);
        }

        var finalText = assistantBuilder.ToString();
        if (conversation is not null)
        {
            _db.ChatMessages.Add(new ChatMessage
            {
                ConversationId = conversation.ConversationId,
                Role = "assistant",
                Content = finalText,
                CreatedAt = DateTime.UtcNow
            });
            conversation.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(cancellationToken);
        }

        await WriteSseEventAsync("done", new
        {
            conversationId = conversation?.ConversationId,
            ok = true
        }, cancellationToken);
        return new EmptyResult();
    }

    [HttpPost("conversations")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequest request, CancellationToken cancellationToken)
    {
        await EnsureChatSchemaAsync(cancellationToken);
        var userId = GetRequiredUserId();
        var conversation = new ChatConversation
        {
            UserId = userId,
            Title = string.IsNullOrWhiteSpace(request.Title) ? "New conversation" : request.Title.Trim(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _db.ChatConversations.Add(conversation);
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(MapConversation(conversation));
    }

    [HttpGet("conversations")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> ListConversations(CancellationToken cancellationToken)
    {
        await EnsureChatSchemaAsync(cancellationToken);
        var userId = GetRequiredUserId();
        var conversations = await _db.ChatConversations
            .AsNoTracking()
            .Where(c => c.UserId == userId && !c.IsDeleted)
            .OrderByDescending(c => c.UpdatedAt)
            .ToListAsync(cancellationToken);

        var placeholderIds = conversations
            .Where(c => IsPlaceholderConversationTitle(c.Title))
            .Select(c => c.ConversationId)
            .ToList();

        Dictionary<int, string> firstUserContentByConvId = [];
        if (placeholderIds.Count > 0)
        {
            var userRows = await _db.ChatMessages
                .AsNoTracking()
                .Where(m => placeholderIds.Contains(m.ConversationId) && m.Role == "user")
                .Select(m => new { m.ConversationId, m.CreatedAt, m.Content })
                .ToListAsync(cancellationToken);

            firstUserContentByConvId = userRows
                .GroupBy(x => x.ConversationId)
                .ToDictionary(g => g.Key, g => g.OrderBy(x => x.CreatedAt).First().Content);
        }

        return Ok(conversations.Select(c =>
        {
            var title = c.Title ?? string.Empty;
            if (IsPlaceholderConversationTitle(title)
                && firstUserContentByConvId.TryGetValue(c.ConversationId, out var firstMsg)
                && !string.IsNullOrWhiteSpace(firstMsg))
            {
                title = DeriveChatTitleFromUserMessage(firstMsg);
            }

            return new
            {
                conversationId = c.ConversationId,
                title,
                createdAt = c.CreatedAt,
                updatedAt = c.UpdatedAt
            };
        }).ToArray());
    }

    [HttpGet("conversations/{id:int}")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> GetConversation(int id, CancellationToken cancellationToken)
    {
        await EnsureChatSchemaAsync(cancellationToken);
        var userId = GetRequiredUserId();
        var conversation = await _db.ChatConversations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.ConversationId == id && c.UserId == userId && !c.IsDeleted, cancellationToken);
        if (conversation is null)
        {
            return NotFound();
        }

        var messages = await _db.ChatMessages
            .AsNoTracking()
            .Where(m => m.ConversationId == id)
            .OrderBy(m => m.CreatedAt)
            .ToListAsync(cancellationToken);

        var displayTitle = conversation.Title ?? string.Empty;
        if (IsPlaceholderConversationTitle(displayTitle))
        {
            var firstUser = messages.FirstOrDefault(m => m.Role == "user");
            if (firstUser is not null && !string.IsNullOrWhiteSpace(firstUser.Content))
            {
                displayTitle = DeriveChatTitleFromUserMessage(firstUser.Content);
            }
        }

        return Ok(new
        {
            conversation = new
            {
                conversationId = conversation.ConversationId,
                title = displayTitle,
                createdAt = conversation.CreatedAt,
                updatedAt = conversation.UpdatedAt
            },
            messages = messages.Select(m => new
            {
                messageId = m.MessageId,
                role = m.Role,
                content = m.Content,
                createdAt = m.CreatedAt
            })
        });
    }

    [HttpDelete("conversations/{id:int}")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> DeleteConversation(int id, CancellationToken cancellationToken)
    {
        await EnsureChatSchemaAsync(cancellationToken);
        var userId = GetRequiredUserId();
        var conversation = await _db.ChatConversations
            .FirstOrDefaultAsync(c => c.ConversationId == id && c.UserId == userId && !c.IsDeleted, cancellationToken);
        if (conversation is null)
        {
            return NotFound();
        }

        conversation.IsDeleted = true;
        conversation.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    [HttpPatch("conversations/{id:int}")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> RenameConversation(int id, [FromBody] RenameConversationRequest request, CancellationToken cancellationToken)
    {
        await EnsureChatSchemaAsync(cancellationToken);
        var userId = GetRequiredUserId();
        var conversation = await _db.ChatConversations
            .FirstOrDefaultAsync(c => c.ConversationId == id && c.UserId == userId && !c.IsDeleted, cancellationToken);
        if (conversation is null)
        {
            return NotFound();
        }

        conversation.Title = string.IsNullOrWhiteSpace(request.Title) ? conversation.Title : request.Title.Trim();
        conversation.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(MapConversation(conversation));
    }

    [HttpPost("upload")]
    [Authorize(Roles = AuthRoles.Admin)]
    [RequestSizeLimit(30_000_000)]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] int conversationId, CancellationToken cancellationToken)
    {
        await EnsureChatSchemaAsync(cancellationToken);
        var userId = GetRequiredUserId();

        var conversation = await _db.ChatConversations
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.ConversationId == conversationId && c.UserId == userId && !c.IsDeleted, cancellationToken);
        if (conversation is null)
        {
            return NotFound(new { message = "Conversation not found." });
        }

        if (file is null || file.Length == 0)
        {
            return BadRequest(new { message = "No file uploaded." });
        }

        if (!_fileService.IsAllowedFileType(file.FileName))
        {
            return BadRequest(new { message = "Unsupported file type." });
        }

        var maxSizeMb = int.TryParse(_configuration["CHAT_MAX_FILE_SIZE_MB"], out var configuredMb) ? configuredMb : 25;
        if (file.Length > maxSizeMb * 1024L * 1024L)
        {
            return BadRequest(new { message = $"File exceeds {maxSizeMb}MB limit." });
        }

        var (storedPath, contentType) = await _fileService.SaveUploadAsync(file, cancellationToken);
        var upload = new ChatUpload
        {
            ConversationId = conversationId,
            OriginalFilename = file.FileName,
            StoredFilename = Path.GetFileName(storedPath),
            ContentType = contentType,
            FileSizeBytes = file.Length,
            UploadedAt = DateTime.UtcNow
        };
        _db.ChatUploads.Add(upload);
        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            uploadId = upload.UploadId,
            originalFilename = upload.OriginalFilename,
            contentType = upload.ContentType,
            fileSizeBytes = upload.FileSizeBytes
        });
    }

    [HttpPost("feedback")]
    [Authorize(Roles = AuthRoles.Admin)]
    public async Task<IActionResult> Feedback([FromBody] FeedbackRequest request, CancellationToken cancellationToken)
    {
        await EnsureChatSchemaAsync(cancellationToken);
        var userId = GetRequiredUserId();
        var message = await _db.ChatMessages
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.MessageId == request.MessageId, cancellationToken);
        if (message is null)
        {
            return NotFound();
        }

        var rating = request.Rating?.Trim().ToLowerInvariant();
        if (rating is not ("up" or "down"))
        {
            return BadRequest(new { message = "Rating must be 'up' or 'down'." });
        }

        _db.ChatFeedback.Add(new ChatFeedback
        {
            MessageId = request.MessageId,
            UserId = userId,
            Rating = rating,
            CreatedAt = DateTime.UtcNow
        });
        await _db.SaveChangesAsync(cancellationToken);
        return Ok(new { ok = true });
    }

    private bool PassesRateLimit()
    {
        var key = $"chat-rate:{GetUserId() ?? HttpContext.Connection.RemoteIpAddress?.ToString() ?? "anon"}";
        var maxPerMinute = int.TryParse(_configuration["CHAT_RATE_LIMIT_PER_MINUTE"], out var configured) ? configured : 30;

        var counter = _cache.GetOrCreate(key, entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1);
            return new RateLimitCounter();
        }) ?? throw new InvalidOperationException("Rate limit counter missing from cache.");

        // Compare-and-swap loop: atomic increment without read-modify-write races on the cache value.
        while (true)
        {
            var observed = Volatile.Read(ref counter.Count);
            if (observed >= maxPerMinute)
            {
                return false;
            }

            if (Interlocked.CompareExchange(ref counter.Count, observed + 1, observed) == observed)
            {
                return true;
            }
        }
    }

    private async Task<ChatConversation?> ResolveConversationAsync(int? requestedId, bool usePersistedConversation, CancellationToken cancellationToken)
    {
        if (!usePersistedConversation)
        {
            return null;
        }

        var userId = GetRequiredUserId();
        if (requestedId.HasValue)
        {
            var existing = await _db.ChatConversations
                .FirstOrDefaultAsync(c => c.ConversationId == requestedId && c.UserId == userId && !c.IsDeleted, cancellationToken);
            if (existing is not null)
            {
                return existing;
            }
        }

        var created = new ChatConversation
        {
            UserId = userId,
            Title = "New conversation",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
            IsDeleted = false
        };
        _db.ChatConversations.Add(created);
        await _db.SaveChangesAsync(cancellationToken);
        return created;
    }

    private static object MapConversation(ChatConversation conversation) => new
    {
        conversationId = conversation.ConversationId,
        title = conversation.Title,
        createdAt = conversation.CreatedAt,
        updatedAt = conversation.UpdatedAt
    };

    private static bool IsPlaceholderConversationTitle(string? title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return true;
        }

        return string.Equals(title.Trim(), "New conversation", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>Short single-line title from the first user message (sidebar list).</summary>
    private static string DeriveChatTitleFromUserMessage(string? message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return "New conversation";
        }

        var singleLine = Regex.Replace(message.Trim(), @"\s+", " ");
        const int maxLen = 72;
        if (singleLine.Length <= maxLen)
        {
            return singleLine;
        }

        return string.Concat(singleLine.AsSpan(0, maxLen - 1), "…");
    }

    /// <summary>Deterministic copy for simple public questions—skips the LLM so answers never contradict the in-app quick links.</summary>
    private static bool TryGetPublicCannedResponse(string message, out string markdown)
    {
        markdown = string.Empty;
        if (string.IsNullOrWhiteSpace(message))
        {
            return false;
        }

        var trimmed = message.Trim();
        if (trimmed.Length > 320)
        {
            return false;
        }

        var donate = Regex.IsMatch(
            trimmed,
            @"\b(donate|donation|donating|give\s+money|make\s+a\s+gift|contribute|financial\s+support|where\s+can\s+i\s+give|how\s+(can|do)\s+i\s+donate|want\s+to\s+donate|support\s+haven)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        var login = Regex.IsMatch(
            trimmed,
            @"\b(log\s*in|login|sign\s*in|signin|where\s+(can|do)\s+i\s+log\s*in|how\s+(can|do)\s+i\s+log\s*in|access\s+(my\s+)?account|sign\s+on)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        var signup = Regex.IsMatch(
            trimmed,
            @"\b(sign\s*up|signup|register|create\s+(an?\s+)?account|new\s+account|where\s+(can|do)\s+i\s+sign\s*up|how\s+(can|do)\s+i\s+register)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        var authDetails = Regex.IsMatch(trimmed, @"\b(credentials?|authentication)\b", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        var visitorAccess = Regex.IsMatch(
            trimmed,
            @"\b(log\s*in|login|sign\s*in|account|access|sign\s+on)\b",
            RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);
        if (authDetails && visitorAccess)
        {
            login = true;
        }

        if (!donate && !login && !signup)
        {
            return false;
        }

        var parts = new List<string>();
        if (login)
        {
            parts.Add("You can sign in on our log in page.\n\n**[Log in here](/login)**");
        }

        if (signup)
        {
            parts.Add("You can create an account here.\n\n**[Create an account](/signup)**");
        }

        if (donate)
        {
            parts.Add("Thank you for wanting to help—your support means a lot.\n\n**[Donate here](/donate)**");
        }

        markdown = string.Join("\n\n", parts);
        return true;
    }

    private static string BuildPublicSiteMapBlock()
    {
        return """
[PUBLIC SITE MAP — authoritative paths on this website; use ONLY these for in-site links]
/ — Home
/donate — Donate / make a gift (main giving page)
/impact — Impact
/login — Log in
/signup — Create account (same as /register)
/chat — Haven Chat (this assistant)
/privacy — Privacy policy
/cookies — Cookie policy
/dashboard — Signed-in dashboard (account required)
/donations — Donation history (account required)
[END PUBLIC SITE MAP]
""".Trim();
    }

    private string BuildPublicSystemPrompt()
    {
        return """
You are Haven Chat: the assistant for everyone visiting Haven of Hope on the website. You are NOT an internal staff tool, NOT a database analyst, and NOT "for admins." Never say you are an internal assistant, never mention the database, dashboards, "database context," "operational insights," IT administrators, or site configuration—even if the user sounds like they are testing you.

Never say or imply that you "don't have access," "can't access," "don't have information," "lack login details," or that the visitor should contact IT or an administrator instead of using the website. You always help with normal visitor questions using the site map—no apologies about permissions.

Each request includes a [PUBLIC SITE MAP] block with real URLs on this site. When you link somewhere, copy those paths exactly. Do not invent paths.

Whenever a question can be answered by sending the visitor to a page on that map (for example where to log in, donate, sign up, read policies), do this: one short helpful sentence, then put the main markdown link on its own line. Do not refuse or hedge—the pages exist at those paths.

Tone: warm, calm, short, and human. If something truly is not on the site map and is not general knowledge, say briefly that you are not sure—without technical reasons.

Donations: thank them, say their gift matters, then on its own line:
**[Donate here](/donate)**
Add one line with [/login](/login) or [/signup](/signup) only if an account is relevant.

Log in / sign in / access my account: friendly one-liner, then on its own line:
**[Log in here](/login)**

Create account / register / sign up: friendly one-liner, then on its own line:
**[Create an account](/signup)**

Other "where do I…?" questions: use the matching path from the site map the same way (sentence + link line).

Visitors are not IT staff and cannot fix backend or permission issues. Do NOT give troubleshooting, diagnostics, or "why it might not work" explanations. Do NOT list steps like checking documentation, contacting an administrator, verifying credentials, contacting a supervisor, or "if urgent" escalation. Do NOT ask which internal system or portal they meant (case management, donor platform, safehouse tools, etc.)—those are not for public chat. If they sound stuck logging in, still point them to [/login](/login) in one short line; optionally suggest [/signup](/signup) if an account might be missing—nothing else.

Use light markdown. Never give strategic memos, "internal notes," or statistics you were not given in plain visitor-appropriate text.
""";
    }

    private string BuildAdminSystemPrompt()
    {
        return """
You are the Haven of Hope internal assistant for admins and staff.
You only have internal data when a message includes a [DATABASE CONTEXT] block from this session. Treat that block as authoritative for numbers and summaries; do not invent figures. If there is no such block, say you do not have live internal context for that question.
Provide analysis, trends, anomalies, and actionable recommendations when context is present.
Be direct, precise, and strategic. Cross-link domains when useful (donations, residents, safehouses, social).
For minors/cases, stay sensitive and avoid unnecessary personal detail.
""";
    }

    private string GetRequiredUserId()
    {
        return GetUserId() ?? throw new UnauthorizedAccessException("User identity is required.");
    }

    private string? GetUserId()
    {
        return User.FindFirstValue(ClaimTypes.NameIdentifier);
    }

    private async Task WriteSseEventAsync(string eventName, object payload, CancellationToken cancellationToken)
    {
        var json = JsonSerializer.Serialize(payload);
        await Response.WriteAsync($"event: {eventName}\n", cancellationToken);
        await Response.WriteAsync($"data: {json}\n\n", cancellationToken);
        await Response.Body.FlushAsync(cancellationToken);
    }

    private async Task EnsureChatSchemaAsync(CancellationToken cancellationToken)
    {
        if (_schemaReady)
        {
            return;
        }

        await SchemaLock.WaitAsync(cancellationToken);
        try
        {
            if (_schemaReady)
            {
                return;
            }

            if (_db.Database.IsSqlite())
            {
                await _db.Database.ExecuteSqlRawAsync("""
CREATE TABLE IF NOT EXISTS chat_conversations (
    conversation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    is_deleted INTEGER NOT NULL DEFAULT 0
);
""", cancellationToken);
                await _db.Database.ExecuteSqlRawAsync("""
CREATE TABLE IF NOT EXISTS chat_messages (
    message_id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments_json TEXT NULL,
    created_at TEXT NOT NULL
);
""", cancellationToken);
                await _db.Database.ExecuteSqlRawAsync("""
CREATE TABLE IF NOT EXISTS chat_feedback (
    feedback_id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    rating TEXT NOT NULL,
    created_at TEXT NOT NULL
);
""", cancellationToken);
                await _db.Database.ExecuteSqlRawAsync("""
CREATE TABLE IF NOT EXISTS chat_uploads (
    upload_id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    original_filename TEXT NOT NULL,
    stored_filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size_bytes INTEGER NULL,
    uploaded_at TEXT NOT NULL
);
""", cancellationToken);
                await _db.Database.ExecuteSqlRawAsync("""
CREATE TABLE IF NOT EXISTS chat_audit_logs (
    chat_audit_log_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NULL,
    conversation_id INTEGER NULL,
    question TEXT NOT NULL,
    intent TEXT NOT NULL,
    had_db_context INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);
""", cancellationToken);
            }
            else if (_db.Database.IsSqlServer())
            {
                await _db.Database.ExecuteSqlRawAsync("""
IF OBJECT_ID(N'dbo.chat_conversations', N'U') IS NULL
CREATE TABLE dbo.chat_conversations (
    conversation_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id NVARCHAR(450) NOT NULL,
    title NVARCHAR(255) NULL,
    created_at DATETIME2 NOT NULL,
    updated_at DATETIME2 NOT NULL,
    is_deleted BIT NOT NULL DEFAULT 0
);
IF OBJECT_ID(N'dbo.chat_messages', N'U') IS NULL
CREATE TABLE dbo.chat_messages (
    message_id INT IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT NOT NULL,
    role NVARCHAR(20) NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    attachments_json NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL
);
IF OBJECT_ID(N'dbo.chat_feedback', N'U') IS NULL
CREATE TABLE dbo.chat_feedback (
    feedback_id INT IDENTITY(1,1) PRIMARY KEY,
    message_id INT NOT NULL,
    user_id NVARCHAR(450) NOT NULL,
    rating NVARCHAR(10) NOT NULL,
    created_at DATETIME2 NOT NULL
);
IF OBJECT_ID(N'dbo.chat_uploads', N'U') IS NULL
CREATE TABLE dbo.chat_uploads (
    upload_id INT IDENTITY(1,1) PRIMARY KEY,
    conversation_id INT NOT NULL,
    original_filename NVARCHAR(500) NOT NULL,
    stored_filename NVARCHAR(500) NOT NULL,
    content_type NVARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NULL,
    uploaded_at DATETIME2 NOT NULL
);
IF OBJECT_ID(N'dbo.chat_audit_logs', N'U') IS NULL
CREATE TABLE dbo.chat_audit_logs (
    chat_audit_log_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id NVARCHAR(450) NULL,
    conversation_id INT NULL,
    question NVARCHAR(MAX) NOT NULL,
    intent NVARCHAR(50) NOT NULL,
    had_db_context BIT NOT NULL DEFAULT 0,
    created_at DATETIME2 NOT NULL
);
""", cancellationToken);
            }
            else
            {
                throw new InvalidOperationException(
                    $"Chat schema bootstrap is only implemented for SQLite and SQL Server. Current provider: {_db.Database.ProviderName ?? "unknown"}.");
            }

            _schemaReady = true;
        }
        finally
        {
            SchemaLock.Release();
        }
    }

    public sealed record ChatMessageRequest(
        [property: JsonPropertyName("conversationId")] int? ConversationId,
        [property: JsonPropertyName("message")] string Message,
        [property: JsonPropertyName("externalContext")] string? ExternalContext,
        [property: JsonPropertyName("attachmentUploadIds")] IReadOnlyList<int>? AttachmentUploadIds,
        [property: JsonPropertyName("includeInternalContext")] bool IncludeInternalContext = false);

    public sealed record CreateConversationRequest(string? Title);
    public sealed record RenameConversationRequest(string Title);
    public sealed record FeedbackRequest(int MessageId, string Rating);
}
