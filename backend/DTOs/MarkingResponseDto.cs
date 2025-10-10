using System;

namespace backend.DTOs
{
    public class MarkingResponseDto
    {
        public Guid Id { get; set; }
        public string Country { get; set; } = string.Empty;
        public string ExamType { get; set; } = string.Empty;
        public string? Stream { get; set; }
        
        // Subject information
        public SubjectDto? Subject { get; set; }
        
        public string? PaperType { get; set; }
        public string PaperCategory { get; set; } = string.Empty;
        public int? Year { get; set; }
        public string? Term { get; set; }
        
        // School information
        public SchoolDto? School { get; set; }
        
        public string? Uploader { get; set; }
        public string FileUrl { get; set; } = string.Empty;
        public string? FilePublicId { get; set; }
        public string? FileName { get; set; }
        public long FileSize { get; set; }
        public string FileFormat { get; set; } = "pdf";
        public DateTime UploadDate { get; set; }
        public string? UploadedBy { get; set; }
    }
}
