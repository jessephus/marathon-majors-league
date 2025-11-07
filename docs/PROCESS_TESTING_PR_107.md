# Testing Checklist for PR #107: Landing Page SSR Implementation

## Overview

This document provides a comprehensive testing checklist for PR #107, which implements server-side rendering (SSR) for the landing page with session-aware routing logic. The feature is controlled by a feature flag for gradual rollout.

**PR Link:** https://github.com/jessephus/marathon-majors-league/pull/107

**Key Components:**
- `lib/session-utils.js` - Session detection utilities
- `components/WelcomeCard.jsx` - React component for landing page
- `pages/index.js` - SSR integration with Next.js
- Feature flag: `NEXT_PUBLIC_USE_NEW_WELCOME_CARD`

---

## 1. Feature Flag Testing

### 1.1 Feature Flag Disabled (Default Behavior)

**Test Goal:** Verify backward compatibility when feature flag is OFF or not set.

**Setup:**
```bash
# Remove or comment out the feature flag
# In .env.local, ensure this is NOT set or set to false:
# NEXT_PUBLIC_USE_NEW_WELCOME_CARD=false

npm run dev
```

**Test Cases:**

- [x] **TC1.1.1:** Landing page loads successfully
  - Navigate to `http://localhost:3000`
  - **Expected:** Page loads without errors
  - **Verify:** Console shows no errors related to WelcomeCard

- [x] **TC1.1.2:** Legacy HTML landing page renders
  - View page source (Cmd/Ctrl + U)
  - **Expected:** Page contains legacy `<div id="welcome-card">` HTML structure
  - **Verify:** No React component hydration for WelcomeCard

- [x] **TC1.1.3:** All legacy functionality works
  - Test "Create a New Team" button
  - Test "Commissioner Mode" link
  - Test navigation between pages
  - **Expected:** All legacy features function normally

- [x] **TC1.1.4:** No console errors or warnings
  - Open browser DevTools Console
  - **Expected:** No errors related to missing components or undefined variables

- [x] **TC1.1.5:** No duplicate HTML elements
  - View page source (Cmd/Ctrl + U)
  - Search for `<footer>` tags
  - **Expected:** Only ONE footer element in the HTML
  - **Verify:** Only ONE `</main>` closing tag
  - **Previous bug:** Double footers were rendering due to incorrect HTML structure

### 1.2 Feature Flag Enabled (New Behavior)

**Setup:**
```bash
# In .env.local
NEXT_PUBLIC_USE_NEW_WELCOME_CARD=true

# Restart dev server
npm run dev
```

**Test Cases:**

- [x] **TC1.2.1:** Feature flag is recognized
  - Open browser console
  - Type: `process.env.NEXT_PUBLIC_USE_NEW_WELCOME_CARD`
  - **Expected:** Returns "true"

- [x] **TC1.2.2:** WelcomeCard component renders
  - Navigate to `http://localhost:3000`
  - Inspect element with class containing "welcome"
  - **Expected:** React component structure present (data-reactroot attribute)

- [x] **TC1.2.3:** No visual flicker on page load
  - Clear browser cache (Cmd/Ctrl + Shift + R)
  - Navigate to landing page
  - **Expected:** Page loads smoothly without content flickering or CTA button changes

- [x] **TC1.2.4:** SSR pre-renders content
  - View page source (Cmd/Ctrl + U)
  - Search for "Create a New Team" or "View My Team"
  - **Expected:** Button text is present in initial HTML (not added by JavaScript)

- [x] **TC1.2.5:** Toggling feature flag does not cause errors
  - Set `NEXT_PUBLIC_USE_NEW_WELCOME_CARD=true` in `.env.local`
  - Start dev server: `npm run dev`
  - Verify page loads correctly
  - Stop server (Ctrl+C)
  - Set `NEXT_PUBLIC_USE_NEW_WELCOME_CARD=false` in `.env.local`
  - Start dev server again
  - **Expected:** Legacy HTML loads without errors or infinite refresh
  - **Expected:** No "Cannot read properties of null" errors in console

- [x] **TC1.2.6:** app.js only loads in legacy mode
  - With feature flag ON (true), load page and open DevTools → Network tab
  - **Expected:** `app.js` should NOT be loaded
  - **Expected:** Console shows: "[App.js] Legacy HTML structure not found, skipping initialization"
  - Stop server, set flag to OFF (false), restart server
  - Refresh page and check Network tab
  - **Expected:** `app.js` IS loaded and initializes event listeners

---

## 2. Session Detection Testing

