# Manual Testing Checklist for Routing Phase 1

**Status:** ✅ Completed  
**Date:** November 4, 2025  
**Completion Date:** November 4, 2025  
**Related:** [PROCESS_ROUTING_PHASE1.md](PROCESS_ROUTING_PHASE1.md)

---

## Testing Summary

**Phase 1 Manual Testing: PASSED ✅**

All critical functionality verified and working as expected:

- ✅ **Page Structure:** All 4 pages render correctly with proper SSR
- ✅ **State Provider:** React Context working without errors
- ✅ **API Client:** Centralized HTTP requests functioning
- ✅ **AthleteModal:** Portal-based modal with country gradients and placeholders
- ✅ **Bundle Separation:** Each page has isolated bundles (2-3 KB)
- ✅ **SSR Verification:** Server-side rendering confirmed via page source
- ✅ **Feature Flags:** Defined but not used in Phase 1 (intentional)
- ⚠️ **Performance:** Baseline scores documented (30-50 range expected in dev mode)

**Known Limitations (Intentional for Phase 1):**
- Stub data with client-side hydration (real API integration in Phase 2)
- Some buttons non-functional (placeholders for future phases)
- Low Lighthouse scores in development mode (optimization in Phase 2+)
- Mobile responsiveness and error boundaries not fully tested (acceptable for Phase 1)

**Ready for Phase 2:** Page structure is solid and ready for feature implementation.

---

## Pre-Testing Setup

### 1. Start Development Server

```bash
cd /home/runner/work/marathon-majors-league/marathon-majors-league
npm run dev
```

Server should start at `http://localhost:3000`

### 2. Enable Feature Flags

Create `.env.local` file:

```bash
NEXT_PUBLIC_ENABLE_NEW_LANDING=true
NEXT_PUBLIC_ENABLE_NEW_LEADERBOARD=true
NEXT_PUBLIC_ENABLE_NEW_COMMISSIONER=true
NEXT_PUBLIC_ENABLE_NEW_TEAM_SESSION=true
NEXT_PUBLIC_ENABLE_ATHLETE_MODAL=true
```

Restart server after creating env file.

---

## Test Cases

### ✅ Landing Page (`/landing`)

**URL:** `http://localhost:3000/landing`

**Expected Behavior:**
- [x] Page renders without errors
- [x] Header shows "🗽 Fantasy NY Marathon"
- [x] Welcome card displays
- [x] "Create a New Team" button is visible
- [x] Clicking button opens team creation modal
- [x] Modal has team name and owner name inputs
- [x] Can submit form with team name (requires API)
- [x] Error handling works (empty team name)

**Session URL Test:**
- [x] Navigate to `/landing?token=test-token`
- [x] Page should attempt to verify session
- [x] Invalid token shows appropriate state

---

### ✅ Leaderboard Page (`/leaderboard`)

**URL:** `http://localhost:3000/leaderboard`

**Expected Behavior:**
- [x] Page renders without errors
- [x] "Leaderboard" heading displays
- [x] Two tabs: "Fantasy Standings" and "Race Results"
- [x] Tab switching works (no errors in console)
- [x] Empty state shows: "No teams yet..."
- [x] Auto-refresh indicator displays
- [x] Back button navigates to previous page

**With gameId:**
- [x] Navigate to `/leaderboard?gameId=test`
- [x] Page loads with same UI
- [x] API call attempts to fetch results for gameId

---

### ✅ Commissioner Page (`/commissioner`)

**URL:** `http://localhost:3000/commissioner`

**Expected Behavior:**
- [x] Page renders without errors
- [x] TOTP login modal displays (if not authenticated)
- [x] Modal has 6-digit code input field
- [x] Input accepts numbers only (maxLength=6, pattern="[0-9]{6}")
- [x] Submit attempts TOTP verification
- [x] Cancel button redirects to home

**After Authentication (requires valid TOTP):**
- [x] Dashboard displays with sections:
  - Game Management
  - Game Statistics (shows 0 teams, 0 players, etc.)
  - Administrative Actions
- [x] All buttons visible but not yet functional
- [x] Logout button clears commissioner state

---

### ✅ Team Session Page (`/team/[session]`)

**URL:** `http://localhost:3000/team/test-session-token`

**Expected Behavior:**
- [x] Page renders without errors
- [x] Shows "Verifying your session..." initially
- [x] After verification (will fail with test token):
  - Shows session error
  - "Return to Home" button works
  
**With Valid Session Token (requires API):**
- [x] Team name displays in header
- [x] Owner name displays (if provided)
- [x] Player code displays
- [x] Budget tracker shows $30,000
- [x] 6 roster slots display (M1, M2, M3, W1, W2, W3)
- [x] Each slot shows "Click to select athlete"
- [x] "Submit Team" button is disabled
- [x] Session info shows share tip and URL

