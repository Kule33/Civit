using System.Text.RegularExpressions;
using backend.Models;
using backend.Repositories.Interfaces;
using backend.Services.DTOs;
using backend.Services.Interfaces;

namespace backend.Services;

public class UserProfileService : IUserProfileService
{
    private readonly IUserProfileRepository _repository;
    private static readonly string[] SriLankanDistricts = new[]
    {
        "Ampara", "Anuradhapura", "Badulla", "Batticaloa",
        "Colombo", "Galle", "Gampaha", "Hambantota",
        "Jaffna", "Kalutara", "Kandy", "Kegalle",
        "Kilinochchi", "Kurunegala", "Mannar", "Matale",
        "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
        "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee",
        "Vavuniya"
    };

    public UserProfileService(IUserProfileRepository repository)
    {
        _repository = repository;
    }

    public async Task<UserProfileDto?> GetByIdAsync(string id)
    {
        var profile = await _repository.GetByIdAsync(id);
        return profile == null ? null : MapToDto(profile);
    }

    public async Task<UserProfileDto?> GetByEmailAsync(string email)
    {
        var profile = await _repository.GetByEmailAsync(email);
        return profile == null ? null : MapToDto(profile);
    }

    public async Task<List<UserProfileDto>> GetAllProfilesAsync()
    {
        var profiles = await _repository.GetAllAsync();
        return profiles.Select(MapToDto).ToList();
    }

    public async Task<UserProfileDto> CreateProfileAsync(CreateUserProfileDto dto)
    {
        // Validate NIC format
        if (!await ValidateNICAsync(dto.NIC))
        {
            throw new ArgumentException("Invalid NIC format. Must be 9 digits + V/X or 12 digits.");
        }

        // Validate phone format
        if (!await ValidatePhoneAsync(dto.TelephoneNo))
        {
            throw new ArgumentException("Invalid phone format. Must be +94 followed by 9 digits.");
        }

        // Validate district
        if (!SriLankanDistricts.Contains(dto.District))
        {
            throw new ArgumentException($"Invalid district. Must be one of: {string.Join(", ", SriLankanDistricts)}");
        }

        // Check if NIC already exists
        if (await _repository.ExistsByNICAsync(dto.NIC))
        {
            throw new InvalidOperationException("NIC already exists in the system.");
        }

        // Check if profile already exists for this user ID
        if (await _repository.ExistsByIdAsync(dto.Id))
        {
            throw new InvalidOperationException("Profile already exists for this user.");
        }

        // Force role to "teacher" if not admin or teacher
        if (dto.Role != "admin" && dto.Role != "teacher")
        {
            dto.Role = "teacher";
        }

        var profile = new UserProfile
        {
            Id = dto.Id,
            Email = dto.Email,
            FullName = dto.FullName,
            District = dto.District,
            NIC = dto.NIC,
            TelephoneNo = dto.TelephoneNo,
            Gender = dto.Gender,
            Role = dto.Role,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        var createdProfile = await _repository.CreateAsync(profile);
        return MapToDto(createdProfile);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(string id, UpdateUserProfileDto dto)
    {
        var profile = await _repository.GetByIdAsync(id);
        if (profile == null)
        {
            throw new KeyNotFoundException($"Profile with ID {id} not found.");
        }

        // Update only provided fields
        if (!string.IsNullOrEmpty(dto.FullName))
        {
            profile.FullName = dto.FullName;
        }

        if (!string.IsNullOrEmpty(dto.District))
        {
            if (!SriLankanDistricts.Contains(dto.District))
            {
                throw new ArgumentException($"Invalid district. Must be one of: {string.Join(", ", SriLankanDistricts)}");
            }
            profile.District = dto.District;
        }

        if (!string.IsNullOrEmpty(dto.NIC))
        {
            if (!await ValidateNICAsync(dto.NIC))
            {
                throw new ArgumentException("Invalid NIC format. Must be 9 digits + V/X or 12 digits.");
            }
            
            // Check if NIC is being changed to an existing one
            if (dto.NIC != profile.NIC && await _repository.ExistsByNICAsync(dto.NIC))
            {
                throw new InvalidOperationException("NIC already exists in the system.");
            }
            
            profile.NIC = dto.NIC;
        }

        if (!string.IsNullOrEmpty(dto.TelephoneNo))
        {
            if (!await ValidatePhoneAsync(dto.TelephoneNo))
            {
                throw new ArgumentException("Invalid phone format. Must be +94 followed by 9 digits.");
            }
            profile.TelephoneNo = dto.TelephoneNo;
        }

        if (!string.IsNullOrEmpty(dto.Gender))
        {
            if (dto.Gender != "Male" && dto.Gender != "Female" && dto.Gender != "Other")
            {
                throw new ArgumentException("Gender must be Male, Female, or Other.");
            }
            profile.Gender = dto.Gender;
        }

        if (!string.IsNullOrEmpty(dto.Role))
        {
            if (dto.Role != "admin" && dto.Role != "teacher")
            {
                throw new ArgumentException("Role must be admin or teacher.");
            }
            profile.Role = dto.Role;
        }

        var updatedProfile = await _repository.UpdateAsync(profile);
        return MapToDto(updatedProfile);
    }

    public async Task<bool> ValidateNICAsync(string nic)
    {
        // Old format: 9 digits + V/X
        var oldFormat = new Regex(@"^[0-9]{9}[VvXx]$");
        // New format: 12 digits
        var newFormat = new Regex(@"^[0-9]{12}$");

        return await Task.FromResult(oldFormat.IsMatch(nic) || newFormat.IsMatch(nic));
    }

    public async Task<bool> ValidatePhoneAsync(string phone)
    {
        // Must be +94 followed by 9 digits
        var phonePattern = new Regex(@"^\+94[0-9]{9}$");
        return await Task.FromResult(phonePattern.IsMatch(phone));
    }

    public async Task<UserProfileDto> ChangeUserRoleAsync(string id, string newRole)
    {
        if (newRole != "admin" && newRole != "teacher")
        {
            throw new ArgumentException("Role must be admin or teacher.");
        }

        var profile = await _repository.GetByIdAsync(id);
        if (profile == null)
        {
            throw new KeyNotFoundException($"Profile with ID {id} not found.");
        }

        profile.Role = newRole;
        var updatedProfile = await _repository.UpdateAsync(profile);
        return MapToDto(updatedProfile);
    }

    private static UserProfileDto MapToDto(UserProfile profile)
    {
        return new UserProfileDto
        {
            Id = profile.Id,
            Email = profile.Email,
            FullName = profile.FullName,
            District = profile.District,
            NIC = profile.NIC,
            TelephoneNo = profile.TelephoneNo,
            Gender = profile.Gender,
            Role = profile.Role,
            CreatedAt = profile.CreatedAt,
            UpdatedAt = profile.UpdatedAt
        };
    }
}
