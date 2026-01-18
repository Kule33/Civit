using backend.Security; // For [RequireS2S]
using Backend.Services.Communication.Core.Producers;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Services.Communication.Features.NotifyPaymentStatus;

[ApiController]
[Route("api/webhooks/notifications")]
[RequireS2S] // Enforces Server-to-Server security
public class HttpStatusController : ControllerBase
{
    private readonly PaymentStatusHandler _handler;
    private readonly RabbitMqProducer _producer; // Injected Producer
    private readonly ILogger<HttpStatusController> _logger;

    public HttpStatusController(
        PaymentStatusHandler handler, 
        RabbitMqProducer producer,
        ILogger<HttpStatusController> logger)
    {
        _handler = handler;
        _producer = producer;
        _logger = logger;
    }

    /// <summary>
    /// TEST ENDPOINT: Publishes a status update to RabbitMQ.
    /// This demonstrates the Publisher -> Queue -> Consumer flow.
    /// </summary>
    [HttpPost("test-queue")]
    public async Task<IActionResult> TestQueue([FromBody] PaymentStatusUpdateDto request)
    {
         if (string.IsNullOrEmpty(request.OrderId)) 
             return BadRequest("OrderId is required");
             
         // Publish to "payment.notifications"
         await _producer.PublishAsync("payment.notifications", request);
         
         return Ok(new { message = "Message published to RabbitMQ! Check your console logs." });
    }

    [HttpPost("status")]
    public async Task<IActionResult> UpdateStatus([FromBody] PaymentStatusUpdateDto request)
    {
        Console.WriteLine("🚀 [HttpStatusController] Received Webhook Payload: ");
        if (string.IsNullOrEmpty(request.OrderId) || string.IsNullOrEmpty(request.Status))
        {
            return BadRequest("OrderId and Status are required.");
        }

        try
        {
            await _handler.HandleAsync(request.OrderId, request.Status);
            return Ok(new { message = "Status updated successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing payment webhook for Order {OrderId}", request.OrderId);
            return StatusCode(500, "Internal Server Error");
        }
    }
}

public class PaymentStatusUpdateDto
{
    public string OrderId { get; set; }
    public string Status { get; set; }
}
