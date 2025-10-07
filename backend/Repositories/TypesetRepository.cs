using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Threading.Tasks;

namespace backend.Repositories
{
    public class TypesetRepository : ITypesetRepository
    {
        private readonly AppDbContext _context;

        public TypesetRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Typeset?> GetByIdAsync(Guid id)
        {
            return await _context.Typesets
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);
        }

        public async Task<Typeset?> GetByQuestionIdAsync(Guid questionId)
        {
            return await _context.Typesets
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.QuestionId == questionId && t.IsActive);
        }

        public async Task<Typeset> UpsertAsync(Typeset typeset)
        {
            var existing = await _context.Typesets
                .FirstOrDefaultAsync(t => t.QuestionId == typeset.QuestionId && t.IsActive);

            if (existing == null)
            {
                // Insert new typeset
                _context.Typesets.Add(typeset);
            }
            else
            {
                // Update existing typeset
                existing.FileUrl = typeset.FileUrl;
                existing.FilePublicId = typeset.FilePublicId;
                existing.FileName = typeset.FileName;
                existing.Version += 1;
                existing.UploadedAt = DateTime.UtcNow;
                _context.Typesets.Update(existing);
                typeset = existing;
            }

            await _context.SaveChangesAsync();
            return typeset;
        }

        public async Task<bool> DeleteAsync(Guid id)
        {
            var typeset = await _context.Typesets.FindAsync(id);
            if (typeset == null)
            {
                return false;
            }

            _context.Typesets.Remove(typeset);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
