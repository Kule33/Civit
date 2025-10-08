namespace backend.Services.DTOs;

public class UserActivityStatsDto
{
    public int TotalPapersGenerated { get; set; }
    public int TotalQuestionsUsed { get; set; }
    public DateTime? LastPaperGeneratedAt { get; set; }
    public DateTime? FirstPaperGeneratedAt { get; set; }
    public List<PaperGenerationSummaryDto> RecentPapers { get; set; } = new();
}

public class PaperGenerationSummaryDto
{
    public int Id { get; set; }
    public string? PaperTitle { get; set; }
    public int TotalQuestions { get; set; }
    public DateTime GeneratedAt { get; set; }
}
