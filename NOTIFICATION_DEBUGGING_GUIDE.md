# Notification System Debugging Guide

## Issue: Notifications not appearing after generating paper

### Step-by-Step Debug Checklist

#### 1. Test Backend API Endpoints

**Test 1: Create a test notification**
```bash
# Open your browser console (F12) and run:
fetch('http://localhost:5054/api/notifications/test', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(d => console.log('Test notification created:', d))
.catch(e => console.error('Error:', e));
```

**Expected:** Should return `{ message: "Test notification created successfully", notification: {...} }`

**Test 2: Check unread count**
```javascript
fetch('http://localhost:5054/api/notifications/unread-count', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(d => console.log('Unread count:', d))
.catch(e => console.error('Error:', e));
```

**Expected:** Should return `{ unreadCount: 1 }` (or more)

**Test 3: Get notifications list**
```javascript
fetch('http://localhost:5054/api/notifications', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(d => console.log('Notifications:', d))
.catch(e => console.error('Error:', e));
```

**Expected:** Should return list of notifications

---

#### 2. Check Frontend State

**Open browser console and check:**

```javascript
// 1. Check if Header component has notification state
console.log('Notifications loaded:', window.location);

// 2. Force refresh unread count
import { getUnreadCount } from './services/notificationService';
getUnreadCount().then(data => console.log('Unread:', data));

// 3. Check localStorage for token
console.log('Token:', localStorage.getItem('token'));
```

---

#### 3. Common Issues & Solutions

### Issue A: Backend not creating notifications
**Symptoms:**
- API calls return 200 OK
- But database has no notifications

**Check:**
1. Open database and run: `SELECT * FROM "Notifications" ORDER BY "CreatedAt" DESC LIMIT 10;`
2. Check backend logs for "Notification sent" messages
3. Verify INotificationService is injected properly

**Solution:**
- Check backend console/logs for errors
- Verify notification service registration in Program.cs

---

### Issue B: Frontend not fetching notifications
**Symptoms:**
- Notifications exist in database
- But UI shows 0 or doesn't update

**Check:**
1. Open browser Network tab (F12)
2. Look for calls to `/api/notifications/unread-count`
3. Check if polling is running (should happen every 30 seconds)

**Solution:**
```javascript
// Check if useEffect is running in Header.jsx
// Add this temporarily:
useEffect(() => {
  console.log('Header mounted, starting notification polling');
  // ... rest of code
}, []);
```

---

### Issue C: CORS or Authentication errors
**Symptoms:**
- Network tab shows 401 Unauthorized or CORS errors

**Check:**
1. Browser console for CORS errors
2. Network tab Response for error messages
3. Token validity: `jwt.io` and paste your token

**Solution:**
- Check API_BASE_URL in notificationService.js
- Verify token is not expired
- Check CORS configuration in backend Program.cs

---

### Issue D: Badge not updating
**Symptoms:**
- Notifications exist
- Can see them in dropdown
- But badge count stays at 0

**Check:**
1. Console log in Header.jsx: `console.log('Unread count:', unreadCount);`
2. Check if polling interval is running
3. Verify state updates

**Solution:**
```javascript
// In Header.jsx, add debug logs:
const fetchUnreadCount = async () => {
  console.log('Fetching unread count...');
  const data = await getUnreadCount();
  console.log('Got unread count:', data.unreadCount);
  setUnreadCount(data.unreadCount);
};
```

---

## Quick Test Procedure

### Test 1: Manual Notification Creation
1. Open browser console (F12)
2. Run test notification API call (see Test 1 above)
3. **Expected:** Badge should update within 30 seconds
4. Click bell icon
5. **Expected:** See "Test Notification" in dropdown

### Test 2: Generate Paper
1. Go to Paper Builder
2. Generate a paper
3. Wait 30 seconds
4. **Expected:** Badge count increases
5. Click bell icon
6. **Expected:** See "Paper Generated Successfully"

### Test 3: Check Database Directly
```sql
-- Connect to your Supabase PostgreSQL database
SELECT 
  "Id", 
  "UserId", 
  "Type", 
  "Title", 
  "Message", 
  "IsRead", 
  "CreatedAt"
FROM "Notifications"
ORDER BY "CreatedAt" DESC
LIMIT 20;
```

**Expected:** Should see notification records

---

## Most Likely Issues

### 1. Backend Port Mismatch
**Check:** Is backend running on `http://localhost:5054`?
**Fix:** Update `API_BASE_URL` in `notificationService.js`

### 2. Token Not Sent
**Check:** Network tab → Request Headers → Authorization header present?
**Fix:** Verify `localStorage.getItem('token')` returns valid token

### 3. UserId Mismatch
**Check:** UserId in notification vs UserId in token
**Fix:** Console log: `User.FindFirst(ClaimTypes.NameIdentifier)?.Value`

### 4. Polling Not Running
**Check:** Console should show network requests every 30 seconds
**Fix:** Verify Header component is mounted and useEffect runs

---

## Backend Logs to Check

Look for these log messages:
- ✅ `"Notification sent for user {userId}"`
- ✅ `"Admin notification sent for new user: {userName}"`
- ✅ `"Notifications sent for paper generation by {userName}"`
- ❌ `"Failed to send notification"` (error)

---

## Still Not Working?

### Nuclear Option - Complete Reset:

1. **Stop everything:**
   ```bash
   # Stop backend
   Get-Process -Name "dotnet" | Stop-Process -Force
   
   # Stop frontend
   Get-Process -Name "node" | Stop-Process -Force
   ```

2. **Clear database notifications:**
   ```sql
   DELETE FROM "Notifications";
   ```

3. **Rebuild backend:**
   ```bash
   cd backend
   dotnet clean
   dotnet build
   dotnet run
   ```

4. **Restart frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

5. **Clear browser cache:**
   - Press Ctrl+Shift+Delete
   - Clear "Cached images and files"
   - Reload page (Ctrl+F5)

6. **Test again with manual API call**

---

## Need More Help?

Share these details:
1. Browser console errors (screenshot)
2. Network tab showing `/api/notifications` requests
3. Backend console output
4. Database query result: `SELECT COUNT(*) FROM "Notifications";`
5. Your API_BASE_URL value

---

Generated: October 8, 2025
Status: Debugging notification system
