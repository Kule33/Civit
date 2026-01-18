using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;

namespace backend.Middleware
{
    /// <summary>
    /// Middleware that validates JWT tokens from Supabase and extracts user claims.
    /// This runs before any controller action and ensures all authenticated requests have valid tokens.
    /// </summary>
    public class JwtAuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<JwtAuthenticationMiddleware> _logger;
        private readonly string _jwtSecret;
        private readonly JwtSecurityTokenHandler _tokenHandler;

        public JwtAuthenticationMiddleware(
            RequestDelegate next,
            IConfiguration configuration,
            ILogger<JwtAuthenticationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
            
            // Get JWT secret from configuration
            _jwtSecret = configuration["Supabase:JwtSecret"] 
                ?? throw new InvalidOperationException("JWT Secret not configured");
            
            _tokenHandler = new JwtSecurityTokenHandler();
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Skip authentication for health check endpoints, swagger, etc.
            if (IsPublicEndpoint(context.Request.Path))
            {
                await _next(context);
                return;
            }

            // Extract token from Authorization header
            var token = ExtractTokenFromHeader(context.Request.Headers["Authorization"].ToString());

            if (!string.IsNullOrEmpty(token))
            {
                try
                {
                    // Validate and decode the JWT token
                    var principal = ValidateToken(token);
                    
                    if (principal != null)
                    {
                        // Extract and enrich user claims from token
                        var enrichedPrincipal = EnrichUserClaims(principal, token);
                        
                        // Set the user principal for the request
                        context.User = enrichedPrincipal;
                        
                        // Log successful authentication (only for non-GET requests to reduce log spam)
                        if (context.Request.Method != "GET")
                        {
                            var userId = enrichedPrincipal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
                            var role = enrichedPrincipal.FindFirst(ClaimTypes.Role)?.Value ?? "No Role";
                            _logger.LogInformation($"✅ Authenticated: User={userId}, Role={role}, Path={context.Request.Path}");
                        }
                    }
                    else
                    {
                        _logger.LogWarning($"❌ Invalid token for path: {context.Request.Path}");
                    }
                }
                catch (SecurityTokenExpiredException)
                {
                    _logger.LogWarning("Token expired for path: {Path}", context.Request.Path);
                    context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsJsonAsync(new { error = "Token expired" });
                    return;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Token validation failed for path: {Path}", context.Request.Path);
                    // Don't block the request, let it continue (ASP.NET auth will handle it)
                }
            }

            // Continue to next middleware - ALWAYS continue, don't block here
            await _next(context);
        }

        /// <summary>
        /// Validates the JWT token and returns ClaimsPrincipal if valid
        /// </summary>
        private ClaimsPrincipal? ValidateToken(string token)
        {
            try
            {
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false, // Supabase tokens don't have a specific issuer
                    ValidateAudience = false, // Supabase tokens don't have a specific audience
                    ValidateLifetime = true, // Ensure token hasn't expired
                    ValidateIssuerSigningKey = true, // Validate signature
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSecret)),
                    ClockSkew = TimeSpan.Zero, // No grace period for expiration
                    NameClaimType = "sub", // Supabase uses 'sub' for user ID
                    RoleClaimType = ClaimTypes.Role
                };

                var principal = _tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);
                return principal;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Token validation error");
                return null;
            }
        }

        /// <summary>
        /// Enriches the claims principal with additional user metadata from the JWT token
        /// Supabase embeds user metadata in the token that needs to be extracted
        /// </summary>
        private ClaimsPrincipal EnrichUserClaims(ClaimsPrincipal principal, string token)
        {
            var identity = principal.Identity as ClaimsIdentity;
            if (identity == null) return principal;

            try
            {
                // Decode the JWT token to access all claims
                var jwtToken = _tokenHandler.ReadJwtToken(token);
                
                // Extract role from various possible locations in the token
                string? role = null;

                // 1. Check top-level "role" claim
                role = jwtToken.Claims.FirstOrDefault(c => c.Type == "role")?.Value;

                // 2. Check user_metadata (Supabase stores custom user data here)
                var userMetadataClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "user_metadata")?.Value;
                if (!string.IsNullOrEmpty(userMetadataClaim))
                {
                    try
                    {
                        var metadata = JsonDocument.Parse(userMetadataClaim);
                        if (metadata.RootElement.TryGetProperty("role", out var roleElement))
                        {
                            role = roleElement.GetString();
                        }
                    }
                    catch { /* Ignore JSON parsing errors */ }
                }

                // 3. Check app_metadata (Supabase admin-set metadata)
                var appMetadataClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "app_metadata")?.Value;
                if (!string.IsNullOrEmpty(appMetadataClaim))
                {
                    try
                    {
                        var metadata = JsonDocument.Parse(appMetadataClaim);
                        if (metadata.RootElement.TryGetProperty("role", out var roleElement))
                        {
                            role = roleElement.GetString();
                        }
                    }
                    catch { /* Ignore JSON parsing errors */ }
                }

                // Add role claim if found and it's a valid application role
                if (!string.IsNullOrEmpty(role) && IsValidRole(role))
                {
                    // Remove any existing role claims
                    var existingRoleClaims = identity.Claims.Where(c => c.Type == ClaimTypes.Role).ToList();
                    foreach (var claim in existingRoleClaims)
                    {
                        identity.RemoveClaim(claim);
                    }

                    // Add the validated role
                    identity.AddClaim(new Claim(ClaimTypes.Role, role.ToLowerInvariant()));
                }

                // Extract email claim
                var email = jwtToken.Claims.FirstOrDefault(c => c.Type == "email")?.Value;
                if (!string.IsNullOrEmpty(email) && !identity.HasClaim(c => c.Type == ClaimTypes.Email))
                {
                    identity.AddClaim(new Claim(ClaimTypes.Email, email));
                }

                // Ensure NameIdentifier claim exists (user ID)
                var userId = jwtToken.Claims.FirstOrDefault(c => c.Type == "sub")?.Value;
                if (!string.IsNullOrEmpty(userId) && !identity.HasClaim(c => c.Type == ClaimTypes.NameIdentifier))
                {
                    identity.AddClaim(new Claim(ClaimTypes.NameIdentifier, userId));
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error enriching user claims");
            }

            return principal;
        }

        /// <summary>
        /// Extracts the JWT token from the Authorization header
        /// Expected format: "Bearer {token}"
        /// </summary>
        private string? ExtractTokenFromHeader(string authorizationHeader)
        {
            if (string.IsNullOrEmpty(authorizationHeader))
                return null;

            // Check if header starts with "Bearer "
            if (authorizationHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return authorizationHeader.Substring("Bearer ".Length).Trim();
            }

            return null;
        }

        /// <summary>
        /// Checks if the endpoint is public and doesn't require authentication
        /// </summary>
        private bool IsPublicEndpoint(PathString path)
        {
            var publicPaths = new[]
            {
                "/swagger",
                "/health",
                "/api/health",
                "/"
            };

            return publicPaths.Any(p => path.StartsWithSegments(p, StringComparison.OrdinalIgnoreCase));
        }

        /// <summary>
        /// Validates if the role is a recognized application role
        /// </summary>
        private bool IsValidRole(string role)
        {
            var validRoles = new[] { "admin", "teacher" };
            return validRoles.Contains(role.ToLowerInvariant());
        }
    }
}
