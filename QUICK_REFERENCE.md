# 🔐 Authentication Quick Reference

## Server-Side Middleware (Backend)

### Middleware Order (Critical!)
```csharp
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors("AllowFrontend");
app.UseMiddleware<JwtAuthenticationMiddleware>();  // 1. Validate token
app.UseAuthentication();                            // 2. ASP.NET auth
app.UseRoleAuthorization();                         // 3. Check roles
app.UseAuthorization();                             // 4. ASP.NET authz
app.MapControllers();
```

### Controller Authorization Patterns

```csharp
// Pattern 1: Entire controller requires auth
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MyController : ControllerBase { }

// Pattern 2: Admin-only endpoint
[HttpPost]
[Authorize(Roles = "admin")]
public async Task<IActionResult> AdminAction() { }

// Pattern 3: Custom attribute
[HttpGet("me")]
[RequireProfile]
public async Task<IActionResult> GetProfile() { }

// Pattern 4: Admin or owner
[HttpPut("{id}")]
[AdminOrOwner("id")]
public async Task<IActionResult> Update(string id) { }
```

### Get User Info in Controllers

```csharp
// User ID
var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
           ?? User.FindFirst("sub")?.Value;

// Email
var email = User.FindFirst(ClaimTypes.Email)?.Value 
         ?? User.FindFirst("email")?.Value;

// Role
var role = User.FindFirst(ClaimTypes.Role)?.Value;

// Check role
if (User.IsInRole("admin")) { }

// Check authenticated
if (User.Identity?.IsAuthenticated ?? false) { }
```

## Client-Side (Frontend)

### Send Authenticated Request

```javascript
// Get token
const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

// Make request
const response = await axios.get('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Handle Errors

```javascript
try {
  const data = await fetchData();
} catch (error) {
  if (error.response?.status === 401) {
    // Unauthorized - redirect to login
    window.location.href = '/login';
  } else if (error.response?.status === 403) {
    // Forbidden - show error
    alert('You do not have permission');
  }
}
```

### Axios Interceptor (Add Once)

```javascript
// Auto-add token to all requests
axios.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Auto-refresh on 401
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session) {
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return axios(error.config);
      }
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 401 | Unauthorized - No/invalid token | Redirect to login |
| 403 | Forbidden - No permission | Show error message |
| 404 | Not Found | Show not found |
| 200 | Success | Continue |

## Testing

### Test with cURL

```bash
# No token (should fail)
curl http://localhost:5201/api/questions

# With token
curl http://localhost:5201/api/questions \
  -H "Authorization: Bearer YOUR_TOKEN"

# Admin endpoint (should fail if not admin)
curl -X POST http://localhost:5201/api/questions/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Math"}'
```

### Check User Role in Supabase

```sql
-- View user role
SELECT email, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE email = 'user@example.com';

-- Set user as admin
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'user@example.com';

-- Set user as teacher
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"teacher"'
)
WHERE email = 'user@example.com';
```

## Logging Output

### Successful Auth
```
✅ Authenticated: User=123e4567-e89b-12d3-a456-426614174000, Role=admin, Path=/api/questions
```

### Authorization Check
```
🔐 Authorization Check: User=123e4567, Role=teacher, Method=GET, Path=/api/questions
```

### Access Denied
```
⛔ Access Denied: User=123e4567, Role=teacher, Path=/api/questions/upload
```

### Invalid Token
```
❌ Invalid token for path: /api/questions
```

## Environment Variables

```bash
# Required for backend
SUPABASE_PROJECT_URL=https://xxx.supabase.co
SUPABASE_JWT_SECRET=your-jwt-secret-here

# Optional for admin operations
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Common Issues

| Issue | Solution |
|-------|----------|
| 401 even with token | Check JWT secret matches |
| 403 on admin endpoint | Set user role in Supabase |
| Token not sent | Add axios interceptor |
| CORS error | Check CORS middleware order |
| Token expired | Implement token refresh |

## Files to Review

- **Backend Auth:** `backend/AUTHENTICATION_README.md`
- **Frontend Guide:** `frontend/FRONTEND_AUTH_SIMPLIFICATION.md`
- **Migration:** `MIGRATION_GUIDE.md`
- **Middleware:** `backend/Middleware/*.cs`

## Key Principles

1. ✅ **Server validates everything** - Client just sends token
2. ✅ **Use HTTPS in production** - Tokens are sensitive
3. ✅ **Log auth attempts** - Helps debug and audit
4. ✅ **Handle errors properly** - 401 vs 403 vs others
5. ✅ **Keep UI checks for UX** - But don't rely on them for security
6. ✅ **Test with different roles** - Ensure authorization works

---

**Quick Start:**
1. Backend: Middleware already configured ✅
2. Frontend: Add axios interceptor
3. Test: Try accessing protected endpoints
4. Debug: Check server logs for auth events
