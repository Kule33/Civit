# Server-Side Authentication & Authorization Implementation

## Overview

This project now implements **comprehensive server-side authentication and authorization** using custom middleware. All authentication and authorization checks are performed on the server before any controller action is executed.

## Architecture

### Authentication Flow

```
Client Request → JWT Token in Authorization Header
    ↓
JwtAuthenticationMiddleware (Validates Token & Extracts Claims)
    ↓
ASP.NET Authentication Pipeline
    ↓
RoleAuthorizationMiddleware (Logs & Custom Auth Logic)
    ↓
ASP.NET Authorization Pipeline (Checks [Authorize] Attributes)
    ↓
Controller Action
```

## Middleware Components

### 1. JwtAuthenticationMiddleware

**Location:** `backend/Middleware/JwtAuthenticationMiddleware.cs`

**Purpose:** 
- Validates JWT tokens from Supabase
- Extracts user claims (ID, email, role) from token
- Enriches claims with metadata from Supabase token structure
- Sets `HttpContext.User` for downstream use

**Features:**
- Validates token signature using JWT secret
- Checks token expiration
- Extracts role from multiple token locations (user_metadata, app_metadata, top-level)
- Handles Supabase-specific token structure
- Provides detailed logging for authentication attempts

**Token Validation:**
```csharp
// Token must be in format: "Bearer {jwt_token}"
Authorization: Bearer eyJhbGc...
```

### 2. RoleAuthorizationMiddleware

**Location:** `backend/Middleware/RoleAuthorizationMiddleware.cs`

**Purpose:**
- Performs role-based authorization checks
- Logs all authenticated requests for audit purposes
- Implements custom path-based authorization rules
- Provides centralized authorization logic

**Features:**
- Logs user, role, method, and path for every authenticated request
- Custom authorization rules for specific endpoints
- Admin-only endpoint protection
- Extensible for complex permission logic

### 3. Custom Authorization Attributes

**Location:** `backend/Middleware/AuthorizationAttributes.cs`

**Available Attributes:**

#### `[RequireProfile]`
Ensures user has a complete profile in the system.
```csharp
[RequireProfile]
public async Task<IActionResult> GetDashboard() { ... }
```

#### `[AdminOnly]`
Restricts access to admin users only with descriptive error messages.
```csharp
[AdminOnly]
public async Task<IActionResult> ManageUsers() { ... }
```

#### `[AdminOrOwner]`
Allows access to admin or the resource owner.
```csharp
[AdminOrOwner("userId")]
public async Task<IActionResult> UpdateProfile(string userId) { ... }
```

#### `[RequirePermission]`
Requires specific permissions (extensible for fine-grained control).
```csharp
[RequirePermission("questions.delete", "questions.edit")]
public async Task<IActionResult> DeleteQuestion() { ... }
```

## Controller Authorization Patterns

### Pattern 1: Controller-Level Authorization
Apply `[Authorize]` to entire controller:
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize] // All endpoints require authentication
public class QuestionsController : ControllerBase
{
    // All methods require authentication
}
```

### Pattern 2: Method-Level Role Authorization
Apply role restrictions to specific methods:
```csharp
[ApiController]
[Route("api/[controller]")]
[Authorize] // Base authentication
public class QuestionsController : ControllerBase
{
    [HttpGet]
    // Anyone authenticated can view
    public async Task<IActionResult> GetQuestions() { ... }
    
    [HttpPost]
    [Authorize(Roles = "admin")] // Only admin can upload
    public async Task<IActionResult> UploadQuestion() { ... }
}
```

### Pattern 3: Custom Attributes
Use custom authorization attributes:
```csharp
[ApiController]
[Route("api/[controller]")]
public class UserProfilesController : ControllerBase
{
    [HttpGet("me")]
    [RequireProfile] // Requires complete profile
    public async Task<IActionResult> GetMyProfile() { ... }
    
    [HttpPut("{id}")]
    [AdminOrOwner("id")] // Admin or owner can update
    public async Task<IActionResult> UpdateProfile(string id) { ... }
}
```

## User Claims Available in Controllers

When a request is authenticated, the following claims are available:

```csharp
// Get User ID
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
           ?? User.FindFirst("sub")?.Value;

// Get User Email
var email = User.FindFirst(ClaimTypes.Email)?.Value 
         ?? User.FindFirst("email")?.Value;

// Get User Role
var role = User.FindFirst(ClaimTypes.Role)?.Value;

// Check if user is authenticated
if (User.Identity?.IsAuthenticated ?? false) { ... }

// Check if user has specific role
if (User.IsInRole("admin")) { ... }
```

## Configuration

### Required Settings in appsettings.json or Environment Variables

```json
{
  "Supabase": {
    "ProjectUrl": "https://your-project.supabase.co",
    "JwtSecret": "your-jwt-secret-key"
  }
}
```

Or via environment variables:
```
SUPABASE_PROJECT_URL=https://your-project.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret-key
```

## Security Features

### 1. Token Validation
- **Signature Verification:** Validates token signature using JWT secret
- **Expiration Check:** Rejects expired tokens
- **Clock Skew:** Zero tolerance for time differences
- **Structure Validation:** Validates Supabase token structure

### 2. Role Extraction
Attempts to extract role from multiple locations in order:
1. Top-level `role` claim
2. `user_metadata.role`
3. `app_metadata.role`
4. Hasura claims (`https://hasura.io/jwt/claims`)

### 3. Logging & Audit
- ✅ Successful authentication logged
- ❌ Failed authentication logged
- 🔐 Authorization attempts logged
- ⛔ Access denied attempts logged

### 4. Error Handling
- Returns proper HTTP status codes (401, 403)
- Provides descriptive error messages
- Doesn't expose sensitive information

