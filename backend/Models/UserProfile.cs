using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace backend.Models;

public class UserProfile
{
    [Key]
    [MaxLength(36)]
    public string Id { get; set; } = string.Empty; // Supabase UUID

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 2)]
    [RegularExpression(@"^[a-zA-Z\s]+$", ErrorMessage = "Full Name must contain only letters and spaces")]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string District { get; set; } = string.Empty;

    [Required]
    [StringLength(12, MinimumLength = 10)]
    [RegularExpression(@"^([0-9]{9}[VvXx]|[0-9]{12})$", ErrorMessage = "NIC must be 9 digits + V/X or 12 digits")]
    public string NIC { get; set; } = string.Empty;

    [Required]
    [Phone]
    [RegularExpression(@"^\+94[0-9]{9}$", ErrorMessage = "Phone must be +94 followed by 9 digits")]
    [StringLength(12)]
    public string TelephoneNo { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^(Male|Female|Other)$", ErrorMessage = "Gender must be Male, Female, or Other")]
    public string Gender { get; set; } = string.Empty;

    [Required]
    [RegularExpression(@"^(admin|teacher)$", ErrorMessage = "Role must be admin or teacher")]
    public string Role { get; set; } = "teacher";

    [Column(TypeName = "decimal(18,2)")]
    public decimal Balance { get; set; } = 0;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
