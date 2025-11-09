# Manual Testing Guide: Team Session Dynamic Route with Roster Lock

This guide provides simple instructions for manually testing the team session page with roster lock functionality.

## Prerequisites

1. **Database Setup**: Ensure you have a working database with:
   - Athletes data loaded
   - At least one active game configured
   - Optional: A roster lock time set for testing

2. **Local Development**:
   ```bash
   npm install
   vercel env pull  # Pull environment variables
   vercel dev       # Start local dev server
   ```

## Test Scenario 1: Create New Team Session

### Steps:
1. Navigate to home page: `http://localhost:3000`
2. Click "Create Team" button
3. Enter a team name (e.g., "Test Runners")
4. Click "Create Team" to generate session
5. You should be redirected to `/team/[session-token]`

### Expected Results:
✅ Page loads with your team name displayed
✅ Budget shows $30,000 remaining
✅ All 6 slots (M1-M3, W1-W3) are empty
✅ Slots show "Tap to select athlete" placeholder
✅ Submit button is disabled with text "Fill all slots first"
✅ Athlete pool count is displayed (e.g., "150 elite athletes available")

## Test Scenario 2: Select Athletes and Build Roster

### Steps:
1. Click on slot M1 (first men's slot)
2. Athlete selection modal should open
3. Use search to find an athlete (e.g., "Kipchoge")
4. Click on an athlete card to select
5. Modal closes and athlete appears in M1 slot
6. Repeat for all 6 slots (M1-M3, W1-W3)

### Expected Results:
✅ Modal opens filtered to correct gender (men for M slots, women for W slots)
✅ Athletes are sorted by rank by default
✅ Search filters athletes by name/country
✅ Selected athlete shows in slot with:
  - Name, country flag, PB time
  - Salary amount
  - Remove button (×)
✅ Budget updates after each selection
✅ Cannot select same athlete twice (shows "Already in roster")
✅ Cannot select athlete if budget insufficient (shows "Cannot afford")

## Test Scenario 3: Budget Validation

### Steps:
1. Select athletes totaling more than $30,000
2. Observe budget tracker
3. Try to select an expensive athlete when budget is low

### Expected Results:
✅ Budget progress bar fills as you add athletes
✅ Budget remaining shows correct amount
✅ When over budget:
  - Budget number turns red
  - Progress bar turns red
  - Validation error appears: "Over budget by $X"
✅ Athletes you cannot afford show "Cannot afford" restriction
✅ When roster complete and budget valid:
  - Green success message: "✓ Team is ready to submit"
  - Submit button becomes enabled

## Test Scenario 4: Remove and Replace Athletes

### Steps:
1. Build a partial roster with 3-4 athletes
2. Click the × button on one athlete
3. Select a different athlete for that slot

### Expected Results:
✅ Remove button removes athlete immediately
✅ Budget updates when athlete removed
✅ Slot returns to empty state
✅ Can select different athlete for same slot
✅ Budget recalculates correctly

## Test Scenario 5: Roster Lock - Before Lock Time

### Prerequisites:
Set a roster lock time in the future:
```sql
UPDATE games 
SET roster_lock_time = NOW() + INTERVAL '1 hour'
WHERE game_id = 'default';
```

### Steps:
1. Access your team session page
2. Observe the roster lock notice

### Expected Results:
✅ Yellow warning banner appears at top
✅ Message shows: "⏰ Roster locks at [date/time]"
✅ Can still edit roster
✅ All functionality works normally

## Test Scenario 6: Roster Lock - After Lock Time

### Prerequisites:
Set a roster lock time in the past:
```sql
UPDATE games 
SET roster_lock_time = NOW() - INTERVAL '1 hour'
WHERE game_id = 'default';
```

### Steps:
1. Refresh your team session page
2. Try to click on slots
3. Try to remove athletes

### Expected Results:
✅ Red locked banner appears: "🔒 Roster locked as of [date/time]"
✅ Cannot click on slots to open athlete modal
✅ Remove buttons (×) do not appear
✅ Submit button is disabled with text "Roster Locked"
✅ Roster is view-only but displays correctly
✅ Budget tracker still shows but is not interactive

## Test Scenario 7: Submit Complete Roster

### Prerequisites:
Ensure roster lock time is in future or null

### Steps:
1. Fill all 6 slots with athletes
2. Ensure total cost ≤ $30,000
3. Click "Submit Team" button
4. Confirm submission dialog (if any)

### Expected Results:
✅ Submit button becomes enabled when roster valid
✅ Success message appears after submission
✅ Redirected to leaderboard page (`/leaderboard`)
✅ Can view your submitted team on leaderboard

## Test Scenario 8: Reload Page with Existing Roster (SSR)

### Steps:
1. Submit a roster following Scenario 7
2. Copy the session URL from browser
3. Close browser or open incognito window
4. Paste session URL and press Enter

### Expected Results:
✅ Page loads with roster already populated (no loading state)
✅ All 6 slots show selected athletes immediately
✅ Budget displays correct spent/remaining amounts
✅ Lock status displays correctly if lock time is set
✅ No duplicate API calls (check Network tab)
✅ HTML source (View Page Source) shows populated slots

## Test Scenario 9: Invalid Session Handling

### Steps:
1. Navigate to `/team/invalid-token-123`
2. Observe error handling

### Expected Results:
✅ Error page displays: "Session Error"
✅ Message: "Invalid or expired session"
✅ "Return to Home" button is available
✅ Clicking button navigates back to home page

## Test Scenario 10: Mobile Responsiveness

### Steps:
1. Open Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test on various device sizes:
   - iPhone SE (375px)
   - iPhone 12 Pro (390px)
   - iPad (768px)

### Expected Results:
✅ Slots stack vertically on mobile
✅ Athlete modal is full-width on mobile
✅ Budget tracker is readable and compact
✅ All buttons are touch-friendly (min 44px height)
✅ Search and sort controls stack on mobile
✅ No horizontal scrolling required

## Test Scenario 11: Athlete Search and Sort

### Steps:
1. Open athlete selection modal
2. Type in search box (e.g., "Kenya")
3. Change sort dropdown to different options
4. Test each sort option:
   - Sort by Rank
   - Sort by Name
   - Sort by Salary
   - Sort by PB

### Expected Results:
✅ Search filters results in real-time
✅ Can search by athlete name or country
✅ Sort by Rank: Athletes ordered by marathon rank
✅ Sort by Name: Alphabetical order
✅ Sort by Salary: Highest to lowest
✅ Sort by PB: Fastest to slowest
✅ Empty state message when no results: "No athletes found matching [query]"

## Test Scenario 12: Concurrent Edits (Multi-Device)

### Steps:
1. Open session in two different browsers/devices
2. Edit roster in first browser
3. Refresh second browser

### Expected Results:
✅ Changes persist across browser refreshes
✅ Most recent submission overwrites previous
✅ No data loss or corruption
⚠️ Note: Real-time sync not implemented - manual refresh required

## Test Scenario 13: Performance Testing

### Steps:
1. Open Chrome DevTools > Network tab
2. Load team session page
3. Note number of requests and load time
4. Check Lighthouse performance score

### Expected Results:
✅ Page loads in < 3 seconds on 3G connection
✅ No duplicate API calls (verify in Network tab)
✅ SSR reduces Time to First Contentful Paint
✅ Athletes, game state, roster fetched server-side
✅ Client-side JavaScript hydrates existing content

## Common Issues and Fixes

### Issue: Modal doesn't open
**Fix**: Check console for errors. Ensure athletes data loaded.

### Issue: Budget not updating
**Fix**: Check that athletes have valid salary values in database.

### Issue: Cannot select athlete
**Fix**: Verify athlete is not already in roster and budget is sufficient.

### Issue: Lock notice not showing
**Fix**: Check that `roster_lock_time` is set in games table.

### Issue: Page shows loading forever
**Fix**: Check DATABASE_URL is set. Check API endpoints are responding.

## Automated Test Commands

Run these to verify code integrity:

```bash
# Run budget utility tests
node tests/budget-utils.test.js

# Run SSR integration tests
node tests/team-session-ssr.test.js

# Run all tests
npm test

# Build for production
npm run build
```

## Database Queries for Testing

### Check roster lock time:
```sql
SELECT game_id, roster_lock_time, results_finalized 
FROM games 
WHERE game_id = 'default';
```

### View submitted rosters:
```sql
SELECT * FROM salary_cap_teams 
WHERE game_id = 'default' 
ORDER BY player_code;
```

### Set lock time 1 hour from now:
```sql
UPDATE games 
SET roster_lock_time = NOW() + INTERVAL '1 hour'
WHERE game_id = 'default';
```

### Set lock time 1 hour ago (locked):
```sql
UPDATE games 
SET roster_lock_time = NOW() - INTERVAL '1 hour'
WHERE game_id = 'default';
```

### Clear lock time (no lock):
```sql
UPDATE games 
SET roster_lock_time = NULL
WHERE game_id = 'default';
```

## Success Criteria Checklist

After completing all test scenarios, verify:

- [ ] SSR fetches and displays data server-side
- [ ] No duplicate API calls on page load
- [ ] Roster lock prevents editing after lock time
- [ ] Budget calculations are accurate
- [ ] All 6 slots can be filled
- [ ] Cannot submit invalid roster
- [ ] Can submit valid roster
- [ ] Existing roster loads on refresh
- [ ] Invalid session shows error
- [ ] Mobile responsive on all screen sizes
- [ ] Search and sort work correctly
- [ ] No security vulnerabilities (CodeQL passed)
- [ ] No console errors or warnings
- [ ] Build succeeds without errors

## Notes

- Test with real athlete data for best results
- Use Chrome DevTools for debugging
- Check Network tab to verify SSR and no duplicate calls
- Test on multiple browsers (Chrome, Firefox, Safari)
- Test on actual mobile devices when possible
- Monitor console for errors throughout testing

---

**Testing Complete?** If all scenarios pass, the implementation meets acceptance criteria! 🎉
