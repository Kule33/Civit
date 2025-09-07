// backend/DTOs/QuestionUploadDto.cs
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class QuestionUploadDto
    {
        [Required(ErrorMessage = "Country is required.")]
        [StringLength(255)]
        public string Country { get; set; } = string.Empty;

        [Required(ErrorMessage = "Exam Type is required.")]
        [StringLength(255)]
        public string ExamType { get; set; } = string.Empty;

        [StringLength(255)]
        public string? Stream { get; set; }

        [StringLength(255)]
        public string? Subject { get; set; }

        [StringLength(255)]
        public string? PaperType { get; set; }

        [Required(ErrorMessage = "Paper Category is required.")]
        [StringLength(255)]
        public string PaperCategory { get; set; } = string.Empty;

        public int? Year { get; set; }

        [StringLength(255)]
        public string? Term { get; set; }

        [StringLength(500)]
        public string? SchoolName { get; set; }

        [StringLength(255)]
        public string? Uploader { get; set; }

        [Required(ErrorMessage = "File is required.")]
        public IFormFile File { get; set; } = default!; // Keep as single file
    }
}