using backend.DTOs;
using backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services.Interfaces
{
    public interface IMarkingService
    {
        // Marking management methods
        Task<MarkingResponseDto?> UploadMarkingAsync(MarkingUploadDto uploadDto);
        Task<MarkingResponseDto?> GetMarkingByIdAsync(Guid id);
        Task<IEnumerable<MarkingResponseDto>> GetFilteredMarkingsAsync(MarkingSearchDto searchDto);
        Task<bool> DeleteMarkingAsync(Guid id);
        
        // Download tracking
        Task TrackDownloadAsync(string userId, string userEmail, Guid resourceId, string resourceType, string? country, string? subject, int? year);
    }
}
