# SSR Strategy & Standardized Fetching/Caching

**Purpose:** Documentation for the standardized data fetching and caching strategy for SSR pages and API endpoints.

**Status:** Active  
**Last Updated:** November 11, 2025  
**Related Issues:** [#82](https://github.com/jessephus/marathon-majors-league/issues/82) (SSR/Data Layer - Standardized fetching & caching)  
**Related Docs:** [PROCESS_MONOLITH_AUDIT.md](PROCESS_MONOLITH_AUDIT.md), [CORE_ARCHITECTURE.md](CORE_ARCHITECTURE.md)

---

## Table of Contents

1. [Overview](#overview)
2. [API Client Architecture](#api-client-architecture)
3. [Caching Strategy](#caching-strategy)
4. [Error Handling & Retry Logic](#error-handling--retry-logic)
5. [SSR Data Fetching Patterns](#ssr-data-fetching-patterns)
6. [Migration Guide](#migration-guide)
7. [Testing Strategy](#testing-strategy)
8. [Examples](#examples)

---

## Overview

### Goals

- **Unified API Client**: Single source of truth for all data fetching (`lib/api-client.ts`)
- **Consistent Error Handling**: Exponential backoff retry for transient network errors
- **Optimized Caching**: Stale-while-revalidate for athletes, TTL for results/gameState
- **Server-Side Optimization**: Cache-control headers applied at API endpoints
- **Type Safety**: TypeScript interfaces for all API responses
- **No Raw Fetch**: Eliminate scattered `fetch()` calls in components

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React Components (pages/*.tsx, components/*.tsx)     │  │
│  │  - No direct fetch() calls                            │  │
│  │  - Use apiClient methods exclusively                  │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                           │
│  ┌───────────────▼───────────────────────────────────────┐  │
│  │  lib/api-client.ts (Unified API Client)              │  │
│  │  - Exponential backoff retry                         │  │
│  │  - Unified error handling                            │  │
│  │  - Type-safe interfaces                              │  │
│  │  - Cache utilities export                            │  │
│  └───────────────┬───────────────────────────────────────┘  │
│                  │                                           │
└──────────────────┼───────────────────────────────────────────┘
                   │
                   │ HTTP/HTTPS
                   │
┌──────────────────▼───────────────────────────────────────────┐
│                  API Routes (pages/api/*.js)                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  Cache Headers Applied:                                 │ │
│  │  - athletes: max-age=3600, stale-while-revalidate=86400│ │
│  │  - gameState: max-age=30, stale-while-revalidate=300   │ │
│  │  - results: max-age=15, stale-while-revalidate=120     │ │
│  └─────────────────────────────────────────────────────────┘ │
│                  │                                           │
│  ┌───────────────▼───────────────────────────────────────┐  │
│  │  Database Layer (pages/api/db.js)                     │  │
│  │  - Neon Postgres connection pool                      │  │
│  │  - Parameterized queries                              │  │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## API Client Architecture

### Core Components

The API client (`lib/api-client.ts`) provides:

1. **Unified Request Handler** (`apiRequest`)
   - Handles all HTTP communication
   - Automatic retry with exponential backoff
   - Consistent error formatting
   - Type-safe responses

2. **Domain-Specific APIs**
   - `athleteApi` - Athlete data operations
   - `gameStateApi` - Game configuration
   - `resultsApi` - Race results and scoring
   - `sessionApi` - Session management
   - `rankingsApi` - Player rankings
   - `salaryCapDraftApi` - Team rosters
   - `commissionerApi` - Admin operations
   - `racesApi` - Race event management
   - `athleteRacesApi` - Athlete race confirmations

3. **Cache Utilities** (`cacheUtils`)
   - Server-side cache header generation
   - Endpoint-specific cache configurations
   - Helper functions for API routes

### Usage Examples

#### Client-Side (Components)

```typescript
import { apiClient } from '@/lib/api-client';

// In a React component or page
async function loadAthletes() {
  try {
    const athletes = await apiClient.athletes.list({ confirmedOnly: true });
    // Handle success
  } catch (error) {
    // Error already formatted and retried if transient
    console.error('Failed to load athletes:', error.message);
  }
}

// Fetch results with caching
const results = await apiClient.results.fetch('default');

// Submit team roster
await apiClient.salaryCapDraft.submitTeam('default', playerCode, team);
```

#### Server-Side (API Routes)

```javascript
import { cacheUtils } from '@/lib/api-client';

export default async function handler(req, res) {
  // ... fetch data from database ...
  
  // Apply appropriate cache headers
  cacheUtils.setCacheHeaders(res, 'athletes'); // or 'gameState', 'results', 'default'
  
  res.status(200).json(data);
}
```

---

## Caching Strategy

### Cache Configuration by Endpoint Type

Different data types have different update frequencies and require different caching strategies:

| Endpoint Type | Browser Cache | CDN Cache | Stale-While-Revalidate | Rationale |
|--------------|---------------|-----------|------------------------|-----------|
| **athletes** | 1 hour | 2 hours | 24 hours | Athletes change infrequently (rankings update weekly) |
| **gameState** | 30 seconds | 1 minute | 5 minutes | Game state changes moderately (roster lock, draft, finalization) |
| **results** | 15 seconds | 30 seconds | 2 minutes | Results update frequently during race day |
| **default** | 1 minute | 2 minutes | 5 minutes | General fallback for other endpoints |

### Cache Header Structure

All cacheable endpoints include:

```
Cache-Control: public, max-age=X, s-maxage=Y, stale-while-revalidate=Z
CDN-Cache-Control: max-age=Y
Vary: Accept-Encoding
```

- **max-age**: Browser cache duration
- **s-maxage**: CDN/shared cache duration (often longer than browser cache)
- **stale-while-revalidate**: Time window where stale content can be served while revalidating in background
- **CDN-Cache-Control**: Cloudflare/Vercel edge cache specific directive
- **Vary**: Ensures compression variants are cached separately

### Stale-While-Revalidate Benefits

The `stale-while-revalidate` directive provides:

1. **Instant Response**: Serve cached content immediately, even if slightly stale
2. **Background Update**: Fetch fresh data in the background for next request
3. **Reduced Latency**: Users see content faster without waiting for database queries
4. **Graceful Degradation**: System remains responsive even under load

Example flow:
```
Request 1 (t=0s):    Cache MISS → Fetch from DB (300ms) → Cache for 3600s
Request 2 (t=3601s): Cache STALE → Serve cached immediately (5ms) 
                                  → Background fetch starts for next request
Request 3 (t=3602s): Cache FRESH → Serve fresh data (5ms)
```

### Cache Invalidation Strategy

#### Manual Invalidation

When data is updated via POST/PUT endpoints, caches are invalidated:

1. **Client-side**: State manager triggers `results:invalidated` event
2. **Server-side**: API returns updated data with new ETag
3. **CDN**: Vercel automatically invalidates on deployment

#### Time-Based Invalidation (TTL)

Each endpoint's cache expires based on `max-age` and `s-maxage`:

- Browser cache expires first (max-age)
- CDN cache expires later (s-maxage) 
- Stale content can be served during revalidation window

#### Event-Based Invalidation

State manager events trigger cache invalidation:

```typescript
// In components that display live data
useStateManagerEvent('results:updated', () => {
  // Refetch results data
  fetchResults();
});
```

---

## Error Handling & Retry Logic

### Exponential Backoff Configuration

```typescript
const RETRY_CONFIG = {
  maxRetries: 3,              // Maximum retry attempts
  initialDelayMs: 300,        // Starting delay (300ms)
  maxDelayMs: 5000,           // Maximum delay cap (5s)
  backoffMultiplier: 2,       // Exponential growth factor
  retryableStatusCodes: [     // HTTP codes that warrant retry
    408, // Request Timeout
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504  // Gateway Timeout
  ],
};
```

### Retry Delay Calculation

Delays increase exponentially with jitter to prevent thundering herd:

```
Attempt 1: 300ms ± 75ms   (225-375ms)
Attempt 2: 600ms ± 150ms  (450-750ms)
Attempt 3: 1200ms ± 300ms (900-1500ms)
```

Jitter formula: `delay ± (delay * 0.25 * random)`

### Error Classification

#### Transient Errors (Retryable)

- **Network errors**: `TypeError`, `fetch failed` (no status code)
- **Server errors**: 500, 502, 503, 504
- **Rate limiting**: 429 Too Many Requests
- **Timeout**: 408 Request Timeout

#### Permanent Errors (Non-Retryable)

- **Client errors**: 400, 401, 403, 404
- **Validation errors**: 422 Unprocessable Entity
- **Server logic errors**: Non-5xx errors with error messages

### Error Response Format

All errors are normalized to:

```typescript
{
  message: string;  // Human-readable error message
  error?: string;   // Error code or type (optional)
}
```

Example:
```typescript
try {
  await apiClient.athletes.list();
} catch (error) {
  console.error(error.message);
  // "API request failed: Network error" or
  // "API error: Forbidden"
}
```

---

## SSR Data Fetching Patterns

### Pattern 1: Server-Side Props (Recommended)

Fetch data on the server, pass to component as props:

```typescript
// pages/leaderboard.tsx
import { GetServerSidePropsContext } from 'next';
import { apiClient } from '@/lib/api-client';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const gameId = context.query.gameId as string || 'default';
  
  try {
    // Single fetch on server side
    const [standings, results, gameState] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/standings?gameId=${gameId}`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results?gameId=${gameId}`).then(r => r.json()),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/game-state?gameId=${gameId}`).then(r => r.json()),
    ]);

    return {
      props: {
        gameId,
        initialStandings: standings,
        initialResults: results,
        initialGameState: gameState,
        cacheTimestamp: Date.now(),
      },
    };
  } catch (error) {
    console.error('SSR data fetch error:', error);
    return {
      props: {
        gameId,
        initialStandings: null,
        initialResults: null,
        initialGameState: null,
        cacheTimestamp: Date.now(),
      },
    };
  }
}

function LeaderboardPage({ initialStandings, initialResults, cacheTimestamp }) {
  // Component receives SSR data, no client-side fetch needed on mount
  const [standings, setStandings] = useState(initialStandings);
  const [results, setResults] = useState(initialResults);
  
  // Optionally refresh data on interval (only when page is visible)
  useEffect(() => {
    // ...
  }, []);
  
  return (
    <div>
      {/* Render standings/results */}
    </div>
  );
}
```

### Pattern 2: Client-Side Hydration with API Client

For pages where SSR isn't critical:

```typescript
import { apiClient } from '@/lib/api-client';
import { useEffect, useState } from 'react';

function TeamPage() {
  const [athletes, setAthletes] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadData() {
      try {
        const data = await apiClient.athletes.list({ confirmedOnly: true });
        setAthletes(data);
      } catch (error) {
        console.error('Failed to load athletes:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return <div>{/* Render athletes */}</div>;
}
```

### Pattern 3: Real-Time Updates with Event-Driven Refresh

For live data (results during race):

```typescript
import { useStateManagerEvent } from '@/lib/use-state-manager';
import { apiClient } from '@/lib/api-client';

function LiveResults({ gameId }) {
  const [results, setResults] = useState(null);
  
  // Listen for result update events
  useStateManagerEvent('results:updated', async () => {
    console.log('Results updated, refreshing...');
    const fresh = await apiClient.results.fetch(gameId);
    setResults(fresh);
  });
  
  // Auto-refresh on interval (only when page visible)
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!document.hidden && document.hasFocus()) {
        const fresh = await apiClient.results.fetch(gameId);
        setResults(fresh);
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [gameId]);
  
  return <div>{/* Render live results */}</div>;
}
```

---

## Migration Guide

### Step 1: Replace Raw Fetch Calls

**Before:**
```typescript
// ❌ Raw fetch with no retry or error handling
const response = await fetch('/api/athletes?confirmedOnly=true');
const athletes = await response.json();
```

**After:**
```typescript
// ✅ Using API client with retry and error handling
import { apiClient } from '@/lib/api-client';

const athletes = await apiClient.athletes.list({ confirmedOnly: true });
```

### Step 2: Add Cache Headers to API Routes

**Before:**
```javascript
// pages/api/athletes.js
export default async function handler(req, res) {
  const athletes = await getAllAthletes();
  res.status(200).json(athletes);
}
```

**After:**
```javascript
// pages/api/athletes.js
import { cacheUtils } from '@/lib/api-client';

export default async function handler(req, res) {
  const athletes = await getAllAthletes();
  
  // Apply stale-while-revalidate caching
  cacheUtils.setCacheHeaders(res, 'athletes');
  
  res.status(200).json(athletes);
}
```

### Step 3: Update Component State Management

**Before:**
```typescript
// Component manages its own fetching with useState
const [data, setData] = useState(null);

useEffect(() => {
  fetch('/api/results?gameId=default')
    .then(r => r.json())
    .then(setData);
}, []);
```

**After:**
```typescript
// Component uses API client with proper error handling
import { apiClient } from '@/lib/api-client';

const [data, setData] = useState(null);
const [error, setError] = useState(null);

useEffect(() => {
  async function loadData() {
    try {
      const results = await apiClient.results.fetch('default');
      setData(results);
    } catch (err) {
      setError(err.message);
    }
  }
  loadData();
}, []);
```

### Step 4: Leverage SSR for Initial Load

**Before:**
```typescript
// Client-side only fetching
function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { /* fetch data */ }, []);
  return <div>{data && <Content data={data} />}</div>;
}
```

**After:**
```typescript
// SSR + hydration for instant content
export async function getServerSideProps() {
  const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/data`).then(r => r.json());
  return { props: { initialData: data } };
}

function Page({ initialData }) {
  const [data, setData] = useState(initialData);
  // Data available immediately, no loading state needed
  return <div><Content data={data} /></div>;
}
```

---

## Testing Strategy

### Unit Tests

Test individual API client methods:

```typescript
// tests/api-client.test.ts
import { apiClient } from '@/lib/api-client';

describe('apiClient.athletes', () => {
  test('list() fetches athletes with retry', async () => {
    // Mock fetch with transient failure then success
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ men: [], women: [] })
      });
    
    const result = await apiClient.athletes.list();
    
    expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + 1 retry
    expect(result).toEqual({ men: [], women: [] });
  });
});
```

### Integration Tests

Test SSR data fetching:

```typescript
// tests/ssr-integration.test.ts
describe('Leaderboard SSR', () => {
  test('fetches data once on server side', async () => {
    const { req, res } = createMocks({ query: { gameId: 'default' } });
    
    await getServerSideProps({ req, res });
    
    // Verify single database query, not multiple
    expect(mockDbQuery).toHaveBeenCalledTimes(1);
  });
});
```

### Cache Behavior Tests

Verify cache TTL and stale-while-revalidate:

```typescript
// tests/cache-behavior.test.ts
describe('Cache headers', () => {
  test('athletes endpoint sets correct cache headers', async () => {
    const response = await fetch('/api/athletes');
    const cacheControl = response.headers.get('Cache-Control');
    
    expect(cacheControl).toContain('max-age=3600');
    expect(cacheControl).toContain('stale-while-revalidate=86400');
  });
  
  test('results endpoint sets shorter cache headers', async () => {
    const response = await fetch('/api/results?gameId=default');
    const cacheControl = response.headers.get('Cache-Control');
    
    expect(cacheControl).toContain('max-age=15');
    expect(cacheControl).toContain('stale-while-revalidate=120');
  });
});
```

### Error Handling Tests

Verify retry logic and error formatting:

```typescript
// tests/error-handling.test.ts
describe('API error handling', () => {
  test('retries transient errors with exponential backoff', async () => {
    const startTime = Date.now();
    
    global.fetch = jest.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    
    await apiClient.results.fetch('default');
    const elapsed = Date.now() - startTime;
    
    // Should have delays: ~300ms + ~600ms = ~900ms minimum
    expect(elapsed).toBeGreaterThan(900);
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });
  
  test('does not retry permanent errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Not found' })
    });
    
    await expect(apiClient.athletes.list()).rejects.toThrow('Not found');
    expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
  });
});
```

---

## Examples

### Example 1: Migrating a Component from Raw Fetch

**Before (pages/commissioner.tsx):**
```typescript
useEffect(() => {
  async function loadData() {
    const teamsResponse = await fetch(`/api/salary-cap-draft?gameId=${gameState.gameId}`);
    const teams = await teamsResponse.json();
    
    const athletesResponse = await fetch('/api/athletes?confirmedOnly=true');
    const athletes = await athletesResponse.json();
    
    setTeams(teams);
    setAthletes(athletes);
  }
  loadData();
}, [gameState.gameId]);
```

**After:**
```typescript
import { apiClient } from '@/lib/api-client';

useEffect(() => {
  async function loadData() {
    try {
      const [teams, athletes] = await Promise.all([
        apiClient.salaryCapDraft.getTeam(gameState.gameId),
        apiClient.athletes.list({ confirmedOnly: true }),
      ]);
      
      setTeams(teams);
      setAthletes(athletes);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError(error.message);
    }
  }
  loadData();
}, [gameState.gameId]);
```

**Benefits:**
- ✅ Automatic retry on transient failures
- ✅ Consistent error handling
- ✅ Type-safe responses
- ✅ Parallel requests with `Promise.all`

### Example 2: Migrating an API Route to Use Cache Headers

**Before (pages/api/standings.js):**
```javascript
export default async function handler(req, res) {
  const standings = await calculateStandings(req.query.gameId);
  res.status(200).json(standings);
}
```

**After:**
```javascript
import { cacheUtils } from '@/lib/api-client';

export default async function handler(req, res) {
  const standings = await calculateStandings(req.query.gameId);
  
  // Apply cache headers appropriate for standings data
  // (similar to results - updates frequently during race)
  cacheUtils.setCacheHeaders(res, 'results');
  
  res.status(200).json(standings);
}
```

**Benefits:**
- ✅ Browser caching reduces load
- ✅ CDN caching improves global performance
- ✅ Stale-while-revalidate keeps UI responsive
- ✅ Consistent with other endpoints

### Example 3: SSR Page with Cached Data

**Implementation (pages/leaderboard.tsx):**
```typescript
import { GetServerSidePropsContext } from 'next';

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const gameId = context.query.gameId as string || 'default';
  
  // Fetch on server side (cached by API route headers)
  const [standings, results] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/standings?gameId=${gameId}`).then(r => r.json()),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/results?gameId=${gameId}`).then(r => r.json()),
  ]);

  return {
    props: {
      gameId,
      initialStandings: standings,
      initialResults: results,
      cacheTimestamp: Date.now(),
    },
  };
}

function LeaderboardPage({ initialStandings, initialResults, cacheTimestamp }) {
  const [standings, setStandings] = useState(initialStandings);
  const [results, setResults] = useState(initialResults);
  
  // Refresh data periodically (only when page visible)
  useEffect(() => {
    if (!document.hidden && document.hasFocus()) {
      const interval = setInterval(async () => {
        const [freshStandings, freshResults] = await Promise.all([
          apiClient.standings.fetch(gameId),
          apiClient.results.fetch(gameId),
        ]);
        setStandings(freshStandings);
        setResults(freshResults);
      }, 30000); // 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [gameId]);
  
  return (
    <div>
      <h1>Leaderboard</h1>
      <LeaderboardTable standings={standings} results={results} />
      <p>Last updated: {new Date(cacheTimestamp).toLocaleTimeString()}</p>
    </div>
  );
}
```

**Benefits:**
- ✅ Instant initial render (no loading spinner)
- ✅ SEO-friendly (search engines can crawl)
- ✅ Periodic refresh keeps data current
- ✅ Respects page visibility (no wasted requests)

---

## Acceptance Criteria Checklist

Per issue requirements, the following must be verified:

### ✅ API Client Implementation
- [x] `lib/api-client.ts` created with unified request handler
- [x] Exponential backoff retry for transient errors (408, 429, 5xx)
- [x] Type-safe interfaces for all endpoints
- [x] Cache utilities exported for server-side use

### ✅ Caching Strategy
- [x] Athletes endpoint: `stale-while-revalidate=86400` (24 hours)
- [x] Game State endpoint: `stale-while-revalidate=300` (5 minutes)
- [x] Results endpoint: `stale-while-revalidate=120` (2 minutes)
- [x] Cache headers applied consistently across endpoints

### ✅ Documentation
- [x] SSR strategy documented with diagrams
- [x] Cache TTL configuration explained
- [x] Migration guide for raw fetch → API client
- [x] Testing strategy documented
- [x] Examples provided for common patterns

### ⏳ Migration Progress
- [ ] All pages migrated to use API client (no raw fetch)
- [ ] All components use API client exclusively
- [ ] Public/app.js migrated (legacy monolith)
- [ ] Public/salary-cap-draft.js migrated (legacy draft)

### ⏳ Testing
- [ ] Unit tests for retry logic
- [ ] Integration tests for SSR single fetch
- [ ] Cache TTL behavior tests
- [ ] Error handling tests

---

## Related Documentation

- [PROCESS_MONOLITH_AUDIT.md](PROCESS_MONOLITH_AUDIT.md) - Monolith audit and migration phases
- [PROCESS_SSR_STRATEGY.md](PROCESS_SSR_STRATEGY.md) - Original SSR strategy (pre-enhancement)
- [CORE_ARCHITECTURE.md](CORE_ARCHITECTURE.md) - System architecture overview
- [CORE_DEVELOPMENT.md](CORE_DEVELOPMENT.md) - Development standards and patterns

---

**Document Version:** 1.0  
**Author:** GitHub Copilot  
**Review Status:** Initial Implementation  
**Next Review:** After migration completion
