// backend/Services/QuestionService.cs
using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using backend.Helpers; // Import the KeyGenerator helper
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq; // For .Where() in GetAllQuestionsAsync if needed, but not directly for this fix

namespace backend.Services
{
    public class QuestionService : IQuestionService
    {
        private readonly IQuestionRepository _questionRepository;

        public QuestionService(IQuestionRepository questionRepository)
        {
            _questionRepository = questionRepository;
        }

        public async Task<QuestionResponseDto?> UploadQuestionAsync(QuestionUploadDto uploadDto)
        {
            // Validate required file-related fields
            if (string.IsNullOrEmpty(uploadDto.FileUrl) || string.IsNullOrEmpty(uploadDto.FilePublicId))
            {
                throw new ArgumentException("File URL and Public ID are required for upload.");
            }

            // 1. Map DTO to Question model
            var question = new Question
            {
                Id = Guid.NewGuid(), // Generate a new ID for the question
                Country = uploadDto.Country,
                ExamType = uploadDto.ExamType,
                Stream = uploadDto.Stream,
                Subject = uploadDto.Subject,
                PaperType = uploadDto.PaperType,
                PaperCategory = uploadDto.PaperCategory,
                Year = uploadDto.Year,
                Term = uploadDto.Term,
                SchoolName = uploadDto.SchoolName,
                Uploader = uploadDto.Uploader,
                FileUrl = uploadDto.FileUrl,
                FilePublicId = uploadDto.FilePublicId,
                UploadDate = DateTime.UtcNow, // Set upload date to now (UTC for consistency)
                // UniqueKey will be generated next, after the question object is partially populated
            };

            // 2. Generate the truly unique key using the dedicated helper
            // This ensures a timestamp is always included, making the key unique even with identical metadata
            question.UniqueKey = KeyGenerator.GenerateUniqueQuestionKey(question);

            // 3. Check for existence (this check is now primarily for extreme edge cases
            // where two identical metadata + identical timestamp uploads occur simultaneously)
            var existingQuestion = await _questionRepository.GetQuestionByUniqueKeyAsync(question.UniqueKey);
            if (existingQuestion != null)
            {
                // If this is hit, it means a truly identical key (metadata + timestamp) already exists.
                // This is highly improbable but handled here.
                throw new ArgumentException("A question with these exact attributes and a unique identifier already exists. Please try again or check for duplicate uploads.");
            }

            // 4. Add the question to the repository (database)
            var addedQuestion = await _questionRepository.AddQuestionAsync(question);

            // 5. Map the added Question model back to a Response DTO
            return new QuestionResponseDto
            {
                Id = addedQuestion.Id,
                Country = addedQuestion.Country,
                ExamType = addedQuestion.ExamType,
                Stream = addedQuestion.Stream,
                Subject = addedQuestion.Subject,
                PaperType = addedQuestion.PaperType,
                PaperCategory = addedQuestion.PaperCategory,
                Year = addedQuestion.Year,
                Term = addedQuestion.Term,
                SchoolName = addedQuestion.SchoolName,
                Uploader = addedQuestion.Uploader,
                FileUrl = addedQuestion.FileUrl,
                FilePublicId = addedQuestion.FilePublicId,
                UploadDate = addedQuestion.UploadDate,
                UniqueKey = addedQuestion.UniqueKey
            };
        }

        public async Task<QuestionResponseDto?> GetQuestionByIdAsync(Guid id)
        {
            var question = await _questionRepository.GetQuestionByIdAsync(id);
            
            if (question == null)
            {
                return null;
            }

            // Map Question model to Response DTO
            return new QuestionResponseDto
            {
                Id = question.Id,
                Country = question.Country,
                ExamType = question.ExamType,
                Stream = question.Stream,
                Subject = question.Subject,
                PaperType = question.PaperType,
                PaperCategory = question.PaperCategory,
                Year = question.Year,
                Term = question.Term,
                SchoolName = question.SchoolName,
                Uploader = question.Uploader,
                FileUrl = question.FileUrl,
                FilePublicId = question.FilePublicId,
                UploadDate = question.UploadDate,
                UniqueKey = question.UniqueKey
            };
        }

        public async Task<IEnumerable<QuestionResponseDto>> GetAllQuestionsAsync()
        {
            var questions = await _questionRepository.GetAllQuestionsAsync();
            var questionDtos = new List<QuestionResponseDto>();

            // Map each Question model to a Response DTO
            foreach (var question in questions)
            {
                questionDtos.Add(new QuestionResponseDto
                {
                    Id = question.Id,
                    Country = question.Country,
                    ExamType = question.ExamType,
                    Stream = question.Stream,
                    Subject = question.Subject,
                    PaperType = question.PaperType,
                    PaperCategory = question.PaperCategory,
                    Year = question.Year,
                    Term = question.Term,
                    SchoolName = question.SchoolName,
                    Uploader = question.Uploader,
                    FileUrl = question.FileUrl,
                    FilePublicId = question.FilePublicId,
                    UploadDate = question.UploadDate,
                    UniqueKey = question.UniqueKey
                });
            }

            return questionDtos;
        }

        public async Task<bool> DeleteQuestionAsync(Guid id)
        {
            // The repository handles the actual deletion logic
            return await _questionRepository.DeleteQuestionAsync(id);
        }

        // The private GenerateUniqueKey(QuestionUploadDto) method has been removed
        // as we are now using the static KeyGenerator.GenerateUniqueQuestionKey(Question) helper.
    }
}