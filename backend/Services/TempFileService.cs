using backend.Config;
using Microsoft.Extensions.Options;
using System;
using System.IO;
using System.Threading.Tasks;

namespace backend.Services
{
    public interface ITempFileService
    {
        Task<string> SaveTempPdfAsync(byte[] pdfData, string userId);
        Task<byte[]?> GetTempPdfAsync(string filePath);
        Task<bool> DeleteTempPdfAsync(string filePath);
        Task<bool> TempPdfExistsAsync(string filePath);
    }

    public class TempFileService : ITempFileService
    {
        private readonly TempFilesSettings _settings;
        private readonly ILogger<TempFileService> _logger;

        public TempFileService(IOptions<TempFilesSettings> settings, ILogger<TempFileService> logger)
        {
            _settings = settings.Value;
            _logger = logger;

            // Ensure temp directory exists
            if (!Directory.Exists(_settings.Path))
            {
                Directory.CreateDirectory(_settings.Path);
                _logger.LogInformation($"Created temp files directory: {_settings.Path}");
            }
        }

        public async Task<string> SaveTempPdfAsync(byte[] pdfData, string userId)
        {
            try
            {
                // Validate file size
                var fileSizeMB = pdfData.Length / (1024.0 * 1024.0);
                if (fileSizeMB > _settings.MaxFileSizeMB)
                {
                    throw new InvalidOperationException($"PDF file size ({fileSizeMB:F2} MB) exceeds maximum allowed size ({_settings.MaxFileSizeMB} MB)");
                }

                // Generate unique filename
                var timestamp = DateTime.UtcNow.ToString("yyyyMMdd_HHmmss");
                var randomGuid = Guid.NewGuid().ToString("N").Substring(0, 8);
                var fileName = $"{userId}_{timestamp}_{randomGuid}.pdf";
                var filePath = Path.Combine(_settings.Path, fileName);

                // Save file
                await File.WriteAllBytesAsync(filePath, pdfData);
                _logger.LogInformation($"Saved temp PDF: {filePath} ({fileSizeMB:F2} MB)");

                return filePath;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error saving temp PDF for user {userId}");
                throw;
            }
        }

        public async Task<byte[]?> GetTempPdfAsync(string filePath)
        {
            try
            {
                if (!File.Exists(filePath))
                {
                    _logger.LogWarning($"Temp PDF not found: {filePath}");
                    return null;
                }

                var data = await File.ReadAllBytesAsync(filePath);
                _logger.LogInformation($"Retrieved temp PDF: {filePath}");
                return data;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error reading temp PDF: {filePath}");
                throw;
            }
        }

        public async Task<bool> DeleteTempPdfAsync(string filePath)
        {
            try
            {
                if (!File.Exists(filePath))
                {
                    _logger.LogWarning($"Cannot delete - temp PDF not found: {filePath}");
                    return false;
                }

                await Task.Run(() => File.Delete(filePath));
                _logger.LogInformation($"Deleted temp PDF: {filePath}");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting temp PDF: {filePath}");
                return false;
            }
        }

        public Task<bool> TempPdfExistsAsync(string filePath)
        {
            try
            {
                var exists = File.Exists(filePath);
                return Task.FromResult(exists);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error checking temp PDF existence: {filePath}");
                return Task.FromResult(false);
            }
        }
    }
}
