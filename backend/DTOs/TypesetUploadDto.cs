using System;

namespace backend.DTOs
{
    public class TypesetUploadDto
    {
        public Guid QuestionId { get; set; }
        public string FileUrl { get; set; } = string.Empty;
        public string? FilePublicId { get; set; }
        public string? FileName { get; set; }
    }
}
