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
    }
}
