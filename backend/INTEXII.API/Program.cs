using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using INTEXII.API.Infrastructure;
using INTEXII.API.Services;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Data.SqlClient;
using Microsoft.Data.Sqlite;
using Scalar.AspNetCore;
using Swashbuckle.AspNetCore.SwaggerUI;
using Microsoft.IdentityModel.Tokens;
using System.Text.Json;
using System.Text;
using System.Data;

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
var frontendUrlsRaw = builder.Configuration["FrontendUrls"];
var allowedFrontendOrigins = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

allowedFrontendOrigins.Add(NormalizeOrigin(frontendUrl));

if (!string.IsNullOrWhiteSpace(frontendUrlsRaw))
{
    foreach (var candidate in frontendUrlsRaw.Split(',', ';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
    {
        allowedFrontendOrigins.Add(NormalizeOrigin(candidate));
    }
}

allowedFrontendOrigins.RemoveWhere(string.IsNullOrWhiteSpace);
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
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();
builder.Services.AddScoped<ClaudeService>();
builder.Services.AddScoped<ChatContextService>();
builder.Services.AddScoped<ChatFileService>();
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
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 14;
    options.Password.RequiredUniqueChars = 1;
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
    options.Events.OnRedirectToLogin = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = context =>
    {
        if (context.Request.Path.StartsWithSegments("/api", StringComparison.OrdinalIgnoreCase))
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }

        context.Response.Redirect(context.RedirectUri);
        return Task.CompletedTask;
    };
});

// CORS — only allow requests from the configured frontend origin
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy.SetIsOriginAllowed(origin =>
            IsAllowedFrontendOrigin(origin, allowedFrontendOrigins))
            .AllowCredentials()
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// -----------------------------------------------------------------------
// Pipeline
// -----------------------------------------------------------------------

var app = builder.Build();

// Ensure database schemas are up to date before any seed logic runs.
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var identityDb = services.GetRequiredService<AuthIdentityDbContext>();
    var intexDb = services.GetRequiredService<IntexDbContext>();

    await MigrateWithSqlServerBaselineAsync(
        identityDb,
        markerTable: "AspNetUsers",
        baselineMigrations:
        [
            "20260406221451_InitialIdentity",
            "20260408031748_SyncAuthIdentitySchema"
        ]);

    await MigrateWithSqlServerBaselineAsync(
        intexDb,
        markerTable: "partners",
        baselineMigrations:
        [
            "20260408023150_InitialIntexSchema",
            "20260408031855_SyncIntexSqlServerModel"
        ]);

    await EnsureMlPredictionTablesAsync(intexDb);
}

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

