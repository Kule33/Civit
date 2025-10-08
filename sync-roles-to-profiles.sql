-- ==============================================
-- SYNC ROLES FROM AUTH TO USERPROFILES TABLE
-- ==============================================
-- This updates UserProfiles table to match auth.users roles

-- Step 1: Check current state - what's in auth vs UserProfiles
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as auth_role,
    p."Role" as profile_role,
    CASE 
        WHEN u.raw_user_meta_data->>'role' = p."Role" THEN '✓ Match'
        ELSE '✗ Mismatch'
    END as status
FROM auth.users u
LEFT JOIN "UserProfiles" p ON p."Id" = u.id::text
ORDER BY u.email;

-- Step 2: Update ALL profiles to match their auth roles
UPDATE "UserProfiles"
SET "Role" = auth.users.raw_user_meta_data->>'role'
FROM auth.users
WHERE "UserProfiles"."Id" = auth.users.id::text
  AND auth.users.raw_user_meta_data->>'role' IS NOT NULL;

-- Step 3: Verify the sync
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as auth_role,
    p."Role" as profile_role,
    p."FullName",
    CASE 
        WHEN u.raw_user_meta_data->>'role' = p."Role" THEN '✓ Synced'
        ELSE '✗ Still Different'
    END as status
FROM auth.users u
LEFT JOIN "UserProfiles" p ON p."Id" = u.id::text
ORDER BY 
    CASE u.raw_user_meta_data->>'role'
        WHEN 'admin' THEN 1
        WHEN 'teacher' THEN 2
        ELSE 3
    END,
    u.email;

-- Step 4: Show final summary
SELECT 
    p."Role" as role,
    COUNT(*) as count,
    STRING_AGG(p."Email", ', ') as users
FROM "UserProfiles" p
GROUP BY p."Role"
ORDER BY 
    CASE p."Role"
        WHEN 'admin' THEN 1
        WHEN 'teacher' THEN 2
        ELSE 3
    END;
