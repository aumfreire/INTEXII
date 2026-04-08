using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using INTEXII.API.Infrastructure;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Scalar.AspNetCore;
using Swashbuckle.AspNetCore.SwaggerUI;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Optional local secrets file fallback for team members not using user-secrets yet.
builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: false);

// Local development secrets are loaded from .NET user-secrets.
// Azure deployment should use environment variables (for example Authentication__Google__ClientId).
if (builder.Environment.IsDevelopment())
{
    builder.Configuration.AddUserSecrets<Program>(optional: true);
}

const string FrontendCorsPolicy = "FrontendClient";
const string DefaultFrontendUrl = "http://localhost:3000";
var frontendUrl = builder.Configuration["FrontendUrl"] ?? DefaultFrontendUrl;
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];
var hasGoogleCredentials = IsConfiguredValue(googleClientId) && IsConfiguredValue(googleClientSecret);
var jwtSigningKey = builder.Configuration["Authentication:Jwt:SigningKey"];
if (string.IsNullOrWhiteSpace(jwtSigningKey))
{
    // Fallback key for local/dev or emergency cloud runtime if app setting was not provided.
    jwtSigningKey = "INTEXII_Fallback_JwtSigningKey_Replace_In_Azure_AppSettings_2026";
}
var jwtIssuer = builder.Configuration["Authentication:Jwt:Issuer"] ?? "INTEXII.API";
var jwtAudience = builder.Configuration["Authentication:Jwt:Audience"] ?? "INTEXII.Frontend";

// -----------------------------------------------------------------------
// Services
// -----------------------------------------------------------------------

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "INTEXII API", Version = "v1" });
});

var identityConnectionString = builder.Configuration.GetConnectionString("IdentityConnection")
    ?? throw new InvalidOperationException("Connection string 'IdentityConnection' was not found.");
var intexConnectionString = builder.Configuration.GetConnectionString("IntexConnection")
    ?? throw new InvalidOperationException("Connection string 'IntexConnection' was not found.");

// Identity database
// Local development keeps SQLite by default; Azure can use SQL Server by setting
// ConnectionStrings__IdentityConnection to a SQL Server style connection string.
builder.Services.AddDbContext<AuthIdentityDbContext>(options =>
{
    ConfigureDbProvider(options, identityConnectionString);
    options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
});

// Operational database
// Local dev: SQLite (INTEXIIdb.sqlite)
// Azure production: use SQL Server by setting ConnectionStrings__IntexConnection.
builder.Services.AddDbContext<IntexDbContext>(options =>
{
    ConfigureDbProvider(options, intexConnectionString);
    options.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
});

// ASP.NET Identity with role support, backed by the identity SQLite DB
builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AuthIdentityDbContext>();

builder.Services.AddAuthentication(options =>
    {
        options.DefaultScheme = "JwtOrCookie";
        options.DefaultAuthenticateScheme = "JwtOrCookie";
        options.DefaultChallengeScheme = "JwtOrCookie";
    })
    .AddPolicyScheme("JwtOrCookie", "JWT or Identity cookie", options =>
    {
        options.ForwardDefaultSelector = context =>
        {
            var authorization = context.Request.Headers.Authorization.ToString();
            if (!string.IsNullOrWhiteSpace(authorization)
                && authorization.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return JwtBearerDefaults.AuthenticationScheme;
            }

            return IdentityConstants.ApplicationScheme;
        };
    })
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = true;
        options.SaveToken = false;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ValidIssuer = jwtIssuer,
            ValidAudience = jwtAudience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey!)),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

// Google OAuth (only registered when credentials are present in config/secrets)
// VIDEO NOTE: Show the Google sign-in button in the UI, click it, complete the OAuth flow.
if (hasGoogleCredentials)
{
    builder.Services.AddAuthentication()
        .AddGoogle(options =>
        {
            options.ClientId = googleClientId!;
            options.ClientSecret = googleClientSecret!;
            options.SignInScheme = IdentityConstants.ExternalScheme;
            options.CallbackPath = "/signin-google";
            options.CorrelationCookie.SameSite = SameSiteMode.None;
            options.CorrelationCookie.SecurePolicy = CookieSecurePolicy.Always;
        });
}

// Authorization policies
// VIDEO NOTE: Show that hitting a ManageData endpoint as Donor returns 403.
// Show that hitting it as Admin returns 200 (or 501 until DB is connected).
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(AuthPolicies.ManageData,
        policy => policy.RequireRole(AuthRoles.Admin));

    options.AddPolicy(AuthPolicies.ViewDonorHistory,
        policy => policy.RequireRole(AuthRoles.Donor, AuthRoles.Admin));
});

// Password policy — enforce strong passwords.
// Requires length + complexity to reduce weak credential risk.
builder.Services.Configure<IdentityOptions>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = true;
    options.Password.RequiredLength = 14;
    options.Password.RequiredUniqueChars = 4;
});

// Cookie security configuration
// VIDEO NOTE: After login, open DevTools → Application → Cookies.
// Show HttpOnly=true, Secure=true, SameSite=None, Expires=7 days from now.
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;

    // Frontend and backend are hosted on different origins in both local and Azure.
    // SameSite=None is required for cross-site cookie auth with fetch credentials.
    options.Cookie.SameSite = SameSiteMode.None;

    options.ExpireTimeSpan = TimeSpan.FromDays(7);
    options.SlidingExpiration = true;
});

