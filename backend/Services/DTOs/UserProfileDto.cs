namespace backend.Services.DTOs;

public class UserProfileDto
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string NIC { get; set; } = string.Empty;
    public string TelephoneNo { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateUserProfileDto
{
    public string Id { get; set; } = string.Empty; // Will be overridden by controller
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string NIC { get; set; } = string.Empty;
    public string TelephoneNo { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Role { get; set; } = "teacher"; // Default to teacher
}

public class UpdateUserProfileDto
{
    public string? FullName { get; set; }
    public string? District { get; set; }
    public string? NIC { get; set; }
    public string? TelephoneNo { get; set; }
    public string? Gender { get; set; }
    public string? Role { get; set; }
}
