using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Http; // NEW: For IHttpContextAccessor
using System.Security.Claims; // NEW: For checking roles

namespace backend.Services
{
    public class QuestionService : IQuestionService
    {
        private readonly IQuestionRepository _questionRepository;
        private readonly ISubjectRepository _subjectRepository;
        private readonly ISchoolRepository _schoolRepository;
        private readonly IHttpContextAccessor _httpContextAccessor; // NEW: Inject IHttpContextAccessor

        public QuestionService(
            IQuestionRepository questionRepository,
            ISubjectRepository subjectRepository,
            ISchoolRepository schoolRepository,
            IHttpContextAccessor httpContextAccessor) // NEW: Add to constructor
        {
            _questionRepository = questionRepository;
            _subjectRepository = subjectRepository;
            _schoolRepository = schoolRepository;
            _httpContextAccessor = httpContextAccessor; // NEW: Assign
        }

        public async Task<QuestionResponseDto?> UploadQuestionAsync(QuestionUploadDto uploadDto)
        {
            // NEW: Service-level role enforcement
            if (!IsUserInRole("admin"))
            {
                throw new UnauthorizedAccessException("Only administrators can upload questions.");
            }

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
            // NEW: Example of ensuring *any* authenticated user (admin/teacher) can view,
            // though the controller [Authorize] already handles this.
            // If you wanted to restrict specific questions based on who uploaded them,
            // you'd retrieve the question and then compare its uploader ID to the current user's ID.
            if (!IsAuthenticated()) // Assuming any authenticated user can view
            {
                 throw new UnauthorizedAccessException("Authentication is required to view questions.");
            }

            var question = await _questionRepository.GetQuestionByIdWithDetailsAsync(id);

            if (question == null)
            {
                return null;
            }

            return MapQuestionToResponseDto(question);
        }

        public async Task<IEnumerable<QuestionResponseDto>> GetFilteredQuestionsAsync(QuestionSearchDto searchDto)
        {
            // NEW: Example of ensuring *any* authenticated user (admin/teacher) can view.
            if (!IsAuthenticated()) // Assuming any authenticated user can search
            {
                 throw new UnauthorizedAccessException("Authentication is required to search questions.");
            }

            var questions = await _questionRepository.GetFilteredQuestionsAsync(searchDto); // Pass searchDto to repository
            var questionDtos = new List<QuestionResponseDto>();

            foreach (var question in questions)
            {
                questionDtos.Add(MapQuestionToResponseDto(question));
            }

            return questionDtos;
        }

