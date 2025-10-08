using backend.Models;

namespace backend.Repositories.Interfaces
{
    public interface INotificationRepository
    {
        // Get paginated notifications for a user
        Task<(List<Notification> Notifications, int TotalCount)> GetUserNotificationsAsync(
            string userId, 
            int page = 1, 
            int pageSize = 10, 
            bool? isRead = null);

        // Get unread count for badge
        Task<int> GetUnreadCountAsync(string userId);

        // Create a new notification
        Task<Notification> CreateNotificationAsync(Notification notification);

        // Mark single notification as read
        Task<bool> MarkAsReadAsync(int notificationId, string userId);

        // Mark all user notifications as read
        Task<int> MarkAllAsReadAsync(string userId);

        // Delete notification
        Task<bool> DeleteNotificationAsync(int notificationId, string userId);

        // Get notification by ID
        Task<Notification?> GetByIdAsync(int notificationId, string userId);
    }
}
