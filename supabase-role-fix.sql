-- ==============================================
-- SUPABASE ROLE FIX - SQL SCRIPT
-- ==============================================
-- Run this in Supabase SQL Editor to fix admin roles

-- Step 1: Check current roles
-- This shows all users and their current roles
SELECT 
    email,
    raw_user_meta_data->>'role' as current_role,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY email;

-- Step 2: Update specific users to admin role
-- Replace 'your-admin@example.com' with actual admin emails

-- Method A: Update single user
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = 'alexshantha1@gmail.com';  -- Replace with your admin email

-- Method B: Update multiple users at once (uncomment and modify as needed)
-- UPDATE auth.users
-- SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
-- WHERE email IN (
--     'admin1@example.com',
--     'admin2@example.com',
--     'admin3@example.com'
-- );

-- Step 3: Verify the update
SELECT 
    email,
    raw_user_meta_data->>'role' as role_after_update,
    raw_user_meta_data
FROM auth.users
WHERE email IN ('alexshantha1@gmail.com')  -- Replace with your admin email
ORDER BY email;

-- Step 4: Check all users again to confirm
SELECT 
    email,
    raw_user_meta_data->>'role' as role,
    CASE 
        WHEN raw_user_meta_data->>'role' = 'admin' THEN '✓ Admin'
        WHEN raw_user_meta_data->>'role' = 'teacher' THEN '✓ Teacher'
        ELSE '✗ No Role Set'
    END as status
FROM auth.users
ORDER BY 
    CASE raw_user_meta_data->>'role' 
        WHEN 'admin' THEN 1
        WHEN 'teacher' THEN 2
        ELSE 3
    END,
    email;

-- ==============================================
-- OPTIONAL: Set default role for ALL existing users without role
-- ==============================================
-- This sets 'teacher' as default for any user without a role
UPDATE auth.users
SET raw_user_meta_data = 
    CASE 
        WHEN raw_user_meta_data IS NULL THEN '{"role": "teacher"}'::jsonb
        WHEN raw_user_meta_data->>'role' IS NULL THEN raw_user_meta_data || '{"role": "teacher"}'::jsonb
        ELSE raw_user_meta_data
    END
WHERE raw_user_meta_data->>'role' IS NULL;

-- ==============================================
-- OPTIONAL: Create trigger for new user signups
-- ==============================================
-- This automatically sets role to "teacher" for all new signups

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set role if it doesn't already exist
  IF NEW.raw_user_meta_data IS NULL THEN
    NEW.raw_user_meta_data = '{"role": "teacher"}'::jsonb;
  ELSIF NEW.raw_user_meta_data->>'role' IS NULL THEN
    NEW.raw_user_meta_data = NEW.raw_user_meta_data || '{"role": "teacher"}'::jsonb;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS on_auth_user_created_set_role ON auth.users;

CREATE TRIGGER on_auth_user_created_set_role
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Verify trigger was created
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created_set_role';
