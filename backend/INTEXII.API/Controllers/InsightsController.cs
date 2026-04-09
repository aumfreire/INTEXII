using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/insights")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class InsightsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public InsightsController(IntexDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns donor lapse risk predictions with phone numbers joined from supporters.
    /// Sorted High → Medium → Low risk.
    /// </summary>
    [HttpGet("donor-lapse")]
    public async Task<IActionResult> GetDonorLapse()
    {
        var predictions = await _db.MlDonorLapsePredictions.AsNoTracking().ToListAsync();

        if (!predictions.Any())
            return Ok(new { runDate = (string?)null, data = Array.Empty<object>() });

        // Join phone numbers from the supporters table
        var supporterIds = predictions.Select(p => p.SupporterId).Distinct().ToList();
        var phones = await _db.Supporters
            .Where(s => supporterIds.Contains(s.SupporterId))
            .Select(s => new { s.SupporterId, s.Phone })
            .ToDictionaryAsync(s => s.SupporterId, s => s.Phone);

        var tierOrder = new Dictionary<string, int>
        {
            { "High", 0 }, { "Medium", 1 }, { "Low", 2 }
        };

        var data = predictions
            .OrderBy(p => tierOrder.GetValueOrDefault(p.RiskTier ?? "Low", 2))
            .Select(p => new
            {
                p.SupporterId,
                p.DisplayName,
                p.Email,
                Phone = phones.GetValueOrDefault(p.SupporterId),
                p.SupporterType,
                p.RelationshipType,
                p.Region,
                p.Country,
                p.SnapshotDate,
                p.LapseRiskScore,
                p.RiskTier,
                p.RecencyDays,
                p.Frequency,
                p.ValueSum,
                p.TopChannelSource,
                p.TopDonationType,
            })
            .ToList();

        return Ok(new
        {
            runDate = predictions.FirstOrDefault()?.RunDate,
            data
        });
    }

    /// <summary>
    /// Returns safehouse health forecast predictions.
    /// Sorted Alert → Watch → Stable.
    /// </summary>
    [HttpGet("safehouse-health")]
    public async Task<IActionResult> GetSafehouseHealth()
    {
        var predictions = await _db.MlSafehouseHealthPredictions.AsNoTracking().ToListAsync();

        if (!predictions.Any())
            return Ok(new { runDate = (string?)null, data = Array.Empty<object>() });

        var tierOrder = new Dictionary<string, int>
        {
            { "Alert", 0 }, { "Watch", 1 }, { "Stable", 2 }
        };

        var data = predictions
            .OrderBy(p => tierOrder.GetValueOrDefault(p.AlertTier ?? "Stable", 2))
            .Select(p => new
            {
                p.SafehouseId,
                p.SafehouseCode,
                p.Name,
                p.Region,
                p.MonthStart,
                p.PredAvgEducationProgress,
                p.PredAvgHealthScore,
                p.PredIncidentCount,
                p.AlertTier,
            })
            .ToList();

        return Ok(new
        {
            runDate = predictions.FirstOrDefault()?.RunDate,
            data
        });
    }

    /// <summary>
    /// Returns resident 30-day risk predictions.
    /// Sorted High → Medium → Low overall risk.
    /// </summary>
    [HttpGet("resident-risk")]
    public async Task<IActionResult> GetResidentRisk()
    {
        var predictions = await _db.MlResidentRiskPredictions.AsNoTracking().ToListAsync();

        if (!predictions.Any())
            return Ok(new { runDate = (string?)null, data = Array.Empty<object>() });

        var tierOrder = new Dictionary<string, int>
        {
            { "High", 0 }, { "Medium", 1 }, { "Low", 2 }
        };

        var data = predictions
            .OrderBy(p => tierOrder.GetValueOrDefault(p.OverallRisk ?? "Low", 2))
            .Select(p => new
            {
                p.ResidentId,
                p.CaseControlNo,
                p.InternalCode,
                p.SafehouseId,
                p.CaseCategory,
                p.CurrentRiskLevel,
                p.HealthRisk,
                p.HealthRiskReason,
                p.EducationRisk,
                p.EducationRiskReason,
                p.IncidentRisk,
                p.IncidentRiskReason,
                p.OverallRisk,
                p.LastHealthScore,
                p.LastAttendanceRate,
                p.LastProgressPercent,
                p.IncidentsLast30d,
                p.IncidentsLast90d,
                p.ActivePlanStatus,
                p.PlanTargetDate,
            })
            .ToList();

        return Ok(new
        {
            runDate = predictions.FirstOrDefault()?.RunDate,
            data
        });
    }

    /// <summary>
    /// Returns social media donor engagement predictions.
    /// Sorted High → Medium → Low engagement tier.
    /// </summary>
    [HttpGet("social-engagement")]
    public async Task<IActionResult> GetSocialEngagement()
    {
        var predictions = await _db.MlSocialEngagementPredictions.AsNoTracking().ToListAsync();

        if (!predictions.Any())
            return Ok(new { runDate = (string?)null, data = Array.Empty<object>() });

        // Join phone numbers from the supporters table
        var supporterIds = predictions.Select(p => p.SupporterId).Distinct().ToList();
        var phones = await _db.Supporters
            .Where(s => supporterIds.Contains(s.SupporterId))
            .Select(s => new { s.SupporterId, s.Phone })
            .ToDictionaryAsync(s => s.SupporterId, s => s.Phone);

        var tierOrder = new Dictionary<string, int>
        {
            { "High", 0 }, { "Medium", 1 }, { "Low", 2 }
        };

        var data = predictions
            .OrderBy(p => tierOrder.GetValueOrDefault(p.EngagementTier ?? "Low", 2))
            .Select(p => new
            {
                p.SupporterId,
                p.DisplayName,
                p.Email,
                Phone = phones.GetValueOrDefault(p.SupporterId),
                p.EngagementTier,
                p.EngagementProbability,
                p.SuggestedAction,
                p.RecencyDays,
                p.DonationFrequency,
                p.DonationValueSum,
                p.ReferralLinkedDonations,
                p.PreferredPlatform,
                p.PreferredTopic,
                p.AcquisitionChannel,
                p.SupporterType,
                p.Region,
                p.Country,
            })
            .ToList();

        return Ok(new
        {
            runDate = predictions.FirstOrDefault()?.RunDate,
            data
        });
    }
}