### 2.1 Anonymous Session (No Existing Session)

**Setup:**
```bash
# Clear all browser storage
# DevTools → Application → Storage → Clear site data
# Ensure no ?session= parameter in URL
```

**Test Cases:**

- [x] **TC2.1.1:** Anonymous user sees correct CTA
  - Navigate to `http://localhost:3000`
  - **Expected:** Button says "Create a New Team"
  - **Verify:** Button is styled in primary blue color

- [x] **TC2.1.2:** SSR detects anonymous session
  - View page source before JavaScript loads
  - **Expected:** "Create a New Team" button present in HTML source

- [x] **TC2.1.3:** Create team button works
  - Click "Create a New Team"
  - **Expected:** Team creation modal opens
  - **Verify:** Modal prompts for team name

### 2.2 Team Session (Player/Team Owner)

**Setup:**
```bash
# Create a team first:
# 1. Clear storage
# 2. Go to homepage
# 3. Click "Create a New Team"
# 4. Complete team creation
# 5. Note your session token/URL
```

**Test Cases:**

- [x] **TC2.2.1:** Team session detected from localStorage
  - After creating team, refresh the page
  - **Expected:** Button says "View My Team" or "Go to Dashboard"
  - **Verify:** No flicker during page load

- [x] **TC2.2.2:** Team session detected from URL parameter
  - Clear all storage
  - Navigate to `http://localhost:3000/?session=YOUR_SESSION_TOKEN`
  - **Expected:** Button says "View My Team"

- [x] **TC2.2.3:** Team session detected from cookies
  - After creating team, check cookies (DevTools → Application → Cookies)
  - **Expected:** Cookie `marathon_fantasy_team` exists with JSON session data
  - **Verify:** Cookie contains: token, sessionType, displayName, gameId, playerCode
  - **Verify:** Button shows "View My Team" on page refresh (SSR uses cookie)

- [x] **TC2.2.4:** View team button navigates correctly
  - Click "View My Team" button
  - **Expected:** Navigates to team/draft page
  - **Verify:** Can see your drafted athletes or draft interface

### 2.3 Commissioner Session

**Setup:**
```bash
# Access commissioner mode:
# 1. Clear storage
# 2. Go to homepage
# 3. Click "Commissioner Mode" at bottom
# 4. Enter TOTP password
```

**Test Cases:**

- [x] **TC2.3.1:** Commissioner session detected from localStorage
  - After logging in as commissioner, return to homepage
  - **Expected:** Button says "Go to Dashboard" or "Commissioner Dashboard"
  - **Verify:** Different styling than team button (blue vs orange)

- [x] **TC2.3.2:** Commissioner session detected from cookies
  - Check cookies after commissioner login
  - **Expected:** Cookie `marathon_fantasy_commissioner` exists
  - **Verify:** Session persists across page refreshes

- [x] **TC2.3.3:** Dashboard button navigates correctly
  - Click "Go to Dashboard"
  - **Expected:** Navigates to commissioner dashboard
  - **Verify:** Can see commissioner controls (generate codes, run draft, etc.)

- [ ] **TC2.3.4:** Commissioner and Team sessions detected simultaneously
  - After logging in as commissioner, enter a homepage URL with session token to login to team session
  - Click "Home"
  - **Expected:** Navigates to landing page
  - **Verify:** Can see "view team" and "go to dashboard" buttons 

### 2.4 Session Priority and Edge Cases

**Test Cases:**

- [ ] **TC2.4.1:** Commissioner session takes priority over team session
  - Create a team session first
  - Then log in as commissioner
  - Return to homepage
  - **Expected:** Shows both "Go to Dashboard" and "View Team"

- [ ] **TC2.4.2:** URL session parameter overrides localStorage
  - Create a team and note your session token
  - Clear localStorage but not cookies
  - Navigate with URL parameter: `/?session=YOUR_TOKEN`
  - **Expected:** Session is restored from URL parameter

- [ ] **TC2.4.3:** Expired session falls back to anonymous
  - Manually edit localStorage session to have past expiration date:
    ```javascript
    // In console:
    let session = JSON.parse(localStorage.getItem('marathon_fantasy_team'));
    session.expiresAt = new Date('2020-01-01').toISOString();
    localStorage.setItem('marathon_fantasy_team', JSON.stringify(session));
    ```
  - Refresh page
  - **Expected:** Shows "Create a New Team" (expired session ignored)

- [ ] **TC2.4.4:** Invalid session token format is rejected
  - Navigate to `/?session=invalid`
  - **Expected:** Treated as anonymous session
  - **Verify:** Shows "Create a New Team" button

