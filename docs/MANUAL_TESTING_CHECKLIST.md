# Manual Testing Checklist for Routing Phase 1

**Status:** 🔄 Pending Manual Verification  
**Date:** November 4, 2025  
**Related:** [PROCESS_ROUTING_PHASE1.md](PROCESS_ROUTING_PHASE1.md)

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
- [ ] Page renders without errors
- [ ] TOTP login modal displays (if not authenticated)
- [ ] Modal has 6-digit code input field
- [ ] Input accepts numbers only (maxLength=6, pattern="[0-9]{6}")
- [ ] Submit attempts TOTP verification
- [ ] Cancel button redirects to home

**After Authentication (requires valid TOTP):**
- [ ] Dashboard displays with sections:
  - Game Management
  - Game Statistics (shows 0 teams, 0 players, etc.)
  - Administrative Actions
- [ ] All buttons visible but not yet functional
- [ ] Logout button clears commissioner state

---

### ✅ Team Session Page (`/team/[session]`)

**URL:** `http://localhost:3000/team/test-session-token`

**Expected Behavior:**
- [ ] Page renders without errors
- [ ] Shows "Verifying your session..." initially
- [ ] After verification (will fail with test token):
  - Shows session error
  - "Return to Home" button works
  
**With Valid Session Token (requires API):**
- [ ] Team name displays in header
- [ ] Owner name displays (if provided)
- [ ] Player code displays
- [ ] Budget tracker shows $30,000
- [ ] 6 roster slots display (M1, M2, M3, W1, W2, W3)
- [ ] Each slot shows "Click to select athlete"
- [ ] "Submit Team" button is disabled
- [ ] Session info shows share tip and URL

---

### ✅ AthleteModal Component

**Testing Method:** Requires integration in parent page

**Expected Behavior:**
- [ ] Modal opens when triggered
- [ ] Renders as React portal (outside parent DOM)
- [ ] Close button (×) works
- [ ] Escape key closes modal
- [ ] Overlay click closes modal
- [ ] Athlete info displays in header
- [ ] Four tabs render: Bio, Race Log, Progression, News
- [ ] Tab switching works
- [ ] Bio tab shows athlete stats
- [ ] Other tabs show "coming soon" placeholders
- [ ] Modal prevents body scroll when open
- [ ] Modal restores scroll when closed

---

### ✅ State Provider Integration

**Testing Method:** Open browser DevTools console

**Test in any new page:**

```javascript
// In console, React DevTools should show:
// AppStateProvider wrapping component

// State should be accessible through hooks
// (verify via React DevTools Components tab)
```

**Expected:**
- [ ] React DevTools shows AppStateProvider
- [ ] State updates trigger re-renders
- [ ] No console errors about missing provider

---

### ✅ API Client Integration

**Testing Method:** Monitor Network tab in DevTools

**Actions to Test:**
- [ ] Navigate to leaderboard → see `/api/results` request
- [ ] Create team → see `/api/session/create` request
- [ ] Verify session → see `/api/session/verify` request
- [ ] All requests use centralized client (check request headers)

**Expected:**
- [ ] API calls made through apiClient
- [ ] Consistent error handling
- [ ] CORS headers present

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
- [ ] Only leaderboard-specific code loads
- [ ] Shared state provider remains
- [ ] No legacy app.js loaded
- [ ] Bundle size matches build report (~2-3 KB per page)

---

### ✅ SSR Verification

**Testing Method:** View page source

**Steps:**
1. Navigate to any new page
2. Right-click → View Page Source
3. Look for initial HTML content

**Expected:**
- [ ] Page renders server-side (HTML visible in source)
- [ ] Stub data structure present in HTML
- [ ] No JavaScript required for initial render
- [ ] Meta tags present (title, description)

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

### ✅ Performance Metrics

**Testing Method:** Lighthouse in Chrome DevTools

**Run for each page:**
- [ ] `/landing`
- [ ] `/leaderboard`
- [ ] `/commissioner`
- [ ] `/team/[session]`

**Expected Scores (targets):**
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 80

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

- [ ] Landing page fully tested
- [ ] Leaderboard page fully tested
- [ ] Commissioner page fully tested
- [ ] Team session page fully tested
- [ ] AthleteModal component tested
- [ ] State provider integration verified
- [ ] API client integration verified
- [ ] Feature flags verified
- [ ] Bundle separation confirmed
- [ ] SSR verified via view-source
- [ ] Mobile responsiveness checked
- [ ] Performance metrics acceptable
- [ ] Error handling works
- [ ] All issues documented
- [ ] Documentation updated

---

**Testing Status:** 🔄 Awaiting Manual Verification  
**Tested By:** ___________________  
**Date Completed:** ___________________  
**Sign-Off:** ___________________
