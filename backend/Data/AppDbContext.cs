// backend/Data/AppDbContext.cs
using Microsoft.EntityFrameworkCore;
using backend.Models;

namespace backend.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        public DbSet<Question> Questions { get; set; } = default!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Optional: Configure any specific model constraints or relationships here
            // For example, if you wanted UniqueKey to be unique:
            modelBuilder.Entity<Question>()
                .HasIndex(q => q.UniqueKey)
                .IsUnique();
        }
    }
}