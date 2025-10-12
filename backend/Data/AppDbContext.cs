using backend.Models;
using Microsoft.EntityFrameworkCore;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Question> Questions { get; set; }
        public DbSet<Subject> Subjects { get; set; }
        public DbSet<School> Schools { get; set; }
        public DbSet<Typeset> Typesets { get; set; }
        public DbSet<PaperGeneration> PaperGenerations { get; set; }
        public DbSet<UserProfile> UserProfiles { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Paper> Papers { get; set; }
        public DbSet<Marking> Markings { get; set; }
        public DbSet<PaperDownload> PaperDownloads { get; set; }
        public DbSet<TypesetRequest> TypesetRequests { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure Question entity
            modelBuilder.Entity<Question>(entity =>
            {
                entity.HasKey(q => q.Id);
                entity.Property(q => q.Id).ValueGeneratedOnAdd();
                
                // Configure Subject relationship
                entity.HasOne(q => q.Subject)
                    .WithMany(s => s.Questions)
                    .HasForeignKey(q => q.SubjectId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Configure School relationship  
                entity.HasOne(q => q.School)
                    .WithMany(s => s.Questions)
                    .HasForeignKey(q => q.SchoolId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Subject entity
            modelBuilder.Entity<Subject>(entity =>
            {
                entity.HasKey(s => s.Id);
                entity.HasIndex(s => s.Name).IsUnique();
            });

            // Configure School entity
            modelBuilder.Entity<School>(entity =>
            {
                entity.HasKey(s => s.Id);
                entity.HasIndex(s => s.Name).IsUnique();
            });

            // Configure Typeset entity
            modelBuilder.Entity<Typeset>(entity =>
            {
                entity.HasKey(t => t.Id);
                
                // Unique index on QuestionId to enforce 1:1 relationship
                entity.HasIndex(t => t.QuestionId).IsUnique();
                
                // Configure Question relationship with cascade delete
                entity.HasOne(t => t.Question)
                    .WithMany()
                    .HasForeignKey(t => t.QuestionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure UserProfile entity
            modelBuilder.Entity<UserProfile>(entity =>
            {
                entity.HasKey(e => e.Id); // String UUID primary key, no auto-generation
                
                // Indexes
                entity.HasIndex(e => e.Email);
                entity.HasIndex(e => e.NIC).IsUnique();
                
                // Default values
                entity.Property(e => e.Role)
                    .HasDefaultValue("teacher");
                
                entity.Property(e => e.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.Property(e => e.UpdatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            });

            // Configure Paper entity
            modelBuilder.Entity<Paper>(entity =>
            {
                entity.HasKey(p => p.Id);
                entity.Property(p => p.Id).ValueGeneratedOnAdd();
                
                // Configure Subject relationship
                entity.HasOne(p => p.Subject)
                    .WithMany()
                    .HasForeignKey(p => p.SubjectId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Configure School relationship  
                entity.HasOne(p => p.School)
                    .WithMany()
                    .HasForeignKey(p => p.SchoolId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure Marking entity
            modelBuilder.Entity<Marking>(entity =>
            {
                entity.HasKey(m => m.Id);
                entity.Property(m => m.Id).ValueGeneratedOnAdd();
                
                // Configure Subject relationship
                entity.HasOne(m => m.Subject)
                    .WithMany()
                    .HasForeignKey(m => m.SubjectId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Configure School relationship  
                entity.HasOne(m => m.School)
                    .WithMany()
                    .HasForeignKey(m => m.SchoolId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Configure PaperDownload entity
            modelBuilder.Entity<PaperDownload>(entity =>
            {
                entity.HasKey(pd => pd.Id);
                
                // Indexes for efficient querying
                entity.HasIndex(pd => pd.UserId);
                entity.HasIndex(pd => pd.ResourceId);
                entity.HasIndex(pd => pd.ResourceType);
                entity.HasIndex(pd => pd.DownloadedAt);
            });

            // Configure TypesetRequest entity
            modelBuilder.Entity<TypesetRequest>(entity =>
            {
                entity.HasKey(tr => tr.Id);
                entity.Property(tr => tr.Id).ValueGeneratedOnAdd();
                
                // Configure UserProfile relationship
                entity.HasOne(tr => tr.User)
                    .WithMany()
                    .HasForeignKey(tr => tr.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                // Indexes for efficient querying
                entity.HasIndex(tr => tr.UserId);
                entity.HasIndex(tr => tr.Status);
                entity.HasIndex(tr => tr.RequestedAt);
                
                // Default values
                entity.Property(tr => tr.Status)
                    .HasDefaultValue("Pending");
                
                entity.Property(tr => tr.CreatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
                
                entity.Property(tr => tr.UpdatedAt)
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
        }
    }
}