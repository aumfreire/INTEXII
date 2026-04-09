using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("ml_donor_lapse_predictions")]
public class MlDonorLapsePrediction
{
    [Column("supporter_id")]   public int     SupporterId     { get; set; }
    [Column("display_name")]   public string? DisplayName     { get; set; }
    [Column("email")]          public string? Email           { get; set; }
    [Column("supporter_type")] public string? SupporterType   { get; set; }
    [Column("relationship_type")] public string? RelationshipType { get; set; }
    [Column("region")]         public string? Region          { get; set; }
    [Column("country")]        public string? Country         { get; set; }
    [Column("snapshot_date")]  public DateTime? SnapshotDate  { get; set; }
    [Column("lapse_risk_score")] public double? LapseRiskScore { get; set; }
    [Column("risk_tier")]      public string? RiskTier        { get; set; }
    [Column("recency_days")]   public double? RecencyDays     { get; set; }
    [Column("frequency")]      public double? Frequency       { get; set; }
    [Column("value_sum")]      public double? ValueSum        { get; set; }
    [Column("top_channel_source")] public string? TopChannelSource { get; set; }
    [Column("top_donation_type")]  public string? TopDonationType  { get; set; }
    [Column("run_date")]       public DateTime? RunDate       { get; set; }
}
