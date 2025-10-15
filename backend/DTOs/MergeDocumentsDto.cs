// backend/DTOs/MergeDocumentsDto.cs
using System.ComponentModel.DataAnnotations;

namespace backend.DTOs
{
    /// <summary>
    /// Request DTO for merging multiple Word documents
    /// </summary>
    public class MergeDocumentsDto
    {
        [Required]
        [MinLength(1, ErrorMessage = "At least one file URL is required")]
        public List<string> FileUrls { get; set; } = new List<string>();
    }
}
