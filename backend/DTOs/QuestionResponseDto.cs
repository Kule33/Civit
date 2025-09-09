// backend/DTOs/QuestionResponseDto.cs
using System;

namespace backend.DTOs
{
    public class QuestionResponseDto
    {
        public Guid Id { get; set; }
        public string Country { get; set; } = string.Empty;
        public string ExamType { get; set; } = string.Empty;
        public string? Stream { get; set; }
        public string? Subject { get; set; }
        public string? PaperType { get; set; }
        public string PaperCategory { get; set; } = string.Empty;
        public int? Year { get; set; }
        public string? Term { get; set; }
        public string? SchoolName { get; set; }
        public string? Uploader { get; set; }
        public string FileUrl { get; set; } = string.Empty; // The publicly accessible URL
        public string? FilePublicId { get; set; } // <--- ADD THIS LINE
        public string? UniqueKey { get; set; }
        public DateTime UploadDate { get; set; }
    }
}