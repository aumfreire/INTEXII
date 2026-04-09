using System.Text;
using System.Text.Json;
using INTEXII.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/chat")]
public class ChatController : ControllerBase
{
    private const string AnthropicEndpoint = "https://api.anthropic.com/v1/messages";
    private const string AnthropicModel = "claude-haiku-4-5-20251001";
    private const string SystemPrompt =
        "You are a warm and helpful assistant for Haven of Hope, a nonprofit organization in the Philippines that protects, supports, and empowers vulnerable girls including those who have been trafficked, abused, neglected, or abandoned. Answer questions about the organization, how to donate, what impact donations make, and how to get involved. Keep responses concise, compassionate, and encouraging. Always guide potential donors toward taking action.";

    private static readonly IReadOnlyList<KnowledgeDocument> KnowledgeBase =
    [
        new(
            "mission",
            "Mission and Services",
            "/#mission",
            "Haven of Hope protects, supports, heals, and empowers vulnerable girls, including survivors of trafficking, abuse, neglect, and abandonment. Services include emergency shelter, trauma-informed counseling, education support, life skills training, and long-term reintegration support."),
        new(
            "donation",
            "How to Donate",
            "/donate",
            "People can donate through the Donate page. Donors can choose one-time or monthly gifts. Donation ranges and impact tiers are shown clearly, and a post-donation confirmation explains impact. Supporters are encouraged to take immediate action through the donation flow."),
        new(
            "impact",
            "Donation Impact Messaging",
            "/donate",
            "Impact messages in the current donation experience include: meal support for smaller gifts, school supplies support for mid-level gifts, and shelter-and-care support for larger gifts. The app emphasizes that each gift creates measurable safety, healing, and opportunity for girls."),
        new(
            "involved",
            "Ways to Get Involved",
            "/#impact",
            "People can get involved by donating, creating an account, and logging in to manage donor activity. The site highlights awareness, community support, and long-term commitment to protecting girls."),
        new(
            "contact",
            "Contact and Trust",
            "/cookies",
            "The organization presents trust signals including secure donation language, nonprofit framing, and privacy/cookie policy access. Users can review policy details and proceed confidently."),
    ];

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ChatController> _logger;
    private readonly IntexDbContext _db;

