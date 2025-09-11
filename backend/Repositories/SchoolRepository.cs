using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Repositories
{
    public class SchoolRepository : ISchoolRepository
    {
        private readonly AppDbContext _context;

        public SchoolRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<School> AddSchoolAsync(School school)
        {
            await _context.Schools.AddAsync(school); // FIXED: Changed from Subjects to Schools
            await _context.SaveChangesAsync();
            return school;
        }

        public async Task<School?> GetSchoolByIdAsync(int id)
        {
            return await _context.Schools.FindAsync(id);
        }

        public async Task<School?> GetSchoolByNameAsync(string name)
        {
            return await _context.Schools.FirstOrDefaultAsync(s => s.Name == name);
        }

        public async Task<IEnumerable<School>> GetAllSchoolsAsync()
        {
            return await _context.Schools.ToListAsync();
        }

        public async Task<bool> UpdateSchoolAsync(School school)
        {
            _context.Entry(school).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await SchoolExists(school.Id))
                {
                    return false;
                }
                throw;
            }
        }

        public async Task<bool> DeleteSchoolAsync(int id)
        {
            var school = await _context.Schools.FindAsync(id);
            if (school == null)
            {
                return false;
            }

            _context.Schools.Remove(school);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<bool> SchoolExists(int id)
        {
            return await _context.Schools.AnyAsync(e => e.Id == id);
        }
    }
}