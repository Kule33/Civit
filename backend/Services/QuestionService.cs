// backend/Services/QuestionService.cs
using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using backend.Helpers; // For KeyGenerator
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq; // For .Select()

namespace backend.Services
{
    public class QuestionService : IQuestionService
    {
        private readonly IQuestionRepository _questionRepository;
        private readonly ICloudinaryService _cloudinaryService;

        public QuestionService(IQuestionRepository questionRepository, ICloudinaryService cloudinaryService)
        {
            _questionRepository = questionRepository;
            _cloudinaryService = cloudinaryService;
        }

        public async Task<QuestionResponseDto?> UploadQuestionAsync(QuestionUploadDto uploadDto)
        {
            // 1. Upload file to Cloudinary
            var uploadResult = await _cloudinaryService.UploadImageAsync(uploadDto.File);

            if (uploadResult == null || string.IsNullOrEmpty(uploadResult.Url?.ToString()))
            {
                // Handle upload failure
                return null;
            }

            // 2. Map DTO to Model
            var question = new Question
            {
                Id = Guid.NewGuid(), // Generate a new GUID for the question
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
                FileUrl = uploadResult.Url.ToString(),
                FilePublicId = uploadResult.PublicId, // Store public ID for potential deletion later
                UploadDate = DateTime.UtcNow
            };

            // 3. Generate unique key
            question.UniqueKey = KeyGenerator.GenerateUniqueQuestionKey(question);

            // Optional: Check if a question with this UniqueKey already exists
            var existingQuestion = await _questionRepository.GetQuestionByUniqueKeyAsync(question.UniqueKey);
            if (existingQuestion != null)
            {
                // If a duplicate key is found, you might want to:
                // a) Add a suffix to the key (e.g., -V2)
                // b) Return an error
                // For now, let's just log and proceed, or you can throw an exception.
                Console.WriteLine($"Warning: Duplicate unique key generated: {question.UniqueKey}");
            }


            // 4. Save question metadata to database
            var addedQuestion = await _questionRepository.AddQuestionAsync(question);

            // 5. Map Model back to Response DTO and return
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
                UniqueKey = addedQuestion.UniqueKey,
                UploadDate = addedQuestion.UploadDate
            };
        }

        public async Task<QuestionResponseDto?> GetQuestionByIdAsync(Guid id)
        {
            var question = await _questionRepository.GetQuestionByIdAsync(id);
            if (question == null)
            {
                return null;
            }

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
                UniqueKey = question.UniqueKey,
                UploadDate = question.UploadDate
            };
        }

        public async Task<IEnumerable<QuestionResponseDto>> GetAllQuestionsAsync()
        {
            var questions = await _questionRepository.GetAllQuestionsAsync();
            return questions.Select(question => new QuestionResponseDto
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
                UniqueKey = question.UniqueKey,
                UploadDate = question.UploadDate
            }).ToList();
        }

        public async Task<bool> DeleteQuestionAsync(Guid id)
        {
            var questionToDelete = await _questionRepository.GetQuestionByIdAsync(id);
            if (questionToDelete == null)
            {
                return false; // Question not found in DB
            }

            // Optional: Delete file from Cloudinary first
            if (!string.IsNullOrEmpty(questionToDelete.FilePublicId))
            {
                await _cloudinaryService.DeleteFileAsync(questionToDelete.FilePublicId);
                // Consider how to handle Cloudinary deletion failure (e.g., log, retry, still delete from DB)
            }

            // Delete from database
            return await _questionRepository.DeleteQuestionAsync(id);
        }
    }
}