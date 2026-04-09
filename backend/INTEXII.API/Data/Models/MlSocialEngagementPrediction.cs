using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("ml_social_engagement_predictions")]
public class MlSocialEngagementPrediction
{
    [Column("supporter_id")]    public int     SupporterId    { get; set; }
    [Column("display_name")]    public string? DisplayName    { get; set; }
    [Column("email")]           public string? Email          { get; set; }
    [Column("engagement_tier")] public string? EngagementTier { get; set; }
    [Column("engagement_probability")] public double? EngagementProbability { get; set; }
    [Column("suggested_action")] public string? SuggestedAction { get; set; }
    [Column("recency_days")]    public double? RecencyDays    { get; set; }
    [Column("donation_frequency")] public double? DonationFrequency { get; set; }
    [Column("donation_value_sum")] public double? DonationValueSum  { get; set; }
    [Column("referral_linked_donations")] public double? ReferralLinkedDonations { get; set; }
    [Column("preferred_platform")] public string? PreferredPlatform { get; set; }
    [Column("preferred_topic")]    public string? PreferredTopic    { get; set; }
    [Column("acquisition_channel")] public string? AcquisitionChannel { get; set; }
    [Column("supporter_type")]  public string? SupporterType  { get; set; }
    [Column("region")]          public string? Region         { get; set; }
    [Column("country")]         public string? Country        { get; set; }
    [Column("run_date")]        public DateTime? RunDate      { get; set; }
}
