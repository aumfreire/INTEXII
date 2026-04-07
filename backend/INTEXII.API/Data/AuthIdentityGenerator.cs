using Microsoft.AspNetCore.Identity;

namespace INTEXII.API.Data;

public class AuthIdentityGenerator
{
    public static async Task GenerateDefaultIdentityAsync(
        IServiceProvider serviceProvider,
        IConfiguration configuration)
    {
        var userManager = serviceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();

        // Ensure all roles exist
        foreach (var roleName in new[] { AuthRoles.Admin, AuthRoles.Donor })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                var result = await roleManager.CreateAsync(new IdentityRole(roleName));
                if (!result.Succeeded)
                {
                    throw new Exception(
                        $"Failed to create role '{roleName}': {string.Join(", ", result.Errors.Select(e => e.Description))}");
                }
            }
        }

        // Seed default admin user from config (credentials stored in appsettings.Secrets.json)
        var adminSection = configuration.GetSection("GenerateDefaultIdentityAdmin");
        var adminEmail = adminSection["Email"] ?? "admin@intex.local";
        var adminPassword = adminSection["Password"] ?? throw new Exception(
            "Admin password must be set in GenerateDefaultIdentityAdmin:Password (appsettings.Secrets.json)");

        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var createResult = await userManager.CreateAsync(adminUser, adminPassword);
            if (!createResult.Succeeded)
            {
                throw new Exception(
                    $"Failed to create admin user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
            }
        }

        if (!await userManager.IsInRoleAsync(adminUser, AuthRoles.Admin))
        {
            var addRoleResult = await userManager.AddToRoleAsync(adminUser, AuthRoles.Admin);
            if (!addRoleResult.Succeeded)
            {
                throw new Exception(
                    $"Failed to assign Admin role: {string.Join(", ", addRoleResult.Errors.Select(e => e.Description))}");
            }
        }

        // Seed default donor user for grader access (email must match a real row in supporters.email)
        // The link to the supporters table is done via matching email — no DB FK required.
        var donorSection = configuration.GetSection("GenerateDefaultIdentityDonor");
        var donorEmail = donorSection["Email"];
        var donorPassword = donorSection["Password"];

        if (!string.IsNullOrEmpty(donorEmail) && !string.IsNullOrEmpty(donorPassword))
        {
            var donorUser = await userManager.FindByEmailAsync(donorEmail);
            if (donorUser == null)
            {
                donorUser = new ApplicationUser
                {
                    UserName = donorEmail,
                    Email = donorEmail,
                    EmailConfirmed = true
                };

                var createResult = await userManager.CreateAsync(donorUser, donorPassword);
                if (!createResult.Succeeded)
                {
                    throw new Exception(
                        $"Failed to create donor user: {string.Join(", ", createResult.Errors.Select(e => e.Description))}");
                }
            }

            if (!await userManager.IsInRoleAsync(donorUser, AuthRoles.Donor))
            {
                var addRoleResult = await userManager.AddToRoleAsync(donorUser, AuthRoles.Donor);
                if (!addRoleResult.Succeeded)
                {
                    throw new Exception(
                        $"Failed to assign Donor role: {string.Join(", ", addRoleResult.Errors.Select(e => e.Description))}");
                }
            }
        }
    }
}
