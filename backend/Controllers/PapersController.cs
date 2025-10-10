using backend.DTOs;
using backend.Services.Interfaces;
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
    public class PapersController : ControllerBase
    {
        private readonly IPaperService _paperService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<PapersController> _logger;

        public PapersController(
            IPaperService paperService,
            INotificationService notificationService,
            ILogger<PapersController> logger)
        {
            _paperService = paperService;
            _notificationService = notificationService;
            _logger = logger;
        }

        [HttpPost("upload")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> UploadPaper([FromBody] PaperUploadDto? uploadDto)
        {
            _logger.LogInformation("========================================");
            _logger.LogInformation($"📥 PAPER UPLOAD REQUEST");
            _logger.LogInformation($"📋 DTO Data - Subject: '{uploadDto?.Subject}', ExamType: '{uploadDto?.ExamType}', Year: {uploadDto?.Year}");
            _logger.LogInformation("========================================");
            
            if (uploadDto == null)
            {
                return BadRequest("Upload data is required");
            }

            // Automatically set the uploader email from the authenticated user's JWT token
            var uploaderEmail = User.FindFirst(ClaimTypes.Email)?.Value 
                             ?? User.FindFirst("email")?.Value;
            
            if (string.IsNullOrEmpty(uploaderEmail))
            {
                _logger.LogWarning("Could not extract email from JWT token");
            }
            else
            {
                uploadDto.Uploader = uploaderEmail;
                _logger.LogInformation($"Setting uploader to: {uploaderEmail}");
            }

            try
            {
                var result = await _paperService.UploadPaperAsync(uploadDto);
                
                // Get user ID from JWT token for notifications
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? User.FindFirst("sub")?.Value 
                          ?? User.FindFirst("userId")?.Value;

                if (!string.IsNullOrEmpty(userId) && result != null)
                {
                    // Build notification message with paper details
                    var paperDetails = BuildPaperDetailsString(uploadDto);
                    
                    _logger.LogInformation($"Paper notification details: {paperDetails}");
                    
                    string notificationMessage = $"{paperDetails} paper added to papers library";
                    string broadcastMessage = $"New {paperDetails} paper available";

                    // 1. Notify uploader (admin who uploaded)
                    try
                    {
                        await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                        {
                            UserId = userId,
                            Type = "success",
                            Title = "Paper Added Successfully",
                            Message = notificationMessage,
                            Link = "/papers"
                        });
                        
                        _logger.LogInformation($"Created paper notification for user {userId}");
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
                            "New Paper Uploaded",
                            broadcastMessage,
                            "/papers"
                        );
                        
                        _logger.LogInformation("Broadcasted paper creation notification to all admins");
                    }
                    catch (Exception notifEx)
                    {
                        _logger.LogError(notifEx, "Failed to broadcast notification to admins but continuing operation");
                    }

                    // 3. Broadcast to all teachers
                    try
                    {
                        var teachersNotified = await _notificationService.CreateTeacherBroadcastNotificationAsync(
                            "New Paper Available",
                            broadcastMessage,
                            "/papers"
                        );
                        
                        _logger.LogInformation($"Broadcasted paper creation notification to {teachersNotified} teachers");
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
                _logger.LogError(ex, "Error uploading paper");
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetPaper(Guid id)
        {
            var paper = await _paperService.GetPaperByIdAsync(id);
            if (paper == null)
            {
                return NotFound();
            }
            return Ok(paper);
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetFilteredPapers([FromQuery] PaperSearchDto searchDto)
        {
            try
            {
                var papers = await _paperService.GetFilteredPapersAsync(searchDto);
                return Ok(papers);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching filtered papers");
                return StatusCode(500, "An error occurred while fetching papers. Please try again later.");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> DeletePaper(Guid id)
        {
            var paper = await _paperService.GetPaperByIdAsync(id);
            if (paper == null)
            {
                return NotFound();
            }

            var result = await _paperService.DeletePaperAsync(id);
            if (!result)
            {
                return NotFound();
            }

            // Broadcast deletion notification to all admins
            try
            {
                var paperDetails = BuildPaperDetailsFromModel(paper);
                
                await _notificationService.CreateAdminNotificationAsync(
                    "warning",
                    "Paper Deleted",
                    $"{paperDetails} paper removed from papers library",
                    "/papers"
                );
                
                _logger.LogInformation($"Broadcasted deletion notification to all admins for paper {id} - {paperDetails}");
            }
            catch (Exception notifEx)
            {
                _logger.LogError(notifEx, "Failed to broadcast deletion notification to admins but continuing operation");
            }

            _logger.LogInformation($"Paper {id} deleted successfully");
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

                // Get paper details for tracking
                var paper = await _paperService.GetPaperByIdAsync(id);
                if (paper == null)
                {
                    return NotFound();
                }

                await _paperService.TrackDownloadAsync(
                    userId, 
                    userEmail, 
                    id, 
                    "paper",
                    paper.Country,
                    paper.Subject?.Name,
                    paper.Year
                );

                _logger.LogInformation($"Tracked download of paper {id} by user {userId}");
                return Ok(new { message = "Download tracked successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error tracking paper download");
                return StatusCode(500, "An error occurred while tracking download.");
            }
        }

        // Helper methods for building notification messages
        private string BuildPaperDetailsString(PaperUploadDto uploadDto)
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

        private string BuildPaperDetailsFromModel(PaperResponseDto paper)
        {
            var parts = new List<string>();

            // Add subject and exam type (core info)
            if (paper.Subject != null && !string.IsNullOrEmpty(paper.Subject.Name))
            {
                parts.Add(paper.Subject.Name);
            }
            
            var examType = FormatExamType(paper.ExamType);
            parts.Add(examType);

            // Add year if available
            if (paper.Year.HasValue && paper.Year > 0)
            {
                parts.Add(paper.Year.ToString()!);
            }

            var mainInfo = string.Join(" ", parts);
            
            // Add context from school and term
            var schoolName = paper.School?.Name;
            if (!string.IsNullOrEmpty(schoolName) && !string.IsNullOrEmpty(paper.Term))
            {
                return $"{mainInfo} from {schoolName} {paper.Term}";
            }
            else if (!string.IsNullOrEmpty(schoolName))
            {
                return $"{mainInfo} from {schoolName}";
            }
            else if (!string.IsNullOrEmpty(paper.Term))
            {
                var category = FormatPaperCategory(paper.PaperCategory);
                return $"{mainInfo} {paper.Term} {category}";
            }
            else
            {
                var category = FormatPaperCategory(paper.PaperCategory);
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
