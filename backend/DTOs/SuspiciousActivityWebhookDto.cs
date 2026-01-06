using System;

namespace backend.DTOs
{
    public class SuspiciousActivityWebhookDto
    {
        public string TransactionId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public DateTime OccurredAt { get; set; }
    }
}
