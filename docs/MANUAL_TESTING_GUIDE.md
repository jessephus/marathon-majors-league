# Performance Instrumentation - Manual Testing Guide

This guide helps you verify that the performance instrumentation features from Issue #82 are working correctly.

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open the application in your browser:**
   ```
   http://localhost:3000
   ```

3. **Open the browser DevTools console** (F12 or Cmd+Option+I)

---

## ✅ Test 1: Web Vitals Tracking

**Goal:** Verify that Core Web Vitals are being tracked automatically.

### Steps:

1. Navigate to the homepage (`http://localhost:3000`)
2. Wait for the page to fully load (2-3 seconds)
3. In the console, run:
   ```javascript
   window.getWebVitals()
   ```
4. **For LCP**: Wait 3-5 more seconds, then run `window.getWebVitals()` again
5. **For CLS**: Scroll the page or navigate away, then run `window.getWebVitals()` again
6. **For INP**: Click around the page, then run `window.getWebVitals()` again

### Expected Results:

✅ **Initial page load (step 3):**
- **TTFB** (Time to First Byte) - Should appear immediately ✓

✅ **After waiting (step 4):**
- **LCP** (Largest Contentful Paint) - Should appear after 3-5 seconds ✓

✅ **After scrolling/navigating (step 5):**
- **CLS** (Cumulative Layout Shift) - Should appear when page becomes hidden ✓

✅ **After clicking (step 6):**
- **INP** (Interaction to Next Paint) - Should appear after user interactions ✓

✅ Each metric should have:
- `name`: Metric name
- `value`: Numeric value
- `rating`: 'good', 'needs-improvement', or 'poor'
- `timestamp`: When it was recorded

### What to Look For:

**Timing:**
- **TTFB appears first** (within 1 second of page load)
- **LCP appears next** (within 3-5 seconds)
- **CLS appears later** (when you scroll or navigate away)
- **INP appears after interactions** (when you click something)

**Performance targets:**
- **TTFB should be < 800ms** (green/good rating)
- **LCP should be < 2500ms** (green/good rating)
- **CLS should be < 0.1** (green/good rating)
- **INP should be < 200ms** (green/good rating)

**Example output after all metrics report:**
```javascript
window.getWebVitals()
// Shows table with all 4 metrics:
// 0: TTFB: 230.90ms (good) ✓
// 1: LCP: 1800.00ms (good) ✓
// 2: CLS: 0.05 (good) ✓
// 3: INP: 150.00ms (good) ✓
```


---

## ✅ Test 2: Performance Dashboard

**Goal:** Verify the visual Performance Dashboard works.

### Steps:

1. In the console, run:
   ```javascript
   window.__performanceDashboard.show()
   ```

2. A modal should appear showing performance metrics

### Expected Results:

✅ Modal displays with following sections:
- **Core Web Vitals** - Cards showing LCP, INP, CLS, TTFB
- **Cache Performance** - Overall, Results, Game State, Athletes hit ratios
- **Dynamic Chunk Performance** - Table of loaded chunks
- **Feature Flags** - Current feature flag status

✅ Each metric card should show:
- Current value
- Color coding (green = good, yellow = needs improvement, red = poor)
- Threshold value for comparison

**Initial State (Fresh Page Load):**
- ✅ **Core Web Vitals**: Should show TTFB, LCP (others may be 0 if not triggered yet)
- ⏳ **Cache Performance**: Will show **0.0%** initially (no API calls yet)
- ✅ **Dynamic Chunk Performance**: Should show commissioner chunks if you opened dashboard from Commissioner Mode
- ✅ **Feature Flags**: Should display current feature flag states

### Actions to Populate Cache Metrics:

1. **Leave the dashboard open** (it updates every 2 seconds)
2. **Navigate to trigger API calls**:
   - Click "View Leaderboard" to load standings (`/api/standings`)
   - Navigate away and back to leaderboard to trigger cache HIT
   - Refresh the page to see athletes data (`/api/athletes`)
   - Open race results to load results (`/api/results`)
3. **Watch cache metrics update** in real-time
4. **Navigate to trigger chunk loads**:
   - Click "Commissioner Mode" to load commissioner panels
   - Open athlete modals to load athlete detail components
