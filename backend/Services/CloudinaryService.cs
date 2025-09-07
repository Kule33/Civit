// backend/Services/CloudinaryService.cs
using backend.Config;
using backend.Services.Interfaces;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using System.Threading.Tasks;

namespace backend.Services
{
    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;
        private readonly CloudinarySettings _cloudinarySettings;

        public CloudinaryService(IOptions<CloudinarySettings> cloudinaryConfig)
        {
            _cloudinarySettings = cloudinaryConfig.Value;

            // Initialize Cloudinary instance
            var account = new Account(
                _cloudinarySettings.CloudName,
                _cloudinarySettings.ApiKey,
                _cloudinarySettings.ApiSecret);

            _cloudinary = new Cloudinary(account);
        }

        public async Task<ImageUploadResult?> UploadImageAsync(IFormFile file)
        {
            // Placeholder/Dummy implementation for now if Cloudinary not set up
            if (string.IsNullOrEmpty(_cloudinarySettings.CloudName) ||
                string.IsNullOrEmpty(_cloudinarySettings.ApiKey) ||
                string.IsNullOrEmpty(_cloudinarySettings.ApiSecret))
            {
                // In a real scenario, you might throw an exception or return an error.
                // For demonstration, we'll simulate a successful upload with a dummy URL.
                return new ImageUploadResult
                {
                    PublicId = $"dummy_public_id_{Guid.NewGuid()}",
                    Url = new System.Uri($"https://dummy.com/uploads/{file.FileName}") // Dummy URL
                };
            }

            // Real Cloudinary upload logic
            var uploadResult = new ImageUploadResult();

            if (file.Length > 0)
            {
                using var stream = file.OpenReadStream();
                var uploadParams = new ImageUploadParams()
                {
                    File = new FileDescription(file.FileName, stream),
                    // You can add more options here, e.g., folder, transformations
                    // Folder = "questions",
                    // Transformation = new Transformation().Width(500).Crop("limit").Quality("auto")
                };

                uploadResult = await _cloudinary.UploadAsync(uploadParams);
            }

            return uploadResult;
        }

        public async Task<DeletionResult?> DeleteFileAsync(string publicId)
        {
            // Placeholder/Dummy for now
            if (string.IsNullOrEmpty(_cloudinarySettings.CloudName))
            {
                return new DeletionResult { Result = "ok" }; // Simulate success
            }

            // Real Cloudinary deletion logic
            var deleteParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deleteParams);
            return result;
        }
    }
}