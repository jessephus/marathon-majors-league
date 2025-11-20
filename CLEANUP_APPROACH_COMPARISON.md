# Test Cleanup Approach Comparison

## Overview

This document compares two approaches for cleaning up test data:
1. **Array Tracking** (used in `race-management.test.js`)
2. **TestContext Class** (new implementation in this PR)

## Approach 1: Array Tracking (race-management.test.js)

### Implementation
```javascript
// Store created test data for cleanup
const testData = {
  races: [],
  athleteRaces: [],
  raceNews: []
};

// In tests, manually track IDs
testData.races.push(data.id);

// Module-level cleanup
after(async () => {
  console.log('\n🧹 Cleaning up race test data...');
  
  // Clean up race news first
  for (const newsId of testData.raceNews) {
    try {
      await apiRequest(`/api/race-news?id=${newsId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(`⚠️ Could not delete race news ${newsId}: ${e.message}`);
    }
  }
  
  // Clean up races (CASCADE deletes athlete_races and remaining race_news)
  for (const raceId of testData.races) {
    try {
      await apiRequest(`/api/races?id=${raceId}`, { method: 'DELETE' });
    } catch (e) {
      console.warn(`⚠️ Could not delete race ${raceId}: ${e.message}`);
    }
  }
});
```

### Strengths
✅ **Simple and straightforward** - Easy to understand
✅ **Explicit tracking** - Developer manually adds IDs to arrays
✅ **Flexible** - Can track any type of resource
✅ **Uses API endpoints** - Cleans up through HTTP DELETE calls
✅ **Respects CASCADE deletes** - Relies on database foreign key constraints
✅ **Module-scoped** - Cleanup happens once after ALL tests in file

### Weaknesses
❌ **Manual tracking required** - Developer must remember to add `.push(id)`
❌ **Error-prone** - Easy to forget to track resources
❌ **Module-level only** - Cleanup runs once at end, not per-test
❌ **No isolation** - All tests in file share same arrays
❌ **Limited to specific resource types** - Only tracks what you define
❌ **API-dependent** - Requires working DELETE endpoints
❌ **Continues on error** - May leave orphaned data if deletion fails
❌ **No guaranteed cleanup on test failure** - If test throws before `.push()`, resource not tracked

## Approach 2: TestContext Class (New Implementation)

### Implementation
```javascript
import { TestContext } from './test-context.js';

