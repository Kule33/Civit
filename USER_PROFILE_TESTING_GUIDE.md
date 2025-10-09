# User Profile Feature - Testing Guide

## Quick Start Testing

### 1. Start the Application

**Backend:**
```powershell
cd backend
dotnet run
```
The backend should start on `http://localhost:5201`

**Frontend:**
```powershell
cd frontend
npm run dev
```
The frontend should start on `http://localhost:5173`

### 2. Test Scenarios

## Scenario 1: Teacher User Profile

### Setup:
1. Login as a teacher user
2. Navigate to dashboard

### Test Steps:

#### Step 1: Access Profile from Header
- [ ] Look at the header - you should see your name/avatar
- [ ] The name box should have hover effects (scale up slightly)
- [ ] **Verify**: You should NOT see "Teacher" label in the header
- [ ] Click on your name/avatar box

**Expected Result:**
- Navigate to `/profile` page
- Profile page loads with your information

#### Step 2: View Profile Information
- [ ] Verify all fields are displayed in read-only mode:
  - Full Name
  - Email (with note "Email cannot be changed")
  - District
  - NIC Number
  - Phone Number
  - Gender
- [ ] **Verify**: Role is NOT displayed anywhere on the page
- [ ] Verify "Edit Profile" button is visible

**Expected Result:**
- All fields show correct data
- No role field visible

#### Step 3: Edit Profile
- [ ] Click "Edit Profile" button
- [ ] All editable fields should become input fields/dropdowns
- [ ] Email remains read-only
- [ ] Modify Full Name (e.g., add a middle name)
- [ ] Change District to a different district
- [ ] Click "Save Changes"

**Expected Result:**
- Loading spinner shows briefly
- Green success message appears: "Profile updated successfully!"
- Profile data refreshes with new values
- Returns to view mode

#### Step 4: Validation Testing
- [ ] Click "Edit Profile" again
- [ ] Clear the Full Name field
- [ ] Click "Save Changes"

**Expected Result:**
- Red error message shows: "Full name is required"
- Profile is NOT saved

- [ ] Enter invalid NIC (e.g., "123")
- [ ] Click "Save Changes"

**Expected Result:**
- Red error message shows: "Invalid NIC format. Use 9 digits + V or 12 digits"

- [ ] Enter invalid phone (e.g., "123")
- [ ] Click "Save Changes"

**Expected Result:**
- Red error message shows: "Phone must be +94 followed by 9 digits"

#### Step 5: Cancel Changes
- [ ] Click "Edit Profile"
- [ ] Make some changes to fields
- [ ] Click "Cancel" button

**Expected Result:**
- All fields revert to original values
- Returns to view mode
- No data is saved

#### Step 6: Navigation
- [ ] Click "Back" button at top of page

**Expected Result:**
- Navigate back to previous page (dashboard)

---

## Scenario 2: Admin User Profile

### Setup:
1. Login as an admin user
2. Navigate to any admin page

### Test Steps:

#### Step 1: Access Profile from Header
- [ ] Look at the header
- [ ] **Verify**: You SHOULD see "Administrator" label below your name
- [ ] Click on your name/avatar box

**Expected Result:**
- Navigate to `/profile` page

#### Step 2: View Profile Information
- [ ] Verify all fields are displayed
- [ ] **Verify**: "Administrator" badge is visible at top of profile
- [ ] Verify "Edit Profile" button is visible

**Expected Result:**
- Admin badge is prominently displayed
- All profile information is visible

#### Step 3: Edit Profile
- [ ] Click "Edit Profile" button
- [ ] Modify some fields
- [ ] Click "Save Changes"

**Expected Result:**
- Profile updates successfully
- Admin status remains unchanged

#### Step 4: Verify Admin Can Still Access Admin Features
- [ ] Navigate to Users page (admin/users)
- [ ] Verify you can still see all users
- [ ] Verify you can edit other users

**Expected Result:**
- All admin features still work
- Profile update didn't affect admin permissions

---

## Scenario 3: Unauthenticated Access

### Test Steps:

#### Step 1: Direct URL Access
- [ ] Logout if logged in
- [ ] Try to access `http://localhost:5173/profile` directly

**Expected Result:**
- Redirect to `/login` page
- Cannot access profile without authentication

---

## Scenario 4: Mobile Responsiveness

### Test Steps:

#### Step 1: Mobile View
- [ ] Open browser DevTools (F12)
- [ ] Switch to mobile device view (e.g., iPhone, Samsung Galaxy)
- [ ] Click on your name in header

**Expected Result:**
- Profile page is fully responsive
- All fields are readable
- Buttons are easily clickable
- Form works correctly on mobile

#### Step 2: Edit on Mobile
- [ ] Click "Edit Profile"
- [ ] Modify fields using mobile keyboard
- [ ] Save changes

**Expected Result:**
- Editing works smoothly on mobile
- Dropdowns work correctly
- Save button is accessible

---

## Scenario 5: Error Handling

### Test Steps:

#### Step 1: Network Error Simulation
- [ ] Open browser DevTools (F12) → Network tab
- [ ] Set network to "Offline"
- [ ] Try to save profile changes

