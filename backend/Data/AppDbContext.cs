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
        }
    }
}