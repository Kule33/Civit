using backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Repositories.Interfaces
{
    public interface ITypesetRequestRepository
    {
        Task<TypesetRequest> CreateRequestAsync(TypesetRequest request);
        Task<TypesetRequest?> GetRequestByIdAsync(int id);
        Task<TypesetRequest?> GetRequestByIdWithUserAsync(int id);
        Task<IEnumerable<TypesetRequest>> GetUserRequestsAsync(string userId);
        Task<IEnumerable<TypesetRequest>> GetAllRequestsAsync();
        Task<IEnumerable<TypesetRequest>> GetRequestsByStatusAsync(string status);
        Task<bool> UpdateRequestAsync(TypesetRequest request);
        Task<int> CountUserRequestsAsync(string userId);
        Task<int> CountUserRequestsTodayAsync(string userId);
        Task<bool> DeleteRequestAsync(int id);
    }
}
