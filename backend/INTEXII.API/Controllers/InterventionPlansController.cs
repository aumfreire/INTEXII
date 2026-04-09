using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/intervention-plans")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class InterventionPlansController : ControllerBase
{
    private readonly IntexDbContext _db;

    public InterventionPlansController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? residentId = null,
        [FromQuery] string? status = null,
        [FromQuery] bool? hasConference = null)
    {
        var query = _db.InterventionPlans
            .AsNoTracking()
            .Include(p => p.Resident)
            .AsQueryable();

        if (residentId.HasValue)
            query = query.Where(p => p.ResidentId == residentId.Value);

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(p => p.Status != null &&
                p.Status.ToLower() == status.Trim().ToLower());

        if (hasConference.HasValue)
        {
            if (hasConference.Value)
                query = query.Where(p => p.CaseConferenceDate.HasValue);
            else
                query = query.Where(p => !p.CaseConferenceDate.HasValue);
        }

        var plans = await query
            .OrderByDescending(p => p.UpdatedAt ?? p.CreatedAt)
            .ToListAsync();

        return Ok(plans.Select(MapToDto).ToArray());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var plan = await _db.InterventionPlans
            .AsNoTracking()
            .Include(p => p.Resident)
            .FirstOrDefaultAsync(p => p.PlanId == id);

        if (plan is null) return NotFound();

        return Ok(MapToDto(plan));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] InterventionPlanUpsertRequest req)
    {
        var nextId = (await _db.InterventionPlans.MaxAsync(p => (int?)p.PlanId) ?? 0) + 1;

        var plan = new InterventionPlan
        {
            PlanId = nextId,
            ResidentId = req.ResidentId,
            PlanCategory = req.PlanCategory?.Trim(),
            PlanDescription = req.PlanDescription?.Trim(),
            ServicesProvided = req.ServicesProvided?.Trim(),
            TargetDate = req.TargetDate,
            CaseConferenceDate = req.CaseConferenceDate,
            Status = req.Status?.Trim() ?? "active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _db.InterventionPlans.Add(plan);
        await _db.SaveChangesAsync();

        var created = await _db.InterventionPlans
            .AsNoTracking()
            .Include(p => p.Resident)
            .FirstAsync(p => p.PlanId == nextId);

        return CreatedAtAction(nameof(GetById), new { id = nextId }, MapToDto(created));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] InterventionPlanUpsertRequest req)
    {
        var plan = await _db.InterventionPlans.FindAsync(id);
        if (plan is null) return NotFound();

        plan.ResidentId = req.ResidentId;
        plan.PlanCategory = req.PlanCategory?.Trim();
        plan.PlanDescription = req.PlanDescription?.Trim();
        plan.ServicesProvided = req.ServicesProvided?.Trim();
        plan.TargetDate = req.TargetDate;
        plan.CaseConferenceDate = req.CaseConferenceDate;
        plan.Status = req.Status?.Trim() ?? plan.Status;
        plan.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var plan = await _db.InterventionPlans.FindAsync(id);
        if (plan is null) return NotFound();

        _db.InterventionPlans.Remove(plan);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static InterventionPlanDto MapToDto(InterventionPlan p) => new(
        p.PlanId,
        p.ResidentId,
        p.Resident?.InternalCode ?? (p.Resident is null ? null : $"Resident #{p.ResidentId}"),
        p.PlanCategory,
        p.PlanDescription,
        p.ServicesProvided,
        p.TargetDate?.ToString("yyyy-MM-dd"),
        p.CaseConferenceDate?.ToString("yyyy-MM-dd"),
        p.Status,
        p.CreatedAt,
        p.UpdatedAt);

    // ── DTOs ────────────────────────────────────────────────────────────────

    private sealed record InterventionPlanDto(
        int Id,
        int? ResidentId,
        string? ResidentName,
        string? PlanCategory,
        string? PlanDescription,
        string? ServicesProvided,
        string? TargetDate,
        string? CaseConferenceDate,
        string? Status,
        DateTime? CreatedAt,
        DateTime? UpdatedAt);

    public sealed record InterventionPlanUpsertRequest(
        int? ResidentId,
        string? PlanCategory,
        string? PlanDescription,
        string? ServicesProvided,
        DateOnly? TargetDate,
        DateOnly? CaseConferenceDate,
        string? Status);
}
