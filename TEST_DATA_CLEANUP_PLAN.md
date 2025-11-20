# Test Data Cleanup Plan

## Executive Summary

This document outlines the comprehensive plan to eliminate test data pollution in the database by implementing explicit resource tracking in all tests.

**Problem**: Test data accumulating in database due to pattern-matching cleanup approach.

**Solution**: New `TestContext` class that tracks exactly what each test creates and cleans it up explicitly.

## Current State Analysis

### Existing Cleanup Approach (Being Deprecated)

The current approach uses pattern matching with SQL `LIKE` queries:

```javascript
// OLD APPROACH - Being deprecated
await cleanupTestGames('test-%');  // Deletes games matching pattern
await cleanupTestSessions('Test Team%');  // Deletes sessions matching pattern
```

**Problems with pattern matching:**
1. ❌ Can miss records if naming doesn't match pattern
2. ❌ Can accidentally match production data
3. ❌ Incomplete - doesn't cover all tables
4. ❌ Requires manual pattern maintenance
5. ❌ Cleanup can fail but tests still pass

### Database Tables Requiring Cleanup

**Currently handled by cleanup scripts:**
- ✅ `games` - via `cleanupTestGame(gameId)`
- ✅ `anonymous_sessions` - via `cleanupTestSessions(pattern)`  
- ✅ `salary_cap_teams` - via `cleanupTestGame(gameId)`
- ✅ `draft_teams` - via `cleanupTestGame(gameId)` (deprecated table)
- ✅ `player_rankings` - via `cleanupTestGame(gameId)` (deprecated table)
- ✅ `race_results` - via `cleanupTestGame(gameId)`

**Missing from cleanup (identified in audit):**
- ❌ `athletes` - Test athletes not cleaned up
- ❌ `races` - Test races not cleaned up
- ❌ `athlete_races` - Test associations not cleaned up
- ❌ `athlete_progression` - Test progression data not cleaned up
- ❌ `athlete_race_results` - Test race results not cleaned up

## New Approach: TestContext Class

### Design Philosophy

**Explicit over Implicit**: Tests explicitly track what they create rather than relying on naming conventions.

**Fail-Safe Cleanup**: Cleanup runs in `finally` blocks or `afterEach` hooks, ensuring it happens even if tests fail.

**Complete Coverage**: All database tables are supported.

### How It Works

```javascript
import { TestContext } from './test-context.js';

describe('My Test Suite', () => {
  let testCtx;
  
  beforeEach(() => {
    testCtx = new TestContext('my-test');
  });
  
  afterEach(async () => {
    await testCtx.cleanup();  // ALWAYS runs, even on test failure
  });
  
  it('should do something', async () => {
    // Create resources - they are tracked automatically
    const gameId = await testCtx.createGame({ players: [] });
    const athleteId = await testCtx.createAthlete({ name: 'Test Runner' });
    const raceId = await testCtx.createRace({ name: 'Test Marathon' });
    
    // All resources will be cleaned up automatically
  });
});
```

### Supported Resources

The `TestContext` class tracks and cleans up:

1. **games** - `createGame(gameData)`
2. **anonymous_sessions** - `createSession(type, name, gameId)`
3. **athletes** - `createAthlete(athleteData)`
4. **races** - `createRace(raceData)`
5. **athlete_races** - `createAthleteRace(athleteId, raceId, bibNumber)`
6. **salary_cap_teams** - `createSalaryCapTeam(...)`
7. **draft_teams** - (deprecated but supported)
8. **player_rankings** - (deprecated but supported)
9. **race_results** - `createRaceResult(gameId, athleteId, time)`
10. **athlete_progression** - (tracked, cleanup supported)
11. **athlete_race_results** - (tracked, cleanup supported)

### Manual Tracking

For resources created through APIs rather than directly:

```javascript
// Create resource via API
const response = await fetch('/api/session/create', {
  method: 'POST',
  body: JSON.stringify({ ... })
});

// Manually track it for cleanup
const sessionId = response.data.id;
testCtx.trackResource('sessions', sessionId);
```

## Migration Plan

### Phase 1: Initial Setup ✅ COMPLETE

- [x] Create `TestContext` class in `tests/test-context.js`
- [x] Create example test: `tests/game-flow-with-context.test.js`
- [x] Document new approach in this plan
- [x] Deprecate pattern-matching functions in `test-utils.js`

### Phase 2: Test Migration (Next)

Update all test files to use `TestContext`:

**Priority 1 - Core Tests:**
- [ ] `tests/game-flow.test.js`
- [ ] `tests/salary-cap-draft.test.js`
- [ ] `tests/api-endpoints.test.js`

**Priority 2 - Feature Tests:**
- [ ] `tests/race-management.test.js`
- [ ] `tests/database.test.js`

**Priority 3 - Other Tests:**
- [ ] `tests/frontend-integration.test.js`
- [ ] `tests/nextjs-routing.test.js`
- [ ] `tests/performance-benchmarks.test.js`
- [ ] `tests/legacy-regression.test.js`

### Phase 3: Cleanup Existing Test Data

After all tests are migrated:

1. Run audit script to identify existing test data:
   ```bash
   node scripts/audit-test-data.js
   ```

2. Review audit report: `TEST_DATA_AUDIT_REPORT.json`