## Public Endpoints

The following endpoints do NOT require authentication:
- `/swagger` - API documentation
- `/health` - Health check
- `/api/health` - Health check
- `/` - Root path

To add more public endpoints, update `IsPublicEndpoint()` in `JwtAuthenticationMiddleware.cs`:

```csharp
private bool IsPublicEndpoint(PathString path)
{
    var publicPaths = new[]
    {
        "/swagger",
        "/health",
        "/api/health",
        "/api/auth/login", // Add public endpoints here
        "/"
    };

    return publicPaths.Any(p => path.StartsWithSegments(p));
}
```

## Frontend Integration

### Request Headers
All authenticated requests must include the JWT token:

```javascript
const response = await axios.get('/api/questions', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Error Handling
Handle authentication errors properly:

```javascript
try {
  const response = await axios.get('/api/questions', config);
} catch (error) {
  if (error.response?.status === 401) {
    // Token expired or invalid - redirect to login
    redirectToLogin();
  } else if (error.response?.status === 403) {
    // Forbidden - user doesn't have permission
    showErrorMessage('You do not have permission to access this resource');
  }
}
```

### Token Refresh
When token expires, refresh it before making requests:

```javascript
const { data: { session }, error } = await supabase.auth.getSession();
if (session?.access_token) {
  // Use fresh token
  config.headers.Authorization = `Bearer ${session.access_token}`;
}
```

## What Can Be Removed from Frontend

With server-side authentication implemented, you can **simplify the frontend**:

### ❌ Remove Client-Side Role Checks
Before:
```javascript
// Don't do this - server handles authorization
if (userRole !== 'admin') {
  return <div>Access Denied</div>;
}
```

After:
```javascript
// Just make the request - server will handle authorization
const response = await axios.get('/api/admin/users');
// If unauthorized, server returns 403
```

### ✅ Keep Session Management
**Keep these in frontend:**
- Login/logout functionality
- Token storage (session management)
- Token refresh logic
- Basic UI visibility (show/hide admin menu items)

**Why?** These improve user experience but don't rely on them for security.

### ✅ Keep Error Handling
Always handle authentication errors:
```javascript
.catch(error => {
  if (error.response?.status === 401) {
    // Redirect to login
  } else if (error.response?.status === 403) {
    // Show access denied message
  }
});
```

## Testing Authentication

### Test with cURL

```bash
# Without token (should fail)
curl -X GET http://localhost:5201/api/questions

# With valid token
curl -X GET http://localhost:5201/api/questions \
  -H "Authorization: Bearer eyJhbGc..."

# Admin endpoint with non-admin token (should return 403)
curl -X POST http://localhost:5201/api/questions/upload \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"subject": "Math", ...}'
```

### Test with Swagger
1. Navigate to `/swagger`
2. Click "Authorize" button
3. Enter: `Bearer {your_jwt_token}`
4. Try different endpoints

## Common Issues & Solutions

### Issue: "Token expired"
**Solution:** Refresh the token on the frontend before making requests

### Issue: "Unauthorized" even with valid token
**Solution:** Check that JWT secret matches between Supabase and backend configuration

### Issue: "Forbidden" for admin endpoints
**Solution:** Ensure user's role is properly set in Supabase user metadata:
```json
{
  "user_metadata": {
    "role": "admin"
  }
}
```

### Issue: Role not found in token
**Solution:** Update user metadata in Supabase:
```sql
-- In Supabase SQL Editor
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'user@example.com';
```

## Extending Authorization

### Add Custom Authorization Logic

Edit `RoleAuthorizationMiddleware.cs`:

```csharp
private bool IsAuthorizedForPath(ClaimsPrincipal user, PathString path, string method)
{
    var role = user.FindFirst(ClaimTypes.Role)?.Value?.ToLowerInvariant();
    
    // Add custom rules
    if (path.StartsWithSegments("/api/sensitive-data"))
    {
        // Only allow access from certain IP addresses
        var ipAddress = context.Connection.RemoteIpAddress?.ToString();
        if (!IsAllowedIP(ipAddress))
        {
            return false;
        }
    }
    
    return true;
}
```

### Add Permission-Based Authorization

1. Store permissions in JWT token or database
2. Check permissions in `RequirePermissionAttribute`
3. Use `[RequirePermission("resource.action")]` on controllers

## Best Practices

1. ✅ **Always use HTTPS in production** - Tokens are sensitive
2. ✅ **Set short token expiration** - Reduces risk if token is compromised
3. ✅ **Implement token refresh** - Better UX than forced login
4. ✅ **Log authorization attempts** - Helps detect security issues
5. ✅ **Use role-based authorization** - Simpler than permission-based for most cases
6. ✅ **Validate on server** - Never trust client-side validation alone
7. ✅ **Return proper status codes** - 401 for auth, 403 for authorization
8. ✅ **Don't expose sensitive info in errors** - Generic error messages

## Monitoring & Logging

Check logs for authentication/authorization events:

```
✅ Authenticated: User=123e4567-e89b-12d3-a456-426614174000, Role=admin, Path=/api/questions
🔐 Authorization Check: User=123e4567, Role=teacher, Method=GET, Path=/api/questions
⛔ Access Denied: User=123e4567, Role=teacher, Path=/api/questions/upload
❌ Invalid token for path: /api/questions
```

## Summary

With this implementation:
- ✅ All authentication is handled server-side
- ✅ All authorization is enforced server-side
- ✅ Frontend can be simplified (remove redundant checks)
- ✅ Security is centralized and consistent
- ✅ Easy to extend and maintain
- ✅ Comprehensive logging for audit trails
- ✅ Follows ASP.NET Core best practices
