using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace backend.Services.Payment.API
{
    /// <summary>
    /// PayHere API client for server-to-server communication
    /// Uses REST API with HTTPS for secure payment processing
    /// </summary>
    public class PayHereApiClient
    {
        private readonly ILogger<PayHereApiClient> _logger;
        private readonly IConfiguration _configuration;
        private readonly HttpClient _httpClient;

        public PayHereApiClient(
            ILogger<PayHereApiClient> logger,
            IConfiguration configuration,
            HttpClient httpClient)
        {
            _logger = logger;
            _configuration = configuration;
            _httpClient = httpClient;

            // Configure HttpClient for PayHere API
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
        }

        /// <summary>
        /// Create a payment order via PayHere API (S2S communication)
        /// </summary>
        public async Task<string> CreatePaymentOrderAsync(PayHerePaymentOrder order)
        {
            try
            {
                var merchantId = _configuration["PayHere:MerchantId"] ?? throw new InvalidOperationException("PayHere MerchantId not configured");
                var merchantSecret = _configuration["PayHere:MerchantSecret"] ?? throw new InvalidOperationException("PayHere MerchantSecret not configured");
                var isSandbox = _configuration["PayHere:IsSandbox"] == "true";
                
                var returnUrl = _configuration["PayHere:ReturnUrl"] ?? "https://yoursite.com/payment/success";
                var cancelUrl = _configuration["PayHere:CancelUrl"] ?? "https://yoursite.com/payment/cancel";
                var notifyUrl = _configuration["PayHere:NotifyUrl"] ?? "https://yoursite.com/api/payments/payhere-callback";

                // Generate MD5 hash for security
                var hashString = $"{merchantId}{order.OrderId}{order.Amount:F2}{order.Currency}{GetMd5Hash(merchantSecret)}";
                var hash = GetMd5Hash(hashString);

                // Build PayHere payment request
                var paymentRequest = new
                {
                    merchant_id = merchantId,
                    return_url = returnUrl,
                    cancel_url = cancelUrl,
                    notify_url = notifyUrl,
                    order_id = order.OrderId,
                    items = $"Paper {order.PaperId}",
                    currency = order.Currency,
                    amount = order.Amount.ToString("F2"),
                    first_name = "Customer", // TODO: Get from user profile
                    last_name = "",
                    email = "customer@example.com", // TODO: Get from user profile
                    phone = "",
                    address = "",
                    city = "",
                    country = "Sri Lanka",
                    hash = hash,
                    // Custom fields to track our internal data
                    custom_1 = order.PaymentId,
                    custom_2 = order.PaperId
                };

                _logger.LogInformation(
                    "Sending payment request to PayHere: OrderId={OrderId}, Amount={Amount}, Currency={Currency}",
                    order.OrderId, order.Amount, order.Currency);

                // For PayHere, we typically redirect to their checkout page
                // So we build the URL with parameters instead of making an API call
                var baseUrl = isSandbox 
                    ? "https://sandbox.payhere.lk/pay/checkout" 
                    : "https://www.payhere.lk/pay/checkout";

                // Build query string
                var queryParams = new Dictionary<string, string>
                {
                    { "merchant_id", merchantId },
                    { "return_url", returnUrl },
                    { "cancel_url", cancelUrl },
                    { "notify_url", notifyUrl },
                    { "order_id", order.OrderId },
                    { "items", $"Paper {order.PaperId}" },
                    { "currency", order.Currency },
                    { "amount", order.Amount.ToString("F2") },
                    { "first_name", "Customer" },
                    { "last_name", "" },
                    { "email", "customer@example.com" },
                    { "phone", "" },
                    { "address", "" },
                    { "city", "" },
                    { "country", "Sri Lanka" },
                    { "hash", hash },
                    { "custom_1", order.PaymentId },
                    { "custom_2", order.PaperId }
                };

                var queryString = string.Join("&", queryParams.Select(kvp => 
                    $"{Uri.EscapeDataString(kvp.Key)}={Uri.EscapeDataString(kvp.Value)}"));

                var paymentUrl = $"{baseUrl}?{queryString}";

                _logger.LogInformation("PayHere payment URL generated successfully for order {OrderId}", order.OrderId);

                return paymentUrl;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating PayHere payment order");
                throw new InvalidOperationException("Failed to create payment order", ex);
            }
        }

        /// <summary>
        /// Verify payment status via PayHere API (optional, for backend verification)
        /// </summary>
        public async Task<PaymentStatusResponse> VerifyPaymentStatusAsync(string orderId)
        {
            try
            {
                var merchantId = _configuration["PayHere:MerchantId"];
                var merchantSecret = _configuration["PayHere:MerchantSecret"];
                var isSandbox = _configuration["PayHere:IsSandbox"] == "true";

                var apiUrl = isSandbox 
                    ? "https://sandbox.payhere.lk/merchant/v1/payment/search"
                    : "https://www.payhere.lk/merchant/v1/payment/search";

                // Create request with authentication
                var request = new HttpRequestMessage(HttpMethod.Get, $"{apiUrl}?order_id={orderId}");
                request.Headers.Add("Authorization", $"Basic {Convert.ToBase64String(Encoding.UTF8.GetBytes($"{merchantId}:{merchantSecret}"))}");

                var response = await _httpClient.SendAsync(request);
                response.EnsureSuccessStatusCode();

                var content = await response.Content.ReadAsStringAsync();
                var paymentStatus = JsonSerializer.Deserialize<PaymentStatusResponse>(content);

                _logger.LogInformation("Payment status verified for order {OrderId}: {Status}", orderId, paymentStatus?.Status);

                return paymentStatus ?? new PaymentStatusResponse { Status = "unknown" };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying payment status for order {OrderId}", orderId);
                throw;
            }
        }

        private string GetMd5Hash(string input)
        {
            using var md5 = MD5.Create();
            var inputBytes = Encoding.UTF8.GetBytes(input);
            var hashBytes = md5.ComputeHash(inputBytes);
            return Convert.ToHexString(hashBytes).ToUpper();
        }
    }

    public class PaymentStatusResponse
    {
        public string Status { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
    }

    public class PayHerePaymentOrder
    {
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = string.Empty;
        public string PaymentId { get; set; } = string.Empty;
        public string PaperId { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public List<string> QuestionsList { get; set; } = new();
    }
}
