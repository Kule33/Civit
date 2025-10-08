using backend.Models;

namespace backend.Repositories.Interfaces
{
    public interface IPaperGenerationRepository
    {
        Task<PaperGeneration> LogPaperGenerationAsync(PaperGeneration paperGeneration);
        Task<IEnumerable<PaperGeneration>> GetAllGenerationsAsync();
        Task<IEnumerable<PaperGeneration>> GetByTeacherIdAsync(string teacherId);
        Task<Dictionary<Guid, int>> GetMostSelectedQuestionsAsync(int limit = 10);
        Task<Dictionary<string, int>> GetPopularSubjectsAsync();
        Task<Dictionary<string, int>> GetTeacherActivityAsync();
        Task<IEnumerable<PaperGeneration>> GetGenerationsByDateRangeAsync(DateTime? startDate, DateTime? endDate);
        Task<(int totalPapers, int totalQuestions, DateTime? lastGenerated, DateTime? firstGenerated)> GetUserStatsAsync(string teacherId);
    }
}