---

## 3. Visual and UI Testing

### 3.1 Styling and Layout

**Test Cases:**

- [ ] **TC3.1.1:** Loading spinner behaves correctly
  - Hard refresh the page (Cmd/Ctrl + Shift + R)
  - **Verify:** Only the circular spinner rotates
  - **Verify:** "Loading your experience..." text remains static (does NOT spin)
  - **Verify:** Spinner disappears after page loads

- [ ] **TC3.1.2:** Welcome card is properly styled
  - **Verify:** Card has rounded corners, shadow, white background
  - **Verify:** Card is centered on page
  - **Verify:** Maximum width prevents overly wide layout

- [ ] **TC3.1.2:** Button styling is consistent
  - **Verify:** Orange button for "Create Team"
  - **Verify:** Orange/blue button for "View Team"/"Dashboard"
  - **Verify:** Hover effect works (darker color on hover)

- [ ] **TC3.1.3:** Typography is readable
  - **Verify:** Heading is large and bold
  - **Verify:** Description text is readable size
  - **Verify:** Proper line spacing

- [ ] **TC3.1.4:** Inline critical CSS loads
  - View page source
  - Search for `<style>` tags
  - **Expected:** Inline styles present for above-the-fold content

### 3.2 Responsive Design

**Test Cases:**

- [ ] **TC3.2.1:** Mobile view (320px width)
  - Open DevTools → Device Toolbar
  - Set to iPhone SE (375x667)
  - **Expected:** Card fits screen, text is readable, button is tappable

- [ ] **TC3.2.2:** Tablet view (768px width)
  - Set device to iPad (768x1024)
  - **Expected:** Card is properly centered, appropriate padding

- [ ] **TC3.2.3:** Desktop view (1920px width)
  - Set device to desktop
  - **Expected:** Card doesn't exceed max-width (600px), centered on page

- [ ] **TC3.2.4:** Touch interactions on mobile
  - Test on actual mobile device or simulator
  - **Expected:** Button tap works, no accidental double-taps

---

## 4. Performance Testing

### 4.1 Page Load Performance

**Test Cases:**

- [ ] **TC4.1.1:** First paint time
  - Open DevTools → Network
  - Hard refresh (Cmd/Ctrl + Shift + R)
  - Check "First Contentful Paint" in Performance tab
  - **Expected:** FCP < 1 second on fast connection

- [ ] **TC4.1.2:** Time to Interactive
  - Check Performance tab → "Time to Interactive"
  - **Expected:** TTI < 2 seconds

- [ ] **TC4.1.3:** No visible content flicker
  - Record page load with DevTools Performance tab
  - Replay recording in slow motion
  - **Expected:** No layout shift or button text changes after initial render

- [ ] **TC4.1.4:** Inline CSS reduces render blocking
  - Network tab → Disable cache
  - Reload page
  - **Expected:** Critical styles render before external CSS loads

### 4.2 Bundle Size

**Test Cases:**

- [ ] **TC4.2.1:** Check JavaScript bundle size
  - Build production: `npm run build`
  - Check `.next/static/chunks/` directory
  - **Expected:** No significant increase in bundle size

- [ ] **TC4.2.2:** Verify code splitting
  - Check Network tab → JS files
  - **Expected:** WelcomeCard component is in separate chunk (if lazy loaded)

---

## 5. Functional Integration Testing

### 5.1 Navigation and Event Handlers

**Test Cases:**

- [ ] **TC5.1.1:** Create team flow integration
  - Click "Create a New Team"
  - Complete team creation
  - **Expected:** Redirects to salary cap draft page
  - **Verify:** Session is saved in localStorage

- [ ] **TC5.1.2:** View team flow integration
  - Return to homepage (with team session)
  - Click "View My Team"
  - **Expected:** Shows team/draft interface
  - **Verify:** Can navigate back to homepage

- [ ] **TC5.1.3:** Commissioner flow integration
  - Return to homepage (with commissioner session)
  - Click "Go to Dashboard"
  - **Expected:** Shows commissioner controls
  - **Verify:** All commissioner actions work

- [ ] **TC5.1.4:** Page navigation doesn't break sessions
  - Navigate: Home → Draft → Home → Commissioner → Home
  - **Expected:** Session persists, correct CTA shown at each return

### 5.2 Backward Compatibility

**Test Cases:**

- [ ] **TC5.2.1:** Legacy `showPage()` function still works
  - Open console
  - Type: `showPage('salary-cap-draft-page')`
  - **Expected:** Navigates to draft page successfully

