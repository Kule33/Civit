using System.Text.Json;
using Backend.Config;
using Backend.Services.Communication.Core.Abstractions;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client.Events;
using Microsoft.Extensions.DependencyInjection;

namespace Backend.Services.Communication.Features.NotifyPaymentStatus;

/// <summary>
/// RabbitMQ adapter for receiving payment status updates.
/// Listens to 'payment.notifications' queue.
/// </summary>
public class RabbitStatusConsumer : RabbitMqBaseConsumer
{
    private readonly IServiceScopeFactory _scopeFactory;

    protected override string QueueName => "payment.notifications";
    protected override ushort PrefetchCount => 5; 
    protected override bool Durable => true;

    public RabbitStatusConsumer(
        IOptions<RabbitMqSettings> options, 
        ILogger<RabbitStatusConsumer> logger,
        IServiceScopeFactory scopeFactory) 
        : base(options, logger)
    {
        _scopeFactory = scopeFactory;
    }

    protected override async Task HandleMessageAsync(string messageBody, BasicDeliverEventArgs ea)
    {
        Console.WriteLine($"📥 [RabbitMQ] Received Payload: {messageBody}");

        using var scope = _scopeFactory.CreateScope();
        var handler = scope.ServiceProvider.GetRequiredService<PaymentStatusHandler>();

        try
        {
            Console.WriteLine("📦 [RabbitMQ] Processing payment status update..."+messageBody);
            var update = JsonSerializer.Deserialize<PaymentStatusUpdateDto>(messageBody, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (update == null || string.IsNullOrEmpty(update.OrderId))
            {
                _logger.LogWarning("Received invalid payment update message: {Message}", messageBody);
                return; 
            }
            Console.WriteLine("sssss"+ JsonSerializer.Serialize(update));

            // Direct mapping used since payload contains "Status"
            var statusToUse = update.Status;
            
            await handler.HandleAsync(update.OrderId, statusToUse ?? "unknown");
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize payment update message. Message dropped.");
        }
    }
}
