using backend.Data;
using backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Backend.Services.Communication.Features.NotifyPaymentStatus;

/// <summary>
/// Business logic for handling payment status updates.
/// This is shared between the HTTP Controller (Webhook) and the RabbitMQ Consumer.
/// </summary>
public class PaymentStatusHandler
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<PaymentStatusHandler> _logger;

    public PaymentStatusHandler(IServiceScopeFactory scopeFactory, ILogger<PaymentStatusHandler> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    /// <summary>
    /// Processes a payment status update.
    /// </summary>
    /// <param name="orderId">The order ID to update.</param>
    /// <param name="newStatus">The new status (e.g., "paid", "failed").</param>
    public async Task HandleAsync(string orderId, string newStatus)
    {
        // Create a new scope because this might be called from a background service (Singleton)
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        _logger.LogInformation("Processing payment update for Order {OrderId}. New Status: {Status}", orderId, newStatus);

        var order = await dbContext.Orders.FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
        {
            _logger.LogWarning("Order {OrderId} not found. Skipping update.", orderId);
            // We return successfully effectively dropping the message/request because retrying won't fix "not found"
            // unless it's a race condition. Assuming consistency here.
            return;
        }

        if (order.PaymentStatus == newStatus)
        {
            _logger.LogInformation("Order {OrderId} is already '{Status}'. No change needed.", orderId, newStatus);
            return;
        }

        order.PaymentStatus = newStatus;
        await dbContext.SaveChangesAsync();
        Console.WriteLine("Updated order status to ::"+newStatus);

        _logger.LogInformation("Successfully updated Order {OrderId} to '{Status}'.", orderId, newStatus);
    }
}
