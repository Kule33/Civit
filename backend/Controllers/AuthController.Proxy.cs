using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using backend.Config;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthControllerProxy : ControllerBase
    {
        private readonly HttpClient _httpClient;
        private readonly SupabaseSettings _supabase;

        public AuthControllerProxy(IHttpClientFactory httpClientFactory, IOptions<SupabaseSettings> supabaseOptions)
        {
            _httpClient = httpClientFactory.CreateClient();
            _supabase = supabaseOptions.Value;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(_supabase.ProjectUrl) || string.IsNullOrWhiteSpace(_supabase.AnonKey))
            {
                return StatusCode(500, new { message = "Supabase configuration missing" });
            }

            var url = $"{_supabase.ProjectUrl.TrimEnd('/')}/auth/v1/signup";
            var payload = new
            {
                email = request.Email,
                password = request.Password,
                options = new
                {
                    data = new { role = "teacher" },
                    emailRedirectTo = request.EmailRedirectTo ?? ""
                }
            };

            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            _httpClient.DefaultRequestHeaders.Remove("apikey");
            _httpClient.DefaultRequestHeaders.Add("apikey", _supabase.AnonKey);

            var resp = await _httpClient.PostAsync(url, content);
            var body = await resp.Content.ReadAsStringAsync();
            return StatusCode((int)resp.StatusCode, JsonDocument.Parse(body));
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(_supabase.ProjectUrl) || string.IsNullOrWhiteSpace(_supabase.AnonKey))
            {
                return StatusCode(500, new { message = "Supabase configuration missing" });
            }

            var url = $"{_supabase.ProjectUrl.TrimEnd('/')}/auth/v1/token?grant_type=password";
            var payload = new
            {
                email = request.Email,
                password = request.Password
            };
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            _httpClient.DefaultRequestHeaders.Remove("apikey");
            _httpClient.DefaultRequestHeaders.Add("apikey", _supabase.AnonKey);

            var resp = await _httpClient.PostAsync(url, content);
            var body = await resp.Content.ReadAsStringAsync();
            return StatusCode((int)resp.StatusCode, JsonDocument.Parse(body));
        }

        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            if (string.IsNullOrWhiteSpace(_supabase.ProjectUrl) || string.IsNullOrWhiteSpace(_supabase.AnonKey))
            {
                return StatusCode(500, new { message = "Supabase configuration missing" });
            }

            var url = $"{_supabase.ProjectUrl.TrimEnd('/')}/auth/v1/token?grant_type=refresh_token";
            var payload = new
            {
                refresh_token = request.RefreshToken
            };
            var json = JsonSerializer.Serialize(payload);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
            _httpClient.DefaultRequestHeaders.Remove("apikey");
            _httpClient.DefaultRequestHeaders.Add("apikey", _supabase.AnonKey);

            var resp = await _httpClient.PostAsync(url, content);
            var body = await resp.Content.ReadAsStringAsync();
            return StatusCode((int)resp.StatusCode, JsonDocument.Parse(body));
        }
    }

    public class RegisterRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? EmailRedirectTo { get; set; }
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class RefreshRequest
    {
        public string RefreshToken { get; set; } = string.Empty;
    }
}
