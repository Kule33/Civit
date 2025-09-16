using backend.DTOs;
using backend.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace backend.Services.Interfaces
{
    public interface IQuestionService
    {
        // Question management methods
        Task<QuestionResponseDto?> UploadQuestionAsync(QuestionUploadDto uploadDto);
        Task<QuestionResponseDto?> GetQuestionByIdAsync(Guid id);
        // Modify this method to accept search criteria
        Task<IEnumerable<QuestionResponseDto>> GetFilteredQuestionsAsync(QuestionSearchDto searchDto);
        Task<bool> DeleteQuestionAsync(Guid id);

        // Subject management methods
        Task<IEnumerable<SubjectDto>> GetAllSubjectsAsync();
        Task<SubjectDto?> GetSubjectByIdAsync(int id);
        Task<SubjectDto> AddSubjectAsync(string subjectName);

        // School management methods
        Task<IEnumerable<SchoolDto>> GetAllSchoolsAsync();
        Task<SchoolDto?> GetSchoolByIdAsync(int id);
        Task<SchoolDto> AddSchoolAsync(string schoolName);
    }
}