using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;

namespace INTEXII.API.Controllers;

// VIDEO NOTE: Show that hitting GET /api/residents without a cookie returns 401.
// After logging in as Admin, show that it returns 200.
// Show that a Donor user gets 403 on this endpoint.
[ApiController]
[Route("api/residents")]
[Authorize]
public class ResidentsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public ResidentsController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet("caseload")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetCaseload()
    {
        var residents = await _db.Residents
            .AsNoTracking()
            .Include(r => r.Safehouse)
            .OrderBy(r => r.ResidentId)
            .ToListAsync();

        var result = residents.Select(MapCaseloadResident).ToArray();
        return Ok(result);
    }

    [HttpGet("{id:int}/detail")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetDetail(int id)
    {
        var resident = await _db.Residents
            .AsNoTracking()
            .Include(r => r.Safehouse)
            .Include(r => r.ProcessRecordings)
            .Include(r => r.HomeVisitations)
            .Include(r => r.InterventionPlans)
            .FirstOrDefaultAsync(r => r.ResidentId == id);

        if (resident is null)
        {
            return NotFound();
        }

        var detail = new ResidentDetailDto(
            resident.ResidentId,
            BuildResidentDisplayName(resident),
            BuildResidentInitials(resident),
            resident.InternalCode ?? $"HFG-{resident.ResidentId:0000}",
            resident.CaseControlNo,
            resident.Safehouse?.Name ?? "Unassigned",
            NormalizeCaseStatus(resident.CaseStatus),
            NormalizeRiskLevel(resident.CurrentRiskLevel ?? resident.InitialRiskLevel),
            resident.AssignedSocialWorker,
            NormalizeCaseCategory(resident.CaseCategory),
            resident.CaseCategory,
            resident.DateOfAdmission,
            resident.DateOfBirth,
            ParseAge(resident.PresentAge, resident.DateOfBirth),
            resident.Sex,
            resident.PlaceOfBirth,
            resident.InitialCaseAssessment,
            resident.ReferralSource,
            resident.ReferringAgencyPerson,
            resident.DateColbRegistered,
            resident.BirthStatus,
            resident.PresentAge,
            resident.ReferringAgencyPerson,
            resident.ReintegrationType,
            NormalizeReintegrationStatus(resident.ReintegrationStatus),
            resident.NotesRestricted,
            resident.ProcessRecordings
                .OrderByDescending(p => p.SessionDate)
                .Select(p => new ProcessRecordingDto(
                    p.RecordingId,
                    p.SessionDate,
                    p.SocialWorker,
                    p.SessionType,
                    p.EmotionalStateObserved,
                    p.EmotionalStateEnd,
                    p.ProgressNoted ?? false,
                    p.ConcernsFlagged ?? false,
                    p.ReferralMade ?? false,
                    p.SessionNarrative ?? p.NotesRestricted ?? string.Empty))
                .ToArray(),
            resident.HomeVisitations
                .OrderByDescending(v => v.VisitDate)
                .Select(v => new HomeVisitationDto(
                    v.VisitationId,
                    v.VisitDate,
                    v.VisitType,
                    v.SocialWorker,
                    v.FamilyCooperationLevel,
                    v.SafetyConcernsNoted ?? false,
                    v.FollowUpNeeded ?? false,
                    v.Observations ?? v.FollowUpNotes ?? string.Empty))
                .ToArray(),
            resident.InterventionPlans
                .Where(p => p.CaseConferenceDate.HasValue)
                .OrderByDescending(p => p.CaseConferenceDate)
                .Select(p => new CaseConferenceDto(
                    p.PlanId,
                    p.CaseConferenceDate,
                    p.Status != null && p.Status.Equals("upcoming", StringComparison.OrdinalIgnoreCase),
                    p.ServicesProvided,
                    p.PlanDescription))
                .ToArray(),
            resident.InterventionPlans
                .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
                .Select(p => new ReintegrationInterventionDto(
                    p.PlanId,
                    p.PlanCategory,
                    p.PlanDescription,
                    p.ServicesProvided,
                    p.TargetDate,
                    p.Status))
                .ToArray());

        return Ok(detail);
    }

    /// <summary>
    /// Returns all resident case records. Admin only (sensitive case data).
    /// </summary>
    [HttpGet]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetAll()
    {
        var residents = await _db.Residents
            .OrderBy(r => r.ResidentId)
            .ToListAsync();
        return Ok(residents);
    }

    /// <summary>
    /// Returns a single resident by ID. Admin only.
    /// </summary>
    [HttpGet("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetById(int id)
    {
        var resident = await _db.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        return Ok(resident);
    }

    /// <summary>
    /// Creates a new resident record. Admin only.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Create([FromBody] Resident resident)
    {
        _db.Residents.Add(resident);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = resident.ResidentId }, resident);
    }

    /// <summary>
    /// Updates a resident record. Admin only.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Update(int id, [FromBody] Resident resident)
    {
        if (id != resident.ResidentId) return BadRequest();
        _db.Entry(resident).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Deletes a resident record. Admin only.
    /// Frontend must show a confirmation dialog before calling this endpoint.
    /// VIDEO NOTE: Show the confirmation dialog in the UI before this is called.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Delete(int id)
    {
        var resident = await _db.Residents.FindAsync(id);
        if (resident == null) return NotFound();
        _db.Residents.Remove(resident);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static CaseloadResidentDto MapCaseloadResident(Resident resident)
    {
        return new CaseloadResidentDto(
            resident.ResidentId,
            BuildResidentDisplayName(resident),
            resident.InternalCode ?? $"HFG-{resident.ResidentId:0000}",
            resident.Safehouse?.Name ?? "Unassigned",
            NormalizeCaseStatus(resident.CaseStatus),
            NormalizeCaseCategory(resident.CaseCategory),
            NormalizeRiskLevel(resident.CurrentRiskLevel ?? resident.InitialRiskLevel),
            resident.AssignedSocialWorker,
            NormalizeReintegrationStatus(resident.ReintegrationStatus),
            resident.CreatedAt?.Date ?? DateTime.UtcNow.Date);
    }

    private static string BuildResidentDisplayName(Resident resident)
    {
        if (!string.IsNullOrWhiteSpace(resident.InternalCode))
        {
            return resident.InternalCode;
        }

        if (!string.IsNullOrWhiteSpace(resident.CaseControlNo))
        {
            return resident.CaseControlNo;
        }

        return $"Resident #{resident.ResidentId}";
    }

    private static string BuildResidentInitials(Resident resident)
    {
        var name = BuildResidentDisplayName(resident);
        var letters = name
            .Split(' ', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part[0])
            .Take(2)
            .ToArray();

        return letters.Length == 0 ? "R" : new string(letters).ToUpperInvariant();
    }

    private static string NormalizeCaseStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return "active";
        }

        return status.Trim().ToLowerInvariant() switch
        {
            "transferred" => "reintegration",
            _ => status.Trim().ToLowerInvariant()
        };
    }

    private static string NormalizeCaseCategory(string? category)
    {
        if (string.IsNullOrWhiteSpace(category))
        {
            return "neglect";
        }

        return category.Trim().ToLowerInvariant() switch
        {
            "surrendered" => "abandonment",
            "foundling" => "abandonment",
            _ => category.Trim().ToLowerInvariant()
        };
    }

    private static string NormalizeRiskLevel(string? level)
    {
        if (string.IsNullOrWhiteSpace(level))
        {
            return "moderate";
        }

        return level.Trim().ToLowerInvariant() switch
        {
            "medium" => "moderate",
            _ => level.Trim().ToLowerInvariant()
        };
    }

    private static string NormalizeReintegrationStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return "not-started";
        }

        return status.Trim().ToLowerInvariant() switch
        {
            "completed" => "ready",
            "not started" => "not-started",
            "in progress" => "in-progress",
            _ => status.Trim().ToLowerInvariant().Replace(' ', '-')
        };
    }

    private static int? ParseAge(string? presentAge, DateOnly? dateOfBirth)
    {
        if (!string.IsNullOrWhiteSpace(presentAge))
        {
            var digits = new string(presentAge.Where(char.IsDigit).ToArray());
            if (int.TryParse(digits, out var parsedAge))
            {
                return parsedAge;
            }
        }

        if (!dateOfBirth.HasValue)
        {
            return null;
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var age = today.Year - dateOfBirth.Value.Year;
        if (today < dateOfBirth.Value.AddYears(age))
        {
            age--;
        }

        return age;
    }

    private sealed record CaseloadResidentDto(
        int Id,
        string Name,
        string Code,
        string Safehouse,
        string CaseStatus,
        string CaseCategory,
        string RiskLevel,
        string? AssignedWorker,
        string ReintegrationStatus,
        DateTime LastUpdate);

    private sealed record ProcessRecordingDto(
        int Id,
        DateOnly? Date,
        string? Worker,
        string? SessionType,
        string? EmotionStart,
        string? EmotionEnd,
        bool ProgressNoted,
        bool ConcernFlagged,
        bool ReferralMade,
        string Summary);

    private sealed record HomeVisitationDto(
        int Id,
        DateOnly? Date,
        string? Type,
        string? Worker,
        string? Cooperation,
        bool SafetyConcern,
        bool FollowUpNeeded,
        string Notes);

    private sealed record CaseConferenceDto(
        int Id,
        DateOnly? Date,
        bool Upcoming,
        string? Attendees,
        string? Notes);

    private sealed record ReintegrationInterventionDto(
        int Id,
        string? Category,
        string? Description,
        string? Services,
        DateOnly? TargetDate,
        string? Status);

    private sealed record ResidentDetailDto(
        int Id,
        string Name,
        string Initials,
        string Code,
        string? CaseControlNumber,
        string Safehouse,
        string CaseStatus,
        string RiskLevel,
        string? AssignedWorker,
        string CaseCategory,
        string? CaseSubCategory,
        DateOnly? AdmissionDate,
        DateOnly? DateOfBirth,
        int? Age,
        string? Gender,
        string? Nationality,
        string? Education,
        string? ReferralSource,
        string? ReferralOfficer,
        DateOnly? ReferralDate,
        string? FamilyStatus,
        string? Siblings,
        string? FamilyContact,
        string? ReintegrationType,
        string ReintegrationStatus,
        string? NotesRestricted,
        IReadOnlyList<ProcessRecordingDto> Recordings,
        IReadOnlyList<HomeVisitationDto> Visits,
        IReadOnlyList<CaseConferenceDto> Conferences,
        IReadOnlyList<ReintegrationInterventionDto> ReintegrationInterventions);
}
