using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("ml_resident_risk_predictions")]
public class MlResidentRiskPrediction
{
    [Column("resident_id")]        public int     ResidentId       { get; set; }
    [Column("case_control_no")]    public string? CaseControlNo    { get; set; }
    [Column("internal_code")]      public string? InternalCode     { get; set; }
    [Column("safehouse_id")]       public int?    SafehouseId      { get; set; }
    [Column("case_category")]      public string? CaseCategory     { get; set; }
    [Column("current_risk_level")] public string? CurrentRiskLevel { get; set; }
    [Column("health_risk")]        public string? HealthRisk       { get; set; }
    [Column("health_risk_reason")] public string? HealthRiskReason { get; set; }
    [Column("education_risk")]        public string? EducationRisk       { get; set; }
    [Column("education_risk_reason")] public string? EducationRiskReason { get; set; }
    [Column("incident_risk")]        public string? IncidentRisk       { get; set; }
    [Column("incident_risk_reason")] public string? IncidentRiskReason { get; set; }
    [Column("overall_risk")]           public string? OverallRisk          { get; set; }
    [Column("last_health_score")]      public double? LastHealthScore      { get; set; }
    [Column("last_attendance_rate")]   public double? LastAttendanceRate   { get; set; }
    [Column("last_progress_percent")]  public double? LastProgressPercent  { get; set; }
    [Column("incidents_last_30d")]     public int?    IncidentsLast30d     { get; set; }
    [Column("incidents_last_90d")]     public int?    IncidentsLast90d     { get; set; }
    [Column("active_plan_status")]     public string? ActivePlanStatus     { get; set; }
    [Column("plan_target_date")]       public DateTime? PlanTargetDate     { get; set; }
    [Column("run_date")]               public DateTime? RunDate            { get; set; }
}
