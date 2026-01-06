using backend.DTOs;
using backend.Services.Payment.Interfaces;
using backend.Services.Payment.API;
using backend.Repositories.Interfaces;
using System.Security.Cryptography;
using System.Text;
using backend.Data;
using backend.Models;

namespace backend.Services.Payment
{
    public class PaymentService : IPaymentService
    {
        private readonly ILogger<PaymentService> _logger;
        private readonly IConfiguration _configuration;
        private readonly PaymentServerClient _paymentServerClient;
        private readonly IUserProfileRepository _userProfileRepository;
        private readonly AppDbContext _db;

        public PaymentService(
            ILogger<PaymentService> logger,
            IConfiguration configuration,
            PaymentServerClient paymentServerClient,
            IUserProfileRepository userProfileRepository,
            AppDbContext db)
        {
            _logger = logger;
            _configuration = configuration;
            _paymentServerClient = paymentServerClient;
            _userProfileRepository = userProfileRepository;
            _db = db;
        }

        public async Task<PaymentResponseDto> InitiateCardPaymentAsync(PaymentRequestDto request, string userId)
        {
            try
            {
                // Generate unique order ID using UUID
                var orderId = Guid.NewGuid().ToString("N").ToUpper();

                _logger.LogInformation(
                    "Creating payment order: OrderId={OrderId}, UserId={UserId}, Amount={Amount}, Currency={Currency}",
                    orderId, userId, request.Amount, request.Currency);

                // Fetch user profile for payment metadata; fall back to safe placeholders if missing
                var userProfile = await _userProfileRepository.GetByIdAsync(userId);
                var userName = userProfile?.FullName?.Trim();
                if (string.IsNullOrWhiteSpace(userName))
                {
                    userName = "Customer";
                }

                var email = userProfile?.Email?.Trim();
                if (string.IsNullOrWhiteSpace(email))
                {
                    email = _configuration["DefaultUser:Email"] ?? "customer@example.com";
                }

                // Prepare request for payment server
                var paymentServerRequest = new PaymentServerRequest
                {
                    OrderId = orderId,
                    PaperId = request.PaperId,
                    PaymentId = request.PaymentId,
                    Amount = request.Amount,
                    Currency = request.Currency,
                    UserId = userId,
                    UserName = userName,
                    Email = email
                };
                Console.WriteLine("Payment Server Request: " + System.Text.Json.JsonSerializer.Serialize(paymentServerRequest));

                // Persist order → paper mapping in Papermaker DB at initiation time
                var paperIds = new List<string>();
                if (request.PaperIds != null)
                {
                    paperIds.AddRange(request.PaperIds.Where(p => !string.IsNullOrWhiteSpace(p)));
                }
                if (!string.IsNullOrWhiteSpace(request.PaperId))
                {
                    paperIds.Add(request.PaperId);
                }
                paperIds = paperIds
                    .Select(p => p.Trim())
                    .Where(p => !string.IsNullOrWhiteSpace(p))
                    .Distinct(StringComparer.Ordinal)
                    .ToList();

                if (paperIds.Count > 0)
                {
                    // Ensure the payment server receives a single paperId even if multiple are stored.
                    paymentServerRequest.PaperId = paperIds[0];

                    var createdAt = DateTime.UtcNow;
                    var orderRows = paperIds.Select(paperId => new Order
                    {
                        OrderId = orderId,
                        PaperId = paperId,
                        UserId = userId,
                        CreatedAt = createdAt
                    });

                    _db.Orders.AddRange(orderRows);
                    await _db.SaveChangesAsync();

                    _logger.LogInformation(
                        "Order records created: OrderId={OrderId}, UserId={UserId}, PaperCount={PaperCount}",
                        orderId, userId, paperIds.Count);
                }

                // Call payment server (localhost:5025)
                // Payment server will:
                // 1. Calculate MD5 hash using merchant secret
                // 2. Store payment details in its own database
                // 3. Return PayHere payment parameters
                var paymentServerResponse = await _paymentServerClient.CreatePaymentOrderAsync(paymentServerRequest);
                Console.WriteLine("Payment Server Response: " + System.Text.Json.JsonSerializer.Serialize(paymentServerResponse));

                _logger.LogInformation(
                    "Payment server response received: OrderId={OrderId}, MerchantId={MerchantId}",
                    paymentServerResponse.OrderId, paymentServerResponse.MerchantId);

                // Prepare response for frontend
                // Note: We don't send userId to frontend for security
                var resolvedEmail = !string.IsNullOrWhiteSpace(paymentServerResponse.Email)
                    ? paymentServerResponse.Email
                    : email;
                var resolvedItems = !string.IsNullOrWhiteSpace(paymentServerResponse.Items)
                    ? paymentServerResponse.Items
                    : $"Paper {request.PaperId}";
                var resolvedFirstName = !string.IsNullOrWhiteSpace(paymentServerResponse.FirstName)
                    ? paymentServerResponse.FirstName
                    : userName.Split(' ').FirstOrDefault() ?? "Customer";
                var resolvedLastName = !string.IsNullOrWhiteSpace(paymentServerResponse.LastName)
                    ? paymentServerResponse.LastName
                    : userName.Split(' ').Skip(1).FirstOrDefault() ?? "";

                return new PaymentResponseDto
                {
                    Success = true,
                    TransactionId = orderId,
                    Message = "Payment order created successfully",
                    PaymentDetails = new PayHerePaymentDetails
                    {
                        MerchantId = paymentServerResponse.MerchantId,
                        Amount = paymentServerResponse.Amount,
                        Hash = paymentServerResponse.Hash,
                        NotifyUrl = paymentServerResponse.NotifyUrl,
                        CancelUrl = paymentServerResponse.CancelUrl,
                        ReturnUrl = paymentServerResponse.ReturnUrl,
                        Email = resolvedEmail,
                        OrderId = paymentServerResponse.OrderId,
                        Currency = paymentServerResponse.Currency,
                        Items = resolvedItems,
                        FirstName = resolvedFirstName,
                        LastName = resolvedLastName
                    }
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initiating card payment for user {UserId}", userId);
                throw;
            }
        }

        public async Task<PaymentResponseDto> ProcessWalletPaymentAsync(PaymentRequestDto request, string userId)
        {
            try
            {
                // Generate unique transaction ID
                var transactionId = Guid.NewGuid().ToString("N").ToUpper();

                _logger.LogInformation(
                    "Processing wallet payment: TransactionId={TransactionId}, UserId={UserId}, Amount={Amount}",
                    transactionId, userId, request.Amount);

                // TODO: Implement wallet payment logic
                // 1. Check user's wallet balance from database
                // 2. Validate sufficient funds
                // 3. Create transaction record with status "Processing"
                // 4. Deduct amount from wallet
                // 5. Update transaction status to "Completed"
                // 6. Create paper order record

                // Mock implementation
                await Task.CompletedTask;

                _logger.LogInformation("Wallet payment processed successfully: TransactionId={TransactionId}", transactionId);

                return new PaymentResponseDto
                {
                    Success = true,
                    TransactionId = transactionId,
                    Message = "Wallet payment completed successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing wallet payment for user {UserId}", userId);
                throw;
            }
        }

        public async Task<bool> VerifyPayHereCallbackAsync(Dictionary<string, string> callbackData)
        {
            try
            {
                var merchantId = callbackData.GetValueOrDefault("merchant_id", "");
                var orderId = callbackData.GetValueOrDefault("order_id", "");
                var payHereAmount = callbackData.GetValueOrDefault("payhere_amount", "");
                var payHereCurrency = callbackData.GetValueOrDefault("payhere_currency", "");
                var statusCode = callbackData.GetValueOrDefault("status_code", "");
                var md5sig = callbackData.GetValueOrDefault("md5sig", "");

                // Verify merchant ID
                var expectedMerchantId = _configuration["PayHere:MerchantId"];
                if (merchantId != expectedMerchantId)
                {
                    _logger.LogWarning("Invalid merchant ID in callback: {MerchantId}", merchantId);
                    return false;
                }

                // Verify MD5 signature
                var merchantSecret = _configuration["PayHere:MerchantSecret"];
                var expectedHash = GenerateMd5Hash($"{merchantId}{orderId}{payHereAmount}{payHereCurrency}{statusCode}{merchantSecret}");

                if (md5sig.ToUpper() != expectedHash.ToUpper())
                {
                    _logger.LogWarning("Invalid MD5 signature in callback for order {OrderId}", orderId);
                    return false;
                }

                _logger.LogInformation("PayHere callback verified successfully for order {OrderId}", orderId);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying PayHere callback");
                return false;
            }
        }

        private string GenerateMd5Hash(string input)
        {
            using var md5 = MD5.Create();
            var inputBytes = Encoding.UTF8.GetBytes(input);
            var hashBytes = md5.ComputeHash(inputBytes);
            return Convert.ToHexString(hashBytes);
        }
    }
}
