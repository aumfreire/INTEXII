using System.Security.Claims;
using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/donations")]
[Authorize]
public class DonationsController : ControllerBase
{
    private const int DefaultPageSize = 25;
    private const int MaxPageSize = 100;

    private readonly IntexDbContext _db;

    public DonationsController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = DefaultPageSize,
        [FromQuery] string? search = null,
        [FromQuery] int? supporterId = null)
    {
        var response = await BuildPagedDonationsResponseAsync(page, pageSize, search, supporterId);
        return Ok(response);
    }

    [HttpGet("my")]
    [Authorize(Policy = AuthPolicies.ViewDonorHistory)]
    public async Task<IActionResult> GetMyDonations(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? search = null)
    {
        var supporter = await ResolveCurrentSupporterAsync(createIfMissing: false);
        if (supporter is null)
        {
            return NotFound(new { message = "No supporter record was found for the current account." });
        }

        var response = await BuildPagedDonationsResponseAsync(page, pageSize, search, supporter.SupporterId);
        return Ok(response);
    }

    [HttpGet("admin/summary")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetAdminDonationSummary()
    {
        var donations = await _db.Donations
            .AsNoTracking()
            .Include(d => d.Supporter)
            .ToListAsync();

        var totalDonationCount = donations.Count;
        var totalMonetaryAmount = donations.Sum(d => d.Amount ?? 0m);
        var totalEstimatedValue = donations.Sum(d => d.EstimatedValue ?? 0m);
        var latestDonationDate = donations
            .Where(d => d.DonationDate.HasValue)
            .Select(d => d.DonationDate!.Value)
            .OrderByDescending(d => d)
            .FirstOrDefault();

        return Ok(new AdminDonationSummaryDto(
            totalDonationCount,
            totalMonetaryAmount,
            totalEstimatedValue,
            latestDonationDate));
    }

    [HttpGet("supporters")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> GetSupporters([FromQuery] string? search = null)
    {
        var supporters = await _db.Supporters
            .AsNoTracking()
            .OrderBy(s => s.DisplayName ?? s.Email)
            .ThenBy(s => s.SupporterId)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            supporters = supporters
                .Where(s => MatchesSupporterSearch(s, term))
                .ToList();
        }

        var result = supporters.Select(MapSupporterOption).ToArray();
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Create([FromBody] DonationUpsertRequest request)
    {
        var donation = await BuildDonationEntityAsync(request);
        if (donation is null)
        {
            return BadRequest(new { message = "Choose an existing supporter or provide a supporter email." });
        }

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        var savedDonation = await LoadDonationWithSupporterAsync(donation.DonationId);
        return CreatedAtAction(nameof(GetAll), new { id = donation.DonationId }, MapDonation(savedDonation ?? donation));
    }

    [HttpPost("my")]
    [Authorize(Policy = AuthPolicies.ViewDonorHistory)]
    public async Task<IActionResult> CreateMyDonation([FromBody] DonorDonationCreateRequest request)
    {
        var supporter = await ResolveCurrentSupporterAsync(createIfMissing: true, request.FirstName, request.LastName, request.DisplayName);
        if (supporter is null)
        {
            return BadRequest(new { message = "Could not determine the current supporter." });
        }

        var donation = new Donation
        {
            SupporterId = supporter.SupporterId,
            DonationType = request.DonationType,
            DonationDate = ParseDateOrToday(request.DonationDate),
            IsRecurring = request.IsRecurring,
            CampaignName = request.CampaignName,
            ChannelSource = request.ChannelSource,
            CurrencyCode = NormalizeCurrencyCode(request.CurrencyCode),
            Amount = request.Amount,
            EstimatedValue = request.EstimatedValue,
            ImpactUnit = request.ImpactUnit,
            Notes = request.Notes,
            ReferralPostId = request.ReferralPostId
        };

        _db.Donations.Add(donation);
        await _db.SaveChangesAsync();

        var savedDonation = await LoadDonationWithSupporterAsync(donation.DonationId);
        return CreatedAtAction(nameof(GetMyDonations), new { id = donation.DonationId }, MapDonation(savedDonation ?? donation));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Update(int id, [FromBody] DonationUpsertRequest request)
    {
        var donation = await _db.Donations.FirstOrDefaultAsync(d => d.DonationId == id);
        if (donation is null)
        {
            return NotFound(new { message = $"Donation {id} was not found." });
        }

        await ApplyDonationRequestAsync(donation, request);
        await _db.SaveChangesAsync();

        var updatedDonation = await LoadDonationWithSupporterAsync(donation.DonationId);
        return Ok(MapDonation(updatedDonation ?? donation));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = AuthPolicies.ManageData)]
    public async Task<IActionResult> Delete(int id)
    {
        var donation = await _db.Donations.FindAsync(id);
        if (donation is null)
        {
            return NotFound();
        }

        _db.Donations.Remove(donation);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private async Task<PagedDonationResponseDto> BuildPagedDonationsResponseAsync(
        int page,
        int pageSize,
        string? search,
        int? supporterId)
    {
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedPageSize = pageSize < 1 ? DefaultPageSize : Math.Min(pageSize, MaxPageSize);

        var donations = await _db.Donations
            .AsNoTracking()
            .Include(d => d.Supporter)
            .ToListAsync();

        if (supporterId.HasValue)
        {
            donations = donations.Where(d => d.SupporterId == supporterId.Value).ToList();
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            donations = donations.Where(d => MatchesDonationSearch(d, term)).ToList();
        }

        donations = donations
            .OrderByDescending(d => d.DonationDate ?? DateOnly.MinValue)
            .ThenByDescending(d => d.DonationId)
            .ToList();

        var totalCount = donations.Count;
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)normalizedPageSize);
        var effectivePage = totalPages == 0 ? 1 : Math.Min(normalizedPage, totalPages);
        var items = donations
            .Skip((effectivePage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .Select(MapDonation)
            .ToArray();

        return new PagedDonationResponseDto(
            items,
            effectivePage,
            normalizedPageSize,
            totalCount,
            totalPages);
    }

    private async Task<Donation?> BuildDonationEntityAsync(DonationUpsertRequest request)
    {
        var supporter = await ResolveSupporterForRequestAsync(request);
        if (supporter is null)
        {
            return null;
        }

        return new Donation
        {
            SupporterId = supporter.SupporterId,
            DonationType = request.DonationType,
            DonationDate = ParseDateOrToday(request.DonationDate),
            IsRecurring = request.IsRecurring,
            CampaignName = request.CampaignName,
            ChannelSource = request.ChannelSource,
            CurrencyCode = NormalizeCurrencyCode(request.CurrencyCode),
            Amount = request.Amount,
            EstimatedValue = request.EstimatedValue,
            ImpactUnit = request.ImpactUnit,
            Notes = request.Notes,
            ReferralPostId = request.ReferralPostId
        };
    }

    private async Task ApplyDonationRequestAsync(Donation donation, DonationUpsertRequest request)
    {
        var supporter = await ResolveSupporterForRequestAsync(request);
        if (supporter is null)
        {
            throw new InvalidOperationException("Could not resolve a supporter for the donation.");
        }

        donation.SupporterId = supporter.SupporterId;
        donation.DonationType = request.DonationType;
        donation.DonationDate = ParseDateOrToday(request.DonationDate);
        donation.IsRecurring = request.IsRecurring;
        donation.CampaignName = request.CampaignName;
        donation.ChannelSource = request.ChannelSource;
        donation.CurrencyCode = NormalizeCurrencyCode(request.CurrencyCode);
        donation.Amount = request.Amount;
        donation.EstimatedValue = request.EstimatedValue;
        donation.ImpactUnit = request.ImpactUnit;
        donation.Notes = request.Notes;
        donation.ReferralPostId = request.ReferralPostId;
    }

    private async Task<Supporter?> ResolveSupporterForRequestAsync(DonationUpsertRequest request)
    {
        if (request.SupporterId.HasValue)
        {
            var existingById = await _db.Supporters.FirstOrDefaultAsync(s => s.SupporterId == request.SupporterId.Value);
            if (existingById is null)
            {
                return null;
            }

            ApplySupporterFields(existingById, request);
            return existingById;
        }

        if (string.IsNullOrWhiteSpace(request.SupporterEmail))
        {
            return null;
        }

        var normalizedEmail = NormalizeEmail(request.SupporterEmail);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return null;
        }

        var supporter = await _db.Supporters
            .FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);

        if (supporter is null)
        {
            supporter = new Supporter
            {
                Email = normalizedEmail,
                CreatedAt = DateTime.UtcNow,
                SupporterType = NormalizeText(request.SupporterType) ?? "Individual",
                Status = NormalizeText(request.SupporterStatus) ?? "Active"
            };

            _db.Supporters.Add(supporter);
        }

        ApplySupporterFields(supporter, request);

        if (string.IsNullOrWhiteSpace(supporter.DisplayName))
        {
            supporter.DisplayName = BuildPreferredDisplayName(supporter);
        }

        return supporter;
    }

    private async Task<Supporter?> ResolveCurrentSupporterAsync(
        bool createIfMissing,
        string? firstName = null,
        string? lastName = null,
        string? displayName = null)
    {
        var email = User.FindFirstValue(ClaimTypes.Email)
            ?? User.FindFirstValue(ClaimTypes.Name)
            ?? User.Identity?.Name;

        if (string.IsNullOrWhiteSpace(email))
        {
            return null;
        }

        var normalizedEmail = NormalizeEmail(email);
        if (string.IsNullOrWhiteSpace(normalizedEmail))
        {
            return null;
        }

        var supporter = await _db.Supporters
            .FirstOrDefaultAsync(s => s.Email != null && s.Email.ToLower() == normalizedEmail);

        if (supporter is null && createIfMissing)
        {
            supporter = new Supporter
            {
                Email = normalizedEmail,
                SupporterType = "Individual",
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            _db.Supporters.Add(supporter);
        }

        if (supporter is null)
        {
            return null;
        }

        supporter.FirstName = NormalizeNullable(firstName) ?? supporter.FirstName;
        supporter.LastName = NormalizeNullable(lastName) ?? supporter.LastName;
        supporter.DisplayName = NormalizeNullable(displayName) ?? supporter.DisplayName;

        if (string.IsNullOrWhiteSpace(supporter.DisplayName))
        {
            supporter.DisplayName = BuildPreferredDisplayName(supporter);
        }

        return supporter;
    }

    private static bool MatchesDonationSearch(Donation donation, string searchTerm)
    {
        return MatchesText(donation.DonationType, searchTerm)
            || MatchesText(donation.CampaignName, searchTerm)
            || MatchesText(donation.ChannelSource, searchTerm)
            || MatchesText(donation.Notes, searchTerm)
            || MatchesText(donation.CurrencyCode, searchTerm)
            || MatchesText(donation.ImpactUnit, searchTerm)
            || MatchesText(donation.Amount?.ToString(), searchTerm)
            || MatchesText(donation.EstimatedValue?.ToString(), searchTerm)
            || MatchesText(donation.Supporter?.DisplayName, searchTerm)
            || MatchesText(donation.Supporter?.Email, searchTerm)
            || MatchesText(donation.Supporter?.FirstName, searchTerm)
            || MatchesText(donation.Supporter?.LastName, searchTerm)
            || MatchesText(donation.Supporter?.OrganizationName, searchTerm)
            || MatchesText(donation.Supporter?.SupporterType, searchTerm)
            || MatchesText(donation.Supporter?.Status, searchTerm);
    }

    private static bool MatchesSupporterSearch(Supporter supporter, string searchTerm)
    {
        return MatchesText(supporter.DisplayName, searchTerm)
            || MatchesText(supporter.Email, searchTerm)
            || MatchesText(supporter.FirstName, searchTerm)
            || MatchesText(supporter.LastName, searchTerm)
            || MatchesText(supporter.OrganizationName, searchTerm)
            || MatchesText(supporter.SupporterType, searchTerm)
            || MatchesText(supporter.Status, searchTerm);
    }

    private static bool MatchesText(string? value, string searchTerm)
    {
        return !string.IsNullOrWhiteSpace(value)
            && value.Contains(searchTerm, StringComparison.OrdinalIgnoreCase);
    }

    private static DonationSupporterOptionDto MapSupporterOption(Supporter supporter)
    {
        return new DonationSupporterOptionDto(
            supporter.SupporterId,
            supporter.DisplayName ?? BuildPreferredDisplayName(supporter),
            supporter.Email,
            supporter.FirstName,
            supporter.LastName,
            supporter.OrganizationName,
            supporter.SupporterType,
            supporter.Status);
    }

    private static DonationResponseDto MapDonation(Donation donation)
    {
        var supporter = donation.Supporter;
        return new DonationResponseDto(
            donation.DonationId,
            donation.SupporterId,
            supporter?.DisplayName ?? BuildPreferredDisplayName(supporter),
            supporter?.Email,
            donation.DonationType,
            donation.DonationDate,
            donation.IsRecurring,
            donation.CampaignName,
            donation.ChannelSource,
            donation.CurrencyCode,
            donation.Amount,
            donation.EstimatedValue,
            donation.ImpactUnit,
            donation.Notes,
            donation.ReferralPostId);
    }

    private async Task<Donation?> LoadDonationWithSupporterAsync(int donationId)
    {
        return await _db.Donations
            .AsNoTracking()
            .Include(d => d.Supporter)
            .FirstOrDefaultAsync(d => d.DonationId == donationId);
    }

    private static void ApplySupporterFields(Supporter supporter, DonationUpsertRequest request)
    {
        if (!string.IsNullOrWhiteSpace(request.SupporterType))
        {
            supporter.SupporterType = NormalizeText(request.SupporterType);
        }

        if (!string.IsNullOrWhiteSpace(request.SupporterStatus))
        {
            supporter.Status = NormalizeText(request.SupporterStatus);
        }

        supporter.Email = NormalizeNullable(request.SupporterEmail) ?? supporter.Email;
        supporter.FirstName = NormalizeNullable(request.SupporterFirstName) ?? supporter.FirstName;
        supporter.LastName = NormalizeNullable(request.SupporterLastName) ?? supporter.LastName;
        supporter.DisplayName = NormalizeNullable(request.SupporterDisplayName) ?? supporter.DisplayName;
        supporter.OrganizationName = NormalizeNullable(request.SupporterOrganizationName) ?? supporter.OrganizationName;
    }

    private static string? NormalizeNullable(string? value)
    {
        var normalized = NormalizeText(value);
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string? NormalizeText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static string NormalizeEmail(string? value)
    {
        return NormalizeText(value)?.ToLowerInvariant() ?? string.Empty;
    }

    private static string NormalizeCurrencyCode(string? value)
    {
        var normalized = NormalizeText(value);
        return string.IsNullOrWhiteSpace(normalized) ? "USD" : normalized.ToUpperInvariant();
    }

    private static DateOnly? ParseDateOrToday(string? value)
    {
        if (DateOnly.TryParse(value, out var parsedDate))
        {
            return parsedDate;
        }

        return DateOnly.FromDateTime(DateTime.UtcNow);
    }

    private static string BuildPreferredDisplayName(Supporter? supporter)
    {
        if (supporter is null)
        {
            return "Unknown supporter";
        }

        if (!string.IsNullOrWhiteSpace(supporter.DisplayName))
        {
            return supporter.DisplayName!;
        }

        var parts = new[] { supporter.FirstName, supporter.LastName }
            .Where(part => !string.IsNullOrWhiteSpace(part))
            .ToArray();

        if (parts.Length > 0)
        {
            return string.Join(' ', parts);
        }

        if (!string.IsNullOrWhiteSpace(supporter.OrganizationName))
        {
            return supporter.OrganizationName!;
        }

        return supporter.Email ?? $"Supporter #{supporter.SupporterId}";
    }

    private sealed record DonationResponseDto(
        int DonationId,
        int? SupporterId,
        string SupporterDisplayName,
        string? SupporterEmail,
        string? DonationType,
        DateOnly? DonationDate,
        bool? IsRecurring,
        string? CampaignName,
        string? ChannelSource,
        string? CurrencyCode,
        decimal? Amount,
        decimal? EstimatedValue,
        string? ImpactUnit,
        string? Notes,
        int? ReferralPostId);

    private sealed record DonationSupporterOptionDto(
        int SupporterId,
        string DisplayName,
        string? Email,
        string? FirstName,
        string? LastName,
        string? OrganizationName,
        string? SupporterType,
        string? Status);

    private sealed record PagedDonationResponseDto(
        IReadOnlyList<DonationResponseDto> Items,
        int Page,
        int PageSize,
        int TotalCount,
        int TotalPages);

    private sealed record AdminDonationSummaryDto(
        int TotalDonationCount,
        decimal TotalMonetaryAmount,
        decimal TotalEstimatedValue,
        DateOnly? LatestDonationDate);

    public sealed record DonationUpsertRequest(
        int? SupporterId,
        string? SupporterEmail,
        string? SupporterFirstName,
        string? SupporterLastName,
        string? SupporterDisplayName,
        string? SupporterOrganizationName,
        string? SupporterType,
        string? SupporterStatus,
        string? DonationType,
        string? DonationDate,
        bool? IsRecurring,
        string? CampaignName,
        string? ChannelSource,
        string? CurrencyCode,
        decimal? Amount,
        decimal? EstimatedValue,
        string? ImpactUnit,
        string? Notes,
        int? ReferralPostId);

    public sealed record DonorDonationCreateRequest(
        string? FirstName,
        string? LastName,
        string? DisplayName,
        string? DonationType,
        string? DonationDate,
        bool? IsRecurring,
        string? CampaignName,
        string? ChannelSource,
        string? CurrencyCode,
        decimal? Amount,
        decimal? EstimatedValue,
        string? ImpactUnit,
        string? Notes,
        int? ReferralPostId);
}
