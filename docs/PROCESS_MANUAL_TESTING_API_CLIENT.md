# Manual Testing Plan: API Client with Retry Logic and Caching

## Overview

This document provides a lightweight manual testing plan for PR #114, which implements a standardized API client with automatic retry logic, exponential backoff, and stale-while-revalidate caching.

**PR:** https://github.com/jessephus/marathon-majors-league/pull/114  
**Related Issue:** #95 - Standardized fetching & caching

## Key Changes

### 1. **API Client Enhancement** (`lib/api-client.ts`)
- Centralized data fetching through unified API client
- Automatic retry with exponential backoff (300ms → 600ms → 1200ms ±25% jitter)
- Auto-retry transient errors (408, 429, 5xx, network failures)
- No retry for client errors (4xx)

### 2. **Cache Utilities** (`lib/api-client.ts`)
- Stale-while-revalidate strategy with configurable TTLs
- Cache-Control header management for API routes

### 3. **Page Migrations**
- **Leaderboard page** - All client-side fetches migrated
- **Commissioner page** - All client-side fetches migrated (parallel execution)
- **Team page** - Athlete list fetch migrated

## Test Scenarios

### Scenario 1: Basic Leaderboard Functionality ⏱️ 3 minutes

**Objective:** Verify leaderboard loads correctly with API client

**Steps:**
1. Navigate to `/leaderboard` page
2. Observe page load time and behavior
3. Open browser DevTools → Network tab
4. Refresh the page
5. Check Console for errors

**Expected Results:**
- ✅ Leaderboard displays with team standings
- ✅ Page loads without visible delays
- ✅ Network tab shows API requests to `/api/standings`, `/api/results`, `/api/game-state`
- ✅ No console errors
- ✅ Response headers include `Cache-Control` with `stale-while-revalidate`

**Pass/Fail Criteria:**
- Page loads and displays data correctly
- No JavaScript errors in console
- API calls complete successfully

---

### Scenario 2: Commissioner Dashboard Performance ⏱️ 5 minutes

**Objective:** Verify parallel fetching improves commissioner page load time

**Steps:**
1. Navigate to `/commissioner` page (authenticate if needed)
2. Note the page load time (observe loading indicators)
3. Open DevTools → Network tab
4. Refresh the page
5. Check the "Timing" tab for parallel requests

**Expected Results:**
- ✅ Dashboard loads quickly (significantly faster than sequential fetching)
- ✅ Four API calls execute in parallel:
  - `/api/salary-cap-draft` (teams)
  - `/api/athletes?confirmedOnly=true`
  - `/api/game-state`
  - `/api/results`
- ✅ All statistics display correctly (team count, confirmed athletes, results status)
- ✅ No race conditions or timing issues

**Pass/Fail Criteria:**
- Dashboard displays complete data
- Parallel requests visible in network waterfall chart
- No loading failures or incomplete data

---

### Scenario 3: Retry Logic - Network Failure Simulation ⏱️ 5 minutes

**Objective:** Test automatic retry on transient errors

**Steps:**
1. Open DevTools → Network tab
2. Enable "Offline" mode (throttling)
3. Navigate to `/leaderboard`
4. Wait 2-3 seconds
5. Disable "Offline" mode
6. Observe behavior

**Expected Results:**
- ✅ Initial requests fail (network offline)
- ✅ API client automatically retries when connection restored
- ✅ Page eventually loads successfully after retries
- ✅ User sees loading state during retry attempts
- ✅ Console shows retry attempt logs (if logging enabled)

**Pass/Fail Criteria:**
- Page recovers from network failure automatically
- No need for manual refresh
- Data loads after connectivity restored

---

### Scenario 4: Cache Header Verification ⏱️ 3 minutes

**Objective:** Verify cache headers are set correctly on API responses

**Steps:**
1. Open DevTools → Network tab
2. Navigate to `/leaderboard`
3. Find the `/api/athletes` request
4. Click on the request → Headers tab
5. Scroll to "Response Headers"
6. Locate `Cache-Control` header

**Expected Results:**
- ✅ `/api/athletes` has `Cache-Control: public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400`
- ✅ `/api/game-state` has shorter cache TTL (30s max-age, 1m s-maxage)
- ✅ `/api/results` has shortest TTL (15s max-age, 30s s-maxage)

**Pass/Fail Criteria:**
- All API responses include appropriate `Cache-Control` headers
- TTLs match documented strategy

---

### Scenario 5: Team Page Athlete Loading ⏱️ 3 minutes

**Objective:** Verify team page uses API client for athlete data

**Steps:**
1. Create a new team or navigate to existing team page (`/team/[session]`)
2. Open DevTools → Network tab
3. Observe athlete list loading
4. Click "Edit Roster" to trigger athlete modal
5. Check network requests

**Expected Results:**
- ✅ Athlete list loads via API client
- ✅ Network request to `/api/athletes` uses fetch with retry logic
- ✅ Modal displays athletes correctly
- ✅ No duplicate requests (data cached)

**Pass/Fail Criteria:**
- Athletes display in roster selection modal
- API request completes successfully
- No errors during roster editing

---

### Scenario 6: Error Handling - 4xx Errors ⏱️ 3 minutes

**Objective:** Verify client errors (4xx) are NOT retried

**Steps:**
1. Open browser console
2. Manually trigger an API call with invalid parameters:
   ```javascript
   fetch('/api/game-state?gameId=INVALID_ID')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```
3. Observe network activity
4. Check console for error messages

