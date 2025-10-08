# ✨ USER ACTIVITY STATISTICS FEATURE

## Overview

Added comprehensive user activity tracking to the Users Management section, showing paper generation statistics and recent activity for each user.

---

## What's New

### Backend API Endpoint
- **New Endpoint:** `GET /api/userprofiles/{id}/activity`
- **Auth:** Admin only
- **Returns:** User activity statistics

### Frontend Enhancement
- Enhanced **View User Modal** with activity statistics
- Shows paper generation metrics
- Displays recent papers
- Real-time activity tracking

---

## Features

### 📊 Activity Statistics Displayed:

1. **📄 Total Papers Generated**
   - Count of all papers created by the user
   - Displayed in blue badge

2. **✅ Total Questions Used**
   - Sum of all questions across all papers
   - Displayed in green badge

3. **🕐 Last Activity**
   - When the user last generated a paper
   - Shown as relative time (e.g., "2 days ago")
   - Displayed in purple badge

4. **📝 Recent Papers (Last 5)**
   - Paper title or ID
   - Number of questions
   - Generation date
   - Listed in chronological order

---

## Files Modified

### Backend:

1. **`backend/DTOs/UserActivityStatsDto.cs`** (NEW)
   - DTO for activity statistics
   - Includes paper summaries

2. **`backend/Repositories/Interfaces/IPaperGenerationRepository.cs`**
   - Added `GetUserStatsAsync()` method

3. **`backend/Repositories/PaperGenerationRepository.cs`**
   - Implemented statistics calculation
   - Aggregates data from PaperGenerations table

4. **`backend/Controllers/UserProfilesController.cs`**
   - Added dependency injection for `IPaperGenerationRepository`
   - New endpoint: `GET /api/userprofiles/{id}/activity`

### Frontend:

5. **`frontend/src/services/userService.js`**
   - Added `getUserActivity(userId)` function
   - Fetches activity stats from backend

6. **`frontend/src/routes/Admin/Users.jsx`**
   - Enhanced ViewUserModal component
   - Added activity statistics display
   - Added loading states
   - Improved UI with stats cards

---

## How It Works

### Data Flow:

```
1. Admin clicks "View" on a user
   ↓
2. ViewUserModal opens and loads
   ↓
3. Calls getUserActivity(userId)
   ↓
4. Backend queries PaperGenerations table
   ↓
5. Calculates statistics:
   - COUNT(*) for total papers
   - SUM(TotalQuestions) for questions used
   - MAX(GeneratedAt) for last activity
   - TOP 5 for recent papers
   ↓
6. Returns UserActivityStatsDto
   ↓
7. Frontend displays in beautiful cards
```

### Statistics Calculation:

```csharp
// Backend logic
public async Task<(int, int, DateTime?, DateTime?)> GetUserStatsAsync(string teacherId)
{
    var userPapers = await _context.PaperGenerations
        .Where(pg => pg.TeacherId == teacherId)
        .ToListAsync();

    var totalPapers = userPapers.Count;
    var totalQuestions = userPapers.Sum(pg => pg.TotalQuestions);
    var lastGenerated = userPapers.Max(pg => pg.GeneratedAt);
    var firstGenerated = userPapers.Min(pg => pg.GeneratedAt);

    return (totalPapers, totalQuestions, lastGenerated, firstGenerated);
}
```

---

## UI Design

### Activity Stats Section:

```
┌─────────────────────────────────────────────────┐
│  📊 Activity Statistics                         │
├─────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │   📄     │  │   ✅     │  │   🕐     │     │
│  │ Papers   │  │Questions │  │  Last    │     │
│  │   25     │  │   450    │  │2 days ago│     │
│  └──────────┘  └──────────┘  └──────────┘     │
│                                                 │
│  Recent Papers:                                 │
│  • Advanced Math Paper - 20Q - 2 days ago      │
│  • Physics Quiz - 15Q - 5 days ago             │
│  • Chemistry Test - 25Q - 1 week ago           │
└─────────────────────────────────────────────────┘
```

### Color Scheme:
- **Papers**: Blue (`bg-blue-50`, `text-blue-600`)
- **Questions**: Green (`bg-green-50`, `text-green-600`)
- **Last Activity**: Purple (`bg-purple-50`, `text-purple-600`)

---

## Testing

### 1. Stop Backend (if running)
```powershell
# Find terminal with backend, press Ctrl+C
```

### 2. Rebuild Backend
```powershell
cd backend
dotnet build
```

### 3. Start Backend
```powershell
dotnet run
```

### 4. Test in Frontend

**Step 1:** Go to Users Management page

**Step 2:** Click "View" (eye icon) on any user

**Step 3:** View User Modal should show:
- Profile information (top)
- Activity Statistics (middle)
  - Papers Generated count
  - Questions Used count
  - Last Activity time
  - Recent Papers list
- Account dates (bottom)

### Expected Behavior:

**For Active Users:**
```
Papers Generated: 15
Questions Used: 350
Last Activity: 2 days ago
Recent Papers: (list of 5)
```

**For Inactive Users:**
```
Papers Generated: 0
Questions Used: 0
Last Activity: Never
No activity data available
```

---

## API Response Example

```json
{
  "totalPapersGenerated": 15,
  "totalQuestionsUsed": 350,
  "lastPaperGeneratedAt": "2025-10-06T14:30:00Z",
  "firstPaperGeneratedAt": "2025-09-01T10:15:00Z",
  "recentPapers": [
    {
      "id": 123,
      "paperTitle": "Advanced Math Paper",
      "totalQuestions": 20,
      "generatedAt": "2025-10-06T14:30:00Z"
    },
    {
      "id": 122,
      "paperTitle": "Physics Quiz",
      "totalQuestions": 15,
      "generatedAt": "2025-10-03T09:00:00Z"
    }
  ]
}
```

---

## Benefits

✅ **Better User Insights**
- See who's actively using the system
- Identify power users
- Track engagement metrics

✅ **Activity Monitoring**
- Monitor paper generation trends
- See recent activity at a glance
- Identify inactive users

✅ **Data-Driven Decisions**
- Understand usage patterns
- Plan system capacity
- Target user support

✅ **Professional UI**
- Beautiful statistics cards
- Color-coded metrics
- Responsive design

---

## Future Enhancements (Optional)

### Phase 2:
- 📊 Activity charts/graphs
- 📅 Date range filters
- 📈 Trend analysis
- 🏆 Top users leaderboard
- 📧 Export activity reports

### Phase 3:
- 📱 Activity dashboard widget
- 🔔 Activity notifications
- 📊 Comparative analytics
- 🎯 Usage goals/targets

---

## Current Status

✅ Backend endpoint created
✅ Frontend service added
✅ UI component enhanced
⏳ Backend needs rebuild
⏳ Testing pending

---

## Next Steps

1. **Stop backend** (Ctrl+C in terminal)
2. **Rebuild**: `cd backend; dotnet build`
3. **Start**: `dotnet run`
4. **Test**: Open Users page, click View on any user
5. **Verify**: Activity stats should appear!

---

## Summary

You now have a complete user activity tracking system that shows:
- How many papers each user has generated
- How many questions they've used
- When they last generated a paper
- Their recent paper history

All displayed in a beautiful, color-coded UI that loads instantly! 🎉
