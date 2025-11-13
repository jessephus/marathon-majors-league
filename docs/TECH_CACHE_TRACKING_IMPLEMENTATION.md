# Cache Tracking Implementation

## Overview

This document describes the complete implementation of HTTP cache performance tracking in the Marathon Majors Fantasy League application. The system tracks cache hits and misses across all API endpoints and reports them in the Performance Dashboard.

## Architecture

### Problem Statement

HTTP caching (ETags, 304 Not Modified responses) happens entirely within the browser's HTTP layer and is invisible to JavaScript. The browser doesn't expose whether a `fetch()` request was satisfied from cache (304) or required fresh data (200).

### Solution

We implemented a server-to-client communication protocol using custom HTTP headers:

1. **Server-side**: API routes add `X-Cache-Status` and `X-Cache-Type` headers to every response
2. **Client-side**: API client reads these headers and tracks cache performance
3. **Performance Monitor**: Aggregates cache statistics for display in dashboard

## Implementation Details

### Server-Side (API Routes)

#### 1. Cache Utilities (`pages/api/lib/cache-utils.js`)

**Enhanced `checkETag()` function:**
```javascript
export function checkETag(req, etag, cacheType = 'unknown', res = null) {
  const clientETag = req.headers['if-none-match'];
  const isHit = clientETag === `"${etag}"`;
  
  // Set X-Cache-Status header for client-side performance tracking
  if (res) {
    res.setHeader('X-Cache-Status', isHit ? 'HIT' : 'MISS');
    res.setHeader('X-Cache-Type', cacheType);
  }
  
  // Log cache status in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Cache] ${cacheType}: ${isHit ? 'HIT (304)' : 'MISS'}`);
  }
  
  return isHit;
}
```

**Key changes:**
- Added `res` parameter to accept response object
- Sets `X-Cache-Status: HIT` or `X-Cache-Status: MISS` header
- Sets `X-Cache-Type` header (e.g., 'results', 'gameState', 'athletes')
- Maintains development logging for server-side debugging

#### 2. API Route Updates

**Three endpoints updated:**
- `/api/athletes` - Athlete data (long cache duration)
- `/api/results` - Race results (short cache duration)
- `/api/standings` - Leaderboard/standings (medium cache duration)

**Example (`/api/results.js`):**
```javascript
// Generate ETag for response data
const etag = generateETag(responseData);

// Set cache headers
res.setHeader('ETag', `"${etag}"`);
setCacheHeaders(res, {
  maxAge: 10,
  sMaxAge: 30,
  staleWhileRevalidate: 60,
});

// Check if client has current version (also sets X-Cache-Status header)
if (checkETag(req, etag, 'results', res)) {
  return send304(res); // 304 Not Modified with X-Cache-Status: HIT
}

// Return fresh data with X-Cache-Status: MISS
res.status(200).json(responseData);
```

**Cache type classification:**
- `'athletes'` - Athlete profile data (changes infrequently)
- `'results'` - Race results (changes frequently during races)
- `'gameState'` - Standings/leaderboard (changes moderately)

### Client-Side (API Client)

#### 1. Enhanced `apiRequest()` function (`lib/api-client.ts`)

**Cache tracking integration:**
```javascript
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryAttempt = 0
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const response = await fetch(url, options);

  // Track cache performance based on X-Cache-Status header
  const cacheStatus = response.headers.get('X-Cache-Status');
  const cacheType = response.headers.get('X-Cache-Type');
  
  if (cacheStatus && cacheType) {
    const isHit = cacheStatus === 'HIT';
    trackCacheAccess(cacheType, isHit);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Cache] ${cacheType}: ${cacheStatus} (${response.status})`);
    }
  }

  // ... rest of error handling and retry logic
}
```

**Key features:**
- Reads `X-Cache-Status` header from every response
- Reads `X-Cache-Type` header to categorize cache access
- Calls `trackCacheAccess()` to record metrics
- Development logging for client-side debugging
- Works for both 200 (fresh) and 304 (cached) responses

#### 2. Performance Monitor Integration

**Helper function:**
```javascript
function trackCacheAccess(cacheType: string, isHit: boolean): void {
  if (typeof window !== 'undefined' && (window as any).__performanceMonitor) {
    (window as any).__performanceMonitor.trackCacheAccess(cacheType, isHit);
  }
}
```

**Performance Monitor (`lib/performance-monitor.ts`):**
- Already has `trackCacheAccess(type, hit)` method
- Stores cache accesses in `cacheAccesses` array
- Calculates hit ratios for overall and per-type statistics
- Provides `getCacheStats()` console helper

## Cache Types and Expected Behavior

### Athletes Cache (`/api/athletes`)

**Characteristics:**
- **Data frequency**: Rarely changes (only when athletes added/updated)
- **Cache duration**: 1 hour browser, 2 hours CDN
- **Expected hit ratio**: 75-100% in normal usage

**Cache behavior:**
```
First request:  200 OK, X-Cache-Status: MISS
Second request: 304 Not Modified, X-Cache-Status: HIT
Third request:  304 Not Modified, X-Cache-Status: HIT
(continues as HIT until data changes or cache expires)
```

### Game State Cache (`/api/standings`)

**Characteristics:**
- **Data frequency**: Moderate (updates when results change)
- **Cache duration**: 30 seconds browser, 60 seconds CDN
- **Expected hit ratio**: 50-75% in normal usage

**Cache behavior:**
```
First request:   200 OK, X-Cache-Status: MISS
Second request:  304 Not Modified, X-Cache-Status: HIT
(30 seconds later)
Third request:   200 OK, X-Cache-Status: MISS (cache expired)
Fourth request:  304 Not Modified, X-Cache-Status: HIT
```

