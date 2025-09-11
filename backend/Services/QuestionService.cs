using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;

namespace backend.Services
{
    public class QuestionService : IQuestionService
    {
        private readonly IQuestionRepository _questionRepository;
        private readonly ISubjectRepository _subjectRepository;
        private readonly ISchoolRepository _schoolRepository;

        public QuestionService(
            IQuestionRepository questionRepository,
            ISubjectRepository subjectRepository,
            ISchoolRepository schoolRepository)
        {
            _questionRepository = questionRepository;
            _subjectRepository = subjectRepository;
            _schoolRepository = schoolRepository;
        }

        public async Task<QuestionResponseDto?> UploadQuestionAsync(QuestionUploadDto uploadDto)
        {
            // Validate required file-related fields
            if (string.IsNullOrEmpty(uploadDto.FileUrl) || string.IsNullOrEmpty(uploadDto.FilePublicId))
            {
                throw new ArgumentException("File URL and Public ID are required for upload.");
            }

            // 1. Resolve Subject and School by name to get their IDs
            int? subjectId = null;
            int? schoolId = null;

            // Resolve Subject if provided
            if (!string.IsNullOrEmpty(uploadDto.Subject))
            {
                var subject = await _subjectRepository.GetSubjectByNameAsync(uploadDto.Subject);
                if (subject == null)
                {
                    throw new ArgumentException($"Subject '{uploadDto.Subject}' not found in database. Please ensure the subject exists.");
                }
                subjectId = subject.Id;
            }

            // Resolve School if provided (auto-create if not found)
            if (!string.IsNullOrEmpty(uploadDto.SchoolName))
            {
                var school = await _schoolRepository.GetSchoolByNameAsync(uploadDto.SchoolName);
                if (school == null)
                {
                    // Auto-create new school when it does not exist
                    var newSchool = new School { Name = uploadDto.SchoolName };
                    var created = await _schoolRepository.AddSchoolAsync(newSchool);
                    schoolId = created.Id;
                }
                else
                {
                    schoolId = school.Id;
                }
            }

            // 2. Map DTO to Question model
            var question = new Question
            {
                Id = Guid.NewGuid(),
                Country = uploadDto.Country,
                ExamType = uploadDto.ExamType,
                Stream = uploadDto.Stream,
                SubjectId = subjectId,
                PaperType = uploadDto.PaperType,
                PaperCategory = uploadDto.PaperCategory,
                Year = uploadDto.Year,
                Term = uploadDto.Term,
                SchoolId = schoolId,
                Uploader = uploadDto.Uploader,
                FileUrl = uploadDto.FileUrl,
                FilePublicId = uploadDto.FilePublicId,
                UploadDate = DateTime.UtcNow
            };

            // 3. Add the question to the repository (database)
            var addedQuestion = await _questionRepository.AddQuestionAsync(question);

            // 4. Retrieve the question with related entities for response
            var questionWithDetails = await _questionRepository.GetQuestionByIdWithDetailsAsync(addedQuestion.Id);

            // 5. Map the added Question model back to a Response DTO
            return MapQuestionToResponseDto(questionWithDetails!);
        }

        public async Task<QuestionResponseDto?> GetQuestionByIdAsync(Guid id)
        {
            var question = await _questionRepository.GetQuestionByIdWithDetailsAsync(id);
            
            if (question == null)
            {
                return null;
            }

            return MapQuestionToResponseDto(question);
        }

        public async Task<IEnumerable<QuestionResponseDto>> GetAllQuestionsAsync()
        {
            var questions = await _questionRepository.GetAllQuestionsWithDetailsAsync();
            var questionDtos = new List<QuestionResponseDto>();

            foreach (var question in questions)
            {
                questionDtos.Add(MapQuestionToResponseDto(question));
            }

            return questionDtos;
        }

        public async Task<bool> DeleteQuestionAsync(Guid id)
        {
            return await _questionRepository.DeleteQuestionAsync(id);
        }

        // Subject management methods
        public async Task<IEnumerable<SubjectDto>> GetAllSubjectsAsync()
        {
            var subjects = await _subjectRepository.GetAllSubjectsAsync();
            var subjectDtos = new List<SubjectDto>();

            foreach (var subject in subjects)
            {
                subjectDtos.Add(new SubjectDto
                {
                    Id = subject.Id,
                    Name = subject.Name
                });
            }

            return subjectDtos;
        }

        public async Task<SubjectDto?> GetSubjectByIdAsync(int id)
        {
            var subject = await _subjectRepository.GetSubjectByIdAsync(id);
            
            if (subject == null)
            {
                return null;
            }

            return new SubjectDto
            {
                Id = subject.Id,
                Name = subject.Name
            };
        }

        public Task<SubjectDto> AddSubjectAsync(string subjectName)
        {
            throw new InvalidOperationException("Adding subjects is currently disabled due to manual ID assignment strategy. Please add subjects directly to the database with specific IDs.");
        }

        // School management methods
        public async Task<IEnumerable<SchoolDto>> GetAllSchoolsAsync()
        {
            var schools = await _schoolRepository.GetAllSchoolsAsync();
            var schoolDtos = new List<SchoolDto>();

            foreach (var school in schools)
            {
                schoolDtos.Add(new SchoolDto
                {
                    Id = school.Id,
                    Name = school.Name
                });
            }

            return schoolDtos;
        }

        public async Task<SchoolDto?> GetSchoolByIdAsync(int id)
        {
            var school = await _schoolRepository.GetSchoolByIdAsync(id);
            
            if (school == null)
            {
                return null;
            }

            return new SchoolDto
            {
                Id = school.Id,
                Name = school.Name
            };
        }

        public Task<SchoolDto> AddSchoolAsync(string schoolName)
        {
            throw new InvalidOperationException("Adding schools is currently disabled due to manual ID assignment strategy. Please add schools directly to the database with specific IDs.");
        }

        // Private helper method to map Question to QuestionResponseDto
        private QuestionResponseDto MapQuestionToResponseDto(Question question)
        {
            return new QuestionResponseDto
            {
                Id = question.Id,
                Country = question.Country,
                ExamType = question.ExamType,
                Stream = question.Stream,
                Subject = question.Subject != null ? new SubjectDto 
                { 
                    Id = question.Subject.Id, 
                    Name = question.Subject.Name 
                } : null,
                PaperType = question.PaperType,
                PaperCategory = question.PaperCategory,
                Year = question.Year,
                Term = question.Term,
                School = question.School != null ? new SchoolDto 
                { 
                    Id = question.School.Id, 
                    Name = question.School.Name 
                } : null,
                Uploader = question.Uploader,
                FileUrl = question.FileUrl,
                FilePublicId = question.FilePublicId,
                UploadDate = question.UploadDate
            };
        }
    }
}