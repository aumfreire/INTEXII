using Microsoft.EntityFrameworkCore;
using INTEXII.API.Data.Models;

namespace INTEXII.API.Data;

public class IntexDbContext : DbContext
{
    public IntexDbContext(DbContextOptions<IntexDbContext> options) : base(options) { }

    public DbSet<Safehouse> Safehouses => Set<Safehouse>();
    public DbSet<Partner> Partners => Set<Partner>();
    public DbSet<Supporter> Supporters => Set<Supporter>();
    public DbSet<Resident> Residents => Set<Resident>();
    public DbSet<SocialMediaPost> SocialMediaPosts => Set<SocialMediaPost>();
    public DbSet<Donation> Donations => Set<Donation>();
    public DbSet<DonationAllocation> DonationAllocations => Set<DonationAllocation>();
    public DbSet<InKindDonationItem> InKindDonationItems => Set<InKindDonationItem>();
    public DbSet<PartnerAssignment> PartnerAssignments => Set<PartnerAssignment>();
    public DbSet<SafehouseMonthlyMetric> SafehouseMonthlyMetrics => Set<SafehouseMonthlyMetric>();
    public DbSet<PublicImpactSnapshot> PublicImpactSnapshots => Set<PublicImpactSnapshot>();
    public DbSet<EducationRecord> EducationRecords => Set<EducationRecord>();
    public DbSet<HealthWellbeingRecord> HealthWellbeingRecords => Set<HealthWellbeingRecord>();
    public DbSet<HomeVisitation> HomeVisitations => Set<HomeVisitation>();
    public DbSet<IncidentReport> IncidentReports => Set<IncidentReport>();
    public DbSet<InterventionPlan> InterventionPlans => Set<InterventionPlan>();
    public DbSet<ProcessRecording> ProcessRecordings => Set<ProcessRecording>();
    public DbSet<ChatConversation> ChatConversations => Set<ChatConversation>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<ChatFeedback> ChatFeedback => Set<ChatFeedback>();
    public DbSet<ChatUpload> ChatUploads => Set<ChatUpload>();
    public DbSet<ChatAuditLog> ChatAuditLogs => Set<ChatAuditLog>();

    // ML prediction tables (keyless — written by GitHub Actions pipelines)
    public DbSet<MlDonorLapsePrediction>      MlDonorLapsePredictions      => Set<MlDonorLapsePrediction>();
    public DbSet<MlSafehouseHealthPrediction>  MlSafehouseHealthPredictions  => Set<MlSafehouseHealthPrediction>();
    public DbSet<MlResidentRiskPrediction>     MlResidentRiskPredictions     => Set<MlResidentRiskPrediction>();
    public DbSet<MlSocialEngagementPrediction> MlSocialEngagementPredictions => Set<MlSocialEngagementPrediction>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ML prediction tables have no primary key — managed entirely by Python pipelines
        modelBuilder.Entity<MlDonorLapsePrediction>().HasNoKey();
        modelBuilder.Entity<MlSafehouseHealthPrediction>().HasNoKey();
        modelBuilder.Entity<MlResidentRiskPrediction>().HasNoKey();
        modelBuilder.Entity<MlSocialEngagementPrediction>().HasNoKey();

        // FK relationships
        modelBuilder.Entity<Resident>()
            .HasOne(r => r.Safehouse)
            .WithMany(s => s.Residents)
            .HasForeignKey(r => r.SafehouseId);

        modelBuilder.Entity<Donation>()
            .HasOne(d => d.Supporter)
            .WithMany(s => s.Donations)
            .HasForeignKey(d => d.SupporterId);

        modelBuilder.Entity<Donation>()
            .HasOne(d => d.ReferralPost)
            .WithMany(p => p.Donations)
            .HasForeignKey(d => d.ReferralPostId);

        modelBuilder.Entity<DonationAllocation>()
            .HasOne(a => a.Donation)
            .WithMany(d => d.Allocations)
            .HasForeignKey(a => a.DonationId);

        modelBuilder.Entity<DonationAllocation>()
            .HasOne(a => a.Safehouse)
            .WithMany(s => s.DonationAllocations)
            .HasForeignKey(a => a.SafehouseId);

        modelBuilder.Entity<InKindDonationItem>()
            .HasOne(i => i.Donation)
            .WithMany(d => d.InKindItems)
            .HasForeignKey(i => i.DonationId);

        modelBuilder.Entity<PartnerAssignment>()
            .HasOne(a => a.Partner)
            .WithMany(p => p.Assignments)
            .HasForeignKey(a => a.PartnerId);

        modelBuilder.Entity<PartnerAssignment>()
            .HasOne(a => a.Safehouse)
            .WithMany(s => s.PartnerAssignments)
            .HasForeignKey(a => a.SafehouseId);

        modelBuilder.Entity<SafehouseMonthlyMetric>()
            .HasOne(m => m.Safehouse)
            .WithMany(s => s.MonthlyMetrics)
            .HasForeignKey(m => m.SafehouseId);

        modelBuilder.Entity<EducationRecord>()
            .HasOne(e => e.Resident)
            .WithMany(r => r.EducationRecords)
            .HasForeignKey(e => e.ResidentId);

