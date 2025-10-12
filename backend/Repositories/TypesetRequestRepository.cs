using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Repositories
{
    public class TypesetRequestRepository : ITypesetRequestRepository
    {
        private readonly AppDbContext _context;

        public TypesetRequestRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<TypesetRequest> CreateRequestAsync(TypesetRequest request)
        {
            await _context.TypesetRequests.AddAsync(request);
            await _context.SaveChangesAsync();
            return request;
        }

        public async Task<TypesetRequest?> GetRequestByIdAsync(int id)
        {
            return await _context.TypesetRequests.FindAsync(id);
        }

        public async Task<TypesetRequest?> GetRequestByIdWithUserAsync(int id)
        {
            return await _context.TypesetRequests
                .Include(tr => tr.User)
                .FirstOrDefaultAsync(tr => tr.Id == id);
        }

        public async Task<IEnumerable<TypesetRequest>> GetUserRequestsAsync(string userId)
        {
            return await _context.TypesetRequests
                .Where(tr => tr.UserId == userId)
                .OrderByDescending(tr => tr.RequestedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TypesetRequest>> GetAllRequestsAsync()
        {
            return await _context.TypesetRequests
                .Include(tr => tr.User)
                .OrderByDescending(tr => tr.RequestedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TypesetRequest>> GetRequestsByStatusAsync(string status)
        {
            return await _context.TypesetRequests
                .Include(tr => tr.User)
                .Where(tr => tr.Status == status)
                .OrderByDescending(tr => tr.RequestedAt)
                .ToListAsync();
        }

        public async Task<bool> UpdateRequestAsync(TypesetRequest request)
        {
            request.UpdatedAt = DateTime.UtcNow;
            _context.Entry(request).State = EntityState.Modified;
            
            try
            {
                await _context.SaveChangesAsync();
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await RequestExists(request.Id))
                {
                    return false;
                }
                throw;
            }
        }

        public async Task<int> CountUserRequestsAsync(string userId)
        {
            return await _context.TypesetRequests
                .Where(tr => tr.UserId == userId)
                .CountAsync();
        }

        public async Task<int> CountUserRequestsTodayAsync(string userId)
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            
            return await _context.TypesetRequests
                .Where(tr => tr.UserId == userId && tr.RequestedAt >= today && tr.RequestedAt < tomorrow)
                .CountAsync();
        }

        public async Task<bool> DeleteRequestAsync(int id)
        {
            var request = await _context.TypesetRequests.FindAsync(id);
            if (request == null)
            {
                return false;
            }

            _context.TypesetRequests.Remove(request);
            await _context.SaveChangesAsync();
            return true;
        }

        private async Task<bool> RequestExists(int id)
        {
            return await _context.TypesetRequests.AnyAsync(tr => tr.Id == id);
        }
    }
}