5. **Watch chunk metrics update** in the Dynamic Chunk Performance table

### Expected After Navigation:

- ✅ **Cache Performance**: Shows increasing hit ratios as you navigate
  - Overall: 50-70% (mix of hits and misses)
  - Athletes: 75-100% (athletes don't change often)
  - Game State: 50-75% (moderate frequency)
  - Results: 30-60% (changes frequently during races)
- ✅ **Dynamic Chunk Performance**: Shows loaded chunks with load times
  - chunk-commissioner-teams: ~25ms ✓
  - chunk-commissioner-results: ~30ms ✓
  - chunk-commissioner-athletes: ~25ms ✓
  - chunk-leaderboard-table: ~50ms ✓

### Additional Actions:

1. Click around the app to trigger more dynamic chunk loads
2. The dashboard auto-refreshes every 2 seconds
3. Click "Export Metrics (JSON)" button to download all metrics
4. A JSON file should download with complete performance data

---

## ✅ Test 3: Cache Hit Ratio Tracking

**Goal:** Verify cache hits/misses are tracked for API calls.

### Steps:

1. Navigate to the leaderboard page
2. Wait for data to load
3. Navigate away and back to the leaderboard (to trigger cache)
4. In the console, run:
   ```javascript
   window.getCacheStats()
   ```

### Expected Results:

✅ Console shows cache statistics:
```
Cache Hit Ratios: {
  overall: "X.X%",
  results: "X.X%",
  gameState: "X.X%",
  athletes: "X.X%"
}
```

✅ Followed by a table of recent cache accesses showing:
- `type`: 'results', 'gameState', or 'athletes'
- `hit`: true/false
- `timestamp`: When accessed

### What to Look For:

- **First load:** More cache misses (false) - fresh data from server
- **Second load:** More cache hits (true) - using cached data
- **Hit ratio should increase** with repeated navigation to the same pages
- **Athletes endpoint:** Should show high hit ratio (athletes don't change often)
- **Results endpoint:** May show lower hit ratio during active races (data changes frequently)

### Cache Implementation Details:

The cache tracking system works as follows:

1. **Server-side:** API routes (`/api/athletes`, `/api/results`, `/api/standings`) check incoming `If-None-Match` headers against generated ETags
2. **Cache HIT:** If ETags match, server returns `304 Not Modified` with `X-Cache-Status: HIT` header
3. **Cache MISS:** If ETags don't match or aren't present, server returns `200 OK` with fresh data and `X-Cache-Status: MISS` header
4. **Client-side:** API client reads `X-Cache-Status` and `X-Cache-Type` headers from every response
5. **Performance tracking:** Client calls `trackCacheAccess(type, hit)` to record metrics
6. **Dashboard updates:** Performance monitor aggregates cache statistics for display

---

## Test 4: Leaderboard Refresh Latency

**Goal:** Verify leaderboard refresh performance is tracked.

### Steps:

1. Navigate to the leaderboard page
2. If there's a "Refresh" button, click it multiple times
3. In the console, run:
   ```javascript
   window.getPerformanceReport()
   ```

4. Look at the `leaderboard` section

### Expected Results:

✅ Report shows leaderboard metrics:
```javascript
leaderboard: {
  avgLatency: XXX,  // Average refresh time in ms
  totalRefreshes: X,  // Number of refreshes
  cacheHitRatio: X.XX  // Ratio of cached refreshes
}
```

### What to Look For:

- **avgLatency should be < 1000ms** (under 1 second)
- Cache hit ratio should increase with repeated refreshes
- If avgLatency > 1000ms, check console for "leaderboard_refresh_slow" warnings

---

## Test 5: Dynamic Chunk Load Performance

**Goal:** Verify dynamic imports are tracked.

### Steps:

1. From the homepage, navigate to different pages that load components:
   - Click on "Leaderboard"
   - Open an athlete modal (if available)
   - Navigate to "Commissioner Mode"

2. In the console, run:
   ```javascript
   window.getChunkPerformance()
   ```

### Expected Results:

✅ Table showing chunk load statistics:
- **chunkName** - Name of the dynamically loaded component
- **loadCount** - How many times it was loaded
- **avgLoadTime** - Average load time in ms
- **successRate** - Percentage of successful loads

### What to Look For:

- **Median load time < 800ms** (run `window.__performanceMonitor.getChunkLoadMedian()`)
- **Success rate = 100%** for all chunks
- Color coding: Green (< 100ms), Yellow (100-300ms), Red (> 300ms)

---

## Test 6: Threshold Violation Detection

**Goal:** Verify performance issues are logged when thresholds are exceeded.

### Steps:

1. Navigate around the app normally
2. In the console, run:
   ```javascript
   window.getPerformanceEvents()
   ```

### Expected Results:

✅ Table showing performance events:
- Events like `web_vital_threshold_exceeded`, `cache_hit_ratio_low`, `chunk_load_threshold_exceeded`
- Each event has a payload with details

### What to Look For:

**In a well-performing app, you should see:**
- **Few or no threshold violations**
- If violations exist, they should have clear payloads explaining what exceeded the threshold

**Common violations (if any):**
- `web_vital_threshold_exceeded` - LCP > 2500ms, INP > 200ms, or CLS > 0.1
- `cache_hit_ratio_low` - Cache hit ratio < 70%
- `chunk_load_threshold_exceeded` - Median chunk load > 800ms

---

## Test 7: Console Helper Functions

**Goal:** Verify all console helper functions work.

### Steps:

Run each command and verify it works:

```javascript
// 1. Full performance report
window.getPerformanceReport()
// Should return comprehensive object with all metrics

// 2. Web Vitals only
window.getWebVitals()
// Should show table of Web Vitals

// 3. Cache statistics
window.getCacheStats()
// Should show cache hit ratios and recent accesses

// 4. Chunk performance
window.getChunkPerformance()
// Should show table of chunk load stats

// 5. Specific chunk
window.getChunkPerformance('AthleteModal')
// Should show just AthleteModal metrics (if loaded)

// 6. Performance events
window.getPerformanceEvents()
// Should show threshold violations

// 7. Feature flags
window.getFeatureFlags()
// Should show current feature flags

// 8. Export metrics
window.__performanceMonitor.exportMetrics()
// Should return JSON string of all metrics

// 9. Clear metrics
window.__performanceMonitor.clear()
// Should reset all metrics to zero
```

---

## Test 8: Development Mode Logging

**Goal:** Verify console logs appear in development.

### Steps:

1. Watch the console while navigating around the app
2. Look for performance-related log messages

### Expected Results:

✅ You should see logs like:
```
[Web Vitals] Monitoring initialized
[Web Vitals] LCP: 2000.00 (good) ✓
[Cache] results: HIT
[Chunk Load] AthleteModal: 150.23ms ✓
[Leaderboard Refresh] 456.78ms (cache hit) ✓
```

⚠️ If you see warnings:
```
[Performance] web_vital_threshold_exceeded { metric: 'LCP', value: 3000, threshold: 2500 }
[Performance] cache_hit_ratio_low { type: 'results', hitRatio: 0.65, threshold: 0.7 }
```

---

## Test 9: Production Mode (Optional)

**Goal:** Verify console logging is disabled in production.

### Steps:

1. Build the app for production:
   ```bash
   npm run build
   npm start
   ```

2. Open the app in the browser
3. Check the console

### Expected Results:

✅ **No development console logs** should appear
✅ Performance monitoring still works (check via console commands)
✅ Metrics are still collected (verify with `window.getPerformanceReport()`)
⚠️ Analytics events are sent (if Google Analytics is configured)

---

## Test 10: Automated Tests

**Goal:** Verify performance instrumentation tests pass.

### Steps:

1. Run the test suite:
   ```bash
   npm run test:perf-instrumentation
   ```

### Expected Results:

✅ All tests should pass:
```
✅ All performance instrumentation tests passed
📋 Issue #82 requirements validated

✔ Performance Budgets Configuration (6 tests)
✔ Web Vitals Tracking (4 tests)
✔ Cache Hit Ratio Tracking (4 tests)
✔ Leaderboard Refresh Tracking (2 tests)
✔ Dynamic Chunk Load Tracking (3 tests)
✔ Performance Report Generation (2 tests)
✔ Performance Logger (1 test)
✔ Metrics Cleanup (1 test)

Total: 23 tests passed
```

---

## Troubleshooting

### Issue: No Web Vitals appearing

**This is normal!** Web Vitals report at different times.

**Expected timing:**
- **TTFB**: Appears immediately (< 1 second)
- **LCP**: Appears after 3-5 seconds
- **CLS**: Appears when you scroll or navigate away
- **INP**: Appears only after you click/interact

**Possible causes if TTFB doesn't appear:**
- Page hasn't fully loaded yet
- Web Vitals initialization failed

**Solution:**
- Wait 5-10 seconds and run `window.getWebVitals()` again
- Scroll the page or click something to trigger CLS/INP
- Check browser console for `[Web Vitals] Monitoring initialized` message
- Verify `initWebVitals()` is being called in `pages/_app.tsx`

### Issue: Dashboard doesn't show

**Possible causes:**
- Not in development mode
- Dashboard component failed to load

**Solution:**
- Ensure `NODE_ENV=development`
- Check browser console for errors
- Verify `PerformanceDashboard` component exists in `components/`

### Issue: Cache metrics always 0%

**Possible causes:**
- First-time page load (no API calls made yet)
- Browser cache disabled in DevTools
- Not using the centralized API client (`lib/api-client.ts`)

**Solution:**
1. **Navigate to pages that make API calls**:
   - Leaderboard page (calls `/api/standings`)
   - Home page (calls `/api/athletes`)
   - Results page (calls `/api/results`)
2. **Check browser console** for `[Cache]` log messages showing HIT/MISS
3. **Verify API routes** are using `checkETag()` with response object:
   ```javascript
   // Correct usage:
   if (checkETag(req, etag, 'results', res)) {
     return send304(res);
   }
   ```
4. **Check Network tab** in DevTools:
   - Look for `X-Cache-Status` header in response
   - 304 responses should have `X-Cache-Status: HIT`
   - 200 responses should have `X-Cache-Status: MISS`
5. **Disable browser cache in DevTools** temporarily, then re-enable:
   - Network tab → Check "Disable cache" → Refresh page
   - Uncheck "Disable cache" → Refresh page again
   - You should see MISS on first load, HIT on second load

**Advanced debugging:**
```javascript
// Monitor cache tracking in console
window.__performanceMonitor.cacheAccesses.forEach(access => {
  console.log(`${access.type}: ${access.hit ? 'HIT' : 'MISS'} at ${new Date(access.timestamp).toLocaleTimeString()}`);
});
```

### Issue: No chunk loads tracked

**Possible causes:**
- No dynamic imports have been triggered yet
- Components are statically imported

**Solution:**
- Navigate to pages that use dynamic imports
- Look for `dynamic()` usage in component code
- Check `lib/dynamic-import.ts` for tracked imports

---

## Success Criteria

✅ **All tests pass** when you:

1. See Web Vitals in console with correct values
2. Performance Dashboard opens and shows metrics
3. Cache hit ratios are tracked and increase over time
4. Leaderboard refreshes are tracked with latency
5. Dynamic chunk loads appear in metrics
6. Threshold violations are logged when budgets exceeded
7. All console helper functions work
8. Development logs appear in console
9. Metrics can be exported as JSON
10. Automated tests pass

---

## Next Steps

If all tests pass:
1. ✅ Performance instrumentation is working correctly
2. 📊 Monitor real usage to establish baselines
3. 🎯 Use thresholds to catch regressions in CI
4. 📈 Track metrics over time to measure improvements

If tests fail:
1. 🔍 Check console for error messages
2. 🐛 Review implementation in `lib/performance-monitor.ts`
3. 📝 Check this guide for troubleshooting steps
4. 🆘 Refer to `docs/TECH_PERFORMANCE_OPTIMIZATION.md` for implementation details

---

**Related Documentation:**
- `docs/TECH_PERFORMANCE_OPTIMIZATION.md` - Implementation details
- `tests/performance-instrumentation.test.js` - Automated test suite
- Issue #82 - Original requirements and acceptance criteria
