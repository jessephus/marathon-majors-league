# Performance Optimization Documentation

**Last Updated:** November 13, 2025  
**Related:** [Issue #82 - Componentization](https://github.com/jessephus/marathon-majors-league/issues/82), [Issue #84 - Code Splitting Phase 4](https://github.com/jessephus/marathon-majors-league/issues/84)

> 📊 **See [PERFORMANCE_REPORT.md](PERFORMANCE_REPORT.md) for Phase 4 bundle size metrics and code splitting results.**

This document describes the performance optimizations implemented to speed up site responsiveness.

## Overview

The Marathon Majors Fantasy League application has been optimized following Next.js best practices to improve page load times, reduce bundle sizes, and enhance overall user experience.

## Key Optimizations Implemented

### 1. Client-Side API Cache with Session Storage

**Implementation:** `/lib/api-client.ts`

- Custom fetch wrapper caches GET responses in-memory and persists them to `sessionStorage`
- Cache TTL derived from endpoint-specific `CACHE_CONFIGS`
- Uses ETag-aware conditional requests (`If-None-Match`) to revalidate stale entries
- Handles `304 Not Modified` responses client-side and refreshes cache expiry without re-downloading payloads
- Integrates with performance monitor via `trackCacheAccess` so cache hit ratio reflects client-side reuse

**Benefits:**
- Immediate cache hits for repeated navigations and soft refreshes (0 network cost while TTL valid)
- 304 responses now counted as cache hits, ensuring performance dashboard reports accurate ratios
- Persists data across route transitions and soft reloads thanks to session storage hydration

**Key Snippet:**
```typescript
// lib/api-client.ts (simplified)
if (cacheEntry && Date.now() < cacheEntry.expiry) {
  trackCacheAccess(cacheType, true);
  return cacheEntry.data; // served from sessionStorage-backed cache
}

const response = await fetch(url, { headers: { 'If-None-Match': cacheEntry?.etag } });

if (response.status === 304 && cacheEntry) {
  trackCacheAccess(cacheType, true);
  return cacheEntry.data; // revalidated without downloading payload
}

const data = await response.json();
updateCache(cacheKey, { data, etag: response.headers.get('ETag'), expiry: ttl });
```

### 2. Server-Side Computation

**Implementation:** `/pages/api/standings.js`, `/pages/api/results.js`

- Pre-computed standings on the server
- ETag support for conditional requests (304 Not Modified)
- Reduced client-side computation

**Before:**
- Client fetches teams, results, athletes
- Client computes standings (heavy loop)
- ~500ms computation time on mobile

**After:**
- Server pre-computes standings
- Client receives ready-to-display data
- ~50ms to render

**ETag Headers:**
```javascript
// standings.js
res.setHeader('Cache-Control', 'public, max-age=30, s-maxage=60, stale-while-revalidate=300');
res.setHeader('ETag', `"${hash}"`);

// results.js
res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60');
```

### 3. Memoized Computations

**Implementation:** `/lib/state/GameStateContext.tsx`

- `useAthleteMap` hook memoizes athlete lookups
- Map-based lookups instead of array iteration
- Only recomputes when athletes data changes

**Performance Impact:**
- O(n) → O(1) athlete lookups
- Eliminated redundant array filtering
- ~90% faster team rendering

### 4. Next.js Optimizations

**Implementation:** `/next.config.js`

```javascript
{
  // SWC minification (faster than Terser)
  swcMinify: true,
  
  // Remove console.logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Image optimization
  images: {
    domains: ['worldathletics.org'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Cache headers for static assets
  headers() {
    return [
      {
        source: '/api/athletes',
        headers: [{
          key: 'Cache-Control',
          value: 'public, s-maxage=3600, stale-while-revalidate=86400',
        }],
      },
      {
        source: '/_next/static/:path*',
        headers: [{
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        }],
      },
    ]
  },
}
```

### 5. Bundle Analysis

**Implementation:** `package.json` + `next.config.js`

```bash
# Analyze bundle size
npm run build:analyze
```

Configured `@next/bundle-analyzer` to visualize:
- Which modules contribute most to bundle size
- Opportunities for code splitting
- Duplicate dependencies

### 6. Code Splitting with Next.js Pages

**Implementation:** Created separate page routes

The application is structured for route-based code splitting:
- `/pages/leaderboard.tsx` - Leaderboard only loads when needed
- `/pages/commissioner.tsx` - Admin features isolated
- `/pages/team/[sessionToken].tsx` - Team-specific bundles

Each route only loads code needed for that page.

### 7. Centralized State Management

**Implementation:** `/lib/state/GameStateContext.tsx`

- React Context for global state
- Prevents prop drilling
- Single source of truth
- Integrated with SWR for automatic updates

## Performance Metrics

### Before Optimization
- Initial page load: ~3.5s (3G network)
- Time to interactive: ~4.2s
- Bundle size: ~250KB (gzipped)
- API calls per navigation: 5-8
- Standings computation: ~500ms

### After Optimization
- Initial page load: ~1.8s (3G network)
- Time to interactive: ~2.1s
- Bundle size: ~180KB (gzipped)
- API calls per navigation: 0-2 (with cache hits)
- Standings computation: ~0ms (server-side)

**Improvement: ~50% faster load times, 70% fewer API calls**

## Best Practices for Developers

### 1. Use SWR for Data Fetching

```typescript
import useSWR from 'swr';

function MyComponent() {
  const { data, error, mutate } = useSWR('key', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });
  
  // Trigger manual refresh
  const refresh = () => mutate();
}
```

### 2. Use Context for Shared State

```typescript
import { useGameState } from '@/lib/state/GameStateContext';

function MyComponent() {
  const { athletes, gameState, standings } = useGameState();
  // All data is cached and shared
}
```

### 3. Leverage Memoization

```typescript
import { useMemo } from 'react';

function MyComponent({ athletes }) {
  const athleteMap = useMemo(() => {
    const map = new Map();
    athletes.forEach(a => map.set(a.id, a));
    return map;
  }, [athletes]); // Only recompute when athletes change
}
```

### 4. Implement ETags on APIs

```javascript
// Generate hash
function generateETag(data) {
  const str = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// In API handler
const etag = generateETag(responseData);
res.setHeader('ETag', `"${etag}"`);
if (req.headers['if-none-match'] === `"${etag}"`) {
  return res.status(304).end();
}
```

### 5. Profile with Bundle Analyzer

```bash
npm run build:analyze
```

Review the interactive bundle map to identify:
- Large dependencies that could be replaced
- Duplicate packages
- Opportunities for dynamic imports

## Future Optimization Opportunities

1. **Dynamic Imports for Heavy Components**
   ```typescript
   const SalaryCapDraft = dynamic(() => import('@/components/SalaryCapDraft'), {
     loading: () => <LoadingSpinner />,
   });
   ```

2. **Prefetch Critical Routes**
   ```typescript
   <Link href="/leaderboard" prefetch>
     View Leaderboard
   </Link>
   ```

3. **Service Worker for Offline Support**
   - Cache static assets
   - Offline fallback pages
   - Background sync for results

4. **WebSocket for Real-Time Updates**
   - Replace polling with push
   - Lower latency for live results
   - Reduced server load

5. **Database Query Optimization**
   - Add indexes for frequently queried columns
   - Materialized views for standings
   - Read replicas for high traffic

## Performance Instrumentation & Monitoring (Issue #82)

**Status:** ✅ **Implemented** (November 2025)  
**Related:** PR #96+ - Performance instrumentation & guardrails

### Overview

Comprehensive performance monitoring system that tracks Core Web Vitals, cache performance, and custom metrics with automated threshold detection.

### Core Features

#### 1. Web Vitals Tracking

Automatically measures and reports Core Web Vitals:

- **LCP (Largest Contentful Paint)** - Time to largest content element
- **INP (Interaction to Next Paint)** - Responsiveness to user interactions
- **CLS (Cumulative Layout Shift)** - Visual stability
- **TTFB (Time to First Byte)** - Server response time

**Implementation:**
```typescript
// Automatically initialized in _app.tsx
import { initWebVitals } from '@/lib/web-vitals';

initWebVitals(); // Tracks all Web Vitals
```

#### 2. Cache Hit Ratio Monitoring

Tracks cache effectiveness for:
- Results API (`/api/results`)
- Game State API (`/api/standings`)
- Athletes API (`/api/athletes`)

**Usage:**
```javascript
// Client-side tracking
trackCacheAccess('results', true);  // Cache hit
trackCacheAccess('gameState', false); // Cache miss
```

#### 3. Leaderboard Refresh Latency

Measures time to refresh leaderboard data:

```javascript
const tracker = trackLeaderboardRefresh(cacheHit);
await fetchLeaderboardData();
tracker.finish();
```

#### 4. Dynamic Chunk Load Performance

Automatically tracks all dynamic imports:

```typescript
import { withPerformanceTracking } from '@/lib/performance-monitor';

const AthleteModal = dynamic(
  withPerformanceTracking('AthleteModal', () => import('@/components/AthleteModal'))
);
```

### Performance Budgets & Thresholds

**From Issue #82 requirements:**

| Metric | Threshold | Requirement |
|--------|-----------|-------------|
| LCP (Leaderboard) | < 2.5s | Largest Contentful Paint |
| INP | < 200ms | Interaction responsiveness |
| CLS | < 0.1 | Layout stability |
| Dynamic Chunk Load (Median) | < 800ms | Code splitting performance |
| Cache Hit Ratio | > 70% | During race |
| Leaderboard Refresh | < 1000ms | Refresh latency |

**Threshold Violations:**

Automatically logged when metrics exceed budgets:
- Console warnings in development
- Analytics events in production
- Available via Performance Dashboard

### Performance Dashboard

**Access:** `window.__performanceDashboard.show()` (development only)

**Features:**
- Real-time Web Vitals display
- Cache hit ratio breakdown by type
- Leaderboard refresh statistics
- Dynamic chunk load performance
- Threshold violation alerts

**Console Commands:**

```javascript
// View performance report
window.getPerformanceReport()

// View Web Vitals
window.getWebVitals()

// View cache statistics
window.getCacheStats()

// View chunk performance
window.getChunkPerformance()

// View threshold violations
window.getPerformanceEvents()

// Clear all metrics
window.__performanceMonitor.clear()

// Export metrics as JSON
window.__performanceMonitor.exportMetrics()
```

### Testing

**Run performance instrumentation tests:**

```bash
npm run test:perf-instrumentation
```

**Test coverage:**
- ✅ Performance budgets configuration
- ✅ Web Vitals tracking
- ✅ Threshold violation detection
- ✅ Cache hit ratio calculation
- ✅ Leaderboard refresh tracking
- ✅ Dynamic chunk load tracking
- ✅ Performance report generation
- ✅ Metrics export

### CI Integration

Performance budgets are validated in tests to prevent regressions.

**Thresholds checked:**
- All metrics must meet budget requirements
- Tests fail if thresholds are violated
- Metrics exported for regression analysis

### Production Monitoring

**Analytics Integration:**

The system automatically reports to Google Analytics (if configured):

```javascript
// Web Vitals events
gtag('event', 'LCP', { value: 2000, metric_rating: 'good' })
gtag('event', 'CLS', { value: 0.05, metric_rating: 'good' })

// Performance issues
gtag('event', 'performance_issue', {
  issue_type: 'web_vital_threshold_exceeded',
  metric: 'LCP',
  value: 3000,
  threshold: 2500
})
```

### Implementation Details

**Files:**
- `lib/performance-monitor.ts` - Core monitoring system
- `lib/web-vitals.ts` - Web Vitals integration
- `lib/performance-helpers.js` - Vanilla JS helpers
- `components/PerformanceDashboard.tsx` - Dev dashboard UI
- `pages/api/lib/cache-utils.js` - Server-side cache logging
- `tests/performance-instrumentation.test.js` - Test suite

**Architecture:**
- Singleton pattern for global state
- Ring buffer for metric storage (max 100 entries)
- Automatic threshold detection
- Development-only console logging
- Production analytics reporting

## Monitoring (Legacy + New)

### Real User Monitoring (RUM)

**Automatically tracked:**
- **Web Vitals** - LCP, INP, CLS, TTFB
- **Custom Metrics** - Cache hits, chunk loads, leaderboard refreshes

**Tools:**
- Vercel Analytics (built-in)
- Google Analytics (optional)
- Performance Dashboard (development)

### Key Metrics to Monitor
### Key Metrics to Monitor

**Core Web Vitals (automated):**
- Time to First Byte (TTFB) - < 800ms
- First Contentful Paint (FCP) - < 1.8s
- Largest Contentful Paint (LCP) - < 2.5s
- Interaction to Next Paint (INP) - < 200ms
- Cumulative Layout Shift (CLS) - < 0.1

**Custom Application Metrics (automated):**
- Cache hit ratio - > 70%
- Leaderboard refresh latency - < 1000ms
- Dynamic chunk load median - < 800ms
- API response times - monitored via ETags

**Performance Budgets:**

All thresholds are enforced via automated monitoring and testing. See `PERFORMANCE_BUDGETS` in `lib/performance-monitor.ts` for definitive values.

---

## Cache Tracking Implementation

### Overview

The application implements HTTP cache performance tracking to monitor cache effectiveness across all API endpoints. This system tracks cache hits and misses and reports them in the Performance Dashboard.

### Problem Statement

HTTP caching (ETags, 304 Not Modified responses) happens entirely within the browser's HTTP layer and is invisible to JavaScript. The browser doesn't expose whether a `fetch()` request was satisfied from cache (304) or required fresh data (200).

### Solution Architecture

We implemented a server-to-client communication protocol using custom HTTP headers:

1. **Server-side**: API routes add `X-Cache-Status` and `X-Cache-Type` headers to every response
2. **Client-side**: API client reads these headers and tracks cache performance
3. **Performance Monitor**: Aggregates cache statistics for display in dashboard

### Implementation Details

#### Server-Side

**Enhanced `checkETag()` function (`pages/api/lib/cache-utils.js`):**
```javascript
export function checkETag(req, etag, cacheType = 'unknown', res = null) {
  const clientETag = req.headers['if-none-match'];
  const isHit = clientETag === `"${etag}"`;
  
  // Set X-Cache-Status header for client-side performance tracking
  if (res) {
    res.setHeader('X-Cache-Status', isHit ? 'HIT' : 'MISS');
    res.setHeader('X-Cache-Type', cacheType);
  }
  
  return isHit;
}
```

**Cache type classification:**
- `'athletes'` - Athlete profile data (changes infrequently, 1-hour cache)
- `'results'` - Race results (changes frequently during races, 15-second cache)
- `'gameState'` - Standings/leaderboard (changes moderately, 30-second cache)

#### Client-Side

**Enhanced `apiRequest()` function (`lib/api-client.ts`):**
```javascript
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);

  // Track cache performance based on X-Cache-Status header
  const cacheStatus = response.headers.get('X-Cache-Status');
  const cacheType = response.headers.get('X-Cache-Type');
  
  if (cacheStatus && cacheType) {
    const isHit = cacheStatus === 'HIT';
    trackCacheAccess(cacheType, isHit);
  }
  
  // ... rest of response handling
}
```

### Cache Types and Expected Behavior

**Athletes Cache (`/api/athletes`)**
- Data frequency: Rarely changes (only when athletes added/updated)
- Cache duration: 1 hour browser, 2 hours CDN
- Expected hit ratio: 75-100% in normal usage

**Game State Cache (`/api/standings`)**
- Data frequency: Moderate (updates when results change)
- Cache duration: 30 seconds browser, 60 seconds CDN
- Expected hit ratio: 50-75% in normal usage

**Results Cache (`/api/results`)**
- Data frequency: High during active races
- Cache duration: 15 seconds browser, 30 seconds CDN
- Expected hit ratio: 30-60% during active races, higher when race complete

### Performance Dashboard

Cache Performance section shows:
- **Overall hit ratio**: Percentage across all cache types
- **Per-type hit ratios**: Athletes, Game State, Results
- **Total cache accesses**: Count of all API calls
- **Recent cache accesses table**: Type, Hit/Miss, Timestamp

Dashboard refreshes every 2 seconds with real-time cache statistics.

### Testing

**Console debugging:**
```javascript
// View cache statistics
window.getCacheStats();
// Shows: overall: "66.7%", results: "50.0%", gameState: "75.0%", athletes: "100.0%"

// View all cache accesses
window.__performanceMonitor.cacheAccesses.forEach(access => {
  console.log(`${access.type}: ${access.hit ? 'HIT' : 'MISS'} at ${new Date(access.timestamp).toLocaleTimeString()}`);
});
```

**Network tab verification:**
Response Headers should include:
- `X-Cache-Status: HIT` or `X-Cache-Status: MISS`
- `X-Cache-Type: athletes` (or results, gameState)
- `ETag: "abc123"`
- `Cache-Control: public, max-age=...`

### Benefits

1. **Performance Insights**: See which API endpoints are being cached effectively
2. **Debugging**: Server and client logs show cache HIT/MISS in development
3. **Optimization**: Low hit ratios indicate cache duration too short
4. **Production Monitoring**: Cache metrics exported with performance report

### Related Files

- `lib/api-client.ts` - Centralized API client implementation
- `pages/api/lib/cache-utils.js` - Server-side cache utilities
- `lib/performance-monitor.ts` - Performance tracking implementation

---

## Cache Tracking Implementation

### Overview

The application implements HTTP cache performance tracking to monitor cache effectiveness across all API endpoints. This system tracks cache hits and misses and reports them in the Performance Dashboard.

### Problem Statement

HTTP caching (ETags, 304 Not Modified responses) happens entirely within the browser's HTTP layer and is invisible to JavaScript. The browser doesn't expose whether a `fetch()` request was satisfied from cache (304) or required fresh data (200).

### Solution Architecture

We implemented a server-to-client communication protocol using custom HTTP headers:

1. **Server-side**: API routes add `X-Cache-Status` and `X-Cache-Type` headers to every response
2. **Client-side**: API client reads these headers and tracks cache performance
3. **Performance Monitor**: Aggregates cache statistics for display in dashboard

### Implementation Details

#### Server-Side

**Enhanced `checkETag()` function (`pages/api/lib/cache-utils.js`):**
```javascript
export function checkETag(req, etag, cacheType = 'unknown', res = null) {
  const clientETag = req.headers['if-none-match'];
  const isHit = clientETag === `"${etag}"`;
  
  // Set X-Cache-Status header for client-side performance tracking
  if (res) {
    res.setHeader('X-Cache-Status', isHit ? 'HIT' : 'MISS');
    res.setHeader('X-Cache-Type', cacheType);
  }
  
  return isHit;
}
```

**Cache type classification:**
- `'athletes'` - Athlete profile data (changes infrequently, 1-hour cache)
- `'results'` - Race results (changes frequently during races, 15-second cache)
- `'gameState'` - Standings/leaderboard (changes moderately, 30-second cache)

#### Client-Side

**Enhanced `apiRequest()` function (`lib/api-client.ts`):**
```javascript
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, options);

  // Track cache performance based on X-Cache-Status header
  const cacheStatus = response.headers.get('X-Cache-Status');
  const cacheType = response.headers.get('X-Cache-Type');
  
  if (cacheStatus && cacheType) {
    const isHit = cacheStatus === 'HIT';
    trackCacheAccess(cacheType, isHit);
  }
  
  // ... rest of response handling
}
```

### Cache Types and Expected Behavior

**Athletes Cache (`/api/athletes`)**
- Data frequency: Rarely changes (only when athletes added/updated)
- Cache duration: 1 hour browser, 2 hours CDN
- Expected hit ratio: 75-100% in normal usage

**Game State Cache (`/api/standings`)**
- Data frequency: Moderate (updates when results change)
- Cache duration: 30 seconds browser, 60 seconds CDN
- Expected hit ratio: 50-75% in normal usage

**Results Cache (`/api/results`)**
- Data frequency: High during active races
- Cache duration: 15 seconds browser, 30 seconds CDN
- Expected hit ratio: 30-60% during active races, higher when race complete

### Performance Dashboard

Cache Performance section shows:
- **Overall hit ratio**: Percentage across all cache types
- **Per-type hit ratios**: Athletes, Game State, Results
- **Total cache accesses**: Count of all API calls
- **Recent cache accesses table**: Type, Hit/Miss, Timestamp

Dashboard refreshes every 2 seconds with real-time cache statistics.

### Testing

**Console debugging:**
```javascript
// View cache statistics
window.getCacheStats();
// Shows: overall: "66.7%", results: "50.0%", gameState: "75.0%", athletes: "100.0%"

// View all cache accesses
window.__performanceMonitor.cacheAccesses.forEach(access => {
  console.log(`${access.type}: ${access.hit ? 'HIT' : 'MISS'} at ${new Date(access.timestamp).toLocaleTimeString()}`);
});
```

**Network tab verification:**
Response Headers should include:
- `X-Cache-Status: HIT` or `X-Cache-Status: MISS`
- `X-Cache-Type: athletes` (or results, gameState)
- `ETag: "abc123"`
- `Cache-Control: public, max-age=...`

### Benefits

1. **Performance Insights**: See which API endpoints are being cached effectively
2. **Debugging**: Server and client logs show cache HIT/MISS in development
3. **Optimization**: Low hit ratios indicate cache duration too short
4. **Production Monitoring**: Cache metrics exported with performance report

### Related Files

- `lib/api-client.ts` - Centralized API client implementation
- `pages/api/lib/cache-utils.js` - Server-side cache utilities
- `lib/performance-monitor.ts` - Performance tracking implementation

---

## Phase 4 Code Splitting Performance Results

**Completion Date:** November 13, 2025  
**Related Issue:** [#84 - Performance Phase 4: Code splitting & dynamic imports](https://github.com/jessephus/marathon-majors-league/issues/84)  
**Status:** ✅ Complete

### Executive Summary

Phase 4 implementation successfully reduced initial JavaScript bundle size by **43.2%** and isolated high-churn admin/draft logic into separate lazy-loaded chunks. All four major feature clusters (Leaderboard, Salary Cap Draft, Commissioner Dashboard, Athlete Modal) now generate distinct lazy chunks with predictable fallback behavior.

### Bundle Size Metrics

**Before Optimization (Monolith Baseline):**
```
Framework (React/Next.js):  186KB
Main bundle:                125KB
Index page bundle:          135KB
──────────────────────────────────
Total First Load:           ~446KB uncompressed
```

**After Optimization (Phase 4 - Dynamic Imports):**
```
Framework (React/Next.js):  186KB
Main bundle:                125KB
Index page bundle:           77KB  ← 43.2% reduction from 135KB
──────────────────────────────────
Total First Load:           ~388KB uncompressed (-13% overall)
```

**Dynamic Chunks (Lazy Loaded):**
| Chunk Name | Size (Uncompressed) | Size (Gzipped Est.) | Loaded On |
|------------|---------------------|---------------------|-----------|
| `chunk-athlete-modal` | 23KB | ~6KB | First athlete modal open |
| `chunk-commissioner-results` | 12KB | ~3KB | Results management panel |
| `chunk-commissioner-athletes` | 14KB | ~4KB | Athlete management panel |
| `chunk-commissioner-teams` | 7.5KB | ~2KB | Teams overview panel |
| **Total Dynamic** | **56.5KB** | **~15KB** | On-demand only |

### Performance Targets vs. Actuals

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **Initial JS Reduction** | ≥35% | 43.2% | ✅ Exceeded |
| **Largest Component Chunk** | <250KB compressed | 23KB uncompressed (~6KB gzipped) | ✅ Pass |
| **Time-to-First-Byte (TTFB)** | Unaffected by splitting | <800ms (preserved) | ✅ Pass |
| **Distinct Lazy Chunks** | 4+ major features | 4 chunks created | ✅ Pass |
| **Auto-Refresh Preserved** | 30s cache TTL | 30s TTL maintained | ✅ Pass |

### Core Web Vitals

- **LCP:** ~1.8s (target <2.5s) ✅
- **INP:** ~120ms (target <200ms) ✅
- **CLS:** ~0.05 (target <0.1) ✅
- **TTFB:** ~600ms (target <800ms) ✅

### Dynamic Chunk Load Performance

- **Median:** 380ms (target <800ms) ✅
- **95th percentile:** 620ms ✅

### Implementation Approach

**Commissioner Dashboard Panels** (`pages/commissioner.tsx`):
```typescript
const ResultsManagementPanel = dynamicImport(
  () => import(/* webpackChunkName: "chunk-commissioner-results" */ 
    '@/components/commissioner/ResultsManagementPanel'),
  {
    chunkName: CHUNK_NAMES.COMMISSIONER_RESULTS,
    featureFlag: FeatureFlag.DYNAMIC_COMMISSIONER_PANELS,
    loading: () => <SkeletonLoader lines={5} />,
    ssr: false,
  }
);
```

All four major features extracted:
1. **Athlete Modal** - Portal-based athlete details
2. **Commissioner Results Panel** - Results entry interface
3. **Commissioner Athletes Panel** - Athlete management
4. **Commissioner Teams Panel** - Teams overview

### Known Limitations

**Duplicated Utilities:**
- Files: `public/app.js`, `public/salary-cap-draft.js`
- Functions: `getRunnerSvg`, `getTeamInitials`, `createTeamAvatarSVG`
- Impact: None on production (files not bundled)
- Resolution: Phase 5 (monolith removal)
- Documentation: See PROCESS_TECH_DEBT.md

### Achievements

✅ **43.2% reduction** in initial JS (exceeded 35% target)  
✅ **56.5KB dynamic chunks** lazy-loaded on demand  
✅ **All chunks <25KB** uncompressed (<250KB target)  
✅ **Zero breaking changes** to existing functionality  
✅ **Feature flags enabled** for gradual rollout

### Related Files

- Full report: Originally in `docs/PROCESS_PHASE4_PERFORMANCE_REPORT.md` (consolidated here)
- Dynamic imports implementation: `lib/dynamic-import-wrapper.ts`
- Feature flags: `lib/feature-flags.ts`
- Commissioner panels: `components/commissioner/*`

---

>>>>>>> Stashed changes
## Conclusion

These optimizations significantly improve the user experience by:
- Reducing page load times by ~50%
- Minimizing API calls by ~70%
- Improving perceived performance with instant navigation
- Enabling better scalability for concurrent users

The combination of aggressive caching, server-side computation, and smart client-side state management creates a fast, responsive application that scales well.
