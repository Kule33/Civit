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
            var allQuestionIds = new HashSet<Guid>();

            // 1. Collect all unique question IDs (First Pass)
            // We deserialize here to find out which questions we need to fetch.
            foreach (var generation in allGenerations)
            {
                try
                {
                    if (string.IsNullOrEmpty(generation.QuestionIds)) continue;

                    var questionIds = JsonSerializer.Deserialize<List<Guid>>(generation.QuestionIds);
                    if (questionIds != null)
                    {
                        foreach (var id in questionIds)
                        {
                            allQuestionIds.Add(id);
                        }
                    }
                }
                catch (JsonException)
                {
                    continue;
                }
            }

            if (!allQuestionIds.Any())
            {
                return subjectCounts;
            }

            // 2. Fetch all questions with subjects in batches to avoid SQL parameter limits
            // This solves the N+1 problem by fetching all needed data in a few queries.
            var questionsWithSubjects = new Dictionary<Guid, string>();
            var allIdsList = allQuestionIds.ToList();
            var batchSize = 1000; 

            for (int i = 0; i < allIdsList.Count; i += batchSize)
            {
                var batch = allIdsList.Skip(i).Take(batchSize).ToList();
                
                var batchResults = await _context.Questions
                    .Where(q => batch.Contains(q.Id))
                    .Select(q => new { q.Id, SubjectName = q.Subject != null ? q.Subject.Name : "Unknown" })
                    .ToListAsync();

                foreach (var item in batchResults)
                {
                    if (!questionsWithSubjects.ContainsKey(item.Id))
                    {
                        questionsWithSubjects[item.Id] = item.SubjectName;
                    }
                }
            }

            // 3. Count subjects (Second Pass)
            // We deserialize again to process the counts. This avoids holding all deserialized lists in memory at once.
            foreach (var generation in allGenerations)
            {
                try
                {
                    if (string.IsNullOrEmpty(generation.QuestionIds)) continue;

                    var questionIds = JsonSerializer.Deserialize<List<Guid>>(generation.QuestionIds);
                    if (questionIds != null)
                    {
                        foreach (var qId in questionIds)
                        {
                            if (questionsWithSubjects.TryGetValue(qId, out var subjectName))
                            {
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
