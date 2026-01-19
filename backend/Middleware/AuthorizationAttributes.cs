using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

namespace backend.Middleware
{
    /// <summary>
    /// Custom authorization attribute that ensures user has a profile in the system.
    /// This is useful for endpoints that require a complete user profile to function.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public class RequireProfileAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            // Check if user is authenticated
            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedObjectResult(new 
                { 
                    error = "Unauthorized",
                    message = "Authentication required" 
                });
                return;
            }

            // You can add additional checks here, like verifying profile exists in database
            // For now, we just check that user has required claims
            var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
            {
                context.Result = new UnauthorizedObjectResult(new 
                { 
                    error = "Unauthorized",
                    message = "User ID not found in token" 
                });
                return;
            }
        }
    }

    /// <summary>
    /// Custom authorization attribute for admin-only endpoints.
    /// Provides more descriptive error messages than standard [Authorize(Roles = "admin")]
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = false)]
    public class AdminOnlyAttribute : Attribute, IAuthorizationFilter
    {
        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            // Check if user is authenticated
            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedObjectResult(new 
                { 
                    error = "Unauthorized",
                    message = "Authentication required" 
                });
                return;
            }

            // Check if user has admin role
            var role = user.FindFirst(ClaimTypes.Role)?.Value;
            if (role?.ToLowerInvariant() != "admin")
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
                
                // Log unauthorized access attempt
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILogger<AdminOnlyAttribute>>();
                logger.LogWarning($"⛔ Admin access denied for user {userId} with role '{role}' on path {context.HttpContext.Request.Path}");

                context.Result = new ForbidResult();
            }
        }
    }

    /// <summary>
    /// Custom authorization attribute that allows access to admin or the resource owner.
    /// Useful for endpoints where users can manage their own resources but admins can manage all.
    /// </summary>
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public class AdminOrOwnerAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string _userIdParameter;

        /// <summary>
        /// Constructor
        /// </summary>
        /// <param name="userIdParameter">Name of the route/query parameter containing the user ID to check ownership</param>
        public AdminOrOwnerAttribute(string userIdParameter = "id")
        {
            _userIdParameter = userIdParameter;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            // Check if user is authenticated
            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedObjectResult(new 
                { 
                    error = "Unauthorized",
                    message = "Authentication required" 
                });
                return;
            }

            var currentUserId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var role = user.FindFirst(ClaimTypes.Role)?.Value?.ToLowerInvariant();

            // Admin has access to everything
            if (role == "admin")
            {
                return;
            }

            // Check if user is accessing their own resource
            var resourceUserId = context.RouteData.Values[_userIdParameter]?.ToString()
                ?? context.HttpContext.Request.Query[_userIdParameter].ToString();

            if (string.IsNullOrEmpty(resourceUserId) || resourceUserId != currentUserId)
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILogger<AdminOrOwnerAttribute>>();
                logger.LogWarning($"⛔ Access denied: User {currentUserId} attempted to access resource of user {resourceUserId}");

                context.Result = new ForbidResult();
            }
        }
    }

    /// <summary>
    /// Attribute to require specific permissions beyond just roles.
    /// Can be extended to support fine-grained permission systems.
    /// </summary>
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method, AllowMultiple = true)]
    public class RequirePermissionAttribute : Attribute, IAuthorizationFilter
    {
        private readonly string[] _permissions;

        public RequirePermissionAttribute(params string[] permissions)
        {
            _permissions = permissions;
        }

        public void OnAuthorization(AuthorizationFilterContext context)
        {
            var user = context.HttpContext.User;

            // Check if user is authenticated
            if (!user.Identity?.IsAuthenticated ?? true)
            {
                context.Result = new UnauthorizedObjectResult(new 
                { 
                    error = "Unauthorized",
                    message = "Authentication required" 
                });
                return;
            }

            // Admin has all permissions
            var role = user.FindFirst(ClaimTypes.Role)?.Value?.ToLowerInvariant();
            if (role == "admin")
            {
                return;
            }

            // Check for specific permissions in user claims
            // This is a basic implementation - extend based on your permission system
            var hasRequiredPermissions = _permissions.All(permission =>
                user.HasClaim("permission", permission));

            if (!hasRequiredPermissions)
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Unknown";
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILogger<RequirePermissionAttribute>>();
                logger.LogWarning($"⛔ Permission denied for user {userId}. Required: {string.Join(", ", _permissions)}");

                context.Result = new ForbidResult();
            }
        }
    }
}


