using INTEXII.API.Data;
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
            NormalizeSupporterType(supporter.SupporterType),
            NormalizeStatus(supporter.Status),
            NormalizeChannel(supporter.AcquisitionChannel),
            supporter.FirstDonationDate,
            contributions,
            allocations);

        return Ok(detail);
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
        string Type,
        string Status,
        string Channel,
        DateOnly? FirstDonation,
        IReadOnlyList<SupporterContributionDto> Contributions,
        IReadOnlyList<SupporterAllocationDto> Allocations);
}
