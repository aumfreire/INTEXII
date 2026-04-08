using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;

namespace INTEXII.API.Controllers;

// VIDEO NOTE: Show that:
//   - GET /api/donations (all) returns 403 for Donor role, 200 for Admin
//   - GET /api/donations/my returns 200 for Donor role with their own history
//   - POST/PUT/DELETE return 401 unauthenticated, 403 for Donor, 200 for Admin
[ApiController]
[Route("api/donations")]
[Authorize]
public class DonationsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public DonationsController(IntexDbContext db)
    {
        _db = db;
    }

    /// <summary>
    /// Returns all donations. Admin only.
    /// </summary>
    [HttpGet]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetAll()
    {
        var donations = await _db.Donations
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();
        return Ok(donations);
    }

    /// <summary>
    /// Returns the authenticated donor's own donation history.
    /// Requires Donor role — donors can only see their own records.
    /// VIDEO NOTE: Log in as a Donor user and show this returns their history.
    /// </summary>
    [HttpGet("my")]
    [Authorize(Policy = AuthPolicies.ViewDonorHistory)]
    public async Task<IActionResult> GetMyDonations()
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
                    ?? User.FindFirstValue(ClaimTypes.Name)
                    ?? User.Identity?.Name;

        if (string.IsNullOrEmpty(email))
            return Unauthorized(new { message = "Could not determine authenticated user email." });

        var normalizedEmail = email.Trim().ToLowerInvariant();

        var supporter = await _db.Supporters
            .FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);

        if (supporter == null)
            return NotFound(new { message = $"No supporter record found for email: {normalizedEmail}" });

        var donations = await _db.Donations
            .Where(d => d.SupporterId == supporter.SupporterId)
            .OrderByDescending(d => d.DonationDate)
            .ToListAsync();

        return Ok(donations);
    }

    [HttpGet("admin/summary")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetAdminDonationSummary()
    {
        var donations = await _db.Donations
            .AsNoTracking()
            .ToListAsync();

        var totalDonationCount = donations.Count;
        var totalMonetaryAmount = donations.Sum(d => d.Amount ?? 0m);
        var totalEstimatedValue = donations.Sum(d => d.EstimatedValue ?? 0m);
        var latestDonationDate = donations
            .Where(d => d.DonationDate != null)
            .Select(d => d.DonationDate)
            .OrderByDescending(d => d)
            .FirstOrDefault();

        return Ok(new AdminDonationSummaryDto(
            totalDonationCount,
            totalMonetaryAmount,
            totalEstimatedValue,
            latestDonationDate
        ));
    }

    /// <summary>
    /// Records a new donation. Admin only.
    /// </summary>
    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Create([FromBody] Donation donation)
    {
        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = donation.DonationId }, donation);
    }

    /// <summary>
    /// Updates a donation record. Admin only.
    /// </summary>
    [HttpPut("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Update(int id, [FromBody] Donation donation)
    {
        if (id != donation.DonationId) return BadRequest();
        _db.Entry(donation).State = EntityState.Modified;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    /// <summary>
    /// Deletes a donation record. Admin only.
    /// Frontend must show a confirmation dialog before calling this endpoint.
    /// VIDEO NOTE: Show the confirmation dialog in the UI before this is called.
    /// </summary>
    [HttpDelete("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Delete(int id)
    {
        var donation = await _db.Donations.FindAsync(id);
        if (donation == null) return NotFound();
        _db.Donations.Remove(donation);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    public sealed record AdminDonationSummaryDto(
        int TotalDonationCount,
        decimal TotalMonetaryAmount,
        decimal TotalEstimatedValue,
        DateOnly? LatestDonationDate);
}