### Results Cache (`/api/results`)

**Characteristics:**
- **Data frequency**: High during active races
- **Cache duration**: 15 seconds browser, 30 seconds CDN
- **Expected hit ratio**: 30-60% during active races, higher when race complete

**Cache behavior during race:**
```
First request:   200 OK, X-Cache-Status: MISS
Second request:  304 Not Modified, X-Cache-Status: HIT
(15 seconds later)
Third request:   200 OK, X-Cache-Status: MISS (cache expired, new results)
Fourth request:  304 Not Modified, X-Cache-Status: HIT
```

## Testing

### Manual Testing

**See `docs/MANUAL_TESTING_GUIDE.md` Test 3** for complete testing instructions.

**Quick test:**
```javascript
// 1. Check initial state
window.getCacheStats();
// Shows: overall: "N/A%", all 0.0%

// 2. Navigate to leaderboard (triggers API calls)
// 3. Navigate away and back (triggers cache hits)

// 4. Check stats again
window.getCacheStats();
// Should show actual percentages:
// overall: "66.7%"
// results: "50.0%"
// gameState: "75.0%"
// athletes: "100.0%"
```

**Expected results after navigation:**
- Overall hit ratio: 50-70% (mix of fresh and cached)
- Athletes: Highest hit ratio (75-100%)
- Game State: Medium hit ratio (50-75%)
- Results: Varies by race activity (30-60% during race, higher when complete)

### Console Debugging

**View all cache accesses:**
```javascript
window.__performanceMonitor.cacheAccesses.forEach(access => {
  console.log(`${access.type}: ${access.hit ? 'HIT' : 'MISS'} at ${new Date(access.timestamp).toLocaleTimeString()}`);
});
```

**Watch cache tracking in real-time:**
```javascript
// Open browser console and watch for:
[Cache] athletes: HIT (304)
[Cache] gameState: MISS (200)
[Cache] results: HIT (304)
```

**Check Network tab:**
- Response Headers should include:
  - `X-Cache-Status: HIT` or `X-Cache-Status: MISS`
  - `X-Cache-Type: athletes` (or results, gameState)
  - `ETag: "abc123"`
  - `Cache-Control: public, max-age=...`

## Performance Dashboard

**Cache Performance section shows:**
- **Overall hit ratio**: Percentage across all cache types
- **Per-type hit ratios**: Athletes, Game State, Results
- **Total cache accesses**: Count of all API calls
- **Recent cache accesses table**: Type, Hit/Miss, Timestamp

**Updates:**
- Dashboard refreshes every 2 seconds
- New cache accesses appear immediately
- Hit ratios recalculated in real-time

## Benefits

### 1. Performance Insights
- See which API endpoints are being cached effectively
- Identify endpoints that need cache tuning
- Understand actual cache behavior vs. configured behavior

### 2. Debugging
- Server and client logs show cache HIT/MISS in development
- Network tab shows cache headers for inspection
- Console helpers provide detailed cache statistics

### 3. Optimization
- Low hit ratios indicate cache duration too short
- High hit ratios confirm effective caching strategy
- Can tune cache durations based on real usage patterns

### 4. Production Monitoring
- Cache metrics exported with performance report
- Can send to analytics for long-term tracking
- Helps identify regressions in cache performance

## Future Enhancements

### 1. Cache Invalidation Tracking
- Track when caches are invalidated due to data changes
- Measure effectiveness of invalidation strategies

### 2. Geographic Cache Performance
- Track cache hits by CDN region
- Identify geographic areas with poor cache performance

### 3. Cache Warming
- Preload frequently accessed data on app initialization
- Improve first-load performance

### 4. Predictive Caching
- Predict which data user will request next
- Prefetch and cache proactively

### 5. Service Worker Integration
- Implement application-level caching with Service Workers
- More control over cache behavior
- Offline support

## Troubleshooting

### Cache metrics showing 0%

**Causes:**
- First page load (no API calls yet)
- Browser cache disabled in DevTools
- Not using centralized API client

**Solutions:**
1. Navigate to pages that make API calls
2. Check console for `[Cache]` log messages
3. Verify Network tab shows `X-Cache-Status` headers
4. Temporarily disable/enable browser cache to trigger MISS/HIT

### Cache always shows MISS

**Causes:**
- Cache duration too short for testing
- ETags changing on every request
- Browser not sending `If-None-Match` header

**Solutions:**
1. Check `ETag` header is consistent across requests
2. Verify browser sends `If-None-Match` on second request
3. Check cache duration in `Cache-Control` header
4. Temporarily increase cache duration for testing

### Cache always shows HIT

**Causes:**
- Data not changing but expecting it to
- Cache duration too long
- Browser cache not respecting server cache headers

**Solutions:**
1. Manually refresh (`Cmd+Shift+R` or `Ctrl+Shift+F5`) to bypass cache
2. Check cache expiration time
3. Verify server data is actually changing

## References

- **HTTP Caching Specification**: [RFC 7234](https://tools.ietf.org/html/rfc7234)
- **ETag Specification**: [RFC 7232](https://tools.ietf.org/html/rfc7232)
- **Cache-Control Directives**: [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
- **Performance API**: [W3C Specification](https://www.w3.org/TR/performance-timeline/)

## Related Documentation

- `docs/MANUAL_TESTING_GUIDE.md` - Manual testing procedures
- `docs/TECH_PERFORMANCE_OPTIMIZATION.md` - Overall performance strategy
- `lib/api-client.ts` - Centralized API client implementation
- `pages/api/lib/cache-utils.js` - Server-side cache utilities
- `lib/performance-monitor.ts` - Performance tracking implementation
