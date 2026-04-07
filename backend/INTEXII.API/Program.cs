using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using INTEXII.API.Data;
using INTEXII.API.Infrastructure;
using Microsoft.AspNetCore.Authentication.Google;
using Scalar.AspNetCore;
using Swashbuckle.AspNetCore.SwaggerUI;

var builder = WebApplication.CreateBuilder(args);

// Load secrets file (not committed to git — holds Google OAuth credentials, admin password, etc.)
// VIDEO NOTE: Show appsettings.Secrets.json exists locally but is listed in .gitignore.
// On Azure, these values are set as App Service environment variables instead.
builder.Configuration.AddJsonFile("appsettings.Secrets.json", optional: true, reloadOnChange: false);

const string FrontendCorsPolicy = "FrontendClient";
const string DefaultFrontendUrl = "http://localhost:3000";
var frontendUrl = builder.Configuration["FrontendUrl"] ?? DefaultFrontendUrl;
var googleClientId = builder.Configuration["Authentication:Google:ClientId"];
var googleClientSecret = builder.Configuration["Authentication:Google:ClientSecret"];

// -----------------------------------------------------------------------
// Services
// -----------------------------------------------------------------------

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

// Identity database (SQLite — local and Azure deployment)
// VIDEO NOTE: Show INTEXII.Identity.sqlite was created by EF migration.
builder.Services.AddDbContext<AuthIdentityDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("IdentityConnection")));

// Operational database
// Local dev: SQLite (INTEXIIdb.sqlite)
// Azure production: swap to SqlServer — change connection string + swap UseSqlite → UseSqlServer
// VIDEO NOTE: Show the connection string in appsettings.json points to the local SQLite file.
// On Azure, set the IntexConnection App Service env variable to the Azure SQL connection string.
builder.Services.AddDbContext<IntexDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("IntexConnection")));

// ASP.NET Identity with role support, backed by the identity SQLite DB
builder.Services.AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AuthIdentityDbContext>();

// Google OAuth (only registered when credentials are present in config/secrets)
// VIDEO NOTE: Show the Google sign-in button in the UI, click it, complete the OAuth flow.
if (!string.IsNullOrEmpty(googleClientId) && !string.IsNullOrEmpty(googleClientSecret))
{
    builder.Services.AddAuthentication()
        .AddGoogle(options =>
        {
            options.ClientId = googleClientId;
            options.ClientSecret = googleClientSecret;
            options.SignInScheme = IdentityConstants.ExternalScheme;
            options.CallbackPath = "/signin-google";
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

// Password policy — 14-char minimum, no complexity requirements
// VIDEO NOTE: Attempt to register with a short password; show the 400 error response.
// This matches the lab implementation (NOT the Microsoft docs defaults).
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
// Show HttpOnly=true, Secure=true, SameSite=Lax, Expires=7 days from now.
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Lax;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
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
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "INTEXII API");
    });
    app.MapOpenApi();
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
