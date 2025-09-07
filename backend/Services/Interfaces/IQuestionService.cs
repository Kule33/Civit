// backend/Services/Interfaces/IQuestionService.cs
using backend.DTOs;
using backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services.Interfaces
{
    public interface IQuestionService
    {
        Task<QuestionResponseDto?> UploadQuestionAsync(QuestionUploadDto uploadDto);
        Task<QuestionResponseDto?> GetQuestionByIdAsync(Guid id);
        Task<IEnumerable<QuestionResponseDto>> GetAllQuestionsAsync();
        Task<bool> DeleteQuestionAsync(Guid id);
        // Add other methods like UpdateQuestion, SearchQuestions etc. as needed
    }
}