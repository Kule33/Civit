using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;

namespace backend.Services
{
    public class MarkingService : IMarkingService
    {
        private readonly IMarkingRepository _markingRepository;
        private readonly ISubjectRepository _subjectRepository;
        private readonly ISchoolRepository _schoolRepository;
        private readonly IPaperDownloadRepository _downloadRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public MarkingService(
            IMarkingRepository markingRepository,
            ISubjectRepository subjectRepository,
            ISchoolRepository schoolRepository,
            IPaperDownloadRepository downloadRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _markingRepository = markingRepository;
            _subjectRepository = subjectRepository;
            _schoolRepository = schoolRepository;
            _downloadRepository = downloadRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<MarkingResponseDto?> UploadMarkingAsync(MarkingUploadDto uploadDto)
        {
            // Service-level role enforcement
            if (!IsUserInRole("admin"))
            {
                throw new UnauthorizedAccessException("Only administrators can upload markings.");
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

            // 2. Map DTO to Marking model
            var marking = new Marking
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
                UploadedBy = uploadDto.Uploader,
                FileUrl = uploadDto.FileUrl,
                FilePublicId = uploadDto.FilePublicId,
                FileName = uploadDto.FileName,
                FileSize = uploadDto.FileSize,
                UploadDate = DateTime.UtcNow
            };

            // 3. Add the marking to the repository (database)
            var addedMarking = await _markingRepository.AddMarkingAsync(marking);

            // 4. Retrieve the marking with related entities for response
            var markingWithDetails = await _markingRepository.GetMarkingByIdWithDetailsAsync(addedMarking.Id);

            // 5. Map the added Marking model back to a Response DTO
            return MapMarkingToResponseDto(markingWithDetails!);
        }

        public async Task<MarkingResponseDto?> GetMarkingByIdAsync(Guid id)
        {
            if (!IsAuthenticated())
            {
                throw new UnauthorizedAccessException("Authentication is required to view markings.");
            }

            var marking = await _markingRepository.GetMarkingByIdWithDetailsAsync(id);

            if (marking == null)
            {
                return null;
            }

            return MapMarkingToResponseDto(marking);
        }

        public async Task<IEnumerable<MarkingResponseDto>> GetFilteredMarkingsAsync(MarkingSearchDto searchDto)
        {
            if (!IsAuthenticated())
            {
                throw new UnauthorizedAccessException("Authentication is required to search markings.");
            }

            var markings = await _markingRepository.GetFilteredMarkingsAsync(searchDto);
            var markingDtos = new List<MarkingResponseDto>();

            foreach (var marking in markings)
            {
                markingDtos.Add(MapMarkingToResponseDto(marking));
            }

            return markingDtos;
        }

        public async Task<bool> DeleteMarkingAsync(Guid id)
        {
            // Service-level role enforcement
            if (!IsUserInRole("admin"))
            {
                throw new UnauthorizedAccessException("Only administrators can delete markings.");
            }
            return await _markingRepository.DeleteMarkingAsync(id);
        }

        public async Task TrackDownloadAsync(string userId, string userEmail, Guid resourceId, string resourceType, string? country, string? subject, int? year)
        {
            if (!IsAuthenticated())
            {
                throw new UnauthorizedAccessException("Authentication is required to download markings.");
            }

            var download = new PaperDownload
            {
                UserId = userId,
                UserEmail = userEmail,
                ResourceId = resourceId,
                ResourceType = resourceType,
                DownloadedAt = DateTime.UtcNow,
                Country = country,
                Subject = subject,
                Year = year
            };

            await _downloadRepository.AddDownloadAsync(download);
        }

        // Private helper method to map Marking to MarkingResponseDto
        private MarkingResponseDto MapMarkingToResponseDto(Marking marking)
        {
            return new MarkingResponseDto
            {
                Id = marking.Id,
                Country = marking.Country,
                ExamType = marking.ExamType,
                Stream = marking.Stream,
                Subject = marking.Subject != null ? new SubjectDto
                {
                    Id = marking.Subject.Id,
                    Name = marking.Subject.Name
                } : null,
                PaperType = marking.PaperType,
                PaperCategory = marking.PaperCategory,
                Year = marking.Year,
                Term = marking.Term,
                School = marking.School != null ? new SchoolDto
                {
                    Id = marking.School.Id,
                    Name = marking.School.Name
                } : null,
                UploadedBy = marking.UploadedBy,
                FileUrl = marking.FileUrl,
                FilePublicId = marking.FilePublicId,
                FileName = marking.FileName,
                FileSize = marking.FileSize,
                UploadDate = marking.UploadDate
            };
        }

        // Helper method to check if the current user is in a specific role
        private bool IsUserInRole(string roleName)
        {
            var user = _httpContextAccessor.HttpContext?.User;
            return user != null && user.Identity?.IsAuthenticated == true && user.IsInRole(roleName);
        }

        // Helper method to check if the current user is authenticated
        private bool IsAuthenticated()
        {
            return _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated == true;
        }
    }
}
