# Manual Testing Checklist - Commissioner Panel Modularization (PR #108)

**Context:** Modularization of commissioner dashboard into dynamic, independently-loadable React components with state events and centralized API client.

**PR #108 Changes:**
- Created 3 new panel components: `ResultsManagementPanel`, `AthleteManagementPanel`, `TeamsOverviewPanel`
- Implemented dynamic imports with `next/dynamic` for on-demand loading
- Added skeleton loaders for loading states
- Integrated state event system (`resultsUpdated`, `athleteUpdated`)
- Automatic cache invalidation when results update
- All panels use centralized `apiClient` (no raw fetch calls)

**Test Environment:**
- Next.js development server (`vercel dev`)
- Browser with DevTools console open
- Commissioner authentication required

---

## Test 1: Commissioner Dashboard Navigation

**Purpose:** Verify panel navigation and dynamic loading works

### Steps:
1. Start development server: `vercel dev`
2. Navigate to commissioner dashboard (`/commissioner`)
3. Log in with commissioner credentials (TOTP)
4. Observe three panel tabs/buttons: "Results Management", "Athlete Management", "Teams Overview"
5. Click each tab to switch between panels
6. Watch DevTools Network tab for chunk loading

**Note:** In development mode, Next.js may bundle components together for faster hot reload. For full code splitting verification, test in production mode (see Test 9).

### Expected Results:
- ✅ Three panel options visible in dashboard
- ✅ Skeleton loader appears briefly when switching panels (may be very fast in dev)
- ✅ Panel switching is smooth without full page reload
- ✅ No console errors
- ⚠️ Chunk loading may not be visible in dev mode (expected behavior)

### Actual Results:
- [x] Pass
- [ ] Fail (describe issue):

---

## Test 2: Results Management Panel

**Purpose:** Verify results entry and update functionality works in new panel

### Steps:
1. Navigate to "Results Management" panel
2. Observe athlete list with input fields for:
   - Finish time
   - Position
   - Split times (5K, 10K, half, 30K, 35K, 40K)
3. Enter test result for one athlete
4. Click "Update Results" button
5. Watch console for state event emission
6. Check if other panels reflect the update

### Expected Results:
- ✅ Panel loads with current results (or empty if none)
- ✅ All input fields functional and accepting valid time formats
- ✅ "Update Results" button saves changes
- ✅ Console shows: `resultsUpdated` event dispatched
- ✅ Success message displayed after save
- ✅ No raw `fetch()` calls (check Network tab - should use API client)

### Actual Results:
- [x] Pass
- [ ] Fail (describe issue):

---

## Test 3: Athlete Management Panel

**Purpose:** Verify athlete CRUD operations work in new panel

### Steps:
1. Navigate to "Athlete Management" panel
2. Verify athlete list displays with:
   - Name, Country, Gender, PB, WA ID, Confirmed status
3. Test filter buttons: All / Men / Women
4. Test search box with athlete name
5. Click "Add Athlete" button
6. Fill in form and submit
7. Edit an existing athlete
8. Toggle "Confirmed" checkbox for an athlete

### Expected Results:
- ✅ Athlete table displays with all data columns
- ✅ Filter buttons work (All/Men/Women)
- ✅ Search filters athletes by name or country
- ✅ "Add Athlete" modal opens with form
- ✅ New athlete saves successfully
- ✅ Edit modal opens pre-filled with athlete data
- ✅ Updates save successfully
- ✅ Confirmation toggle works
- ✅ Console shows: `athleteUpdated` events dispatched
- ✅ No raw `fetch()` calls

### Actual Results:
- [x] Pass
- [ ] Fail (describe issue):

---

## Test 4: Teams Overview Panel

**Purpose:** Verify team viewing and scoring display works

### Steps:
1. Navigate to "Teams Overview" panel
2. Verify teams list displays with:
   - Player code / Team name
   - Athletes on team
   - Total salary
   - Current score (if results exist)
3. Click on a team to view details
4. Observe athlete breakdown

### Expected Results:
- ✅ Teams table displays all teams in game
- ✅ Each team shows athlete count and total salary
- ✅ If results exist, teams show calculated scores
- ✅ Team detail view opens when clicking a team
- ✅ Athlete list shows names and individual scores
- ✅ Panel updates automatically if results change in another panel

