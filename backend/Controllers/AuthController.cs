using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Linq;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        [HttpGet("me")]
        [Authorize]
        public IActionResult Me()
        {
            var claims = User?.Claims?.Select(c => new { c.Type, c.Value }).ToList();
            var role = User?.Claims?.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
            return Ok(new {
                authenticated = User?.Identity?.IsAuthenticated ?? false,
                name = User?.Identity?.Name,
                role,
                claims
            });
        }
    }
}


