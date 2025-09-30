// backend/DTOs/QuestionUploadDto.cs - Complete version from your original
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    public class QuestionUploadDto
    {
        // Keep existing metadata properties
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
        public string? Title { get; set; }

        // Add properties for Cloudinary upload results
        public string FileUrl { get; set; } = string.Empty;
        public string FilePublicId { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string FileFormat { get; set; } = string.Empty;
    }
}