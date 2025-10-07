using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace backend.Services
{
    public class PaperGenerationService : IPaperGenerationService
    {
        private readonly IPaperGenerationRepository _repository;
        private readonly AppDbContext _context;

        public PaperGenerationService(IPaperGenerationRepository repository, AppDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        public async Task<PaperGeneration> LogPaperGenerationAsync(
            string teacherId, 
            string teacherEmail, 
            List<Guid> questionIds, 
            string? paperTitle = null)
        {
            var paperGeneration = new PaperGeneration
            {
                TeacherId = teacherId,
                TeacherEmail = teacherEmail,
                QuestionIds = JsonSerializer.Serialize(questionIds),
                PaperTitle = paperTitle,
                TotalQuestions = questionIds.Count,
                GeneratedAt = DateTime.UtcNow
            };

            return await _repository.LogPaperGenerationAsync(paperGeneration);
        }

        public async Task<IEnumerable<PaperGeneration>> GetAllGenerationsAsync()
        {
            return await _repository.GetAllGenerationsAsync();
        }

        public async Task<IEnumerable<PaperGeneration>> GetTeacherGenerationsAsync(string teacherId)
        {
            return await _repository.GetByTeacherIdAsync(teacherId);
        }

        public async Task<PaperAnalyticsDto> GetAnalyticsAsync(int days = 30)
        {
            var startDate = DateTime.UtcNow.AddDays(-days);
            var generations = await _repository.GetGenerationsByDateRangeAsync(startDate, null);

            // Get most selected questions
            var questionSelectionCounts = await _repository.GetMostSelectedQuestionsAsync(10);
            var mostSelectedQuestions = new Dictionary<Guid, QuestionSelectionDto>();

            foreach (var kvp in questionSelectionCounts)
            {
                var question = await _context.Questions
                    .Include(q => q.Subject)
                    .Include(q => q.School)
                    .FirstOrDefaultAsync(q => q.Id == kvp.Key);

                if (question != null)
                {
                    mostSelectedQuestions[kvp.Key] = new QuestionSelectionDto
                    {
                        QuestionId = kvp.Key,
                        SelectionCount = kvp.Value,
                        QuestionText = $"{question.ExamType} - {question.PaperCategory} ({question.Year ?? 0})",
                        Subject = question.Subject?.Name,
                        School = question.School?.Name
                    };
                }
            }

            // Get popular subjects
            var popularSubjects = await _repository.GetPopularSubjectsAsync();

            // Get teacher activity
            var teacherActivity = await _repository.GetTeacherActivityAsync();

            // Calculate generation trend
            var generationTrend = generations
                .GroupBy(g => g.GeneratedAt.Date)
                .Select(g => new PaperGenerationTrendDto
                {
                    Date = g.Key.ToString("yyyy-MM-dd"),
                    Count = g.Count()
                })
                .OrderBy(x => x.Date)
                .ToList();

            return new PaperAnalyticsDto
            {
                TotalPapersGenerated = generations.Count(),
                MostSelectedQuestions = mostSelectedQuestions,
                PopularSubjects = popularSubjects,
                TeacherActivity = teacherActivity,
                GenerationTrend = generationTrend
            };
        }
    }
}
