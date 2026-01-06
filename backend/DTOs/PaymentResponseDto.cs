namespace backend.DTOs
{
    public class PaymentResponseDto
    {
        public bool Success { get; set; }
        public string? TransactionId { get; set; }
        public string? Message { get; set; }
        public string? PaymentUrl { get; set; }
        
        // PayHere payment details (for frontend to redirect)
        public PayHerePaymentDetails? PaymentDetails { get; set; }
    }

    public class PayHerePaymentDetails
    {
        public string MerchantId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Hash { get; set; } = string.Empty;
        public string NotifyUrl { get; set; } = string.Empty;
        public string CancelUrl { get; set; } = string.Empty;
        public string ReturnUrl { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public string Currency { get; set; } = string.Empty;
        public string Items { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
    }
}
