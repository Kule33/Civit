using System.Text;
using System.Text.Json;
using System.Globalization;
using System.Security.Cryptography;

namespace backend.Services.Payment.API
{
    /// <summary>
    /// Client for communicating with separate payment server (localhost:5025)
    /// This server handles merchant credentials, hash generation, and payment logging
    /// </summary>
    public class PaymentServerClient
    {
        private readonly ILogger<PaymentServerClient> _logger;
        private readonly HttpClient _httpClient;
        private readonly string _paymentServerUrl;
        private readonly string? _apiKey;
        private readonly string? _hmacSecret;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        public PaymentServerClient(
            ILogger<PaymentServerClient> logger,
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _logger = logger;
            _httpClient = httpClient;
            _paymentServerUrl = configuration["PaymentServer:Url"] ?? "http://localhost:5025";

            // Support both hierarchical appsettings keys and flat .env-style names.
            _apiKey = configuration["PaymentServer:ApiKey"]
                ?? configuration["OUTBOUND_PAYMENT_KEY"];
            _hmacSecret = configuration["PaymentServer:HmacSecret"]
                ?? configuration["OUTBOUND_PAYMENT_SECRET"];
            
            _httpClient.BaseAddress = new Uri(_paymentServerUrl);
            _httpClient.Timeout = TimeSpan.FromSeconds(30);
        }

        /// <summary>
        /// Sends an HTTP request signed per the shared protocol contract.
        /// Canonical string: METHOD + requestUri + timestamp + nonce + rawJsonBody
        /// Hash: HMAC-SHA256 (UTF-8), lowercase hex.
        /// Headers: x-api-key, x-timestamp, x-nonce, x-signature.
        /// </summary>
        public async Task<HttpResponseMessage> SendSignedRequestAsync(
            HttpMethod method,
            string requestUri,
            object payload,
            string? idempotencyKey = null)
        {
            if (string.IsNullOrWhiteSpace(requestUri))
            {
                throw new ArgumentException("requestUri cannot be null/empty", nameof(requestUri));
            }

            if (string.IsNullOrWhiteSpace(_apiKey) || string.IsNullOrWhiteSpace(_hmacSecret))
            {
                throw new InvalidOperationException(
                    "Payment server signing credentials are not configured. Set PaymentServer:ApiKey and PaymentServer:HmacSecret (or OUTBOUND_PAYMENT_KEY and OUTBOUND_PAYMENT_SECRET)."
                );
            }

            var jsonBody = JsonSerializer.Serialize(payload, JsonOptions);
            var nonce = Guid.NewGuid().ToString("N");
            var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(CultureInfo.InvariantCulture);
            var resolvedIdempotencyKey = string.IsNullOrWhiteSpace(idempotencyKey)
                ? Guid.NewGuid().ToString("D")
                : idempotencyKey;

            var signatureString = method.Method.ToUpperInvariant() + requestUri + timestamp + nonce + jsonBody;
            var signatureHex = ComputeHmacSha256HexLower(signatureString, _hmacSecret);

            // Console.WriteLine("\n╔════════════════════════════════════════════════════════════════╗");
            // Console.WriteLine("║         [PaymentServerClient] S2S REQUEST SECURITY DETAILS       ║");
            // Console.WriteLine("╚════════════════════════════════════════════════════════════════╝");
            // Console.WriteLine($"[REQUEST] {method.Method.ToUpperInvariant()} {_paymentServerUrl}{requestUri}");
            // Console.WriteLine("\n[PAYLOAD SIGNING]");
            // Console.WriteLine($"  Canonical String:\n    {signatureString}");
            // Console.WriteLine($"\n[SECURITY HEADERS]");
            // Console.WriteLine($"  x-api-key:      {_apiKey}");
            // Console.WriteLine($"  x-timestamp:    {timestamp}");
            // Console.WriteLine($"  x-nonce:        {nonce}");
            // Console.WriteLine($"  x-signature:    {signatureHex}");
            // Console.WriteLine($"  Idempotency-Key: {resolvedIdempotencyKey}");
            // Console.WriteLine($"\n[SECRET INFO]");
            // Console.WriteLine($"  HMAC Secret: {(_hmacSecret?.Length > 0 ? _hmacSecret.Substring(0, Math.Min(15, _hmacSecret.Length)) + "..." : "NOT SET")}");
            // Console.WriteLine("╔════════════════════════════════════════════════════════════════╗\n");;

            var request = new HttpRequestMessage(method, requestUri)
            {
                Content = new StringContent(jsonBody, Encoding.UTF8, "application/json")
            };

            request.Headers.Add("x-api-key", _apiKey);
            request.Headers.Add("x-timestamp", timestamp);
            request.Headers.Add("x-nonce", nonce);
            request.Headers.Add("x-signature", signatureHex);
            request.Headers.Add("Idempotency-Key", resolvedIdempotencyKey);

            // Console.WriteLine("[PaymentServerClient] ✅ S2S Headers Ready to Send:");
            // Console.WriteLine($"  ├─ x-api-key:       {_apiKey}");
            // Console.WriteLine($"  ├─ x-timestamp:     {timestamp}");
            // Console.WriteLine($"  ├─ x-nonce:         {nonce}");
            // Console.WriteLine($"  ├─ x-signature:     {signatureHex}");
            // Console.WriteLine($"  └─ Idempotency-Key: {resolvedIdempotencyKey}\n");

            return await _httpClient.SendAsync(request);
        }

