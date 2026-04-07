using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using INTEXII.API.Data;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/admin/users")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class AdminUsersController(UserManager<ApplicationUser> userManager) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> ListUsers([FromQuery] string? search = null)
    {
        var query = userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim().ToLower();
            query = query.Where(u =>
                (u.Email != null && u.Email.ToLower().Contains(term)) ||
                (u.UserName != null && u.UserName.ToLower().Contains(term)));
        }

        var users = query
            .OrderBy(u => u.Email)
            .ToList();

        var result = new List<object>(users.Count);
        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            result.Add(new
            {
                id = user.Id,
                email = user.Email,
                userName = user.UserName,
                emailConfirmed = user.EmailConfirmed,
                isTwoFactorEnabled = user.TwoFactorEnabled,
                lockoutEnd = user.LockoutEnd,
                roles = roles.OrderBy(r => r).ToArray()
            });
        }

        return Ok(result);
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var users = userManager.Users.ToList();

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

        return Ok(new
        {
            totalUsers,
            admins,
            donors,
            usersWithMfa
        });
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
        var recoveryCodesLeft = user.TwoFactorEnabled
            ? await userManager.CountRecoveryCodesAsync(user)
            : 0;

        return Ok(new
        {
            id = user.Id,
            email = user.Email,
            userName = user.UserName,
            emailConfirmed = user.EmailConfirmed,
            isTwoFactorEnabled = user.TwoFactorEnabled,
            accessFailedCount = user.AccessFailedCount,
            lockoutEnd = user.LockoutEnd,
            recoveryCodesLeft,
            roles = roles.OrderBy(r => r).ToArray()
        });
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

        await userManager.ResetAuthenticatorKeyAsync(user);

        var disableResult = await userManager.SetTwoFactorEnabledAsync(user, false);
        if (!disableResult.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(ToValidationErrors(disableResult)));
        }

        return Ok(new { message = "MFA reset successfully. User must configure MFA again." });
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

    private static Dictionary<string, string[]> ToValidationErrors(IdentityResult result)
    {
        return result.Errors
            .GroupBy(error => string.IsNullOrWhiteSpace(error.Code) ? "Identity" : error.Code)
            .ToDictionary(group => group.Key, group => group.Select(error => error.Description).ToArray());
    }

    public sealed record AdminResetPasswordRequest(string NewPassword);
}
