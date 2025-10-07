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
        
        // Change to reflect the normalized structure
        public SubjectDto? Subject { get; set; } // Now a SubjectDto object
        // OR public string? SubjectName { get; set; } // If you prefer just the name
        // OR public int? SubjectId { get; set; } // If you prefer just the ID

        public string? PaperType { get; set; }
        public string PaperCategory { get; set; } = string.Empty;
        public int? Year { get; set; }
        public string? Term { get; set; }
        
        // Change to reflect the normalized structure
        public SchoolDto? School { get; set; } // Now a SchoolDto object
        // OR public string? SchoolName { get; set; } // If you prefer just the name
        // OR public int? SchoolId { get; set; } // If you prefer just the ID

        public string? Uploader { get; set; }
        public string FileUrl { get; set; } = string.Empty;
        public string? FilePublicId { get; set; }
        public DateTime UploadDate { get; set; }
        public string? UniqueKey { get; set; }
        
        // Typeset availability
        public bool TypesetAvailable { get; set; }
        public string? TypesetFileUrl { get; set; }
        public string? TypesetFileName { get; set; }
    }
}