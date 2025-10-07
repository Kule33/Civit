using backend.Models;
using System;
using System.Threading.Tasks;

namespace backend.Repositories.Interfaces
{
    public interface ITypesetRepository
    {
        Task<Typeset?> GetByIdAsync(Guid id);
        Task<Typeset?> GetByQuestionIdAsync(Guid questionId);
        Task<Typeset> UpsertAsync(Typeset typeset);
        Task<bool> DeleteAsync(Guid id);
    }
}
