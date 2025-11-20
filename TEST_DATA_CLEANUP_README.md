# Test Data Cleanup - Implementation Complete

## Quick Start

### For Developers Writing New Tests

Use the new `TestContext` class:

```javascript
import { TestContext } from './tests/test-context.js';

describe('My Test Suite', () => {
  let testCtx;
  
  beforeEach(() => {
    testCtx = new TestContext('my-test-name');
  });
  
  afterEach(async () => {
    await testCtx.cleanup();  // Runs even if test fails
  });
  
  it('should do something', async () => {
    // Create and track resources
    const gameId = await testCtx.createGame({ players: [] });
    const athleteId = await testCtx.createAthlete({ name: 'Test Runner' });
    
    // Run your test...
    
    // Cleanup happens automatically in afterEach
  });
});
```

**See**: `tests/game-flow-with-context.test.js` for complete example

### For Repository Maintainers

1. **Audit existing test data**:
   ```bash
   node scripts/audit-test-data.js
   ```

2. **Review audit report**: `TEST_DATA_AUDIT_REPORT.json`

3. **Follow cleanup plan**: See `INITIAL_CLEANUP_PLAN.md`

4. **Migrate existing tests**: See `TEST_DATA_CLEANUP_PLAN.md`

## What Was Delivered

### ✅ Phase 1: Initial Audit & Planning (COMPLETE)

**Objective**: Identify existing test data and create cleanup strategy WITHOUT deleting anything yet.

**Deliverables**:

1. **Database Audit Script** (`scripts/audit-test-data.js`)
   - Scans all 11 database tables for test data
   - Generates JSON report with findings
   - Provides cleanup recommendations
   - **READ ONLY** - does not delete anything

2. **New TestContext System** (`tests/test-context.js`)
   - Explicit resource tracking by ID
   - Supports all database tables
   - Cleanup runs even on test failure
   - No pattern matching - 100% explicit

3. **Example Migrated Test** (`tests/game-flow-with-context.test.js`)
   - Shows how to use TestContext
   - Demonstrates automatic cleanup
   - Shows manual resource tracking
   - Fully documented with comments

4. **Comprehensive Documentation**:
   - `TEST_DATA_CLEANUP_PLAN.md` - Complete migration plan
   - `INITIAL_CLEANUP_PLAN.md` - Step-by-step cleanup guide
   - `TEST_DATA_CLEANUP_README.md` - This quick start guide

5. **Deprecated Old Approach** (`tests/test-utils.js`)
   - Marked pattern-matching functions as deprecated
   - Added warnings about new approach
   - Preserved for backward compatibility during migration

### 🔜 Phase 2: Test Migration (NEXT)

**Objective**: Update all existing tests to use TestContext.

**Tasks**:
- [ ] Migrate `game-flow.test.js`
- [ ] Migrate `salary-cap-draft.test.js`
- [ ] Migrate `api-endpoints.test.js`
- [ ] Migrate `race-management.test.js`
- [ ] Migrate remaining test files

### 🔜 Phase 3: Initial Cleanup (AFTER PHASE 2)

**Objective**: Clean up existing historical test data (one-time operation).

**Tasks**:
- [ ] Run audit script
- [ ] Review audit report
- [ ] Create cleanup script with specific IDs
- [ ] Test cleanup on staging
- [ ] Execute cleanup on production
- [ ] Verify results

### 🔜 Phase 4: Finalization (FINAL)

**Objective**: Remove deprecated code and finalize documentation.

**Tasks**:
- [ ] Remove deprecated functions from `test-utils.js`
- [ ] Archive `cleanup-test-data.js` (emergency use only)
- [ ] Add pre-commit hooks for TestContext enforcement
- [ ] Final audit to verify zero test data
- [ ] Update all documentation

## Key Files

### New Files (Created)
- `tests/test-context.js` - **Core TestContext class**
- `tests/game-flow-with-context.test.js` - **Example test**
- `scripts/audit-test-data.js` - **Database audit tool**
- `TEST_DATA_CLEANUP_PLAN.md` - **Complete migration guide**
- `INITIAL_CLEANUP_PLAN.md` - **Step-by-step cleanup**
- `TEST_DATA_CLEANUP_README.md` - **This file**

### Modified Files
- `tests/test-utils.js` - Added deprecation warnings

### Unchanged (Still Working)
- All existing test files - Still using old approach
- `scripts/cleanup-test-data.js` - Deprecated but functional
- All API endpoints - No changes needed

## How TestContext Solves the Problem

### Old Approach (Pattern Matching - Being Deprecated)
```javascript
// ❌ Risky: Uses LIKE patterns
await cleanupTestGames('test-%');  
await cleanupTestSessions('Test Team%');

// Problems:
// - Can miss data if naming doesn't match
// - Can accidentally match production data
// - Incomplete - missing tables
// - Cleanup can fail silently
```

### New Approach (Explicit Tracking - Current)
```javascript
// ✅ Safe: Tracks exact IDs
const ctx = new TestContext('my-test');

const gameId = await ctx.createGame({...});       // Tracked
const athleteId = await ctx.createAthlete({...});  // Tracked
const raceId = await ctx.createRace({...});        // Tracked

await ctx.cleanup();  // Deletes by ID, in correct order

// Benefits:
// - No risk of matching wrong data
// - All tables supported
// - Runs even if test fails
// - Clear audit trail
```

## Supported Resources

TestContext tracks and cleans up:

| Resource | Method | Cleaned Up |
|----------|--------|------------|
| Games | `createGame(data)` | ✅ |
| Sessions | `createSession(type, name, gameId)` | ✅ |
| Athletes | `createAthlete(data)` | ✅ |
| Races | `createRace(data)` | ✅ |
| Athlete-Race Links | `createAthleteRace(aId, rId)` | ✅ |
| Salary Cap Teams | `createSalaryCapTeam(...)` | ✅ |
| Draft Teams | (deprecated but supported) | ✅ |
| Player Rankings | (deprecated but supported) | ✅ |
| Race Results | `createRaceResult(...)` | ✅ |
| Athlete Progression | (tracked, cleanup supported) | ✅ |
| Athlete Race Results | (tracked, cleanup supported) | ✅ |

**All 11 database tables are covered.**

## Running the Audit

To see what test data currently exists:

```bash
# Ensure DATABASE_URL is set
vercel env pull  # OR create .env with DATABASE_URL

# Run audit (read-only)
node scripts/audit-test-data.js

# Review report
cat TEST_DATA_AUDIT_REPORT.json
```

The audit will show:
- How many test records exist
- Which tables are affected
- Sample records for review
- Cleanup recommendations

**Important**: The audit does NOT delete anything.

## Running the Example Test

To see TestContext in action:

```bash
# Ensure database connection is set up
vercel env pull

# Run example test
node tests/game-flow-with-context.test.js
```

Watch the cleanup logs - you'll see exactly what gets deleted.

## Benefits of New Approach

### Safety
- ✅ No pattern matching = no accidental deletions
- ✅ Cleanup guaranteed even if test fails
- ✅ Foreign key dependencies handled correctly
- ✅ Clear logs of what's being deleted

### Completeness
- ✅ All 11 database tables supported
- ✅ No tables missed (old approach missed 5 tables)
- ✅ Comprehensive resource tracking

### Maintainability
- ✅ Tests are self-documenting
- ✅ Easy to see what test creates
- ✅ No pattern maintenance needed
- ✅ New tables automatically supported

### Visibility
- ✅ `getSummary()` shows tracked resources
- ✅ Detailed cleanup logs
- ✅ Easy debugging

## Migration Guide

### Quick Migration Steps

1. Import TestContext instead of test-utils:
   ```javascript
   // OLD
   import { generateTestId, cleanupTestGame } from './test-utils.js';
   
   // NEW
   import { TestContext } from './test-context.js';
   ```

2. Create context in beforeEach:
   ```javascript
   // OLD
   const GAME_ID = generateTestId('test');
   
   // NEW
   let testCtx;
   beforeEach(() => {
     testCtx = new TestContext('my-test');
   });
   ```

3. Use context to create resources:
   ```javascript
   // OLD
   // Create game somehow, no tracking
   
   // NEW
   const gameId = await testCtx.createGame({ players: [] });
   // Automatically tracked
   ```

4. Replace after() cleanup with afterEach:
   ```javascript
   // OLD
   after(async () => {
     await cleanupTestGame(GAME_ID);
   });
   
   // NEW
   afterEach(async () => {
     await testCtx.cleanup();  // Cleans EVERYTHING
   });
   ```

**See `TEST_DATA_CLEANUP_PLAN.md` for complete examples.**

## Troubleshooting

### "DATABASE_URL not configured"
```bash
# Pull from Vercel
vercel env pull

# OR create .env file
echo "DATABASE_URL=postgresql://..." > .env
```

### "Table does not exist"
Run database migrations:
```bash
node scripts/init-db.js
```

### Test cleanup failing
Check the error message - might be foreign key constraint. TestContext handles dependencies, but verify the order is correct.

### Need to clean up existing test data NOW
See `INITIAL_CLEANUP_PLAN.md` for safe manual cleanup procedure. **Do NOT use pattern matching.**

## FAQ

**Q: Do I need to update all tests immediately?**
A: No, but new tests should use TestContext. Old tests will keep working but should be migrated gradually.

**Q: What about the old cleanup-test-data.js script?**
A: It's deprecated. After Phase 2 (test migration), it will be archived for emergency use only.

**Q: Can I still use generateTestId()?**
A: Yes! TestContext uses it internally. It's still useful for generating unique values.

**Q: What if I create a resource through the API?**
A: Use `testCtx.trackResource(type, id)` to manually track it for cleanup.

**Q: Does this work with the test runner?**
A: Yes! Works with node:test, jest, mocha, or any test framework that supports beforeEach/afterEach.

## Next Steps

### For Test Writers
1. Read `tests/game-flow-with-context.test.js` example
2. Use TestContext for all new tests
3. Gradually migrate old tests

### For Maintainers
1. Run audit: `node scripts/audit-test-data.js`
2. Review: `TEST_DATA_AUDIT_REPORT.json`
3. Follow: `INITIAL_CLEANUP_PLAN.md`
4. Migrate tests using: `TEST_DATA_CLEANUP_PLAN.md`

## Success Criteria

✅ **Phase 1 Complete**:
- [x] TestContext system created
- [x] Example test written
- [x] Audit script created
- [x] Documentation complete
- [x] Old functions deprecated

🔜 **Phase 2 Success**:
- [ ] All tests use TestContext
- [ ] No tests use pattern matching
- [ ] All tests clean up properly

🔜 **Phase 3 Success**:
- [ ] Existing test data identified
- [ ] Historical test data cleaned up
- [ ] Database contains only production data

🔜 **Final Success**:
- [ ] Zero test data in production database
- [ ] All tests self-cleaning
- [ ] Comprehensive coverage of all tables
- [ ] No risk of accidental deletions

## Support

For questions or issues:
1. Check documentation in this directory
2. Review example test: `tests/game-flow-with-context.test.js`
3. Read detailed guides:
   - `TEST_DATA_CLEANUP_PLAN.md` - Overall strategy
   - `INITIAL_CLEANUP_PLAN.md` - One-time cleanup
4. Open an issue on GitHub

---

**Remember**: The new TestContext approach is safer, more complete, and easier to maintain than pattern-matching cleanup. All new tests should use it.