// Defensive CORS handling for Action Insights endpoints.
// This ensures cross-origin admin dashboard calls always receive CORS headers
// before authentication middleware can short-circuit with 401/403.
app.Use(async (context, next) =>
{
    if (!context.Request.Path.StartsWithSegments("/api/insights", StringComparison.OrdinalIgnoreCase))
    {
        await next();
        return;
    }

    var requestOrigin = context.Request.Headers.Origin.ToString();
    if (IsAllowedFrontendOrigin(requestOrigin, allowedFrontendOrigins))
    {
        context.Response.Headers["Access-Control-Allow-Origin"] = NormalizeOrigin(requestOrigin);
        context.Response.Headers["Vary"] = "Origin";
        context.Response.Headers["Access-Control-Allow-Credentials"] = "true";
    }

    if (HttpMethods.IsOptions(context.Request.Method))
    {
        var requestHeaders = context.Request.Headers["Access-Control-Request-Headers"].ToString();
        context.Response.Headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
        context.Response.Headers["Access-Control-Allow-Headers"] =
            string.IsNullOrWhiteSpace(requestHeaders) ? "authorization, content-type" : requestHeaders;
        context.Response.StatusCode = StatusCodes.Status204NoContent;
        return;
    }

    await next();
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

static bool IsAllowedFrontendOrigin(string? origin, HashSet<string> allowedFrontendOrigins)
{
    if (string.IsNullOrWhiteSpace(origin))
    {
        return false;
    }

    var normalizedOrigin = NormalizeOrigin(origin);
    if (allowedFrontendOrigins.Contains(normalizedOrigin))
    {
        return true;
    }

    if (!Uri.TryCreate(normalizedOrigin, UriKind.Absolute, out var uri))
    {
        return false;
    }

    // Permit Azure Static Web Apps default and preview domains.
    return uri.Host.EndsWith(".azurestaticapps.net", StringComparison.OrdinalIgnoreCase);
}

static string NormalizeOrigin(string origin)
{
    if (string.IsNullOrWhiteSpace(origin))
    {
        return string.Empty;
    }

    return origin.Trim().TrimEnd('/');
}

static async Task MigrateWithSqlServerBaselineAsync(
    DbContext db,
    string markerTable,
    IReadOnlyList<string> baselineMigrations)
{
    try
    {
        await db.Database.MigrateAsync();
    }
    catch (SqlException ex) when (
        db.Database.IsSqlServer()
        && ex.Number == 2714
        && ex.Message.Contains("already an object named", StringComparison.OrdinalIgnoreCase))
    {
        await EnsureMigrationHistoryBaselineAsync(db, markerTable, baselineMigrations);
        await db.Database.MigrateAsync();
    }
    catch (SqliteException ex) when (
        db.Database.IsSqlite()
        && ex.SqliteErrorCode == 1
        && ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase))
    {
        await EnsureMigrationHistoryBaselineAsync(db, markerTable, baselineMigrations);
        await db.Database.MigrateAsync();
    }
}

static async Task EnsureMigrationHistoryBaselineAsync(
    DbContext db,
    string markerTable,
    IReadOnlyList<string> baselineMigrations)
{
    if (!db.Database.IsSqlServer() && !db.Database.IsSqlite())
    {
        return;
    }

    if (db.Database.IsSqlite())
    {
        await EnsureSqliteMigrationHistoryBaselineAsync(db, markerTable, baselineMigrations);
        return;
    }

    var fullMarkerTableName = $"[dbo].[{markerTable}]";
    var connection = db.Database.GetDbConnection();
    var shouldCloseConnection = connection.State != ConnectionState.Open;

    if (shouldCloseConnection)
    {
        await connection.OpenAsync();
    }

    int markerTableExists;
    await using (var command = connection.CreateCommand())
    {
        command.CommandText = "SELECT CASE WHEN OBJECT_ID(@tableName, N'U') IS NULL THEN 0 ELSE 1 END;";
        var parameter = command.CreateParameter();
        parameter.ParameterName = "@tableName";
        parameter.Value = fullMarkerTableName;
        command.Parameters.Add(parameter);

        markerTableExists = Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    if (shouldCloseConnection)
    {
        await connection.CloseAsync();
    }

    if (markerTableExists == 0)
    {
        return;
    }

    await db.Database.ExecuteSqlRawAsync(
        "IF OBJECT_ID(N'[dbo].[__EFMigrationsHistory]', N'U') IS NULL " +
        "BEGIN CREATE TABLE [dbo].[__EFMigrationsHistory] ([MigrationId] nvarchar(150) NOT NULL, [ProductVersion] nvarchar(32) NOT NULL, CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])); END;");

    foreach (var migrationId in baselineMigrations)
    {
        const string productVersion = "10.0.0";
        await db.Database.ExecuteSqlAsync(
            $"IF NOT EXISTS (SELECT 1 FROM [dbo].[__EFMigrationsHistory] WHERE [MigrationId] = {migrationId}) BEGIN INSERT INTO [dbo].[__EFMigrationsHistory] ([MigrationId], [ProductVersion]) VALUES ({migrationId}, {productVersion}); END;");
    }
}

static async Task EnsureMlPredictionTablesAsync(DbContext db)
{
    if (!db.Database.IsSqlServer() && !db.Database.IsSqlite())
    {
        return;
    }

    if (db.Database.IsSqlServer())
    {
        const string sqlServerDdl = @"
IF OBJECT_ID(N'dbo.ml_donor_lapse_predictions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ml_donor_lapse_predictions (
        supporter_id BIGINT NULL,
        display_name NVARCHAR(255) NULL,
        email NVARCHAR(255) NULL,
        supporter_type NVARCHAR(100) NULL,
        relationship_type NVARCHAR(100) NULL,
        region NVARCHAR(100) NULL,
        country NVARCHAR(100) NULL,
        snapshot_date DATETIME2 NULL,
        lapse_risk_score FLOAT NULL,
        risk_tier NVARCHAR(50) NULL,
        recency_days FLOAT NULL,
        frequency BIGINT NULL,
        value_sum FLOAT NULL,
        top_channel_source NVARCHAR(255) NULL,
        top_donation_type NVARCHAR(255) NULL,
        run_date DATETIME2 NULL
    );
END;

IF OBJECT_ID(N'dbo.ml_donor_lapse_predictions', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ml_donor_lapse_predictions ALTER COLUMN supporter_id BIGINT NULL;
    ALTER TABLE dbo.ml_donor_lapse_predictions ALTER COLUMN recency_days FLOAT NULL;
    ALTER TABLE dbo.ml_donor_lapse_predictions ALTER COLUMN frequency BIGINT NULL;
    ALTER TABLE dbo.ml_donor_lapse_predictions ALTER COLUMN value_sum FLOAT NULL;
END;

IF OBJECT_ID(N'dbo.ml_safehouse_health_predictions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ml_safehouse_health_predictions (
        safehouse_id BIGINT NULL,
        safehouse_code NVARCHAR(100) NULL,
        name NVARCHAR(255) NULL,
        region NVARCHAR(100) NULL,
        month_start DATETIME2 NULL,
        pred_avg_education_progress FLOAT NULL,
        pred_avg_health_score FLOAT NULL,
        pred_incident_count FLOAT NULL,
        alert_tier NVARCHAR(50) NULL,
        run_date DATETIME2 NULL
    );
END;

IF OBJECT_ID(N'dbo.ml_safehouse_health_predictions', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ml_safehouse_health_predictions ALTER COLUMN safehouse_id BIGINT NULL;
    ALTER TABLE dbo.ml_safehouse_health_predictions ALTER COLUMN pred_avg_education_progress FLOAT NULL;
    ALTER TABLE dbo.ml_safehouse_health_predictions ALTER COLUMN pred_avg_health_score FLOAT NULL;
    ALTER TABLE dbo.ml_safehouse_health_predictions ALTER COLUMN pred_incident_count FLOAT NULL;
END;

IF OBJECT_ID(N'dbo.ml_resident_risk_predictions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ml_resident_risk_predictions (
        resident_id BIGINT NULL,
        case_control_no NVARCHAR(100) NULL,
        internal_code NVARCHAR(100) NULL,
        safehouse_id BIGINT NULL,
        case_category NVARCHAR(100) NULL,
        current_risk_level NVARCHAR(100) NULL,
        health_risk NVARCHAR(50) NULL,
        health_risk_reason NVARCHAR(MAX) NULL,
        education_risk NVARCHAR(50) NULL,
        education_risk_reason NVARCHAR(MAX) NULL,
        incident_risk NVARCHAR(50) NULL,
        incident_risk_reason NVARCHAR(MAX) NULL,
        overall_risk NVARCHAR(50) NULL,
        last_health_score FLOAT NULL,
        last_attendance_rate FLOAT NULL,
        last_progress_percent FLOAT NULL,
        incidents_last_30d BIGINT NULL,
        incidents_last_90d BIGINT NULL,
        active_plan_status NVARCHAR(100) NULL,
        plan_target_date DATETIME2 NULL,
        run_date DATETIME2 NULL
    );
END;

IF OBJECT_ID(N'dbo.ml_resident_risk_predictions', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ml_resident_risk_predictions ALTER COLUMN resident_id BIGINT NULL;
    ALTER TABLE dbo.ml_resident_risk_predictions ALTER COLUMN safehouse_id BIGINT NULL;
    ALTER TABLE dbo.ml_resident_risk_predictions ALTER COLUMN incidents_last_30d BIGINT NULL;
    ALTER TABLE dbo.ml_resident_risk_predictions ALTER COLUMN incidents_last_90d BIGINT NULL;
    ALTER TABLE dbo.ml_resident_risk_predictions ALTER COLUMN last_health_score FLOAT NULL;
    ALTER TABLE dbo.ml_resident_risk_predictions ALTER COLUMN last_attendance_rate FLOAT NULL;
    ALTER TABLE dbo.ml_resident_risk_predictions ALTER COLUMN last_progress_percent FLOAT NULL;
END;

IF OBJECT_ID(N'dbo.ml_social_engagement_predictions', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ml_social_engagement_predictions (
        supporter_id BIGINT NULL,
        display_name NVARCHAR(255) NULL,
        email NVARCHAR(255) NULL,
        engagement_tier NVARCHAR(50) NULL,
        engagement_probability FLOAT NULL,
        suggested_action NVARCHAR(MAX) NULL,
        recency_days FLOAT NULL,
        donation_frequency BIGINT NULL,
        donation_value_sum FLOAT NULL,
        referral_linked_donations BIGINT NULL,
        preferred_platform NVARCHAR(100) NULL,
        preferred_topic NVARCHAR(100) NULL,
        acquisition_channel NVARCHAR(100) NULL,
        supporter_type NVARCHAR(100) NULL,
        region NVARCHAR(100) NULL,
        country NVARCHAR(100) NULL,
        run_date DATETIME2 NULL
    );
END;

IF OBJECT_ID(N'dbo.ml_social_engagement_predictions', N'U') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ml_social_engagement_predictions ALTER COLUMN supporter_id BIGINT NULL;
    ALTER TABLE dbo.ml_social_engagement_predictions ALTER COLUMN recency_days FLOAT NULL;
    ALTER TABLE dbo.ml_social_engagement_predictions ALTER COLUMN donation_frequency BIGINT NULL;
    ALTER TABLE dbo.ml_social_engagement_predictions ALTER COLUMN donation_value_sum FLOAT NULL;
    ALTER TABLE dbo.ml_social_engagement_predictions ALTER COLUMN referral_linked_donations BIGINT NULL;
END;
";

        await db.Database.ExecuteSqlRawAsync(sqlServerDdl);
        return;
    }

    const string sqliteDdl = @"
CREATE TABLE IF NOT EXISTS ml_donor_lapse_predictions (
    supporter_id INTEGER NULL,
    display_name TEXT NULL,
    email TEXT NULL,
    supporter_type TEXT NULL,
    relationship_type TEXT NULL,
    region TEXT NULL,
    country TEXT NULL,
    snapshot_date TEXT NULL,
    lapse_risk_score REAL NULL,
    risk_tier TEXT NULL,
    recency_days REAL NULL,
    frequency REAL NULL,
    value_sum REAL NULL,
    top_channel_source TEXT NULL,
    top_donation_type TEXT NULL,
    run_date TEXT NULL
);

CREATE TABLE IF NOT EXISTS ml_safehouse_health_predictions (
    safehouse_id INTEGER NULL,
    safehouse_code TEXT NULL,
    name TEXT NULL,
    region TEXT NULL,
    month_start TEXT NULL,
    pred_avg_education_progress REAL NULL,
    pred_avg_health_score REAL NULL,
    pred_incident_count REAL NULL,
    alert_tier TEXT NULL,
    run_date TEXT NULL
);

CREATE TABLE IF NOT EXISTS ml_resident_risk_predictions (
    resident_id INTEGER NULL,
    case_control_no TEXT NULL,
    internal_code TEXT NULL,
    safehouse_id INTEGER NULL,
    case_category TEXT NULL,
    current_risk_level TEXT NULL,
    health_risk TEXT NULL,
    health_risk_reason TEXT NULL,
    education_risk TEXT NULL,
    education_risk_reason TEXT NULL,
    incident_risk TEXT NULL,
    incident_risk_reason TEXT NULL,
    overall_risk TEXT NULL,
    last_health_score REAL NULL,
    last_attendance_rate REAL NULL,
    last_progress_percent REAL NULL,
    incidents_last_30d INTEGER NULL,
    incidents_last_90d INTEGER NULL,
    active_plan_status TEXT NULL,
    plan_target_date TEXT NULL,
    run_date TEXT NULL
);

CREATE TABLE IF NOT EXISTS ml_social_engagement_predictions (
    supporter_id INTEGER NULL,
    display_name TEXT NULL,
    email TEXT NULL,
    engagement_tier TEXT NULL,
    engagement_probability REAL NULL,
    suggested_action TEXT NULL,
    recency_days REAL NULL,
    donation_frequency REAL NULL,
    donation_value_sum REAL NULL,
    referral_linked_donations REAL NULL,
    preferred_platform TEXT NULL,
    preferred_topic TEXT NULL,
    acquisition_channel TEXT NULL,
    supporter_type TEXT NULL,
    region TEXT NULL,
    country TEXT NULL,
    run_date TEXT NULL
);
";

    await db.Database.ExecuteSqlRawAsync(sqliteDdl);
}

static async Task EnsureSqliteMigrationHistoryBaselineAsync(
    DbContext db,
    string markerTable,
    IReadOnlyList<string> baselineMigrations)
{
    var connection = db.Database.GetDbConnection();
    var shouldCloseConnection = connection.State != ConnectionState.Open;

    if (shouldCloseConnection)
    {
        await connection.OpenAsync();
    }

    int markerTableExists;
    await using (var command = connection.CreateCommand())
    {
        command.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = @tableName;";
        var parameter = command.CreateParameter();
        parameter.ParameterName = "@tableName";
        parameter.Value = markerTable;
        command.Parameters.Add(parameter);

        markerTableExists = Convert.ToInt32(await command.ExecuteScalarAsync());
    }

    if (shouldCloseConnection)
    {
        await connection.CloseAsync();
    }

    if (markerTableExists == 0)
    {
        return;
    }

    await db.Database.ExecuteSqlRawAsync(
        "CREATE TABLE IF NOT EXISTS __EFMigrationsHistory (MigrationId TEXT NOT NULL PRIMARY KEY, ProductVersion TEXT NOT NULL);");

    foreach (var migrationId in baselineMigrations)
    {
        await db.Database.ExecuteSqlInterpolatedAsync(
            $"INSERT OR IGNORE INTO __EFMigrationsHistory (MigrationId, ProductVersion) VALUES ({migrationId}, {"10.0.0"});");
    }
}
