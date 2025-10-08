# 🔐 Role Management System - Fixed

## Issue Identified
The system was forcing all new user profiles to have the "teacher" role, even when admins created profiles. This was happening because the `CreateProfile` endpoint was hardcoded to set `role = "teacher"`.

## Solution Implemented

### Backend Fix (`UserProfilesController.cs`)

**Changed from:**
```csharp
// Force default role to "teacher"
dto.Role = "teacher";
```

**To:**
```csharp
// ⚡ FIX: Get role from JWT token (set by Supabase user_metadata.role)
var roleFromToken = User.FindFirst(ClaimTypes.Role)?.Value 
                    ?? User.FindFirst("role")?.Value;

// Use role from token if available, otherwise default to "teacher"
dto.Role = !string.IsNullOrEmpty(roleFromToken) ? roleFromToken : "teacher";

_logger.LogInformation($"Creating profile with role: {dto.Role}");
```

---

## How Role Management Works

### 1. **Supabase User Metadata (Source of Truth)**

When you create a user in Supabase, set their role in `user_metadata`:

```sql
-- In Supabase SQL Editor or Dashboard
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data, 
  '{role}', 
  '"admin"'
)
WHERE email = 'admin@example.com';
```

### 2. **JWT Token Contains Role**

When the user logs in, Supabase includes the role in their JWT token:
```json
{
  "sub": "uuid-here",
  "email": "admin@example.com",
  "user_metadata": {
    "role": "admin"
  }
}
```

### 3. **Backend Maps Role to Claims**

Your `Program.cs` already has logic to extract the role from JWT and add it to claims:

```csharp
// Line 81-95 in Program.cs
var roleFromMetadata = principal.FindFirst("user_metadata")?.Value;
if (!string.IsNullOrEmpty(roleFromMetadata))
{
    var metadata = JsonDocument.Parse(roleFromMetadata);
    if (metadata.RootElement.TryGetProperty("role", out var roleElement))
    {
        var role = roleElement.GetString();
        identity.AddClaim(new Claim(ClaimTypes.Role, role));
    }
}
```

### 4. **Profile Creation Uses Token Role**

Now when a user completes their profile, the system:
1. Extracts role from JWT token
2. Creates profile with that role
3. Stores in `UserProfiles` table

---

## Setting Up Roles in Supabase

### Method 1: Supabase Dashboard (Recommended)

1. Go to **Authentication** → **Users**
2. Click on a user
3. Scroll to **User Metadata**
4. Add/Edit JSON:
```json
{
  "role": "admin"
}
```
5. Save

### Method 2: SQL Query

```sql
-- Set admin role
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';

-- Set teacher role (default)
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "teacher"}'::jsonb
WHERE email = 'teacher@example.com';

-- Verify
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users;
```

### Method 3: Sign-up Hook (Automatic)

Create a Supabase Edge Function or Database Trigger:

```sql
-- Trigger to set default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Set default role to "teacher" for all new users
  NEW.raw_user_meta_data = jsonb_set(
    COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"teacher"'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
CREATE TRIGGER on_auth_user_created
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

---

## Testing the Fix

### 1. **Test with Existing Admin**

If you have an admin user:

```sql
-- Verify admin role in Supabase
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'your-admin@example.com';

-- If not set, update it:
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-admin@example.com';
```

Then:
1. Log out from your app
2. Log in again (new JWT with role)
3. Create/update profile
4. Check Users page - should show "Admin" badge

### 2. **Test with New User**

1. Create new user in Supabase with `role: "teacher"` in metadata
2. Log in to app
3. Complete profile
4. Verify profile has "teacher" role in database

### 3. **Test Role Change (Admin Only)**

1. Log in as admin
2. Go to Users page
3. Click "Change Role" on a user
4. Change from "Teacher" to "Admin" or vice versa
5. Verify role updates in database

---

## Role Permissions

### Admin
- ✅ Access all admin routes
- ✅ Upload questions and typesets
- ✅ Manage all questions
- ✅ View all users
- ✅ Change user roles
- ✅ Access dashboard

### Teacher
- ✅ Access dashboard
- ✅ Build papers
- ✅ View questions
- ❌ Cannot upload questions
- ❌ Cannot manage users
- ❌ Cannot change roles

---

## Database Sync

### Current Flow
1. **User signs up** → Supabase creates user with metadata
2. **User logs in** → JWT contains role from metadata
3. **User completes profile** → Backend reads role from JWT, saves to `UserProfiles`
4. **Admin changes role** → Backend updates `UserProfiles` table only

### Important Notes

⚠️ **Two Sources of Roles:**
- **Supabase `user_metadata.role`**: Controls JWT claims, used for authorization
- **Database `UserProfiles.Role`**: Display in UI, can be edited by admins

⚠️ **Role Change Behavior:**
- Changing role in Users page updates `UserProfiles` table
- Does NOT update Supabase `user_metadata`
- User must log out and back in for authorization changes to take effect

### Recommended: Keep Roles in Sync

If you change a role in the app, also update Supabase metadata:

**Option 1: Update backend to sync both places**

Add to `ChangeUserRoleAsync` service:
```csharp
// TODO: Also update Supabase user_metadata via Admin API
// This requires calling Supabase Admin API: /auth/v1/admin/users/{id}
// PATCH with { user_metadata: { role: "admin" } }
```

**Option 2: Manual sync via SQL**
```sql
-- After changing role in app, run:
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  raw_user_meta_data,
  '{role}',
  '"admin"'  -- or "teacher"
)
WHERE id = 'user-uuid-here';
```

---

## Troubleshooting

### Problem: Admin still shows as "Teacher"

**Solution:**
1. Check Supabase user metadata:
```sql
SELECT email, raw_user_meta_data->>'role' 
FROM auth.users 
WHERE email = 'your-email@example.com';
```

2. If role is wrong, update it:
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'your-email@example.com';
```

3. Log out and log back in (to get new JWT with correct role)

4. Navigate to `/complete-profile` and recreate profile (if needed)

### Problem: Role change doesn't take effect

**Reason:** JWT still has old role

**Solution:**
1. Log out
2. Log back in (gets new JWT)
3. Now authorization will work with new role

### Problem: New users get wrong role

**Solution:** Set role in Supabase when creating user:
- Dashboard: Add `{"role": "teacher"}` to User Metadata
- SQL: Include role in user creation
- Trigger: Auto-add role on signup

---

## Summary

✅ **Fixed**: Profile creation now respects role from JWT token
✅ **Admin roles**: Will be correctly assigned if set in Supabase metadata
✅ **Teacher roles**: Default for users without explicit role
✅ **Logging**: Added logging to track role assignment

### Next Steps

1. **Rebuild backend**: 
```powershell
cd backend
dotnet build
```

2. **Update admin roles in Supabase**:
```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email IN ('admin1@example.com', 'admin2@example.com');
```

3. **Test**: Log out, log in, complete profile, verify role

4. **Optional**: Implement Supabase metadata sync for role changes in app

The system is now properly configured to respect roles from Supabase! 🎉
