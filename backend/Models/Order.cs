using System.ComponentModel.DataAnnotations;

namespace backend.Models
{
    public class Order
    {
        [Required]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        public string PaperId { get; set; } = string.Empty;

        [Required]
        public string UserId { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
