using backend.Data;
using backend.Models;
using backend.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Repositories;

public class UserProfileRepository : IUserProfileRepository
{
    private readonly AppDbContext _context;

    public UserProfileRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<UserProfile?> GetByIdAsync(string id)
    {
        return await _context.UserProfiles
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<UserProfile?> GetByEmailAsync(string email)
    {
        return await _context.UserProfiles
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<IEnumerable<UserProfile>> GetAllAsync()
    {
        return await _context.UserProfiles
            .OrderBy(u => u.FullName)
            .ToListAsync();
    }

    public async Task<UserProfile> CreateAsync(UserProfile profile)
    {
        _context.UserProfiles.Add(profile);
        await _context.SaveChangesAsync();
        return profile;
    }

    public async Task<UserProfile> UpdateAsync(UserProfile profile)
    {
        profile.UpdatedAt = DateTime.UtcNow;
        _context.UserProfiles.Update(profile);
        await _context.SaveChangesAsync();
        return profile;
    }

    public async Task DeleteAsync(string id)
    {
        var profile = await GetByIdAsync(id);
        if (profile != null)
        {
            _context.UserProfiles.Remove(profile);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsByNICAsync(string nic)
    {
        return await _context.UserProfiles
            .AnyAsync(u => u.NIC == nic);
    }

    public async Task<bool> ExistsByIdAsync(string id)
    {
        return await _context.UserProfiles
            .AnyAsync(u => u.Id == id);
    }

    public async Task<IEnumerable<UserProfile>> GetTeachersAsync()
    {
        return await _context.UserProfiles
            .Where(u => u.Role == "teacher")
            .OrderBy(u => u.FullName)
            .ToListAsync();
    }

    public async Task<IEnumerable<UserProfile>> GetAdminsAsync()
    {
        return await _context.UserProfiles
            .Where(u => u.Role == "admin")
            .OrderBy(u => u.FullName)
            .ToListAsync();
    }
}
