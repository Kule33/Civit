using backend.DTOs;
using backend.Security;
using backend.Services.Payment.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/payments")]
    [Authorize] // Require authentication for all endpoints
    public class PaymentController : ControllerBase
    {
        private readonly ILogger<PaymentController> _logger;
        private readonly IPaymentService _paymentService;

        public PaymentController(
            ILogger<PaymentController> logger,
            IPaymentService paymentService)
        {
            _logger = logger;
            _paymentService = paymentService;
        }

        /// <summary>
        /// Initiate a card payment via PayHere payment gateway
        /// </summary>
        /// <param name="request">Payment details including amount, paper ID, currency, payment ID, and questions list</param>
        /// <returns>Payment response with transaction details and payment URL</returns>
        [HttpPost("card")]
        [AllowAnonymous]
        [RequireJwtOrS2S]
        public async Task<ActionResult<PaymentResponseDto>> InitiateCardPayment([FromBody] PaymentRequestDto request)
        {
                    Console.WriteLine("🚀 PaymentController initialized");

            try
            {
                // Get authenticated user ID from JWT token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                    ?? User.FindFirst("sub")?.Value
                    ?? User.FindFirst("user_id")?.Value;

                if (string.IsNullOrWhiteSpace(userId) &&
                    HttpContext.Items.TryGetValue(S2SConstants.IsAuthenticatedItemKey, out var s2sAuthObj) &&
                    s2sAuthObj is true)
                {
                    userId = Request.Headers["x-user-id"].ToString();
                    if (string.IsNullOrWhiteSpace(userId))
                    {
                        userId = Request.Headers["x-s2s-user-id"].ToString();
                    }
                }

                if (string.IsNullOrEmpty(userId))
                {
                    Console.WriteLine("🚀 User ID is missing in payment request");
                    _logger.LogWarning("Card payment attempt without valid user ID");
                    return Unauthorized(new PaymentResponseDto
                    {
                        Success = false,
                        Message = "User authentication failed"
                    });
                }

                // Validate request
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid card payment request from user {UserId}", userId);
                    return BadRequest(new PaymentResponseDto
                    {
                        Success = false,
                        Message = "Invalid payment request data"
                    });
                }

                _logger.LogInformation(
                    "Processing card payment: User={UserId}, Amount={Amount}, Currency={Currency}, PaperId={PaperId}, PaymentId={PaymentId}",
                    userId, request.Amount, request.Currency, request.PaperId, request.PaymentId);

                // Use payment service to initiate payment
                var result = await _paymentService.InitiateCardPaymentAsync(request, userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing card payment for user {UserId}", 
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                
                return StatusCode(500, new PaymentResponseDto
                {
                    Success = false,
                    Message = "An error occurred while processing your payment. Please try again."
                });
            }
        }

        /// <summary>
        /// Process a wallet payment using user's wallet balance
        /// </summary>
        /// <param name="request">Payment details including amount, paper ID, currency, payment ID, and questions list</param>
        /// <returns>Payment response with transaction details</returns>
        [HttpPost("wallet")]
        [AllowAnonymous]
        [RequireJwtOrS2S]
        public async Task<ActionResult<PaymentResponseDto>> InitiateWalletPayment([FromBody] PaymentRequestDto request)
        {
            try
            {
                // Get authenticated user ID from JWT token
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                    ?? User.FindFirst("sub")?.Value
                    ?? User.FindFirst("user_id")?.Value;

                if (string.IsNullOrWhiteSpace(userId) &&
                    HttpContext.Items.TryGetValue(S2SConstants.IsAuthenticatedItemKey, out var s2sAuthObj) &&
                    s2sAuthObj is true)
                {
                    userId = Request.Headers["x-user-id"].ToString();
                    if (string.IsNullOrWhiteSpace(userId))
                    {
                        userId = Request.Headers["x-s2s-user-id"].ToString();
                    }
                }

                if (string.IsNullOrEmpty(userId))
                {
                    _logger.LogWarning("Wallet payment attempt without valid user ID");
                    return Unauthorized(new PaymentResponseDto
                    {
                        Success = false,
                        Message = "User authentication failed"
                    });
                }

                // Validate request
                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid wallet payment request from user {UserId}", userId);
                    return BadRequest(new PaymentResponseDto
                    {
                        Success = false,
                        Message = "Invalid payment request data"
                    });
                }

                _logger.LogInformation(
                    "Processing wallet payment: User={UserId}, Amount={Amount}, Currency={Currency}, PaperId={PaperId}, PaymentId={PaymentId}",
                    userId, request.Amount, request.Currency, request.PaperId, request.PaymentId);

                // Use payment service to process wallet payment
                var result = await _paymentService.ProcessWalletPaymentAsync(request, userId);
                return Ok(result);
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Wallet payment failed for user {UserId}: {Message}", 
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value, ex.Message);
                
                return BadRequest(new PaymentResponseDto
                {
                    Success = false,
                    Message = ex.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing wallet payment for user {UserId}", 
                    User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                
                return StatusCode(500, new PaymentResponseDto
                {
                    Success = false,
                    Message = "An error occurred while processing your payment. Please try again."
                });
            }
        }

        /// <summary>
        /// PayHere payment callback endpoint (webhook)
        /// </summary>
        [HttpPost("payhere-callback")]
        [AllowAnonymous] // PayHere needs to access this without authentication
        public async Task<IActionResult> PayHereCallback([FromForm] IFormCollection form)
        {
            try
            {
                _logger.LogInformation("Received PayHere callback");

                // Convert form to dictionary
                var callbackData = form.ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value.ToString()
                );

                // Verify callback signature
                var isValid = await _paymentService.VerifyPayHereCallbackAsync(callbackData);

                if (!isValid)
                {
                    _logger.LogWarning("Invalid PayHere callback signature");
                    return BadRequest("Invalid signature");
                }

                var orderId = callbackData.GetValueOrDefault("order_id", "");
                var statusCode = callbackData.GetValueOrDefault("status_code", "");

                _logger.LogInformation(
                    "PayHere callback verified: OrderId={OrderId}, Status={Status}",
                    orderId, statusCode);

                // Status codes: 2 = Success, 0 = Pending, -1 = Canceled, -2 = Failed, -3 = Chargedback
                if (statusCode == "2")
                {
                    // Payment successful
                    _logger.LogInformation("Payment successful for order {OrderId}", orderId);
                    // TODO: Update database, create order, send notifications
                }
                else
                {
                    _logger.LogWarning("Payment not successful for order {OrderId}, status: {Status}", orderId, statusCode);
                }

                return Ok();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing PayHere callback");
                return StatusCode(500);
            }
        }
    }
}
