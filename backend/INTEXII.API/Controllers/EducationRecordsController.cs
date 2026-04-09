using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/education-records")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class EducationRecordsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public EducationRecordsController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? residentId = null,
        [FromQuery] string? enrollmentStatus = null,
        [FromQuery] string? completionStatus = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.EducationRecords
            .AsNoTracking()
            .Include(e => e.Resident)
            .AsQueryable();

        if (residentId.HasValue)
            query = query.Where(e => e.ResidentId == residentId.Value);

        if (!string.IsNullOrWhiteSpace(enrollmentStatus))
            query = query.Where(e => e.EnrollmentStatus != null && e.EnrollmentStatus.ToLower() == enrollmentStatus.Trim().ToLower());

        if (!string.IsNullOrWhiteSpace(completionStatus))
            query = query.Where(e => e.CompletionStatus != null && e.CompletionStatus.ToLower() == completionStatus.Trim().ToLower());

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(e => e.RecordDate)
            .ThenByDescending(e => e.EducationRecordId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => MapToDto(e))
            .ToArrayAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var record = await _db.EducationRecords
            .AsNoTracking()
            .Include(e => e.Resident)
            .FirstOrDefaultAsync(e => e.EducationRecordId == id);

        if (record is null) return NotFound();

        return Ok(MapToDto(record));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] EducationRecordUpsertRequest req)
    {
        var nextId = (await _db.EducationRecords.MaxAsync(e => (int?)e.EducationRecordId) ?? 0) + 1;

        var record = new EducationRecord
        {
            EducationRecordId = nextId,
            ResidentId = req.ResidentId,
            RecordDate = req.RecordDate,
            EducationLevel = req.EducationLevel?.Trim(),
            SchoolName = req.SchoolName?.Trim(),
            EnrollmentStatus = req.EnrollmentStatus?.Trim(),
            AttendanceRate = req.AttendanceRate,
            ProgressPercent = req.ProgressPercent,
            CompletionStatus = req.CompletionStatus?.Trim(),
            Notes = req.Notes?.Trim(),
        };

        _db.EducationRecords.Add(record);
        await _db.SaveChangesAsync();

        var created = await _db.EducationRecords
            .AsNoTracking()
            .Include(e => e.Resident)
            .FirstAsync(e => e.EducationRecordId == nextId);

        return CreatedAtAction(nameof(GetById), new { id = nextId }, MapToDto(created));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] EducationRecordUpsertRequest req)
    {
        var record = await _db.EducationRecords.FindAsync(id);
        if (record is null) return NotFound();

        record.ResidentId = req.ResidentId;
        record.RecordDate = req.RecordDate;
        record.EducationLevel = req.EducationLevel?.Trim();
        record.SchoolName = req.SchoolName?.Trim();
        record.EnrollmentStatus = req.EnrollmentStatus?.Trim();
        record.AttendanceRate = req.AttendanceRate;
        record.ProgressPercent = req.ProgressPercent;
        record.CompletionStatus = req.CompletionStatus?.Trim();
        record.Notes = req.Notes?.Trim();

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var record = await _db.EducationRecords.FindAsync(id);
        if (record is null) return NotFound();

        _db.EducationRecords.Remove(record);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static EducationRecordDto MapToDto(EducationRecord e) => new(
        e.EducationRecordId,
        e.ResidentId,
        e.Resident?.InternalCode ?? (e.Resident is null ? "Unknown" : $"Resident #{e.ResidentId}"),
        e.RecordDate?.ToString("yyyy-MM-dd"),
        e.EducationLevel,
        e.SchoolName,
        e.EnrollmentStatus,
        e.AttendanceRate,
        e.ProgressPercent,
        e.CompletionStatus,
        e.Notes);

    private sealed record EducationRecordDto(
        int Id,
        int? ResidentId,
        string ResidentName,
        string? RecordDate,
        string? EducationLevel,
        string? SchoolName,
        string? EnrollmentStatus,
        decimal? AttendanceRate,
        decimal? ProgressPercent,
        string? CompletionStatus,
        string? Notes);

    public sealed record EducationRecordUpsertRequest(
        int? ResidentId,
        DateOnly? RecordDate,
        string? EducationLevel,
        string? SchoolName,
        string? EnrollmentStatus,
        decimal? AttendanceRate,
        decimal? ProgressPercent,
        string? CompletionStatus,
        string? Notes);
}
