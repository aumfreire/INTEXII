using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/process-recordings")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class ProcessRecordingsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public ProcessRecordingsController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? residentId = null,
        [FromQuery] string? search = null,
        [FromQuery] string? sessionType = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.ProcessRecordings
            .AsNoTracking()
            .Include(p => p.Resident)
            .AsQueryable();

        if (residentId.HasValue)
            query = query.Where(p => p.ResidentId == residentId.Value);

        if (!string.IsNullOrWhiteSpace(sessionType))
            query = query.Where(p => p.SessionType != null &&
                p.SessionType.ToLower() == sessionType.Trim().ToLower());

        var all = await query.OrderByDescending(p => p.SessionDate).ToListAsync();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            all = all.Where(p =>
                ContainsIgnoreCase(p.SocialWorker, term) ||
                ContainsIgnoreCase(p.SessionNarrative, term) ||
                ContainsIgnoreCase(BuildResidentName(p.Resident), term)).ToList();
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
        var recording = await _db.ProcessRecordings
            .AsNoTracking()
            .Include(p => p.Resident)
            .FirstOrDefaultAsync(p => p.RecordingId == id);

        if (recording is null) return NotFound();

        return Ok(MapToDetailDto(recording));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ProcessRecordingUpsertRequest req)
    {
        var nextId = (await _db.ProcessRecordings.MaxAsync(p => (int?)p.RecordingId) ?? 0) + 1;

        var recording = new ProcessRecording
        {
            RecordingId = nextId,
            ResidentId = req.ResidentId,
            SessionDate = req.SessionDate,
            SocialWorker = req.SocialWorker?.Trim(),
            SessionType = req.SessionType?.Trim(),
            SessionDurationMinutes = req.SessionDurationMinutes,
            EmotionalStateObserved = req.EmotionalStateObserved?.Trim(),
            EmotionalStateEnd = req.EmotionalStateEnd?.Trim(),
            SessionNarrative = req.SessionNarrative?.Trim(),
            InterventionsApplied = req.InterventionsApplied?.Trim(),
            FollowUpActions = req.FollowUpActions?.Trim(),
            ProgressNoted = req.ProgressNoted,
            ConcernsFlagged = req.ConcernsFlagged,
            ReferralMade = req.ReferralMade,
        };

        _db.ProcessRecordings.Add(recording);
        await _db.SaveChangesAsync();

        var created = await _db.ProcessRecordings
            .AsNoTracking()
            .Include(p => p.Resident)
            .FirstAsync(p => p.RecordingId == nextId);

        return CreatedAtAction(nameof(GetById), new { id = nextId }, MapToDetailDto(created));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] ProcessRecordingUpsertRequest req)
    {
        var recording = await _db.ProcessRecordings.FindAsync(id);
        if (recording is null) return NotFound();

        recording.ResidentId = req.ResidentId;
        recording.SessionDate = req.SessionDate;
        recording.SocialWorker = req.SocialWorker?.Trim();
        recording.SessionType = req.SessionType?.Trim();
        recording.SessionDurationMinutes = req.SessionDurationMinutes;
        recording.EmotionalStateObserved = req.EmotionalStateObserved?.Trim();
        recording.EmotionalStateEnd = req.EmotionalStateEnd?.Trim();
        recording.SessionNarrative = req.SessionNarrative?.Trim();
        recording.InterventionsApplied = req.InterventionsApplied?.Trim();
        recording.FollowUpActions = req.FollowUpActions?.Trim();
        recording.ProgressNoted = req.ProgressNoted;
        recording.ConcernsFlagged = req.ConcernsFlagged;
        recording.ReferralMade = req.ReferralMade;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var recording = await _db.ProcessRecordings.FindAsync(id);
        if (recording is null) return NotFound();

        _db.ProcessRecordings.Remove(recording);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private static ProcessRecordingListDto MapToListDto(ProcessRecording p) => new(
        p.RecordingId,
        p.ResidentId,
        BuildResidentName(p.Resident),
        p.SessionDate?.ToString("yyyy-MM-dd"),
        p.SocialWorker,
        p.SessionType,
        p.ProgressNoted ?? false,
        p.ConcernsFlagged ?? false,
        p.ReferralMade ?? false);

    private static ProcessRecordingDetailDto MapToDetailDto(ProcessRecording p) => new(
        p.RecordingId,
        p.ResidentId,
        BuildResidentName(p.Resident),
        p.SessionDate?.ToString("yyyy-MM-dd"),
        p.SocialWorker,
        p.SessionType,
        p.SessionDurationMinutes,
        p.EmotionalStateObserved,
        p.EmotionalStateEnd,
        p.SessionNarrative,
        p.InterventionsApplied,
        p.FollowUpActions,
        p.ProgressNoted ?? false,
        p.ConcernsFlagged ?? false,
        p.ReferralMade ?? false);

    private static string BuildResidentName(Resident? r)
    {
        if (r is null) return "Unknown";
        var parts = new[] { r.InternalCode }.Where(x => x != null);
        return r.InternalCode ?? $"Resident #{r.ResidentId}";
    }

    private static bool ContainsIgnoreCase(string? value, string term) =>
        !string.IsNullOrWhiteSpace(value) &&
        value.Contains(term, StringComparison.OrdinalIgnoreCase);

    // ── DTOs ────────────────────────────────────────────────────────────────

    private sealed record ProcessRecordingListDto(
        int Id,
        int? ResidentId,
        string ResidentName,
        string? SessionDate,
        string? SocialWorker,
        string? SessionType,
        bool ProgressNoted,
        bool ConcernsFlagged,
        bool ReferralMade);

    private sealed record ProcessRecordingDetailDto(
        int Id,
        int? ResidentId,
        string ResidentName,
        string? SessionDate,
        string? SocialWorker,
        string? SessionType,
        int? SessionDurationMinutes,
        string? EmotionalStateObserved,
        string? EmotionalStateEnd,
        string? SessionNarrative,
        string? InterventionsApplied,
        string? FollowUpActions,
        bool ProgressNoted,
        bool ConcernsFlagged,
        bool ReferralMade);

    public sealed record ProcessRecordingUpsertRequest(
        int? ResidentId,
        DateOnly? SessionDate,
        string? SocialWorker,
        string? SessionType,
        int? SessionDurationMinutes,
        string? EmotionalStateObserved,
        string? EmotionalStateEnd,
        string? SessionNarrative,
        string? InterventionsApplied,
        string? FollowUpActions,
        bool? ProgressNoted,
        bool? ConcernsFlagged,
        bool? ReferralMade);
}
