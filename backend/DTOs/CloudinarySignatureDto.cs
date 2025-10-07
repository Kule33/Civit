namespace backend.DTOs
{
    public class CloudinarySignatureRequestDto
    {
        public string? Country { get; set; }
        public string? ExamType { get; set; }
        public string? Stream { get; set; }
        public string? Subject { get; set; }
        public string? PaperType { get; set; }
        public string? PaperCategory { get; set; }
        public string? Folder { get; set; } // For direct folder specification
        public string? ResourceType { get; set; } // For raw file uploads ("raw", "image", "video", etc.)
    }

    public class CloudinarySignatureResponseDto
    {
        public string Signature { get; set; } = string.Empty;
        public long Timestamp { get; set; }
        public string ApiKey { get; set; } = string.Empty;
        public string CloudName { get; set; } = string.Empty;
        public string Folder { get; set; } = string.Empty;
    }

    public class CloudinaryUploadResultDto
    {
        public string PublicId { get; set; } = string.Empty;
        public string SecureUrl { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public long Bytes { get; set; }
    }
}