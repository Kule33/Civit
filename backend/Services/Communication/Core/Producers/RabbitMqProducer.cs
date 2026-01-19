using System.Text;
using System.Text.Json;
using Backend.Config;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace Backend.Services.Communication.Core.Producers;

public class RabbitMqProducer
{
    private readonly RabbitMqSettings _settings;

    public RabbitMqProducer(IOptions<RabbitMqSettings> options)
    {
        _settings = options.Value;
    }

    public async Task PublishAsync<T>(string queueName, T message)
    {
        var factory = new ConnectionFactory
        {
            HostName = _settings.HostName,
            Port = _settings.Port,
            UserName = _settings.UserName,
            Password = _settings.Password,
            VirtualHost = _settings.VirtualHost
        };

        using var connection = await factory.CreateConnectionAsync();
        using var channel = await connection.CreateChannelAsync();

        await channel.QueueDeclareAsync(
            queue: queueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null
        );

        var json = JsonSerializer.Serialize(message);
        var body = Encoding.UTF8.GetBytes(json);

        var properties = new BasicProperties
        {
            Persistent = true // Ensure message survives restart
        };

        await channel.BasicPublishAsync(
            exchange: "",
            routingKey: queueName,
            mandatory: false,
            basicProperties: properties,
            body: body
        );
    }
}
