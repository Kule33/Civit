using backend.DTOs;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationsController> _logger;

        public NotificationsController(
            INotificationService notificationService,
            ILogger<NotificationsController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        // GET /api/notifications?page=1&pageSize=10&isRead=false
        [HttpGet]
        public async Task<ActionResult<PaginatedNotificationsDto>> GetNotifications(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] bool? isRead = null)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var notifications = await _notificationService.GetUserNotificationsAsync(
                    userId, page, pageSize, isRead);

                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notifications");
                return StatusCode(500, "Failed to get notifications");
            }
        }

        // GET /api/notifications/unread-count
        [HttpGet("unread-count")]
        public async Task<ActionResult<NotificationSummaryDto>> GetUnreadCount()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var summary = await _notificationService.GetUnreadCountAsync(userId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting unread count");
                return StatusCode(500, "Failed to get unread count");
            }
        }

        // GET /api/notifications/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<NotificationDto>> GetNotificationById(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var notification = await _notificationService.GetByIdAsync(id, userId);
                if (notification == null)
                {
                    return NotFound("Notification not found");
                }

                return Ok(notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification {NotificationId}", id);
                return StatusCode(500, "Failed to get notification");
            }
        }

        // PUT /api/notifications/{id}/read
        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _notificationService.MarkAsReadAsync(id, userId);
                if (!success)
                {
                    return NotFound("Notification not found");
                }

                return Ok(new { message = "Notification marked as read" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking notification {NotificationId} as read", id);
                return StatusCode(500, "Failed to mark notification as read");
            }
        }

        // PUT /api/notifications/mark-all-read
        [HttpPut("mark-all-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var count = await _notificationService.MarkAllAsReadAsync(userId);
                return Ok(new { message = $"Marked {count} notifications as read", count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error marking all notifications as read");
                return StatusCode(500, "Failed to mark all notifications as read");
            }
        }

        // DELETE /api/notifications/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var success = await _notificationService.DeleteNotificationAsync(id, userId);
                if (!success)
                {
                    return NotFound("Notification not found");
                }

                return Ok(new { message = "Notification deleted" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting notification {NotificationId}", id);
                return StatusCode(500, "Failed to delete notification");
            }
        }

        // POST /api/notifications (Admin only)
        [HttpPost]
        [Authorize(Roles = "admin")]
        public async Task<ActionResult<NotificationDto>> CreateNotification(
            [FromBody] CreateNotificationDto dto)
        {
            try
            {
                var notification = await _notificationService.CreateNotificationAsync(dto);
                return CreatedAtAction(
                    nameof(GetNotificationById),
                    new { id = notification.Id },
                    notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification");
                return StatusCode(500, "Failed to create notification");
            }
        }

        // POST /api/notifications/test - Test endpoint to create a notification for current user
        [HttpPost("test")]
        public async Task<IActionResult> CreateTestNotification()
        {
            try
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized("User ID not found in token");
                }

                var notification = await _notificationService.CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = userId,
                    Type = "info",
                    Title = "Test Notification",
                    Message = "This is a test notification to verify the system is working!",
                    Link = "/teacher/dashboard"
                });

                _logger.LogInformation($"Test notification created for user {userId}");

                return Ok(new { 
                    message = "Test notification created successfully", 
                    notification 
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating test notification");
                return StatusCode(500, "Failed to create test notification");
            }
        }
    }
}
