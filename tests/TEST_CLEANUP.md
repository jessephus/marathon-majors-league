# Test Utilities and Data Cleanup

This document explains the test cleanup system implemented to prevent test data pollution in the database.

## Problem

Previously, tests created data in the database (games, sessions, rankings, results) but never cleaned up after themselves. This led to:
- 184+ test game entries accumulating in the `games` table
- 3,562 test entries in `player_rankings`
- 308 duplicate test sessions
- Database bloat making it hard to distinguish real data from test data

## Solution

We implemented a comprehensive cleanup system with:

1. **Test Utilities Module** (`test-utils.js`) - Reusable cleanup functions
2. **Automatic Cleanup** - Each test suite cleans up after itself
3. **Global Cleanup** - Test runner performs final cleanup after all tests complete
4. **Unique Test IDs** - Predictable naming patterns for easy identification and cleanup

## Usage

### Basic Test Setup with Cleanup

```javascript
import { describe, it } from 'node:test';
import { generateTestId, cleanupTestGame } from './test-utils.js';

const GAME_ID = generateTestId('my-test'); // Creates unique ID like 'my-test-1234567890-abc123'

describe('My Test Suite', () => {
  // Your tests here
  it('should do something', async () => {
    // Test code that creates data with GAME_ID
  });
});

// Cleanup after all tests
await cleanupTestGame(GAME_ID);
```

### Using withCleanup Wrapper

For automatic cleanup even if test fails:

```javascript
import { withCleanup, generateTestId } from './test-utils.js';

await withCleanup(generateTestId('my-test'), async (gameId) => {
  // Your test code here
  // Creates data with gameId
  
  // Cleanup happens automatically, even if test throws an error
});
```

### Cleaning Up Sessions

If your test creates anonymous sessions:

```javascript
import { cleanupTestSessions } from './test-utils.js';

// After tests that create sessions with display_name like "Test Team ..."
await cleanupTestSessions('Test Team%');
```

## Test Utilities API

### generateTestId(prefix = 'test')
Generates a unique test ID with timestamp and random string.

**Example:**
```javascript
const gameId = generateTestId('e2e-test');
// Returns: 'e2e-test-1699564321123-x7k9mp2'
```

### cleanupTestGame(gameId)
Deletes all data associated with a specific game ID.

**Cleans up:**
- race_results
- salary_cap_teams
- draft_teams
- player_rankings
- anonymous_sessions
- games

**Returns:** Object with counts of deleted records

**Example:**
```javascript
const results = await cleanupTestGame('test-game-123');
// { race_results: 5, salary_cap_teams: 24, draft_teams: 0, ... }
```

### cleanupTestGames(pattern = 'test-%')
Cleans up all games matching a SQL LIKE pattern.

**Example:**
```javascript
await cleanupTestGames('e2e-%');  // Cleans all e2e test games
await cleanupTestGames('integration-%');  // Cleans all integration test games
```

### cleanupTestSessions(namePattern = 'Test Team%')
Deletes anonymous sessions where display_name matches pattern.

**Example:**
```javascript
await cleanupTestSessions('Test Team%');  // Cleans "Test Team 1", "Test Team A", etc.
```

### withCleanup(gameId, testFn)
Wrapper that automatically cleans up after test function completes.

**Example:**
```javascript
await withCleanup('test-123', async (gameId) => {
  // Test code that might throw errors
  await createGame(gameId);
  await submitRankings(gameId);
  // Cleanup happens even if this throws an error
});
```

### globalTestCleanup()
Runs comprehensive cleanup of common test patterns. Called automatically by test runner.

**Cleans up:**
- All games matching `test-%`
- All games matching `e2e-%`
- All games matching `integration-%`
- All sessions with display_name like `Test Team%`
- All sessions with display_name like `Test%`

### getTestDataCounts(gameId)
Returns counts of all data associated with a game.

**Example:**
```javascript
const counts = await getTestDataCounts('test-game-123');
console.log(counts);
// {
//   games: 1,
//   sessions: 4,
//   rankings: 30,
//   draftTeams: 24,
//   salaryCapTeams: 0,
//   results: 12
// }
```

## Test Naming Conventions

