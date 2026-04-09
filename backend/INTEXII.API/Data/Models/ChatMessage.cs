using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("chat_messages")]
public class ChatMessage
{
    [Key]
    [Column("message_id")]
    public int MessageId { get; set; }

    [Column("conversation_id")]
    public int ConversationId { get; set; }

    [Column("role")]
    public string Role { get; set; } = "user";

    [Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("attachments_json")]
    public string? AttachmentsJson { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ChatConversation? Conversation { get; set; }
    public ICollection<ChatFeedback> Feedback { get; set; } = [];
}
