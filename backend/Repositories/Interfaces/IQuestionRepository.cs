using backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Repositories.Interfaces
{
    public interface IQuestionRepository
    {
        Task<Question> AddQuestionAsync(Question question);
        Task<Question?> GetQuestionByIdAsync(Guid id);
        Task<Question?> GetQuestionByIdWithDetailsAsync(Guid id);
        Task<IEnumerable<Question>> GetAllQuestionsAsync();
        Task<IEnumerable<Question>> GetAllQuestionsWithDetailsAsync();
        Task<bool> UpdateQuestionAsync(Question question);
        Task<bool> DeleteQuestionAsync(Guid id);
    }
}