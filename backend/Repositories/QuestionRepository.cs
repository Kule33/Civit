using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq; // Important: Add this
using backend.DTOs; // Important: Add this
using backend.Helpers; // For SharedSubjects helper

namespace backend.Repositories
{
    public class QuestionRepository : IQuestionRepository
    {
        private readonly AppDbContext _context;

        public QuestionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Question> AddQuestionAsync(Question question)
        {
            await _context.Questions.AddAsync(question);
            await _context.SaveChangesAsync();
            return question;
        }

        public async Task<Question?> GetQuestionByIdAsync(Guid id)
        {
            return await _context.Questions.FindAsync(id);
        }

        public async Task<Question?> GetQuestionByIdWithDetailsAsync(Guid id)
        {
            return await _context.Questions
                .Include(q => q.Subject) // Eagerly load Subject details
                .Include(q => q.School)   // Eagerly load School details
                .FirstOrDefaultAsync(q => q.Id == id);
        }

        // Removed GetAllQuestionsAsync if it's not being used elsewhere to avoid confusion.
        // If it's used, ensure it also includes Subject and School for consistent data.
        // public async Task<IEnumerable<Question>> GetAllQuestionsAsync()
        // {
        //     return await _context.Questions.ToListAsync();
        // }

        public async Task<IEnumerable<Question>> GetAllQuestionsWithDetailsAsync()
        {
            return await _context.Questions
                .Include(q => q.Subject) // Eagerly load Subject details
                .Include(q => q.School)   // Eagerly load School details
                .ToListAsync();
        }

        // New method to get filtered questions
        public async Task<IEnumerable<Question>> GetFilteredQuestionsAsync(QuestionSearchDto searchDto)
        {
            IQueryable<Question> query = _context.Questions
                .Include(q => q.Subject) // **IMPORTANT: Include Subject**
                .Include(q => q.School);   // **IMPORTANT: Include School**

            if (!string.IsNullOrWhiteSpace(searchDto.Country))
            {
                // Case-insensitive country search
                // Also treat NULL or empty country as "Sri Lanka" (our default)
                var searchCountry = searchDto.Country.ToLower();
                query = query.Where(q => 
                    q.Country.ToLower() == searchCountry ||
                    (string.IsNullOrWhiteSpace(q.Country) && searchCountry == "sri lanka"));
            }
            if (!string.IsNullOrWhiteSpace(searchDto.ExamType))
            {
                query = query.Where(q => q.ExamType == searchDto.ExamType);
            }

            // Special handling for shared subjects (Physics & Chemistry)
            // These subjects are shared between Physical and Biological streams
            bool isSharedSubject = !string.IsNullOrWhiteSpace(searchDto.Subject) && 
                                   SharedSubjects.IsSharedSubject(searchDto.Subject);

            if (!string.IsNullOrWhiteSpace(searchDto.Stream))
            {
                // If the subject is shared (Physics or Chemistry), include both Physical and Biological streams
                if (isSharedSubject)
                {
                    // For shared subjects, query questions from both Physical and Biological streams
                    query = query.Where(q => 
                        q.Stream == "physical" || 
                        q.Stream == "biological");
                }
                else
                {
                    // For non-shared subjects, use exact stream match
                    query = query.Where(q => q.Stream == searchDto.Stream);
                }
            }

            if (!string.IsNullOrWhiteSpace(searchDto.Subject))
            {
                // Ensure Subject is loaded before trying to access its Name
                query = query.Where(q => q.Subject != null && q.Subject.Name == searchDto.Subject);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.PaperType))
            {
                query = query.Where(q => q.PaperType == searchDto.PaperType);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.PaperCategory))
            {
                query = query.Where(q => q.PaperCategory == searchDto.PaperCategory);
            }
            if (searchDto.Year.HasValue)
            {
                query = query.Where(q => q.Year == searchDto.Year.Value);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.Term))
            {
                query = query.Where(q => q.Term == searchDto.Term);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.SchoolName))
            {
                // Ensure School is loaded before trying to access its Name
                query = query.Where(q => q.School != null && q.School.Name == searchDto.SchoolName);
            }

            return await query.ToListAsync();
        }

        public async Task<bool> UpdateQuestionAsync(Question question)
        {
            _context.Entry(question).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await QuestionExists(question.Id))
                {
                    return false;
                }
                throw;
            }
        }

        public async Task<bool> DeleteQuestionAsync(Guid id)
        {
            var question = await _context.Questions.FindAsync(id);
            if (question == null)
            {
                return false;
            }

            _context.Questions.Remove(question);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<bool> QuestionExists(Guid id)
        {
            return await _context.Questions.AnyAsync(e => e.Id == id);
        }

        public async Task<int> CountByUploaderAsync(string uploaderEmail)
        {
            return await _context.Questions
                .Where(q => q.Uploader == uploaderEmail)
                .CountAsync();
        }
    }
}