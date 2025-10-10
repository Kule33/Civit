using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace backend.Repositories
{
    public class PaperDownloadRepository : IPaperDownloadRepository
    {
        private readonly AppDbContext _context;

        public PaperDownloadRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PaperDownload> AddDownloadAsync(PaperDownload download)
        {
            await _context.PaperDownloads.AddAsync(download);
            await _context.SaveChangesAsync();
            return download;
        }

        public async Task<int> CountDownloadsByUserAsync(string userId)
        {
            return await _context.PaperDownloads
                .Where(pd => pd.UserId == userId)
                .CountAsync();
        }

        public async Task<int> CountDownloadsByResourceAsync(Guid resourceId, string resourceType)
        {
            return await _context.PaperDownloads
                .Where(pd => pd.ResourceId == resourceId && pd.ResourceType == resourceType)
                .CountAsync();
        }
    }
}
