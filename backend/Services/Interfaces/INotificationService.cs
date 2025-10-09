using backend.DTOs;
using backend.Models;

namespace backend.Services.Interfaces
{
    public interface INotificationService
    {
        // Get user notifications with pagination
        Task<PaginatedNotificationsDto> GetUserNotificationsAsync(
            string userId, 
            int page = 1, 
            int pageSize = 10, 
            bool? isRead = null);

        // Get unread count
        Task<NotificationSummaryDto> GetUnreadCountAsync(string userId);

        // Create notification
        Task<NotificationDto> CreateNotificationAsync(CreateNotificationDto dto);

        // Create admin notification (broadcast to all admins)
        Task CreateAdminNotificationAsync(string type, string title, string message, string? link = null);

        // Create teacher notification (broadcast to all teachers)
        Task<int> CreateTeacherBroadcastNotificationAsync(string title, string message, string? link = null);

        // Mark as read
        Task<bool> MarkAsReadAsync(int notificationId, string userId);

        // Mark all as read
        Task<int> MarkAllAsReadAsync(string userId);

        // Delete notification
        Task<bool> DeleteNotificationAsync(int notificationId, string userId);

        // Get notification by ID
        Task<NotificationDto?> GetByIdAsync(int notificationId, string userId);
    }
}
