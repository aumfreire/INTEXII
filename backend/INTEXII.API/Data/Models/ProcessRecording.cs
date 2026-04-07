using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("process_recordings")]
public class ProcessRecording
{
    [Key]
    [Column("recording_id")]
    public int RecordingId { get; set; }

    [Column("resident_id")]
    public int? ResidentId { get; set; }

    [Column("session_date")]
    public DateOnly? SessionDate { get; set; }

    [Column("social_worker")]
    public string? SocialWorker { get; set; }

    [Column("session_type")]
    public string? SessionType { get; set; }

    [Column("session_duration_minutes")]
    public int? SessionDurationMinutes { get; set; }

    [Column("emotional_state_observed")]
    public string? EmotionalStateObserved { get; set; }

    [Column("emotional_state_end")]
    public string? EmotionalStateEnd { get; set; }

    [Column("session_narrative")]
    public string? SessionNarrative { get; set; }

    [Column("interventions_applied")]
    public string? InterventionsApplied { get; set; }

    [Column("follow_up_actions")]
    public string? FollowUpActions { get; set; }

    [Column("progress_noted")]
    public bool? ProgressNoted { get; set; }

    [Column("concerns_flagged")]
    public bool? ConcernsFlagged { get; set; }

    [Column("referral_made")]
    public bool? ReferralMade { get; set; }

    [Column("notes_restricted")]
    public string? NotesRestricted { get; set; }

    // Navigation
    public Resident? Resident { get; set; }
}
