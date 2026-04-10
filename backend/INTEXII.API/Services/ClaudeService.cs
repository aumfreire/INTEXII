using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Hosting;

namespace INTEXII.API.Services;

public sealed class ClaudeService
{
    private const string AnthropicEndpoint = "https://api.anthropic.com/v1/messages";
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;
    private readonly ILogger<ClaudeService> _logger;

    public ClaudeService(
        IHttpClientFactory httpClientFactory,
        IConfiguration configuration,
        IHostEnvironment environment,
        ILogger<ClaudeService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _configuration = configuration;
        _environment = environment;
        _logger = logger;
    }

    public async IAsyncEnumerable<string> StreamResponseAsync(
        IReadOnlyList<ChatMessageContent> messages,
        string systemPrompt,
        bool stream = true,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var apiKey = _configuration["Anthropic:ApiKey"] ?? _configuration["ANTHROPIC_API_KEY"];
        if (!IsConfiguredValue(apiKey))
        {
            if (_environment.IsDevelopment())
            {
                await foreach (var token in StreamDevelopmentFallbackAsync(messages, cancellationToken))
                {
                    yield return token;
                }

                yield break;
            }

            throw new InvalidOperationException("Missing Anthropic API key.");
        }

        var model = _configuration["ANTHROPIC_MODEL"] ?? "claude-sonnet-4-20250514";
        var maxTokens = int.TryParse(_configuration["CHAT_MAX_TOKENS"], out var configured) ? configured : 4096;

        var payload = new
        {
            model,
            stream,
            max_tokens = maxTokens,
            system = systemPrompt,
            messages = messages.Select(message => new
            {
                role = message.Role,
                content = BuildAnthropicContent(message)
            })
        };

        var client = _httpClientFactory.CreateClient();
        using var outbound = new HttpRequestMessage(HttpMethod.Post, AnthropicEndpoint);
        outbound.Headers.Add("x-api-key", apiKey);
        outbound.Headers.Add("anthropic-version", "2023-06-01");
        outbound.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var response = await client.SendAsync(outbound, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        var rawFailure = response.IsSuccessStatusCode ? null : await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("Claude API failed {Status}: {Body}", response.StatusCode, rawFailure);
            throw new InvalidOperationException("Claude provider request failed.");
        }

        await using var streamBody = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(streamBody);
        while (!cancellationToken.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            if (line is null)
            {
                break;
            }
            if (string.IsNullOrWhiteSpace(line) || !line.StartsWith("data: ", StringComparison.Ordinal))
            {
                continue;
            }

            var payloadLine = line["data: ".Length..].Trim();
            if (payloadLine == "[DONE]")
            {
                break;
            }

            using var eventJson = JsonDocument.Parse(payloadLine);
            var root = eventJson.RootElement;
            if (!root.TryGetProperty("type", out var typeElement))
            {
                continue;
            }

            if (typeElement.GetString() != "content_block_delta")
            {
                continue;
            }

            if (!root.TryGetProperty("delta", out var delta)
                || !delta.TryGetProperty("type", out var deltaType)
                || deltaType.GetString() != "text_delta"
                || !delta.TryGetProperty("text", out var textElement))
            {
                continue;
            }

            var text = textElement.GetString();
            if (!string.IsNullOrEmpty(text))
            {
                yield return text;
            }
        }
    }

    private static async IAsyncEnumerable<string> StreamDevelopmentFallbackAsync(
        IReadOnlyList<ChatMessageContent> messages,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var latestUserMessage = messages.LastOrDefault(message => message.Role == "user")?.Content?.Trim();
        var response = latestUserMessage is { Length: > 0 }
            ? $"Demo mode: I am running locally without an Anthropic key. You asked: {latestUserMessage}"
            : "Demo mode: I am running locally without an Anthropic key. Send a message and the chat pipeline is working end to end.";

        foreach (var chunk in response.Split(' ', StringSplitOptions.RemoveEmptyEntries))
        {
            cancellationToken.ThrowIfCancellationRequested();
            await Task.Yield();
            yield return chunk + " ";
        }
    }

    private static bool IsConfiguredValue(string? value)
    {
        return !string.IsNullOrWhiteSpace(value)
            && !value.StartsWith("REPLACE", StringComparison.OrdinalIgnoreCase)
            && !value.Contains("REPLACE_IN_SECRETS_FILE", StringComparison.OrdinalIgnoreCase);
    }

    private static object[] BuildAnthropicContent(ChatMessageContent message)
    {
        var blocks = new List<object>();

        if (!string.IsNullOrWhiteSpace(message.Content))
        {
            blocks.Add(new { type = "text", text = message.Content });
        }

        foreach (var attachment in message.Attachments)
        {
            if (attachment.Type == "image"
                && !string.IsNullOrWhiteSpace(attachment.Base64Data)
                && !string.IsNullOrWhiteSpace(attachment.MediaType))
            {
                blocks.Add(new
                {
                    type = "image",
                    source = new
                    {
                        type = "base64",
                        media_type = attachment.MediaType,
                        data = attachment.Base64Data
                    }
                });
                continue;
            }

            if (!string.IsNullOrWhiteSpace(attachment.TextContent))
            {
                blocks.Add(new
                {
                    type = "text",
                    text = $"Attachment ({attachment.FileName}, {attachment.MediaType}):\n{attachment.TextContent}"
                });
            }
        }

        if (blocks.Count == 0)
        {
            blocks.Add(new { type = "text", text = "(No user content provided.)" });
        }

        return blocks.ToArray();
    }
}