---

### AthleteModal Component

**URL:** `http://localhost:3000/test-athlete-modal`

**Testing Method:** Dedicated test page with clickable athlete cards

**Expected Behavior:**
- [x] Page renders without errors
- [x] Test instructions display with checklist
- [x] Men's athletes section shows 6 athlete cards
- [x] Women's athletes section shows 6 athlete cards
- [x] Athlete cards show name, country, PB, and salary
- [x] Clicking any card opens the AthleteModal
- [x] Modal renders as React portal (inspect DOM - modal is child of `<body>`)
- [x] Close button (×) in top-right corner closes modal
- [x] Pressing Escape key closes modal
- [x] Clicking overlay (dark background) closes modal
- [x] Modal header shows athlete headshot (or placeholder emoji)
- [x] Modal header shows athlete name, country, PB, and salary
- [x] Four tabs display: Bio, Race Log, Progression, News
- [x] Tab switching works (click each tab)
- [x] Bio tab shows athlete stats (age, sponsor, world ranking, WA ID)
- [x] Race Log tab shows "Race history will be available in a future update"
- [x] Progression tab shows "Performance progression chart coming soon"
- [x] News tab shows "Recent news will be available in a future update"
- [x] Body scroll is prevented when modal is open (try scrolling page)
- [x] Body scroll is restored when modal is closed
- [x] Modal animates smoothly (fade in/out)
- [x] No console errors

**Advanced Tests:**
- [x] Open modal, press Escape, verify it closes
- [x] Open modal, click overlay, verify it closes
- [x] Open modal, click close button, verify it closes
- [x] Open different athletes, verify modal updates correctly
- [x] Verify modal is centered on screen at all viewport sizes

---

### ✅ State Provider Integration

**What This Tests:** Global state management system that shares data across all pages

**Testing Method:** React DevTools + Console (simplified approach)

**SIMPLIFIED TEST (Recommended):**

1. **Open any page:** http://localhost:3000/landing
2. **Open Console:** Press F12, click "Console" tab
3. **Check for errors:** Look for any red errors mentioning:
   - "useContext"
   - "missing provider"
   - "Provider not found"
4. **✅ PASS if:** No errors appear = Provider is working!

**ADVANCED TEST (React DevTools):**

**Note:** AppStateProvider might appear as "Context.Provider" in React DevTools.

1. **Open any page:** http://localhost:3000/landing
2. **Open DevTools:** Press F12 or Cmd+Option+I (Mac)
3. **Click ⚛️ Components tab** (install React Developer Tools if needed)
4. **Find your page component:**
   - Look for "LandingPageContent" (or similar)
   - Click on it
5. **Check its parent:**
   - Look at what's ABOVE your page component
   - Should see "Context.Provider" or "AppStateProvider"
6. **Click on the Provider:**
   - Look at "hooks" panel on right
   - Should see State with gameState, sessionState, etc.

**Alternative: Search Method**
- In Components tab, press Cmd+F (Mac) or Ctrl+F (Windows)
- Search for: "Provider"
- Look for Context.Provider wrapping your page components

**Navigation Test:**
- [x] Open http://localhost:3000/landing - No console errors
- [x] Navigate to http://localhost:3000/leaderboard - No console errors
- [x] Navigate to http://localhost:3000/commissioner - No console errors
- [x] All pages work without "useContext" errors

**Expected Results:**
- [x] No console errors about "useContext" or "missing provider"
- [x] Pages render without crashing
- [x] Can navigate between pages smoothly
- [x] React DevTools shows Provider (as "Context.Provider" or "AppStateProvider")
- [x] Provider has state with gameState, sessionState, commissionerState

**What Success Looks Like in React DevTools:**
```
▼ Context.Provider  ← This is your AppStateProvider!
  └─ props
     └─ value: {
          gameState: {...},
          sessionState: {...},
          commissionerState: {...},
          setGameState: f(),
          setSessionState: f(),
          ...
        }
  ▼ LandingPageContent
    ...
```

**Simplified Success Criteria:**
✅ **You PASS this test if:**
- Pages load without errors
- No red errors in console about context/provider
- You can navigate between pages

❌ **You FAIL this test if:**
- Console shows: "useContext must be used within a provider"
- Pages crash when trying to access state
- React errors about missing context

---

### ✅ API Client Integration

**What This Tests:** Centralized API communication layer (replaces scattered fetch() calls)

**Testing Method:** Network tab in DevTools (Monitor HTTP requests)

**How to Open Network Tab:**
1. Press F12 to open DevTools
2. Click the **"Network"** tab
3. Make sure recording is ON (red dot at top-left)
4. You can filter by "Fetch/XHR" to see only API calls

---

**TEST 1: Athletes API**

**Steps:**
1. Open http://localhost:3000/test-athlete-modal
2. Check Network tab for `/api/athletes` request
3. Click on the request to see details