Use these prefixes for test game IDs to enable automatic cleanup:

- `test-*` - Generic test data
- `e2e-*` - End-to-end tests
- `integration-*` - Integration tests
- `salarycap-*` - Salary cap draft tests
- `commissioner-*` - Commissioner functionality tests

**Example:**
```javascript
const GAME_ID = generateTestId('e2e-test');
// Creates: 'e2e-test-1699564321123-x7k9mp2'
```

## Updated Test Files

The following test files have been updated to use the cleanup system:

✅ **tests/game-flow.test.js**
- Uses `generateTestId('e2e-test')`
- Cleans up via `cleanupTestGame(GAME_ID)` at end

✅ **tests/api-endpoints.test.js**
- Uses `generateTestId('test-game')`
- Cleans up via `cleanupTestGame(GAME_ID)` at end

✅ **tests/salary-cap-draft.test.js**
- Uses `generateTestId('salarycap-test')`
- Cleans up both game and sessions at end
- All `gameId: 'test-game'` replaced with `gameId: TEST_GAME_ID`

✅ **tests/run-tests.js**
- Imports and runs `globalTestCleanup()` after all tests complete

## Running Tests

### Run All Tests with Cleanup
```bash
npm test
```

This will:
1. Run all test suites sequentially
2. Each suite cleans up after itself
3. Global cleanup runs at the end
4. No test data remains in database

### Run Individual Test Suite
```bash
npm run test:flow      # Game flow tests
npm run test:api       # API endpoint tests
npm run test:salarycap # Salary cap draft tests
```

Individual test runs will clean up their own data.

### Check Database for Test Data

Before cleanup system:
```sql
SELECT game_id FROM games WHERE game_id LIKE 'test-%' OR game_id LIKE 'e2e-%';
-- Would return 184+ rows
```

After cleanup system:
```sql
SELECT game_id FROM games WHERE game_id LIKE 'test-%' OR game_id LIKE 'e2e-%';
-- Should return 0 rows after tests complete
```

## Troubleshooting

### Cleanup Failed

If cleanup fails during test execution, run manual cleanup:

```javascript
import { globalTestCleanup } from './tests/test-utils.js';
await globalTestCleanup();
```

Or via database directly:
```sql
-- Be careful with these - they delete data permanently!
DELETE FROM race_results WHERE game_id LIKE 'test-%';
DELETE FROM salary_cap_teams WHERE game_id LIKE 'test-%';
DELETE FROM draft_teams WHERE game_id LIKE 'test-%';
DELETE FROM player_rankings WHERE game_id LIKE 'test-%';
DELETE FROM anonymous_sessions WHERE game_id LIKE 'test-%';
DELETE FROM games WHERE game_id LIKE 'test-%';
```

### Test Data Still Accumulating

Check that:
1. Test is using `generateTestId()` with proper prefix
2. Test has cleanup code at the end
3. `gameId` variable is consistently named throughout test
4. Test completes successfully (cleanup runs after tests)

### Cleanup Too Slow

If cleanup is taking too long:
- Reduce number of test records created
- Use more specific cleanup patterns
- Clean up incrementally during test instead of only at end

## Best Practices

1. **Always use generateTestId()** - Ensures unique, trackable test data
2. **Consistent prefixes** - Use standard prefixes (test-, e2e-, etc.)
3. **Cleanup at test end** - Add cleanup code after test suites complete
4. **Use withCleanup() wrapper** - For automatic cleanup even on test failure
5. **Test locally first** - Verify cleanup works before committing
6. **Check counts** - Use `getTestDataCounts()` to verify cleanup worked

## Benefits

✅ **Clean database** - No test data pollution  
✅ **Reliable tests** - Tests don't interfere with each other  
✅ **Clear separation** - Easy to distinguish test vs real data  
✅ **Automatic cleanup** - No manual database cleanup needed  
✅ **Failure resilient** - Cleanup runs even if tests fail

## Future Improvements

Potential enhancements:
- [ ] Database transactions for isolated test execution
- [ ] Parallel test execution with isolated data
- [ ] Cleanup monitoring and alerts
- [ ] Automatic cleanup on CI/CD pipeline failure
- [ ] Test data snapshots for debugging
