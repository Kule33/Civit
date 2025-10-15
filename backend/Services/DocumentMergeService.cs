// backend/Services/DocumentMergeService.cs
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using Xceed.Words.NET;
using Microsoft.Extensions.Logging;
using backend.Config;
using Microsoft.Extensions.Options;

namespace backend.Services
{
    public interface IDocumentMergeService
    {
        Task<byte[]> MergeDocumentsAsync(List<string> fileUrls);
    }

    public class DocumentMergeService : IDocumentMergeService
    {
        private readonly ILogger<DocumentMergeService> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _tempFilesPath;

        public DocumentMergeService(
            ILogger<DocumentMergeService> logger,
            IHttpClientFactory httpClientFactory,
            IOptions<TempFilesSettings> tempFilesSettings)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            
            // Use a safe default path if not configured or if configured path doesn't exist
            var configuredPath = tempFilesSettings.Value.Path;
            if (string.IsNullOrWhiteSpace(configuredPath) || !Directory.Exists(Path.GetDirectoryName(configuredPath)))
            {
                _tempFilesPath = Path.Combine(Path.GetTempPath(), "civit_merges");
                _logger.LogWarning("TempFilesSettings.Path not configured or invalid. Using default: {Path}", _tempFilesPath);
            }
            else
            {
                _tempFilesPath = configuredPath;
            }

            // Ensure temp directory exists
            try
            {
                if (!Directory.Exists(_tempFilesPath))
                {
                    Directory.CreateDirectory(_tempFilesPath);
                    _logger.LogInformation("Created temp directory: {Path}", _tempFilesPath);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create temp directory: {Path}. Falling back to system temp.", _tempFilesPath);
                _tempFilesPath = Path.Combine(Path.GetTempPath(), "civit_merges");
                Directory.CreateDirectory(_tempFilesPath);
            }
        }

        public async Task<byte[]> MergeDocumentsAsync(List<string> fileUrls)
        {
            var tempFiles = new List<string>();
            string? outputPath = null;

            try
            {
                _logger.LogInformation("Starting document merge process for {Count} files", fileUrls.Count);

                // Step 1: Download all files to temp directory
                var downloadedFiles = await DownloadFilesAsync(fileUrls);
                tempFiles.AddRange(downloadedFiles);

                if (downloadedFiles.Count == 0)
                {
                    throw new InvalidOperationException("No files were successfully downloaded");
                }

                // Step 2: Merge documents
                outputPath = Path.Combine(_tempFilesPath, $"merged_{Guid.NewGuid()}.docx");
                MergeWordDocuments(downloadedFiles, outputPath);

                // Step 3: Read merged file into memory
                byte[] mergedFileBytes = await File.ReadAllBytesAsync(outputPath);

                _logger.LogInformation("Successfully merged {Count} documents into file of size {Size} bytes",
                    downloadedFiles.Count, mergedFileBytes.Length);

                return mergedFileBytes;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during document merge process");
                throw;
            }
            finally
            {
                // Step 4: Cleanup all temporary files
                CleanupTempFiles(tempFiles, outputPath);
            }
        }

        private async Task<List<string>> DownloadFilesAsync(List<string> fileUrls)
        {
            var downloadedFiles = new List<string>();
            var httpClient = _httpClientFactory.CreateClient();

            for (int i = 0; i < fileUrls.Count; i++)
            {
                var url = fileUrls[i];
                try
                {
                    _logger.LogInformation("Downloading file {Index}/{Total} from: {Url}", i + 1, fileUrls.Count, url);

                    var response = await httpClient.GetAsync(url);
                    response.EnsureSuccessStatusCode();

                    var contentType = response.Content.Headers.ContentType?.MediaType;
                    _logger.LogInformation("Content-Type: {ContentType}", contentType);

                    var tempFilePath = Path.Combine(_tempFilesPath, $"temp_{Guid.NewGuid()}.docx");
                    var fileBytes = await response.Content.ReadAsByteArrayAsync();
                    
                    _logger.LogInformation("Downloaded {Size} bytes", fileBytes.Length);
                    
                    // Validate that it's actually a Word document by checking the file signature
                    if (!IsValidWordDocument(fileBytes))
                    {
                        _logger.LogWarning("File {Index} does not appear to be a valid Word document (URL: {Url})", 
                            i + 1, url);
                        _logger.LogWarning("File starts with: {Header}", 
                            BitConverter.ToString(fileBytes.Take(10).ToArray()));
                        throw new InvalidOperationException(
                            $"File {i + 1} is not a valid Word document. It may be a PDF, image, or corrupted file.");
                    }

                    await File.WriteAllBytesAsync(tempFilePath, fileBytes);
                    downloadedFiles.Add(tempFilePath);
                    _logger.LogInformation("Successfully downloaded and validated file {Index}/{Total}", i + 1, fileUrls.Count);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to download file from {Url}", url);
                    throw new InvalidOperationException($"Failed to download file {i + 1}: {ex.Message}", ex);
                }
            }

            return downloadedFiles;
        }