        private static string ComputeHmacSha256HexLower(string data, string secret)
        {
            var secretBytes = Encoding.UTF8.GetBytes(secret);
            var dataBytes = Encoding.UTF8.GetBytes(data);

            using var hmac = new HMACSHA256(secretBytes);
            var hashBytes = hmac.ComputeHash(dataBytes);
            return Convert.ToHexString(hashBytes).ToLowerInvariant();
        }

        /// <summary>
        /// Call payment server to create order and get PayHere details
        /// Payment server will handle hash generation and store payment details
        /// </summary>
        public async Task<PaymentServerResponse> CreatePaymentOrderAsync(PaymentServerRequest request)
        {
            try
            {
                _logger.LogInformation(
                    "Calling payment server: OrderId={OrderId}, Amount={Amount}, Currency={Currency}",
                    request.OrderId, request.Amount, request.Currency);

                // Idempotency-Key must remain stable across retries for the same payment intent.
                var idempotencyKey = Guid.NewGuid().ToString("D");

                HttpResponseMessage? response = null;
                const int maxAttempts = 3;
                for (var attempt = 1; attempt <= maxAttempts; attempt++)
                {
                    try
                    {
                        Console.WriteLine($"Attempt {attempt} to call payment server..."+
                            $" IdempotencyKey={idempotencyKey}"+"requst :"+request.ToString());
                            Console.WriteLine("x-api-key: "+ _apiKey);
                            Console.WriteLine("x-hmac-signature: "+ _hmacSecret);
                        response = await SendSignedRequestAsync(
                            HttpMethod.Post,
                            "/api/v1/payments/intents",
                            request,
                            idempotencyKey);

                        // Retry only on 5xx. 4xx indicates a client/payload problem and should not be retried.
                        if ((int)response.StatusCode >= 500 && attempt < maxAttempts)
                        {
                            var errorContent = await response.Content.ReadAsStringAsync();
                            _logger.LogWarning(
                                "Payment server 5xx. Attempt {Attempt}/{MaxAttempts}. StatusCode={StatusCode}, IdempotencyKey={IdempotencyKey}, Content={Content}",
                                attempt, maxAttempts, response.StatusCode, idempotencyKey, errorContent);
                            await Task.Delay(TimeSpan.FromMilliseconds(250 * attempt));
                            continue;
                        }

                        break;
                    }
                    catch (TaskCanceledException ex) when (attempt < maxAttempts)
                    {
                        _logger.LogWarning(
                            ex,
                            "Payment server request timed out. Attempt {Attempt}/{MaxAttempts}. IdempotencyKey={IdempotencyKey}",
                            attempt, maxAttempts, idempotencyKey);
                        await Task.Delay(TimeSpan.FromMilliseconds(250 * attempt));
                    }
                    catch (HttpRequestException ex) when (attempt < maxAttempts)
                    {
                        _logger.LogWarning(
                            ex,
                            "Payment server network error. Attempt {Attempt}/{MaxAttempts}. IdempotencyKey={IdempotencyKey}",
                            attempt, maxAttempts, idempotencyKey);
                        await Task.Delay(TimeSpan.FromMilliseconds(250 * attempt));
                    }
                }

                if (response == null)
                {
                    throw new InvalidOperationException("Failed to call payment server: no response received");
                }

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[PaymentServerClient] ❌ Payment server error response:");
                    Console.WriteLine($"  StatusCode: {response.StatusCode}");
                    Console.WriteLine($"  Content: {errorContent}");
                    _logger.LogError(
                        "Payment server returned error: StatusCode={StatusCode}, IdempotencyKey={IdempotencyKey}, Content={Content}",
                        response.StatusCode, idempotencyKey, errorContent);
                    throw new InvalidOperationException($"Payment server error: {response.StatusCode}");
                }

                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[PaymentServerClient] ✅ Payment server response:");
                Console.WriteLine($"  StatusCode: {response.StatusCode}");
                Console.WriteLine($"  Content: {responseContent}");
                if (string.IsNullOrWhiteSpace(responseContent))
                {
                    _logger.LogWarning("Payment server returned empty response body");
                    throw new InvalidOperationException("Payment order creation failed: empty response");
                }

                var intentResponse = JsonSerializer.Deserialize<PaymentServerIntentResponse>(responseContent, JsonOptions);

                if (intentResponse == null || intentResponse.Fields == null || intentResponse.Fields.Count == 0)
                {
                    _logger.LogWarning("Payment server response deserialization failed or missing fields. Content: {Content}", responseContent);
                    throw new InvalidOperationException("Payment order creation failed: invalid response");
                }

                var fields = intentResponse.Fields;
                fields.TryGetValue("merchant_id", out var merchantId);
                fields.TryGetValue("amount", out var amountStr);
                fields.TryGetValue("currency", out var currency);
                fields.TryGetValue("hash", out var hash);
                fields.TryGetValue("notify_url", out var notifyUrl);
                fields.TryGetValue("cancel_url", out var cancelUrl);
                fields.TryGetValue("return_url", out var returnUrl);
                fields.TryGetValue("email", out var email);
                fields.TryGetValue("order_id", out var orderId);
                fields.TryGetValue("items", out var items);
                fields.TryGetValue("first_name", out var firstName);
                fields.TryGetValue("last_name", out var lastName);

                if (string.IsNullOrWhiteSpace(merchantId) || string.IsNullOrWhiteSpace(hash))
                {
                    _logger.LogWarning("Payment server returned missing merchantId/hash. Content: {Content}", responseContent);
                    throw new InvalidOperationException("Payment order creation failed: missing required fields");
                }

                decimal amount = request.Amount;
                if (!string.IsNullOrWhiteSpace(amountStr) && decimal.TryParse(amountStr, NumberStyles.Any, CultureInfo.InvariantCulture, out var parsedAmount))
                {
                    amount = parsedAmount;
                }

                var paymentResponse = new PaymentServerResponse
                {
                    Success = true,
                    MerchantId = merchantId,
                    Amount = amount,
                    Hash = hash ?? string.Empty,
                    NotifyUrl = notifyUrl ?? string.Empty,
                    CancelUrl = cancelUrl ?? string.Empty,
                    ReturnUrl = returnUrl ?? string.Empty,
                    Email = email ?? string.Empty,
                    OrderId = orderId ?? string.Empty,
                    Currency = currency ?? request.Currency,
                    Items = items ?? string.Empty,
                    FirstName = firstName ?? string.Empty,
                    LastName = lastName ?? string.Empty
                };

                _logger.LogInformation(
                    "Payment order created successfully: OrderId={OrderId}, MerchantId={MerchantId}",
                    paymentResponse.OrderId, paymentResponse.MerchantId);

                return paymentResponse;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP error calling payment server");
                throw new InvalidOperationException("Failed to connect to payment server", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling payment server");
                throw;
            }
        }

        /// <summary>
        /// Verify payment status with payment server
        /// </summary>
        public async Task<bool> VerifyPaymentAsync(string orderId)
        {
            try
            {
                var response = await _httpClient.GetAsync($"/api/payment/verify/{orderId}");
                return response.IsSuccessStatusCode;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error verifying payment for order {OrderId}", orderId);
                return false;
            }
        }
    }
}
