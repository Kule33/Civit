# 🔧 ADMIN ROLE FIX - Complete Guide

## Problem
Backend was updated to read roles from JWT, but:
1. Supabase users don't have roles set in `user_metadata`
2. Existing profiles in database still show "teacher" role
3. Need to update both Supabase AND database

---

## Solution: 3-Step Process

### ✅ Step 1: Update Roles in Supabase

#### Option A: Supabase Dashboard (Easiest)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** → **Users**
4. Find your admin user (e.g., `alexshantha1@gmail.com`)
5. Click on the user
6. Scroll down to **User Metadata** section
7. Click **Edit** or add JSON:
```json
{
  "role": "admin"
}
```
8. Click **Save**

#### Option B: SQL Editor (Faster for multiple users)
1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste from `supabase-role-fix.sql` file:
```sql
-- Update your admin email
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'alexshantha1@gmail.com';
```
3. Click **Run**
4. Verify:
```sql
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'alexshantha1@gmail.com';
```

---

### ✅ Step 2: Restart Backend

The backend code has been updated but needs to restart to pick up changes:

```powershell
# In PowerShell terminal (backend terminal)
# Press Ctrl+C to stop the current backend
# Then run:
cd D:\JV\Civit\backend
dotnet run
```

The backend will now read roles from JWT tokens.

---

### ✅ Step 3: Fix Existing Profiles in Database

You have 2 options:

#### Option A: Delete and Recreate Profile (Recommended)
1. **In your app**:
   - Log out
   - Log back in (gets new JWT with admin role)
   - Delete your existing profile from Users page (as admin)
   - Go to `/complete-profile` and create new profile
   - New profile will have "admin" role

#### Option B: Update Database Directly (Supabase SQL Editor)
```sql
-- Update profile role to match Supabase auth
UPDATE "UserProfiles"
SET "Role" = 'admin'
WHERE "Email" = 'alexshantha1@gmail.com';

-- Verify
SELECT "Email", "FullName", "Role"
FROM "UserProfiles"
WHERE "Email" = 'alexshantha1@gmail.com';
```

---

## Testing the Fix

### 1. Verify Supabase Role
```sql
-- In Supabase SQL Editor
SELECT 
    email,
    raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'alexshantha1@gmail.com';
```
Expected: `role` should be `admin`

### 2. Check JWT Token
After logging in:
1. Open Browser DevTools (F12)
2. Go to **Application** tab → **Local Storage**
3. Find Supabase token
4. Decode at https://jwt.io
5. Look for `user_metadata.role` = `admin`

### 3. Verify Database Profile
```sql
-- In Supabase SQL Editor
SELECT "Email", "FullName", "Role"
FROM "UserProfiles"
WHERE "Email" = 'alexshantha1@gmail.com';
```
Expected: `Role` should be `admin`

### 4. Check in App
1. Log out
2. Log in again
3. Go to **Users** page
4. Your user should show purple **"Admin"** badge

---

## Quick Fix Commands

### PowerShell Commands (Run in order):

```powershell
# 1. Stop backend (Ctrl+C in backend terminal)

# 2. Rebuild backend
cd D:\JV\Civit\backend
dotnet clean
dotnet build

# 3. Restart backend
dotnet run
```

### SQL Commands (Run in Supabase SQL Editor):

```sql
-- Set admin role in Supabase
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'YOUR_EMAIL@example.com';

-- Update profile in database
UPDATE "UserProfiles"
SET "Role" = 'admin'
WHERE "Email" = 'YOUR_EMAIL@example.com';

-- Verify both
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as supabase_role,
    p."Role" as profile_role
FROM auth.users u
LEFT JOIN "UserProfiles" p ON p."Id" = u.id::text
WHERE u.email = 'YOUR_EMAIL@example.com';
```

---

## Common Issues & Solutions

### Issue 1: "Still shows Teacher after updating Supabase"
**Cause**: Old JWT token still in browser
**Fix**:
1. Log out completely
2. Clear browser cache (Ctrl+Shift+Delete)
3. Log back in (gets new JWT)

### Issue 2: "Backend shows 'teacher' in logs"
**Cause**: Backend not restarted after code change
**Fix**:
1. Stop backend (Ctrl+C)
2. Run `dotnet run` again

### Issue 3: "Database shows 'admin', app shows 'teacher'"
**Cause**: JWT still has old role
**Fix**:
1. Update Supabase user_metadata (Step 1)
2. Log out and log in
3. Profile will sync with JWT on next login

### Issue 4: "Can't access admin pages"
**Cause**: JWT doesn't have admin role
**Fix**:
1. Verify Supabase user_metadata has role
2. Log out and log in
3. Check JWT token contains `user_metadata.role: "admin"`

---

## File Reference

- **Backend Fix**: `backend/Controllers/UserProfilesController.cs` (Line 73-85)
- **SQL Script**: `supabase-role-fix.sql` (Use in Supabase SQL Editor)
- **Full Guide**: `ROLE_MANAGEMENT_FIX.md`

---

## Summary Checklist

- [ ] Update Supabase `user_metadata.role` to "admin" (SQL Editor or Dashboard)
- [ ] Verify role in Supabase: `SELECT email, raw_user_meta_data->>'role' FROM auth.users`
- [ ] Restart backend: `dotnet run` in backend terminal
- [ ] Log out of app completely
- [ ] Log back in (gets new JWT)
- [ ] Delete old profile from Users page (optional)
- [ ] Create new profile at `/complete-profile`
- [ ] Verify admin badge shows in Users page

---

## Need More Help?

Check the logs:
```powershell
# Backend logs will show:
# "Creating profile for user {id} with role: admin (from token: admin)"
```

If you see `(from token: none)`, the JWT doesn't have the role - go back to Step 1.

---

**Expected Result**: 
- Purple "Admin" badge in Users page
- Access to all admin routes
- Backend logs show "role: admin"

Let me know if you need any clarification! 🚀
