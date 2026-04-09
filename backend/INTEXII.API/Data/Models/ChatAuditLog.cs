using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("chat_audit_logs")]
public class ChatAuditLog
{
    [Key]
    [Column("chat_audit_log_id")]
    public int ChatAuditLogId { get; set; }

    [Column("user_id")]
    public string? UserId { get; set; }

    [Column("conversation_id")]
    public int? ConversationId { get; set; }

    [Column("question")]
    public string Question { get; set; } = string.Empty;

    [Column("intent")]
    public string Intent { get; set; } = string.Empty;

    [Column("had_db_context")]
    public bool HadDbContext { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