**Expected Result:**
- Red error message appears
- User is informed of the error
- Data is not lost (can retry when online)

#### Step 2: Duplicate NIC
- [ ] Edit profile
- [ ] Enter a NIC that belongs to another user
- [ ] Save changes

**Expected Result:**
- Error message: "NIC already exists"
- Profile is not updated

---

## API Endpoint Testing

### Using Browser DevTools or Postman:

#### Test 1: GET /api/userprofiles/me
```
Method: GET
URL: http://localhost:5201/api/userprofiles/me
Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN>
```

**Expected Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "district": "Colombo",
  "nic": "123456789V",
  "telephoneNo": "+94771234567",
  "gender": "Male",
  "role": "teacher"
}
```

#### Test 2: PUT /api/userprofiles/me
```
Method: PUT
URL: http://localhost:5201/api/userprofiles/me
Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN>
  Content-Type: application/json
Body:
{
  "fullName": "John Michael Doe",
  "district": "Galle",
  "nic": "123456789V",
  "telephoneNo": "+94771234567",
  "gender": "Male",
  "email": "user@example.com"
}
```

**Expected Response:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "fullName": "John Michael Doe",
  "district": "Galle",
  "nic": "123456789V",
  "telephoneNo": "+94771234567",
  "gender": "Male",
  "role": "teacher"
}
```

#### Test 3: Attempt Role Change (Should Fail)
```
Method: PUT
URL: http://localhost:5201/api/userprofiles/me
Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN_FOR_TEACHER>
  Content-Type: application/json
Body:
{
  "fullName": "John Doe",
  "district": "Colombo",
  "nic": "123456789V",
  "telephoneNo": "+94771234567",
  "gender": "Male",
  "email": "user@example.com",
  "role": "admin"
}
```

**Expected Response:**
```json
{
  "message": "You cannot change your own role"
}
```
Status Code: 400 Bad Request

---

## Browser Console Checks

### Open Browser DevTools (F12) → Console

#### Check for Errors:
- [ ] No red error messages in console
- [ ] No 404 errors for missing resources
- [ ] No CORS errors
- [ ] API calls complete successfully

#### Check Network Tab:
- [ ] GET /api/userprofiles/me → 200 OK
- [ ] PUT /api/userprofiles/me → 200 OK
- [ ] Authorization header is present in requests

---

## Accessibility Testing

### Test Steps:

#### Step 1: Keyboard Navigation
- [ ] Use TAB key to navigate through profile form
- [ ] All fields should be focusable
- [ ] ENTER key should trigger Save button

**Expected Result:**
- Keyboard navigation works smoothly
- Focus indicators are visible

#### Step 2: Screen Reader
- [ ] Use browser's screen reader extension
- [ ] Navigate through profile page

**Expected Result:**
- Field labels are read correctly
- Buttons are announced properly

---

## Performance Checks

### Test Steps:

#### Step 1: Load Time
- [ ] Measure time from clicking name to profile page load
- [ ] Should be < 500ms

#### Step 2: Save Time
- [ ] Measure time from clicking Save to success message
- [ ] Should be < 1000ms

**Expected Result:**
- Fast, responsive interface
- No noticeable lag

---

## Common Issues & Solutions

### Issue 1: "Profile not found" error
**Solution:**
- Ensure user has completed profile (visited `/complete-profile`)
- Check backend logs for errors

### Issue 2: Changes not saving
**Solution:**
- Check browser console for errors
- Verify backend is running on port 5201
- Check network tab for failed API calls

### Issue 3: Role still visible for teachers
**Solution:**
- Clear browser cache
- Hard refresh (Ctrl + Shift + R)
- Check that latest Header.jsx changes are loaded

### Issue 4: Can't click on name
**Solution:**
- Verify Header.jsx has the onClick handler
- Check for JavaScript errors in console

### Issue 5: Unauthorized errors
**Solution:**
- Re-login to get fresh JWT token
- Check token expiration

---

## Success Checklist

- [ ] Teachers can access their profile by clicking name
- [ ] Teachers do NOT see their role anywhere
- [ ] Admins see "Administrator" badge
- [ ] Profile displays all user information
- [ ] Edit mode works correctly
- [ ] Form validation works
- [ ] Save updates profile successfully
- [ ] Cancel discards changes
- [ ] Back button navigates correctly
- [ ] Mobile responsive design works
- [ ] No console errors
- [ ] API endpoints return correct responses
- [ ] Security: Users can only edit their own profile
- [ ] Email field is read-only
- [ ] Success/error messages display correctly

---

## Reporting Bugs

If you find any issues, please report with:
1. User role (teacher/admin)
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Browser console errors (if any)
6. Screenshots

---

## Next Steps After Testing

Once all tests pass:
1. Commit changes to git
2. Push to feature branch
3. Create pull request
4. Request code review
5. Merge to main branch
6. Deploy to production

---

## Conclusion

This comprehensive testing guide ensures the user profile feature works correctly for all user types and scenarios. Complete all test scenarios before considering the feature production-ready.
