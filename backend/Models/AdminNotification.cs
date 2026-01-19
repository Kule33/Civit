using System;
using System.Text.Json;

namespace backend.Models
{
    public enum AdminNotificationType
    {
        suspicious,
        refund,
        normal
    }

    public class AdminNotification
    {
        public long Id { get; set; }

        public AdminNotificationType Type { get; set; }

        public Guid? UserId { get; set; }

        public bool Read { get; set; } = false;

        public JsonDocument? Metadata { get; set; }

        public string? Link { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
