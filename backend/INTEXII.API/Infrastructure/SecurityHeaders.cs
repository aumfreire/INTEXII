namespace INTEXII.API.Infrastructure;

public static class SecurityHeaders
{
    // CSP is set to support:
    //   - React SPA scripts from self
    //   - Inline styles (needed by chart libraries like Recharts)
    //   - Data URIs for images (used by chart canvases)
    //   - Google OAuth connect (accounts.google.com)
    //   - No frames, no objects, no external base URIs
    //
    // VIDEO NOTE: Show this header in browser DevTools → Network → any request → Response Headers
    // Look for "content-security-policy" in the response headers list.
    public const string ContentSecurityPolicy =
        "default-src 'self'; " +
        "script-src 'self'; " +
        "style-src 'self' 'unsafe-inline'; " +
        "img-src 'self' data:; " +
        "font-src 'self'; " +
        "connect-src 'self' https://accounts.google.com; " +
        "frame-ancestors 'none'; " +
        "object-src 'none'; " +
        "base-uri 'self'";

    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
    {
        var environment = app.ApplicationServices.GetRequiredService<IWebHostEnvironment>();

        return app.Use(async (context, next) =>
        {
            context.Response.OnStarting(() =>
            {
                // Skip CSP for Swagger UI in development (it uses inline scripts)
                if (!(environment.IsDevelopment() && context.Request.Path.StartsWithSegments("/swagger")))
                {
                    context.Response.Headers["Content-Security-Policy"] = ContentSecurityPolicy;
                }

                return Task.CompletedTask;
            });

            await next();
        });
    }
}
