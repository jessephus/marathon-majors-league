# Manual Testing Guide - Dynamic Imports & Performance Monitoring (PR #118)

## Overview

This guide provides quick verification steps for PR #118, which implements dynamic imports with performance instrumentation and feature flags.

**Related Commits:**
- `b83cda8` - Implement dynamic imports with performance monitoring
- `a794f5a` - Fix security issue: Use crypto.getRandomValues() for session IDs

**Changes:**
- Dynamic import utility with automatic tracking
- Performance monitoring dashboard
- Feature flag system with environment-based filtering
- AthleteModal now loads on-demand (3 pages migrated)
- Commissioner panels instrumented with performance tracking

---

## Quick Verification (5 minutes)

### 1. Verify Files Exist

**New Files Created:**
```bash
ls -la lib/performance-monitor.ts
ls -la lib/feature-flags.ts
ls -la lib/dynamic-import.ts
ls -la tests/dynamic-imports.test.js
```

**Expected Output:**
- All 4 files should exist
- `performance-monitor.ts` - Performance tracking system
- `feature-flags.ts` - Feature toggle system
- `dynamic-import.ts` - Dynamic import wrapper
- `dynamic-imports.test.js` - Test suite

### 2. Run Automated Tests

```bash
npm run test:dynamic
```

**Expected Output:**
```
✅ Dynamic Import Integration Tests configured
✅ All tests passed (4 test suites)
```

**Test Coverage:**
- Performance Monitor (4 tests)
- Feature Flag System (3 tests)
- Dynamic Import Utility (1 test)
- Integration (2 tests)

### 3. Check Application Starts

```bash
npm run dev
```

**Expected Output:**
- Development server starts on http://localhost:3000
- No console errors about missing modules
- No TypeScript compilation errors

---

## Deep Testing (10 minutes)

### 4. Verify Dynamic AthleteModal Loading

**Steps:**
1. Start development server: `npm run dev`
2. Open browser to http://localhost:3000
3. Open DevTools → Network tab → Filter by "JS"
4. Navigate to Leaderboard page
5. Click on any athlete name to open the modal

**Expected Behavior:**
- AthleteModal chunk loads on first click (look for `chunk-athlete-modal-*.js`)
- Subsequent clicks use cached chunk (no new network request)
- Modal opens without delay
- No console errors

**Files Using Dynamic AthleteModal:**
- `pages/leaderboard.tsx` (line ~20)
- `pages/test-athlete-modal.tsx`
- `components/AthleteSelectionModal.tsx` (line ~14)

### 5. Verify Performance Monitoring Dashboard

**Steps:**
1. With app running, open browser console
2. Execute: `window.__performanceDashboard.show()`

**Expected Output:**
```javascript
=== Performance Dashboard ===
Chunk: chunk-athlete-modal
  Loads: 1
  Avg Time: 45.2ms
  Success Rate: 100%
========================
```

**Additional Commands:**
```javascript
// View all metrics
window.__performanceDashboard.getMetrics()

// View summary
window.__performanceDashboard.getSummary()

// Export to JSON
window.__performanceDashboard.exportToJSON()
```

### 6. Verify Feature Flags

**Steps:**
1. Open browser console
2. Execute: `window.__featureFlags.getAll()`

**Expected Output:**
```javascript
[
  {
    flag: "DYNAMIC_ATHLETE_MODAL",
    enabled: true,
    config: { environment: ["development", "preview", "production"], rolloutPercentage: 100 }
  },
  {
    flag: "DYNAMIC_COMMISSIONER_PANELS",
    enabled: true,
    config: { environment: ["development", "preview", "production"], rolloutPercentage: 100 }
  }
]
```

**Test Override:**
```javascript
// Disable a flag
window.__featureFlags.override('DYNAMIC_ATHLETE_MODAL', false)
window.__featureFlags.isEnabled('DYNAMIC_ATHLETE_MODAL') // Should return false

// Clear overrides
window.__featureFlags.clearOverrides()
window.__featureFlags.isEnabled('DYNAMIC_ATHLETE_MODAL') // Should return true
```

### 7. Verify Commissioner Panel Instrumentation

**Steps:**
1. Navigate to Commissioner Dashboard
2. Open browser console
3. Switch between tabs (Results, Athletes, Teams)
4. Execute: `window.__performanceDashboard.show()`

**Expected Output:**
```javascript
Chunk: chunk-commissioner-results
  Loads: 1
  Avg Time: 120ms
  Success Rate: 100%

Chunk: chunk-commissioner-athletes
  Loads: 1
  Avg Time: 95ms
  Success Rate: 100%

Chunk: chunk-commissioner-teams
  Loads: 1
  Avg Time: 80ms
  Success Rate: 100%
```

### 8. Security Verification (crypto.getRandomValues)

**Steps:**
1. Open browser console
2. Check feature flag session generation:

