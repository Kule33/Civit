using backend.DTOs;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace backend.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepo;
        private readonly IUserProfileRepository _userProfileRepo;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(
            INotificationRepository notificationRepo,
            IUserProfileRepository userProfileRepo,
            ILogger<NotificationService> logger)
        {
            _notificationRepo = notificationRepo;
            _userProfileRepo = userProfileRepo;
            _logger = logger;
        }

        public async Task<PaginatedNotificationsDto> GetUserNotificationsAsync(
            string userId, 
            int page = 1, 
            int pageSize = 10, 
            bool? isRead = null)
        {
            var (notifications, totalCount) = await _notificationRepo.GetUserNotificationsAsync(
                userId, page, pageSize, isRead);

            var notificationDtos = notifications.Select(n => new NotificationDto
            {
                Id = n.Id,
                UserId = n.UserId,
                Type = n.Type,
                Title = n.Title,
                Message = n.Message,
                Link = n.Link,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                RelatedEntityId = n.RelatedEntityId,
                RelatedEntityType = n.RelatedEntityType
            }).ToList();

            return new PaginatedNotificationsDto
            {
                Notifications = notificationDtos,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
            };
        }

        public async Task<NotificationSummaryDto> GetUnreadCountAsync(string userId)
        {
            var count = await _notificationRepo.GetUnreadCountAsync(userId);
            return new NotificationSummaryDto { UnreadCount = count };
        }

        public async Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto)
        {
            var notification = new Notification
            {
                UserId = dto.UserId,
                Type = dto.Type,
                Title = dto.Title,
                Message = dto.Message,
                Link = dto.Link,
                IsRead = false,
                CreatedAt = DateTime.UtcNow,
                RelatedEntityId = dto.RelatedEntityId,
                RelatedEntityType = dto.RelatedEntityType
            };

            var created = await _notificationRepo.CreateNotificationAsync(notification);

            return new NotificationDto
            {
                Id = created.Id,
                UserId = created.UserId,
                Type = created.Type,
                Title = created.Title,
                Message = created.Message,
                Link = created.Link,
                IsRead = created.IsRead,
                CreatedAt = created.CreatedAt,
                RelatedEntityId = created.RelatedEntityId,
                RelatedEntityType = created.RelatedEntityType
            };
        }

        public async Task CreateAdminNotificationAsync(
            string type, 
            string title, 
            string message, 
            string? link = null)
        {
            // Get all admin users
            var adminProfiles = await _userProfileRepo.GetAllAsync();
            var admins = adminProfiles.Where(p => p.Role.ToLower() == "admin");

            foreach (var admin in admins)
            {
                await CreateNotificationAsync(new CreateNotificationDto
                {
                    UserId = admin.Id,
                    Type = type,
                    Title = title,
                    Message = message,
                    Link = link
                });
            }
        }

        public async Task<int> CreateTeacherBroadcastNotificationAsync(
            string title, 
            string message, 
            string? link = null)
        {
            try
            {
                // Get all teacher users
                var allProfiles = await _userProfileRepo.GetAllAsync();
                var teachers = allProfiles.Where(p => p.Role.ToLower() == "teacher").ToList();

                var notificationsSent = 0;

                foreach (var teacher in teachers)
                {
                    try
                    {
                        await CreateNotificationAsync(new CreateNotificationDto
                        {
                            UserId = teacher.Id,
                            Type = "info",
                            Title = title,
                            Message = message,
                            Link = link
                        });

                        notificationsSent++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, $"Failed to create notification for teacher {teacher.Id}");
                    }
                }

                _logger.LogInformation($"Created {notificationsSent} teacher notifications");
                return notificationsSent;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating teacher broadcast notifications");
                return 0;
            }
        }

        public async Task<bool> MarkAsReadAsync(int notificationId, string userId)
        {
            return await _notificationRepo.MarkAsReadAsync(notificationId, userId);
        }

        public async Task<int> MarkAllAsReadAsync(string userId)
        {
            return await _notificationRepo.MarkAllAsReadAsync(userId);
        }

        public async Task<bool> DeleteNotificationAsync(int notificationId, string userId)
        {
            return await _notificationRepo.DeleteNotificationAsync(notificationId, userId);
        }

        public async Task<NotificationDto?> GetByIdAsync(int notificationId, string userId)
        {
            var notification = await _notificationRepo.GetByIdAsync(notificationId, userId);
            
            if (notification == null)
                return null;

            return new NotificationDto
            {
                Id = notification.Id,
                UserId = notification.UserId,
                Type = notification.Type,
                Title = notification.Title,
                Message = notification.Message,
                Link = notification.Link,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
                RelatedEntityId = notification.RelatedEntityId,
                RelatedEntityType = notification.RelatedEntityType
            };
        }
    }
}
