namespace INTEXII.API.Services;

public sealed record ChatAttachmentContent(
    string Type,
    string FileName,
    string MediaType,
    string? TextContent,
    string? Base64Data
);

public sealed record ChatMessageContent(
    string Role,
    string Content,
    IReadOnlyList<ChatAttachmentContent> Attachments
);

public sealed record ChatContextResult(
    string Intent,
    IReadOnlyList<string> Blocks
);
