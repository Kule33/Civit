using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Repositories
{
    public class MarkingRepository : IMarkingRepository
    {
        private readonly AppDbContext _context;

        public MarkingRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Marking> AddMarkingAsync(Marking marking)
        {
            await _context.Markings.AddAsync(marking);
            await _context.SaveChangesAsync();
            return marking;
        }

        public async Task<Marking?> GetMarkingByIdAsync(Guid id)
        {
            return await _context.Markings.FindAsync(id);
        }

        public async Task<Marking?> GetMarkingByIdWithDetailsAsync(Guid id)
        {
            return await _context.Markings
                .Include(m => m.Subject)
                .Include(m => m.School)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<IEnumerable<Marking>> GetFilteredMarkingsAsync(MarkingSearchDto searchDto)
        {
            IQueryable<Marking> query = _context.Markings
                .Include(m => m.Subject)
                .Include(m => m.School);

            if (!string.IsNullOrWhiteSpace(searchDto.Country))
            {
                var searchCountry = searchDto.Country.ToLower();
                query = query.Where(m => 
                    m.Country.ToLower() == searchCountry ||
                    (string.IsNullOrWhiteSpace(m.Country) && searchCountry == "sri lanka"));
            }
            if (!string.IsNullOrWhiteSpace(searchDto.ExamType))
            {
                query = query.Where(m => m.ExamType == searchDto.ExamType);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.Stream))
            {
                query = query.Where(m => m.Stream == searchDto.Stream);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.Subject))
            {
                query = query.Where(m => m.Subject != null && m.Subject.Name == searchDto.Subject);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.PaperType))
            {
                query = query.Where(m => m.PaperType == searchDto.PaperType);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.PaperCategory))
            {
                query = query.Where(m => m.PaperCategory == searchDto.PaperCategory);
            }
            if (searchDto.Year.HasValue)
            {
                query = query.Where(m => m.Year == searchDto.Year.Value);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.Term))
            {
                query = query.Where(m => m.Term == searchDto.Term);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.SchoolName))
            {
                query = query.Where(m => m.School != null && m.School.Name == searchDto.SchoolName);
            }

            return await query.ToListAsync();
        }

        public async Task<bool> UpdateMarkingAsync(Marking marking)
        {
            _context.Entry(marking).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await MarkingExists(marking.Id))
                {
                    return false;
                }
                throw;
            }
        }

        public async Task<bool> DeleteMarkingAsync(Guid id)
        {
            var marking = await _context.Markings.FindAsync(id);
            if (marking == null)
            {
                return false;
            }

            _context.Markings.Remove(marking);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<bool> MarkingExists(Guid id)
        {
            return await _context.Markings.AnyAsync(e => e.Id == id);
        }

        public async Task<int> CountByUploaderAsync(string uploaderEmail)
        {
            return await _context.Markings
                .Where(m => m.Uploader == uploaderEmail)
                .CountAsync();
        }
    }
}
