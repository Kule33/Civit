using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UsersController : ControllerBase
    {
        private readonly ILogger<UsersController> _logger;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly string _supabaseUrl;
        private readonly string _supabaseServiceKey;

        public UsersController(
            ILogger<UsersController> logger,
            IConfiguration configuration,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
            _supabaseUrl = configuration["Supabase:ProjectUrl"] ?? "";
            _supabaseServiceKey = configuration["Supabase:ServiceRoleKey"] ?? "";
        }

        [HttpGet("count")]
        [Authorize(Roles = "admin,teacher")]
        public async Task<IActionResult> GetUserCount()
        {
            try
            {
                var client = _httpClientFactory.CreateClient();
                
                // Call Supabase Admin API to list users
                var requestUrl = $"{_supabaseUrl}/auth/v1/admin/users";
                var request = new HttpRequestMessage(HttpMethod.Get, requestUrl);
                request.Headers.Add("apikey", _supabaseServiceKey);
                request.Headers.Add("Authorization", $"Bearer {_supabaseServiceKey}");

                var response = await client.SendAsync(request);

                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    var jsonDoc = JsonDocument.Parse(content);
                    
                    if (jsonDoc.RootElement.TryGetProperty("users", out var usersArray))
                    {
                        var users = usersArray.EnumerateArray().ToList();
                        var totalUsers = users.Count;
                        
                        var adminCount = 0;
                        var teacherCount = 0;

                        foreach (var user in users)
                        {
                            if (user.TryGetProperty("user_metadata", out var metadata))
                            {
                                if (metadata.TryGetProperty("role", out var role))
                                {
                                    var roleValue = role.GetString();
                                    if (roleValue == "admin") adminCount++;
                                    else if (roleValue == "teacher") teacherCount++;
                                }
                            }
                        }

                        return Ok(new
                        {
                            totalUsers,
                            adminCount,
                            teacherCount
                        });
                    }
                }

                _logger.LogWarning("Failed to fetch users from Supabase: {StatusCode}", response.StatusCode);
                return Ok(new { totalUsers = 0, adminCount = 0, teacherCount = 0 });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching user count");
                return StatusCode(500, new { message = "Failed to fetch user count", error = ex.Message });
            }
        }
    }
}
