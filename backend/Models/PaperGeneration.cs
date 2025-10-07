using System;
using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class PaperGeneration
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string TeacherId { get; set; } = string.Empty;

        [Required]
        public string TeacherEmail { get; set; } = string.Empty;

        // JSON string array of question IDs that were selected for the paper
        [Required]
        public string QuestionIds { get; set; } = "[]";

        // Metadata about the generated paper
        public string? PaperTitle { get; set; }
        public int TotalQuestions { get; set; }

        [Required]
        public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    }
}
