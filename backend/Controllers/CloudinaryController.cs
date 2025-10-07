using backend.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Cors;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using backend.Config;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [EnableCors("AllowFrontend")]
    public class CloudinaryController : ControllerBase
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryController(IOptions<CloudinarySettings> cloudinaryConfig)
        {
            var account = new Account(
                cloudinaryConfig.Value.CloudName,
                cloudinaryConfig.Value.ApiKey,
                cloudinaryConfig.Value.ApiSecret
            );
            _cloudinary = new Cloudinary(account);
        }

        [HttpPost("signature")]
        public IActionResult GenerateSignature([FromBody] CloudinarySignatureRequestDto request)
        {
            try
            {
                // Use direct folder if provided, otherwise generate from metadata
                var folderPath = string.IsNullOrEmpty(request.Folder) 
                    ? GenerateFolderPath(request) 
                    : request.Folder;
                
                var timestamp = ((DateTimeOffset)DateTime.UtcNow).ToUnixTimeSeconds();
                
                // Create parameters for signature generation
                var parameters = new SortedDictionary<string, object>
                {
                    { "folder", folderPath },
                    { "timestamp", timestamp }
                };

                // Add resource_type if specified (required for raw file uploads)
                if (!string.IsNullOrEmpty(request.ResourceType))
                {
                    parameters.Add("resource_type", request.ResourceType);
                }

                // Generate signature
                var signature = _cloudinary.Api.SignParameters(parameters);

                return Ok(new CloudinarySignatureResponseDto
                {
                    Signature = signature,
                    Timestamp = timestamp,
                    ApiKey = _cloudinary.Api.Account.ApiKey,
                    CloudName = _cloudinary.Api.Account.Cloud,
                    Folder = folderPath
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating signature: {ex.Message}");
                return StatusCode(500, $"Error generating upload signature: {ex.Message}");
            }
        }

        private string GenerateFolderPath(CloudinarySignatureRequestDto request)
        {
            var pathParts = new List<string>();

            if (!string.IsNullOrEmpty(request.Country))
                pathParts.Add(request.Country.ToLower().Replace(" ", "_"));
            
            if (!string.IsNullOrEmpty(request.ExamType))
                pathParts.Add(request.ExamType.ToLower().Replace(" ", "_"));
            
            if (!string.IsNullOrEmpty(request.Stream))
                pathParts.Add(request.Stream.ToLower().Replace(" ", "_"));
            
            if (!string.IsNullOrEmpty(request.Subject))
                pathParts.Add(request.Subject.ToLower().Replace(" ", "_"));
            
            if (!string.IsNullOrEmpty(request.PaperType))
                pathParts.Add(request.PaperType.ToLower().Replace(" ", "_"));
            
            if (!string.IsNullOrEmpty(request.PaperCategory))
                pathParts.Add(request.PaperCategory.ToLower().Replace(" ", "_"));

            return string.Join("/", pathParts);
        }
    }
}