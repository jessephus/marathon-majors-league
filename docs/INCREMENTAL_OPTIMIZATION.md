# Incremental Optimization Migration Guide

This guide explains how to incrementally apply performance optimizations to the existing Fantasy NY Marathon application without requiring a complete rewrite.

## Overview

The application currently uses a Single Page Application (SPA) pattern with all logic in `app.js`. This guide shows how to optimize it step-by-step while maintaining backward compatibility.

## Phase 1: Add Optimization Utilities (Quick Wins)

### Step 1.1: Add optimizations.js Script

Include the optimization utilities in your HTML:

```html
<!-- In pages/index.js or index.html -->
<Script src="/optimizations.js" strategy="afterInteractive" />
```

### Step 1.2: Cache Session Restoration

Replace calls to `restoreSession()` with the cached version:

**Before:**
```javascript
async function init() {
  await loadGameState();
  const hasSession = await restoreSession();
  // ...
}
```

**After:**
```javascript
async function init() {
  await loadGameState();
  const hasSession = await restoreSessionCached();
  // ...
}
```

**Impact:** Eliminates redundant session checks when navigating between pages.

### Step 1.3: Deduplicate API Requests

Replace `fetch` calls with `fetchWithDedup`:

**Before:**
```javascript
const response = await fetch(`${API_BASE}/api/standings?gameId=${GAME_ID}`);
const data = await response.json();
```

**After:**
```javascript
const data = await fetchWithDedup(`${API_BASE}/api/standings?gameId=${GAME_ID}`);
```

**Impact:** Prevents duplicate requests when multiple components need the same data.

### Step 1.4: Throttle Expensive Operations

Wrap standings updates with throttle:

**Before:**
```javascript
document.getElementById('refresh-standings').addEventListener('click', async () => {
  await updateLiveStandings();
});
```

**After:**
```javascript
const updateStandingsThrottled = throttle(updateLiveStandings, 10000);

document.getElementById('refresh-standings').addEventListener('click', () => {
  updateStandingsThrottled();
});
```

**Impact:** Prevents excessive API calls from rapid button clicks or auto-refresh.

## Phase 2: Adopt SWR for Data Fetching

### Step 2.1: Include SWR via CDN (No Build Step)

```html
<Script src="https://unpkg.com/swr@2.2.4/dist/index.umd.js" />
```

### Step 2.2: Create Data Hooks

Create a new file `public/data-hooks.js`:

```javascript
// Configure SWR
const { default: useSWR, SWRConfig } = window.SWR;

// Custom fetcher
const fetcher = (url) => fetch(url).then(r => r.json());

// Hook for athletes data
function useAthletes() {
  const { data, error, mutate } = useSWR('/api/athletes', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300000, // 5 minutes
  });
  
  return {
    athletes: data,
    isLoading: !error && !data,
    error,
    refresh: mutate,
  };
}

// Hook for game state
function useGameState(gameId) {
  const { data, error, mutate } = useSWR(
    `/api/game-state?gameId=${gameId}`,
    fetcher,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );
  
  return {
    gameState: data,
    isLoading: !error && !data,
    error,
    refresh: mutate,
  };
}

// Hook for standings
function useStandings(gameId) {
  const { data, error, mutate } = useSWR(
    `/api/standings?gameId=${gameId}&cached=true`,
    fetcher,
    {
      refreshInterval: 60000, // Poll every minute
      revalidateOnFocus: true,
    }
  );
  
  return {
    standings: data?.standings,
    isLoading: !error && !data,
    error,
    refresh: mutate,
  };
}
```

### Step 2.3: Replace Manual Fetching

**Before:**
```javascript
async function loadAthletes() {
  try {
    const response = await fetch(`${API_BASE}/api/athletes`);
    const data = await response.json();
    gameState.athletes = data;
  } catch (error) {
    console.error('Error loading athletes:', error);
  }
}
```

**After:**
```javascript
const athletesHook = useAthletes();

// Access data
if (athletesHook.athletes) {
  gameState.athletes = athletesHook.athletes;
}

// Refresh when needed
await athletesHook.refresh();
```

## Phase 3: Optimize API Endpoints (Server-Side)

### Step 3.1: Add ETag Support

This is already done for `/api/standings` and `/api/results`. Apply the same pattern to other endpoints:

```javascript
// In any API endpoint
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

export default async function handler(req, res) {
  const data = await fetchData();
  const etag = generateETag(data);
  
  res.setHeader('ETag', `"${etag}"`);
  res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
  
  if (req.headers['if-none-match'] === `"${etag}"`) {
    return res.status(304).end();
  }
  
  res.status(200).json(data);
}
```

