using backend.Services.DTOs;

namespace backend.Services.Interfaces;

public interface IUserProfileService
{
    Task<UserProfileDto?> GetByIdAsync(string id);
    Task<UserProfileDto?> GetByEmailAsync(string email);
    Task<List<UserProfileDto>> GetAllProfilesAsync();
    Task<UserProfileDto> CreateProfileAsync(CreateUserProfileDto dto);
    Task<UserProfileDto> UpdateProfileAsync(string id, UpdateUserProfileDto dto);
    Task<bool> ValidateNICAsync(string nic);
    Task<bool> ValidatePhoneAsync(string phone);
    Task<UserProfileDto> ChangeUserRoleAsync(string id, string newRole);
}
