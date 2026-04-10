using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace INTEXII.API.Data.Models;

[Table("chat_uploads")]
public class ChatUpload
{
    [Key]
    [Column("upload_id")]
    public int UploadId { get; set; }

    [Column("conversation_id")]
    public int ConversationId { get; set; }

    [Column("original_filename")]
    public string OriginalFilename { get; set; } = string.Empty;

    [Column("stored_filename")]
    public string StoredFilename { get; set; } = string.Empty;

    [Column("content_type")]
    public string ContentType { get; set; } = "application/octet-stream";

    [Column("file_size_bytes")]
    public long FileSizeBytes { get; set; }

    [Column("uploaded_at")]
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

    public ChatConversation? Conversation { get; set; }
}
