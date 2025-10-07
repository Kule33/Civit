// backend/Services/Interfaces/ICloudinaryService.cs
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;

namespace backend.Services.Interfaces
{
    public interface ICloudinaryService
    {
        Task<ImageUploadResult?> UploadImageAsync(IFormFile file);
        Task<DeletionResult?> DeleteFileAsync(string publicId);
        Task<RawUploadResult?> UploadRawAsync(IFormFile file, string folder = "typesets");
        // Maybe other methods later, e.g., for video, raw files.
    }
}