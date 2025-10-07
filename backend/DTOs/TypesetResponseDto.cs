using System;

namespace backend.DTOs
{
    public class TypesetResponseDto
    {
        public Guid Id { get; set; }
        public Guid QuestionId { get; set; }
        public string FileUrl { get; set; } = string.Empty;
        public string? FilePublicId { get; set; }
        public string? FileName { get; set; }
        public int Version { get; set; }
        public bool IsActive { get; set; }
        public DateTime UploadedAt { get; set; }
    }
}
