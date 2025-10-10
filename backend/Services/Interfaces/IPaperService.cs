using backend.DTOs;
using backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services.Interfaces
{
    public interface IPaperService
    {
        // Paper management methods
        Task<PaperResponseDto?> UploadPaperAsync(PaperUploadDto uploadDto);
        Task<PaperResponseDto?> GetPaperByIdAsync(Guid id);
        Task<IEnumerable<PaperResponseDto>> GetFilteredPapersAsync(PaperSearchDto searchDto);
        Task<bool> DeletePaperAsync(Guid id);
        
        // Download tracking
        Task TrackDownloadAsync(string userId, string userEmail, Guid resourceId, string resourceType, string? country, string? subject, int? year);
    }
}