### Actual Results:
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test 5: State Events Integration

**Purpose:** Verify state event system triggers automatic updates across panels

### Steps:
1. Open DevTools Console
2. Navigate to Results Management panel
3. In console, add event listener: `window.addEventListener('resultsUpdated', e => console.log('Event received:', e.detail))`
4. Update a race result and save
5. Watch console for event

### Expected Results:
- ✅ Results save successfully
- ✅ Console shows: `Event received: { results: {...}, finalized: false }`
- ✅ Other panels listening to `resultsUpdated` refresh automatically
- ✅ Teams Overview panel updates team scores

### Actual Results:
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test 6: Cache Invalidation

**Purpose:** Verify leaderboard/results caches clear when results update

### Steps:
1. Open DevTools → Application tab → Local Storage
2. Observe any `leaderboard_cache_*` or `results_cache_*` keys
3. Navigate to Results Management panel
4. Update a race result
5. Click "Update Results"
6. Return to Local Storage view

### Expected Results:
- ✅ Cache keys exist before result update (if any cached)
- ✅ After result update, cache keys are removed
- ✅ Leaderboard displays fresh data (not cached)

### Actual Results:
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test 7: API Client Usage (No Raw Fetch)

**Purpose:** Verify all panels use centralized API client instead of raw fetch calls

### Steps:
1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Navigate through all three panels
4. Perform actions (load athletes, update results, view teams)
5. Observe network request headers and URLs

### Expected Results:
- ✅ All API calls go through structured endpoints (`/api/athletes`, `/api/results`, etc.)
- ✅ Consistent request headers across all panels
- ✅ No direct `fetch()` calls visible in panel component code
- ✅ Errors handled consistently with apiClient error format

### Actual Results:
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test 8: Skeleton Loaders

**Purpose:** Verify skeleton loaders display during panel loading

### Steps:
1. Navigate to commissioner dashboard
2. Throttle network speed (DevTools → Network → Slow 3G)
3. Switch between panels
4. Observe loading states

### Expected Results:
- ✅ Skeleton loader (gray placeholder bars) displays while panel loads
- ✅ Skeleton loader matches expected content structure (5 lines)
- ✅ Panel content replaces skeleton smoothly when loaded
- ✅ No blank screens or jarring content shifts

### Actual Results:
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test 9: Panel Performance (Code Splitting)

**Purpose:** Verify dynamic imports reduce initial bundle size

### Steps:
1. Build production version: `npm run build`
2. Check build output for chunk sizes
3. Start production server: `npm start`
4. Open DevTools → Network tab
5. Load commissioner dashboard (stop before panels load)
6. Record initial bundle size
7. Navigate to each panel
8. Record additional chunks loaded

### Expected Results:
- ✅ Initial dashboard page < 200KB (without panel code)
- ✅ Each panel loads separate chunk (~30-50KB)
- ✅ Chunks load on-demand (only when panel accessed)
- ✅ Build output shows separate files:
  - `ResultsManagementPanel.[hash].js`
  - `AthleteManagementPanel.[hash].js`
  - `TeamsOverviewPanel.[hash].js`

### Actual Results:
- [ ] Pass
- [ ] Fail (describe issue):

---

## Test 10: Error Handling

**Purpose:** Verify graceful error handling in panels

### Steps:
1. Disconnect network (DevTools → Offline)
2. Try to load Athletes panel
3. Try to update results
4. Reconnect network
5. Retry operations

### Expected Results:
- ✅ Error messages display when API calls fail
- ✅ Panels don't crash or show blank screens
- ✅ Error state renders with descriptive message
- ✅ Operations succeed after network reconnects
- ✅ Console errors are informative (not just "undefined")

### Actual Results:
- [ ] Pass
- [ ] Fail (describe issue):

---

## Summary

**Total Tests:** 10  
**Passed:** __  
**Failed:** __  

**Critical Issues Found:**

1. 
2. 
3. 

**Panel-Specific Notes:**

- **Results Management:** 
- **Athlete Management:** 
- **Teams Overview:** 

**Performance Observations:**

- Initial load time: 
- Panel switch time: 
- Code split effectiveness:
