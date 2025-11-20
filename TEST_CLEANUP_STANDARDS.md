# Test Data Cleanup Standards

## Two Approved Approaches

This project supports **two different cleanup approaches** for test data. Choose based on your test's complexity:

### Approach 1: Array Tracking (Simple Tests)

**Use when:**
- Testing 1-3 resource types
- Using API endpoints for CRUD
- Database CASCADE handles dependencies
- Test file is small and focused

**Example:**
```javascript
const testData = {
  races: [],
  news: []
};

after(async () => {
  for (const newsId of testData.news) {
    await apiRequest(`/api/race-news?id=${newsId}`, { method: 'DELETE' });
  }
  for (const raceId of testData.races) {
    await apiRequest(`/api/races?id=${raceId}`, { method: 'DELETE' });
  }
});

it('should create race', async () => {
  const race = await createRace();
  testData.races.push(race.id);  // Track for cleanup
});
```

**Pros:**
- ✅ Simple and easy to understand
- ✅ Works with API endpoints
- ✅ Minimal overhead
- ✅ Good for focused test files

**Cons:**
- ⚠️ Must manually track resources
- ⚠️ Module-level cleanup (once per file)
- ⚠️ Can miss resources if tracking forgotten

**Best for:** `race-management.test.js`, `api-endpoints.test.js`

### Approach 2: TestContext Class (Complex Tests)

**Use when:**
- Creating many resource types
- Need guaranteed cleanup on test failure
- Want per-test isolation
- Testing complex scenarios

**Example:**
```javascript
import { TestContext } from './test-context.js';

describe('Complex Test', () => {
  let ctx;
  
  beforeEach(() => ctx = new TestContext('my-test'));
  afterEach(async () => await ctx.cleanup());
  
  it('should handle complex scenario', async () => {
    const gameId = await ctx.createGame({ players: [] });
    const athleteId = await ctx.createAthlete({ name: 'Test' });
    const raceId = await ctx.createRace({ name: 'Test Race' });
    // All automatically tracked and cleaned up
  });
});
```

**Pros:**
- ✅ Automatic resource tracking
- ✅ Per-test isolation
- ✅ Cleanup guaranteed even on failure
- ✅ Supports all 11 database tables
- ✅ Proper foreign key handling

**Cons:**
- ⚠️ More complex to understand
- ⚠️ Requires database connection
- ⚠️ Heavier per-test overhead

**Best for:** `game-flow.test.js`, `salary-cap-draft.test.js`, multi-resource tests

## Choosing the Right Approach

### Decision Matrix

| Test Characteristic | Array Tracking | TestContext |
|---------------------|----------------|-------------|
| Creates 1-3 resource types | ✅ Preferred | ⭕ Overkill |
| Creates 4+ resource types | ⭕ Manual work | ✅ Preferred |
| Uses API endpoints only | ✅ Preferred | ⭕ Unnecessary |
| Needs direct DB access | ⭕ Limited | ✅ Preferred |
| Simple test file | ✅ Preferred | ⭕ Too heavy |
| Complex scenarios | ⭕ Error-prone | ✅ Preferred |
| Per-test isolation needed | ⚠️ Not supported | ✅ Built-in |
| Team familiarity | ✅ Easy to learn | ⚠️ Requires docs |

### Quick Decision Guide

**Ask yourself:**
1. Does my test create resources of 4+ different types? → **TestContext**
2. Does my test need per-test isolation? → **TestContext**
3. Is my test file simple and focused? → **Array Tracking**
4. Do I only use API endpoints? → **Array Tracking**

## Standard Patterns

### Pattern 1: Array Tracking (Simple)

```javascript
import { describe, it, after } from 'node:test';

// Define what resources you'll create
const testData = {
  races: [],
  news: [],
  confirmations: []
};

// Module-level cleanup
after(async () => {
  console.log('🧹 Cleaning up test data...');
  
  // Clean in reverse dependency order
  for (const id of testData.news) {
    await deleteNews(id);
  }
  for (const id of testData.races) {
    await deleteRace(id);  // CASCADE handles confirmations
  }
  
  console.log('✅ Cleanup complete');
});

describe('My Test Suite', () => {
  it('should create race', async () => {
    const race = await createRace();
    testData.races.push(race.id);  // ← Must track manually
    
    const news = await createNews(race.id);
    testData.news.push(news.id);  // ← Must track manually
  });
});
```

