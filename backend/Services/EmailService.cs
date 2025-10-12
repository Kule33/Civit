using backend.Config;
using backend.Models;
using Microsoft.Extensions.Options;
using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Mail;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface IEmailService
    {
        Task<bool> SendTypesetRequestEmailAsync(TypesetRequest request, UserProfile user, byte[] pdfAttachment);
        Task<bool> SendTypesetConfirmationEmailAsync(TypesetRequest request, UserProfile user);
        Task<bool> SendTypesetStatusUpdateEmailAsync(TypesetRequest request, UserProfile user);
    }

    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;
        private readonly string _adminEmail;
        private readonly string _smtpHost;
        private readonly int _smtpPort;
        private readonly string _smtpUsername;
        private readonly string _smtpPassword;
        private readonly string _senderEmail;
        private readonly string _senderName;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
            
            // Read from environment variables first, then fall back to appsettings
            _adminEmail = Environment.GetEnvironmentVariable("ADMIN_EMAIL") 
                ?? _configuration["EmailSettings:AdminEmail"] 
                ?? "papermaster.jv@gmail.com";
            
            _smtpHost = Environment.GetEnvironmentVariable("SMTP_HOST") 
                ?? _configuration["EmailSettings:SmtpHost"] 
                ?? "smtp.gmail.com";
            
            _smtpPort = int.Parse(Environment.GetEnvironmentVariable("SMTP_PORT") 
                ?? _configuration["EmailSettings:SmtpPort"] 
                ?? "587");
            
            _smtpUsername = Environment.GetEnvironmentVariable("SMTP_USERNAME") 
                ?? _configuration["EmailSettings:SmtpUsername"] 
                ?? "";
            
            _smtpPassword = Environment.GetEnvironmentVariable("SMTP_PASSWORD") 
                ?? _configuration["EmailSettings:SmtpPassword"] 
                ?? "";
            
            _senderEmail = Environment.GetEnvironmentVariable("SENDER_EMAIL") 
                ?? _configuration["EmailSettings:SenderEmail"] 
                ?? _smtpUsername;
            
            _senderName = Environment.GetEnvironmentVariable("SENDER_NAME") 
                ?? _configuration["EmailSettings:SenderName"] 
                ?? "CVIT PAPER MAKER System";
            
            _logger.LogInformation($"📧 Email Service Configured - Admin: {_adminEmail}, Sender: {_senderEmail}");
        }

        public async Task<bool> SendTypesetRequestEmailAsync(TypesetRequest request, UserProfile user, byte[] pdfAttachment)
        {
            try
            {
                // Parse metadata
                var metadata = ParseMetadata(request.PaperMetadata);

                // Build email subject
                var subject = $"New Typeset Request from {user.FullName} - {metadata.GetValueOrDefault("subject", "Unknown")} {metadata.GetValueOrDefault("examType", "")}";

                // Build email body
                var body = BuildTypesetRequestEmailBody(request, user, metadata);

                // Send email with attachment
                return await SendEmailWithAttachmentAsync(_adminEmail, subject, body, pdfAttachment, "generated_paper.pdf");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending typeset request email for request #{request.Id}");
                return false;
            }
        }

        public async Task<bool> SendTypesetConfirmationEmailAsync(TypesetRequest request, UserProfile user)
        {
            try
            {
                var metadata = ParseMetadata(request.PaperMetadata);
                var subject = $"Typeset Request Received - Request #{request.Id}";
                var body = BuildTypesetConfirmationEmailBody(request, user, metadata);

                return await SendEmailAsync(user.Email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending confirmation email for request #{request.Id}");
                return false;
            }
        }

        public async Task<bool> SendTypesetStatusUpdateEmailAsync(TypesetRequest request, UserProfile user)
        {
            try
            {
                var subject = $"Typeset Request #{request.Id} - Status Update";
                var body = BuildTypesetStatusUpdateEmailBody(request, user);

                return await SendEmailAsync(user.Email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error sending status update email for request #{request.Id}");
                return false;
            }
        }

        private string BuildTypesetRequestEmailBody(TypesetRequest request, UserProfile user, Dictionary<string, string> metadata)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"<html><body style='font-family: Arial, sans-serif;'>");
            sb.AppendLine($"<h2 style='color: #2563eb;'>New Typeset Request #{request.Id}</h2>");
            sb.AppendLine($"<p>Received on: {request.RequestedAt:MMMM dd, yyyy HH:mm} UTC</p>");
            sb.AppendLine($"<hr/>");

            sb.AppendLine($"<h3>User Details:</h3>");
            sb.AppendLine($"<ul>");
            sb.AppendLine($"<li><strong>Name:</strong> {user.FullName}</li>");
            sb.AppendLine($"<li><strong>Email:</strong> {user.Email}</li>");
            sb.AppendLine($"<li><strong>District:</strong> {user.District}</li>");
            sb.AppendLine($"<li><strong>Role:</strong> {user.Role}</li>");
            sb.AppendLine($"</ul>");

            sb.AppendLine($"<h3>Paper Details:</h3>");
            sb.AppendLine($"<ul>");
            sb.AppendLine($"<li><strong>Subject:</strong> {metadata.GetValueOrDefault("subject", "N/A")}</li>");
            sb.AppendLine($"<li><strong>Exam Type:</strong> {metadata.GetValueOrDefault("examType", "N/A")}</li>");
            sb.AppendLine($"<li><strong>Stream:</strong> {metadata.GetValueOrDefault("stream", "N/A")}</li>");
            sb.AppendLine($"<li><strong>Question Count:</strong> {metadata.GetValueOrDefault("questionCount", "N/A")}</li>");
            sb.AppendLine($"<li><strong>Total Marks:</strong> {metadata.GetValueOrDefault("totalMarks", "N/A")}</li>");
            sb.AppendLine($"</ul>");

            if (!string.IsNullOrWhiteSpace(request.UserMessage))
            {
                sb.AppendLine($"<h3>User Message:</h3>");
                sb.AppendLine($"<div style='background-color: #f3f4f6; padding: 15px; border-left: 4px solid #2563eb;'>");
                sb.AppendLine($"<p style='margin: 0;'>{System.Net.WebUtility.HtmlEncode(request.UserMessage)}</p>");
                sb.AppendLine($"</div>");
            }

            sb.AppendLine($"<hr/>");
            sb.AppendLine($"<p>The generated paper PDF is attached to this email.</p>");
            sb.AppendLine($"<p style='color: #6b7280; font-size: 12px;'>This is an automated email from CVIT PAPER MAKER System</p>");
            sb.AppendLine($"</body></html>");

            return sb.ToString();
        }

        private string BuildTypesetConfirmationEmailBody(TypesetRequest request, UserProfile user, Dictionary<string, string> metadata)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"<html><body style='font-family: Arial, sans-serif;'>");
            sb.AppendLine($"<h2 style='color: #2563eb;'>Typeset Request Confirmed</h2>");
            sb.AppendLine($"<p>Hi {user.FullName},</p>");
            sb.AppendLine($"<p>We've successfully received your typeset request.</p>");

            sb.AppendLine($"<div style='background-color: #f3f4f6; padding: 15px; margin: 20px 0;'>");
            sb.AppendLine($"<h3 style='margin-top: 0;'>Request Details:</h3>");
            sb.AppendLine($"<ul style='margin-bottom: 0;'>");
            sb.AppendLine($"<li><strong>Request ID:</strong> #{request.Id}</li>");
            sb.AppendLine($"<li><strong>Submitted:</strong> {request.RequestedAt:MMMM dd, yyyy HH:mm} UTC</li>");
            sb.AppendLine($"<li><strong>Subject:</strong> {metadata.GetValueOrDefault("subject", "N/A")}</li>");
            sb.AppendLine($"<li><strong>Question Count:</strong> {metadata.GetValueOrDefault("questionCount", "N/A")}</li>");
            sb.AppendLine($"</ul>");
            sb.AppendLine($"</div>");

            sb.AppendLine($"<h3>What's Next?</h3>");
            sb.AppendLine($"<p>Our team will review your paper and respond within 2-3 business days. You can track the status in your profile.</p>");

            sb.AppendLine($"<p>Thank you for using CVIT PAPER MAKER!</p>");
            sb.AppendLine($"<hr/>");
            sb.AppendLine($"<p style='color: #6b7280; font-size: 12px;'>This is an automated email from CVIT PAPER MAKER System</p>");
            sb.AppendLine($"</body></html>");

            return sb.ToString();
        }

        private string BuildTypesetStatusUpdateEmailBody(TypesetRequest request, UserProfile user)
        {
            var sb = new StringBuilder();
            sb.AppendLine($"<html><body style='font-family: Arial, sans-serif;'>");
            sb.AppendLine($"<h2 style='color: #2563eb;'>Typeset Request Status Update</h2>");
            sb.AppendLine($"<p>Hi {user.FullName},</p>");
            sb.AppendLine($"<p>Your typeset request has been updated:</p>");

            sb.AppendLine($"<div style='background-color: #f3f4f6; padding: 15px; margin: 20px 0;'>");
            sb.AppendLine($"<ul style='margin: 0;'>");
            sb.AppendLine($"<li><strong>Request ID:</strong> #{request.Id}</li>");
            sb.AppendLine($"<li><strong>New Status:</strong> <span style='color: {GetStatusColor(request.Status)};'>{request.Status}</span></li>");
            if (request.CompletedAt.HasValue)
            {
                sb.AppendLine($"<li><strong>Completed:</strong> {request.CompletedAt.Value:MMMM dd, yyyy HH:mm} UTC</li>");
            }
            sb.AppendLine($"</ul>");
            sb.AppendLine($"</div>");

            if (!string.IsNullOrWhiteSpace(request.AdminNotes))
            {
                sb.AppendLine($"<h3>Admin Notes:</h3>");
                sb.AppendLine($"<div style='background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b;'>");
                sb.AppendLine($"<p style='margin: 0;'>{System.Net.WebUtility.HtmlEncode(request.AdminNotes)}</p>");
                sb.AppendLine($"</div>");
            }

            if (request.Status == TypesetRequestStatus.Completed)
            {
                sb.AppendLine($"<p style='color: #16a34a; font-weight: bold;'>Your paper has been professionally typeset! Check your profile to view it.</p>");
            }
            else if (request.Status == TypesetRequestStatus.Rejected)
            {
                sb.AppendLine($"<p style='color: #dc2626;'>Unfortunately, your request could not be processed at this time. Please review the admin notes above.</p>");
            }

            sb.AppendLine($"<p>Thank you for using CVIT PAPER MAKER!</p>");
            sb.AppendLine($"<hr/>");
            sb.AppendLine($"<p style='color: #6b7280; font-size: 12px;'>This is an automated email from CVIT PAPER MAKER System</p>");
            sb.AppendLine($"</body></html>");

            return sb.ToString();
        }

        private async Task<bool> SendEmailAsync(string to, string subject, string htmlBody)
        {
            try
            {
                _logger.LogInformation($"Sending email to: {to}");
                _logger.LogInformation($"Subject: {subject}");
                
                // Check if SMTP is configured
                if (string.IsNullOrEmpty(_smtpPassword))
                {
                    _logger.LogWarning("SMTP password not configured. Email will not be sent. Please configure EmailSettings:SmtpPassword in appsettings.json");
                    return false;
                }

                var smtpClient = new SmtpClient(_smtpHost)
                {
                    Port = _smtpPort,
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_senderEmail, _senderName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true,
                };
                mailMessage.To.Add(to);

                await smtpClient.SendMailAsync(mailMessage);
                
                _logger.LogInformation($"✅ Email sent successfully to {to}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error sending email to {to}");
                return false;
            }
        }

        private async Task<bool> SendEmailWithAttachmentAsync(string to, string subject, string htmlBody, byte[] attachment, string attachmentName)
        {
            try
            {
                _logger.LogInformation($"Sending email with attachment to: {to}");
                _logger.LogInformation($"Subject: {subject}");
                _logger.LogInformation($"Attachment: {attachmentName} ({attachment.Length} bytes)");

                // Check if SMTP is configured
                if (string.IsNullOrEmpty(_smtpPassword))
                {
                    _logger.LogWarning("SMTP password not configured. Email will not be sent. Please configure EmailSettings:SmtpPassword in appsettings.json");
                    return false;
                }

                var smtpClient = new SmtpClient(_smtpHost)
                {
                    Port = _smtpPort,
                    Credentials = new NetworkCredential(_smtpUsername, _smtpPassword),
                    EnableSsl = true,
                };

                var mailMessage = new MailMessage
                {
                    From = new MailAddress(_senderEmail, _senderName),
                    Subject = subject,
                    Body = htmlBody,
                    IsBodyHtml = true,
                };
                mailMessage.To.Add(to);

                var attachmentStream = new MemoryStream(attachment);
                mailMessage.Attachments.Add(new Attachment(attachmentStream, attachmentName, "application/pdf"));

                await smtpClient.SendMailAsync(mailMessage);
                
                _logger.LogInformation($"✅ Email sent successfully to {to}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"❌ Error sending email with attachment to {to}");
                return false;
            }
        }

        private Dictionary<string, string> ParseMetadata(string? metadataJson)
        {
            if (string.IsNullOrWhiteSpace(metadataJson))
                return new Dictionary<string, string>();

            try
            {
                var jsonDoc = JsonDocument.Parse(metadataJson);
                var result = new Dictionary<string, string>();

                foreach (var property in jsonDoc.RootElement.EnumerateObject())
                {
                    result[property.Name] = property.Value.ToString();
                }

                return result;
            }
            catch
            {
                return new Dictionary<string, string>();
            }
        }

        private string GetStatusColor(string status)
        {
            return status switch
            {
                TypesetRequestStatus.Pending => "#f59e0b",
                TypesetRequestStatus.InProgress => "#3b82f6",
                TypesetRequestStatus.Completed => "#16a34a",
                TypesetRequestStatus.Rejected => "#dc2626",
                _ => "#6b7280"
            };
        }
    }
}
