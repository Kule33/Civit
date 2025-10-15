// backend/Controllers/MergeController.cs
using Microsoft.AspNetCore.Mvc;
using backend.DTOs;
using backend.Services;
using System.ComponentModel.DataAnnotations;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MergeController : ControllerBase
    {
        private readonly IDocumentMergeService _documentMergeService;
        private readonly ILogger<MergeController> _logger;

        public MergeController(
            IDocumentMergeService documentMergeService,
            ILogger<MergeController> logger)
        {
            _documentMergeService = documentMergeService;
            _logger = logger;
        }

        /// <summary>
        /// Merge multiple Word documents from Cloudinary URLs into a single document
        /// </summary>
        /// <param name="request">The merge request containing file URLs</param>
        /// <returns>The merged Word document file</returns>
        [HttpPost("documents")]
        [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
        public async Task<IActionResult> MergeDocuments([FromBody] MergeDocumentsDto request)
        {
            try
            {
                // Validate request
                if (request?.FileUrls == null || request.FileUrls.Count == 0)
                {
                    return BadRequest(new { message = "At least one file URL is required" });
                }

                // Validate URLs
                foreach (var url in request.FileUrls)
                {
                    if (string.IsNullOrWhiteSpace(url))
                    {
                        return BadRequest(new { message = "Invalid file URL provided" });
                    }

                    if (!Uri.TryCreate(url, UriKind.Absolute, out _))
                    {
                        return BadRequest(new { message = $"Invalid URL format: {url}" });
                    }
                }

                _logger.LogInformation("Received merge request for {Count} documents", request.FileUrls.Count);

                // Merge documents
                var mergedFileBytes = await _documentMergeService.MergeDocumentsAsync(request.FileUrls);

                // Return the merged file
                var fileName = $"merged_document_{DateTime.UtcNow:yyyyMMdd_HHmmss}.docx";
                return File(
                    mergedFileBytes,
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    fileName
                );
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Invalid operation during document merge");
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error merging documents: {Message}", ex.Message);
                _logger.LogError("Stack trace: {StackTrace}", ex.StackTrace);
                return StatusCode(500, new { 
                    message = $"An error occurred while merging documents: {ex.Message}",
                    details = ex.InnerException?.Message 
                });
            }
        }

        /// <summary>
        /// Health check endpoint for the merge service
        /// </summary>
        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { status = "healthy", service = "document-merge" });
        }
    }
}
