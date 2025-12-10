# Performance Optimization Guide

## Issues Identified

Based on backend logs analysis, we've identified these critical performance problems:

### 1. Excessive Authentication Logging ✅ FIXED
**Problem:** "[Auth] Token validated. Claims: ..." logged on every request  
**Impact:** Console spam, performance overhead  
**Solution:** Set authentication log level to "Error" in `appsettings.Development.json`

```json
"Microsoft.AspNetCore.Authentication": "Error",
"Microsoft.AspNetCore.Authorization": "Error",
"Microsoft.IdentityModel": "Error"
```

### 2. Notification Unread Count - Repeated Queries 🔄 PARTIALLY FIXED
**Problem:** Same query executed 25+ times in short period:
```sql
SELECT count(*)::int FROM "Notifications" WHERE "UserId" = @__userId_0 AND NOT ("IsRead")
```

**Current Fix:**
- Backend: 10-second IMemoryCache in `NotificationsController.GetUnreadCount()`
- Frontend: 15-second cache + request deduplication in `notificationService.js`
- Header: Polling interval increased from 30s → 60s

**Result:** This should reduce from ~25 queries to 1 query per minute

### 3. Typeset N+1 Query Problem ⚠️ **NOT YET FIXED**
**Problem:** Individual queries for each question's typeset:
```sql
SELECT t.* FROM "Typesets" WHERE "QuestionId" = @__questionId_0 AND "IsActive" LIMIT 1
-- Executed 15+ times with different QuestionIds
```

**Root Cause:** Frontend or backend loading typesets individually for each question instead of batch loading

**Impact:** If 20 questions displayed → 20 separate database queries (+ main query = 21 total)

**Solution Needed:** 
1. Include typesets in the initial question query using `.Include(q => q.Typeset)` in EF Core
2. OR create batch endpoint: `GET /api/typesets/batch?questionIds=id1,id2,id3`
3. Frontend should request all typesets in one call

### 4. Questions Query Repeated 🔍 NEEDS INVESTIGATION
**Problem:** Same questions query executed 15+ times:
```sql
SELECT q.* FROM "Questions" AS q
LEFT JOIN "Subjects" AS s ON q."SubjectId" = s."Id"
WHERE q."Id" = ANY (@__questionIds_0)
```

**Possible Causes:**
- Multiple components fetching same data
- Missing frontend caching
- Re-renders triggering duplicate API calls

**Solution:**
- Implement response caching on `QuestionsController` GET endpoints
- Use frontend request deduplication (similar to notifications)
- Check React components for unnecessary re-renders

---

## Implementation Priority

### HIGH PRIORITY (Do Now)
1. ✅ Fix authentication logging spam
2. ⚠️ Fix typeset N+1 queries (biggest performance hit)
3. Test notification caching is working properly

### MEDIUM PRIORITY (Do Soon)
4. Add response caching to `QuestionsController`
5. Implement request deduplication for question service
6. Profile frontend for unnecessary re-renders

### LOW PRIORITY (Optimization)
7. Add response caching to other GET endpoints
8. Implement Redis for distributed caching (if scaling to multiple servers)
9. Add database query logging metrics for monitoring

---

## How to Fix Typeset N+1 Problem

### Backend Solution (Recommended)

**Option A: Include Typesets in Question Query**

Edit `backend/Repositories/IQuestionRepository.cs` and implementation:

```csharp
public async Task<IEnumerable<Question>> SearchQuestionsAsync(QuestionFilterDto filter)
{
    var query = _context.Questions
        .Include(q => q.Subject)        // Already included
        .Include(q => q.Typeset)        // ADD THIS - eager load typesets
        .AsQueryable();

    // ... apply filters ...

    return await query.ToListAsync();
}
```

**Option B: Create Batch Endpoint**

Create `TypesetsController.GetBatch()`:

```csharp
[HttpGet("batch")]
[ResponseCache(Duration = 60)] // Cache for 1 minute
public async Task<IActionResult> GetTypesetsForQuestions([FromQuery] Guid[] questionIds)
{
    var typesets = await _context.Typesets
        .Where(t => questionIds.Contains(t.QuestionId) && t.IsActive)
        .GroupBy(t => t.QuestionId)
        .Select(g => g.OrderByDescending(t => t.Version).First())
        .ToDictionary(t => t.QuestionId, t => t);
    
    return Ok(typesets);
}
```

### Frontend Solution

**Update question service to batch fetch typesets:**

```javascript
// In questionService.js
export const searchQuestionsWithTypesets = async (filters) => {
  const questions = await searchQuestions(filters);
  
  if (questions.data.length === 0) return questions;
  
  // Batch fetch all typesets in one call
  const questionIds = questions.data.map(q => q.id).join(',');
  const typesets = await axios.get(
    `${API_BASE_URL}/api/typesets/batch?questionIds=${questionIds}`,
    { headers: await getAuthHeaders() }
  );
  
  // Map typesets to questions
  questions.data.forEach(q => {
    q.typeset = typesets.data[q.id] || null;
  });
  
  return questions;
};
```

---

## Monitoring Performance

### Check if Fixes Working

1. **Clear backend logs**
2. **Login and navigate to questions page**
3. **Check logs for:**
   - ❌ No authentication logging spam
   - ✅ Single notification count query (not 25+)
   - ✅ Single batch typeset query (not 15+ individual)
   - ✅ Reduced total query count

### Expected Results After All Fixes

**Before:**
- 100+ database queries on page load
- 2-3 second load time
- Excessive console logging

**After:**
- 5-10 database queries on page load (cached for subsequent loads)
- < 500ms load time
- Clean logs (errors only)

---

## Testing Checklist

- [ ] Authentication logs suppressed (only errors shown)
- [ ] Notification count cached (verify only 1 query per minute)
- [ ] Typesets loaded in batch (verify single query for all questions)
- [ ] Questions cached with ResponseCache attribute
- [ ] Frontend services using request deduplication
- [ ] Page loads within 500ms after caching

---

## Performance Best Practices Applied

1. **Server-Side Caching:** IMemoryCache for frequently accessed data
2. **Response Caching:** HTTP caching headers for GET endpoints
3. **Request Deduplication:** Prevent simultaneous duplicate requests
4. **Eager Loading:** `.Include()` to prevent N+1 queries
5. **Batch Endpoints:** Fetch multiple resources in single request
6. **Log Level Configuration:** Suppress verbose framework logs
7. **Polling Optimization:** Increased intervals (30s → 60s)

---

## Next Steps

1. **Test current notification caching** - Verify it's working
2. **Fix typeset N+1 problem** - Implement Option A (Include) or Option B (Batch)
3. **Add caching to QuestionsController** - Apply same pattern as notifications
4. **Profile frontend** - Check for unnecessary re-renders and duplicate calls
5. **Monitor production** - Set up Application Insights or similar monitoring
