using backend.Models;

namespace backend.Services.Interfaces
{
    public interface IPaperGenerationService
    {
        Task<PaperGeneration> LogPaperGenerationAsync(string teacherId, string teacherEmail, List<Guid> questionIds, string? paperTitle = null);
        Task<IEnumerable<PaperGeneration>> GetAllGenerationsAsync();
        Task<IEnumerable<PaperGeneration>> GetTeacherGenerationsAsync(string teacherId);
        Task<PaperAnalyticsDto> GetAnalyticsAsync(int days = 30);
    }

    public class PaperAnalyticsDto
    {
        public int TotalPapersGenerated { get; set; }
        public Dictionary<Guid, QuestionSelectionDto> MostSelectedQuestions { get; set; } = new();
        public Dictionary<string, int> PopularSubjects { get; set; } = new();
        public Dictionary<string, int> TeacherActivity { get; set; } = new();
        public List<PaperGenerationTrendDto> GenerationTrend { get; set; } = new();
    }

    public class QuestionSelectionDto
    {
        public Guid QuestionId { get; set; }
        public int SelectionCount { get; set; }
        public string? QuestionText { get; set; }
        public string? Subject { get; set; }
        public string? School { get; set; }
    }

    public class PaperGenerationTrendDto
    {
        public string Date { get; set; } = string.Empty;
        public int Count { get; set; }
    }
}
