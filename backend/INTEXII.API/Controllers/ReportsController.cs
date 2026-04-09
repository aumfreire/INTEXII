using INTEXII.API.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class ReportsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public ReportsController(IntexDbContext db)
    {
        _db = db;
    }

    /// <summary>Combined summary stats for the admin dashboard widgets.</summary>
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var residents = await _db.Residents.AsNoTracking().ToListAsync();
        var donations = await _db.Donations.AsNoTracking().ToListAsync();
        var safehouses = await _db.Safehouses.AsNoTracking().ToListAsync();

        var activeResidents = residents.Count(r =>
            NormalizeStatus(r.CaseStatus) is "active" or "intake" or "reintegration");
        var intakeCount = residents.Count(r => NormalizeStatus(r.CaseStatus) == "intake");
        var reintegrationCount = residents.Count(r => NormalizeStatus(r.CaseStatus) == "reintegration");
        var highRiskCount = residents.Count(r =>
            NormalizeRisk(r.CurrentRiskLevel ?? r.InitialRiskLevel) is "high" or "critical");

        var activeSafehouses = safehouses.Count(s =>
            NormalizeStatus(s.Status) == "active");

        var now = DateTime.UtcNow;
        var monthAgo = now.AddDays(-30);
        var recentDonations = donations
            .Where(d => d.DonationDate.HasValue && d.DonationDate.Value.ToDateTime(TimeOnly.MinValue) >= monthAgo)
            .Sum(d => d.Amount ?? 0m);

        return Ok(new
        {
            activeResidents,
            intakeCount,
            reintegrationCount,
            highRiskCount,
            activeSafehouses,
            recentDonationsLast30Days = recentDonations,
            totalResidents = residents.Count,
            totalDonors = await _db.Supporters.AsNoTracking().CountAsync(),
        });
    }

    /// <summary>Monthly donation totals for the last 12 months.</summary>
    [HttpGet("donation-trends")]
    public async Task<IActionResult> GetDonationTrends()
    {
        var donations = await _db.Donations.AsNoTracking().ToListAsync();

        var now = DateTime.UtcNow;
        var results = Enumerable.Range(0, 12)
            .Select(i =>
            {
                var month = now.AddMonths(-11 + i);
                var label = month.ToString("MMM yyyy");
                var total = donations
                    .Where(d => d.DonationDate.HasValue &&
                                d.DonationDate.Value.Year == month.Year &&
                                d.DonationDate.Value.Month == month.Month)
                    .Sum(d => d.Amount ?? 0m);
                var count = donations
                    .Count(d => d.DonationDate.HasValue &&
                                d.DonationDate.Value.Year == month.Year &&
                                d.DonationDate.Value.Month == month.Month);
                return new { month = label, total, count };
            })
            .ToArray();

        return Ok(results);
    }

    /// <summary>Case status counts, risk distribution, and category breakdown.</summary>
    [HttpGet("resident-outcomes")]
    public async Task<IActionResult> GetResidentOutcomes()
    {
        var residents = await _db.Residents.AsNoTracking().ToListAsync();

        var statusCounts = residents
            .GroupBy(r => NormalizeStatus(r.CaseStatus))
            .Select(g => new { status = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToArray();

        var riskCounts = residents
            .GroupBy(r => NormalizeRisk(r.CurrentRiskLevel ?? r.InitialRiskLevel))
            .Select(g => new { risk = g.Key, count = g.Count() })
            .ToArray();

        var categoryCounts = residents
            .GroupBy(r => NormalizeCategory(r.CaseCategory))
            .Select(g => new { category = g.Key, count = g.Count() })
            .OrderByDescending(x => x.count)
            .ToArray();

        return Ok(new { statusCounts, riskCounts, categoryCounts });
    }

    /// <summary>Per-safehouse resident count vs capacity.</summary>
    [HttpGet("safehouse-metrics")]
    public async Task<IActionResult> GetSafehouseMetrics()
    {
        var safehouses = await _db.Safehouses
            .AsNoTracking()
            .Include(s => s.Residents)
            .ToListAsync();

        var metrics = safehouses.Select(s => new
        {
            id = s.SafehouseId,
            name = s.Name ?? $"Safehouse #{s.SafehouseId}",
            status = NormalizeStatus(s.Status),
            residentCount = s.Residents.Count(r => NormalizeStatus(r.CaseStatus) is "active" or "intake" or "reintegration"),
            capacity = s.CapacityGirls ?? 0,
            highRiskCount = s.Residents.Count(r =>
                NormalizeRisk(r.CurrentRiskLevel ?? r.InitialRiskLevel) is "high" or "critical"),
        }).ToArray();

        return Ok(metrics);
    }

    /// <summary>Reintegration status distribution.</summary>
    [HttpGet("reintegration-rates")]
    public async Task<IActionResult> GetReintegrationRates()
    {
        var residents = await _db.Residents.AsNoTracking().ToListAsync();

        var total = residents.Count;
        var reintegrated = residents.Count(r => NormalizeStatus(r.CaseStatus) == "closed" ||
            NormalizeReint(r.ReintegrationStatus) == "completed");
        var inProgress = residents.Count(r => NormalizeReint(r.ReintegrationStatus) == "in-progress");
        var ready = residents.Count(r => NormalizeReint(r.ReintegrationStatus) == "ready");
        var notStarted = residents.Count(r => NormalizeReint(r.ReintegrationStatus) == "not-started");

        var reintegrationTypeCounts = residents
            .Where(r => !string.IsNullOrWhiteSpace(r.ReintegrationType))
            .GroupBy(r => r.ReintegrationType!)
            .Select(g => new { type = g.Key, count = g.Count() })
            .ToArray();

        return Ok(new
        {
            total,
            reintegrated,
            inProgress,
            ready,
            notStarted,
            reintegrationTypeCounts,
            successRate = total > 0 ? Math.Round((double)reintegrated / total * 100, 1) : 0,
        });
    }

    // ── Normalizers ──────────────────────────────────────────────────────

    private static string NormalizeStatus(string? v) =>
        v?.Trim().ToLowerInvariant() switch
        {
            "active" => "active",
            "intake" => "intake",
            "reintegration" => "reintegration",
            "closed" => "closed",
            _ => "active",
        };

    private static string NormalizeRisk(string? v) =>
        v?.Trim().ToLowerInvariant() switch
        {
            "critical" => "critical",
            "high" => "high",
            "moderate" or "medium" => "moderate",
            "low" => "low",
            _ => "unknown",
        };

    private static string NormalizeCategory(string? v) =>
        v?.Trim().ToLowerInvariant() switch
        {
            "trafficking" or "trafficked" => "Trafficking",
            "abuse" or "physical abuse" or "sexual abuse" => "Abuse",
            "neglect" or "neglected" => "Neglect",
            "abandonment" or "abandoned" => "Abandonment",
            "runaway" => "Runaway",
            _ when !string.IsNullOrWhiteSpace(v) => v!,
            _ => "Unspecified",
        };

    private static string NormalizeReint(string? v) =>
        v?.Trim().ToLowerInvariant() switch
        {
            "completed" or "reintegrated" => "completed",
            "in-progress" or "in progress" or "inprogress" => "in-progress",
            "ready" => "ready",
            _ => "not-started",
        };
}
