using System;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using backend.Data;
using backend.DTOs;
using backend.Models;
using backend.Services.Payment.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using backend.Security;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/v1/notifications")]
    [RequireS2S]
    public class S2SNotificationsController : ControllerBase
    {
        private static readonly JsonSerializerOptions MetadataJsonOptions = new(JsonSerializerDefaults.Web);

        private readonly AppDbContext _db;
        private readonly ILogger<S2SNotificationsController> _logger;

        public S2SNotificationsController(AppDbContext db, ILogger<S2SNotificationsController> logger)
        {
            _db = db;
            _logger = logger;
        }
    
        // POST /api/v1/notifications/suspicious
        [HttpPost("suspicious")]
        public async Task<IActionResult> Suspicious([FromBody] SuspiciousActivityWebhookDto payload)
        {
            Console.WriteLine($"🚀 [PaperMaker] RECEIVED ALERT FOR ORDER: {payload?.OrderId}");
            if (payload == null || string.IsNullOrWhiteSpace(payload.OrderId))
            {
                return BadRequest("OrderId is required");
            }

            var paperIds = await _db.Orders
                .Where(o => o.OrderId == payload.OrderId)
                .Select(o => o.PaperId)
                .Distinct()
                .ToListAsync();

            Guid? userGuid = null;
            if (!string.IsNullOrWhiteSpace(payload.UserId) && Guid.TryParse(payload.UserId, out var parsedUserGuid))
            {
                userGuid = parsedUserGuid;
            }

            var metadataObj = new
            {
                orderId = payload.OrderId,
                transactionId = payload.TransactionId,
                amount = payload.Amount,
                currency = payload.Currency,
                userId = payload.UserId,
                userEmail = payload.UserEmail,
                fullName = payload.FullName,
                status = payload.Status,
                reason = payload.Reason,
                occurredAt = payload.OccurredAt,
                paperIds
            };

            var notification = new AdminNotification
            {
                Type = AdminNotificationType.suspicious,
                UserId = userGuid,
                Read = false,
                Metadata = JsonSerializer.SerializeToDocument(metadataObj, MetadataJsonOptions),
                Link = $"/admin/transactions/details?orderId={Uri.EscapeDataString(payload.OrderId)}"
            };

            _db.Add(notification);
            await _db.SaveChangesAsync();

            _logger.LogWarning("[S2S] Suspicious payment alert stored for OrderId={OrderId}", payload.OrderId);

            return Ok(new { success = true, id = notification.Id });
        }
    }
}
