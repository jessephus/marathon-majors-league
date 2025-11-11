# Server-Side Rendering (SSR) Strategy

**Purpose:** Define SSR implementation strategy for Next.js page migration during componentization (Phase 1).

**Status:** Active  
**Last Updated:** November 4, 2025  
**Related Issues:** [#82](https://github.com/jessephus/marathon-majors-league/issues/82) (Componentization)  
**Related Docs:** [PROCESS_MONOLITH_AUDIT.md](PROCESS_MONOLITH_AUDIT.md), [CORE_ARCHITECTURE.md](CORE_ARCHITECTURE.md)

---

## Table of Contents

1. [Overview](#overview)
2. [SSR Data Structure](#ssr-data-structure)
3. [Page-Specific SSR Strategy](#page-specific-ssr-strategy)
4. [Migration Approach](#migration-approach)
5. [Performance Considerations](#performance-considerations)

---

## Overview

### Goals

- **Improve initial page load**: Server-render critical content for faster perceived performance
- **SEO optimization**: Enable search engine crawling of game content
- **Progressive enhancement**: Ensure basic functionality without JavaScript
- **Smooth migration**: Allow gradual transition from monolithic SPA to Next.js pages

### SSR Philosophy

During Phase 1 routing migration, pages will use **stub data structures** that:
- Match the expected data shape for each page
- Allow components to render without API calls on server
- Provide placeholder content during hydration
- Enable feature flag-based rollout

---

## SSR Data Structure

### Global State Interface

All pages receive a shared state interface via React Context:

```typescript
interface GameState {
  athletes: {
    men: Athlete[];
    women: Athlete[];
  };
  players: string[];
  currentPlayer: string | null;
  rankings: Record<string, PlayerRanking>;
  teams: Record<string, TeamRoster>;
  results: Record<string, AthleteResult>;
  draftComplete: boolean;
  resultsFinalized: boolean;
  rosterLockTime: string | null;
}

interface SessionState {
  token: string | null;
  teamName: string | null;
  playerCode: string | null;
  ownerName: string | null;
  expiresAt: string | null;
}

interface CommissionerState {
  isCommissioner: boolean;
  loginTime: string | null;
  expiresAt: string | null;
}
```

### Stub Data Defaults

Pages render with empty/default state structures on initial SSR:

```typescript
const SSR_STUB_DATA = {
  gameState: {
    athletes: { men: [], women: [] },
    players: [],
    currentPlayer: null,
    rankings: {},
    teams: {},
    results: {},
    draftComplete: false,
    resultsFinalized: false,
    rosterLockTime: null,
  },
  sessionState: {
    token: null,
    teamName: null,
    playerCode: null,
    ownerName: null,
    expiresAt: null,
  },
  commissionerState: {
    isCommissioner: false,
    loginTime: null,
    expiresAt: null,
  },
};
```

---

## Page-Specific SSR Strategy

### Landing Page (`pages/index.tsx`)

**Purpose:** Welcome screen and team creation entry point

**SSR Data:**
```typescript
export async function getServerSideProps(context) {
  // Check for session token in URL or cookies
  const sessionToken = context.query.token || context.req.cookies.sessionToken;
  
  return {
    props: {
      hasSession: !!sessionToken,
      sessionToken: sessionToken || null,
      // Stub data - no API calls yet
      initialState: SSR_STUB_DATA,
    },
  };
}
```

**Rendered Content:**
- Welcome message
- "Create Team" CTA
- Session restoration UI if token present
- No athlete data required

**Client Hydration:**
- Restore session from token if present
- Load minimal game configuration
- Redirect to appropriate page based on session state

---

### Leaderboard Page (`pages/leaderboard.tsx`)

**Purpose:** Display fantasy standings and race results

**SSR Data:**
```typescript
export async function getServerSideProps(context) {
  const gameId = context.query.gameId || 'default';
  
  // Phase 1: Return stub data
  // Phase 2+: Fetch actual results for SSR
  return {
    props: {
      gameId,
      initialState: {
        ...SSR_STUB_DATA,
        // Placeholder for future SSR data fetching
        results: {}, // Will fetch from API in Phase 2
        teams: {},    // Will fetch from API in Phase 2
      },
    },
  };
}
```

**Rendered Content:**
- Leaderboard table skeleton
- Tab navigation (Fantasy vs Race Results)
- Loading placeholders for team data

**Client Hydration:**
- Fetch current results from API
- Set up auto-refresh (60s interval)
- Enable real-time updates

---

### Commissioner Page (`pages/commissioner.tsx`)

**Purpose:** Administrative dashboard for game management

**SSR Data:**
```typescript
export async function getServerSideProps(context) {
  // Check commissioner authentication
  const commissionerToken = context.req.cookies.commissionerToken;
  
  return {
    props: {
      isAuthenticated: !!commissionerToken,
      initialState: SSR_STUB_DATA,
    },
  };
}
```

**Rendered Content:**
- Login modal if not authenticated
- Dashboard skeleton with action buttons
- Placeholder for game statistics

**Client Hydration:**
- Verify commissioner session
- Load game state for management
- Enable admin actions

---

### Team Session Page (`pages/team/[session].tsx`)

**Purpose:** Team drafting and roster management

**SSR Data:**
```typescript
export async function getServerSideProps(context) {
  const sessionToken = context.params.session;
  
  // Phase 1: Return stub with session token
  // Phase 2+: Verify session and fetch team data
  return {
    props: {
      sessionToken,
      initialState: {
        ...SSR_STUB_DATA,
        sessionState: {
          token: sessionToken,
          teamName: null, // Will verify via API on client
          playerCode: null,
          ownerName: null,
          expiresAt: null,
        },
      },
    },
  };
}
```

**Rendered Content:**
- Session verification message
- Draft interface skeleton
- Roster slot placeholders

**Client Hydration:**
- Verify session token with API
- Load athlete database
- Initialize draft interface
- Check roster lock status

---

## Migration Approach

### Phase 1: Stub Data Only (Current)

**Goal:** Establish page structure without breaking existing functionality

**Implementation:**
```typescript
// All pages use stub data during SSR
export async function getServerSideProps(context) {
  return {
    props: {
      initialState: SSR_STUB_DATA,
    },
  };
}

// Client-side hydration fetches real data
useEffect(() => {
  async function loadData() {
    const data = await apiClient.fetchGameState();
    setGameState(data);
  }
  loadData();
}, []);
```

**Benefits:**
- Fast initial render
- No API dependencies on server
- Minimal SSR complexity
- Easy to test and debug

---

### Phase 2: Partial SSR (Future)

**Goal:** Pre-fetch critical data for improved UX

**Implementation:**
```typescript
export async function getServerSideProps(context) {
  // Fetch critical data on server
  const gameState = await fetchGameState(gameId);
  const athletes = await fetchAthletes();
  
  return {
    props: {
      initialState: {
        gameState,
        athletes,
      },
    },
  };
}
```

**Benefits:**
- Faster perceived load time
- Better SEO for leaderboards
- Reduced client-side API calls

**Challenges:**
- Increased server load
- Cache invalidation complexity
- Stale data concerns

---

### Phase 3: Full SSR with ISR (Future)

**Goal:** Leverage Next.js Incremental Static Regeneration

**Implementation:**
```typescript
export async function getStaticProps(context) {
  const data = await fetchPublicData();
  
  return {
    props: { data },
    revalidate: 60, // Revalidate every 60 seconds
  };
}
```

**Benefits:**
- Optimal performance (CDN-cached pages)
- Automatic background revalidation
- Reduced database load

---

## Performance Considerations

### SSR Performance Targets

| Page | Target TTFB | Target FCP | Strategy |
|------|-------------|------------|----------|
| Landing | < 200ms | < 800ms | Stub data only |
| Leaderboard | < 300ms | < 1200ms | Stub + client fetch |
| Commissioner | < 200ms | < 800ms | Stub + auth check |
| Team Session | < 250ms | < 1000ms | Stub + session verify |

**Definitions:**
- **TTFB (Time to First Byte):** Server response time
- **FCP (First Contentful Paint):** Time to first rendered content

---

### Caching Strategy

**Current Approach (Phase 1):**
- No server-side caching (stub data is instant)
- Client-side caching via React state
- API response caching (30-60s TTL)

**Future Approach (Phase 2+):**
```typescript
// Server-side cache with stale-while-revalidate
const cachedData = await getCachedData(cacheKey, {
  ttl: 60,
  staleWhileRevalidate: true,
});
```

---

### Data Fetching Patterns

**Pattern 1: Client-Only Fetch (Phase 1)**
```typescript
function LeaderboardPage({ initialState }) {
  const [data, setData] = useState(initialState);
  
  useEffect(() => {
    apiClient.fetchResults().then(setData);
  }, []);
  
  return <Leaderboard data={data} />;
}
```

**Pattern 2: SSR + Client Revalidation (Phase 2)**
```typescript
export async function getServerSideProps() {
  const data = await fetchResults();
  return { props: { data } };
}

function LeaderboardPage({ data: initialData }) {
  const { data } = useSWR('/api/results', fetcher, {
    fallbackData: initialData,
    refreshInterval: 60000,
  });
  
  return <Leaderboard data={data} />;
}
```

---

### Bundle Optimization

**Code Splitting Strategy:**

```typescript
// Dynamic imports for heavy components
const AthleteModal = dynamic(() => import('@/components/AthleteModal'), {
  loading: () => <ModalSkeleton />,
});

// Route-based splitting (automatic with Next.js)
// Each page is a separate bundle
```

**Expected Bundle Sizes (Phase 1):**
- Landing page: ~15KB (gzipped)
- Leaderboard: ~40KB (gzipped)
- Commissioner: ~30KB (gzipped)
- Team Session: ~50KB (gzipped)

**Verification:**
```bash
npm run build:analyze
# Opens bundle analyzer to verify page-specific bundles
```

---

## Feature Flags

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_ENABLE_NEW_LANDING=false
NEXT_PUBLIC_ENABLE_NEW_LEADERBOARD=false
NEXT_PUBLIC_ENABLE_NEW_COMMISSIONER=false
NEXT_PUBLIC_ENABLE_NEW_TEAM_SESSION=false
```

### Usage Pattern

```typescript
// Conditional rendering based on feature flag
function App() {
  if (process.env.NEXT_PUBLIC_ENABLE_NEW_LEADERBOARD === 'true') {
    return <NewLeaderboard />;
  }
  
  // Fallback to legacy implementation
  return <LegacyLeaderboard />;
}
```

---

## Migration Verification

### SSR Verification Checklist

- [ ] Page renders with JavaScript disabled (view-source)
- [ ] Initial HTML contains stub data structure
- [ ] No errors in server logs during SSR
- [ ] Client hydration completes without warnings
- [ ] Bundle analyzer shows page-specific bundles
- [ ] No imports from `/public/app.js` or `/public/salary-cap-draft.js`

### Testing Approach

```bash
# Verify SSR output
curl http://localhost:3000/leaderboard | grep -A 20 "<div"

# Verify bundle separation
npm run build:analyze

# Test with JavaScript disabled
# Chrome DevTools > Settings > Debugger > Disable JavaScript
```

---

## Next Steps

### Phase 1 (Current - Routing)
1. ✅ Define SSR strategy (this document)
2. Create page structure with stub data
3. Implement shared state provider
4. Add feature flags
5. Verify bundle separation

### Phase 2 (Future - Data Fetching)
1. Add API data fetching to SSR
2. Implement caching strategy
3. Optimize bundle sizes
4. Add ISR where appropriate

### Phase 3 (Future - Full Migration)
1. Remove legacy monolithic code
2. Complete migration to React components
3. Optimize performance
4. Update all documentation

---

**Document Version:** 1.0  
**Author:** GitHub Copilot  
**Review Status:** Active development  
**Next Review:** After Phase 1 completion
