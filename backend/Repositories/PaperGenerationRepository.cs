using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace backend.Repositories
{
    public class PaperGenerationRepository : IPaperGenerationRepository
    {
        private readonly AppDbContext _context;

        public PaperGenerationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PaperGeneration> LogPaperGenerationAsync(PaperGeneration paperGeneration)
        {
            _context.PaperGenerations.Add(paperGeneration);
            await _context.SaveChangesAsync();
            return paperGeneration;
        }

        public async Task<IEnumerable<PaperGeneration>> GetAllGenerationsAsync()
        {
            return await _context.PaperGenerations
                .OrderByDescending(pg => pg.GeneratedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<PaperGeneration>> GetByTeacherIdAsync(string teacherId)
        {
            return await _context.PaperGenerations
                .Where(pg => pg.TeacherId == teacherId)
                .OrderByDescending(pg => pg.GeneratedAt)
                .ToListAsync();
        }

        public async Task<Dictionary<Guid, int>> GetMostSelectedQuestionsAsync(int limit = 10)
        {
            var allGenerations = await _context.PaperGenerations.ToListAsync();
            
            var questionCounts = new Dictionary<Guid, int>();

            foreach (var generation in allGenerations)
            {
                try
                {
                    var questionIds = JsonSerializer.Deserialize<List<Guid>>(generation.QuestionIds);
                    if (questionIds != null)
                    {
                        foreach (var questionId in questionIds)
                        {
                            if (questionCounts.ContainsKey(questionId))
                            {
                                questionCounts[questionId]++;
                            }
                            else
                            {
                                questionCounts[questionId] = 1;
                            }
                        }
                    }
                }
                catch (JsonException)
                {
                    // Skip invalid JSON
                    continue;
                }
            }

            return questionCounts
                .OrderByDescending(kvp => kvp.Value)
                .Take(limit)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        }

        public async Task<Dictionary<string, int>> GetPopularSubjectsAsync()
        {
            var allGenerations = await _context.PaperGenerations.ToListAsync();
            var subjectCounts = new Dictionary<string, int>();

            foreach (var generation in allGenerations)
            {
                try
                {
                    var questionIds = JsonSerializer.Deserialize<List<Guid>>(generation.QuestionIds);
                    if (questionIds != null && questionIds.Any())
                    {
                        // Get subjects for these questions
                        var questions = await _context.Questions
                            .Include(q => q.Subject)
                            .Where(q => questionIds.Contains(q.Id))
                            .ToListAsync();

                        foreach (var question in questions)
                        {
                            var subjectName = question.Subject?.Name ?? "Unknown";
                            if (subjectCounts.ContainsKey(subjectName))
                            {
                                subjectCounts[subjectName]++;
                            }
                            else
                            {
                                subjectCounts[subjectName] = 1;
                            }
                        }
                    }
                }
                catch (JsonException)
                {
                    continue;
                }
            }

            return subjectCounts
                .OrderByDescending(kvp => kvp.Value)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value);
        }

        public async Task<Dictionary<string, int>> GetTeacherActivityAsync()
        {
            var teacherActivity = await _context.PaperGenerations
                .GroupBy(pg => pg.TeacherEmail)
                .Select(g => new { TeacherEmail = g.Key, Count = g.Count() })
                .OrderByDescending(x => x.Count)
                .ToDictionaryAsync(x => x.TeacherEmail, x => x.Count);

            return teacherActivity;
        }

        public async Task<IEnumerable<PaperGeneration>> GetGenerationsByDateRangeAsync(DateTime? startDate, DateTime? endDate)
        {
            var query = _context.PaperGenerations.AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(pg => pg.GeneratedAt >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(pg => pg.GeneratedAt <= endDate.Value);
            }

            return await query
                .OrderByDescending(pg => pg.GeneratedAt)
                .ToListAsync();
        }

        public async Task<(int totalPapers, int totalQuestions, DateTime? lastGenerated, DateTime? firstGenerated)> GetUserStatsAsync(string teacherId)
        {
            var userPapers = await _context.PaperGenerations
                .Where(pg => pg.TeacherId == teacherId)
                .OrderByDescending(pg => pg.GeneratedAt)
                .ToListAsync();

            if (!userPapers.Any())
            {
                return (0, 0, null, null);
            }

            var totalPapers = userPapers.Count;
            var totalQuestions = userPapers.Sum(pg => pg.TotalQuestions);
            var lastGenerated = userPapers.Max(pg => pg.GeneratedAt);
            var firstGenerated = userPapers.Min(pg => pg.GeneratedAt);

            return (totalPapers, totalQuestions, lastGenerated, firstGenerated);
        }
    }
}