- [ ] **TC5.2.2:** Global state compatibility
  - Check that `window.gameState` still exists
  - **Expected:** Legacy code can still access global state

- [ ] **TC5.2.3:** Event listeners don't conflict
  - Click legacy buttons (if feature flag is off)
  - **Expected:** No console errors about duplicate listeners

---

## 6. SSR-Specific Testing

### 6.1 Server-Side Rendering

**Test Cases:**

- [ ] **TC6.1.1:** `getServerSideProps` executes
  - Add console.log in `getServerSideProps`
  - Check terminal output during page load
  - **Expected:** Server-side logs appear in terminal (not browser)

- [ ] **TC6.1.2:** Initial HTML contains session-aware content
  - Disable JavaScript in browser (DevTools → Settings → Disable JavaScript)
  - Navigate to homepage
  - **Expected:** Appropriate button text visible even without JS

- [ ] **TC6.1.3:** Server detects session from cookies
  - Create a session
  - View server logs during page load
  - **Expected:** Server logs show detected session type

- [ ] **TC6.1.4:** Hydration works without errors
  - Open console
  - Look for hydration warnings/errors
  - **Expected:** No "Hydration failed" or mismatched content errors

### 6.2 SEO and Meta Tags

**Test Cases:**

- [ ] **TC6.2.1:** Page title is set correctly
  - View page source
  - Check `<title>` tag
  - **Expected:** Contains "Fantasy NY Marathon" or appropriate title

- [ ] **TC6.2.2:** Meta tags are present
  - Check for `<meta name="description">` in source
  - **Expected:** Descriptive meta tags exist

---

## 7. Error Handling and Edge Cases

### 7.1 Error Scenarios

**Test Cases:**

- [ ] **TC7.1.1:** Missing session-utils.js
  - Temporarily rename `lib/session-utils.js`
  - Reload page
  - **Expected:** Graceful fallback or clear error message
  - **Restore file after test**

- [ ] **TC7.1.2:** Invalid session data in localStorage
  - Set invalid JSON in localStorage:
    ```javascript
    localStorage.setItem('marathon_fantasy_team', 'invalid json{');
    ```
  - Refresh page
  - **Expected:** Falls back to anonymous session, no crash

