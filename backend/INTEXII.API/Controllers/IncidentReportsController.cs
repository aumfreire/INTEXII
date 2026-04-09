using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/incident-reports")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class IncidentReportsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public IncidentReportsController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? residentId = null,
        [FromQuery] int? safehouseId = null,
        [FromQuery] bool? resolved = null,
        [FromQuery] string? severity = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.IncidentReports
            .AsNoTracking()
            .Include(i => i.Resident)
            .Include(i => i.Safehouse)
            .AsQueryable();

        if (residentId.HasValue)
            query = query.Where(i => i.ResidentId == residentId.Value);

        if (safehouseId.HasValue)
            query = query.Where(i => i.SafehouseId == safehouseId.Value);

        if (resolved.HasValue)
            query = query.Where(i => i.Resolved == resolved.Value);

        if (!string.IsNullOrWhiteSpace(severity))
            query = query.Where(i => i.Severity != null && i.Severity.ToLower() == severity.Trim().ToLower());

        var all = await query
            .OrderByDescending(i => i.IncidentDate)
            .ThenByDescending(i => i.IncidentId)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            all = all.Where(i =>
                ContainsIgnoreCase(i.IncidentType, term) ||
                ContainsIgnoreCase(i.Description, term) ||
                ContainsIgnoreCase(i.ReportedBy, term) ||
                ContainsIgnoreCase(BuildResidentName(i.Resident), term) ||
                ContainsIgnoreCase(i.Safehouse?.Name, term)).ToList();
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
        var incident = await _db.IncidentReports
            .AsNoTracking()
            .Include(i => i.Resident)
            .Include(i => i.Safehouse)
            .FirstOrDefaultAsync(i => i.IncidentId == id);

        if (incident is null) return NotFound();

        return Ok(MapToDetailDto(incident));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] IncidentReportUpsertRequest req)
    {
        var nextId = (await _db.IncidentReports.MaxAsync(i => (int?)i.IncidentId) ?? 0) + 1;

        var incident = new IncidentReport
        {
            IncidentId = nextId,
            ResidentId = req.ResidentId,
            SafehouseId = req.SafehouseId,
            IncidentDate = req.IncidentDate,
            IncidentType = req.IncidentType?.Trim(),
            Severity = req.Severity?.Trim(),
            Description = req.Description?.Trim(),
            ResponseTaken = req.ResponseTaken?.Trim(),
            Resolved = req.Resolved,
            ResolutionDate = req.ResolutionDate,
            ReportedBy = req.ReportedBy?.Trim(),
            FollowUpRequired = req.FollowUpRequired,
        };

        _db.IncidentReports.Add(incident);
        await _db.SaveChangesAsync();

        var created = await _db.IncidentReports
            .AsNoTracking()
            .Include(i => i.Resident)
            .Include(i => i.Safehouse)
            .FirstAsync(i => i.IncidentId == nextId);

        return CreatedAtAction(nameof(GetById), new { id = nextId }, MapToDetailDto(created));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] IncidentReportUpsertRequest req)
    {
        var incident = await _db.IncidentReports.FindAsync(id);
        if (incident is null) return NotFound();

        incident.ResidentId = req.ResidentId;
        incident.SafehouseId = req.SafehouseId;
        incident.IncidentDate = req.IncidentDate;
        incident.IncidentType = req.IncidentType?.Trim();
        incident.Severity = req.Severity?.Trim();
        incident.Description = req.Description?.Trim();
        incident.ResponseTaken = req.ResponseTaken?.Trim();
        incident.Resolved = req.Resolved;
        incident.ResolutionDate = req.ResolutionDate;
        incident.ReportedBy = req.ReportedBy?.Trim();
        incident.FollowUpRequired = req.FollowUpRequired;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> CloseIncident(int id)
    {
        var incident = await _db.IncidentReports.FindAsync(id);
        if (incident is null) return NotFound();

        // Sensitive operational records should be closed, not destructively deleted.
        incident.Resolved = true;
        incident.FollowUpRequired = false;
        incident.ResolutionDate ??= DateOnly.FromDateTime(DateTime.UtcNow);

        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static IncidentListDto MapToListDto(IncidentReport i) => new(
        i.IncidentId,
        i.ResidentId,
        BuildResidentName(i.Resident),
        i.SafehouseId,
        i.Safehouse?.Name,
        i.IncidentDate?.ToString("yyyy-MM-dd"),
        i.IncidentType,
        i.Severity,
        i.Resolved ?? false,
        i.FollowUpRequired ?? false,
        i.ReportedBy);

    private static IncidentDetailDto MapToDetailDto(IncidentReport i) => new(
        i.IncidentId,
        i.ResidentId,
        BuildResidentName(i.Resident),
        i.SafehouseId,
        i.Safehouse?.Name,
        i.IncidentDate?.ToString("yyyy-MM-dd"),
        i.IncidentType,
        i.Severity,
        i.Description,
        i.ResponseTaken,
        i.Resolved ?? false,
        i.ResolutionDate?.ToString("yyyy-MM-dd"),
        i.ReportedBy,
        i.FollowUpRequired ?? false);

    private static string BuildResidentName(Resident? resident) =>
        resident?.InternalCode ?? (resident is null ? "Unknown" : $"Resident #{resident.ResidentId}");

    private static bool ContainsIgnoreCase(string? value, string term) =>
        !string.IsNullOrWhiteSpace(value) && value.Contains(term, StringComparison.OrdinalIgnoreCase);

    private sealed record IncidentListDto(
        int Id,
        int? ResidentId,
        string ResidentName,
        int? SafehouseId,
        string? SafehouseName,
        string? IncidentDate,
        string? IncidentType,
        string? Severity,
        bool Resolved,
        bool FollowUpRequired,
        string? ReportedBy);

    private sealed record IncidentDetailDto(
        int Id,
        int? ResidentId,
        string ResidentName,
        int? SafehouseId,
        string? SafehouseName,
        string? IncidentDate,
        string? IncidentType,
        string? Severity,
        string? Description,
        string? ResponseTaken,
        bool Resolved,
        string? ResolutionDate,
        string? ReportedBy,
        bool FollowUpRequired);

    public sealed record IncidentReportUpsertRequest(
        int? ResidentId,
        int? SafehouseId,
        DateOnly? IncidentDate,
        string? IncidentType,
        string? Severity,
        string? Description,
        string? ResponseTaken,
        bool? Resolved,
        DateOnly? ResolutionDate,
        string? ReportedBy,
        bool? FollowUpRequired);
}
