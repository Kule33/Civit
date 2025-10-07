using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models
{
    public class Typeset
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        public Guid QuestionId { get; set; }

        [ForeignKey(nameof(QuestionId))]
        public Question Question { get; set; } = null!;

        [Required]
        [MaxLength(1024)]
        public string FileUrl { get; set; } = string.Empty;

        [MaxLength(256)]
        public string? FilePublicId { get; set; }

        [MaxLength(128)]
        public string? FileName { get; set; }

        public int Version { get; set; } = 1;

        public bool IsActive { get; set; } = true;

        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    }
}
