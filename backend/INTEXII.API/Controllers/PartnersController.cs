using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/partners")]
[Authorize]
public class PartnersController : ControllerBase
{
    private readonly IntexDbContext _db;

    public PartnersController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? search = null)
    {
        var partners = await _db.Partners
            .AsNoTracking()
            .Include(p => p.Assignments)
            .OrderBy(p => p.PartnerName)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            partners = partners
                .Where(p =>
                    ContainsIgnoreCase(p.PartnerName, term) ||
                    ContainsIgnoreCase(p.ContactName, term) ||
                    ContainsIgnoreCase(p.Email, term) ||
                    ContainsIgnoreCase(p.PartnerType, term))
                .ToList();
        }

        return Ok(partners.Select(MapToListDto).ToArray());
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetById(int id)
    {
        var partner = await _db.Partners
            .AsNoTracking()
            .Include(p => p.Assignments)
            .FirstOrDefaultAsync(p => p.PartnerId == id);

        if (partner is null) return NotFound();

        return Ok(MapToDetailDto(partner));
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Create([FromBody] PartnerUpsertRequest req)
    {
        var nextId = (await _db.Partners.MaxAsync(p => (int?)p.PartnerId) ?? 0) + 1;

        var partner = new Partner
        {
            PartnerId = nextId,
            PartnerName = req.PartnerName?.Trim(),
            PartnerType = req.PartnerType?.Trim(),
            RoleType = req.RoleType?.Trim(),
            ContactName = req.ContactName?.Trim(),
            Email = req.Email?.Trim(),
            Phone = req.Phone?.Trim(),
            Region = req.Region?.Trim(),
            Status = req.Status?.Trim() ?? "active",
            StartDate = req.StartDate,
            EndDate = req.EndDate,
            Notes = req.Notes?.Trim(),
        };

        _db.Partners.Add(partner);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = nextId }, MapToListDto(partner));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Update(int id, [FromBody] PartnerUpsertRequest req)
    {
        var partner = await _db.Partners.FindAsync(id);
        if (partner is null) return NotFound();

        partner.PartnerName = req.PartnerName?.Trim();
        partner.PartnerType = req.PartnerType?.Trim();
        partner.RoleType = req.RoleType?.Trim();
        partner.ContactName = req.ContactName?.Trim();
        partner.Email = req.Email?.Trim();
        partner.Phone = req.Phone?.Trim();
        partner.Region = req.Region?.Trim();
        partner.Status = req.Status?.Trim() ?? partner.Status;
        partner.StartDate = req.StartDate;
        partner.EndDate = req.EndDate;
        partner.Notes = req.Notes?.Trim();

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Delete(int id)
    {
        var partner = await _db.Partners
            .Include(p => p.Assignments)
            .FirstOrDefaultAsync(p => p.PartnerId == id);

        if (partner is null) return NotFound();

        if (partner.Assignments.Count > 0)
        {
            return BadRequest(new { detail = "Cannot delete a partner with active safehouse assignments. Remove the assignments first." });
        }

        _db.Partners.Remove(partner);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static PartnerListDto MapToListDto(Partner p) => new(
        p.PartnerId,
        p.PartnerName,
        p.PartnerType,
        p.RoleType,
        p.ContactName,
        p.Email,
        p.Phone,
        p.Region,
        p.Status ?? "active",
        p.StartDate?.ToString("yyyy-MM-dd"),
        p.EndDate?.ToString("yyyy-MM-dd"),
        p.Notes,
        p.Assignments.Count);

    private static PartnerDetailDto MapToDetailDto(Partner p) => new(
        p.PartnerId,
        p.PartnerName,
        p.PartnerType,
        p.RoleType,
        p.ContactName,
        p.Email,
        p.Phone,
        p.Region,
        p.Status ?? "active",
        p.StartDate?.ToString("yyyy-MM-dd"),
        p.EndDate?.ToString("yyyy-MM-dd"),
        p.Notes,
        p.Assignments.Select(a => new PartnerAssignmentSummary(
            a.AssignmentId, a.SafehouseId, a.ProgramArea, a.AssignmentStart?.ToString("yyyy-MM-dd"))).ToArray());

    private static bool ContainsIgnoreCase(string? value, string term) =>
        !string.IsNullOrWhiteSpace(value) &&
        value.Contains(term, StringComparison.OrdinalIgnoreCase);

    // ── DTOs ────────────────────────────────────────────────────────────────

    private sealed record PartnerListDto(
        int Id,
        string? PartnerName,
        string? PartnerType,
        string? RoleType,
        string? ContactName,
        string? Email,
        string? Phone,
        string? Region,
        string Status,
        string? StartDate,
        string? EndDate,
        string? Notes,
        int AssignmentCount);

    private sealed record PartnerDetailDto(
        int Id,
        string? PartnerName,
        string? PartnerType,
        string? RoleType,
        string? ContactName,
        string? Email,
        string? Phone,
        string? Region,
        string Status,
        string? StartDate,
        string? EndDate,
        string? Notes,
        PartnerAssignmentSummary[] Assignments);

    private sealed record PartnerAssignmentSummary(
        int AssignmentId,
        int? SafehouseId,
        string? ProgramArea,
        string? StartDate);

    public sealed record PartnerUpsertRequest(
        string? PartnerName,
        string? PartnerType,
        string? RoleType,
        string? ContactName,
        string? Email,
        string? Phone,
        string? Region,
        string? Status,
        DateOnly? StartDate,
        DateOnly? EndDate,
        string? Notes);
}
