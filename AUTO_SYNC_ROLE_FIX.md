# ✅ AUTO-SYNC ROLE FIX - No SQL Needed!

## The Solution

Modified the backend to **automatically sync roles from JWT token** whenever a user fetches their profile.

---

## How It Works

### Backend Changes

**File:** `backend/Controllers/UserProfilesController.cs`

**Modified:** `GetMyProfile()` endpoint (line ~22-50)

```csharp
// GET: api/userprofiles/me
[HttpGet("me")]
[Authorize]
public async Task<IActionResult> GetMyProfile()
{
    // ... existing code to get profile ...
    
    // ✨ AUTO-SYNC: Update role from JWT token if different
    var roleFromToken = User.FindFirst(ClaimTypes.Role)?.Value 
                        ?? User.FindFirst("role")?.Value;
    
    if (!string.IsNullOrEmpty(roleFromToken) && profile.Role != roleFromToken)
    {
        _logger.LogInformation($"Auto-syncing role for user {userId}: {profile.Role} -> {roleFromToken}");
        
        // Update the role in database to match JWT
        await _service.ChangeUserRoleAsync(userId, roleFromToken);
        profile.Role = roleFromToken; // Update returned profile
    }

    return Ok(profile);
}
```

---

## What This Does

1. **User logs in** → Supabase issues JWT with `user_metadata.role` (admin/teacher)
2. **Frontend calls** `GET /api/userprofiles/me` → Backend `GetMyProfile()` runs
3. **Backend checks** if JWT role matches database role
4. **If different** → Backend automatically updates database to match JWT
5. **Returns** profile with correct role

---

## How It's Like the Header

### Header Component Logic:
```jsx
const { user, isAdmin, isTeacher } = useAuth();

// AuthProvider reads from JWT:
const userRole = session.user.user_metadata?.role;
setIsAdmin(userRole === 'admin');
setIsTeacher(userRole === 'teacher');

// Header displays:
{isAdmin ? 'Administrator' : isTeacher ? 'Teacher' : 'User'}
```

### Backend Now Does the Same:
```csharp
// Read role from JWT (same source as Header!)
var roleFromToken = User.FindFirst(ClaimTypes.Role)?.Value;

// Store it in database
if (profile.Role != roleFromToken)
{
    await _service.ChangeUserRoleAsync(userId, roleFromToken);
}
```

**Both use the SAME source:** JWT `user_metadata.role` from Supabase! ✅

---

## Why This Works

### Before:
```
1. User with role="admin" in Supabase logs in
2. JWT has role="admin" ✓
3. Header shows "Administrator" ✓
4. Database has role="teacher" ✗ (old hardcoded value)
5. Users page shows "teacher" ✗ (reads from database)
```

### After:
```
1. User with role="admin" in Supabase logs in
2. JWT has role="admin" ✓
3. Backend sees JWT role != database role
4. Backend updates: database role="teacher" → role="admin" ✓
5. Header shows "Administrator" ✓
6. Users page shows "admin" ✓ (database now correct)
```

---

## Benefits

✅ **No SQL needed** - Happens automatically on login
✅ **Same logic as Header** - Both use JWT as source of truth
✅ **Self-healing** - Database syncs automatically
✅ **Works for all users** - Each user's role syncs when they log in
✅ **One-time fix** - After sync, database stays correct

---

## Testing

### Step 1: Stop Backend
```powershell
# Press Ctrl+C in the terminal where backend is running
```

### Step 2: Rebuild Backend
```powershell
cd backend
dotnet build
```

### Step 3: Start Backend
```powershell
dotnet run
```

### Step 4: Test Admin User
1. Log out of app
2. Log in with **admin** credentials
3. Backend logs should show:
   ```
   Auto-syncing role for user xxx: teacher -> admin
   ```
4. Go to Users page
5. **Your own profile** should now show "🟣 Admin"

### Step 5: Test Other Users
- Each user needs to **log in once** for their role to sync
- After they log in, their role in database will be correct
- Then admin can see their correct role in Users page

---

## How to Verify

### Check Backend Logs:
```
Auto-syncing role for user abc123: teacher -> admin
Profile updated for user abc123
```

### Check Database (Optional):
```sql
-- In Supabase SQL Editor
SELECT 
    "Id",
    "Email",
    "FullName",
    "Role"
FROM "UserProfiles"
ORDER BY "Email";
```

Should show correct roles after users log in.

---

## Timeline

### Immediate (After Restart):
- ✅ New profile creation uses JWT role (already fixed)
- ✅ Existing users' roles will sync when they log in

### After Each User Logs In Once:
- ✅ Their database role syncs with Supabase JWT
- ✅ Admin sees correct role in Users page
- ✅ No further action needed

---

## Current Status

- ✅ Code modified
- ⏳ Backend needs restart (currently locked)
- ⏳ Users need to log in once each

---

## Instructions for You

1. **Stop the backend** (find terminal, press Ctrl+C)
2. **Rebuild:** `cd backend; dotnet build`
3. **Start:** `dotnet run`
4. **Test:** Log out and log back in
5. **Verify:** Your role should show correctly
6. **Other users:** They need to log in once too

---

## Why Backend Won't Rebuild

The error shows:
```
The file is locked by: "backend (4068)"
```

The backend is currently running (process ID 4068). You need to:
1. Find the terminal where backend is running
2. Press **Ctrl+C** to stop it
3. Then rebuild: `dotnet build`
4. Then start: `dotnet run`

---

## Summary

✨ **Same logic as Header** - Backend now reads role from JWT (just like Header does)
✨ **Auto-sync** - Database updates automatically when user logs in
✨ **No SQL** - No manual database queries needed
✨ **Self-healing** - Works for all users, one login at a time

The Header already knew the secret - JWT has the correct role! Now the backend uses the same logic. 🎉
