using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using backend.Services.Interfaces;
using backend.DTOs;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PaperGenerationsController : ControllerBase
    {
        private readonly IPaperGenerationService _service;
        private readonly INotificationService _notificationService;
        private readonly IUserProfileService _userProfileService;
        private readonly ILogger<PaperGenerationsController> _logger;

        public PaperGenerationsController(
            IPaperGenerationService service,
            INotificationService notificationService,
            IUserProfileService userProfileService,
            ILogger<PaperGenerationsController> logger)
        {
            _service = service;
            _notificationService = notificationService;
            _userProfileService = userProfileService;
            _logger = logger;
        }

        [HttpPost("log")]
        public async Task<IActionResult> LogPaperGeneration([FromBody] LogPaperGenerationRequest request)
        {
            try
            {
                // Get user info from JWT token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;
                var userEmail = User.FindFirst(ClaimTypes.Email)?.Value 
                    ?? User.FindFirst("email")?.Value;

                if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(userEmail))
                {
                    return Unauthorized(new { message = "User information not found in token" });
                }

                var result = await _service.LogPaperGenerationAsync(
                    userId,
                    userEmail,
                    request.QuestionIds,
                    request.PaperTitle
                );

                _logger.LogInformation(
                    "Paper generation logged: User {UserId} generated paper with {Count} questions",
                    userId,
                    request.QuestionIds.Count
                );

                // 🔔 NOTIFICATION: Notify user about successful paper generation
                try
                {
                    var userProfile = await _userProfileService.GetByIdAsync(userId);
                    var userName = userProfile?.FullName ?? userEmail;

                    // Notification for the user
                    await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                    {
                        UserId = userId,
                        Type = "success",
                        Title = "Paper Generated Successfully",
                        Message = $"Your exam paper '{request.PaperTitle ?? "Untitled"}' with {request.QuestionIds.Count} questions has been generated successfully!",
                        Link = "/teacher/dashboard"
                    });

                    // Notification for all admins
                    await _notificationService.CreateAdminNotificationAsync(
                        "info",
                        "New Paper Generated",
                        $"{userName} generated a paper: '{request.PaperTitle ?? "Untitled"}' ({request.QuestionIds.Count} questions)",
                        "/teacher/dashboard"
                    );

                    _logger.LogInformation($"Notifications sent for paper generation by {userName}");
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, "Failed to send paper generation notifications");
                    // Don't fail the request if notification fails
                }

                return Ok(new
                {
                    success = true,
                    message = "Paper generation logged successfully",
                    data = new
                    {
                        id = result.Id,
                        generatedAt = result.GeneratedAt,
                        totalQuestions = result.TotalQuestions
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error logging paper generation");

                // 🔔 NOTIFICATION: Notify user about paper generation failure
                try
                {
                    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                        ?? User.FindFirst("sub")?.Value;
                    
                    if (!string.IsNullOrEmpty(userId))
                    {
                        await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                        {
                            UserId = userId,
                            Type = "error",
                            Title = "Paper Generation Failed",
                            Message = $"Failed to generate exam paper. Please try again or contact support if the problem persists.",
                            Link = "/teacher/paper-builder"
                        });
                        _logger.LogInformation("Failure notification sent for paper generation");
                    }
                }
                catch (Exception notifEx)
                {
                    _logger.LogError(notifEx, "Failed to send paper generation failure notification");
                }

                return StatusCode(500, new { message = "Failed to log paper generation", error = ex.Message });
            }
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics([FromQuery] int days = 30)
        {
            try
            {
                var analytics = await _service.GetAnalyticsAsync(days);
                return Ok(analytics);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching paper generation analytics");
                return StatusCode(500, new { message = "Failed to fetch analytics", error = ex.Message });
            }
        }

        [HttpGet("my-generations")]
        public async Task<IActionResult> GetMyGenerations()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value;

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User information not found in token" });
                }

                var generations = await _service.GetTeacherGenerationsAsync(userId);
                return Ok(generations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user generations");
                return StatusCode(500, new { message = "Failed to fetch generations", error = ex.Message });
            }
        }

        [HttpGet("all")]
        [Authorize(Roles = "admin")]
        public async Task<IActionResult> GetAllGenerations()
        {
            try
            {
                var generations = await _service.GetAllGenerationsAsync();
                return Ok(generations);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching all generations");
                return StatusCode(500, new { message = "Failed to fetch generations", error = ex.Message });
            }
        }
    }

    public class LogPaperGenerationRequest
    {
        public List<Guid> QuestionIds { get; set; } = new();
        public string? PaperTitle { get; set; }
    }
}
