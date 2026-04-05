using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using HR_SAR.Models;

namespace HR_SAR.Data;

public class AppDbContext : DbContext
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Facility> Facilities => Set<Facility>();
    public DbSet<Transfer> Transfers => Set<Transfer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── Employee ──────────────────────────────────────────────────────────
        modelBuilder.Entity<Employee>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Code).IsUnique();
            e.Property(x => x.Salary).HasColumnType("decimal(18,2)");
            e.HasOne(x => x.Facility)
             .WithMany(f => f.Employees)
             .HasForeignKey(x => x.FacilityId)
             .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Facility (self-referencing hierarchy) ─────────────────────────────
        modelBuilder.Entity<Facility>(f =>
        {
            f.HasKey(x => x.Id);
            f.HasOne(x => x.Parent)
             .WithMany(x => x.Children)
             .HasForeignKey(x => x.ParentId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Transfer (complex types stored as JSON columns) ───────────────────
        modelBuilder.Entity<Transfer>(t =>
        {
            t.HasKey(x => x.Id);

            t.Property(x => x.Changes)
             .HasColumnType("nvarchar(max)")
             .HasConversion(
                 v => v == null ? null : JsonSerializer.Serialize(v, JsonOpts),
                 v => v == null ? null : JsonSerializer.Deserialize<TransferChanges>(v, JsonOpts));

            t.Property(x => x.Settlement)
             .HasColumnType("nvarchar(max)")
             .HasConversion(
                 v => v == null ? null : JsonSerializer.Serialize(v, JsonOpts),
                 v => v == null ? null : JsonSerializer.Deserialize<TransferSettlement>(v, JsonOpts));

            t.Property(x => x.AuditLog)
             .HasColumnType("nvarchar(max)")
             .HasConversion(
                 v => JsonSerializer.Serialize(v, JsonOpts),
                 v => JsonSerializer.Deserialize<List<TransferAuditEntry>>(v, JsonOpts) ?? new())
             .Metadata.SetValueComparer(new ValueComparer<List<TransferAuditEntry>>(
                 (a, b) => JsonSerializer.Serialize(a, JsonOpts) == JsonSerializer.Serialize(b, JsonOpts),
                 v => JsonSerializer.Serialize(v, JsonOpts).GetHashCode(),
                 v => JsonSerializer.Deserialize<List<TransferAuditEntry>>(JsonSerializer.Serialize(v, JsonOpts), JsonOpts)!));

            t.HasOne(x => x.Employee)
             .WithMany(e => e.Transfers)
             .HasForeignKey(x => x.EmployeeId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