    public ChatController(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        ILogger<ChatController> logger,
        IntexDbContext db)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _logger = logger;
        _db = db;
    }

    [HttpPost("widget")]
    public async Task<IActionResult> Widget([FromBody] ChatRequest request)
    {
        var apiKey = _configuration["Anthropic:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            return StatusCode(500, new { message = "Chat service is not configured (missing Anthropic:ApiKey)." });
        }

        if (request.Messages is null || request.Messages.Count == 0)
        {
            return BadRequest(new { message = "At least one chat message is required." });
        }

        var normalizedMessages = request.Messages
            .Where(m => !string.IsNullOrWhiteSpace(m.Text) && (m.Role == "user" || m.Role == "assistant"))
            .Select(m => new ChatMessagePayload(m.Role!, m.Text!.Trim()))
            .TakeLast(12)
            .ToList();

        if (normalizedMessages.Count == 0)
        {
            return BadRequest(new { message = "No valid messages were provided." });
        }

        var latestUserMessage = normalizedMessages.LastOrDefault(m => m.Role == "user")?.Text ?? string.Empty;
        var selectedKnowledge = SelectKnowledge(latestUserMessage, topN: 3);
        var isAdmin = User.IsInRole(AuthRoles.Admin);
        var roleAccessGuardrail = isAdmin
            ? "Access level: Admin. You may use provided admin insights from internal data to answer."
            : "Access level: Public/Donor. You must only use public website/general knowledge context provided. Never claim access to private or internal database records.";

        var dynamicInsights = isAdmin
            ? await BuildAdminInsightsAsync(latestUserMessage)
            : Array.Empty<KnowledgeDocument>();
        var allGroundingDocs = selectedKnowledge.Concat(dynamicInsights).ToArray();
        var groundingPrompt = BuildGroundingPrompt(allGroundingDocs);

        var anthropicPayload = new
        {
            model = AnthropicModel,
            max_tokens = 500,
            system = $"{SystemPrompt}\n\n{roleAccessGuardrail}\n\nUse this grounded context when answering:\n{groundingPrompt}\n\nIf needed information is missing, say so briefly and suggest a next step.",
            messages = normalizedMessages.Select(m => new
            {
                role = m.Role,
                content = new[] { new { type = "text", text = m.Text } }
            })
        };

        try
        {
            var client = _httpClientFactory.CreateClient();
            using var outbound = new HttpRequestMessage(HttpMethod.Post, AnthropicEndpoint);
            outbound.Headers.Add("x-api-key", apiKey);
            outbound.Headers.Add("anthropic-version", "2023-06-01");
            outbound.Content = new StringContent(JsonSerializer.Serialize(anthropicPayload), Encoding.UTF8, "application/json");

            using var response = await client.SendAsync(outbound);
            var raw = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Anthropic chat call failed with status {Status}: {Body}", response.StatusCode, raw);
                return StatusCode((int)response.StatusCode, new { message = "Chat provider request failed." });
            }

            using var json = JsonDocument.Parse(raw);
            var answer = ExtractAssistantText(json.RootElement);
            if (string.IsNullOrWhiteSpace(answer))
            {
                answer = "I could not generate a response right now. Please try again.";
            }

            var sources = allGroundingDocs.Select(d => new ChatSource(
                d.Title,
                d.Route,
                TrimForSnippet(d.Content, 160))).ToArray();

            return Ok(new ChatResponse(answer, sources));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error while processing chat request.");
            return StatusCode(500, new { message = "Unexpected error while processing chat request." });
        }
    }

    private async Task<IReadOnlyList<KnowledgeDocument>> BuildAdminInsightsAsync(string query)
    {
        var term = query.Trim();
        var includeDonations = string.IsNullOrWhiteSpace(term)
            || ContainsAny(term, "donation", "revenue", "amount", "fund", "campaign", "monthly");
        var includeSupporters = string.IsNullOrWhiteSpace(term)
            || ContainsAny(term, "supporter", "donor", "user", "account");
        var includeOperations = string.IsNullOrWhiteSpace(term)
            || ContainsAny(term, "resident", "safehouse", "case", "program", "shelter");

        var docs = new List<KnowledgeDocument>();

        if (includeDonations)
        {
            var donationCount = await _db.Donations.CountAsync();
            var totalAmount = await _db.Donations.SumAsync(d => d.Amount ?? 0m);
            var recurringCount = await _db.Donations.CountAsync(d => d.IsRecurring == true);

            var campaignRows = await _db.Donations
                .AsNoTracking()
                .Where(d => d.CampaignName != null && d.Amount != null)
                .GroupBy(d => d.CampaignName!)
                .Select(group => new { Campaign = group.Key, Total = group.Sum(d => d.Amount ?? 0m) })
                .OrderByDescending(row => row.Total)
                .Take(3)
                .ToListAsync();

            var topCampaigns = campaignRows.Count == 0
                ? "No campaign totals available yet."
                : string.Join("; ", campaignRows.Select(row => $"{row.Campaign}: {row.Total:0.##}"));

            docs.Add(new KnowledgeDocument(
                "admin-donations",
                "Admin Insights: Donations (Live DB)",
                "/admin/donations",
                $"Donations count: {donationCount}. Total amount: {totalAmount:0.##}. Recurring donations: {recurringCount}. Top campaigns by amount: {topCampaigns}"));
        }

        if (includeSupporters)
        {
            var supporterCount = await _db.Supporters.CountAsync();
            var activeSupporters = await _db.Supporters.CountAsync(s => s.Status != null && s.Status.ToLower() == "active");
            var organizationSupporters = await _db.Supporters.CountAsync(s => s.OrganizationName != null && s.OrganizationName != "");

            docs.Add(new KnowledgeDocument(
                "admin-supporters",
                "Admin Insights: Supporters (Live DB)",
                "/admin/users",
                $"Supporters total: {supporterCount}. Active supporters: {activeSupporters}. Supporters with organization names: {organizationSupporters}."));
        }

        if (includeOperations)
        {
            var residentCount = await _db.Residents.CountAsync();
            var safehouseCount = await _db.Safehouses.CountAsync();

            docs.Add(new KnowledgeDocument(
                "admin-operations",
                "Admin Insights: Program Operations (Live DB)",
                "/admin",
                $"Residents tracked: {residentCount}. Safehouses tracked: {safehouseCount}."));
        }

        return docs;
    }

    private static string ExtractAssistantText(JsonElement root)
    {
        if (!root.TryGetProperty("content", out var content) || content.ValueKind != JsonValueKind.Array)
        {
            return string.Empty;
        }

        foreach (var part in content.EnumerateArray())
        {
            if (!part.TryGetProperty("type", out var typeElement) || typeElement.GetString() != "text")
            {
                continue;
            }

            if (part.TryGetProperty("text", out var textElement))
            {
                return textElement.GetString() ?? string.Empty;
            }
        }

        return string.Empty;
    }

    private static IReadOnlyList<KnowledgeDocument> SelectKnowledge(string query, int topN)
    {
        var queryTerms = Tokenize(query);
        if (queryTerms.Count == 0)
        {
            return KnowledgeBase.Take(topN).ToArray();
        }

        return KnowledgeBase
            .Select(doc => new
            {
                Doc = doc,
                Score = queryTerms.Sum(term =>
                    CountOccurrences(doc.Title, term) * 3 +
                    CountOccurrences(doc.Content, term))
            })
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Doc.Title)
            .Take(topN)
            .Select(x => x.Doc)
            .ToArray();
    }

    private static string BuildGroundingPrompt(IReadOnlyList<KnowledgeDocument> documents)
    {
        var builder = new StringBuilder();
        foreach (var doc in documents)
        {
            builder.AppendLine($"- Source: {doc.Title} ({doc.Route})");
            builder.AppendLine($"  {doc.Content}");
        }

        return builder.ToString().Trim();
    }

    private static HashSet<string> Tokenize(string text)
    {
        var terms = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var pieces = text.Split([' ', '\n', '\r', '\t', '.', ',', '!', '?', ':', ';', '(', ')', '-', '/', '\\', '"', '\''],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        foreach (var piece in pieces)
        {
            if (piece.Length >= 3)
            {
                terms.Add(piece.ToLowerInvariant());
            }
        }

        return terms;
    }

    private static int CountOccurrences(string text, string term)
    {
        var count = 0;
        var index = 0;
        while (true)
        {
            index = text.IndexOf(term, index, StringComparison.OrdinalIgnoreCase);
            if (index < 0)
            {
                return count;
            }

            count++;
            index += term.Length;
        }
    }

    private static string TrimForSnippet(string value, int maxLen)
    {
        if (value.Length <= maxLen)
        {
            return value;
        }

        return $"{value[..(maxLen - 3)].TrimEnd()}...";
    }

    private static bool ContainsAny(string text, params string[] terms)
    {
        return terms.Any(term => text.Contains(term, StringComparison.OrdinalIgnoreCase));
    }

    public sealed record ChatRequest(IReadOnlyList<ChatMessageRequest>? Messages);
    public sealed record ChatMessageRequest(string? Role, string? Text);
    public sealed record ChatMessagePayload(string Role, string Text);
    public sealed record ChatSource(string Title, string Route, string Snippet);
    public sealed record ChatResponse(string Answer, IReadOnlyList<ChatSource> Sources);

    private sealed record KnowledgeDocument(string Id, string Title, string Route, string Content);
}