**Checklist for Array Tracking:**
- [ ] Define `testData` object with arrays for each resource type
- [ ] Register `after()` hook at module level
- [ ] Delete resources in reverse dependency order
- [ ] Track EVERY created resource with `.push(id)`
- [ ] Handle errors gracefully (warn, don't fail)
- [ ] Test cleanup by running test suite

### Pattern 2: TestContext Class (Complex)

```javascript
import { describe, it, beforeEach, afterEach } from 'node:test';
import { TestContext } from './test-context.js';

describe('My Test Suite', () => {
  let ctx;
  
  // Fresh context for each test
  beforeEach(() => {
    ctx = new TestContext('my-test-name');
  });
  
  // Cleanup after each test (even on failure)
  afterEach(async () => {
    await ctx.cleanup();
  });
  
  it('should create complex scenario', async () => {
    // Resources automatically tracked
    const gameId = await ctx.createGame({ players: [] });
    const athleteId = await ctx.createAthlete({ name: 'Test' });
    const raceId = await ctx.createRace({ name: 'Test Race' });
    
    // For API-created resources, track manually
    const apiResult = await someApiCall();
    ctx.trackResource('races', apiResult.id);
    
    // All cleaned up automatically in afterEach
  });
});
```

**Checklist for TestContext:**
- [ ] Import `TestContext` from `test-context.js`
- [ ] Create context in `beforeEach()`
- [ ] Cleanup in `afterEach()`
- [ ] Use `ctx.create*()` methods for resources
- [ ] Use `ctx.trackResource()` for API-created resources
- [ ] Check `ctx.getSummary()` if debugging

## Migrating Existing Tests

### If Test Uses Pattern Matching (DEPRECATED)
```javascript
// ❌ OLD - Pattern matching (DEPRECATED)
await cleanupTestGames('test-%');
await cleanupTestSessions('Test Team%');
```

**Choose migration path:**

**Option A: Array Tracking** (if simple)
```javascript
// ✅ NEW - Array tracking
const testData = { games: [], sessions: [] };

after(async () => {
  for (const id of testData.sessions) {
    await sql`DELETE FROM anonymous_sessions WHERE id = ${id}`;
  }
  for (const gameId of testData.games) {
    await sql`DELETE FROM games WHERE game_id = ${gameId}`;
  }
});
```

**Option B: TestContext** (if complex)
```javascript
// ✅ NEW - TestContext
let ctx;
beforeEach(() => ctx = new TestContext('test'));
afterEach(async () => await ctx.cleanup());

it('test', async () => {
  const gameId = await ctx.createGame({ players: [] });
  const session = await ctx.createSession('player', 'Test');
});
```

### Migration Priority

**High Priority** (security risk):
- Tests using `cleanupTestGames(pattern)` - Pattern matching unsafe

**Medium Priority** (completeness):
- Tests only cleaning up some tables - Missing resources

**Low Priority** (already working):
- Tests using array tracking correctly - Already safe

## Testing Your Cleanup

### Verify Cleanup Works

```bash
# Run test suite
npm test

# Check for leftover test data
node scripts/audit-test-data.js

# Review audit report
cat TEST_DATA_AUDIT_REPORT.json
```

**Expected:** Zero or near-zero test records after running tests.

### Debug Cleanup Issues

**For Array Tracking:**
1. Add console.log after `.push()` calls
2. Verify all created resources are tracked
3. Check deletion happens in correct order
4. Look for try/catch swallowing errors

**For TestContext:**
1. Check `ctx.getSummary()` before cleanup
2. Review cleanup logs for errors
3. Verify foreign key dependencies
4. Ensure `afterEach` is registered

## Examples

### Example 1: Simple API Test (Array Tracking)
See: `tests/race-management.test.js`
- Tests race CRUD operations
- Uses API endpoints
- Tracks races and news
- Module-level cleanup

### Example 2: Complex Integration Test (TestContext)
See: `tests/game-flow-with-context.test.js`
- Creates games, athletes, races
- Direct database access
- Per-test isolation
- Comprehensive cleanup

## FAQ

**Q: Which approach should I use for my new test?**
A: If you're testing 1-3 resource types via APIs, use array tracking. If creating many resources or need guaranteed cleanup, use TestContext.

**Q: Can I mix both approaches in one file?**
A: Not recommended. Choose one approach per file for consistency.

**Q: What if my test needs both API and direct DB?**
A: Use TestContext - it supports both. You can use `ctx.trackResource()` for API-created resources.

**Q: The old tests use pattern matching. Should I change them?**
A: Yes, gradually migrate them. Pattern matching is unsafe and deprecated.

**Q: How do I clean up resources not in TestContext?**
A: Use `ctx.trackResource(type, id)` to manually track them.

**Q: Can I use array tracking with `beforeEach`/`afterEach`?**
A: Yes, but you'll need a new array per test. Consider TestContext instead.

## Summary

**Both approaches are valid:**
- **Array Tracking**: Simple, good for focused tests
- **TestContext**: Safe, good for complex tests

**Choose based on complexity, not preference.**

**Requirement:** All tests MUST clean up their data using one of these approaches. Pattern matching is deprecated and unsafe.

**Goal:** Zero test data in production database.
