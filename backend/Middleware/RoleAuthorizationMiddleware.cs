using System.Security.Claims;

namespace backend.Middleware
{
    /// <summary>
    /// Middleware that performs role-based authorization checks.
    /// This middleware logs authorization attempts and can be extended for complex permission logic.
    /// Note: Most role-based authorization is handled by [Authorize(Roles = "...")] attributes,
    /// but this middleware provides centralized logging and can handle cross-cutting authorization concerns.
    /// </summary>
    public class RoleAuthorizationMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RoleAuthorizationMiddleware> _logger;

        public RoleAuthorizationMiddleware(
            RequestDelegate next,
            ILogger<RoleAuthorizationMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Only check authorization for authenticated users
            if (context.User.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
                var role = context.User.FindFirst(ClaimTypes.Role)?.Value ?? "No Role";
                var path = context.Request.Path;
                var method = context.Request.Method;

                // Log only non-GET requests for audit purposes (reduce log spam)
                if (method != "GET")
                {
                    _logger.LogInformation($"🔐 Authorization Check: User={userId}, Role={role}, Method={method}, Path={path}");
                }

                // Check for specific path-based authorization rules
                // This is where you can add custom authorization logic that goes beyond simple role checks
                if (!IsAuthorizedForPath(context.User, path, method))
                {
                    _logger.LogWarning($"⛔ Access Denied: User={userId}, Role={role}, Path={path}");
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    context.Response.ContentType = "application/json";
                    await context.Response.WriteAsJsonAsync(new 
                    { 
                        error = "Forbidden",
                        message = "You don't have permission to access this resource"
                    });
                    return;
                }
            }

            // Continue to next middleware
            await _next(context);
        }

        /// <summary>
        /// Checks if user is authorized to access a specific path.
        /// This method implements custom authorization rules beyond basic role checks.
        /// Can be extended for resource-based or claim-based authorization.
        /// </summary>
        private bool IsAuthorizedForPath(ClaimsPrincipal user, PathString path, string method)
        {
            var role = user.FindFirst(ClaimTypes.Role)?.Value?.ToLowerInvariant();

            // Admin endpoints - only admin role can access
            if (path.StartsWithSegments("/api/users") || 
                path.StartsWithSegments("/api/admin"))
            {
                if (role != "admin")
                {
                    return false;
                }
            }

            // Question upload and management - admin only
            if (path.StartsWithSegments("/api/questions/upload") && method == "POST")
            {
                if (role != "admin")
                {
                    return false;
                }
            }

            // Typeset upload - admin only
            if (path.StartsWithSegments("/api/typesets/upload") && method == "POST")
            {
                if (role != "admin")
                {
                    return false;
                }
            }

            // User profile role changes - admin only
            if (path.Value?.Contains("/role") == true && method == "PUT")
            {
                if (role != "admin")
                {
                    return false;
                }
            }

            // By default, allow access (specific controller attributes will handle role checks)
            return true;
        }
    }

    /// <summary>
    /// Extension method to easily add the authorization middleware to the pipeline
    /// </summary>
    public static class RoleAuthorizationMiddlewareExtensions
    {
        public static IApplicationBuilder UseRoleAuthorization(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<RoleAuthorizationMiddleware>();
        }
    }
}
