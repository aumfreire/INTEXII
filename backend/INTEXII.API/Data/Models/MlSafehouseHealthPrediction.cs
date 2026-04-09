using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("ml_safehouse_health_predictions")]
public class MlSafehouseHealthPrediction
{
    [Column("safehouse_id")]   public int     SafehouseId    { get; set; }
    [Column("safehouse_code")] public string? SafehouseCode  { get; set; }
    [Column("name")]           public string? Name           { get; set; }
    [Column("region")]         public string? Region         { get; set; }
    [Column("month_start")]    public string? MonthStart     { get; set; }
    [Column("pred_avg_education_progress")] public double? PredAvgEducationProgress { get; set; }
    [Column("pred_avg_health_score")]       public double? PredAvgHealthScore       { get; set; }
    [Column("pred_incident_count")]         public double? PredIncidentCount        { get; set; }
    [Column("alert_tier")]     public string? AlertTier      { get; set; }
    [Column("run_date")]       public string? RunDate        { get; set; }
}
