# Test Data Cleanup Migration Plan

**Issue:** [#142](https://github.com/jessephus/marathon-majors-league/pull/142)  
**Date:** November 20, 2025  
**Status:** Planning Complete - Ready for Implementation

## Overview

This document provides a comprehensive plan to migrate all tests to use one of the two standardized cleanup approaches:
1. **Array Tracking** - Simple approach for basic tests
2. **TestContext Class** - Advanced approach for complex tests

## Decision Matrix Summary

From `CLEANUP_APPROACH_COMPARISON.md`:

| Use Array Tracking When | Use TestContext When |
|-------------------------|----------------------|
| Testing 1-3 resource types | Creating 4+ resource types |
| Using API endpoints for CRUD | Need direct database access |
| Database CASCADE handles dependencies | Complex foreign key relationships |
| Test file is small and focused | Need guaranteed cleanup on failure |
| Minimal overhead needed | Want per-test isolation |

## Test File Analysis & Migration Plan

### Phase 1: High Priority - Database Tests (3 tests)

These tests directly interact with the database and create persistent data.

#### 1. ✅ `race-management.test.js` - **KEEP Array Tracking**
- **Current State:** Already uses array tracking correctly
- **Resource Types:** 3 (races, athleteRaces, raceNews)
- **API Usage:** Yes (uses API endpoints)
- **Complexity:** Low
- **Decision:** ✅ **Keep current approach** - Working well, fits array tracking pattern
- **Action:** None needed - already compliant

#### 2. 🔄 `game-flow.test.js` - **MIGRATE to TestContext**
- **Current State:** Uses deprecated pattern matching cleanup
- **Resource Types:** 6+ (games, sessions, rankings, draft_teams, salary_cap_teams, race_results)
- **API Usage:** Mixed (API + direct DB)
- **Complexity:** High (end-to-end game flow)
- **Decision:** 🔄 **MIGRATE to TestContext**
- **Reason:** Complex, many resource types, needs per-test isolation
- **Priority:** HIGH

#### 3. 🔄 `salary-cap-draft.test.js` - **MIGRATE to TestContext**
- **Current State:** Uses `cleanupTestGame()` and `cleanupTestSessions()` in module-level `after()`
- **Resource Types:** 4+ (games, sessions, salary_cap_teams, athletes)
- **API Usage:** API endpoints primarily
- **Complexity:** Medium-High (draft flow, budget validation)
- **Decision:** 🔄 **MIGRATE to TestContext**
- **Reason:** Multiple resource types, needs per-test isolation for concurrent tests
- **Priority:** HIGH

### Phase 2: Medium Priority - Integration Tests (4 tests)

These tests may create data but focus on integration scenarios.

#### 4. ⚪ `api-endpoints.test.js` - **ADD Array Tracking**
- **Current State:** No cleanup implemented
- **Resource Types:** 2-3 (games, rankings, results)
- **API Usage:** Yes (tests API endpoints)
- **Complexity:** Low (endpoint testing)
- **Decision:** ⚪ **ADD Array Tracking**
- **Reason:** Simple, API-focused, minimal resources
- **Priority:** MEDIUM

#### 5. ⚪ `database.test.js` - **No Change Needed**
- **Current State:** No persistent data created (read-only tests)
- **Resource Types:** 0 (only reads existing data)
- **Decision:** ⚪ **No cleanup needed**
- **Reason:** Read-only test, no data pollution
- **Priority:** N/A

#### 6. ⚪ `frontend-integration.test.js` - **No Change Needed**
- **Current State:** No database interaction
- **Resource Types:** 0 (only tests static assets)
- **Decision:** ⚪ **No cleanup needed**
- **Reason:** No database writes
- **Priority:** N/A

#### 7. 🔄 `performance-benchmarks.test.js` - **ADD TestContext**
- **Current State:** Unknown cleanup status
- **Resource Types:** Likely 4+ (games, sessions, teams, results for load testing)
- **Complexity:** High (concurrent user simulation)
- **Decision:** 🔄 **ADD TestContext**
- **Reason:** Likely creates many resources for performance testing
- **Priority:** MEDIUM

### Phase 3: Low Priority - Unit Tests (21 tests)

These tests typically don't interact with the database.

#### 8-28. ⚪ **No Change Needed** (21 tests)
- `state-manager.test.js` - No DB (uses mocks)
- `state-manager-integration.test.js` - No DB (uses mocks)
- `dynamic-imports.test.js` - No DB
- `dynamic-import-e2e.test.js` - No DB
- `dynamic-import-coverage.test.js` - No DB
- `leaderboard-components.test.js` - No DB
- `api-client.test.js` - No DB (mocks)
- `api-client-coverage.test.js` - No DB (mocks)
- `ssr-integration.test.js` - No DB
- `nextjs-routing.test.js` - No DB
- `landing-page-ssr.test.js` - No DB
- `team-session-ssr.test.js` - No DB
- `formatting-utils.test.js` - No DB
- `budget-utils.test.js` - No DB
- `session-manager-coverage.test.js` - No DB
- `feature-flags-coverage.test.js` - No DB
- `web-vitals-coverage.test.js` - No DB
- `auto-save-roster.test.js` - No DB
- `performance-instrumentation.test.js` - No DB
- `legacy-regression.test.js` - Read-only API tests
- `game-flow-with-context.test.js` - ✅ **Already uses TestContext**

## Implementation Order

### Sprint 1: Critical Database Tests
1. `game-flow.test.js` → TestContext (HIGH)
2. `salary-cap-draft.test.js` → TestContext (HIGH)
3. `api-endpoints.test.js` → Array Tracking (MEDIUM)

### Sprint 2: Performance & Edge Cases
4. `performance-benchmarks.test.js` → TestContext (MEDIUM)

### Sprint 3: Verification
5. Run full test suite
6. Verify no test data pollution
7. Run `audit-test-data.js` to confirm clean state

## Migration Templates

### Template 1: Array Tracking Migration

```javascript
// At top of file
const testData = {
  games: [],
  sessions: [],
  // Add other resource types as needed
};

// Module-level cleanup
after(async () => {
  console.log('\n🧹 Cleaning up test data...');
  
  // Clean in reverse dependency order
  for (const sessionId of testData.sessions) {
    await apiRequest(`/api/session/delete`, { 
      method: 'POST',
      body: JSON.stringify({ sessionToken: sessionId })
    });
  }
  
  for (const gameId of testData.games) {
    await cleanupTestGame(gameId);
  }
});

// In tests - MUST track every resource
it('should create resource', async () => {
  const game = await createGame();
  testData.games.push(game.id);  // ← MUST DO THIS
});
```

### Template 2: TestContext Migration

```javascript
import { TestContext } from './test-context.js';

describe('My Test Suite', () => {
  let testCtx;
  
  beforeEach(() => {
    testCtx = new TestContext('my-test');
  });
  
  afterEach(async () => {
    await testCtx.cleanup();
  });
  
  it('should do something', async () => {
    // Create and automatically track
    const gameId = await testCtx.createGame({ players: [] });
    const sessionId = await testCtx.createSession('player', 'Test User', gameId);
    
    // If using API to create resources, track manually:
    const response = await fetch('/api/races', { method: 'POST', ... });
    const race = await response.json();
    testCtx.trackResource('races', race.id);
    
    // All automatically cleaned up
  });
});
```

## Success Criteria

✅ **Test Passes:**
- [ ] All tests pass after migration
- [ ] No test failures due to cleanup changes

✅ **No Data Pollution:**
- [ ] Run `node scripts/audit-test-data.js` → 0 test records found
- [ ] Run tests multiple times → no accumulation

✅ **Proper Cleanup:**
- [ ] Tests clean up on success
- [ ] Tests clean up on failure (throw error mid-test)
- [ ] Cleanup respects foreign key constraints

✅ **Documentation:**
- [ ] Each migrated test includes cleanup comment
- [ ] `tests/README.md` updated with cleanup approach for each test
- [ ] Examples added for both patterns

## Rollout Strategy

### Week 1: High Priority (3 tests)
- Day 1: Migrate `game-flow.test.js`
- Day 2: Migrate `salary-cap-draft.test.js`
- Day 3: Migrate `api-endpoints.test.js`
- Day 4-5: Testing & verification

### Week 2: Medium Priority (1 test)
- Day 1: Migrate `performance-benchmarks.test.js`
- Day 2-5: Final verification & documentation

### Post-Migration Verification
```bash
# Run full test suite
npm test

# Verify no test data pollution
node scripts/audit-test-data.js

# Should show: "Total test records found: 0"
```

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Tests break during migration | Medium | High | Migrate one at a time, test thoroughly |
| Cleanup fails, data accumulates | Low | Medium | Run audit script after each migration |
| Performance degradation | Low | Low | TestContext cleanup is per-test but efficient |
| Confusion between approaches | Medium | Low | Clear documentation, examples in README |

## Related Documentation

- `CLEANUP_APPROACH_COMPARISON.md` - Detailed comparison of approaches
- `TEST_CLEANUP_STANDARDS.md` - Standards and decision matrix
- `tests/README.md` - Test suite documentation
- `tests/test-context.js` - TestContext implementation
- `tests/test-utils.js` - Array tracking utilities
- `scripts/audit-test-data.js` - Verification tool

## Questions for Review

1. ✅ Is `race-management.test.js` acceptable to keep as-is?
2. 🤔 Should `performance-benchmarks.test.js` use TestContext or Array Tracking?
3. 🤔 Should we enforce one approach across all tests, or allow both?
4. 🤔 Should we add a lint rule to detect missing cleanup?

---

**Ready to Begin:** Start with `game-flow.test.js` migration to TestContext (Phase 1, Test #2)
