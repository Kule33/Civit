# User Profile System - Testing Guide

## Overview
Complete implementation of user profile management system with Supabase UUID as primary key, mandatory profile completion, and admin management features.

## What Was Implemented

### Backend (.NET 8 + EF Core)
1. **UserProfile Model** (`backend/Models/UserProfile.cs`)
   - Primary Key: `string Id` (Supabase UUID from JWT)
   - Fields: Email, FullName, District, NIC (unique), TelephoneNo, Gender, Role
   - Default Role: "teacher"
   - Validation: Required fields, string lengths, regex for NIC/phone

2. **Repository Layer** (`backend/Repositories/`)
   - IUserProfileRepository interface
   - UserProfileRepository implementation
   - Methods: GetByIdAsync, GetByEmailAsync, CreateAsync, UpdateAsync, etc.

3. **Service Layer** (`backend/Services/`)
   - UserProfileService with business logic
   - Validation for NIC (9V/X or 12 digits), Phone (+94XXXXXXXXX)
   - 25 Sri Lankan districts hardcoded
   - DTOs: UserProfileDto, CreateUserProfileDto, UpdateUserProfileDto

4. **API Controller** (`backend/Controllers/UserProfilesController.cs`)
   - GET /api/userprofiles/me - Get own profile
   - POST /api/userprofiles - Create profile (extracts UUID from JWT)
   - PUT /api/userprofiles/{id} - Update profile
   - GET /api/userprofiles - Get all profiles (admin only)
   - GET /api/userprofiles/{id} - Get profile by ID (admin only)
   - PUT /api/userprofiles/{id}/role - Change user role (admin only)
   - DELETE /api/userprofiles/{id} - Delete profile (admin only)

5. **Database Migration**
   - Migration: 20251007143321_AddUserProfilesWithSupabaseUUID
   - Table: UserProfiles with varchar(36) Id, unique index on NIC, index on Email
   - Status: ✅ Successfully applied

### Frontend (React + Vite)
1. **User Service** (`frontend/src/services/userService.js`)
   - API client with axios + Supabase JWT auth
   - Functions: getMyProfile, createProfile, updateProfile, getAllProfiles, getProfileById, changeUserRole
   - Error handling for 404, 409, 403, 400 status codes

2. **Auth Context Update** (`frontend/src/context/AuthProvider.jsx`)
   - Added userProfile state
   - Added profileLoading state
   - Fetches profile after auth change
   - Handles 404 gracefully (no profile yet)
   - refreshProfile() function

3. **Complete Profile Page** (`frontend/src/routes/CompleteProfile.jsx`)
   - Mandatory post-registration form
   - Fields: Full Name, District (dropdown of 25), NIC, Telephone, Gender
   - Client-side validation with helper text
   - Redirects to dashboard after creation
   - Calls refreshProfile() to update auth context

4. **Admin Users Page** (`frontend/src/routes/Admin/Users.jsx`)
   - Statistics cards: Total Users, Admins, Teachers, Complete Profiles
   - Search by name/email/NIC
   - Filter by district/gender/role
   - Table with pagination (10 per page)
   - NIC masking: XXX-XXXX-XXX
   - Phone masking: +94XX-XXX-XX67
   - Relative timestamps with date-fns
   - Modals: View (read-only), Edit (update fields), Change Role (admin/teacher)

5. **Navigation Updates**
   - Header: Added "Users" link (admin only), displays full name instead of email
   - App.jsx: Added /complete-profile and /admin/users routes
   - LoginPage: Checks profile after login, redirects to /complete-profile if 404

## Build Status
- ✅ Backend: 0 warnings, 0 errors
- ✅ Frontend: Built successfully (chunk size warning is normal)

## Testing Checklist

### New User Flow
- [ ] Sign up with email/password
- [ ] Check email for confirmation link (if enabled)
- [ ] Log in after confirmation
- [ ] Should redirect to `/complete-profile`
- [ ] Fill all fields with validation:
  - Full Name: Only letters and spaces
  - District: Select from 25 districts
  - NIC: 123456789V or 123456789012
  - Phone: +94771234567
  - Gender: Male/Female/Other
- [ ] Submit form
- [ ] Should redirect to dashboard
- [ ] Header should show full name (not email)

### Existing User Without Profile
- [ ] Log in with existing account
- [ ] Should redirect to `/complete-profile`
- [ ] Complete profile as above
- [ ] Verify profile saved

### Teacher Role
- [ ] Log in as teacher
- [ ] Access dashboard ✅
- [ ] Try to access `/admin/users` - Should get 403 or redirect ❌
- [ ] Header should NOT show "Users" link

