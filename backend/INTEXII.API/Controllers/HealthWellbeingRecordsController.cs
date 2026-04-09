using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/health-wellbeing-records")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class HealthWellbeingRecordsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public HealthWellbeingRecordsController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? residentId = null,
        [FromQuery] bool? medicalCheckupDone = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.HealthWellbeingRecords
            .AsNoTracking()
            .Include(h => h.Resident)
            .AsQueryable();

        if (residentId.HasValue)
            query = query.Where(h => h.ResidentId == residentId.Value);

        if (medicalCheckupDone.HasValue)
            query = query.Where(h => h.MedicalCheckupDone == medicalCheckupDone.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(h => h.RecordDate)
            .ThenByDescending(h => h.HealthRecordId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(h => MapToDto(h))
            .ToArrayAsync();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var record = await _db.HealthWellbeingRecords
            .AsNoTracking()
            .Include(h => h.Resident)
            .FirstOrDefaultAsync(h => h.HealthRecordId == id);

        if (record is null) return NotFound();

        return Ok(MapToDto(record));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] HealthWellbeingRecordUpsertRequest req)
    {
        var nextId = (await _db.HealthWellbeingRecords.MaxAsync(h => (int?)h.HealthRecordId) ?? 0) + 1;

        var record = new HealthWellbeingRecord
        {
            HealthRecordId = nextId,
            ResidentId = req.ResidentId,
            RecordDate = req.RecordDate,
            GeneralHealthScore = req.GeneralHealthScore,
            NutritionScore = req.NutritionScore,
            SleepQualityScore = req.SleepQualityScore,
            EnergyLevelScore = req.EnergyLevelScore,
            HeightCm = req.HeightCm,
            WeightKg = req.WeightKg,
            Bmi = req.Bmi,
            MedicalCheckupDone = req.MedicalCheckupDone,
            DentalCheckupDone = req.DentalCheckupDone,
            PsychologicalCheckupDone = req.PsychologicalCheckupDone,
            Notes = req.Notes?.Trim(),
        };

        _db.HealthWellbeingRecords.Add(record);
        await _db.SaveChangesAsync();

        var created = await _db.HealthWellbeingRecords
            .AsNoTracking()
            .Include(h => h.Resident)
            .FirstAsync(h => h.HealthRecordId == nextId);

        return CreatedAtAction(nameof(GetById), new { id = nextId }, MapToDto(created));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] HealthWellbeingRecordUpsertRequest req)
    {
        var record = await _db.HealthWellbeingRecords.FindAsync(id);
        if (record is null) return NotFound();

        record.ResidentId = req.ResidentId;
        record.RecordDate = req.RecordDate;
        record.GeneralHealthScore = req.GeneralHealthScore;
        record.NutritionScore = req.NutritionScore;
        record.SleepQualityScore = req.SleepQualityScore;
        record.EnergyLevelScore = req.EnergyLevelScore;
        record.HeightCm = req.HeightCm;
        record.WeightKg = req.WeightKg;
        record.Bmi = req.Bmi;
        record.MedicalCheckupDone = req.MedicalCheckupDone;
        record.DentalCheckupDone = req.DentalCheckupDone;
        record.PsychologicalCheckupDone = req.PsychologicalCheckupDone;
        record.Notes = req.Notes?.Trim();

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var record = await _db.HealthWellbeingRecords.FindAsync(id);
        if (record is null) return NotFound();

        _db.HealthWellbeingRecords.Remove(record);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static HealthWellbeingRecordDto MapToDto(HealthWellbeingRecord h) => new(
        h.HealthRecordId,
        h.ResidentId,
        h.Resident?.InternalCode ?? (h.Resident is null ? "Unknown" : $"Resident #{h.ResidentId}"),
        h.RecordDate?.ToString("yyyy-MM-dd"),
        h.GeneralHealthScore,
        h.NutritionScore,
        h.SleepQualityScore,
        h.EnergyLevelScore,
        h.HeightCm,
        h.WeightKg,
        h.Bmi,
        h.MedicalCheckupDone ?? false,
        h.DentalCheckupDone ?? false,
        h.PsychologicalCheckupDone ?? false,
        h.Notes);

    private sealed record HealthWellbeingRecordDto(
        int Id,
        int? ResidentId,
        string ResidentName,
        string? RecordDate,
        decimal? GeneralHealthScore,
        decimal? NutritionScore,
        decimal? SleepQualityScore,
        decimal? EnergyLevelScore,
        decimal? HeightCm,
        decimal? WeightKg,
        decimal? Bmi,
        bool MedicalCheckupDone,
        bool DentalCheckupDone,
        bool PsychologicalCheckupDone,
        string? Notes);

    public sealed record HealthWellbeingRecordUpsertRequest(
        int? ResidentId,
        DateOnly? RecordDate,
        decimal? GeneralHealthScore,
        decimal? NutritionScore,
        decimal? SleepQualityScore,
        decimal? EnergyLevelScore,
        decimal? HeightCm,
        decimal? WeightKg,
        decimal? Bmi,
        bool? MedicalCheckupDone,
        bool? DentalCheckupDone,
        bool? PsychologicalCheckupDone,
        string? Notes);
}
