using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using backend.Helpers; // For SharedSubjects helper

namespace backend.Repositories
{
    public class PaperRepository : IPaperRepository
    {
        private readonly AppDbContext _context;

        public PaperRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Paper> AddPaperAsync(Paper paper)
        {
            await _context.Papers.AddAsync(paper);
            await _context.SaveChangesAsync();
            return paper;
        }

        public async Task<Paper?> GetPaperByIdAsync(Guid id)
        {
            return await _context.Papers.FindAsync(id);
        }

        public async Task<Paper?> GetPaperByIdWithDetailsAsync(Guid id)
        {
            return await _context.Papers
                .Include(p => p.Subject)
                .Include(p => p.School)
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<Paper>> GetFilteredPapersAsync(PaperSearchDto searchDto)
        {
            IQueryable<Paper> query = _context.Papers
                .Include(p => p.Subject)
                .Include(p => p.School);

            if (!string.IsNullOrWhiteSpace(searchDto.Country))
            {
                var searchCountry = searchDto.Country.ToLower();
                query = query.Where(p => 
                    p.Country.ToLower() == searchCountry ||
                    (string.IsNullOrWhiteSpace(p.Country) && searchCountry == "sri lanka"));
            }
            if (!string.IsNullOrWhiteSpace(searchDto.ExamType))
            {
                query = query.Where(p => p.ExamType == searchDto.ExamType);
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
                    // For shared subjects, query papers from both Physical and Biological streams
                    query = query.Where(p => 
                        p.Stream == "physical" || 
                        p.Stream == "biological");
                }
                else
                {
                    // For non-shared subjects, use exact stream match
                    query = query.Where(p => p.Stream == searchDto.Stream);
                }
            }

            if (!string.IsNullOrWhiteSpace(searchDto.Subject))
            {
                query = query.Where(p => p.Subject != null && p.Subject.Name == searchDto.Subject);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.PaperType))
            {
                query = query.Where(p => p.PaperType == searchDto.PaperType);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.PaperCategory))
            {
                query = query.Where(p => p.PaperCategory == searchDto.PaperCategory);
            }
            if (searchDto.Year.HasValue)
            {
                query = query.Where(p => p.Year == searchDto.Year.Value);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.Term))
            {
                query = query.Where(p => p.Term == searchDto.Term);
            }
            if (!string.IsNullOrWhiteSpace(searchDto.SchoolName))
            {
                query = query.Where(p => p.School != null && p.School.Name == searchDto.SchoolName);
            }

            return await query.ToListAsync();
        }

        public async Task<bool> UpdatePaperAsync(Paper paper)
        {
            _context.Entry(paper).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await PaperExists(paper.Id))
                {
                    return false;
                }
                throw;
            }
        }

        public async Task<bool> DeletePaperAsync(Guid id)
        {
            var paper = await _context.Papers.FindAsync(id);
            if (paper == null)
            {
                return false;
            }

            _context.Papers.Remove(paper);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<bool> PaperExists(Guid id)
        {
            return await _context.Papers.AnyAsync(e => e.Id == id);
        }

        public async Task<int> CountByUploaderAsync(string uploaderEmail)
        {
            return await _context.Papers
                .Where(p => p.Uploader == uploaderEmail)
                .CountAsync();
        }
    }
}