- [ ] **TC7.1.3:** Network timeout during SSR
  - Simulate slow network (DevTools → Network → Throttling)
  - **Expected:** Page still loads (SSR doesn't depend on external APIs)

### 7.2 Browser Compatibility

**Test Cases:**

- [ ] **TC7.2.1:** Chrome/Edge (Chromium)
  - Test all core functionality
  - **Expected:** Everything works

- [ ] **TC7.2.2:** Firefox
  - Test session detection and navigation
  - **Expected:** Everything works

- [ ] **TC7.2.3:** Safari
  - Test on macOS/iOS Safari
  - **Expected:** Everything works (check for localStorage/cookie access)

---

## 8. Production Deployment Testing

### 8.1 Vercel Preview Deployment

**Test Cases:**

- [ ] **TC8.1.1:** Preview deployment builds successfully
  - Check Vercel deployment logs
  - **Expected:** Build completes without errors
  - **Verify:** No warnings about missing dependencies

- [ ] **TC8.1.2:** Environment variable is set in Vercel
  - Go to Vercel Dashboard → Settings → Environment Variables
  - **Verify:** `NEXT_PUBLIC_USE_NEW_WELCOME_CARD` is set (if enabling feature)

- [ ] **TC8.1.3:** Preview URL works
  - Visit preview deployment URL (from PR comment)
  - **Expected:** Landing page loads with new WelcomeCard component

- [ ] **TC8.1.4:** Test all scenarios on preview
  - Repeat core test cases from sections 2-5 on preview URL
  - **Expected:** Behavior matches local development

### 8.2 Production Readiness

**Test Cases:**

- [ ] **TC8.2.1:** Feature flag can be toggled without code changes
  - Change environment variable in Vercel
  - Redeploy
  - **Expected:** Feature can be enabled/disabled via flag alone

- [ ] **TC8.2.2:** Rollback plan is documented
  - **Verify:** Can disable feature by setting flag to false
  - **Verify:** No database migrations or data changes required

- [ ] **TC8.2.3:** Monitoring is in place
  - Check Vercel Analytics (if available)
  - **Expected:** Can track page load times and errors

---

## 9. Automated Test Validation

### 9.1 Jest/Node Test Suite

**Test Cases:**

- [ ] **TC9.1.1:** All automated tests pass
  - Run: `npm test` or `node tests/landing-page-ssr.test.js`
  - **Expected:** All 18 tests pass (see PR description)

- [ ] **TC9.1.2:** Session detection utility tests pass
  - **Verify:** `detectSessionType()` tests pass
  - **Verify:** `getSessionFromURL()` tests pass
  - **Verify:** `isValidSessionToken()` tests pass

- [ ] **TC9.1.3:** SSR rendering tests pass
  - **Verify:** Page rendering tests pass
  - **Verify:** Session-aware routing tests pass

- [ ] **TC9.1.4:** Backward compatibility tests pass
  - **Verify:** Feature flag OFF tests pass
  - **Verify:** Legacy functionality tests pass

---

## 10. Documentation and Code Quality

### 10.1 Documentation

**Test Cases:**

- [ ] **TC10.1.1:** Migration guide exists and is complete
  - Read `docs/MIGRATION_LANDING_PAGE_SSR.md`
  - **Verify:** Contains setup instructions
  - **Verify:** Contains architecture explanation
  - **Verify:** Contains troubleshooting section

- [ ] **TC10.1.2:** Code comments are clear
  - Review `lib/session-utils.js`
  - Review `components/WelcomeCard.jsx`
  - **Expected:** Functions have JSDoc comments
  - **Expected:** Complex logic is explained

- [ ] **TC10.1.3:** README is updated (if needed)
  - Check if main README.md mentions SSR feature
  - **Verify:** Feature is documented or linked to migration guide

### 10.2 Code Quality

**Test Cases:**

- [ ] **TC10.2.1:** No console.log statements in production code
  - Search codebase for `console.log`
  - **Expected:** Only in test files or behind development checks

- [ ] **TC10.2.2:** No unused imports
  - Check ESLint output or manually review
  - **Expected:** All imports are used

- [ ] **TC10.2.3:** TypeScript types are correct (if applicable)
  - Check `.d.ts` files or JSDoc type annotations
  - **Expected:** No type errors

---

## 11. Security Testing

### 11.1 XSS Prevention

**Test Cases:**

- [ ] **TC11.1.1:** Session token sanitization
  - Try injecting XSS in URL: `/?session=<script>alert(1)</script>`
  - **Expected:** Script does not execute, invalid token rejected

- [ ] **TC11.1.2:** No unsanitized data in innerHTML
  - Review code for `dangerouslySetInnerHTML`
  - **Expected:** Only used for trusted, static content (legacy HTML)

### 11.2 Session Security

**Test Cases:**

- [ ] **TC11.2.1:** Session tokens are validated
  - Try using short token: `/?session=abc`
  - **Expected:** Rejected as invalid (< 32 characters)

- [ ] **TC11.2.2:** Expired sessions are handled
  - Create session with past expiration
  - **Expected:** Falls back to anonymous, no security error

---

## Test Execution Checklist

### Phase 1: Local Development (Required Before Approval)
- [ ] Feature flag OFF tests (Section 1.1)
- [ ] Feature flag ON tests (Section 1.2)
- [ ] Session detection tests (Section 2)
- [ ] Visual and UI tests (Section 3)
- [ ] Functional integration tests (Section 5)
- [ ] Automated tests pass (Section 9)

### Phase 2: Preview Deployment (Required Before Merge)
- [ ] Preview deployment tests (Section 8.1)
- [ ] Performance tests on preview (Section 4)
- [ ] Browser compatibility tests (Section 7.2)

### Phase 3: Production (Post-Merge)
- [ ] Production deployment smoke tests
- [ ] Monitor analytics for errors
- [ ] Monitor page load performance metrics

---

## Test Results Summary

**Test Date:** _________________  
**Tester:** _________________  
**Environment:** [ ] Local [ ] Preview [ ] Production  
**Feature Flag:** [ ] ON [ ] OFF

### Results
- Total Test Cases: ~80
- Passed: _____
- Failed: _____
- Skipped: _____

### Critical Issues Found
1. _____________________
2. _____________________
3. _____________________

### Recommendations
- [ ] Ready to merge
- [ ] Needs fixes before merge
- [ ] Needs further testing

---

## Notes and Observations

(Use this space to document any unexpected behavior, performance issues, or suggestions for improvement)

---

**Related Documentation:**
- PR: https://github.com/jessephus/marathon-majors-league/pull/107
- Migration Guide: `docs/MIGRATION_LANDING_PAGE_SSR.md`
- Test File: `tests/landing-page-ssr.test.js`
- Issue: https://github.com/jessephus/marathon-majors-league/issues/91
