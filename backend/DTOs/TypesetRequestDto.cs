using System;

namespace backend.DTOs
{
    // DTO for creating a new typeset request (from frontend)
    public class TypesetRequestCreateDto
    {
        public string PaperFilePath { get; set; } = string.Empty;
        public string? UserMessage { get; set; }
        public string? PaperMetadata { get; set; } // JSON string
    }

    // DTO for returning typeset request details
    public class TypesetRequestResponseDto
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string? PaperFilePath { get; set; }
        public string? CloudinaryUrl { get; set; }
        public string? UserMessage { get; set; }
        public string? PaperMetadata { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? AdminNotes { get; set; }
        public string? AdminProcessedBy { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }

    // DTO for admin to update typeset request
    public class TypesetRequestUpdateDto
    {
        public string Status { get; set; } = string.Empty;
        public string? AdminNotes { get; set; }
        public string? AdminProcessedBy { get; set; }
    }

    // DTO for listing typeset requests in user profile
    public class TypesetRequestListDto
    {
        public int Id { get; set; }
        public string? Subject { get; set; }
        public string? ExamType { get; set; }
        public string? Stream { get; set; }
        public int QuestionCount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; }
        public string? AdminNotes { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
