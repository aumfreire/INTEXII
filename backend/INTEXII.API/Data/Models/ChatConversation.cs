using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("chat_conversations")]
public class ChatConversation
{
    [Key]
    [Column("conversation_id")]
    public int ConversationId { get; set; }

    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [Column("title")]
    public string? Title { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [Column("is_deleted")]
    public bool IsDeleted { get; set; }

    public ICollection<ChatMessage> Messages { get; set; } = [];
    public ICollection<ChatUpload> Uploads { get; set; } = [];
}
