using System.Security.Claims;
using System.IdentityModel.Tokens.Jwt;
using System.Text.Encodings.Web;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.IdentityModel.Tokens;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(
    UserManager<ApplicationUser> userManager,
    SignInManager<ApplicationUser> signInManager,
    IConfiguration configuration,
    IntexDbContext intexDb) : ControllerBase
{
    private const string DefaultFrontendUrl = "http://localhost:3000";
    private const string DefaultExternalReturnPath = "/dashboard";
    private const string AuthTokenQueryKey = "authToken";

    public sealed record TokenLoginRequest(
        string Email,
        string Password,
        string? TwoFactorCode,
        string? TwoFactorRecoveryCode);

    /// <summary>
    /// Returns the current authenticated session info.
    /// Public endpoint — returns isAuthenticated: false for anonymous users.
    /// VIDEO NOTE: Show this in Swagger. Unauthenticated → isAuthenticated: false.
    /// After login → isAuthenticated: true with email and roles array.
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentSession()
    {
        if (User.Identity?.IsAuthenticated != true)
        {
            return Ok(new
            {
                isAuthenticated = false,
                displayName = (string?)null,
                userName = (string?)null,
                email = (string?)null,
                hasLocalPassword = false,
                isExternalOnly = false,
                externalLoginProviders = Array.Empty<string>(),
                roles = Array.Empty<string>()
            });
        }

        var user = await userManager.GetUserAsync(User);
        var externalLogins = user is null
            ? Array.Empty<UserLoginInfo>()
            : (await userManager.GetLoginsAsync(user)).ToArray();
        var externalLoginProviders = externalLogins
            .Select(login => login.LoginProvider)
            .Where(provider => !string.IsNullOrWhiteSpace(provider))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(provider => provider)
            .ToArray();
        var hasLocalPassword = user is not null && await userManager.HasPasswordAsync(user);
        var isExternalOnly = externalLoginProviders.Length > 0 && !hasLocalPassword;
        var supporter = await FindSupporterByEmailAsync(user?.Email);
        var roles = User.Claims
            .Where(c => c.Type == ClaimTypes.Role)
            .Select(c => c.Value)
            .Distinct()
            .OrderBy(r => r)
            .ToArray();

        var displayName = BuildPreferredDisplayName(
            supporter,
            user?.UserName,
            user?.Email);

        return Ok(new
        {
            isAuthenticated = true,
            displayName,
            userName = user?.UserName ?? User.Identity?.Name,
            email = user?.Email,
            hasLocalPassword,
            isExternalOnly,
            externalLoginProviders,
            roles
        });
    }

    /// <summary>
    /// Lists available OAuth providers (Google when configured).
    /// VIDEO NOTE: Show this returns [{name:"Google",displayName:"Google"}] when secrets are set.
    /// </summary>
    [HttpGet("providers")]
    public IActionResult GetExternalProviders()
    {
        var providers = new List<object>();

        if (IsGoogleConfigured())
        {
            providers.Add(new
            {
                name = GoogleDefaults.AuthenticationScheme,
                displayName = "Google"
            });
        }

        return Ok(providers);
    }

    /// <summary>
    /// Initiates Google OAuth flow.
    /// VIDEO NOTE: Navigate to this URL in the browser — it redirects to Google sign-in.
    /// </summary>
    [HttpGet("external-login")]
    public IActionResult ExternalLogin(
        [FromQuery] string provider,
        [FromQuery] string? returnPath = null)
    {
        if (!string.Equals(provider, GoogleDefaults.AuthenticationScheme, StringComparison.OrdinalIgnoreCase)
            || !IsGoogleConfigured())
        {
            return BadRequest(new { message = "The requested external login provider is not available." });
        }

        var callbackUrl = Url.Action(nameof(ExternalLoginCallback), new
        {
            returnPath = NormalizeReturnPath(returnPath)
        });

        if (string.IsNullOrWhiteSpace(callbackUrl))
        {
            return Problem("Unable to generate the external login callback URL.");
        }

        var properties = signInManager.ConfigureExternalAuthenticationProperties(
            GoogleDefaults.AuthenticationScheme,
            callbackUrl);

        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    /// <summary>
    /// Handles the Google OAuth callback. Creates a local account if none exists.
    /// VIDEO NOTE: After Google sign-in, the browser is redirected here then back to the frontend.
    /// </summary>
    [HttpGet("external-callback")]
    public async Task<IActionResult> ExternalLoginCallback(
        [FromQuery] string? returnPath = null,
        [FromQuery] string? remoteError = null)
    {
        if (!string.IsNullOrWhiteSpace(remoteError))
        {
            return Redirect(BuildFrontendErrorUrl("External login failed."));
        }

        var info = await signInManager.GetExternalLoginInfoAsync();
        if (info is null)
        {
            return Redirect(BuildFrontendErrorUrl("External login information was unavailable."));
        }

        var signInResult = await signInManager.ExternalLoginSignInAsync(
            info.LoginProvider,
            info.ProviderKey,
            isPersistent: false,
            bypassTwoFactor: true);

        var externalFirstName = info.Principal.FindFirstValue(ClaimTypes.GivenName)
            ?? info.Principal.FindFirstValue("given_name");
        var externalLastName = info.Principal.FindFirstValue(ClaimTypes.Surname)
            ?? info.Principal.FindFirstValue("family_name");

        if (signInResult.Succeeded)
        {
            var existingUser = await userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);
            if (existingUser is not null)
            {
                await EnsureDonorRoleAndSupporterSyncAsync(existingUser, externalFirstName, externalLastName);

                var accessToken = await BuildAccessTokenAsync(existingUser);
                return Redirect(BuildFrontendSuccessUrl(returnPath, accessToken));
            }

            return Redirect(BuildFrontendSuccessUrl(returnPath));
        }

        var email = info.Principal.FindFirstValue(ClaimTypes.Email)
            ?? info.Principal.FindFirstValue("email");

        if (string.IsNullOrWhiteSpace(email))
        {
            return Redirect(BuildFrontendErrorUrl("The external provider did not return an email address."));
        }

        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(user);
            if (!createResult.Succeeded)
            {
                return Redirect(BuildFrontendErrorUrl("Unable to create a local account for the external login."));
            }
        }

        var addLoginResult = await userManager.AddLoginAsync(user, info);
        if (!addLoginResult.Succeeded)
        {
            return Redirect(BuildFrontendErrorUrl("Unable to associate the external login with the local account."));
        }

        await EnsureDonorRoleAndSupporterSyncAsync(user, externalFirstName, externalLastName, email);

        await signInManager.SignInAsync(user, isPersistent: false, info.LoginProvider);
        var newAccessToken = await BuildAccessTokenAsync(user);
        return Redirect(BuildFrontendSuccessUrl(returnPath, newAccessToken));
    }

    [HttpPost("token-login")]
    public async Task<IActionResult> TokenLogin([FromBody] TokenLoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var normalizedEmail = request.Email.Trim();
        var user = await userManager.FindByEmailAsync(normalizedEmail);
        if (user is null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var result = await signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        var twoFactorEnabled = await userManager.GetTwoFactorEnabledAsync(user);
        if (twoFactorEnabled)
        {
            if (!string.IsNullOrWhiteSpace(request.TwoFactorCode))
            {
                var normalizedCode = NormalizeAuthenticatorCode(request.TwoFactorCode);
                var isValidCode = await userManager.VerifyTwoFactorTokenAsync(
                    user,
                    TokenOptions.DefaultAuthenticatorProvider,
                    normalizedCode);

                if (!isValidCode)
                {
                    return BadRequest(new { message = "Invalid authenticator code." });
                }
            }
            else if (!string.IsNullOrWhiteSpace(request.TwoFactorRecoveryCode))
            {
                var recoveryResult = await userManager.RedeemTwoFactorRecoveryCodeAsync(
                    user,
                    request.TwoFactorRecoveryCode.Trim());

                if (!recoveryResult.Succeeded)
                {
                    return BadRequest(new { message = "Invalid recovery code." });
                }
            }
            else
            {
                return BadRequest(new
                {
                    message = "Two-factor authentication is required for this account. Enter an authenticator code or recovery code."
                });
            }
        }

        var accessToken = await BuildAccessTokenAsync(user);
        return Ok(new
        {
            accessToken,
            tokenType = "Bearer",
            expiresInSeconds = 60 * 60 * 24 * 7
        });
    }

    /// <summary>
    /// Logs out the current user.
    /// Requires authentication cookie (no [Authorize] attribute needed — SignOutAsync is safe to call always).
    /// </summary>
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await signInManager.SignOutAsync();
        return Ok(new { message = "Logout successful." });
    }

    [Authorize]
    [HttpPost("manage/info")]
    public async Task<IActionResult> ManageInfo([FromBody] ManageInfoRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(new { message = "You must be signed in." });
        }

        if (string.IsNullOrWhiteSpace(request.OldPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "Both oldPassword and newPassword are required." });
        }

        var result = await userManager.ChangePasswordAsync(user, request.OldPassword, request.NewPassword);
        if (!result.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(result)));
        }

        await signInManager.RefreshSignInAsync(user);
        return Ok(new { message = "Password updated successfully." });
    }

    [Authorize]
    [HttpGet("manage/profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(new { message = "You must be signed in." });
        }

        var supporter = await FindSupporterByEmailAsync(user.Email);
        var displayName = BuildPreferredDisplayName(supporter, user.UserName, user.Email);

        return Ok(new ManageProfileResponse(
            supporter?.FirstName,
            supporter?.LastName,
            displayName));
    }

    [Authorize]
    [HttpPut("manage/profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] ManageProfileRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(new { message = "You must be signed in." });
        }

        var normalizedEmail = NormalizeEmail(user.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return BadRequest(new { message = "Current account email is required to update profile." });
        }

        var supporter = await intexDb.Supporters
            .FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);

        if (supporter is null)
        {
            supporter = new Supporter
            {
                Email = normalizedEmail,
                SupporterType = "Individual",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            intexDb.Supporters.Add(supporter);
        }

        supporter.FirstName = NormalizeNullable(request.FirstName);
        supporter.LastName = NormalizeNullable(request.LastName);
        supporter.DisplayName = NormalizeNullable(request.DisplayName);

        if (string.IsNullOrWhiteSpace(supporter.DisplayName))
        {
            supporter.DisplayName = BuildPreferredDisplayNameFromParts(
                supporter.FirstName,
                supporter.LastName,
                normalizedEmail);
        }

        await intexDb.SaveChangesAsync();

        return Ok(new ManageProfileResponse(
            supporter.FirstName,
            supporter.LastName,
            supporter.DisplayName));
    }

    [Authorize]
    [HttpPost("manage/2fa")]
    public async Task<IActionResult> ManageTwoFactor([FromBody] ManageTwoFactorRequest request)
    {
        var user = await userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized(new { message = "You must be signed in." });
        }

        var hasLocalPassword = await userManager.HasPasswordAsync(user);
        var externalLogins = await userManager.GetLoginsAsync(user);
        var isExternalOnly = externalLogins.Count > 0 && !hasLocalPassword;

        if (isExternalOnly)
        {
            return BadRequest(new
            {
                message = "MFA is managed by your external provider for this account."
            });
        }

        if (request.ForgetMachine)
        {
            await signInManager.ForgetTwoFactorClientAsync();
        }

        var authenticatorKey = await EnsureAuthenticatorKeyAsync(user);

        if (request.ResetSharedKey)
        {
            await userManager.ResetAuthenticatorKeyAsync(user);
            authenticatorKey = await EnsureAuthenticatorKeyAsync(user);
        }

        if (request.Enable is true)
        {
            if (string.IsNullOrWhiteSpace(request.TwoFactorCode))
            {
                return BadRequest(new { message = "twoFactorCode is required when enabling MFA." });
            }

            var validCode = await userManager.VerifyTwoFactorTokenAsync(
                user,
                TokenOptions.DefaultAuthenticatorProvider,
                NormalizeAuthenticatorCode(request.TwoFactorCode));

            if (!validCode)
            {
                return BadRequest(new { message = "Invalid authenticator code." });
            }

            var enableResult = await userManager.SetTwoFactorEnabledAsync(user, true);
            if (!enableResult.Succeeded)
            {
                return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(enableResult)));
            }
        }

        if (request.Enable is false)
        {
            await userManager.ResetAuthenticatorKeyAsync(user);
            authenticatorKey = await EnsureAuthenticatorKeyAsync(user);

            var disableResult = await userManager.SetTwoFactorEnabledAsync(user, false);
            if (!disableResult.Succeeded)
            {
                return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(disableResult)));
            }
        }

        IReadOnlyList<string>? newRecoveryCodes = null;
        var isTwoFactorEnabled = await userManager.GetTwoFactorEnabledAsync(user);
        if (request.ResetRecoveryCodes)
        {
            if (!isTwoFactorEnabled)
            {
                return BadRequest(new { message = "Two-factor must be enabled before generating recovery codes." });
            }

            newRecoveryCodes = (await userManager.GenerateNewTwoFactorRecoveryCodesAsync(user, 10) ?? Array.Empty<string>()).ToArray();
        }

        await signInManager.RefreshSignInAsync(user);

        isTwoFactorEnabled = await userManager.GetTwoFactorEnabledAsync(user);
        var recoveryCodesLeft = await userManager.CountRecoveryCodesAsync(user);
        var isMachineRemembered = await signInManager.IsTwoFactorClientRememberedAsync(user);
        var authenticatorUri = BuildAuthenticatorUri(user.Email ?? user.UserName ?? "user", authenticatorKey);

        return Ok(new
        {
            sharedKey = FormatKey(authenticatorKey),
            authenticatorUri,
            recoveryCodesLeft,
            recoveryCodes = newRecoveryCodes,
            isTwoFactorEnabled,
            isMachineRemembered
        });
    }

    // ---------------------------------------------------------------------------
    // Private helpers
    // ---------------------------------------------------------------------------

    private bool IsGoogleConfigured() =>
        IsConfiguredValue(configuration["Authentication:Google:ClientId"]) &&
        IsConfiguredValue(configuration["Authentication:Google:ClientSecret"]);

    private static bool IsConfiguredValue(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return false;
        }

        return !value.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase);
    }

    private string NormalizeReturnPath(string? returnPath)
    {
        if (string.IsNullOrWhiteSpace(returnPath) || !returnPath.StartsWith('/'))
            return DefaultExternalReturnPath;
        return returnPath;
    }

    private string BuildFrontendSuccessUrl(string? returnPath, string? accessToken = null)
    {
        var frontendUrl = configuration["FrontendUrl"] ?? DefaultFrontendUrl;
        var baseUrl = $"{frontendUrl.TrimEnd('/')}/auth/callback";

        var query = new Dictionary<string, string?>
        {
            ["returnPath"] = NormalizeReturnPath(returnPath)
        };

        if (!string.IsNullOrWhiteSpace(accessToken))
        {
            query[AuthTokenQueryKey] = accessToken;
        }

        return QueryHelpers.AddQueryString(baseUrl, query!);
    }

    private string BuildFrontendErrorUrl(string errorMessage)
    {
        var frontendUrl = configuration["FrontendUrl"] ?? DefaultFrontendUrl;
        var loginUrl = $"{frontendUrl.TrimEnd('/')}/login";
        return QueryHelpers.AddQueryString(loginUrl, "externalError", errorMessage);
    }

    private static Dictionary<string, string[]> ToValidationErrors(IdentityResult result)
    {
        return result.Errors
            .GroupBy(error => string.IsNullOrWhiteSpace(error.Code) ? "Identity" : error.Code)
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray());
    }

    private async Task<string> EnsureAuthenticatorKeyAsync(ApplicationUser user)
    {
        var key = await userManager.GetAuthenticatorKeyAsync(user);
        if (!string.IsNullOrWhiteSpace(key))
        {
            return key;
        }

        await userManager.ResetAuthenticatorKeyAsync(user);
        return (await userManager.GetAuthenticatorKeyAsync(user)) ?? string.Empty;
    }

    private static string NormalizeAuthenticatorCode(string code)
    {
        return code.Replace(" ", string.Empty).Replace("-", string.Empty);
    }

    private static string FormatKey(string unformattedKey)
    {
        if (string.IsNullOrWhiteSpace(unformattedKey))
        {
            return string.Empty;
        }

        var result = new System.Text.StringBuilder();
        var currentPosition = 0;

        while (currentPosition + 4 < unformattedKey.Length)
        {
            result.Append(unformattedKey.AsSpan(currentPosition, 4)).Append(' ');
            currentPosition += 4;
        }

        if (currentPosition < unformattedKey.Length)
        {
            result.Append(unformattedKey.AsSpan(currentPosition));
        }

        return result.ToString().ToLowerInvariant();
    }

    private static string BuildAuthenticatorUri(string email, string unformattedKey)
    {
        const string issuer = "INTEXII";
        var encodedIssuer = UrlEncoder.Default.Encode(issuer);
        var encodedEmail = UrlEncoder.Default.Encode(email);
        return $"otpauth://totp/{encodedIssuer}:{encodedEmail}?secret={unformattedKey}&issuer={encodedIssuer}&digits=6";
    }

    private async Task EnsureDonorRoleAndSupporterSyncAsync(
        ApplicationUser user,
        string? firstName,
        string? lastName,
        string? emailOverride = null)
    {
        if (!await userManager.IsInRoleAsync(user, AuthRoles.Donor))
        {
            await userManager.AddToRoleAsync(user, AuthRoles.Donor);
        }

        var normalizedEmail = NormalizeEmail(emailOverride ?? user.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return;
        }

        var supporter = await intexDb.Supporters
            .FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);

        var first = string.IsNullOrWhiteSpace(firstName) ? null : firstName.Trim();
        var last = string.IsNullOrWhiteSpace(lastName) ? null : lastName.Trim();
        var preferredName = BuildPreferredDisplayNameFromParts(first, last, normalizedEmail);

        if (supporter is null)
        {
            var nextSupporterId = (await intexDb.Supporters.MaxAsync(s => (int?)s.SupporterId) ?? 0) + 1;

            intexDb.Supporters.Add(new Supporter
            {
                SupporterId = nextSupporterId,
                Email = normalizedEmail,
                SupporterType = "Individual",
                FirstName = first,
                LastName = last,
                DisplayName = preferredName,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            });

            await intexDb.SaveChangesAsync();
            return;
        }

        if (string.IsNullOrWhiteSpace(supporter.FirstName) && !string.IsNullOrWhiteSpace(first))
        {
            supporter.FirstName = first;
        }

        if (string.IsNullOrWhiteSpace(supporter.LastName) && !string.IsNullOrWhiteSpace(last))
        {
            supporter.LastName = last;
        }

        if (string.IsNullOrWhiteSpace(supporter.DisplayName))
        {
            supporter.DisplayName = BuildPreferredDisplayNameFromParts(supporter.FirstName, supporter.LastName, normalizedEmail);
        }

        if (string.IsNullOrWhiteSpace(supporter.SupporterType))
        {
            supporter.SupporterType = "Individual";
        }

        await intexDb.SaveChangesAsync();
    }

    private async Task<Supporter?> FindSupporterByEmailAsync(string? email)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return null;
        }

        return await intexDb.Supporters
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);
    }

    private static string? NormalizeEmail(string? email)
    {
        return string.IsNullOrWhiteSpace(email)
            ? null
            : email.Trim().ToLowerInvariant();
    }

    private static string? NormalizeNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }

    private static string BuildPreferredDisplayName(
        Supporter? supporter,
        string? userName,
        string? email)
    {
        if (supporter is not null)
        {
            if (!string.IsNullOrWhiteSpace(supporter.DisplayName))
            {
                return supporter.DisplayName.Trim();
            }

            var fromNames = $"{supporter.FirstName ?? string.Empty} {supporter.LastName ?? string.Empty}".Trim();
            if (!string.IsNullOrWhiteSpace(fromNames))
            {
                return fromNames;
            }
        }

        return BuildPreferredDisplayNameFromParts(null, null, userName ?? email ?? "User");
    }

    private static string BuildPreferredDisplayNameFromParts(string? firstName, string? lastName, string fallback)
    {
        if (!string.IsNullOrWhiteSpace(fallback) && string.IsNullOrWhiteSpace(firstName) && string.IsNullOrWhiteSpace(lastName))
        {
            return fallback.Trim();
        }

        var combined = $"{firstName ?? string.Empty} {lastName ?? string.Empty}".Trim();
        if (!string.IsNullOrWhiteSpace(combined))
        {
            return combined;
        }

        return string.IsNullOrWhiteSpace(fallback) ? "User" : fallback.Trim();
    }

    private async Task<string> BuildAccessTokenAsync(ApplicationUser user)
    {
        var key = configuration["Authentication:Jwt:SigningKey"];
        if (string.IsNullOrWhiteSpace(key))
        {
            key = "INTEXII_Fallback_JwtSigningKey_Replace_In_Azure_AppSettings_2026";
        }

        var issuer = configuration["Authentication:Jwt:Issuer"] ?? "INTEXII.API";
        var audience = configuration["Authentication:Jwt:Audience"] ?? "INTEXII.Frontend";
        var roles = await userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.UniqueName, user.UserName ?? user.Email ?? user.Id),
            new(ClaimTypes.NameIdentifier, user.Id)
        };

        if (!string.IsNullOrWhiteSpace(user.UserName))
        {
            claims.Add(new Claim(ClaimTypes.Name, user.UserName));
        }

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var credentials = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            notBefore: DateTime.UtcNow,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public sealed record ManageInfoRequest(string OldPassword, string NewPassword);

    public sealed record ManageProfileRequest(
        string? FirstName,
        string? LastName,
        string? DisplayName);

    public sealed record ManageProfileResponse(
        string? FirstName,
        string? LastName,
        string DisplayName);

    public sealed record ManageTwoFactorRequest(
        bool? Enable,
        string? TwoFactorCode,
        bool ResetSharedKey = false,
        bool ResetRecoveryCodes = false,
        bool ForgetMachine = false);
}