describe('My Test Suite', () => {
  let testCtx;
  
  beforeEach(() => {
    testCtx = new TestContext('my-test');
  });
  
  afterEach(async () => {
    await testCtx.cleanup();  // Always runs, even on failure
  });
  
  it('should do something', async () => {
    // Create and automatically track resources
    const gameId = await testCtx.createGame({ players: [] });
    const raceId = await testCtx.createRace({ name: 'Test Race' });
    
    // All tracked automatically, cleaned up in afterEach
  });
});
```

### Strengths
✅ **Automatic tracking** - Resources tracked as they're created
✅ **Test isolation** - Each test gets fresh context in `beforeEach`
✅ **Guaranteed cleanup** - Runs in `afterEach` even if test fails
✅ **Comprehensive** - Supports all 11 database tables
✅ **Direct SQL cleanup** - Uses database connection, not API
✅ **Proper dependency order** - Handles foreign key constraints correctly
✅ **Visibility** - `getSummary()` shows what will be cleaned
✅ **Reusable** - Same pattern for all tests
✅ **Type-safe** - Methods for each resource type

### Weaknesses
❌ **More complex** - Requires understanding class-based approach
❌ **Less flexible** - Must use predefined `create*()` methods
❌ **Heavier weight** - More code than simple arrays
❌ **Database-dependent** - Requires direct database access
❌ **Per-test cleanup** - Runs after EACH test (could be slower)
❌ **Manual tracking needed for API-created resources** - Requires `trackResource()` call

## Detailed Comparison

| Aspect | Array Tracking | TestContext Class |
|--------|----------------|-------------------|
| **Simplicity** | ⭐⭐⭐⭐⭐ Very simple | ⭐⭐⭐ More complex |
| **Safety** | ⭐⭐⭐ Manual tracking | ⭐⭐⭐⭐⭐ Automatic tracking |
| **Test Isolation** | ⭐⭐ Module-level | ⭐⭐⭐⭐⭐ Per-test isolation |
| **Failure Handling** | ⭐⭐⭐ May miss resources | ⭐⭐⭐⭐⭐ Always cleans up |
| **Coverage** | ⭐⭐⭐ Only defined types | ⭐⭐⭐⭐⭐ All 11 tables |
| **Maintainability** | ⭐⭐⭐ Easy to understand | ⭐⭐⭐⭐ Consistent pattern |
| **Error Recovery** | ⭐⭐⭐ Continues on error | ⭐⭐⭐⭐ Handles dependencies |
| **Performance** | ⭐⭐⭐⭐ Once per file | ⭐⭐⭐ Once per test |
| **Learning Curve** | ⭐⭐⭐⭐⭐ Immediate | ⭐⭐⭐ Requires docs |

## When to Use Each Approach

### Use Array Tracking When:
- ✅ Writing simple, single-file test suites
- ✅ Only testing API endpoints (not direct DB)
- ✅ Resources naturally clean up via CASCADE
- ✅ Test file is small and easy to review
- ✅ Team prefers simplicity over safety

### Use TestContext Class When:
- ✅ Testing creates many types of resources
- ✅ Need guaranteed cleanup on test failure
- ✅ Want test isolation (each test independent)
- ✅ Working with complex foreign key relationships
- ✅ Need to track resources across all 11 tables
- ✅ Team values safety and consistency

## Hybrid Approach (Recommended)

The best solution combines both approaches:

### For Simple Test Files (like race-management.test.js)
Keep array tracking when:
- File only tests 1-2 resource types
- Uses API endpoints for CRUD operations
- Database CASCADE handles dependencies
- File is easy to read and maintain

### For Complex Test Files
Use TestContext when:
- File creates many different resource types
- Needs direct database access
- Requires guaranteed cleanup on failure
- Tests need complete isolation

## Example: Migrating race-management.test.js

### Option 1: Keep Array Tracking (Minimal Change)
Just improve the existing approach:

```javascript
const testData = {
  races: [],
  athleteRaces: [],
  raceNews: []
};

// Add safety wrapper
function trackResource(type, id) {
  if (!testData[type]) {
    throw new Error(`Unknown resource type: ${type}`);
  }
  testData[type].push(id);
  return id;
}

// Use in tests
const raceId = trackResource('races', data.id);
```

### Option 2: Adopt TestContext (Full Migration)
```javascript
import { TestContext } from './test-context.js';

describe('Race Management', () => {
  let testCtx;
  
  beforeEach(() => {
    testCtx = new TestContext('race-test');
  });
  
  afterEach(async () => {
    await testCtx.cleanup();
  });
  
  it('should create race', async () => {
    const raceId = await testCtx.createRace({
      name: 'Test Marathon 2025',
      date: '2025-12-01',
      location: 'Test City'
    });
    
    // Race automatically tracked and cleaned up
  });
});
```

## Recommendation

### Short Term: Standardize on Array Tracking for Simple Tests
For test files like `race-management.test.js` that:
- Only test a few resource types
- Use API endpoints extensively
- Have simple cleanup requirements
- Are already working well

**Keep the array tracking approach** with minor improvements:
1. Add a `trackResource()` helper function
2. Ensure all created resources are tracked
3. Handle errors gracefully

### Long Term: Migrate Complex Tests to TestContext
For test files that:
- Create many different resource types
- Need direct database access
- Require guaranteed cleanup on failure
- Want test isolation

**Use TestContext class** for better safety and consistency.

### Implementation Strategy
1. **Document both approaches** as valid patterns
2. **Choose based on test complexity**:
   - Simple tests → Array tracking
   - Complex tests → TestContext
3. **Gradually migrate** complex tests to TestContext
4. **Keep simple tests** with array tracking

## Conclusion

**Both approaches are valid** for different use cases:

- **Array Tracking**: Simpler, good for straightforward test files
- **TestContext**: Safer, better for complex scenarios

The choice depends on:
1. Test file complexity
2. Team preferences
3. Cleanup requirements
4. Maintenance concerns

**Recommended Standard**: 
- Document both as acceptable patterns
- Let test complexity guide the choice
- Prioritize consistency within each test file
- Focus on ensuring ALL resources are cleaned up, regardless of approach
