# 🚨 URGENT FIX: Sync Roles from Supabase Auth to UserProfiles

## Problem
- ✅ Supabase `auth.users` has correct roles (2 admins, 1 teacher)
- ❌ `UserProfiles` table shows all as "teacher"
- Need to sync the roles from auth to UserProfiles

---

## ⚡ QUICK FIX (1 Minute)

### Copy this SQL and run in Supabase SQL Editor:

```sql
-- Update UserProfiles to match auth.users roles
UPDATE "UserProfiles"
SET "Role" = auth.users.raw_user_meta_data->>'role'
FROM auth.users
WHERE "UserProfiles"."Id" = auth.users.id::text
  AND auth.users.raw_user_meta_data->>'role' IS NOT NULL;

-- Verify it worked
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as auth_role,
    p."Role" as profile_role,
    p."FullName"
FROM auth.users u
LEFT JOIN "UserProfiles" p ON p."Id" = u.id::text
ORDER BY u.email;
```

---

## Step-by-Step:

### 1. Go to Supabase Dashboard
- Open your project
- Click **SQL Editor** (left sidebar)

### 2. Run the Sync Query
```sql
UPDATE "UserProfiles"
SET "Role" = auth.users.raw_user_meta_data->>'role'
FROM auth.users
WHERE "UserProfiles"."Id" = auth.users.id::text
  AND auth.users.raw_user_meta_data->>'role' IS NOT NULL;
```
- Click **Run** (or press F5)
- Should say "UPDATE 3" (or however many users you have)

### 3. Verify the Fix
```sql
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as auth_role,
    p."Role" as profile_role
FROM auth.users u
LEFT JOIN "UserProfiles" p ON p."Id" = u.id::text;
```
- `auth_role` and `profile_role` should now match!

### 4. Refresh Your App
- Just refresh the page (F5)
- Go to **Users** page
- Admins should now show purple **"Admin"** badge

---

## What This Does

The query:
1. Looks at each user in `auth.users`
2. Gets their `role` from `user_metadata`
3. Updates the matching profile in `UserProfiles` table
4. Only updates if auth role exists

**Before:**
```
Auth:          admin, admin, teacher
UserProfiles:  teacher, teacher, teacher  ❌
```

**After:**
```
Auth:          admin, admin, teacher
UserProfiles:  admin, admin, teacher      ✅
```

---

## If It Still Doesn't Work

### Check if auth.users has roles:
```sql
SELECT 
    email, 
    raw_user_meta_data->>'role' as role
FROM auth.users;
```

If any roles are `null`, set them:
```sql
-- Set specific user to admin
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'admin@example.com';

-- Set specific user to teacher
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "teacher"}'::jsonb
WHERE email = 'teacher@example.com';
```

Then run the sync query again.

---

## Expected Result

In your app's Users page, you should see:

| Email | Full Name | Role |
|-------|-----------|------|
| admin1@example.com | Admin One | 🟣 **Admin** |
| admin2@example.com | Admin Two | 🟣 **Admin** |
| teacher@example.com | Teacher | 🔵 **Teacher** |

---

## Files Reference

- **Sync Script**: `sync-roles-to-profiles.sql` (detailed version)
- **This Guide**: `QUICK_ROLE_FIX.md` (you're here)

---

That's it! Just run the UPDATE query and refresh your app. No need to restart backend or log out. 🎉