        public async Task<QuestionResponseDto?> UpdateQuestionAsync(Guid id, QuestionUploadDto updateDto)
        {
            Console.WriteLine($"[DEBUG] UpdateQuestionAsync called for ID: {id}");
            Console.WriteLine($"[DEBUG] UpdateDto data: Title={updateDto.Title}, Subject={updateDto.Subject}, SchoolName={updateDto.SchoolName}");
            
            // Service-level role enforcement
            if (!IsUserInRole("admin"))
            {
                Console.WriteLine("[DEBUG] User is not admin, throwing UnauthorizedAccessException");
                throw new UnauthorizedAccessException("Only administrators can update questions.");
            }

            Console.WriteLine("[DEBUG] User is admin, proceeding with update");

            // Get the existing question
            var existingQuestion = await _questionRepository.GetQuestionByIdAsync(id);
            if (existingQuestion == null)
            {
                Console.WriteLine("[DEBUG] Question not found in database");
                return null;
            }
            
            Console.WriteLine($"[DEBUG] Found existing question: {existingQuestion.Title}");

            // Resolve Subject and School by name to get their IDs (similar to upload logic)
            int? subjectId = null;
            int? schoolId = null;

            if (!string.IsNullOrEmpty(updateDto.Subject))
            {
                Console.WriteLine($"[DEBUG] Looking up subject: '{updateDto.Subject}'");
                var subject = await _subjectRepository.GetSubjectByNameAsync(updateDto.Subject);
                if (subject == null)
                {
                    Console.WriteLine($"[DEBUG] Subject not found, creating new subject: '{updateDto.Subject}'");
                    try
                    {
                        subject = new Subject { Name = updateDto.Subject };
                        subject = await _subjectRepository.AddSubjectAsync(subject);
                        Console.WriteLine($"[DEBUG] Created new subject with ID: {subject.Id}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[DEBUG] Error creating subject: {ex.Message}");
                        // If subject creation fails, try to find it again (might be race condition)
                        subject = await _subjectRepository.GetSubjectByNameAsync(updateDto.Subject);
                        if (subject == null)
                        {
                            throw new InvalidOperationException($"Failed to create or find subject '{updateDto.Subject}': {ex.Message}");
                        }
                        Console.WriteLine($"[DEBUG] Found existing subject after creation failure with ID: {subject.Id}");
                    }
                }
                else
                {
                    Console.WriteLine($"[DEBUG] Found existing subject with ID: {subject.Id}");
                }
                subjectId = subject.Id;
            }

            if (!string.IsNullOrEmpty(updateDto.SchoolName))
            {
                Console.WriteLine($"[DEBUG] Looking up school: '{updateDto.SchoolName}'");
                var school = await _schoolRepository.GetSchoolByNameAsync(updateDto.SchoolName);
                if (school == null)
                {
                    Console.WriteLine($"[DEBUG] School not found, creating new school: '{updateDto.SchoolName}'");
                    try
                    {
                        school = new School { Name = updateDto.SchoolName };
                        school = await _schoolRepository.AddSchoolAsync(school);
                        Console.WriteLine($"[DEBUG] Created new school with ID: {school.Id}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[DEBUG] Error creating school: {ex.Message}");
                        // If school creation fails, try to find it again (might be race condition)
                        school = await _schoolRepository.GetSchoolByNameAsync(updateDto.SchoolName);
                        if (school == null)
                        {
                            throw new InvalidOperationException($"Failed to create or find school '{updateDto.SchoolName}': {ex.Message}");
                        }
                        Console.WriteLine($"[DEBUG] Found existing school after creation failure with ID: {school.Id}");
                    }
                }
                else
                {
                    Console.WriteLine($"[DEBUG] Found existing school with ID: {school.Id}");
                }
                schoolId = school.Id;
            }

            // Update the question properties
            existingQuestion.Title = updateDto.Title ?? existingQuestion.Title;
            existingQuestion.Country = updateDto.Country ?? existingQuestion.Country;
            existingQuestion.ExamType = updateDto.ExamType ?? existingQuestion.ExamType;
            existingQuestion.Stream = updateDto.Stream ?? existingQuestion.Stream;
            existingQuestion.SubjectId = subjectId ?? existingQuestion.SubjectId;
            existingQuestion.PaperType = updateDto.PaperType ?? existingQuestion.PaperType;
            existingQuestion.PaperCategory = updateDto.PaperCategory ?? existingQuestion.PaperCategory;
            existingQuestion.Year = updateDto.Year ?? existingQuestion.Year;
            existingQuestion.Term = updateDto.Term ?? existingQuestion.Term;
            existingQuestion.SchoolId = schoolId ?? existingQuestion.SchoolId;
            existingQuestion.Uploader = updateDto.Uploader ?? existingQuestion.Uploader;

            Console.WriteLine("[DEBUG] About to update question in repository");
            Console.WriteLine($"[DEBUG] Updated question properties: Title={existingQuestion.Title}, SubjectId={existingQuestion.SubjectId}, SchoolId={existingQuestion.SchoolId}");
            
            // Update in repository
            var success = await _questionRepository.UpdateQuestionAsync(existingQuestion);
            if (!success)
            {
                Console.WriteLine("[DEBUG] Repository update failed");
                return null;
            }

            Console.WriteLine("[DEBUG] Repository update successful, fetching updated question");
            // Return the updated question
            return await GetQuestionByIdAsync(id);
        }

        public async Task<bool> DeleteQuestionAsync(Guid id)
        {
            // NEW: Service-level role enforcement
            if (!IsUserInRole("admin"))
            {
                throw new UnauthorizedAccessException("Only administrators can delete questions.");
            }
            return await _questionRepository.DeleteQuestionAsync(id);
        }

        // Subject management methods
        public async Task<IEnumerable<SubjectDto>> GetAllSubjectsAsync()
        {
             if (!IsAuthenticated())
            {
                 throw new UnauthorizedAccessException("Authentication is required to view subjects.");
            }
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
             if (!IsAuthenticated())
            {
                 throw new UnauthorizedAccessException("Authentication is required to view subjects.");
            }
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
            // If this method were to be enabled, you'd add role checks here too.
            throw new InvalidOperationException("Adding subjects is currently disabled due to manual ID assignment strategy. Please add subjects directly to the database with specific IDs.");
        }

        // School management methods
        public async Task<IEnumerable<SchoolDto>> GetAllSchoolsAsync()
        {
             if (!IsAuthenticated())
            {
                 throw new UnauthorizedAccessException("Authentication is required to view schools.");
            }
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
             if (!IsAuthenticated())
            {
                 throw new UnauthorizedAccessException("Authentication is required to view schools.");
            }
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
            // If this method were to be enabled, you'd add role checks here too.
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
                Title = question.Title,
                FileUrl = question.FileUrl,
                FilePublicId = question.FilePublicId,
                UploadDate = question.UploadDate
            };
        }

        // NEW: Helper method to check if the current user is in a specific role
        private bool IsUserInRole(string roleName)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            return user != null && user.Identity?.IsAuthenticated == true && user.IsInRole(roleName);
        }

        // NEW: Helper method to check if the current user is authenticated
        private bool IsAuthenticated()
        {
            return _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated == true;
        }
    }
}