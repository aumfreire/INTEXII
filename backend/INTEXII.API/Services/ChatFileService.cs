using System.Globalization;
using System.Text;
using ClosedXML.Excel;
using DocumentFormat.OpenXml.Packaging;
using iText.Kernel.Pdf;
using iText.Kernel.Pdf.Canvas.Parser;
using Microsoft.AspNetCore.StaticFiles;

namespace INTEXII.API.Services;

public sealed class ChatFileService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".pdf", ".png", ".jpg", ".jpeg", ".csv", ".xlsx", ".docx", ".txt", ".md"
    };

    private readonly IConfiguration _configuration;
    private readonly ILogger<ChatFileService> _logger;
    private readonly FileExtensionContentTypeProvider _contentTypeProvider = new();

    public ChatFileService(IConfiguration configuration, ILogger<ChatFileService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public bool IsAllowedFileType(string fileName)
    {
        var extension = Path.GetExtension(fileName);
        return !string.IsNullOrWhiteSpace(extension) && AllowedExtensions.Contains(extension);
    }

    public string GetStorageRoot()
    {
        var configured = _configuration["CHAT_FILE_STORAGE_PATH"];
        if (!string.IsNullOrWhiteSpace(configured))
        {
            return configured;
        }

        return Path.Combine(AppContext.BaseDirectory, "chat-uploads");
    }

    public async Task<(string StoredPath, string ContentType)> SaveUploadAsync(IFormFile file, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(GetStorageRoot());
        var extension = Path.GetExtension(file.FileName);
        var storedName = $"{DateTime.UtcNow:yyyyMMddHHmmssfff}_{Guid.NewGuid():N}{extension}";
        var absolutePath = Path.Combine(GetStorageRoot(), storedName);

        await using (var target = new FileStream(absolutePath, FileMode.CreateNew))
        {
            await file.CopyToAsync(target, cancellationToken);
        }

        var contentType = string.IsNullOrWhiteSpace(file.ContentType)
            ? GuessContentType(file.FileName)
            : file.ContentType;
        return (absolutePath, contentType);
    }

    public async Task<ChatAttachmentContent> ExtractAttachmentAsync(
        string originalFileName,
        string contentType,
        string storedPath,
        CancellationToken cancellationToken)
    {
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();
        switch (extension)
        {
            case ".png":
            case ".jpg":
            case ".jpeg":
                var imageBytes = await File.ReadAllBytesAsync(storedPath, cancellationToken);
                return new ChatAttachmentContent(
                    "image",
                    originalFileName,
                    contentType,
                    null,
                    Convert.ToBase64String(imageBytes));

            case ".txt":
            case ".md":
                var plain = await File.ReadAllTextAsync(storedPath, cancellationToken);
                return new ChatAttachmentContent("text", originalFileName, contentType, Trim(plain), null);

            case ".csv":
                var csv = await File.ReadAllTextAsync(storedPath, cancellationToken);
                return new ChatAttachmentContent("text", originalFileName, contentType, Trim(csv), null);

            case ".docx":
                return new ChatAttachmentContent("text", originalFileName, contentType, Trim(ExtractDocxText(storedPath)), null);

            case ".xlsx":
                return new ChatAttachmentContent("text", originalFileName, contentType, Trim(ExtractXlsxPreview(storedPath)), null);

            case ".pdf":
                return new ChatAttachmentContent("text", originalFileName, contentType, Trim(ExtractPdfText(storedPath)), null);

            default:
                return new ChatAttachmentContent("text", originalFileName, contentType, $"Unsupported file type for deep parsing: {originalFileName}", null);
        }
    }

    private static string ExtractDocxText(string path)
    {
        using var doc = WordprocessingDocument.Open(path, false);
        var body = doc.MainDocumentPart?.Document?.Body;
        if (body is null)
        {
            return string.Empty;
        }

        return body.InnerText;
    }

    private static string ExtractXlsxPreview(string path)
    {
        using var workbook = new XLWorkbook(path);
        var sb = new StringBuilder();
        foreach (var worksheet in workbook.Worksheets.Take(2))
        {
            sb.AppendLine($"Sheet: {worksheet.Name}");
            var range = worksheet.RangeUsed();
            if (range is null)
            {
                sb.AppendLine("(empty)");
                continue;
            }

            foreach (var row in range.RowsUsed().Take(100))
            {
                var cells = row.CellsUsed().Select(c => Convert.ToString(c.Value, CultureInfo.InvariantCulture) ?? string.Empty);
                sb.AppendLine(string.Join(" | ", cells));
            }
        }

        return sb.ToString();
    }

    private static string ExtractPdfText(string path)
    {
        var sb = new StringBuilder();
        using var pdf = new PdfDocument(new PdfReader(path));
        var pageCount = Math.Min(pdf.GetNumberOfPages(), 15);
        for (var i = 1; i <= pageCount; i++)
        {
            sb.AppendLine(PdfTextExtractor.GetTextFromPage(pdf.GetPage(i)));
        }

        return sb.ToString();
    }

    private string GuessContentType(string fileName)
    {
        return _contentTypeProvider.TryGetContentType(fileName, out var contentType)
            ? contentType
            : "application/octet-stream";
    }

    private static string Trim(string input)
    {
        const int maxLength = 12000;
        return input.Length <= maxLength ? input : input[..maxLength];
    }
}
