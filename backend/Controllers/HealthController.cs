using backend.Config;
using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/health")]
    public class HealthController : ControllerBase
    {
        private readonly SupabaseSettings _supabase;
        private readonly AppDbContext _db;

        public HealthController(IOptions<SupabaseSettings> supabaseOptions, AppDbContext db)
        {
            _supabase = supabaseOptions.Value;
            _db = db;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> Get()
        {
            bool dbOk;
            try
            {
                dbOk = await _db.Database.CanConnectAsync();
            }
            catch
            {
                dbOk = false;
            }

            return Ok(new
            {
                supabaseProjectUrlSet = !string.IsNullOrWhiteSpace(_supabase.ProjectUrl),
                supabaseAnonKeySet = !string.IsNullOrWhiteSpace(_supabase.AnonKey),
                supabaseJwtSecretSet = !string.IsNullOrWhiteSpace(_supabase.JwtSecret),
                dbCanConnect = dbOk
            });
        }
    }
}