3. **MANUALLY** delete identified test data:
   - Review each record to confirm it's truly test data
   - Delete using specific IDs, NOT patterns
   - Document what was deleted

4. Verify database is clean

### Phase 4: Final Cleanup

- [ ] Remove deprecated functions from `test-utils.js`
- [ ] Mark `scripts/cleanup-test-data.js` as deprecated
- [ ] Update test documentation
- [ ] Add pre-commit hooks to enforce TestContext usage

## Example Migration

### Before (Pattern Matching):

```javascript
import { generateTestId, cleanupTestGame } from './test-utils.js';

const GAME_ID = generateTestId('test-game');

after(async () => {
  await cleanupTestGame(GAME_ID);  // Only cleans up known resources
});

it('should create a team', async () => {
  // Create game somehow...
  // Create athlete somehow...
  // No tracking of athlete - won't be cleaned up!
});
```

### After (Explicit Tracking):

```javascript
import { TestContext } from './test-context.js';

let testCtx;

beforeEach(() => {
  testCtx = new TestContext('my-test');
});

afterEach(async () => {
  await testCtx.cleanup();  // Cleans up EVERYTHING
});

it('should create a team', async () => {
  const gameId = await testCtx.createGame({ players: [] });
  const athleteId = await testCtx.createAthlete({ name: 'Test' });
  // Both tracked and will be cleaned up
});
```

## Benefits of New Approach

### Safety
- ✅ No risk of matching production data
- ✅ Cleanup guaranteed even on test failure
- ✅ All tables properly cleaned up
- ✅ Foreign key dependencies handled correctly

### Visibility
- ✅ `getSummary()` shows exactly what will be cleaned up
- ✅ Clear logs during cleanup
- ✅ Easy to debug cleanup issues

### Maintenance
- ✅ No pattern maintenance needed
- ✅ Tests are self-documenting
- ✅ New tables automatically supported
- ✅ Easier to onboard new developers

## Running the Example

To see the new approach in action:

```bash
# Install dependencies
npm install

# Set up database connection
vercel env pull  # Or create .env with DATABASE_URL

# Run example test
node tests/game-flow-with-context.test.js
```

Expected output:
```
🧪 Testing complete game flow with TestContext at: http://localhost:3000

🧹 Cleaning up resources for test: game-flow-test
   Deleting 1 race results...
   Deleting 1 salary cap teams...
   Deleting 1 anonymous sessions...
   Deleting 1 games...
   Deleting 1 athlete-race associations...
   Deleting 1 races...
   Deleting 1 athletes...
✅ Successfully cleaned up all resources for game-flow-test
```

## Emergency Cleanup Procedure

If test data accumulates despite proper cleanup:

1. **Run audit** to identify affected records:
   ```bash
   node scripts/audit-test-data.js
   ```

2. **Review report** in `TEST_DATA_AUDIT_REPORT.json`

3. **Manually delete** specific records by ID (NOT by pattern)

4. **Investigate** why cleanup failed for those tests

5. **Fix the tests** to use TestContext properly

## Deprecation Timeline

### Immediate (Current)
- ⚠️ Mark pattern-matching functions as deprecated
- ⚠️ Add warnings to `cleanup-test-data.js`
- ✅ New tests MUST use TestContext

### 2 Weeks
- 🔄 All existing tests migrated to TestContext
- 📝 Documentation updated

### 1 Month
- 🗑️ Remove deprecated functions
- 🗑️ Archive `cleanup-test-data.js` for emergency use only
- ✅ All tests using TestContext

## Success Criteria

- ✅ Zero test data in production database
- ✅ All tests use TestContext
- ✅ No pattern-matching cleanup
- ✅ Tests clean up even on failure
- ✅ All database tables covered
- ✅ Clear audit trail of what's cleaned up

## Questions & Answers

**Q: What if I'm testing the API endpoints themselves?**
A: Use `createGame()` etc. to set up test data, then test the API against that data. Use `trackResource()` to track anything the API creates.

**Q: What about performance tests that need lots of data?**
A: Create resources in `beforeEach`, track them in TestContext, clean up in `afterEach`. TestContext handles any number of resources.

**Q: Can I still use `generateTestId()`?**
A: Yes! TestContext uses it internally. You can also use it for generating unique values in your tests.

**Q: What if cleanup fails?**
A: TestContext logs specific errors and continues with other resources. Review the logs to identify the issue. The test should still fail if cleanup fails.

**Q: How do I clean up existing test data before migration?**
A: Run the audit script, review what's found, and manually delete by specific IDs after confirming they're test data.

## Related Files

- `tests/test-context.js` - New TestContext class
- `tests/test-utils.js` - Deprecated utilities (being phased out)
- `tests/game-flow-with-context.test.js` - Example migrated test
- `scripts/audit-test-data.js` - Audit existing test data
- `scripts/cleanup-test-data.js` - Deprecated (emergency use only)

## Conclusion

The new TestContext approach provides explicit, safe, and comprehensive cleanup of all test data. By tracking exactly what each test creates, we eliminate the risk of database pollution while ensuring tests clean up properly even when they fail.

**Migration is straightforward**: Replace pattern-matching cleanup with TestContext tracking, and enjoy the benefits of explicit resource management.
