using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class TypesetRequest
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string UserId { get; set; } = string.Empty; // Supabase UUID

        [Required]
        [MaxLength(255)]
        public string UserEmail { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string UserName { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? PaperFilePath { get; set; } // Temp file path

        [MaxLength(1000)]
        public string? CloudinaryUrl { get; set; } // If uploaded to Cloudinary later

        [MaxLength(500)]
        public string? UserMessage { get; set; } // Optional instructions from user

        public string? PaperMetadata { get; set; } // JSON string with paper details

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = TypesetRequestStatus.Pending; // Pending, InProgress, Completed, Rejected

        public string? AdminNotes { get; set; } // Admin feedback/notes

        [MaxLength(255)]
        public string? AdminProcessedBy { get; set; } // Admin email who processed

        public DateTime RequestedAt { get; set; } = DateTime.UtcNow;

        public DateTime? CompletedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        public UserProfile? User { get; set; }
    }

    // Status constants
    public static class TypesetRequestStatus
    {
        public const string Pending = "Pending";
        public const string InProgress = "InProgress";
        public const string Completed = "Completed";
        public const string Rejected = "Rejected";

        public static bool IsValidStatus(string status)
        {
            return status == Pending || status == InProgress || status == Completed || status == Rejected;
        }
    }
}
