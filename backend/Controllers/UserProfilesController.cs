using backend.Services.DTOs;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserProfilesController : ControllerBase
{
    private readonly IUserProfileService _service;
    private readonly ILogger<UserProfilesController> _logger;

    public UserProfilesController(IUserProfileService service, ILogger<UserProfilesController> logger)
    {
        _service = service;
        _logger = logger;
    }

    // GET: api/userprofiles/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyProfile()
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User ID not found in token" });
            }

            var profile = await _service.GetByIdAsync(userId);
            if (profile == null)
            {
                return NotFound(new { message = "Profile not found" });
            }

            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting user profile");
            return StatusCode(500, new { message = "An error occurred while retrieving profile" });
        }
    }

    // POST: api/userprofiles
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateProfile([FromBody] CreateUserProfileDto dto)
    {
        try
        {
            // Extract Supabase UUID from JWT token
            var supabaseUserId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                                 ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(supabaseUserId))
            {
                return Unauthorized(new { message = "User ID not found in token" });
            }

            // Override any Id in the DTO with the actual Supabase UUID
            dto.Id = supabaseUserId;
            
            // Get email from token if not provided
            if (string.IsNullOrEmpty(dto.Email))
            {
                dto.Email = User.FindFirst(ClaimTypes.Email)?.Value 
                            ?? User.FindFirst("email")?.Value 
                            ?? string.Empty;
            }

            // Force default role to "teacher"
            dto.Role = "teacher";

            var profile = await _service.CreateProfileAsync(dto);
            
            _logger.LogInformation($"Profile created for user {supabaseUserId}");
            
            return CreatedAtAction(nameof(GetProfileById), new { id = profile.Id }, profile);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating profile");
            return StatusCode(500, new { message = "An error occurred while creating profile" });
        }
    }

    // PUT: api/userprofiles/{id}
    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile(string id, [FromBody] UpdateUserProfileDto dto)
    {
        try
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                         ?? User.FindFirst("sub")?.Value;
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value 
                           ?? User.FindFirst("role")?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized(new { message = "User ID not found in token" });
            }

            // Check if user owns the profile or is admin
            if (id != userId && userRole != "admin")
            {
                return Forbid();
            }

            var profile = await _service.UpdateProfileAsync(id, dto);
            
            _logger.LogInformation($"Profile updated for user {id}");
            
            return Ok(profile);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating profile");
            return StatusCode(500, new { message = "An error occurred while updating profile" });
        }
    }

    // GET: api/userprofiles
    [HttpGet]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetAllProfiles()
    {
        try
        {
            var profiles = await _service.GetAllProfilesAsync();
            return Ok(profiles);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting all profiles");
            return StatusCode(500, new { message = "An error occurred while retrieving profiles" });
        }
    }

    // GET: api/userprofiles/{id}
    [HttpGet("{id}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> GetProfileById(string id)
    {
        try
        {
            var profile = await _service.GetByIdAsync(id);
            if (profile == null)
            {
                return NotFound(new { message = "Profile not found" });
            }

            return Ok(profile);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error getting profile {id}");
            return StatusCode(500, new { message = "An error occurred while retrieving profile" });
        }
    }

    // PUT: api/userprofiles/{id}/role
    [HttpPut("{id}/role")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> ChangeUserRole(string id, [FromBody] ChangeRoleRequest request)
    {
        try
        {
            var profile = await _service.ChangeUserRoleAsync(id, request.Role);
            
            _logger.LogInformation($"Role changed to {request.Role} for user {id}");
            
            return Ok(profile);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Error changing role for user {id}");
            return StatusCode(500, new { message = "An error occurred while changing role" });
        }
    }
}

public class ChangeRoleRequest
{
    public string Role { get; set; } = string.Empty;
}
