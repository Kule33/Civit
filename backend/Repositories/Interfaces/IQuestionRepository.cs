using backend.DTOs; // Important: Add this
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
        // Add this new method
        Task<IEnumerable<Question>> GetFilteredQuestionsAsync(QuestionSearchDto searchDto);
        Task<bool> UpdateQuestionAsync(Question question);
        Task<bool> DeleteQuestionAsync(Guid id);
        Task<int> CountByUploaderAsync(string uploaderEmail);
    }
}