        modelBuilder.Entity<HealthWellbeingRecord>()
            .HasOne(h => h.Resident)
            .WithMany(r => r.HealthWellbeingRecords)
            .HasForeignKey(h => h.ResidentId);

        modelBuilder.Entity<HomeVisitation>()
            .HasOne(v => v.Resident)
            .WithMany(r => r.HomeVisitations)
            .HasForeignKey(v => v.ResidentId);

        modelBuilder.Entity<IncidentReport>()
            .HasOne(i => i.Resident)
            .WithMany(r => r.IncidentReports)
            .HasForeignKey(i => i.ResidentId);

        modelBuilder.Entity<IncidentReport>()
            .HasOne(i => i.Safehouse)
            .WithMany(s => s.IncidentReports)
            .HasForeignKey(i => i.SafehouseId);

        modelBuilder.Entity<InterventionPlan>()
            .HasOne(p => p.Resident)
            .WithMany(r => r.InterventionPlans)
            .HasForeignKey(p => p.ResidentId);

        modelBuilder.Entity<ProcessRecording>()
            .HasOne(p => p.Resident)
            .WithMany(r => r.ProcessRecordings)
            .HasForeignKey(p => p.ResidentId);

        modelBuilder.Entity<ChatConversation>(entity =>
        {
            entity.ToTable("chat_conversations");
            entity.HasKey(x => x.ConversationId);
            entity.Property(x => x.ConversationId).HasColumnName("conversation_id").ValueGeneratedOnAdd();
            entity.Property(x => x.UserId).HasColumnName("user_id").HasMaxLength(450);
            entity.Property(x => x.Title).HasColumnName("title").HasMaxLength(255);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.UpdatedAt).HasColumnName("updated_at");
            entity.Property(x => x.IsDeleted).HasColumnName("is_deleted");
            entity.HasIndex(x => new { x.UserId, x.UpdatedAt });
        });

        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.ToTable("chat_messages");
            entity.HasKey(x => x.MessageId);
            entity.Property(x => x.MessageId).HasColumnName("message_id").ValueGeneratedOnAdd();
            entity.Property(x => x.ConversationId).HasColumnName("conversation_id");
            entity.Property(x => x.Role).HasColumnName("role").HasMaxLength(20);
            entity.Property(x => x.Content).HasColumnName("content");
            entity.Property(x => x.AttachmentsJson).HasColumnName("attachments_json");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.Conversation)
                .WithMany(c => c.Messages)
                .HasForeignKey(x => x.ConversationId);
        });

        modelBuilder.Entity<ChatFeedback>(entity =>
        {
            entity.ToTable("chat_feedback");
            entity.HasKey(x => x.FeedbackId);
            entity.Property(x => x.FeedbackId).HasColumnName("feedback_id").ValueGeneratedOnAdd();
            entity.Property(x => x.MessageId).HasColumnName("message_id");
            entity.Property(x => x.UserId).HasColumnName("user_id").HasMaxLength(450);
            entity.Property(x => x.Rating).HasColumnName("rating").HasMaxLength(10);
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.HasOne(x => x.Message)
                .WithMany(m => m.Feedback)
                .HasForeignKey(x => x.MessageId);
        });

        modelBuilder.Entity<ChatUpload>(entity =>
        {
            entity.ToTable("chat_uploads");
            entity.HasKey(x => x.UploadId);
            entity.Property(x => x.UploadId).HasColumnName("upload_id").ValueGeneratedOnAdd();
            entity.Property(x => x.ConversationId).HasColumnName("conversation_id");
            entity.Property(x => x.OriginalFilename).HasColumnName("original_filename").HasMaxLength(500);
            entity.Property(x => x.StoredFilename).HasColumnName("stored_filename").HasMaxLength(500);
            entity.Property(x => x.ContentType).HasColumnName("content_type").HasMaxLength(100);
            entity.Property(x => x.FileSizeBytes).HasColumnName("file_size_bytes");
            entity.Property(x => x.UploadedAt).HasColumnName("uploaded_at");
            entity.HasOne(x => x.Conversation)
                .WithMany(c => c.Uploads)
                .HasForeignKey(x => x.ConversationId);
        });

        modelBuilder.Entity<ChatAuditLog>(entity =>
        {
            entity.ToTable("chat_audit_logs");
            entity.HasKey(x => x.ChatAuditLogId);
            entity.Property(x => x.ChatAuditLogId).HasColumnName("chat_audit_log_id").ValueGeneratedOnAdd();
            entity.Property(x => x.UserId).HasColumnName("user_id").HasMaxLength(450);
            entity.Property(x => x.Question).HasColumnName("question");
            entity.Property(x => x.Intent).HasColumnName("intent").HasMaxLength(50);
            entity.Property(x => x.HadDbContext).HasColumnName("had_db_context");
            entity.Property(x => x.CreatedAt).HasColumnName("created_at");
            entity.Property(x => x.ConversationId).HasColumnName("conversation_id");
            entity.HasIndex(x => x.CreatedAt);
        });
    }
}
