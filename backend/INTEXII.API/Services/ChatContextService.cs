using System.Text;
using INTEXII.API.Data;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Services;

public sealed class ChatContextService
{
    private readonly IntexDbContext _db;

    public ChatContextService(IntexDbContext db)
    {
        _db = db;
    }

    public async Task<ChatContextResult> BuildContextAsync(string userQuestion, CancellationToken cancellationToken = default)
    {
        var intent = ClassifyIntent(userQuestion);
        var blocks = new List<string>();

        switch (intent)
        {
            case "donor_analysis":
                blocks.Add(await BuildDonorSummaryAsync(cancellationToken));
                break;
            case "case_management":
                blocks.Add(await BuildCaseSummaryAsync(cancellationToken));
                break;
            case "social_media":
                blocks.Add(await BuildSocialSummaryAsync(cancellationToken));
                break;
            case "safehouse_operations":
                blocks.Add(await BuildSafehouseSummaryAsync(cancellationToken));
                break;
            default:
                blocks.Add(await BuildDonorSummaryAsync(cancellationToken));
                blocks.Add(await BuildCaseSummaryAsync(cancellationToken));
                blocks.Add(await BuildSocialSummaryAsync(cancellationToken));
                blocks.Add(await BuildSafehouseSummaryAsync(cancellationToken));
                break;
        }

        return new ChatContextResult(intent, blocks.Where(b => !string.IsNullOrWhiteSpace(b)).ToArray());
    }

    private static string ClassifyIntent(string question)
    {
        if (ContainsAny(question, "donor", "donation", "campaign", "retention", "lapse", "fundraising"))
        {
            return "donor_analysis";
        }

        if (ContainsAny(question, "resident", "counsel", "health", "incident", "education", "risk"))
        {
            return "case_management";
        }

        if (ContainsAny(question, "social", "platform", "engagement", "reach", "post", "hashtag"))
        {
            return "social_media";
        }

        if (ContainsAny(question, "safehouse", "capacity", "occupancy", "partner", "operations"))
        {
            return "safehouse_operations";
        }

        return "cross_domain";
    }

    private async Task<string> BuildDonorSummaryAsync(CancellationToken cancellationToken)
    {
        var donationCount = await _db.Donations.CountAsync(cancellationToken);
        var totalAmount = await _db.Donations.SumAsync(d => d.Amount ?? 0m, cancellationToken);
        var recurringCount = await _db.Donations.CountAsync(d => d.IsRecurring == true, cancellationToken);

        var topCampaigns = await _db.Donations
            .AsNoTracking()
            .Where(d => d.CampaignName != null)
            .GroupBy(d => d.CampaignName!)
            .Select(g => new { Campaign = g.Key, Total = g.Sum(d => d.Amount ?? 0m), Count = g.Count() })
            .OrderByDescending(x => x.Total)
            .Take(5)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("--- Donor & Donation Summary ---");
        sb.AppendLine($"Total donations: {donationCount}");
        sb.AppendLine($"Total amount: {totalAmount:0.##}");
        sb.AppendLine($"Recurring donations: {recurringCount}");
        foreach (var row in topCampaigns)
        {
            sb.AppendLine($"Campaign {row.Campaign}: count={row.Count}, total={row.Total:0.##}");
        }

        return sb.ToString().Trim();
    }

    private async Task<string> BuildCaseSummaryAsync(CancellationToken cancellationToken)
    {
        var byRisk = await _db.Residents
            .AsNoTracking()
            .GroupBy(r => r.CurrentRiskLevel ?? "Unknown")
            .Select(g => new { Risk = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(cancellationToken);

        var incidents = await _db.IncidentReports
            .AsNoTracking()
            .GroupBy(i => i.Severity ?? "Unknown")
            .Select(g => new { Severity = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("--- Case Management Summary ---");
        foreach (var row in byRisk)
        {
            sb.AppendLine($"Risk {row.Risk}: {row.Count}");
        }
        foreach (var row in incidents)
        {
            sb.AppendLine($"Incident severity {row.Severity}: {row.Count}");
        }

        return sb.ToString().Trim();
    }

    private async Task<string> BuildSocialSummaryAsync(CancellationToken cancellationToken)
    {
        var byPlatform = await _db.SocialMediaPosts
            .AsNoTracking()
            .GroupBy(p => p.Platform ?? "Unknown")
            .Select(g => new
            {
                Platform = g.Key,
                Count = g.Count(),
                AvgEngagement = g.Average(p => p.EngagementRate ?? 0m),
                TotalReferrals = g.Sum(p => p.DonationReferrals ?? 0)
            })
            .OrderByDescending(x => x.TotalReferrals)
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("--- Social Media Summary ---");
        foreach (var row in byPlatform)
        {
            sb.AppendLine($"Platform {row.Platform}: posts={row.Count}, avgEngagement={row.AvgEngagement:0.##}, referrals={row.TotalReferrals}");
        }

        return sb.ToString().Trim();
    }

    private async Task<string> BuildSafehouseSummaryAsync(CancellationToken cancellationToken)
    {
        var safehouses = await _db.Safehouses
            .AsNoTracking()
            .Select(s => new
            {
                s.Name,
                s.Region,
                s.City,
                Capacity = s.CapacityGirls,
                Occupancy = s.CurrentOccupancy,
                s.Status
            })
            .ToListAsync(cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("--- Safehouse Operations Summary ---");
        foreach (var row in safehouses.Take(10))
        {
            sb.AppendLine($"{row.Name} ({row.Region}/{row.City}): capacity={row.Capacity}, occupancy={row.Occupancy}, status={row.Status}");
        }

        return sb.ToString().Trim();
    }

    private static bool ContainsAny(string input, params string[] terms)
        => terms.Any(term => input.Contains(term, StringComparison.OrdinalIgnoreCase));
}