### Admin Role
- [ ] Log in as admin
- [ ] Header should show "Users" link
- [ ] Click "Users" link → Navigate to `/admin/users`
- [ ] Verify statistics cards show correct counts
- [ ] Test search: Enter name/email/NIC
- [ ] Test filters: District, Gender, Role
- [ ] Verify NIC is masked in table (XXX-XXXX-XXX)
- [ ] Verify phone is masked (+94XX-XXX-XX67)
- [ ] Click "View" on a user:
  - Modal shows full unmasked details
  - All fields read-only
- [ ] Click "Edit" on a user:
  - Modal allows editing all fields except email
  - Save changes
  - Verify updated in table
- [ ] Click "Change Role" on a user:
  - Select new role (admin/teacher)
  - Confirm change
  - Verify role updated in table and statistics

### Validation Testing
- [ ] Try creating profile with invalid NIC (e.g., 12345)
- [ ] Try creating profile with invalid phone (e.g., 0771234567)
- [ ] Try creating profile with duplicate NIC
- [ ] Try updating profile with invalid data
- [ ] Verify error messages display correctly

### Edge Cases
- [ ] Log out and log in again - profile should persist
- [ ] Refresh page on /complete-profile - should still work
- [ ] Refresh page on /admin/users - data should reload
- [ ] Test pagination: Create 15+ profiles, verify next/prev buttons
- [ ] Test sorting if implemented

## API Endpoints to Test with Postman/Thunder Client

### Get Own Profile
```http
GET http://localhost:5201/api/userprofiles/me
Authorization: Bearer {JWT_TOKEN}
```

### Create Profile
```http
POST http://localhost:5201/api/userprofiles
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "email": "test@example.com",
  "fullName": "John Doe",
  "district": "Colombo",
  "nic": "123456789V",
  "telephoneNo": "+94771234567",
  "gender": "Male"
}
```

### Get All Profiles (Admin Only)
```http
GET http://localhost:5201/api/userprofiles
Authorization: Bearer {ADMIN_JWT_TOKEN}
```

### Change Role (Admin Only)
```http
PUT http://localhost:5201/api/userprofiles/{id}/role
Authorization: Bearer {ADMIN_JWT_TOKEN}
Content-Type: application/json

{
  "role": "admin"
}
```

## Known Issues / Notes
- ⚠️ Existing 4 Supabase users need profiles added manually
- ⚠️ ESLint warning about unused 'index' in Header.jsx (cosmetic)
- ℹ️ Frontend chunk size warning is expected for large builds
- ℹ️ Backend never trusts client-provided ID/role - extracts from JWT
- ℹ️ All new users default to "teacher" role for security

## Next Steps After Testing
1. Add profiles for 4 existing Supabase users via admin interface
2. Test WhatsApp notification integration (future feature)
3. Add profile completion progress indicator
4. Add profile picture upload (optional)
5. Add audit logging for role changes
6. Add email notifications for role changes
7. Add bulk user import (CSV) feature
8. Add user activity tracking

## Database Schema Reference

### UserProfiles Table
```sql
CREATE TABLE "UserProfiles" (
    "Id" character varying(36) NOT NULL PRIMARY KEY,  -- Supabase UUID
    "Email" character varying(255) NOT NULL,
    "FullName" character varying(100) NOT NULL,
    "District" character varying(50) NOT NULL,
    "NIC" character varying(12) NOT NULL UNIQUE,      -- 9+1 or 12 digits
    "TelephoneNo" character varying(15) NOT NULL,     -- +94XXXXXXXXX
    "Gender" character varying(10) NOT NULL,          -- Male/Female/Other
    "Role" character varying(20) NOT NULL DEFAULT 'teacher',  -- teacher/admin
    "CreatedAt" timestamp without time zone NOT NULL,
    "UpdatedAt" timestamp without time zone NOT NULL
);

CREATE INDEX "IX_UserProfiles_Email" ON "UserProfiles" ("Email");
CREATE UNIQUE INDEX "IX_UserProfiles_NIC" ON "UserProfiles" ("NIC");
```

## Sri Lankan Districts Supported
Ampara, Anuradhapura, Badulla, Batticaloa, Colombo, Galle, Gampaha, Hambantota, Jaffna, Kalutara, Kandy, Kegalle, Kilinochchi, Kurunegala, Mannar, Matale, Matara, Monaragala, Mullaitivu, Nuwara Eliya, Polonnaruwa, Puttalam, Ratnapura, Trincomalee, Vavuniya

---
**Implementation Date:** January 2025  
**Status:** ✅ Complete - Ready for Testing  
**Build Status:** ✅ Backend: 0 errors | ✅ Frontend: Built successfully
