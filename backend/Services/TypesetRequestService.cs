using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface ITypesetRequestService
    {
        Task<TypesetRequestResponseDto> CreateRequestAsync(string userId, TypesetRequestCreateDto dto);
        Task<TypesetRequestResponseDto?> GetRequestByIdAsync(int id, string userId, bool isAdmin = false);
        Task<IEnumerable<TypesetRequestListDto>> GetUserRequestsAsync(string userId);
        Task<IEnumerable<TypesetRequestResponseDto>> GetAllRequestsAsync(string? status = null);
        Task<bool> UpdateRequestStatusAsync(int id, TypesetRequestUpdateDto dto, string adminEmail);
        Task<bool> DeleteRequestAsync(int id, string userId, bool isAdmin = false);
        Task<bool> CanUserCreateRequestAsync(string userId);
    }

    public class TypesetRequestService : ITypesetRequestService
    {
        private readonly ITypesetRequestRepository _requestRepository;
        private readonly AppDbContext _context;
        private readonly ITempFileService _tempFileService;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<TypesetRequestService> _logger;
        private readonly int _maxRequestsPerDay;

        public TypesetRequestService(
            ITypesetRequestRepository requestRepository,
            AppDbContext context,
            ITempFileService tempFileService,
            IEmailService emailService,
            INotificationService notificationService,
            IConfiguration configuration,
            ILogger<TypesetRequestService> logger)
        {
            _requestRepository = requestRepository;
            _context = context;
            _tempFileService = tempFileService;
            _emailService = emailService;
            _notificationService = notificationService;
            _configuration = configuration;
            _logger = logger;
            _maxRequestsPerDay = _configuration.GetValue<int>("RateLimiting:TypesetRequestsPerDay", 5);
        }

        public async Task<TypesetRequestResponseDto> CreateRequestAsync(string userId, TypesetRequestCreateDto dto)
        {
            try
            {
                // Check if user exists
                var user = await _context.UserProfiles.FindAsync(userId);
                if (user == null)
                {
                    throw new InvalidOperationException("User not found");
                }

                // Check rate limit
                if (!await CanUserCreateRequestAsync(userId))
                {
                    throw new InvalidOperationException($"Daily limit of {_maxRequestsPerDay} typeset requests exceeded. Please try again tomorrow.");
                }

                // Validate temp file exists
                if (!await _tempFileService.TempPdfExistsAsync(dto.PaperFilePath))
                {
                    throw new InvalidOperationException("Paper file not found. Please regenerate the paper and try again.");
                }

                // Validate user message length
                if (!string.IsNullOrWhiteSpace(dto.UserMessage) && dto.UserMessage.Length > 500)
                {
                    throw new InvalidOperationException("User message exceeds maximum length of 500 characters");
                }

                // Create request
                var request = new TypesetRequest
                {
                    UserId = userId,
                    UserEmail = user.Email,
                    UserName = user.FullName,
                    PaperFilePath = dto.PaperFilePath,
                    UserMessage = dto.UserMessage,
                    PaperMetadata = dto.PaperMetadata,
                    Status = TypesetRequestStatus.Pending,
                    RequestedAt = DateTime.UtcNow
                };

                var createdRequest = await _requestRepository.CreateRequestAsync(request);
                _logger.LogInformation($"Created typeset request #{createdRequest.Id} for user {userId}");

                // Get PDF for email attachment
                var pdfData = await _tempFileService.GetTempPdfAsync(dto.PaperFilePath);
                if (pdfData == null)
                {
                    throw new InvalidOperationException("Failed to read PDF file for email");
                }

                // Send emails
                var adminEmailSent = await _emailService.SendTypesetRequestEmailAsync(createdRequest, user, pdfData);
                var userEmailSent = await _emailService.SendTypesetConfirmationEmailAsync(createdRequest, user);

                _logger.LogInformation($"Emails sent for request #{createdRequest.Id} - Admin: {adminEmailSent}, User: {userEmailSent}");

                // Send notification to all admins about the new typeset request
                try
                {
                    await _notificationService.CreateAdminNotificationAsync(
                        "info",
                        "New Typeset Request",
                        $"{user.FullName} has submitted a new typeset request",
                        "/admin/questions/manage"
                    );
                    _logger.LogInformation($"Sent notification to admins about typeset request #{createdRequest.Id} from {user.FullName}");
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, $"Failed to send notification to admins for typeset request #{createdRequest.Id}");
                }

                // Delete temp file after email is sent (as per requirement)
                await _tempFileService.DeleteTempPdfAsync(dto.PaperFilePath);
                _logger.LogInformation($"Deleted temp file after sending email: {dto.PaperFilePath}");

                return MapToResponseDto(createdRequest, user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating typeset request for user {userId}");
                throw;
            }
        }

        public async Task<TypesetRequestResponseDto?> GetRequestByIdAsync(int id, string userId, bool isAdmin = false)
        {
            var request = await _requestRepository.GetRequestByIdWithUserAsync(id);
            if (request == null)
            {
                return null;
            }

            // Ensure user can only view their own requests (unless admin)
            if (!isAdmin && request.UserId != userId)
            {
                throw new UnauthorizedAccessException("You can only view your own requests");
            }

            return MapToResponseDto(request, request.User!);
        }

        public async Task<IEnumerable<TypesetRequestListDto>> GetUserRequestsAsync(string userId)
        {
            var requests = await _requestRepository.GetUserRequestsAsync(userId);
            return requests.Select(MapToListDto);
        }

        public async Task<IEnumerable<TypesetRequestResponseDto>> GetAllRequestsAsync(string? status = null)
        {
            IEnumerable<TypesetRequest> requests;

            if (!string.IsNullOrWhiteSpace(status))
            {
                requests = await _requestRepository.GetRequestsByStatusAsync(status);
            }
            else
            {
                requests = await _requestRepository.GetAllRequestsAsync();
            }

            return requests.Select(r => MapToResponseDto(r, r.User!));
        }

        public async Task<bool> UpdateRequestStatusAsync(int id, TypesetRequestUpdateDto dto, string adminEmail)
        {
            try
            {
                var request = await _requestRepository.GetRequestByIdWithUserAsync(id);
                if (request == null)
                {
                    return false;
                }

                // Validate status
                if (!TypesetRequestStatus.IsValidStatus(dto.Status))
                {
                    throw new InvalidOperationException($"Invalid status: {dto.Status}");
                }

                var oldStatus = request.Status;
                request.Status = dto.Status;
                request.AdminNotes = dto.AdminNotes;
                request.AdminProcessedBy = dto.AdminProcessedBy ?? adminEmail;

                if (dto.Status == TypesetRequestStatus.Completed || dto.Status == TypesetRequestStatus.Rejected)
                {
                    request.CompletedAt = DateTime.UtcNow;
                }

                var updated = await _requestRepository.UpdateRequestAsync(request);

                if (updated && oldStatus != dto.Status)
                {
                    // Create notification for user when status changes
                    string notificationTitle = $"Typeset Request Update - {dto.Status}";
                    string notificationMessage = dto.Status switch
                    {
                        TypesetRequestStatus.InProgress => "Your typeset request is now being processed by our team.",
                        TypesetRequestStatus.Completed => "Great news! Your typeset request has been completed.",
                        TypesetRequestStatus.Rejected => $"Your typeset request has been declined. {(string.IsNullOrWhiteSpace(dto.AdminNotes) ? "" : $"Reason: {dto.AdminNotes}")}",
                        _ => $"Your typeset request status has been updated to {dto.Status}."
                    };

                    await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                    {
                        UserId = request.UserId,
                        Type = dto.Status == TypesetRequestStatus.Completed ? "success" : 
                               dto.Status == TypesetRequestStatus.Rejected ? "error" : "info",
                        Title = notificationTitle,
                        Message = notificationMessage,
                        Link = "/profile",
                        RelatedEntityId = id.ToString(),
                        RelatedEntityType = "TypesetRequest"
                    });

                    _logger.LogInformation($"Created notification for typeset request #{id} status change from {oldStatus} to {dto.Status}");
                }

                _logger.LogInformation($"Updated typeset request #{id} status from {oldStatus} to {dto.Status}");
                return updated;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating typeset request #{id}");
                throw;
            }
        }

        public async Task<bool> DeleteRequestAsync(int id, string userId, bool isAdmin = false)
        {
            try
            {
                var request = await _requestRepository.GetRequestByIdAsync(id);
                if (request == null)
                {
                    return false;
                }

                // Users can only delete their own pending requests
                if (!isAdmin)
                {
                    if (request.UserId != userId)
                    {
                        throw new UnauthorizedAccessException("You can only delete your own requests");
                    }

                    if (request.Status != TypesetRequestStatus.Pending)
                    {
                        throw new InvalidOperationException("You can only delete pending requests");
                    }
                }

                // Delete temp file if it exists
                if (!string.IsNullOrWhiteSpace(request.PaperFilePath))
                {
                    await _tempFileService.DeleteTempPdfAsync(request.PaperFilePath);
                }

                var deleted = await _requestRepository.DeleteRequestAsync(id);
                _logger.LogInformation($"Deleted typeset request #{id}");
                return deleted;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting typeset request #{id}");
                throw;
            }
        }

        public async Task<bool> CanUserCreateRequestAsync(string userId)
        {
            var todayCount = await _requestRepository.CountUserRequestsTodayAsync(userId);
            return todayCount < _maxRequestsPerDay;
        }

        private TypesetRequestResponseDto MapToResponseDto(TypesetRequest request, UserProfile user)
        {
            return new TypesetRequestResponseDto
            {
                Id = request.Id,
                UserId = request.UserId,
                UserEmail = request.UserEmail,
                UserName = request.UserName,
                PaperFilePath = request.PaperFilePath,
                CloudinaryUrl = request.CloudinaryUrl,
                UserMessage = request.UserMessage,
                PaperMetadata = request.PaperMetadata,
                Status = request.Status,
                AdminNotes = request.AdminNotes,
                AdminProcessedBy = request.AdminProcessedBy,
                RequestedAt = request.RequestedAt,
                CompletedAt = request.CompletedAt
            };
        }

        private TypesetRequestListDto MapToListDto(TypesetRequest request)
        {
            var metadata = ParseMetadata(request.PaperMetadata);

            return new TypesetRequestListDto
            {
                Id = request.Id,
                Subject = metadata.GetValueOrDefault("subject"),
                ExamType = metadata.GetValueOrDefault("examType"),
                Stream = metadata.GetValueOrDefault("stream"),
                QuestionCount = int.TryParse(metadata.GetValueOrDefault("questionCount"), out var count) ? count : 0,
                Status = request.Status,
                RequestedAt = request.RequestedAt,
                AdminNotes = request.AdminNotes,
                CompletedAt = request.CompletedAt
            };
        }

        private Dictionary<string, string> ParseMetadata(string? metadataJson)
        {
            if (string.IsNullOrWhiteSpace(metadataJson))
                return new Dictionary<string, string>();

            try
            {
                var jsonDoc = JsonDocument.Parse(metadataJson);
                var result = new Dictionary<string, string>();

                foreach (var property in jsonDoc.RootElement.EnumerateObject())
                {
                    result[property.Name] = property.Value.ToString();
                }

                return result;
            }
            catch
            {
                return new Dictionary<string, string>();
            }
        }
    }
}