**Expected Results:**
- ✅ Single request made (no retries for 4xx errors)
- ✅ Error handled gracefully
- ✅ User-friendly error message (if applicable)
- ✅ No infinite retry loops

**Pass/Fail Criteria:**
- 4xx errors fail fast without retry
- Application remains functional
- Clear error messaging

---

### Scenario 7: Concurrent Request Deduplication ⏱️ 3 minutes

**Objective:** Verify multiple identical requests are deduplicated

**Steps:**
1. Open DevTools → Network tab
2. Navigate to `/leaderboard`
3. Quickly refresh the page 3-4 times in succession (Cmd+R or Ctrl+R)
4. Observe network requests in "All" or "Fetch/XHR" filter

**Expected Results:**
- ✅ Duplicate requests are minimized (SWR caching)
- ✅ Data displays consistently across refreshes
- ✅ No visible loading flicker on subsequent loads

**Pass/Fail Criteria:**
- Minimal redundant network activity
- Smooth user experience during rapid navigation

---

## Regression Testing ⏱️ 5 minutes

### Quick Smoke Test Checklist

Verify no existing functionality broke:

- [ ] **Create Team Flow** - Can create new team via welcome card
- [ ] **Roster Building** - Can add/remove athletes in salary cap draft
- [ ] **Budget Validation** - Cannot exceed $30,000 budget
- [ ] **Submit Roster** - Can successfully submit completed roster
- [ ] **Leaderboard Display** - Shows correct standings and points
- [ ] **Commissioner Login** - Can access commissioner dashboard
- [ ] **Results Entry** - Can enter race results (if applicable)

---

## Browser Compatibility Testing ⏱️ 10 minutes

Test on multiple browsers to ensure fetch polyfills work correctly:

| Browser | Version | Status | Notes |
|---------|---------|--------|-------|
| Chrome | Latest | ⬜ | Primary development browser |
| Firefox | Latest | ⬜ | Test fetch API compatibility |
| Safari | Latest | ⬜ | Test webkit fetch implementation |
| Edge | Latest | ⬜ | Test Chromium-based compatibility |

**Steps for each browser:**
1. Navigate to `/leaderboard`
2. Navigate to `/commissioner`
3. Create a team and view `/team/[session]`
4. Check console for errors

---

## Performance Verification ⏱️ 5 minutes

### Metrics to Check

Using Chrome DevTools:

1. **Network Tab → Timing:**
   - Waiting (TTFB) should be consistent
   - Content Download should be minimal (cached responses fast)

2. **Performance Tab → Record:**
   - Run page load
   - Check "Loading" phase duration
   - Verify no long tasks blocking render

3. **Console Logs:**
   - Check for excessive log output
   - Verify no memory leaks during navigation

**Expected Performance:**
- Leaderboard loads in < 2 seconds (cold cache)
- Commissioner page loads in < 3 seconds (parallel fetching)
- Subsequent visits load in < 500ms (warm cache)

---

## Automated Test Verification ⏱️ 2 minutes

Confirm the new test suites pass:

```bash
# API Client tests
npm run test:api-client

# SSR Integration tests
npm run test:ssr
```

**Expected Output:**
- ✅ All retry logic tests pass
- ✅ Cache configuration tests pass
- ✅ Error handling tests pass
- ✅ SSR integration test templates documented

---

## Known Issues / Limitations

### Not Migrated (Out of Scope)
- ❌ **SSR `getServerSideProps` calls** - Server-side context, not client-side
- ❌ **Legacy monolith files** - `public/app.js`, `public/salary-cap-draft.js` (vanilla JS, no modules)

### Expected Warnings (Non-Breaking)
- ⚠️ Cache headers only apply to CDN/browser caching (Vercel Edge handles backend)
- ⚠️ Retry delays may cause slight UI lag during network issues (expected behavior)

---

## Test Execution Summary

| Test Scenario | Duration | Priority | Status |
|--------------|----------|----------|--------|
| 1. Basic Leaderboard | 3 min | High | ⬜ |
| 2. Commissioner Performance | 5 min | High | ⬜ |
| 3. Retry Logic | 5 min | High | ⬜ |
| 4. Cache Headers | 3 min | Medium | ⬜ |
| 5. Team Page Athletes | 3 min | Medium | ⬜ |
| 6. Error Handling | 3 min | Medium | ⬜ |
| 7. Request Deduplication | 3 min | Low | ⬜ |
| Regression Tests | 5 min | High | ⬜ |
| Browser Compatibility | 10 min | Medium | ⬜ |
| Performance Verification | 5 min | Medium | ⬜ |
| Automated Tests | 2 min | High | ⬜ |

**Total Estimated Time:** 45 minutes

---

## Sign-Off

### Test Execution

- **Tested By:** _____________________
- **Date:** _____________________
- **Environment:** _____________________
- **Build Version:** _____________________

### Results

- **Tests Passed:** _____ / 11
- **Tests Failed:** _____ / 11
- **Critical Issues Found:** _____________________

### Approval

- [ ] All critical tests passed
- [ ] No regressions detected
- [ ] Performance acceptable
- [ ] Ready for merge

**Approved By:** _____________________  
**Date:** _____________________

---

## Related Documentation

- **[SSR Strategy Guide](PROCESS_SSR_STRATEGY.md)** - Architecture and design decisions
- **[API Client Source](../lib/api-client.ts)** - Implementation details
- **[Cache Utils Source](../lib/api-client.ts)** - Cache configuration
- **[Automated Tests](../tests/api-client.test.js)** - Unit tests for retry logic
- **[SSR Integration Tests](../tests/ssr-integration.test.js)** - Integration test templates

---

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Status:** Active
