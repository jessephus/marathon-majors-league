# Routing Phase 1 Implementation Guide

**Status:** ✅ Completed  
**Date:** November 4, 2025  
**Related Issue:** [#82 - Componentization](https://github.com/jessephus/marathon-majors-league/issues/82)  
**Related Docs:** [PROCESS_MONOLITH_AUDIT.md](PROCESS_MONOLITH_AUDIT.md), [TECH_SSR_STRATEGY.md](TECH_SSR_STRATEGY.md)

---

## Overview

Phase 1 establishes Next.js page structure with feature flags, enabling parallel implementation where new React pages coexist with legacy monolithic code. This foundation enables gradual migration without breaking existing functionality.

---

## New Page Structure

### Pages Created

| Route | File | Purpose | Bundle Size |
|-------|------|---------|-------------|
| `/` | `pages/index.js` | Landing page with SSR (PR #107) | SSR-enabled |
| `/leaderboard` | `pages/leaderboard.tsx` | Fantasy/race results | 2.33 KB |
| `/commissioner` | `pages/commissioner.tsx` | Admin dashboard | 2.71 KB |
| `/team/[session]` | `pages/team/[session].tsx` | Salary cap draft | 2.79 KB |

**Note:** The experimental `/landing` route (pages/landing.tsx) has been **deprecated and removed** as of November 9, 2025. The primary landing page is now `/` (pages/index.js) with full SSR support.

**Total new code:** ~8 KB (excluding shared framework)  
**Shared framework:** 97.5 KB (React, Next.js, state provider)

### Shared Infrastructure

| Module | Purpose | Location |
|--------|---------|----------|
| **State Provider** | React Context for global state | `lib/state-provider.tsx` |
| **API Client** | Centralized API communication | `lib/api-client.ts` |
| **Feature Flags** | Environment-based toggles | `lib/feature-flags.ts` |

### Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **AthleteModal** | Portal-based athlete details modal | `components/AthleteModal.tsx` |

---

## Architecture Principles

### ✅ Acceptance Criteria Met

1. **Bundle Separation:** Each page has its own bundle (verified via `npm run build:analyze`)
2. **SSR Stub Data:** All pages render with stub data matching `TECH_SSR_STRATEGY.md`
3. **No Legacy Imports:** Zero imports from `/public/app.js` or `/public/salary-cap-draft.js`
4. **Shared Infrastructure Only:** Pages import only state provider and API client

### Key Design Decisions

**State Management:**
- React Context API instead of global variables
- Matches legacy state shape for easy migration
- Type-safe with TypeScript interfaces

**API Communication:**
- Centralized `apiClient` with organized endpoint methods
- Consistent error handling
- Easy to mock for testing

**Feature Flags:**
- Environment variables control new vs. legacy pages
- Gradual rollout without deployment risk
- Easy A/B testing

---

## Usage Guide

### Enabling New Pages

Create `.env.local` file:

```bash
# Enable individual pages
NEXT_PUBLIC_ENABLE_NEW_LANDING=true
NEXT_PUBLIC_ENABLE_NEW_LEADERBOARD=true
NEXT_PUBLIC_ENABLE_NEW_COMMISSIONER=true
NEXT_PUBLIC_ENABLE_NEW_TEAM_SESSION=true
NEXT_PUBLIC_ENABLE_ATHLETE_MODAL=true
```

### Using State Provider

```typescript
import { AppStateProvider, useGameState } from '@/lib/state-provider';

function MyComponent() {
  const { gameState, setGameState } = useGameState();
  
  // Read state
  const athletes = gameState.athletes;
  
  // Update state
  setGameState({ draftComplete: true });
}

// Wrap app in provider
<AppStateProvider>
  <MyComponent />
</AppStateProvider>
```

### Using API Client

```typescript
import { apiClient } from '@/lib/api-client';

// Fetch athletes
const athletes = await apiClient.athletes.list();

// Create session
const session = await apiClient.session.create('Team Name', 'Owner');

// Submit team
await apiClient.salaryCapDraft.submitTeam(gameId, playerCode, team);
```

---

## Development Workflow

### Build and Test

```bash
# Install dependencies
npm install

# Build (verifies TypeScript)
npm run build

# Build with bundle analyzer
npm run build:analyze

# Start development server
npm run dev

# Run tests
npm test
```

### Accessing Pages

With feature flags enabled:
- Landing: `http://localhost:3000/` (SSR-enabled with feature flag)
- Leaderboard: `http://localhost:3000/leaderboard`
- Commissioner: `http://localhost:3000/commissioner`
- Team Session: `http://localhost:3000/team/[token]`

---

## Migration Path

### Current State (Phase 1)

```
pages/
├── index.js          # Legacy monolithic SPA (still primary)
├── landing.tsx       # New landing page (feature flagged)
├── leaderboard.tsx   # New leaderboard (feature flagged)
├── commissioner.tsx  # New commissioner (feature flagged)
└── team/
    └── [session].tsx # New team session (feature flagged)
```

### Phase 2 (Future)

- Replace `pages/index.js` with Next.js pages
- Remove feature flags (new pages become default)
- Add actual data fetching in SSR
- Implement ISR (Incremental Static Regeneration)

### Phase 3 (Future)

- Extract remaining features from monolith
- Remove legacy `app.js` and `salary-cap-draft.js`
- Complete React component migration
- Optimize bundle sizes

---

## File Structure

```
/marathon-majors-league
├── components/
│   └── AthleteModal.tsx          # Portal-based modal component
├── lib/
│   ├── state-provider.tsx        # React Context state management
│   ├── api-client.ts             # Centralized API layer
│   └── feature-flags.ts          # Feature toggle system
├── pages/
│   ├── index.js                  # Legacy app (unchanged)
│   ├── landing.tsx               # New landing page
│   ├── leaderboard.tsx           # New leaderboard
│   ├── commissioner.tsx          # New commissioner dashboard
│   └── team/
│       └── [session].tsx         # New team session
├── public/
│   ├── app.js                    # Legacy monolith (unchanged)
│   └── salary-cap-draft.js       # Legacy draft UI (unchanged)
├── docs/
│   ├── TECH_SSR_STRATEGY.md      # SSR implementation guide
│   └── PROCESS_ROUTING_PHASE1.md # This file
├── .env.example                  # Feature flag documentation
└── tsconfig.json                 # TypeScript config with @/* aliases
```

---

## Performance Metrics

### Bundle Analysis

```
Route                  Size       First Load JS
/ (index)             SSR        Varies (feature flag)
/leaderboard          2.33 kB     99.8 kB
/commissioner         2.71 kB     100 kB
/team/[session]       2.79 kB     100 kB
```

**Note:** The `/landing` route has been removed (deprecated November 9, 2025). The primary landing is now `/` with SSR support.

**Shared bundle:** 97.5 kB (React 19, Next.js 15.5.6)

### Build Performance

- TypeScript compilation: ✅ No errors
- Bundle optimization: ✅ Successful
- SSR rendering: ✅ Working
- Development HMR: ✅ Fast refresh enabled

---

## Testing Checklist

- [x] Build succeeds without TypeScript errors
- [x] Bundle analyzer shows page-specific bundles
- [x] No imports from legacy monolith files
- [x] State provider works with React Context
- [x] API client organizes endpoint methods
- [x] Feature flags toggle page visibility
- [ ] Pages render correctly in development mode
- [ ] Session verification works
- [ ] API calls succeed with stub responses
- [ ] AthleteModal opens as portal
- [ ] Mobile responsive design verified

---

## Known Limitations (Phase 1)

1. **No actual data fetching in SSR:** Pages use stub data per TECH_SSR_STRATEGY.md
2. **Feature flags required:** New pages hidden by default
3. **Limited functionality:** Pages are placeholders - full UX in Phase 2
4. **No legacy replacement:** Old pages still serve traffic
5. **Manual testing required:** Automated tests for Phase 2

---

## Next Steps

### Immediate (Phase 1 Completion)

1. Test pages in development mode
2. Verify API integration end-to-end
3. Test AthleteModal portal functionality
4. Document any issues found
5. Update CORE_CHANGELOG.md

### Phase 2 (Data Fetching)

1. Add actual API calls in getServerSideProps
2. Implement client-side revalidation with SWR
3. Add loading skeletons
4. Optimize bundle sizes
5. Add automated tests

### Phase 3 (Full Migration)

1. Remove feature flags
2. Replace legacy index.js
3. Delete monolithic app.js
4. Complete component extraction
5. Performance optimization

---

## Troubleshooting

### TypeScript Errors

```bash
# Rebuild types
npm run build

# Check specific file (example with team session page)
npx tsc --noEmit pages/team/[session].tsx
```

### Feature Flags Not Working

```bash
# Verify environment variables
cat .env.local

# Restart dev server
npm run dev
```

### Import Errors

```bash
# Verify path aliases in tsconfig.json
# Ensure @/* maps to project root
```

---

## References

- **Issue:** [#82 - Componentization](https://github.com/jessephus/marathon-majors-league/issues/82)
- **Audit:** [PROCESS_MONOLITH_AUDIT.md](PROCESS_MONOLITH_AUDIT.md)
- **SSR Strategy:** [TECH_SSR_STRATEGY.md](TECH_SSR_STRATEGY.md)
- **Architecture:** [CORE_ARCHITECTURE.md](CORE_ARCHITECTURE.md)
- **Development:** [CORE_DEVELOPMENT.md](CORE_DEVELOPMENT.md)

---

**Document Version:** 1.0  
**Author:** GitHub Copilot  
**Status:** Implementation Complete (Testing In Progress)  
**Next Review:** After Phase 2 planning
