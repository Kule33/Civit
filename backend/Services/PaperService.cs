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
    public class PaperService : IPaperService
    {
        private readonly IPaperRepository _paperRepository;
        private readonly ISubjectRepository _subjectRepository;
        private readonly ISchoolRepository _schoolRepository;
        private readonly IPaperDownloadRepository _downloadRepository;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PaperService(
            IPaperRepository paperRepository,
            ISubjectRepository subjectRepository,
            ISchoolRepository schoolRepository,
            IPaperDownloadRepository downloadRepository,
            IHttpContextAccessor httpContextAccessor)
        {
            _paperRepository = paperRepository;
            _subjectRepository = subjectRepository;
            _schoolRepository = schoolRepository;
            _downloadRepository = downloadRepository;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<PaperResponseDto?> UploadPaperAsync(PaperUploadDto uploadDto)
        {
            // Service-level role enforcement
            if (!IsUserInRole("admin"))
            {
                throw new UnauthorizedAccessException("Only administrators can upload papers.");
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

            // 2. Map DTO to Paper model
            var paper = new Paper
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
                UploadedBy = uploadDto.UploadedBy,
                FileUrl = uploadDto.FileUrl,
                FilePublicId = uploadDto.FilePublicId,
                FileName = uploadDto.FileName,
                FileSize = uploadDto.FileSize,
                UploadDate = DateTime.UtcNow
            };

            // 3. Add the paper to the repository (database)
            var addedPaper = await _paperRepository.AddPaperAsync(paper);

            // 4. Retrieve the paper with related entities for response
            var paperWithDetails = await _paperRepository.GetPaperByIdWithDetailsAsync(addedPaper.Id);

            // 5. Map the added Paper model back to a Response DTO
            return MapPaperToResponseDto(paperWithDetails!);
        }

        public async Task<PaperResponseDto?> GetPaperByIdAsync(Guid id)
        {
            if (!IsAuthenticated())
            {
                throw new UnauthorizedAccessException("Authentication is required to view papers.");
            }

            var paper = await _paperRepository.GetPaperByIdWithDetailsAsync(id);

            if (paper == null)
            {
                return null;
            }

            return MapPaperToResponseDto(paper);
        }

        public async Task<IEnumerable<PaperResponseDto>> GetFilteredPapersAsync(PaperSearchDto searchDto)
        {
            if (!IsAuthenticated())
            {
                throw new UnauthorizedAccessException("Authentication is required to search papers.");
            }

            var papers = await _paperRepository.GetFilteredPapersAsync(searchDto);
            var paperDtos = new List<PaperResponseDto>();

            foreach (var paper in papers)
            {
                paperDtos.Add(MapPaperToResponseDto(paper));
            }

            return paperDtos;
        }

        public async Task<bool> DeletePaperAsync(Guid id)
        {
            // Service-level role enforcement
            if (!IsUserInRole("admin"))
            {
                throw new UnauthorizedAccessException("Only administrators can delete papers.");
            }
            return await _paperRepository.DeletePaperAsync(id);
        }

        public async Task TrackDownloadAsync(string userId, string userEmail, Guid resourceId, string resourceType, string? country, string? subject, int? year)
        {
            if (!IsAuthenticated())
            {
                throw new UnauthorizedAccessException("Authentication is required to download papers.");
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

        // Private helper method to map Paper to PaperResponseDto
        private PaperResponseDto MapPaperToResponseDto(Paper paper)
        {
            return new PaperResponseDto
            {
                Id = paper.Id,
                Country = paper.Country,
                ExamType = paper.ExamType,
                Stream = paper.Stream,
                Subject = paper.Subject != null ? new SubjectDto
                {
                    Id = paper.Subject.Id,
                    Name = paper.Subject.Name
                } : null,
                PaperType = paper.PaperType,
                PaperCategory = paper.PaperCategory,
                Year = paper.Year,
                Term = paper.Term,
                School = paper.School != null ? new SchoolDto
                {
                    Id = paper.School.Id,
                    Name = paper.School.Name
                } : null,
                UploadedBy = paper.UploadedBy,
                FileUrl = paper.FileUrl,
                FilePublicId = paper.FilePublicId,
                FileName = paper.FileName,
                FileSize = paper.FileSize,
                UploadDate = paper.UploadDate
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
