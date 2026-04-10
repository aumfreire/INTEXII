using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("chat_feedback")]
public class ChatFeedback
{
    [Key]
    [Column("feedback_id")]
    public int FeedbackId { get; set; }

    [Column("message_id")]
    public int MessageId { get; set; }

    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("rating")]
    public string Rating { get; set; } = "up";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ChatMessage? Message { get; set; }
}
