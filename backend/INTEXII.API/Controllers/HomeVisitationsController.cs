using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/home-visitations")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class HomeVisitationsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public HomeVisitationsController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? residentId = null,
        [FromQuery] string? visitType = null,
        [FromQuery] bool? safetyConcern = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.HomeVisitations
            .AsNoTracking()
            .Include(v => v.Resident)
            .AsQueryable();

        if (residentId.HasValue)
            query = query.Where(v => v.ResidentId == residentId.Value);

        if (!string.IsNullOrWhiteSpace(visitType))
            query = query.Where(v => v.VisitType != null &&
                v.VisitType.ToLower() == visitType.Trim().ToLower());

        if (safetyConcern.HasValue)
            query = query.Where(v => v.SafetyConcernsNoted == safetyConcern.Value);

        var all = await query.OrderByDescending(v => v.VisitDate).ToListAsync();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            all = all.Where(v =>
                ContainsIgnoreCase(v.SocialWorker, term) ||
                ContainsIgnoreCase(v.Purpose, term) ||
                ContainsIgnoreCase(v.Observations, term) ||
                ContainsIgnoreCase(BuildResidentName(v.Resident), term)).ToList();
        }

        var total = all.Count;
        var items = all
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(MapToListDto)
            .ToArray();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var visit = await _db.HomeVisitations
            .AsNoTracking()
            .Include(v => v.Resident)
            .FirstOrDefaultAsync(v => v.VisitationId == id);

        if (visit is null) return NotFound();

        return Ok(MapToDetailDto(visit));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HomeVisitationUpsertRequest req)
    {
        var nextId = (await _db.HomeVisitations.MaxAsync(v => (int?)v.VisitationId) ?? 0) + 1;

        var visit = new HomeVisitation
        {
            VisitationId = nextId,
            ResidentId = req.ResidentId,
            VisitDate = req.VisitDate,
            SocialWorker = req.SocialWorker?.Trim(),
            VisitType = req.VisitType?.Trim(),
            LocationVisited = req.LocationVisited?.Trim(),
            Purpose = req.Purpose?.Trim(),
            Observations = req.Observations?.Trim(),
            FamilyCooperationLevel = req.FamilyCooperationLevel?.Trim(),
            SafetyConcernsNoted = req.SafetyConcernsNoted,
            FollowUpNeeded = req.FollowUpNeeded,
            FollowUpNotes = req.FollowUpNotes?.Trim(),
            VisitOutcome = req.VisitOutcome?.Trim(),
        };

        _db.HomeVisitations.Add(visit);
        await _db.SaveChangesAsync();

        var created = await _db.HomeVisitations
            .AsNoTracking()
            .Include(v => v.Resident)
            .FirstAsync(v => v.VisitationId == nextId);

        return CreatedAtAction(nameof(GetById), new { id = nextId }, MapToDetailDto(created));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] HomeVisitationUpsertRequest req)
    {
        var visit = await _db.HomeVisitations.FindAsync(id);
        if (visit is null) return NotFound();

        visit.ResidentId = req.ResidentId;
        visit.VisitDate = req.VisitDate;
        visit.SocialWorker = req.SocialWorker?.Trim();
        visit.VisitType = req.VisitType?.Trim();
        visit.LocationVisited = req.LocationVisited?.Trim();
        visit.Purpose = req.Purpose?.Trim();
        visit.Observations = req.Observations?.Trim();
        visit.FamilyCooperationLevel = req.FamilyCooperationLevel?.Trim();
        visit.SafetyConcernsNoted = req.SafetyConcernsNoted;
        visit.FollowUpNeeded = req.FollowUpNeeded;
        visit.FollowUpNotes = req.FollowUpNotes?.Trim();
        visit.VisitOutcome = req.VisitOutcome?.Trim();

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var visit = await _db.HomeVisitations.FindAsync(id);
        if (visit is null) return NotFound();

        _db.HomeVisitations.Remove(visit);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static HomeVisitationListDto MapToListDto(HomeVisitation v) => new(
        v.VisitationId,
        v.ResidentId,
        BuildResidentName(v.Resident),
        v.VisitDate?.ToString("yyyy-MM-dd"),
        v.SocialWorker,
        v.VisitType,
        v.SafetyConcernsNoted ?? false,
        v.FollowUpNeeded ?? false,
        v.VisitOutcome);

    private static HomeVisitationDetailDto MapToDetailDto(HomeVisitation v) => new(
        v.VisitationId,
        v.ResidentId,
        BuildResidentName(v.Resident),
        v.VisitDate?.ToString("yyyy-MM-dd"),
        v.SocialWorker,
        v.VisitType,
        v.LocationVisited,
        v.Purpose,
        v.Observations,
        v.FamilyCooperationLevel,
        v.SafetyConcernsNoted ?? false,
        v.FollowUpNeeded ?? false,
        v.FollowUpNotes,
        v.VisitOutcome);

    private static string BuildResidentName(Resident? r) =>
        r?.InternalCode ?? (r is null ? "Unknown" : $"Resident #{r.ResidentId}");

    private static bool ContainsIgnoreCase(string? value, string term) =>
        !string.IsNullOrWhiteSpace(value) &&
        value.Contains(term, StringComparison.OrdinalIgnoreCase);

    // ── DTOs ────────────────────────────────────────────────────────────────

    private sealed record HomeVisitationListDto(
        int Id,
        int? ResidentId,
        string ResidentName,
        string? VisitDate,
        string? SocialWorker,
        string? VisitType,
        bool SafetyConcernsNoted,
        bool FollowUpNeeded,
        string? VisitOutcome);

    private sealed record HomeVisitationDetailDto(
        int Id,
        int? ResidentId,
        string ResidentName,
        string? VisitDate,
        string? SocialWorker,
        string? VisitType,
        string? LocationVisited,
        string? Purpose,
        string? Observations,
        string? FamilyCooperationLevel,
        bool SafetyConcernsNoted,
        bool FollowUpNeeded,
        string? FollowUpNotes,
        string? VisitOutcome);

    public sealed record HomeVisitationUpsertRequest(
        int? ResidentId,
        DateOnly? VisitDate,
        string? SocialWorker,
        string? VisitType,
        string? LocationVisited,
        string? Purpose,
        string? Observations,
        string? FamilyCooperationLevel,
        bool? SafetyConcernsNoted,
        bool? FollowUpNeeded,
        string? FollowUpNotes,
        string? VisitOutcome);
}
