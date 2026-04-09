using System.Text;
using System.Text.Json;
using System.Security.Claims;
using INTEXII.API.Data;
using Microsoft.AspNetCore.Authentication;
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
        "You are a warm and helpful assistant for Haven of Hope, a nonprofit organization in the Philippines that protects, supports, and empowers vulnerable girls including those who have been trafficked, abused, neglected, or abandoned. Answer questions about the organization, how to donate, what impact donations make, and how to get involved. Keep responses concise, compassionate, and encouraging. Keep responses short and to the point: usually 2-5 sentences total plus short bullets only when needed. Always guide potential donors toward taking action. Never provide or suggest external URLs; only reference internal website routes like /donate, /login, /signup, /#mission, /#impact, and /cookies. Ask one thoughtful follow-up question at the end of each response to help the user narrow or deepen their request. If the user query is broad or ambiguous, ask 1-2 clarifying questions before giving a detailed answer. Make responses highly actionable: include a short 'Next actions' section with 2-4 concrete, prioritized steps. For admin metrics or operations questions, include what to do next, who should own it (team/role), and a suggested timeframe. Proactively offer execution help when relevant, such as: 'Want me to build a campaign outline?' or 'Want me to draft donor emails?'";

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
        var resolvedPrincipal = await ResolvePrincipalAsync();
        var isAdmin = IsAdminUser(resolvedPrincipal);
        var roleAccessGuardrail = isAdmin
            ? "Access level: Admin. You may use provided admin insights from internal data to answer."
            : "Access level: Public/Donor. You must only use public website/general knowledge context provided. Never claim access to private or internal database records.";

        var dynamicInsights = isAdmin
            ? await BuildAdminInsightsAsync(latestUserMessage)
            : Array.Empty<KnowledgeDocument>();
        var allGroundingDocs = selectedKnowledge.Concat(dynamicInsights).ToArray();
        var groundingPrompt = BuildGroundingPrompt(allGroundingDocs);

        if (isAdmin && IsAdminMetricsIntent(latestUserMessage))
        {
            var directAnswer = BuildDirectAdminMetricsAnswer(dynamicInsights);
            var directSources = SelectRelevantSources(dynamicInsights, latestUserMessage).Select(d => new ChatSource(
                d.Title,
                d.Route,
                TrimForSnippet(d.Content, 160))).ToArray();
            var directPrompts = BuildFollowUpPrompts(latestUserMessage, isAdmin);
            return Ok(new ChatResponse(directAnswer, directSources, directPrompts));
        }

        var anthropicPayload = new
        {
            model = AnthropicModel,
            max_tokens = 320,
            system = $"{SystemPrompt}\n\n{roleAccessGuardrail}\n\nUse this grounded context when answering:\n{groundingPrompt}\n\nFor admin users: never say you lack access to live data when admin insights are present in context; summarize the provided metrics directly.\n\nIf needed information is missing, say so briefly and suggest a next step.",
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

            var sources = SelectRelevantSources(allGroundingDocs, latestUserMessage).Select(d => new ChatSource(
                d.Title,
                d.Route,
                TrimForSnippet(d.Content, 160))).ToArray();
            var followUpPrompts = BuildFollowUpPrompts(latestUserMessage, isAdmin);

            return Ok(new ChatResponse(answer, sources, followUpPrompts));
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
        int? donationCountSnapshot = null;
        int? recurringCountSnapshot = null;
        int? supporterCountSnapshot = null;
        int? activeSupportersSnapshot = null;
        int? residentCountSnapshot = null;
        int? safehouseCountSnapshot = null;
        // If intent matching misses, still provide a baseline admin snapshot.
        if (!includeDonations && !includeSupporters && !includeOperations)
        {
            includeDonations = true;
            includeSupporters = true;
            includeOperations = true;
        }

        if (includeDonations)
        {
            var donationCount = await _db.Donations.CountAsync();
            var totalAmount = await _db.Donations.SumAsync(d => d.Amount ?? 0m);
            var recurringCount = await _db.Donations.CountAsync(d => d.IsRecurring == true);
            donationCountSnapshot = donationCount;
            recurringCountSnapshot = recurringCount;

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
            supporterCountSnapshot = supporterCount;
            activeSupportersSnapshot = activeSupporters;

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
            residentCountSnapshot = residentCount;
            safehouseCountSnapshot = safehouseCount;

            docs.Add(new KnowledgeDocument(
                "admin-operations",
                "Admin Insights: Program Operations (Live DB)",
                "/admin",
                $"Residents tracked: {residentCount}. Safehouses tracked: {safehouseCount}."));
        }

        var actionItems = new List<string>();

        if (donationCountSnapshot.HasValue && recurringCountSnapshot.HasValue)
        {
            var total = donationCountSnapshot.Value;
            var recurring = recurringCountSnapshot.Value;
            var recurringRate = total == 0 ? 0m : (decimal)recurring / total;

            if (total == 0)
            {
                actionItems.Add("Launch a quick donor acquisition test this week (Owner: Fundraising).");
            }
            else if (recurringRate < 0.30m)
            {
                actionItems.Add($"Increase recurring conversion (current ~{recurringRate:P0}) by adding a monthly default and post-donation upsell (Owner: Growth/Product, Timeline: next 7 days).");
            }
        }

        if (supporterCountSnapshot.HasValue && activeSupportersSnapshot.HasValue && supporterCountSnapshot.Value > 0)
        {
            var activationRate = (decimal)activeSupportersSnapshot.Value / supporterCountSnapshot.Value;
            if (activationRate < 0.60m)
            {
                actionItems.Add($"Run a reactivation sequence for inactive supporters (active rate ~{activationRate:P0}) with segmented messaging (Owner: CRM/Marketing, Timeline: next 14 days).");
            }
        }

        if (residentCountSnapshot.HasValue && safehouseCountSnapshot.HasValue && safehouseCountSnapshot.Value > 0)
        {
            var residentsPerSafehouse = (decimal)residentCountSnapshot.Value / safehouseCountSnapshot.Value;
            if (residentsPerSafehouse > 20m)
            {
                actionItems.Add($"Review safehouse capacity and case allocation (current ~{residentsPerSafehouse:0.0} residents/safehouse) (Owner: Operations, Timeline: this week).");
            }
        }

        actionItems.Add("Set a weekly KPI review cadence and track 3 priorities only: recurring growth, activation rate, and program capacity (Owner: Admin Lead).");

        docs.Add(new KnowledgeDocument(
            "admin-actions",
            "Admin Insights: Recommended Next Actions (Live DB)",
            "/admin",
            string.Join("\n", actionItems.Select(item => $"- {item}"))));

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

    private static bool IsAdminMetricsIntent(string query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return false;
        }

        return ContainsAny(
            query,
            "metric", "metrics", "insight", "insights", "dashboard",
            "top", "summary", "summarize", "overview", "kpi", "kpis",
            "donation", "supporter", "resident", "safehouse", "trend");
    }

    private static IReadOnlyList<string> BuildFollowUpPrompts(string latestUserMessage, bool isAdmin)
    {
        if (isAdmin)
        {
            if (ContainsAny(latestUserMessage, "metric", "dashboard", "kpi", "top", "summary"))
            {
                return
                [
                    "Break this down by campaign",
                    "Show recurring vs one-time trend",
                    "What insight should we act on first?"
                ];
            }

            return
            [
                "Give me top metrics based on live data",
                "What changed in donations recently?",
                "Where should we drill down next?"
            ];
        }

        if (ContainsAny(latestUserMessage, "donate", "donation", "gift"))
        {
            return
            [
                "How do I choose the right donation amount?",
                "Can I make a monthly donation?",
                "Where does my donation go?"
            ];
        }

        if (ContainsAny(latestUserMessage, "help", "involved", "volunteer", "support"))
        {
            return
            [
                "What are the best ways to get involved?",
                "How does Haven support girls day-to-day?",
                "What impact can a first donation make?"
            ];
        }

        return
        [
            "How can I donate right now?",
            "What impact do donations make?",
            "How can I get involved beyond giving?"
        ];
    }

    private static string BuildDirectAdminMetricsAnswer(IReadOnlyList<KnowledgeDocument> dynamicInsights)
    {
        var donations = dynamicInsights.FirstOrDefault(d => d.Id == "admin-donations")?.Content;
        var supporters = dynamicInsights.FirstOrDefault(d => d.Id == "admin-supporters")?.Content;
        var operations = dynamicInsights.FirstOrDefault(d => d.Id == "admin-operations")?.Content;
        var actions = dynamicInsights.FirstOrDefault(d => d.Id == "admin-actions")?.Content;

        var lines = new List<string>
        {
            "Here are the latest admin metrics from the live database:"
        };

        if (!string.IsNullOrWhiteSpace(donations))
        {
            lines.Add($"- Donations: {donations}");
        }

        if (!string.IsNullOrWhiteSpace(supporters))
        {
            lines.Add($"- Supporters: {supporters}");
        }

        if (!string.IsNullOrWhiteSpace(operations))
        {
            lines.Add($"- Operations: {operations}");
        }

        if (!string.IsNullOrWhiteSpace(actions))
        {
            lines.Add("");
            lines.Add("Recommended next actions:");
            lines.Add(actions);
        }

        lines.Add("");
        lines.Add("Want me to build a campaign outline, draft donor emails, or create a weekly KPI check-in template from this data?");
        lines.Add("");
        lines.Add("Ask for a focused cut next (e.g., campaign breakdown, recurring trend changes, or supporter growth by segment).");
        return string.Join("\n", lines);
    }

    private static IReadOnlyList<KnowledgeDocument> SelectRelevantSources(IReadOnlyList<KnowledgeDocument> documents, string query)
    {
        if (documents.Count == 0)
        {
            return Array.Empty<KnowledgeDocument>();
        }

        var queryTerms = Tokenize(query);
        if (queryTerms.Count == 0)
        {
            return documents.Take(1).ToArray();
        }

        var ranked = documents
            .Select(doc => new
            {
                Doc = doc,
                Score = queryTerms.Sum(term =>
                    CountOccurrences(doc.Title, term) * 3 +
                    CountOccurrences(doc.Content, term))
            })
            .OrderByDescending(x => x.Score)
            .ThenBy(x => x.Doc.Title)
            .ToList();

        var withMatches = ranked.Where(x => x.Score > 0).Take(2).Select(x => x.Doc).ToArray();
        if (withMatches.Length > 0)
        {
            return withMatches;
        }

        // No strong relevance signal; avoid noisy link lists.
        return Array.Empty<KnowledgeDocument>();
    }

    private static bool IsAdminUser(ClaimsPrincipal user)
    {
        if (user.IsInRole(AuthRoles.Admin))
        {
            return true;
        }

        return user.Claims.Any(claim =>
            (claim.Type == ClaimTypes.Role
             || claim.Type.Equals("role", StringComparison.OrdinalIgnoreCase)
             || claim.Type.EndsWith("/claims/role", StringComparison.OrdinalIgnoreCase))
            && claim.Value.Equals(AuthRoles.Admin, StringComparison.OrdinalIgnoreCase));
    }

    private async Task<ClaimsPrincipal> ResolvePrincipalAsync()
    {
        if (User?.Identity?.IsAuthenticated == true)
        {
            return User;
        }

        var authResult = await HttpContext.AuthenticateAsync("JwtOrCookie");
        if (authResult.Succeeded && authResult.Principal is not null)
        {
            return authResult.Principal;
        }

        return User ?? new ClaimsPrincipal(new ClaimsIdentity());
    }

    public sealed record ChatRequest(IReadOnlyList<ChatMessageRequest>? Messages);
    public sealed record ChatMessageRequest(string? Role, string? Text);
    public sealed record ChatMessagePayload(string Role, string Text);
    public sealed record ChatSource(string Title, string Route, string Snippet);
    public sealed record ChatResponse(string Answer, IReadOnlyList<ChatSource> Sources, IReadOnlyList<string> FollowUpPrompts);

    private sealed record KnowledgeDocument(string Id, string Title, string Route, string Content);
}