```javascript
// Should use crypto.getRandomValues (not Math.random)
window.__featureFlags.getAll()
```

**Expected Behavior:**
- No security warnings in console
- Session IDs are cryptographically secure (32-character hex strings)
- CodeQL security scan: 0 alerts (check PR #118 "Checks" tab)

**Security Fix Verification:**
- Before (`a794f5a`): Used `Math.random()` → insecure randomness alert
- After: Uses `crypto.getRandomValues()` → no alerts

---

## Bundle Impact Verification

### 9. Check Bundle Size Reduction

**Steps:**
```bash
npm run build
```

**Look for output similar to:**
```
Page                              Size     First Load JS
┌ ○ /                            5.2 kB        122.87 KB
├ ○ /leaderboard                 8.1 kB        125.77 KB
└ ○ /commissioner                12.3 kB       129.87 KB

+ Chunks
  chunk-athlete-modal.js          41 KB (loaded on demand)
  chunk-commissioner-results.js   15 KB (loaded on demand)
```

**Expected Results:**
- Initial bundle: ~122.87 KB (baseline)
- AthleteModal: ~41 KB deferred (not in initial load)
- Commissioner panels: ~35 KB total deferred
- **Total savings**: ~3 KB from initial load

---

## Regression Testing (5 minutes)

### 10. Verify Existing Functionality Still Works

**Critical Paths:**
- [ ] ✅ Landing page loads without errors
- [ ] ✅ Create team flow completes
- [ ] ✅ Salary cap draft functions (select athletes, submit roster)
- [ ] ✅ Leaderboard displays correctly
- [ ] ✅ AthleteModal shows athlete details on click
- [ ] ✅ Commissioner dashboard accessible
- [ ] ✅ Results entry works
- [ ] ✅ Team page displays roster

**No Breaking Changes:**
- All pages should load successfully
- No TypeScript errors
- No runtime errors in console
- Feature flags default to `enabled: true` (100% rollout)

---

## Edge Cases & Error Handling

### 11. Test Dynamic Import Failure Handling

**Steps:**
1. Open DevTools → Network tab
2. Throttle network to "Slow 3G"
3. Navigate to leaderboard
4. Click athlete name

**Expected Behavior:**
- Loading spinner shows while chunk loads
- Modal eventually opens (may take 5-10 seconds)
- No crash if network is slow
- Performance monitor tracks slow load time

### 12. Test Feature Flag Disabled Scenario

**Steps:**
1. Console: `window.__featureFlags.override('DYNAMIC_ATHLETE_MODAL', false)`
2. Navigate to leaderboard
3. Click athlete name

**Expected Behavior:**
- Modal should still work (fallback to static import if configured)
- OR shows appropriate error message
- App doesn't crash

---

## Success Criteria Checklist

### Must Pass ✅
- [ ] All 4 automated test suites pass
- [ ] Application starts without errors
- [ ] AthleteModal loads dynamically on leaderboard
- [ ] Performance dashboard accessible via console
- [ ] Feature flags system functional
- [ ] Commissioner panels load dynamically
- [ ] No security alerts (crypto.getRandomValues used)
- [ ] Bundle size reduced by ~3 KB
- [ ] All existing features still work

### Nice to Have ✓
- [ ] Performance metrics show reasonable load times (<500ms)
- [ ] Feature flag overrides work correctly
- [ ] Export to JSON generates valid output
- [ ] Network throttling handled gracefully

---

## Rollback Plan

If critical issues are found:

### Option 1: Disable Feature Flags
```javascript
// Emergency disable via console
window.__featureFlags.override('DYNAMIC_ATHLETE_MODAL', false)
window.__featureFlags.override('DYNAMIC_COMMISSIONER_PANELS', false)
```

### Option 2: Revert PR
```bash
git revert b83cda8 a794f5a
git push origin componentization
```

### Option 3: Fix Forward
- Performance issues → Adjust chunk splitting
- Feature flag issues → Update flag config
- Security issues → Review crypto implementation

---

## Notes

**Performance Benchmarks:**
- AthleteModal chunk: ~41 KB
- Average load time: 50-150ms (development), 20-50ms (production)
- Success rate target: >95%

**Browser Compatibility:**
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (crypto.getRandomValues available in all modern versions)

**Known Limitations:**
- Performance dashboard only available in browser console (no UI)
- Feature flag overrides reset on page reload
- Metrics don't persist across sessions

---

## Additional Resources

- **PR #118**: https://github.com/jessephus/marathon-majors-league/pull/118
- **Commit b83cda8**: Dynamic imports implementation
- **Commit a794f5a**: Security fix for randomness
- **Issue #98**: Original feature request
- **CodeQL Results**: Check PR "Security" tab

---

**Last Updated**: November 12, 2025  
**Test Duration**: ~20 minutes (full suite)  
**Minimum Pass**: All ✅ items checked
