using backend.DTOs;
using backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Repositories.Interfaces
{
    public interface IPaperRepository
    {
        Task<Paper> AddPaperAsync(Paper paper);
        Task<Paper?> GetPaperByIdAsync(Guid id);
        Task<Paper?> GetPaperByIdWithDetailsAsync(Guid id);
        Task<IEnumerable<Paper>> GetFilteredPapersAsync(PaperSearchDto searchDto);
        Task<bool> UpdatePaperAsync(Paper paper);
        Task<bool> DeletePaperAsync(Guid id);
        Task<int> CountByUploaderAsync(string uploaderEmail);
    }
}
