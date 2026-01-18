# Server-Side Authentication Migration Guide

## 🎯 Overview

This guide explains the complete migration from frontend-based authentication to **server-side authentication and authorization** in your ASP.NET Core + Supabase application.

## 📋 What Was Implemented

### Backend (Server-Side)

#### 1. **JwtAuthenticationMiddleware** ✅
- **Location:** `backend/Middleware/JwtAuthenticationMiddleware.cs`
- **Purpose:** Validates JWT tokens from Supabase on every request
- **Features:**
  - Validates token signature and expiration
  - Extracts user ID, email, and role from token
  - Handles Supabase-specific token structure (user_metadata, app_metadata)
  - Sets HttpContext.User for downstream use
  - Provides detailed logging

#### 2. **RoleAuthorizationMiddleware** ✅
- **Location:** `backend/Middleware/RoleAuthorizationMiddleware.cs`
- **Purpose:** Centralized authorization logic and audit logging
- **Features:**
  - Logs all authenticated requests
  - Custom path-based authorization rules
  - Extensible for complex permission logic
  - Admin-only endpoint protection

#### 3. **Custom Authorization Attributes** ✅
- **Location:** `backend/Middleware/AuthorizationAttributes.cs`
- **Attributes:**
  - `[RequireProfile]` - Requires complete user profile
  - `[AdminOnly]` - Admin-only access with descriptive errors
  - `[AdminOrOwner]` - Admin or resource owner can access
  - `[RequirePermission]` - Fine-grained permission control

#### 4. **Updated Program.cs** ✅
- Registered all middleware in correct order
- Configured authentication pipeline
- Added comprehensive comments

#### 5. **Updated Controllers** ✅
- Added `[Authorize]` attributes where missing
- Added role-based authorization
- Added documentation comments

### Frontend (Client-Side)

#### 1. **Simplified userService** ✅
- **Location:** `frontend/src/services/userService.simplified.js`
- **Changes:**
  - Removed redundant token validation
  - Removed extensive logging
  - Simplified error handling
  - Trust server for all validation

#### 2. **Documentation** ✅
- **Backend Guide:** `backend/AUTHENTICATION_README.md`
- **Frontend Guide:** `frontend/FRONTEND_AUTH_SIMPLIFICATION.md`
- **This Guide:** `MIGRATION_GUIDE.md`

## 🔧 How It Works

### Request Flow

```
1. Client sends request with JWT token:
   Authorization: Bearer <jwt_token>

2. JwtAuthenticationMiddleware:
   ├─ Extracts token from header
   ├─ Validates signature with JWT secret
   ├─ Checks expiration
   ├─ Extracts claims (user ID, email, role)
   └─ Sets HttpContext.User

3. ASP.NET Authentication:
   └─ Processes [Authorize] attributes

4. RoleAuthorizationMiddleware:
   ├─ Logs request (user, role, path)
   ├─ Checks custom authorization rules
   └─ Can block access with 403

5. ASP.NET Authorization:
   └─ Processes [Authorize(Roles = "...")] attributes

6. Controller Action:
   └─ Executes with validated user context
```

### Token Structure

Supabase JWT tokens contain:
```json
{
  "sub": "user-id-here",
  "email": "user@example.com",
  "role": "authenticated",
  "user_metadata": {
    "role": "admin"  // ← Our application role
  },
  "exp": 1234567890
}
```

The middleware extracts `user_metadata.role` and maps it to `ClaimTypes.Role` for ASP.NET.

## 📝 Migration Steps

### Step 1: Backend Setup (Already Done ✅)

The backend is already set up with:
- Middleware files created
- Program.cs updated
- Controllers have authorization attributes

### Step 2: Test Backend Authentication

Test with cURL or Postman:

```bash
# Get a token from Supabase (use your frontend to login and copy token)
# Test without token (should fail)
curl http://localhost:5201/api/questions

# Test with valid token
curl http://localhost:5201/api/questions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test admin endpoint with non-admin token (should return 403)
curl -X POST http://localhost:5201/api/questions/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"subject": "Math"}'
```

### Step 3: Update Frontend Services

Replace your current service files with the simplified versions:

**Option A: Replace entire file**
```bash
# Backup current file
cp frontend/src/services/userService.js frontend/src/services/userService.backup.js

# Use simplified version
cp frontend/src/services/userService.simplified.js frontend/src/services/userService.js
```

**Option B: Apply changes manually**

Follow the patterns in `frontend/FRONTEND_AUTH_SIMPLIFICATION.md`.

### Step 4: Update Frontend Components

Remove client-side security checks:

**❌ Remove:**
```javascript
// Don't check roles on client for security
if (user.role !== 'admin') {
  return <div>Access Denied</div>;
}
```

**✅ Replace with:**
```javascript
// Let server handle authorization
useEffect(() => {
  fetchData()
    .catch(err => {
      if (err.response?.status === 403) {
        setError('You do not have permission');
      }
    });
}, []);
```

### Step 5: Add Global Axios Interceptor (Optional but Recommended)

Add to `frontend/src/main.jsx` or `App.jsx`:

