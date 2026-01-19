namespace backend.Services.Payment.API
{
    /// <summary>
    /// Request model for payment server (localhost:5025)
    /// </summary>
    public class PaymentServerRequest
    {
        public string OrderId { get; set; } = string.Empty;
        public string PaperId { get; set; } = string.Empty;
        public string PaymentId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
    }

    /// <summary>
    /// Normalized PayHere response values used by the backend
    /// </summary>
    public class PaymentServerResponse
    {
        public bool Success { get; set; } = true;
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
        public string? Message { get; set; }
    }

    /// <summary>
    /// Raw intent response returned by the payment server (PaymentIntentResult)
    /// </summary>
    public class PaymentServerIntentResponse
    {
        public string Gateway { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty;
        public string Url { get; set; } = string.Empty;
        public Dictionary<string, string> Fields { get; set; } = new();
    }
}
