using INTEXII.API.Data;
using INTEXII.API.Data.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace INTEXII.API.Controllers;

[ApiController]
[Route("api/social-media-posts")]
[Authorize(Policy = AuthPolicies.ManageData)]
public class SocialMediaPostsController : ControllerBase
{
    private readonly IntexDbContext _db;

    public SocialMediaPostsController(IntexDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? platform = null,
        [FromQuery] string? campaign = null,
        [FromQuery] string? postType = null,
        [FromQuery] string? search = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _db.SocialMediaPosts.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(platform))
            query = query.Where(p => p.Platform != null && p.Platform.ToLower() == platform.Trim().ToLower());

        if (!string.IsNullOrWhiteSpace(campaign))
            query = query.Where(p => p.CampaignName != null && p.CampaignName.ToLower() == campaign.Trim().ToLower());

        if (!string.IsNullOrWhiteSpace(postType))
            query = query.Where(p => p.PostType != null && p.PostType.ToLower() == postType.Trim().ToLower());

        var all = await query
            .OrderByDescending(p => p.CreatedAt)
            .ThenByDescending(p => p.PostId)
            .ToListAsync();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            all = all.Where(p =>
                ContainsIgnoreCase(p.Caption, term) ||
                ContainsIgnoreCase(p.ContentTopic, term) ||
                ContainsIgnoreCase(p.CampaignName, term) ||
                ContainsIgnoreCase(p.Platform, term) ||
                ContainsIgnoreCase(p.PostType, term)).ToList();
        }

        var total = all.Count;
        var items = all
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(MapToDto)
            .ToArray();

        return Ok(new { total, page, pageSize, items });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var post = await _db.SocialMediaPosts.AsNoTracking().FirstOrDefaultAsync(p => p.PostId == id);
        if (post is null) return NotFound();

        return Ok(MapToDto(post));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] SocialMediaPostUpsertRequest req)
    {
        var nextId = (await _db.SocialMediaPosts.MaxAsync(p => (int?)p.PostId) ?? 0) + 1;

        var post = new SocialMediaPost
        {
            PostId = nextId,
            Platform = req.Platform?.Trim(),
            PlatformPostId = req.PlatformPostId?.Trim(),
            PostUrl = req.PostUrl?.Trim(),
            CreatedAt = req.CreatedAt,
            DayOfWeek = req.DayOfWeek?.Trim(),
            PostHour = req.PostHour,
            PostType = req.PostType?.Trim(),
            MediaType = req.MediaType?.Trim(),
            Caption = req.Caption?.Trim(),
            Hashtags = req.Hashtags?.Trim(),
            NumHashtags = req.NumHashtags,
            MentionsCount = req.MentionsCount,
            HasCallToAction = req.HasCallToAction,
            CallToActionType = req.CallToActionType?.Trim(),
            ContentTopic = req.ContentTopic?.Trim(),
            SentimentTone = req.SentimentTone?.Trim(),
            CaptionLength = req.CaptionLength,
            FeaturesResidentStory = req.FeaturesResidentStory,
            CampaignName = req.CampaignName?.Trim(),
            IsBoosted = req.IsBoosted,
            BoostBudgetPhp = req.BoostBudgetPhp,
            Impressions = req.Impressions,
            Reach = req.Reach,
            Likes = req.Likes,
            Comments = req.Comments,
            Shares = req.Shares,
            Saves = req.Saves,
            ClickThroughs = req.ClickThroughs,
            VideoViews = req.VideoViews,
            EngagementRate = req.EngagementRate,
            ProfileVisits = req.ProfileVisits,
            DonationReferrals = req.DonationReferrals,
            EstimatedDonationValuePhp = req.EstimatedDonationValuePhp,
            FollowerCountAtPost = req.FollowerCountAtPost,
            WatchTimeSeconds = req.WatchTimeSeconds,
            AvgViewDurationSeconds = req.AvgViewDurationSeconds,
            SubscriberCountAtPost = req.SubscriberCountAtPost,
            Forwards = req.Forwards,
        };

        _db.SocialMediaPosts.Add(post);
        await _db.SaveChangesAsync();

        var created = await _db.SocialMediaPosts.AsNoTracking().FirstAsync(p => p.PostId == nextId);
        return CreatedAtAction(nameof(GetById), new { id = nextId }, MapToDto(created));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] SocialMediaPostUpsertRequest req)
    {
        var post = await _db.SocialMediaPosts.FindAsync(id);
        if (post is null) return NotFound();

        post.Platform = req.Platform?.Trim();
        post.PlatformPostId = req.PlatformPostId?.Trim();
        post.PostUrl = req.PostUrl?.Trim();
        post.CreatedAt = req.CreatedAt;
        post.DayOfWeek = req.DayOfWeek?.Trim();
        post.PostHour = req.PostHour;
        post.PostType = req.PostType?.Trim();
        post.MediaType = req.MediaType?.Trim();
        post.Caption = req.Caption?.Trim();
        post.Hashtags = req.Hashtags?.Trim();
        post.NumHashtags = req.NumHashtags;
        post.MentionsCount = req.MentionsCount;
        post.HasCallToAction = req.HasCallToAction;
        post.CallToActionType = req.CallToActionType?.Trim();
        post.ContentTopic = req.ContentTopic?.Trim();
        post.SentimentTone = req.SentimentTone?.Trim();
        post.CaptionLength = req.CaptionLength;
        post.FeaturesResidentStory = req.FeaturesResidentStory;
        post.CampaignName = req.CampaignName?.Trim();
        post.IsBoosted = req.IsBoosted;
        post.BoostBudgetPhp = req.BoostBudgetPhp;
        post.Impressions = req.Impressions;
        post.Reach = req.Reach;
        post.Likes = req.Likes;
        post.Comments = req.Comments;
        post.Shares = req.Shares;
        post.Saves = req.Saves;
        post.ClickThroughs = req.ClickThroughs;
        post.VideoViews = req.VideoViews;
        post.EngagementRate = req.EngagementRate;
        post.ProfileVisits = req.ProfileVisits;
        post.DonationReferrals = req.DonationReferrals;
        post.EstimatedDonationValuePhp = req.EstimatedDonationValuePhp;
        post.FollowerCountAtPost = req.FollowerCountAtPost;
        post.WatchTimeSeconds = req.WatchTimeSeconds;
        post.AvgViewDurationSeconds = req.AvgViewDurationSeconds;
        post.SubscriberCountAtPost = req.SubscriberCountAtPost;
        post.Forwards = req.Forwards;

        await _db.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var post = await _db.SocialMediaPosts.FindAsync(id);
        if (post is null) return NotFound();

        _db.SocialMediaPosts.Remove(post);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static bool ContainsIgnoreCase(string? value, string term) =>
        !string.IsNullOrWhiteSpace(value) && value.Contains(term, StringComparison.OrdinalIgnoreCase);

    private static SocialMediaPostDto MapToDto(SocialMediaPost p) => new(
        p.PostId,
        p.Platform,
        p.PlatformPostId,
        p.PostUrl,
        p.CreatedAt,
        p.DayOfWeek,
        p.PostHour,
        p.PostType,
        p.MediaType,
        p.Caption,
        p.Hashtags,
        p.NumHashtags,
        p.MentionsCount,
        p.HasCallToAction ?? false,
        p.CallToActionType,
        p.ContentTopic,
        p.SentimentTone,
        p.CaptionLength,
        p.FeaturesResidentStory ?? false,
        p.CampaignName,
        p.IsBoosted ?? false,
        p.BoostBudgetPhp,
        p.Impressions,
        p.Reach,
        p.Likes,
        p.Comments,
        p.Shares,
        p.Saves,
        p.ClickThroughs,
        p.VideoViews,
        p.EngagementRate,
        p.ProfileVisits,
        p.DonationReferrals,
        p.EstimatedDonationValuePhp,
        p.FollowerCountAtPost,
        p.WatchTimeSeconds,
        p.AvgViewDurationSeconds,
        p.SubscriberCountAtPost,
        p.Forwards);

    private sealed record SocialMediaPostDto(
        int Id,
        string? Platform,
        string? PlatformPostId,
        string? PostUrl,
        DateTime? CreatedAt,
        string? DayOfWeek,
        int? PostHour,
        string? PostType,
        string? MediaType,
        string? Caption,
        string? Hashtags,
        int? NumHashtags,
        int? MentionsCount,
        bool HasCallToAction,
        string? CallToActionType,
        string? ContentTopic,
        string? SentimentTone,
        int? CaptionLength,
        bool FeaturesResidentStory,
        string? CampaignName,
        bool IsBoosted,
        decimal? BoostBudgetPhp,
        int? Impressions,
        int? Reach,
        int? Likes,
        int? Comments,
        int? Shares,
        int? Saves,
        int? ClickThroughs,
        int? VideoViews,
        decimal? EngagementRate,
        int? ProfileVisits,
        int? DonationReferrals,
        decimal? EstimatedDonationValuePhp,
        int? FollowerCountAtPost,
        int? WatchTimeSeconds,
        decimal? AvgViewDurationSeconds,
        int? SubscriberCountAtPost,
        int? Forwards);

    public sealed record SocialMediaPostUpsertRequest(
        string? Platform,
        string? PlatformPostId,
        string? PostUrl,
        DateTime? CreatedAt,
        string? DayOfWeek,
        int? PostHour,
        string? PostType,
        string? MediaType,
        string? Caption,
        string? Hashtags,
        int? NumHashtags,
        int? MentionsCount,
        bool? HasCallToAction,
        string? CallToActionType,
        string? ContentTopic,
        string? SentimentTone,
        int? CaptionLength,
        bool? FeaturesResidentStory,
        string? CampaignName,
        bool? IsBoosted,
        decimal? BoostBudgetPhp,
        int? Impressions,
        int? Reach,
        int? Likes,
        int? Comments,
        int? Shares,
        int? Saves,
        int? ClickThroughs,
        int? VideoViews,
        decimal? EngagementRate,
        int? ProfileVisits,
        int? DonationReferrals,
        decimal? EstimatedDonationValuePhp,
        int? FollowerCountAtPost,
        int? WatchTimeSeconds,
        decimal? AvgViewDurationSeconds,
        int? SubscriberCountAtPost,
        int? Forwards);
}
