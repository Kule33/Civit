// backend/Repositories/QuestionRepository.cs
using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

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

        public async Task<IEnumerable<Question>> GetAllQuestionsAsync()
        {
            return await _context.Questions.ToListAsync();
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
                    return false; // Question not found
                }
                throw; // Other concurrency issue
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

        public async Task<Question?> GetQuestionByUniqueKeyAsync(string uniqueKey)
        {
            return await _context.Questions.FirstOrDefaultAsync(q => q.UniqueKey == uniqueKey);
        }

        private async Task<bool> QuestionExists(Guid id)
        {
            return await _context.Questions.AnyAsync(e => e.Id == id);
        }
    }
}