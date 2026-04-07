using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class AdminUsersController(UserManager<ApplicationUser> userManager, IntexDbContext intexDb) : ControllerBase
{
    private static readonly string[] AssignableRoles = [AuthRoles.Admin, AuthRoles.Donor];

    [HttpGet]
    public async Task<IActionResult> ListUsers([FromQuery] string? search = null)
    {
        var users = await userManager.Users
            .AsNoTracking()
            .OrderBy(u => u.Email)
            .ToListAsync();

        var supportersByEmail = await BuildSupportersByEmailAsync(users.Select(u => u.Email));

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLowerInvariant();
            users = users
                .Where(user =>
                {
                    var supporter = ResolveSupporterByEmail(supportersByEmail, user.Email);
                    return MatchesSearchTerm(term, user.Email, supporter);
                })
                .ToList();
        }

        var donationSummaries = await BuildDonationSummariesBySupporterIdAsync(supportersByEmail.Values.Select(s => s.SupporterId));

        var result = new List<AdminUserSummaryDto>(users.Count);
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            var loginProviders = await GetExternalLoginProvidersAsync(user);
            var hasLocalPassword = await userManager.HasPasswordAsync(user);
            var isExternalOnly = loginProviders.Length > 0 && !hasLocalPassword;
            var supporter = ResolveSupporterByEmail(supportersByEmail, user.Email);
            var donationSummary = ResolveDonationSummary(donationSummaries, supporter?.SupporterId);

            result.Add(new AdminUserSummaryDto(
                user.Id,
                user.Email,
                user.UserName,
                BuildPreferredDisplayName(supporter, user.UserName, user.Email),
                user.EmailConfirmed,
                user.TwoFactorEnabled,
                user.LockoutEnd,
                roles.OrderBy(r => r).ToArray(),
                hasLocalPassword,
                isExternalOnly,
                loginProviders,
                supporter?.SupporterType,
                donationSummary.TotalDonationCount,
                donationSummary.TotalMonetaryAmount,
                donationSummary.TotalEstimatedValue
            ));
        }

        return Ok(result);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var users = await userManager.Users.AsNoTracking().ToListAsync();

        var totalUsers = users.Count;
        var usersWithMfa = users.Count(u => u.TwoFactorEnabled);
        var admins = 0;
        var donors = 0;

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            if (roles.Contains(AuthRoles.Admin))
            {
                admins++;
            }

            if (roles.Contains(AuthRoles.Donor))
            {
                donors++;
            }
        }

        return Ok(new AdminUserSummaryMetricsDto(totalUsers, admins, donors, usersWithMfa));
    }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUserById(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var roles = await userManager.GetRolesAsync(user);
        var loginProviders = await GetExternalLoginProvidersAsync(user);
        var hasLocalPassword = await userManager.HasPasswordAsync(user);
        var isExternalOnly = loginProviders.Length > 0 && !hasLocalPassword;
        var recoveryCodesLeft = user.TwoFactorEnabled
            ? await userManager.CountRecoveryCodesAsync(user)
            : 0;

        var supporter = await FindSupporterByEmailAsync(user.Email);
        var donationSummary = EmptyDonationSummary();
        var recentDonations = Array.Empty<RecentDonationDto>();

        if (supporter is not null)
        {
            var donations = await intexDb.Donations
                .AsNoTracking()
                .Where(d => d.SupporterId == supporter.SupporterId)
                .OrderByDescending(d => d.DonationDate)
                .Take(50)
                .ToListAsync();

            donationSummary = BuildDonationSummaryFromDonations(donations);
            recentDonations = donations
                .Take(3)
                .Select(d => new RecentDonationDto(
                    d.DonationId,
                    d.DonationDate,
                    d.DonationType,
                    d.ChannelSource,
                    d.CampaignName,
                    d.Amount,
                    d.EstimatedValue,
                    d.CurrencyCode
                ))
                .ToArray();
        }

        var response = new AdminUserDetailDto(
            user.Id,
            user.Email,
            user.UserName,
            BuildPreferredDisplayName(supporter, user.UserName, user.Email),
            user.EmailConfirmed,
            user.TwoFactorEnabled,
            user.LockoutEnd,
            roles.OrderBy(r => r).ToArray(),
            hasLocalPassword,
            isExternalOnly,
            loginProviders,
            user.AccessFailedCount,
            recoveryCodesLeft,
            supporter is null ? null : new SupporterDetailDto(
                supporter.SupporterId,
                supporter.SupporterType,
                supporter.DisplayName,
                supporter.OrganizationName,
                supporter.FirstName,
                supporter.LastName,
                supporter.RelationshipType,
                supporter.Region,
                supporter.Country,
                supporter.Email,
                supporter.Phone,
                supporter.Status,
                supporter.CreatedAt,
                supporter.FirstDonationDate,
                supporter.AcquisitionChannel
            ),
            donationSummary,
            recentDonations
        );

        return Ok(response);
    }

    [HttpPost]
    public async Task<IActionResult> CreateUser([FromBody] AdminCreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var normalizedEmail = NormalizeEmail(request.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return BadRequest(new { message = "A valid email is required." });
        }

        var existingUser = await userManager.FindByEmailAsync(normalizedEmail);
        if (existingUser is not null)
        {
            return BadRequest(new { message = "An account with this email already exists." });
        }

        var user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            EmailConfirmed = true
        };

        var createResult = await userManager.CreateAsync(user, request.Password);
        if (!createResult.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(createResult)));
        }

        var rolesToAssign = new List<string> { AuthRoles.Donor };
        if (request.MakeAdmin)
        {
            rolesToAssign.Add(AuthRoles.Admin);
        }

        var roleResult = await userManager.AddToRolesAsync(user, rolesToAssign);
        if (!roleResult.Succeeded)
        {
            await userManager.DeleteAsync(user);
            return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(roleResult)));
        }

        await EnsureSupporterRecordAsync(
            normalizedEmail,
            request.FirstName,
            request.LastName,
            request.DisplayName);

        var createdRoles = await userManager.GetRolesAsync(user);
        return Ok(new AdminCreateUserResponseDto(user.Id, user.Email, createdRoles.OrderBy(role => role).ToArray()));
    }

    [HttpPut("{userId}/profile")]
    public async Task<IActionResult> UpdateProfile(string userId, [FromBody] AdminUpdateProfileRequest request)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var normalizedEmail = NormalizeEmail(user.Email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return BadRequest(new { message = "User does not have a valid email for supporter sync." });
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
            supporter.DisplayName = BuildPreferredDisplayName(supporter, user.UserName, user.Email);
        }

        await intexDb.SaveChangesAsync();

        return Ok(new AdminProfileUpdateResponseDto(
            supporter.FirstName,
            supporter.LastName,
            supporter.DisplayName));
    }

    [HttpPost("{userId}/password")]
    public async Task<IActionResult> ResetPassword(string userId, [FromBody] AdminResetPasswordRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.NewPassword))
        {
            return BadRequest(new { message = "newPassword is required." });
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (await IsExternalOnlyAccountAsync(user))
        {
            return BadRequest(new
            {
                message = "Password reset is unavailable for external-only accounts."
            });
        }

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var resetResult = await userManager.ResetPasswordAsync(user, resetToken, request.NewPassword);
        if (!resetResult.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(resetResult)));
        }

        return Ok(new { message = "Password reset successfully." });
    }

    [HttpPost("{userId}/mfa/reset")]
    public async Task<IActionResult> ResetMfa(string userId)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        if (await IsExternalOnlyAccountAsync(user))
        {
            return BadRequest(new
            {
                message = "MFA reset is unavailable for external-only accounts."
            });
        }

        await userManager.ResetAuthenticatorKeyAsync(user);

        var disableResult = await userManager.SetTwoFactorEnabledAsync(user, false);
        if (!disableResult.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(disableResult)));
        }

        return Ok(new { message = "MFA reset successfully. User must configure MFA again." });
    }

    [HttpPut("{userId}/roles")]
    public async Task<IActionResult> UpdateRoles(string userId, [FromBody] AdminUpdateRolesRequest request)
    {
        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var requestedRoles = (request.Roles ?? Array.Empty<string>())
            .Where(role => !string.IsNullOrWhiteSpace(role))
            .Select(role => role.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (requestedRoles.Length == 0)
        {
            return BadRequest(new { message = "At least one role must be assigned." });
        }

        if (!requestedRoles.Contains(AuthRoles.Donor, StringComparer.OrdinalIgnoreCase))
        {
            requestedRoles = requestedRoles.Concat([AuthRoles.Donor]).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        }

        var invalidRoles = requestedRoles
            .Where(role => !AssignableRoles.Contains(role, StringComparer.OrdinalIgnoreCase))
            .ToArray();

        if (invalidRoles.Length > 0)
        {
            return BadRequest(new { message = $"Invalid roles: {string.Join(", ", invalidRoles)}." });
        }

        var currentRoles = await userManager.GetRolesAsync(user);
        var currentlyAdmin = currentRoles.Contains(AuthRoles.Admin, StringComparer.OrdinalIgnoreCase);
        var requestedAdmin = requestedRoles.Contains(AuthRoles.Admin, StringComparer.OrdinalIgnoreCase);

        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.Equals(currentUserId, userId, StringComparison.Ordinal) && currentlyAdmin && !requestedAdmin)
        {
            return BadRequest(new { message = "You cannot remove your own Admin role." });
        }

        if (currentlyAdmin && !requestedAdmin)
        {
            var adminUsers = await userManager.GetUsersInRoleAsync(AuthRoles.Admin);
            if (adminUsers.Count <= 1)
            {
                return BadRequest(new { message = "At least one Admin account must remain assigned." });
            }
        }

        var rolesToRemove = currentRoles.Except(requestedRoles, StringComparer.OrdinalIgnoreCase).ToArray();
        if (rolesToRemove.Length > 0)
        {
            var removeResult = await userManager.RemoveFromRolesAsync(user, rolesToRemove);
            if (!removeResult.Succeeded)
            {
                return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(removeResult)));
            }
        }

        var rolesToAdd = requestedRoles.Except(currentRoles, StringComparer.OrdinalIgnoreCase).ToArray();
        if (rolesToAdd.Length > 0)
        {
            var addResult = await userManager.AddToRolesAsync(user, rolesToAdd);
            if (!addResult.Succeeded)
            {
                return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(addResult)));
            }
        }

        var updatedRoles = await userManager.GetRolesAsync(user);
        return Ok(new AdminRoleUpdateResponseDto(updatedRoles.OrderBy(role => role).ToArray()));
    }

    [HttpDelete("{userId}")]
    public async Task<IActionResult> DeleteUser(string userId)
    {
        var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.Equals(currentUserId, userId, StringComparison.Ordinal))
        {
            return BadRequest(new { message = "You cannot delete your own account." });
        }

        var user = await userManager.FindByIdAsync(userId);
        if (user is null)
        {
            return NotFound(new { message = "User not found." });
        }

        var deleteResult = await userManager.DeleteAsync(user);
        if (!deleteResult.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(deleteResult)));
        }

        return Ok(new { message = "User deleted successfully." });
    }

    private async Task<Dictionary<string, Supporter>> BuildSupportersByEmailAsync(IEnumerable<string?> emails)
    {
        var normalizedEmails = emails
            .Select(NormalizeEmail)
            .Where(email => !string.IsNullOrWhiteSpace(email))
            .Distinct()
            .ToList();

        if (normalizedEmails.Count == 0)
        {
            return new Dictionary<string, Supporter>();
        }

        var supporters = await intexDb.Supporters
            .AsNoTracking()
            .Where(s => s.Email != null && normalizedEmails.Contains(s.Email.ToLower()))
            .ToListAsync();

        return supporters
            .Where(s => !string.IsNullOrWhiteSpace(s.Email))
            .GroupBy(s => NormalizeEmail(s.Email)!)
            .ToDictionary(group => group.Key, group => group.First());
    }

    private async Task<Dictionary<int, DonationSummaryDto>> BuildDonationSummariesBySupporterIdAsync(IEnumerable<int> supporterIds)
    {
        var distinctIds = supporterIds.Distinct().ToArray();
        if (distinctIds.Length == 0)
        {
            return new Dictionary<int, DonationSummaryDto>();
        }

        var donations = await intexDb.Donations
            .AsNoTracking()
            .Where(d => d.SupporterId != null && distinctIds.Contains(d.SupporterId.Value))
            .ToListAsync();

        return donations
            .Where(d => d.SupporterId != null)
            .GroupBy(d => d.SupporterId!.Value)
            .ToDictionary(group => group.Key, BuildDonationSummaryFromDonations);
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

    private static DonationSummaryDto BuildDonationSummaryFromDonations(IEnumerable<Donation> donations)
    {
        var donationList = donations.ToList();

        return new DonationSummaryDto(
            donationList.Count,
            donationList.Sum(d => d.Amount ?? 0m),
            donationList.Sum(d => d.EstimatedValue ?? 0m),
            donationList
                .Where(d => d.DonationDate != null)
                .Select(d => d.DonationDate)
                .OrderByDescending(d => d)
                .FirstOrDefault()
        );
    }

    private static DonationSummaryDto ResolveDonationSummary(
        IReadOnlyDictionary<int, DonationSummaryDto> donationSummaries,
        int? supporterId)
    {
        if (supporterId is null)
        {
            return EmptyDonationSummary();
        }

        return donationSummaries.TryGetValue(supporterId.Value, out var summary)
            ? summary
            : EmptyDonationSummary();
    }

    private static Supporter? ResolveSupporterByEmail(
        IReadOnlyDictionary<string, Supporter> supportersByEmail,
        string? email)
    {
        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return null;
        }

        return supportersByEmail.TryGetValue(normalizedEmail, out var supporter)
            ? supporter
            : null;
    }

    private static DonationSummaryDto EmptyDonationSummary()
    {
        return new DonationSummaryDto(0, 0m, 0m, null);
    }

    private async Task EnsureSupporterRecordAsync(
        string email,
        string? firstName,
        string? lastName,
        string? displayName)
    {
        var normalizedEmail = NormalizeEmail(email)!;

        var supporter = await intexDb.Supporters
            .FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);

        var first = NormalizeNullable(firstName);
        var last = NormalizeNullable(lastName);
        var preferred = NormalizeNullable(displayName);

        if (supporter is null)
        {
            intexDb.Supporters.Add(new Supporter
            {
                Email = normalizedEmail,
                SupporterType = "Individual",
                FirstName = first,
                LastName = last,
                DisplayName = !string.IsNullOrWhiteSpace(preferred)
                    ? preferred
                    : BuildPreferredDisplayName(first, last, normalizedEmail),
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            });

            await intexDb.SaveChangesAsync();
            return;
        }

        supporter.FirstName = first ?? supporter.FirstName;
        supporter.LastName = last ?? supporter.LastName;
        supporter.DisplayName = !string.IsNullOrWhiteSpace(preferred)
            ? preferred
            : (string.IsNullOrWhiteSpace(supporter.DisplayName)
                ? BuildPreferredDisplayName(supporter.FirstName, supporter.LastName, normalizedEmail)
                : supporter.DisplayName);

        await intexDb.SaveChangesAsync();
    }

    private static string BuildPreferredDisplayName(
        Supporter? supporter,
        string? userName,
        string? email)
    {
        if (supporter is not null && !string.IsNullOrWhiteSpace(supporter.DisplayName))
        {
            return supporter.DisplayName.Trim();
        }

        var first = supporter?.FirstName;
        var last = supporter?.LastName;
        return BuildPreferredDisplayName(first, last, userName ?? email ?? "User");
    }

    private static string BuildPreferredDisplayName(string? firstName, string? lastName, string fallback)
    {
        var combined = $"{firstName ?? string.Empty} {lastName ?? string.Empty}".Trim();
        if (!string.IsNullOrWhiteSpace(combined))
        {
            return combined;
        }

        return string.IsNullOrWhiteSpace(fallback) ? "User" : fallback.Trim();
    }

    private static string? NormalizeNullable(string? value)
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }

    private static string? NormalizeEmail(string? email)
    {
        return string.IsNullOrWhiteSpace(email)
            ? null
            : email.Trim().ToLowerInvariant();
    }

    private static Dictionary<string, string[]> ToValidationErrors(IdentityResult result)
    {
        return result.Errors
            .GroupBy(error => string.IsNullOrWhiteSpace(error.Code) ? "Identity" : error.Code)
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray());
    }

    private async Task<bool> IsExternalOnlyAccountAsync(ApplicationUser user)
    {
        var hasLocalPassword = await userManager.HasPasswordAsync(user);
        var loginProviders = await GetExternalLoginProvidersAsync(user);
        return loginProviders.Length > 0 && !hasLocalPassword;
    }

    private async Task<string[]> GetExternalLoginProvidersAsync(ApplicationUser user)
    {
        var externalLogins = await userManager.GetLoginsAsync(user);
        return externalLogins
            .Select(login => login.LoginProvider)
            .Where(provider => !string.IsNullOrWhiteSpace(provider))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .OrderBy(provider => provider)
            .ToArray();
    }

    private static bool MatchesSearchTerm(string term, string? email, Supporter? supporter)
    {
        if (!string.IsNullOrWhiteSpace(email) && email.ToLower().Contains(term))
        {
            return true;
        }

        if (supporter is null)
        {
            return false;
        }

        var displayName = supporter.DisplayName?.ToLower();
        var combinedName = $"{supporter.FirstName ?? string.Empty} {supporter.LastName ?? string.Empty}".Trim().ToLower();

        return (!string.IsNullOrWhiteSpace(displayName) && displayName.Contains(term))
            || (!string.IsNullOrWhiteSpace(combinedName) && combinedName.Contains(term));
    }

    public sealed record AdminResetPasswordRequest(string NewPassword);

    public sealed record AdminUpdateRolesRequest(string[] Roles);

    public sealed record AdminRoleUpdateResponseDto(string[] Roles);

    public sealed record AdminUserSummaryDto(
        string Id,
        string? Email,
        string? UserName,
        string PreferredDisplayName,
        bool EmailConfirmed,
        bool IsTwoFactorEnabled,
        DateTimeOffset? LockoutEnd,
        string[] Roles,
        bool HasLocalPassword,
        bool IsExternalOnly,
        string[] ExternalLoginProviders,
        string? SupporterType,
        int TotalDonationCount,
        decimal TotalMonetaryAmount,
        decimal TotalEstimatedValue);

    public sealed record AdminUserSummaryMetricsDto(
        int TotalUsers,
        int Admins,
        int Donors,
        int UsersWithMfa);

    public sealed record AdminUserDetailDto(
        string Id,
        string? Email,
        string? UserName,
        string PreferredDisplayName,
        bool EmailConfirmed,
        bool IsTwoFactorEnabled,
        DateTimeOffset? LockoutEnd,
        string[] Roles,
        bool HasLocalPassword,
        bool IsExternalOnly,
        string[] ExternalLoginProviders,
        int AccessFailedCount,
        int RecoveryCodesLeft,
        SupporterDetailDto? Supporter,
        DonationSummaryDto DonationSummary,
        RecentDonationDto[] RecentDonations);

    public sealed record SupporterDetailDto(
        int SupporterId,
        string? SupporterType,
        string? DisplayName,
        string? OrganizationName,
        string? FirstName,
        string? LastName,
        string? RelationshipType,
        string? Region,
        string? Country,
        string? Email,
        string? Phone,
        string? Status,
        DateTime? CreatedAt,
        DateOnly? FirstDonationDate,
        string? AcquisitionChannel);

    public sealed record DonationSummaryDto(
        int TotalDonationCount,
        decimal TotalMonetaryAmount,
        decimal TotalEstimatedValue,
        DateOnly? LastDonationDate);

    public sealed record RecentDonationDto(
        int DonationId,
        DateOnly? DonationDate,
        string? DonationType,
        string? ChannelSource,
        string? CampaignName,
        decimal? Amount,
        decimal? EstimatedValue,
        string? CurrencyCode);

    public sealed record AdminCreateUserRequest(
        string Email,
        string Password,
        string? FirstName,
        string? LastName,
        string? DisplayName,
        bool MakeAdmin);

    public sealed record AdminCreateUserResponseDto(
        string UserId,
        string? Email,
        string[] Roles);

    public sealed record AdminUpdateProfileRequest(
        string? FirstName,
        string? LastName,
        string? DisplayName);

    public sealed record AdminProfileUpdateResponseDto(
        string? FirstName,
        string? LastName,
        string? DisplayName);
}
