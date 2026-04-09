using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/supporters")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class SupportersController : ControllerBase
{
    private readonly IntexDbContext _db;

    public SupportersController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? search = null,
        [FromQuery] string? type = null,
        [FromQuery] string? status = null,
        [FromQuery] string? channel = null)
    {
        var supporters = await _db.Supporters
            .AsNoTracking()
            .Include(s => s.Donations)
            .OrderBy(s => s.DisplayName ?? s.Email)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            supporters = supporters
                .Where(s =>
                    ContainsIgnoreCase(s.DisplayName, term)
                    || ContainsIgnoreCase(s.OrganizationName, term)
                    || ContainsIgnoreCase(s.Email, term))
                .ToList();
        }

        if (!string.IsNullOrWhiteSpace(type))
        {
            supporters = supporters
                .Where(s => NormalizeSupporterType(s.SupporterType) == type.Trim().ToLowerInvariant())
                .ToList();
        }

        if (!string.IsNullOrWhiteSpace(status))
        {
            supporters = supporters
                .Where(s => NormalizeStatus(s.Status) == status.Trim().ToLowerInvariant())
                .ToList();
        }

        if (!string.IsNullOrWhiteSpace(channel))
        {
            supporters = supporters
                .Where(s => NormalizeChannel(s.AcquisitionChannel) == channel.Trim().ToLowerInvariant())
                .ToList();
        }

        var result = supporters.Select(s =>
        {
            var latestContributionDate = s.Donations
                .Where(d => d.DonationDate.HasValue)
                .Select(d => d.DonationDate)
                .OrderByDescending(d => d)
                .FirstOrDefault();

            var lifetimeValue = s.Donations.Sum(d => (d.Amount ?? 0m) + (d.EstimatedValue ?? 0m));

            return new SupporterSummaryDto(
                s.SupporterId,
                s.DisplayName ?? BuildDisplayName(s.FirstName, s.LastName, s.OrganizationName, s.Email, s.SupporterId),
                s.OrganizationName,
                s.Email,
                s.Phone,
                s.Region,
                s.Country,
                s.RelationshipType,
                NormalizeSupporterType(s.SupporterType),
                NormalizeStatus(s.Status),
                NormalizeChannel(s.AcquisitionChannel),
                s.FirstDonationDate,
                latestContributionDate,
                lifetimeValue);
        }).ToArray();

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var supporter = await _db.Supporters
            .AsNoTracking()
            .Include(s => s.Donations)
                .ThenInclude(d => d.Allocations)
            .FirstOrDefaultAsync(s => s.SupporterId == id);

        if (supporter is null)
        {
            return NotFound();
        }

        var contributions = supporter.Donations
            .OrderByDescending(d => d.DonationDate)
            .Take(25)
            .Select(d => new SupporterContributionDto(
                d.DonationId,
                d.DonationDate,
                BuildContributionDescription(d.DonationType, d.ChannelSource, d.CampaignName),
                (d.Amount ?? d.EstimatedValue) ?? 0m))
            .ToArray();

        var allocationGroups = supporter.Donations
            .SelectMany(d => d.Allocations)
            .GroupBy(a => a.ProgramArea ?? "General")
            .Select(group => new
            {
                Label = group.Key,
                Amount = group.Sum(a => a.AmountAllocated ?? 0m)
            })
            .Where(item => item.Amount > 0)
            .OrderByDescending(item => item.Amount)
            .ToList();

        var totalAllocation = allocationGroups.Sum(item => item.Amount);

        var allocations = allocationGroups
            .Select(item => new SupporterAllocationDto(
                item.Label,
                totalAllocation == 0 ? 0 : (int)Math.Round(item.Amount / totalAllocation * 100m)))
            .ToArray();

        var detail = new SupporterDetailDto(
            supporter.SupporterId,
            supporter.DisplayName ?? BuildDisplayName(supporter.FirstName, supporter.LastName, supporter.OrganizationName, supporter.Email, supporter.SupporterId),
            supporter.OrganizationName,
            supporter.Email,
            supporter.Phone,
            supporter.Region,
            supporter.Country,
            supporter.RelationshipType,
            NormalizeSupporterType(supporter.SupporterType),
            NormalizeStatus(supporter.Status),
            NormalizeChannel(supporter.AcquisitionChannel),
            supporter.FirstDonationDate,
            contributions,
            allocations);

        return Ok(detail);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SupporterUpsertRequest request)
    {
        if (!IsValidSupporterRequest(request))
        {
            return BadRequest("Supporter name, display name, or email is required.");
        }

        var supporter = new Supporter
        {
            SupporterType = request.Type,
            DisplayName = request.DisplayName,
            OrganizationName = request.Organization,
            FirstName = request.FirstName,
            LastName = request.LastName,
            RelationshipType = request.RelationshipType,
            Region = request.Region,
            Country = request.Country,
            Email = request.Email,
            Phone = request.Phone,
            Status = request.Status,
            AcquisitionChannel = request.Channel,
            FirstDonationDate = request.FirstDonation,
            CreatedAt = DateTime.UtcNow,
        };

        _db.Supporters.Add(supporter);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = supporter.SupporterId }, new SupporterAdminDto(
            supporter.SupporterId,
            supporter.DisplayName,
            supporter.OrganizationName,
            supporter.FirstName,
            supporter.LastName,
            supporter.RelationshipType,
            supporter.Region,
            supporter.Country,
            supporter.Email,
            supporter.Phone,
            supporter.SupporterType,
            supporter.Status,
            supporter.AcquisitionChannel,
            supporter.FirstDonationDate));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SupporterUpsertRequest request)
    {
        if (!IsValidSupporterRequest(request))
        {
            return BadRequest("Supporter name, display name, or email is required.");
        }

        var supporter = await _db.Supporters.FirstOrDefaultAsync(s => s.SupporterId == id);
        if (supporter is null)
        {
            return NotFound();
        }

        supporter.SupporterType = request.Type;
        supporter.DisplayName = request.DisplayName;
        supporter.OrganizationName = request.Organization;
        supporter.FirstName = request.FirstName;
        supporter.LastName = request.LastName;
        supporter.RelationshipType = request.RelationshipType;
        supporter.Region = request.Region;
        supporter.Country = request.Country;
        supporter.Email = request.Email;
        supporter.Phone = request.Phone;
        supporter.Status = request.Status;
        supporter.AcquisitionChannel = request.Channel;
        supporter.FirstDonationDate = request.FirstDonation;

        await _db.SaveChangesAsync();

        return Ok(new SupporterAdminDto(
            supporter.SupporterId,
            supporter.DisplayName,
            supporter.OrganizationName,
            supporter.FirstName,
            supporter.LastName,
            supporter.RelationshipType,
            supporter.Region,
            supporter.Country,
            supporter.Email,
            supporter.Phone,
            supporter.SupporterType,
            supporter.Status,
            supporter.AcquisitionChannel,
            supporter.FirstDonationDate));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var supporter = await _db.Supporters
            .Include(s => s.Donations)
            .FirstOrDefaultAsync(s => s.SupporterId == id);

        if (supporter is null)
        {
            return NotFound();
        }

        if (supporter.Donations.Count > 0)
        {
            return Conflict("Cannot delete a supporter that has contribution history.");
        }

        _db.Supporters.Remove(supporter);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static bool IsValidSupporterRequest(SupporterUpsertRequest request)
    {
        var hasName = !string.IsNullOrWhiteSpace(request.DisplayName)
            || !string.IsNullOrWhiteSpace(request.Organization)
            || !string.IsNullOrWhiteSpace(request.FirstName)
            || !string.IsNullOrWhiteSpace(request.LastName);

        return hasName || !string.IsNullOrWhiteSpace(request.Email);
    }

    private static bool ContainsIgnoreCase(string? value, string term)
    {
        return !string.IsNullOrWhiteSpace(value)
            && value.Contains(term, StringComparison.OrdinalIgnoreCase);
    }

    private static string BuildDisplayName(string? firstName, string? lastName, string? organizationName, string? email, int supporterId)
    {
        var fullName = string.Join(' ', new[] { firstName, lastName }.Where(part => !string.IsNullOrWhiteSpace(part)));
        if (!string.IsNullOrWhiteSpace(fullName))
        {
            return fullName;
        }

        if (!string.IsNullOrWhiteSpace(organizationName))
        {
            return organizationName;
        }

        return email ?? $"Supporter #{supporterId}";
    }

    private static string NormalizeSupporterType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "monetary";
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "monetarydonor" => "monetary",
            "inkinddonor" => "inkind",
            "volunteer" => "volunteer",
            "skillscontributor" => "skills",
            "socialmediaadvocate" => "social",
            "partnerorganization" => "partner",
            _ => value.Trim().ToLowerInvariant()
        };
    }

    private static string NormalizeStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "active";
        }

        return value.Trim().ToLowerInvariant();
    }

    private static string NormalizeChannel(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "online";
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "socialmedia" => "online",
            "wordofmouth" => "referral",
            "partnerreferral" => "referral",
            _ => value.Trim().ToLowerInvariant()
        };
    }

    private static string BuildContributionDescription(string? donationType, string? channelSource, string? campaignName)
    {
        if (!string.IsNullOrWhiteSpace(campaignName))
        {
            return campaignName!;
        }

        if (!string.IsNullOrWhiteSpace(channelSource))
        {
            return $"{donationType ?? "Donation"} via {channelSource}";
        }

        return donationType ?? "Donation";
    }

    private sealed record SupporterSummaryDto(
        int Id,
        string Name,
        string? Organization,
        string? Email,
        string? Phone,
        string? Region,
        string? Country,
        string? RelationshipType,
        string Type,
        string Status,
        string Channel,
        DateOnly? FirstDonation,
        DateOnly? LastContribution,
        decimal LifetimeValue);

    private sealed record SupporterContributionDto(
        int DonationId,
        DateOnly? Date,
        string Description,
        decimal Amount);

    private sealed record SupporterAllocationDto(
        string Label,
        int Percent);

    private sealed record SupporterDetailDto(
        int Id,
        string Name,
        string? Organization,
        string? Email,
        string? Phone,
        string? Region,
        string? Country,
        string? RelationshipType,
        string Type,
        string Status,
        string Channel,
        DateOnly? FirstDonation,
        IReadOnlyList<SupporterContributionDto> Contributions,
        IReadOnlyList<SupporterAllocationDto> Allocations);

    private sealed record SupporterAdminDto(
        int Id,
        string? DisplayName,
        string? Organization,
        string? FirstName,
        string? LastName,
        string? RelationshipType,
        string? Region,
        string? Country,
        string? Email,
        string? Phone,
        string? Type,
        string? Status,
        string? Channel,
        DateOnly? FirstDonation);

    public sealed record SupporterUpsertRequest(
        string? DisplayName,
        string? Organization,
        string? FirstName,
        string? LastName,
        string? RelationshipType,
        string? Region,
        string? Country,
        string? Email,
        string? Phone,
        string? Type,
        string? Status,
        string? Channel,
        DateOnly? FirstDonation);
}