**What to Check:**
- [x] Request appears in Network tab
- [x] Request URL: `http://localhost:3000/api/athletes`
- [x] Method: `GET`
- [x] Status: `200 OK` (or `500` if database not connected - that's ok for this test)
- [x] Response has `men` and `women` arrays
- [x] Request Headers include `Content-Type: application/json`

---

**TEST 2: Session Creation API**

**Steps:**
1. Open http://localhost:3000/landing
2. Click "Create a New Team" button
3. Fill in team name (e.g., "Test Team")
4. Click "Create Team"
5. Check Network tab for `/api/session/create` request

**What to Check:**
- [x] Request appears: `/api/session/create`
- [x] Method: `POST`
- [x] Request Payload includes: `{ "displayName": "   ", "sessionType": "   ", "gameId": "   " }` 
- [x] Status: `201 CREATED` `200 OK` or `500` (database error is ok for this test)
- [x] Headers include `Content-Type: application/json`

---

**TEST 3: Session Verification API**

**Steps:**
1. Open http://localhost:3000/team/test-token-123
2. Check Network tab for `/api/session/verify` request

**What to Check:**
- [x] Request appears: `/api/session/verify`
- [x] Method: `GET`
- [x] Request Payload: `{ "token": "test-token-123" }`
- [x] Status: Any response is ok (will fail with test token)
- [x] Headers include `Content-Type: application/json`

---

**TEST 4: Results API (Leaderboard)**

**Steps:**
1. Open http://localhost:3000/leaderboard
2. Check Network tab for `/api/standings` or `/api/results` request

**What to Check:**
- [x] Request appears when page loads
- [x] Method: `GET`
- [x] Query parameter includes `gameId` (e.g., `?gameId=default`)
- [x] Headers include `Content-Type: application/json`

---

**TEST 5: TOTP Verification API (Commissioner)**

**Steps:**
1. Open http://localhost:3000/commissioner
2. Enter any 6-digit code (e.g., "123456")
3. Click "Verify"
4. Check Network tab for `/api/commissioner/verify-totp` request

**What to Check:**
- [x] Request appears: `/api/commissioner/verify-totp`
- [x] Method: `POST`
- [x] Request Payload: `{ "code": "123456" }`
- [x] Status: `401` (unauthorized - expected with wrong code)
- [x] Headers include `Content-Type: application/json`

---

**OVERALL API CLIENT VERIFICATION:**

**Check Request Headers (any API call):**
1. Click on any request in Network tab
2. Go to "Headers" section
3. Look at "Request Headers"

**Should see:**
- ✅ `Content-Type: application/json`
- ✅ `Accept: */*` or `application/json`
- ✅ Consistent header format across all requests

**Check Error Handling:**
1. Turn off internet (or disconnect database)
2. Try any action that makes an API call
3. Should see:
   - ✅ Graceful error message (not browser crash)
   - ✅ Console error logged (for debugging)
   - ✅ User-friendly message displayed

**Success Criteria:**
- [x] All API calls go through centralized apiClient
- [x] Consistent request format (JSON headers on all requests)
- [x] Error responses handled gracefully
- [x] No direct `fetch()` calls outside api-client.ts
- [x] Network tab shows clean, organized API traffic

**What Centralized API Client Looks Like:**
```
Network Tab:
├── /api/athletes          ← GET request (athleteApi.list())
├── /api/session/create    ← POST request (sessionApi.create())
├── /api/session/verify    ← POST request (sessionApi.verify())
├── /api/standings         ← GET request (resultsApi.getStandings())
└── /api/commissioner/verify-totp ← POST request (commissionerApi.verifyTOTP())

All requests have:
✓ Content-Type: application/json
✓ Proper error handling
✓ Consistent format
```

**Quick Pass/Fail:**
- ✅ **PASS**: All API calls appear in Network tab with `application/json` headers
- ❌ **FAIL**: No requests appear, or requests have inconsistent headers

---

### ✅ Feature Flags

**Testing Method:** Toggle flags in `.env.local`

**Test 1: All Flags OFF**
```bash
NEXT_PUBLIC_ENABLE_NEW_LANDING=false
NEXT_PUBLIC_ENABLE_NEW_LEADERBOARD=false
NEXT_PUBLIC_ENABLE_NEW_COMMISSIONER=false
NEXT_PUBLIC_ENABLE_NEW_TEAM_SESSION=false
```

**Expected:**
- [ ] New pages still accessible but feature detection works
- [ ] Can manually navigate to `/landing`, `/leaderboard`, etc.

**Test 2: Individual Flags ON**
- [ ] Toggle each flag individually
- [ ] Verify feature detection

---

### ✅ Bundle Separation

**Testing Method:** Use React DevTools Profiler

**Steps:**
1. Open React DevTools
2. Go to Profiler tab
3. Record page navigation
4. Navigate from `/landing` → `/leaderboard`
5. Stop recording

**Expected:**
- [x] Only leaderboard-specific code loads
- [x] Shared state provider remains
- [x] No legacy app.js loaded
- [x] Bundle size matches build report (~2-3 KB per page)

---

### ✅ SSR Verification - PASSED ✅

**Testing Method:** View page source

**Steps:**
1. Navigate to any new page (tested: `/leaderboard`)
2. Right-click → View Page Source
3. Look for initial HTML content and `__NEXT_DATA__` script

**Expected:**
- [x] Page renders server-side (HTML visible in source)
- [x] `__NEXT_DATA__` shows `"__N_SSP": true` and `"gssp": true`
- [x] Server-side props present (e.g., `gameId`)
- [x] Page structure exists before JavaScript runs
- [x] Meta tags present (title, description)

**Result:** ✅ SSR working correctly. Page shell renders on server with `getServerSideProps`. Dynamic data (standings) fetches on client via `useEffect`, which is appropriate for live race data that changes frequently.

**Note:** Seeing "Loading..." state in source is expected—server renders page structure, client fetches live data. This hybrid approach (SSR shell + CSR data) is optimal for real-time content.

---

### ✅ Mobile Responsiveness

**Testing Method:** Chrome DevTools Device Mode

**Devices to Test:**
- [ ] iPhone SE (375px)
- [ ] iPhone 12 Pro (390px)
- [ ] Pixel 5 (393px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)

**Expected:**
- [ ] All pages render correctly on mobile
- [ ] Touch targets adequate size (44px min)
- [ ] No horizontal scrolling
- [ ] Modals work on mobile
- [ ] Forms usable on mobile

---

### ⏭️ Performance Metrics (Phase 1 - Baseline Only)

**Testing Method:** Lighthouse in Chrome DevTools

**Run for each page:**
- [ ] `/landing` - 36 performance
- [ ] `/leaderboard` - 36 performance
- [ ] `/commissioner` - 38 performance
- [ ] `/team/[session]` - 

**Phase 1 Expectations:**
- ⚠️ **Low scores expected** (30-50 range)
- Development mode includes unminified code, source maps, HMR
- Stub data and placeholder API responses not optimized
- React 19 RC may have debug overhead

**Phase 2+ Optimizations (Future):**
- SWR caching (reduce API calls by 80%)
- Server-side computation (pre-computed standings)
- Production build (minification, tree shaking)
- Next.js Image optimization
- Code splitting and lazy loading
- See `TECH_PERFORMANCE_OPTIMIZATION.md` for full roadmap

**Current Goal:** Document baseline scores, don't optimize yet.  
**Production Targets:** Performance > 90, Accessibility > 90, Best Practices > 90, SEO > 80

---

### ✅ Error Boundaries

**Testing Method:** Trigger errors intentionally

**Tests:**
- [ ] Invalid session token → graceful error
- [ ] API failure → error message displayed
- [ ] Network offline → appropriate fallback
- [ ] Invalid TOTP code → error shown
- [ ] Console shows errors for debugging

---

## Known Issues to Document

### Expected Behaviors (Not Bugs):

1. **API calls will fail** without DATABASE_URL configured
2. **Session verification fails** with test tokens (expected)
3. **TOTP login fails** without valid authenticator code
4. **Empty states** show for data (stub data in Phase 1)
5. **Some buttons non-functional** (placeholders for Phase 2)

### Actual Bugs to Report:

Document any unexpected issues here:

- [ ] Issue 1: ________________________________
- [ ] Issue 2: ________________________________
- [ ] Issue 3: ________________________________

---

## Post-Testing Actions

### If All Tests Pass:

1. Update PROCESS_ROUTING_PHASE1.md with ✅ status
2. Mark checklist items as complete
3. Create PR summary with test results
4. Update CORE_CHANGELOG.md
5. Notify team that Phase 1 is complete

### If Tests Fail:

1. Document failures in this file
2. Create GitHub issues for bugs
3. Fix critical bugs before marking complete
4. Re-test after fixes

---

## Testing Completion Checklist

- [x] Landing page fully tested
- [x] Leaderboard page fully tested
- [x] Commissioner page fully tested
- [x] Team session page fully tested
- [x] AthleteModal component tested
- [x] State provider integration verified
- [x] API client integration verified
- [ ] Feature flags verified
- [x] Bundle separation confirmed
- [x] SSR verified via view-source
- [ ] Mobile responsiveness checked
- [ ] Performance metrics acceptable
- [ ] Error handling works
- [x] All issues documented
- [x] Documentation updated

---

**Testing Status:** 🔄 Awaiting Manual Verification  
**Tested By:** ___________________  
**Date Completed:** ___________________  
**Sign-Off:** ___________________
