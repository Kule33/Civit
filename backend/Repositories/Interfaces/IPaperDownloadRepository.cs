using backend.Models;
using System;
using System.Threading.Tasks;

namespace backend.Repositories.Interfaces
{
    public interface IPaperDownloadRepository
    {
        Task<PaperDownload> AddDownloadAsync(PaperDownload download);
        Task<int> CountDownloadsByUserAsync(string userId);
        Task<int> CountDownloadsByResourceAsync(Guid resourceId, string resourceType);
    }
}
