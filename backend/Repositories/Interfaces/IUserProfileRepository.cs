using backend.Models;

namespace backend.Repositories.Interfaces;

public interface IUserProfileRepository
{
    Task<UserProfile?> GetByIdAsync(string id);
    Task<UserProfile?> GetByEmailAsync(string email);
    Task<IEnumerable<UserProfile>> GetAllAsync();
    Task<UserProfile> CreateAsync(UserProfile profile);
    Task<UserProfile> UpdateAsync(UserProfile profile);
    Task DeleteAsync(string id);
    Task<bool> ExistsByNICAsync(string nic);
    Task<bool> ExistsByIdAsync(string id);
    Task<IEnumerable<UserProfile>> GetTeachersAsync();
    Task<IEnumerable<UserProfile>> GetAdminsAsync();
}
