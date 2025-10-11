namespace backend.Services.DTOs;

public class UserActivityStatsDto
{
    public int TotalPapersGenerated { get; set; }
    public int TotalQuestionsUsed { get; set; }
    public DateTime? LastPaperGeneratedAt { get; set; }
    public DateTime? FirstPaperGeneratedAt { get; set; }
    public List<PaperGenerationSummaryDto> RecentPapers { get; set; } = new();
    
    // Admin-only statistics
    public int? TotalQuestionsUploaded { get; set; }
    public int? TotalTypesetsUploaded { get; set; }
    
    // Download statistics
    public int TotalPapersDownloaded { get; set; }
    public int TotalMarkingsDownloaded { get; set; }
    public int TotalDownloads { get; set; }
    public List<DownloadSummaryDto> RecentDownloads { get; set; } = new();
    
    // Upload statistics (Admin only)
    public int? TotalPapersUploaded { get; set; }
    public int? TotalMarkingsUploaded { get; set; }
    public List<UploadSummaryDto> RecentUploads { get; set; } = new();
}

public class PaperGenerationSummaryDto
{
    public int Id { get; set; }
    public string? PaperTitle { get; set; }
    public int TotalQuestions { get; set; }
    public DateTime GeneratedAt { get; set; }
}

public class DownloadSummaryDto
{
    public int Id { get; set; }
    public Guid ResourceId { get; set; }
    public string ResourceType { get; set; } = string.Empty; // "paper" or "marking"
    public DateTime DownloadedAt { get; set; }
    public string? Country { get; set; }
    public string? Subject { get; set; }
    public int? Year { get; set; }
}

public class UploadSummaryDto
{
    public Guid Id { get; set; }
    public string ResourceType { get; set; } = string.Empty; // "paper" or "marking"
    public DateTime UploadDate { get; set; }
    public string? Country { get; set; }
    public string? Subject { get; set; }
    public int? Year { get; set; }
    public string? ExamType { get; set; }
    public string? FileName { get; set; }
}
