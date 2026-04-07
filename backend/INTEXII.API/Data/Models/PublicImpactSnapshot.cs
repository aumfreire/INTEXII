using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("public_impact_snapshots")]
public class PublicImpactSnapshot
{
    [Key]
    [Column("snapshot_id")]
    public int SnapshotId { get; set; }

    [Column("snapshot_date")]
    public DateOnly? SnapshotDate { get; set; }

    [Column("headline")]
    public string? Headline { get; set; }

    [Column("summary_text")]
    public string? SummaryText { get; set; }

    [Column("metric_payload_json")]
    public string? MetricPayloadJson { get; set; }

    [Column("is_published")]
    public bool? IsPublished { get; set; }

    [Column("published_at")]
    public DateOnly? PublishedAt { get; set; }
}
