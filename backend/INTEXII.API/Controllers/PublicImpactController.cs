using INTEXII.API.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/public")]
public class PublicImpactController : ControllerBase
{
    private readonly IntexDbContext _db;

    public PublicImpactController(IntexDbContext db)
    {
        _db = db;
    }

    /// <summary>Anonymized aggregate stats for the public impact page.</summary>
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
    {
        var residents = await _db.Residents.AsNoTracking().ToListAsync();
        var donations = await _db.Donations.AsNoTracking().ToListAsync();
        var safehouses = await _db.Safehouses.AsNoTracking().ToListAsync();
        var supporters = await _db.Supporters.AsNoTracking().ToListAsync();

        var totalServed = residents.Count;
        var activeResidents = residents.Count(r =>
            NormalizeStatus(r.CaseStatus) is "active" or "intake" or "reintegration");
        var reintegrated = residents.Count(r =>
            NormalizeStatus(r.CaseStatus) == "closed" ||
            (r.ReintegrationStatus?.ToLower() is "completed" or "reintegrated"));
        var activeSafehouses = safehouses.Count(s => NormalizeStatus(s.Status) == "active");
        var totalDonations = donations.Sum(d => d.Amount ?? 0m);
        var totalDonors = supporters.Count(s => NormalizeStatus(s.Status) == "active");

        // Program area stats (anonymized)
        var traffickingCount = residents.Count(r => r.SubCatTrafficked == true);
        var abuseCount = residents.Count(r =>
            r.SubCatPhysicalAbuse == true || r.SubCatSexualAbuse == true);
        var neglectCount = residents.Count(r =>
            NormalizeCategory(r.CaseCategory) == "neglect");

        return Ok(new
        {
            totalServed,
            activeResidents,
            reintegrated,
            activeSafehouses,
            totalDonations,
            totalDonors,
            programStats = new[]
            {
                new { label = "Trafficking Survivors", count = traffickingCount },
                new { label = "Abuse Survivors", count = abuseCount },
                new { label = "Neglect Cases", count = neglectCount },
            },
        });
    }

    private static string NormalizeStatus(string? v) =>
        v?.Trim().ToLowerInvariant() switch
        {
            "active" => "active",
            "intake" => "intake",
            "reintegration" => "reintegration",
            "closed" => "closed",
            _ => "active",
        };

    private static string NormalizeCategory(string? v) =>
        v?.Trim().ToLowerInvariant() switch
        {
            "neglect" or "neglected" => "neglect",
            _ => v?.ToLower() ?? "",
        };
}
