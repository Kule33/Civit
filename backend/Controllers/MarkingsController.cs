using backend.DTOs;
using backend.Services.Interfaces;
using backend.Services.DTOs;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.Extensions.Logging;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class MarkingsController : ControllerBase
    {
        private readonly IMarkingService _markingService;
        private readonly INotificationService _notificationService;
        private readonly IUserProfileService _userProfileService;
        private readonly ILogger<MarkingsController> _logger;

        public MarkingsController(
            IMarkingService markingService,
            INotificationService notificationService,
            IUserProfileService userProfileService,
            ILogger<MarkingsController> logger)
        {
            _markingService = markingService;
            _notificationService = notificationService;
            _userProfileService = userProfileService;
            _logger = logger;
        }

        [HttpPost("upload")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UploadMarking([FromBody] MarkingUploadDto? uploadDto)
        {
            _logger.LogInformation("========================================");
            _logger.LogInformation($"📥 MARKING UPLOAD REQUEST");
            _logger.LogInformation($"📋 DTO Data - Subject: '{uploadDto?.Subject}', ExamType: '{uploadDto?.ExamType}', Year: {uploadDto?.Year}");
            _logger.LogInformation("========================================");
            
            if (uploadDto == null)
            {
                return BadRequest("Upload data is required");
            }

            // Automatically set the uploader email and user ID from the authenticated user's JWT token
            var uploaderEmail = User.FindFirst(ClaimTypes.Email)?.Value 
                             ?? User.FindFirst("email")?.Value;
            
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                      ?? User.FindFirst("sub")?.Value;
            
            if (string.IsNullOrEmpty(uploaderEmail))
            {
                _logger.LogWarning("Could not extract email from JWT token");
            }
            else
            {
                uploadDto.Uploader = uploaderEmail;
                _logger.LogInformation($"Setting uploader to: {uploaderEmail}");
            }
            
            if (!string.IsNullOrEmpty(userId))
            {
                uploadDto.UploadedBy = userId;
                _logger.LogInformation($"Setting uploadedBy to: {userId}");
            }

            try
            {
                var result = await _markingService.UploadMarkingAsync(uploadDto);

                if (!string.IsNullOrEmpty(userId) && result != null)
                {
                    // Build notification message with marking details
                    var markingDetails = BuildMarkingDetailsString(uploadDto);
                    
                    _logger.LogInformation($"Marking notification details: {markingDetails}");
                    
                    string notificationMessage = $"{markingDetails} marking scheme added to library";
                    string broadcastMessage = $"New {markingDetails} marking scheme available";

                    // 1. Notify uploader (admin who uploaded)
                    try
                    {
                        await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                        {
                            UserId = userId,
                            Type = "success",
                            Title = "Marking Scheme Added Successfully",
                            Message = notificationMessage,
                            Link = "/papers"
                        });
                        
                        _logger.LogInformation($"Created marking notification for user {userId}");
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogError(notifEx, "Failed to create notification for uploader but continuing operation");
                    }

                    // 2. Broadcast to all admins
                    try
                    {
                        await _notificationService.CreateAdminNotificationAsync(
                            "info",
                            "New Marking Scheme Uploaded",
                            broadcastMessage,
                            "/papers"
                        );
                        
                        _logger.LogInformation("Broadcasted marking creation notification to all admins");
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogError(notifEx, "Failed to broadcast notification to admins but continuing operation");
                    }

                    // 3. Broadcast to all teachers
                    try
                    {
                        var teachersNotified = await _notificationService.CreateTeacherBroadcastNotificationAsync(
                            "New Marking Scheme Available",
                            broadcastMessage,
                            "/papers"
                        );
                        
                        _logger.LogInformation($"Broadcasted marking creation notification to {teachersNotified} teachers");
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogError(notifEx, "Failed to broadcast notification to teachers but continuing operation");
                    }
                }
                
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading marking");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetMarking(Guid id)
        {
            var marking = await _markingService.GetMarkingByIdAsync(id);
            if (marking == null)
            {
                return NotFound();
            }
            return Ok(marking);
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetFilteredMarkings([FromQuery] MarkingSearchDto searchDto)
        {
            try
            {
                var markings = await _markingService.GetFilteredMarkingsAsync(searchDto);
                return Ok(markings);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching filtered markings");
                return StatusCode(500, "An error occurred while fetching markings. Please try again later.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeleteMarking(Guid id)
        {
            var marking = await _markingService.GetMarkingByIdAsync(id);
            if (marking == null)
            {
                return NotFound();
            }

            var result = await _markingService.DeleteMarkingAsync(id);
            if (!result)
            {
                return NotFound();
            }

            // Broadcast deletion notification to all admins
            try
            {
                var markingDetails = BuildMarkingDetailsFromModel(marking);
                
                await _notificationService.CreateAdminNotificationAsync(
                    "warning",
                    "Marking Scheme Deleted",
                    $"{markingDetails} marking scheme removed from library",
                    "/papers"
                );
                
                _logger.LogInformation($"Broadcasted deletion notification to all admins for marking {id} - {markingDetails}");
            }
            catch (Exception notifEx)
            {
                _logger.LogError(notifEx, "Failed to broadcast deletion notification to admins but continuing operation");
            }

            _logger.LogInformation($"Marking {id} deleted successfully");
            return NoContent();
        }

        [HttpPost("{id}/download")]
        [Authorize]
        public async Task<IActionResult> TrackDownload(Guid id)
        {
            try
            {
                // Get user ID from JWT token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? User.FindFirst("sub")?.Value 
                          ?? User.FindFirst("userId")?.Value;
                
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value 
                             ?? User.FindFirst("email")?.Value;

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userEmail))
                {
                    return BadRequest("User information not found in token");
                }

                // Get marking details for tracking
                var marking = await _markingService.GetMarkingByIdAsync(id);
                if (marking == null)
                {
                    return NotFound();
                }

                await _markingService.TrackDownloadAsync(
                    userId, 
                    userEmail, 
                    id, 
                    "marking",
                    marking.Country,
                    marking.Subject?.Name,
                    marking.Year
                );

                _logger.LogInformation($"Tracked download of marking {id} by user {userId}");

                // Create success notification for the user
                try
                {
                    // Get user profile to show full name in notifications
                    var userProfile = await _userProfileService.GetByIdAsync(userId);
                    var userName = userProfile?.FullName ?? userEmail;

                    var markingDetails = $"{marking.Subject?.Name} {FormatExamType(marking.ExamType)}";
                    if (marking.Year.HasValue)
                    {
                        markingDetails += $" {marking.Year}";
                    }
                    if (!string.IsNullOrEmpty(marking.School?.Name))
                    {
                        markingDetails += $" - {marking.School.Name}";
                    }

                    await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                    {
                        UserId = userId,
                        Type = "success",
                        Title = "Marking Scheme Downloaded Successfully",
                        Message = $"You have successfully downloaded {markingDetails} marking scheme",
                        Link = "/papers"
                    });

                    // Notify admins about the download
                    await _notificationService.CreateAdminNotificationAsync(
                        "info",
                        "Marking Scheme Downloaded",
                        $"{userName} downloaded {markingDetails} marking scheme",
                        "/admin/users"
                    );

                    _logger.LogInformation($"Created download notifications for marking {id}");
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, "Failed to create download notifications but continuing operation");
                }

                return Ok(new { message = "Download tracked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking marking download");
                return StatusCode(500, "An error occurred while tracking download.");
            }
        }

        // Helper methods for building notification messages
        private string BuildMarkingDetailsString(MarkingUploadDto uploadDto)
        {
            var parts = new List<string>();

            // Add subject and exam type (core info)
            if (!string.IsNullOrEmpty(uploadDto.Subject))
            {
                parts.Add(uploadDto.Subject);
            }
            
            var examType = FormatExamType(uploadDto.ExamType);
            parts.Add(examType);

            // Add year if available
            if (uploadDto.Year.HasValue && uploadDto.Year > 0)
            {
                parts.Add(uploadDto.Year.ToString()!);
            }

            var mainInfo = string.Join(" ", parts);
            
            // Add context from school and term
            if (!string.IsNullOrEmpty(uploadDto.SchoolName) && !string.IsNullOrEmpty(uploadDto.Term))
            {
                return $"{mainInfo} from {uploadDto.SchoolName} {uploadDto.Term}";
            }
            else if (!string.IsNullOrEmpty(uploadDto.SchoolName))
            {
                return $"{mainInfo} from {uploadDto.SchoolName}";
            }
            else if (!string.IsNullOrEmpty(uploadDto.Term))
            {
                var category = FormatPaperCategory(uploadDto.PaperCategory);
                return $"{mainInfo} {uploadDto.Term} {category}";
            }
            else
            {
                var category = FormatPaperCategory(uploadDto.PaperCategory);
                return $"{mainInfo} {category}";
            }
        }

        private string BuildMarkingDetailsFromModel(MarkingResponseDto marking)
        {
            var parts = new List<string>();

            // Add subject and exam type (core info)
            if (marking.Subject != null && !string.IsNullOrEmpty(marking.Subject.Name))
            {
                parts.Add(marking.Subject.Name);
            }
            
            var examType = FormatExamType(marking.ExamType);
            parts.Add(examType);

            // Add year if available
            if (marking.Year.HasValue && marking.Year > 0)
            {
                parts.Add(marking.Year.ToString()!);
            }

            var mainInfo = string.Join(" ", parts);
            
            // Add context from school and term
            var schoolName = marking.School?.Name;
            if (!string.IsNullOrEmpty(schoolName) && !string.IsNullOrEmpty(marking.Term))
            {
                return $"{mainInfo} from {schoolName} {marking.Term}";
            }
            else if (!string.IsNullOrEmpty(schoolName))
            {
                return $"{mainInfo} from {schoolName}";
            }
            else if (!string.IsNullOrEmpty(marking.Term))
            {
                var category = FormatPaperCategory(marking.PaperCategory);
                return $"{mainInfo} {marking.Term} {category}";
            }
            else
            {
                var category = FormatPaperCategory(marking.PaperCategory);
                return $"{mainInfo} {category}";
            }
        }

        private string FormatExamType(string examType)
        {
            return examType?.ToLower() switch
            {
                "o_level" => "O-Level",
                "a_level" => "A-Level",
                "grade5" => "Grade 5",
                "gcse" => "GCSE",
                "igcse" => "IGCSE",
                _ => examType ?? "Unknown"
            };
        }

        private string? FormatPaperCategory(string? paperCategory)
        {
            if (string.IsNullOrEmpty(paperCategory)) return paperCategory;
            
            return paperCategory.ToLower() switch
            {
                "past_papers" => "Past Paper",
                "model_papers" => "Model Paper",
                "provincial_papers" => "Provincial Paper",
                "school_papers" => "School Paper",
                _ => paperCategory
            };
        }
    }
}