// CORS — only allow requests from the configured frontend origin
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.WithOrigins(frontendUrl)
            .AllowCredentials()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// -----------------------------------------------------------------------
// Pipeline
// -----------------------------------------------------------------------

var app = builder.Build();

// Seed identity: create roles (Admin, Donor) and default admin user
using (var scope = app.Services.CreateScope())
{
    await AuthIdentityGenerator.GenerateDefaultIdentityAsync(scope.ServiceProvider, app.Configuration);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "INTEXII API v1");
        c.RoutePrefix = string.Empty;
    });
}

// HSTS — tells browsers to always use HTTPS for this domain for 1 year
// VIDEO NOTE: In production, show the Strict-Transport-Security response header in DevTools.
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// CSP and other security headers
// VIDEO NOTE: Open DevTools → Network → any response → Response Headers.
// Show "content-security-policy" header present with the policy value.
app.UseSecurityHeaders();

// Keep Identity users and operational supporters in sync for donor workflows.
// When registration succeeds, we ensure:
// 1) the user has Donor role
// 2) a corresponding supporters row exists in the operational DB.
app.Use(async (context, next) =>
{
    if (!HttpMethods.IsPost(context.Request.Method)
        || !context.Request.Path.Equals("/api/auth/register", StringComparison.OrdinalIgnoreCase))
    {
        await next();
        return;
    }

    string? registeredEmail = null;

    context.Request.EnableBuffering();
    try
    {
        using var document = await JsonDocument.ParseAsync(context.Request.Body);
        if (document.RootElement.TryGetProperty("email", out var emailElement))
        {
            registeredEmail = emailElement.GetString();
        }
    }
    catch
    {
        // If payload cannot be parsed, continue and let Identity endpoint handle validation.
    }
    finally
    {
        context.Request.Body.Position = 0;
    }

    await next();

    if (context.Response.StatusCode < 200 || context.Response.StatusCode >= 300 || string.IsNullOrWhiteSpace(registeredEmail))
        return;

    var normalizedEmail = registeredEmail.Trim().ToLowerInvariant();
    using var scope = context.RequestServices.CreateScope();
    var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("RegisterSupporterSync");

    try
    {
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var intexDb = scope.ServiceProvider.GetRequiredService<IntexDbContext>();

        var user = await userManager.FindByEmailAsync(normalizedEmail);
        if (user != null && !await userManager.IsInRoleAsync(user, AuthRoles.Donor))
        {
            var donorRoleResult = await userManager.AddToRoleAsync(user, AuthRoles.Donor);
            if (!donorRoleResult.Succeeded)
            {
                logger.LogWarning("Failed to assign Donor role for newly registered user {Email}: {Errors}",
                    normalizedEmail,
                    string.Join(", ", donorRoleResult.Errors.Select(e => e.Description)));
            }
        }

        var supporterExists = await intexDb.Supporters
            .AnyAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);

        if (!supporterExists)
        {
            var nextSupporterId = (await intexDb.Supporters.MaxAsync(s => (int?)s.SupporterId) ?? 0) + 1;

            intexDb.Supporters.Add(new Supporter
            {
                SupporterId = nextSupporterId,
                Email = normalizedEmail,
                SupporterType = "Individual",
                DisplayName = normalizedEmail,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            });

            await intexDb.SaveChangesAsync();
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to synchronize supporter record after registration for {Email}", normalizedEmail);
    }
});

app.UseCors(FrontendCorsPolicy);

// HTTP → HTTPS redirect
// VIDEO NOTE: Navigate to http:// version of the site; show it redirects to https://.
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Maps the built-in Identity API endpoints under /api/auth:
//   POST /api/auth/register
//   POST /api/auth/login
//   POST /api/auth/logout
//   GET  /api/auth/me          (our custom AuthController)
//   GET  /api/auth/providers   (our custom AuthController)
//   GET  /api/auth/external-login   (our custom AuthController)
//   GET  /api/auth/external-callback (our custom AuthController)
app.MapGroup("/api/auth").MapIdentityApi<ApplicationUser>();

app.Run();

static bool IsConfiguredValue(string? value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return false;
    }

    return !value.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase);
}

static void ConfigureDbProvider(DbContextOptionsBuilder options, string connectionString)
{
    if (LooksLikeSqlite(connectionString))
    {
        options.UseSqlite(connectionString);
        return;
    }

    options.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null);
    });
}

static bool LooksLikeSqlite(string connectionString)
{
    if (connectionString.Contains("Server=", StringComparison.OrdinalIgnoreCase)
        || connectionString.Contains("Initial Catalog=", StringComparison.OrdinalIgnoreCase)
        || connectionString.Contains("Database=", StringComparison.OrdinalIgnoreCase)
        || connectionString.Contains("Encrypt=", StringComparison.OrdinalIgnoreCase)
        || connectionString.Contains("TrustServerCertificate=", StringComparison.OrdinalIgnoreCase))
    {
        return false;
    }

    return connectionString.Contains(".sqlite", StringComparison.OrdinalIgnoreCase)
        || connectionString.Contains("Filename=", StringComparison.OrdinalIgnoreCase)
        || connectionString.EndsWith(".db", StringComparison.OrdinalIgnoreCase)
        || connectionString.Contains("Data Source=", StringComparison.OrdinalIgnoreCase);
}