        private bool IsValidWordDocument(byte[] fileBytes)
        {
            if (fileBytes == null || fileBytes.Length < 4)
                return false;

            // Check for ZIP signature (Word documents are ZIP files)
            // PK signature: 50 4B 03 04 or 50 4B 05 06 or 50 4B 07 08
            if (fileBytes[0] == 0x50 && fileBytes[1] == 0x4B && 
                (fileBytes[2] == 0x03 || fileBytes[2] == 0x05 || fileBytes[2] == 0x07))
            {
                return true;
            }

            // Check for old Word format (DOC)
            // D0 CF 11 E0 A1 B1 1A E1
            if (fileBytes.Length >= 8 &&
                fileBytes[0] == 0xD0 && fileBytes[1] == 0xCF &&
                fileBytes[2] == 0x11 && fileBytes[3] == 0xE0)
            {
                return true;
            }

            return false;
        }

        private void MergeWordDocuments(List<string> inputFiles, string outputPath)
        {
            if (inputFiles.Count == 0)
            {
                throw new InvalidOperationException("No input files to merge");
            }

            // If only one file, just copy it
            if (inputFiles.Count == 1)
            {
                _logger.LogInformation("Only one file to merge, copying directly");
                File.Copy(inputFiles[0], outputPath, true);
                return;
            }

            _logger.LogInformation("Merging {Count} Word documents using DocX", inputFiles.Count);

            try
            {
                // Load the first document as the base
                using (var mainDoc = DocX.Load(inputFiles[0]))
                {
                    _logger.LogInformation("Loaded base document: {Path}", inputFiles[0]);

                    // Merge each subsequent document
                    for (int i = 1; i < inputFiles.Count; i++)
                    {
                        try
                        {
                            _logger.LogInformation("Processing document {Index}/{Total}: {Path}", 
                                i + 1, inputFiles.Count, inputFiles[i]);

                            // Add a page break before merging the next document
                            var pageBreakParagraph = mainDoc.InsertParagraph();
                            pageBreakParagraph.InsertPageBreakAfterSelf();

                            // Load the document to merge
                            using (var docToMerge = DocX.Load(inputFiles[i]))
                            {
                                _logger.LogInformation("Loaded document to merge, inserting content...");
                                
                                // Insert all content from the document
                                mainDoc.InsertDocument(docToMerge, false);
                                
                                _logger.LogInformation("Successfully merged document {Index}/{Total}", 
                                    i + 1, inputFiles.Count);
                            }
                        }
                        catch (Exception ex)
                        {
                            _logger.LogError(ex, "Error merging document {Index}/{Total} ({Path}): {Message}", 
                                i + 1, inputFiles.Count, inputFiles[i], ex.Message);
                            
                            // Continue with other documents instead of failing completely
                            throw new InvalidOperationException(
                                $"Failed to merge document {i + 1}/{inputFiles.Count}: {ex.Message}", ex);
                        }
                    }

                    // Save the merged document
                    _logger.LogInformation("Saving merged document to: {Path}", outputPath);
                    mainDoc.SaveAs(outputPath);
                    _logger.LogInformation("Successfully saved merged document");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error during document merge: {Message}", ex.Message);
                throw;
            }
        }

        private void CleanupTempFiles(List<string> tempFiles, string? outputPath)
        {
            // Delete downloaded temp files
            foreach (var file in tempFiles)
            {
                try
                {
                    if (File.Exists(file))
                    {
                        File.Delete(file);
                        _logger.LogDebug("Deleted temp file: {File}", file);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete temp file: {File}", file);
                }
            }

            // Delete output file
            if (outputPath != null)
            {
                try
                {
                    if (File.Exists(outputPath))
                    {
                        File.Delete(outputPath);
                        _logger.LogDebug("Deleted output file: {File}", outputPath);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Failed to delete output file: {File}", outputPath);
                }
            }

            // Clean up old temp files (older than 1 hour)
            CleanupOldTempFiles();
        }

        private void CleanupOldTempFiles()
        {
            try
            {
                if (!Directory.Exists(_tempFilesPath))
                    return;

                var cutoffTime = DateTime.UtcNow.AddHours(-1);
                var oldFiles = Directory.GetFiles(_tempFilesPath)
                    .Where(f => File.GetCreationTimeUtc(f) < cutoffTime)
                    .ToList();

                foreach (var file in oldFiles)
                {
                    try
                    {
                        File.Delete(file);
                        _logger.LogDebug("Cleaned up old temp file: {File}", file);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to delete old temp file: {File}", file);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error during cleanup of old temp files");
            }
        }
    }
}