```javascript
import axios from 'axios';
import { supabase } from './supabaseClient';

// Auto-add token to all requests
axios.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

// Handle auth errors globally
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
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

### Step 6: Update ProtectedRoute Component

Simplify to only check authentication:

```javascript
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  // Server handles authorization
  return children;
}
```

### Step 7: Test End-to-End

1. **Test Authentication:**
   - Log in → Should work
   - Access protected route → Should work
   - Log out → Should redirect to login
   - Access protected route while logged out → Should redirect to login

2. **Test Authorization (Admin):**
   - Log in as teacher
   - Try to upload question → Should show 403 error
   - Log in as admin
   - Try to upload question → Should work

3. **Test Token Expiration:**
   - Wait for token to expire (or manually set short expiration)
   - Make request → Should auto-refresh or redirect to login

## 🔍 Verification Checklist

### Backend
- [ ] Middleware files exist in `backend/Middleware/`
- [ ] Program.cs has middleware registered
- [ ] Controllers have `[Authorize]` attributes
- [ ] Admin endpoints have `[Authorize(Roles = "admin")]`
- [ ] Server starts without errors
- [ ] Swagger shows lock icons on protected endpoints

### Frontend
- [ ] Services use simplified getAuthHeaders()
- [ ] Removed client-side role validation for security
- [ ] Error handling for 401/403 implemented
- [ ] ProtectedRoute only checks authentication
- [ ] App runs without errors
- [ ] Can login and access protected routes

### Testing
- [ ] Can access public endpoints without token
- [ ] Cannot access protected endpoints without token (401)
- [ ] Can access protected endpoints with valid token
- [ ] Admin endpoints return 403 for non-admin users
- [ ] Token refresh works (or redirects to login)
- [ ] Logs show authentication/authorization events

## 🐛 Troubleshooting

### Issue: "Unauthorized" even with valid token

**Solution:**
1. Check JWT secret matches between Supabase and backend
2. Verify token is being sent in Authorization header
3. Check token hasn't expired
4. Look at server logs for validation errors

```bash
# Check backend logs
dotnet run

# Should see:
# ✅ Authenticated: User=..., Role=..., Path=...
```

### Issue: "Forbidden" on admin endpoints

**Solution:**
1. Verify user has admin role in Supabase:
```sql
-- In Supabase SQL Editor
SELECT raw_user_meta_data FROM auth.users WHERE email = 'your@email.com';
```

2. Update user role:
```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'your@email.com';
```

3. User must log out and log back in for new role to take effect

### Issue: Token not found in requests

**Solution:**
1. Check axios interceptor is set up
2. Verify token exists in session:
```javascript
const { data: { session } } = await supabase.auth.getSession();
console.log('Token:', session?.access_token);
```

3. Check browser dev tools → Network → Request Headers

### Issue: CORS errors

**Solution:**
Already configured in Program.cs, but verify:
```csharp
app.UseCors("AllowFrontend");
// Must be BEFORE UseAuthentication()
app.UseAuthentication();
```

## 📚 Key Files Reference

### Backend
- `Program.cs` - Middleware registration and configuration
- `Middleware/JwtAuthenticationMiddleware.cs` - Token validation
- `Middleware/RoleAuthorizationMiddleware.cs` - Authorization logic
- `Middleware/AuthorizationAttributes.cs` - Custom attributes
- `Controllers/*Controller.cs` - Authorization attributes

### Frontend
- `services/userService.simplified.js` - Simplified service example
- `context/AuthProvider.jsx` - Auth context (to be simplified)
- `components/ProtectedRoute.jsx` - Route protection (to be simplified)
- `main.jsx` or `App.jsx` - Axios interceptors (to be added)

### Documentation
- `backend/AUTHENTICATION_README.md` - Complete backend guide
- `frontend/FRONTEND_AUTH_SIMPLIFICATION.md` - Frontend changes guide
- `MIGRATION_GUIDE.md` - This file

## 🎓 Best Practices

1. **Always use HTTPS in production** - Tokens are sensitive
2. **Set reasonable token expiration** - Balance security and UX (1 hour is common)
3. **Implement token refresh** - Better UX than forced re-login
4. **Log authorization attempts** - Helps detect security issues
5. **Use role-based authorization** - Simpler than permission-based
6. **Validate on server** - Never trust client-side validation
7. **Return proper status codes** - 401 for auth, 403 for authorization
8. **Don't expose sensitive info** - Generic error messages

## 🚀 Next Steps

1. **Review and test** the current implementation
2. **Apply frontend changes** from the simplified examples
3. **Test thoroughly** with different user roles
4. **Monitor logs** for authentication/authorization events
5. **Update other services** (questionService, paperService, etc.) to follow the simplified pattern
6. **Consider adding** permission-based authorization if needed
7. **Set up monitoring** for failed authentication attempts

## 📞 Support

- Review `backend/AUTHENTICATION_README.md` for detailed backend information
- Review `frontend/FRONTEND_AUTH_SIMPLIFICATION.md` for frontend changes
- Check server logs for authentication debugging
- Use Swagger UI for API testing: `http://localhost:5201/swagger`

## ✨ Benefits Achieved

1. ✅ **Security:** All validation on server (can't be bypassed)
2. ✅ **Simplicity:** Less frontend code to maintain
3. ✅ **Consistency:** Single source of truth for authorization
4. ✅ **Auditability:** All auth attempts logged on server
5. ✅ **Maintainability:** Centralized auth logic
6. ✅ **Scalability:** Easy to extend with new roles/permissions

---

**Created:** December 6, 2025
**Status:** ✅ Backend Implemented, Frontend Examples Provided
**Next:** Apply frontend changes and test