### Step 3.2: Add Conditional Scoring Triggers

**Before:** Scoring runs on every results fetch

**After:** Check if results actually changed

```javascript
// In /api/results
async function shouldRescore(gameId) {
  const lastUpdate = await getLastResultsUpdate(gameId);
  const lastScore = await getLastScoringUpdate(gameId);
  
  // Only rescore if results changed after last scoring
  return lastUpdate > lastScore;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const results = await fetchResults();
    
    // Only rescore if needed
    if (await shouldRescore(gameId)) {
      await scoreRace(gameId);
    }
    
    res.json(results);
  }
}
```

## Phase 4: Incremental Migration to Next.js Pages

### Step 4.1: Create First Optimized Page

Start with the leaderboard (already created in `/pages/leaderboard.tsx`):

1. Create the page component with SWR
2. Test it works independently
3. Update navigation to use Next.js Link

```javascript
// In app.js, update leaderboard navigation
document.getElementById('view-leaderboard').addEventListener('click', () => {
  // Instead of showPage('leaderboard-page')
  window.location.href = '/leaderboard';
});
```

### Step 4.2: Gradually Migrate Other Pages

Migrate pages in this order (easiest to hardest):

1. ✅ Leaderboard (done)
2. Results/standings view
3. Team roster view
4. Commissioner dashboard
5. Draft interface
6. Salary cap draft (most complex)

### Step 4.3: Keep SPA for Complex Interactions

Some pages work better as SPA components:
- Drag-and-drop ranking
- Real-time draft
- Interactive salary cap builder

These can remain in the SPA while other pages use Next.js routing.

## Phase 5: Bundle Optimization

### Step 5.1: Analyze Current Bundle

```bash
npm run build:analyze
```

Review the bundle analyzer to identify:
- Large dependencies (can they be replaced?)
- Duplicated code (can it be shared?)
- Unused code (can it be removed?)

### Step 5.2: Code Split Large Features

For features like salary cap draft, use dynamic imports:

```javascript
// In pages/salary-cap-draft.tsx
import dynamic from 'next/dynamic';

const SalaryCapDraft = dynamic(
  () => import('../components/SalaryCapDraft'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // Disable SSR for complex client-only components
  }
);
```

### Step 5.3: Optimize Chart.js

Chart.js is large. Only import what you need:

**Before:**
```html
<Script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js" />
```

**After:**
```javascript
import {
  Chart,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

Chart.register(CategoryScale, LinearScale, BarElement, Title);
```

## Measuring Impact

### Before Each Change

1. Measure baseline:
   ```bash
   # Page load time
   # API call count
   # Time to interactive
   ```

2. Make the change

3. Measure again and compare

### Key Metrics to Track

- **Initial load time**: Time until page is usable
- **Navigation speed**: Time to switch pages
- **API call count**: Number of requests per action
- **Memory usage**: Check for leaks
- **Bundle size**: Total JS downloaded

## Testing Strategy

### 1. Backward Compatibility

Ensure existing sessions still work:
- Team sessions from localStorage
- Commissioner sessions
- URL-based sessions

### 2. Performance Testing

Test on slow networks:
```bash
# Chrome DevTools > Network > Throttling > Slow 3G
```

### 3. Multi-tab Testing

Verify optimization doesn't break:
- Opening same game in multiple tabs
- Session sync across tabs
- Cache invalidation

## Rollback Plan

If any optimization causes issues:

1. Remove the optimization script
2. Revert specific API changes
3. Remove Next.js page and restore SPA navigation

All changes are designed to be incremental and reversible.

## Quick Wins Summary

Implement these in order of impact:

1. **Add ETag support to APIs** (20% fewer bytes transferred)
2. **Cache session restoration** (50% faster navigation)
3. **Throttle standings updates** (70% fewer API calls)
4. **Deduplicate requests** (30% fewer concurrent requests)
5. **Use SWR for data fetching** (80% cache hit rate)

## Long-term Goals

Eventually, the application should:

1. Use Next.js pages for all routes
2. Use SWR/React Query for all data fetching
3. Server-side render initial HTML
4. Code split by route
5. Lazy load heavy features

But these can be done incrementally without disrupting existing functionality.

## Getting Help

If you encounter issues:

1. Check the Performance Optimization docs
2. Review the example leaderboard page
3. Test with bundle analyzer
4. Profile with Chrome DevTools

The goal is steady, incremental improvement, not a risky big-bang rewrite.
