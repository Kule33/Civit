using backend.DTOs;
using backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Repositories.Interfaces
{
    public interface IMarkingRepository
    {
        Task<Marking> AddMarkingAsync(Marking marking);
        Task<Marking?> GetMarkingByIdAsync(Guid id);
        Task<Marking?> GetMarkingByIdWithDetailsAsync(Guid id);
        Task<IEnumerable<Marking>> GetFilteredMarkingsAsync(MarkingSearchDto searchDto);
        Task<bool> UpdateMarkingAsync(Marking marking);
        Task<bool> DeleteMarkingAsync(Guid id);
        Task<int> CountByUploaderAsync(string uploaderEmail);
    }
}
