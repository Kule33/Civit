using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Collections.Generic;

namespace backend.Models
{
    public class Question
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [StringLength(255)]
        public string Country { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string ExamType { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Stream { get; set; }

        // Foreign Key for Subject
        public int? SubjectId { get; set; }
        [ForeignKey("SubjectId")]
        public Subject? Subject { get; set; }

        [StringLength(255)]
        public string? PaperType { get; set; }

        [Required]
        [StringLength(255)]
        public string PaperCategory { get; set; } = string.Empty;

        public int? Year { get; set; }

        [StringLength(255)]
        public string? Term { get; set; }

        // Foreign Key for School
        public int? SchoolId { get; set; }
        [ForeignKey("SchoolId")]
        public School? School { get; set; }

        [StringLength(255)]
        public string? Uploader { get; set; }

        [Required]
        public string FileUrl { get; set; } = string.Empty;

        [StringLength(255)]
        public string? FilePublicId { get; set; }

        public DateTime UploadDate { get; set; } = DateTime.UtcNow;
        
        // Navigation property for related Typesets (one-to-many relationship)
        // This enables eager loading to prevent N+1 query problems
        public ICollection<Typeset> Typesets { get; set; } = new List<Typeset>();
        
        // REMOVED: UniqueKey property
        // [StringLength(500)]
        // public string? UniqueKey { get; set; } 
    }
}