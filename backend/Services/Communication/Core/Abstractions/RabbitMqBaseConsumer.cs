using System.Text;
using System.Text.Json;
using Backend.Config;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace Backend.Services.Communication.Core.Abstractions;

/// <summary>
/// Base consumer that implements the "Work Queue" pattern with manual acknowledgments
/// and QoS control for reliability.
/// </summary>
public abstract class RabbitMqBaseConsumer : BackgroundService
{
    private readonly RabbitMqSettings _settings;
    protected readonly ILogger _logger;
    private IConnection _connection;
    private IChannel _channel;
    
    // Configurable settings
    protected abstract string QueueName { get; }
    protected virtual ushort PrefetchCount => 1; // Fair dispatch by default
    protected virtual bool Durable => true; // Essential for Work Queues

    protected RabbitMqBaseConsumer(IOptions<RabbitMqSettings> options, ILogger logger)
    {
        _settings = options.Value;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await InitializeAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                // Keep the service alive
                await Task.Delay(1000, stoppingToken);
            }
        }
        catch (OperationCanceledException)
        {
            // Graceful shutdown
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Fatal error in RabbitMQ Consumer {QueueName}", QueueName);
        }
    }

    private async Task InitializeAsync(CancellationToken cancellationToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = _settings.HostName,
            Port = _settings.Port,
            UserName = _settings.UserName,
            Password = _settings.Password,
            VirtualHost = _settings.VirtualHost,
            // DispatchConsumersAsync = true, // Not needed in v7.0+, it's the default/only mode for AsyncEventingBasicConsumer
            AutomaticRecoveryEnabled = true
        };

        _connection = await factory.CreateConnectionAsync();
        _channel = await _connection.CreateChannelAsync();

        // 1. Declare Queue (Idempotent)
        await _channel.QueueDeclareAsync(
            queue: QueueName,
            durable: Durable,
            exclusive: false,
            autoDelete: false,
            arguments: null
        );

        // 2. Apply QoS (Fair Dispatch)
        // prefetchCount = 1: Don't give me more than 1 message at a time until I ack the previous one.
        await _channel.BasicQosAsync(prefetchSize: 0, prefetchCount: PrefetchCount, global: false);

        _logger.LogInformation("Consumer initialized for queue: {QueueName}", QueueName);

        // 3. Set up consumer
        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += async (model, ea) =>
        {
            try
            {
                var body = ea.Body.ToArray();
                var message = Encoding.UTF8.GetString(body);
                
                _logger.LogDebug("Received message on {QueueName}: {Message}", QueueName, message);

                // Process the message
                await HandleMessageAsync(message, ea);

                // Manual Ack: Only if processing succeeded
                await _channel.BasicAckAsync(deliveryTag: ea.DeliveryTag, multiple: false);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing message on {QueueName}", QueueName);
                
                // Negative Ack: Requeue the message so another worker can try (or this one later)
                // requeue: true
                await _channel.BasicNackAsync(deliveryTag: ea.DeliveryTag, multiple: false, requeue: true);
            }
        };

        // 4. Start Consuming
        // autoAck: false (Manual Mode)
        await _channel.BasicConsumeAsync(queue: QueueName, autoAck: false, consumer: consumer);
    }

    /// <summary>
    /// Implement this method to handle the business logic.
    /// If you throw an exception, the message will be NACKed and requeued.
    /// </summary>
    protected abstract Task HandleMessageAsync(string messageBody, BasicDeliverEventArgs ea);

    public override async void Dispose()
    {
        if (_channel != null) await _channel.CloseAsync();
        if (_connection != null) await _connection.CloseAsync();
        base.Dispose();
    }
}
