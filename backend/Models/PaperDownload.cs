using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class PaperDownload
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(36)]
        public string UserId { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string UserEmail { get; set; } = string.Empty;

        [Required]
        public Guid ResourceId { get; set; } // Paper or Marking ID

        [Required]
        [StringLength(20)]
        public string ResourceType { get; set; } = string.Empty; // "paper" or "marking"

        [Required]
        public DateTime DownloadedAt { get; set; } = DateTime.UtcNow;

        // Optional metadata for filtering
        [StringLength(255)]
        public string? Country { get; set; }

        [StringLength(255)]
        public string? Subject { get; set; }

        public int? Year { get; set; }
    }
}
