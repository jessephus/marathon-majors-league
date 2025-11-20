# Test Suite Documentation

**Complete testing documentation for Fantasy NY Marathon** - Comprehensive test suite covering functionality verification, performance baselines, code coverage reporting, and test utilities for safe refactoring and continuous integration.

**Last Updated:** November 20, 2025  
**Issue References:** [#69](https://github.com/jessephus/marathon-majors-league/issues/69), [#82](https://github.com/jessephus/marathon-majors-league/issues/82)

## Test Files

### Core Functionality Tests

### 1. `api-endpoints.test.js`
Tests all API endpoints to ensure they're working after the migration.

**Coverage:**
- ✅ Database initialization (`/api/init-db`)
- ✅ Athletes endpoint (`/api/athletes`)
- ✅ Races endpoint (`/api/races`)
- ✅ Game state management (`/api/game-state`)
- ✅ Rankings storage (`/api/rankings`)
- ✅ Draft execution (`/api/draft`)
- ✅ Results management (`/api/results`)
- ✅ Error handling
- ✅ CORS headers

### 2. `database.test.js`
Verifies database connectivity and data integrity.

**Coverage:**
- ✅ Neon Postgres connection
- ✅ Schema initialization
- ✅ Data seeding (athletes)
- ✅ Athlete data structure
- ✅ Query performance
- ✅ Concurrent request handling
- ✅ Type safety (VARCHAR vs INTEGER bug)
- ✅ Connection pooling

### 3. `race-management.test.js` 🆕
Tests comprehensive race management features including CRUD operations, athlete confirmations, and news feed.

**Coverage:**
- ✅ Race creation with basic and visual fields
- ✅ Race listing (all, active, by ID)
- ✅ Race updates (basic fields, visual customization, status)
- ✅ Race deletion with cascade
- ✅ Athlete confirmation for races
- ✅ Athlete confirmation listing and removal
- ✅ Race news creation and management
- ✅ News visibility toggling

**Automatic Cleanup:**
This test suite includes automatic cleanup that runs **after each test execution** via a module-level `after()` hook. Test data is tracked in the `testData` object and deleted when tests complete. This prevents test race pollution in the database.

**Manual Cleanup:**
If test races accumulate (e.g., from test failures or interrupted runs), use the cleanup utility:

```bash
# Clean up all test races (pattern-match by name)
npm run cleanup:test-races

# Or run directly
node scripts/cleanup-test-races.js
```

The cleanup script identifies races with "Test" in the name and deletes them along with CASCADE-related data (athlete confirmations and news items).

**Test Race Patterns:**
- "Visual Test Marathon 2025" - Visual fields tests
- "Race News Test Race" - News management tests  
- "Athlete Confirmation Test Race" - Athlete confirmation tests
- "Updated Test Marathon 2025" - Update operation tests
- ✅ News display order control
- ✅ Visual customization fields (lock time, logo, background, theme colors)
- ✅ Required field validation
- ✅ Error handling for invalid data
- ✅ CASCADE delete behavior
- ✅ Test data cleanup

**Key Features Tested:**
- Race visual branding (logo URL, background image URL, theme colors)
- Roster lock time configuration
- Athlete-race confirmations with bib numbers
- Curated news feed with visibility control
- Display order management for news items
- Foreign key constraints and cascading deletes

### 4. `frontend-integration.test.js`
Tests frontend asset serving and HTML structure.

**Coverage:**
- ✅ Static asset serving (HTML, JS, CSS, JSON)
- ✅ HTML page structure
- ✅ Drag handle implementation
- ✅ Athlete management container fix
- ✅ JavaScript configuration
- ✅ Critical frontend functions
- ✅ Next.js verification

### 4. `game-flow.test.js`
End-to-end test of complete game workflow.

**Coverage:**
- ✅ Game setup with players
- ✅ Player rankings submission
- ✅ Snake draft execution
- ✅ Results entry and retrieval
- ✅ Game finalization
- ✅ Data persistence

### Testing Baseline (Issue #69)

### 5. `nextjs-routing.test.js` 🆕
Validates Next.js routing functionality, SSR capabilities, and page rendering.

**Coverage:**
- ✅ Next.js framework verification (x-powered-by header)
- ✅ Essential routes rendering (`/`, API routes)
- ✅ Server-side rendering (SSR) confirmation
- ✅ SEO and social meta tags
- ✅ Page navigation and client-side routing
- ✅ Fallback and error handling
- ✅ Static asset serving (CSS, JSON, images)
- ✅ Performance and caching headers
- ✅ Legacy route compatibility

### 6. `salary-cap-draft.test.js` 🆕
Tests the complete salary cap draft flow including team creation, athlete selection, and budget validation.

**Coverage:**
- ✅ Team creation flow via API
- ✅ Team name validation
- ✅ Session management (create, verify, extend)
- ✅ Session token validation
- ✅ Athlete selection with salary information
- ✅ Draft team submission
- ✅ Team composition validation (3 men + 3 women)
- ✅ Budget constraint validation ($30,000 cap)
- ✅ Draft persistence and retrieval
- ✅ Error handling and edge cases
- ✅ Concurrent submission handling
- ✅ Roster lock integration

### 7. `performance-benchmarks.test.js` 🆕
Establishes baseline performance metrics for regression detection.

**Coverage:**
- ✅ Bundle size analysis and tracking
- ✅ Page load performance measurement
- ✅ Time to First Byte (TTFB)
- ✅ Static asset load efficiency
- ✅ API endpoint response times
- ✅ Navigation performance
- ✅ Concurrent user simulation
- ✅ Database connection pooling performance
- ✅ Cache effectiveness measurement
- ✅ Comprehensive performance baseline report

**Performance Thresholds:**
- Page Load: < 5000ms
- API Response: < 2000ms
- Navigation: < 3000ms
- Concurrent Users: 10 simultaneous requests

### 8. `legacy-regression.test.js` 🆕
Ensures backward compatibility with legacy MVP features and API schemas.

**Coverage:**
- ✅ Legacy API schema compatibility (athletes, races, game-state, results, standings)
- ✅ Legacy MVP features preservation (snake draft, rankings, results entry)
- ✅ Backward compatible response formats
- ✅ Legacy data format support (gameId, player codes, gender fields)
- ✅ CORS configuration preservation
- ✅ Legacy database schema compatibility
- ✅ Graceful error handling
- ✅ Session token backward compatibility
- ✅ Legacy frontend integration
- ✅ Breaking change detection

### Enhanced Test Suites (Issue #82 - State Manager & Components)

### 9. `state-manager.test.js`
Comprehensive unit tests for the centralized state manager.

**Coverage:**
- ✅ State initialization and retrieval
- ✅ Cache TTL enforcement (30s results, 60s game state)
- ✅ Pub/sub event system
- ✅ Multiple subscribers handling
- ✅ Cache invalidation
- ✅ localStorage abstraction
- ✅ Error handling and edge cases

### 10. `state-manager-integration.test.js`
Integration tests for state manager with real scenarios.

**Coverage:**
- ✅ TTL expiry during concurrent requests
- ✅ Event ordering guarantees
- ✅ Memory cleanup after unsubscribe
- ✅ Multiple subscriber coordination

### 11. `dynamic-imports.test.js`
Tests for dynamic import utilities and code splitting.

**Coverage:**
- ✅ Dynamic import wrapper functionality
- ✅ Performance monitoring integration
- ✅ Feature flag controls
- ✅ Chunk loading verification
- ✅ Error boundaries

### 12. `dynamic-import-e2e.test.js`
End-to-end tests for lazy-loaded components.

**Coverage:**
- ✅ Commissioner panels lazy loading
- ✅ Athlete modal chunk loading
- ✅ Chunk size analysis
- ✅ Error handling for chunk failures

### 13. `leaderboard-components.test.js`
Tests for leaderboard React components.

**Coverage:**
- ✅ SSR rendering validation
- ✅ Auto-refresh functionality
- ✅ Visibility tracking
- ✅ State event integration

## Code Coverage Reporting

### Coverage Tool: c8

We use `c8` (v8 coverage) for JavaScript/TypeScript code coverage.

### Coverage Thresholds

New modules must meet these thresholds:

| Metric | Threshold | Scope |
|--------|-----------|-------|
| Lines | 90% | All new lib/ and components/ files |
| Functions | 90% | All new lib/ and components/ files |
| Branches | 85% | All new lib/ and components/ files |
| Statements | 90% | All new lib/ and components/ files |

### Running Coverage

```bash
# Full coverage report
npm run test:coverage

# Coverage for new modules only (90% threshold)
npm run test:coverage:new

# View HTML report
open coverage/index.html
```

### CI/CD Coverage Integration

Coverage is automatically checked on every pull request via GitHub Actions (`.github/workflows/coverage.yml`).

**What the CI does:**
1. Runs tests with coverage on all modules
2. Generates coverage report (HTML, JSON, LCOV)
3. Posts PR comment with coverage metrics
4. Uploads artifacts (HTML report viewable in Actions)
5. Fails if thresholds not met (90% lines/functions, 85% branches)

**Example PR Comment:**
```markdown
## 📊 Test Coverage Report

| Metric | Coverage | Status | Target |
|--------|----------|--------|--------|
| Lines | 92.5% | ✅ | 90% |
| Statements | 93.1% | ✅ | 90% |
| Functions | 91.2% | ✅ | 90% |
| Branches | 87.3% | ✅ | 85% |

🎉 All coverage targets met!
```

### Monitored Modules

Coverage is tracked for:
- `lib/state-manager.ts` - Centralized state management
- `lib/state-provider.tsx` - React Context provider
- `lib/dynamic-import.ts` - Dynamic import utilities
- `lib/performance-monitor.ts` - Performance tracking
- `lib/api-client.ts` - Centralized API client
- `components/` - All React components

## Test Utilities & Cleanup

### Test Utilities (`test-utils.js`)

Reusable utilities for test setup and cleanup:

```javascript
import { generateTestId, cleanupTestGame, withCleanup } from './test-utils.js';

// Generate unique test ID
const gameId = generateTestId('my-test'); // 'my-test-1699564321123-x7k9mp2'

// Cleanup after tests
await cleanupTestGame(gameId);

// Auto-cleanup wrapper
await withCleanup(generateTestId('test'), async (gameId) => {
  // Your test code here
  // Cleanup happens automatically, even on errors
});
```

### Available Cleanup Functions

- **`generateTestId(prefix)`** - Generate unique test ID with timestamp
- **`cleanupTestGame(gameId)`** - Delete all data for a specific game
- **`cleanupTestGames(pattern)`** - Cleanup games matching SQL LIKE pattern
- **`cleanupTestSessions(namePattern)`** - Delete test sessions by name pattern
- **`withCleanup(gameId, testFn)`** - Auto-cleanup wrapper
- **`globalTestCleanup()`** - Cleanup all common test patterns
- **`getTestDataCounts(gameId)`** - Get counts of test data

### Test Naming Conventions

Use these prefixes for automatic cleanup:
- `test-*` - Generic test data
- `e2e-*` - End-to-end tests
- `integration-*` - Integration tests
- `salarycap-*` - Salary cap draft tests
- `commissioner-*` - Commissioner functionality tests

### Global Cleanup

The test runner (`run-tests.js`) automatically runs `globalTestCleanup()` after all tests complete, removing:
- All games matching `test-%`, `e2e-%`, `integration-%`
- All sessions with display_name like `Test Team%` or `Test%`

## Running Tests

### Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```
   The server should be running at `http://localhost:3000`

2. **Or test against production:**
   ```bash
   TEST_URL=https://marathonmajorsfantasy.com npm test
   ```

### Run All Tests

```bash
npm test
```

This runs all test suites sequentially and provides a summary.

### Run Individual Test Suites

```bash
# Core functionality tests
npm run test:api
npm run test:db
npm run test:frontend
npm run test:flow

# Testing baseline (Issue #69)
npm run test:nextjs       # Next.js routing and SSR tests
npm run test:salarycap    # Salary cap draft tests
npm run test:performance  # Performance benchmarks
npm run test:legacy       # Legacy regression tests
```

### Run Specific Test File Directly

```bash
node tests/api-endpoints.test.js
node tests/database.test.js
node tests/frontend-integration.test.js
node tests/game-flow.test.js
```

## Environment Variables

- `TEST_URL` - The URL to test against (default: `http://localhost:3000`)

Examples:
```bash
# Test local development
npm test

# Test production
TEST_URL=https://marathonmajorsfantasy.com npm test

# Test preview deployment
TEST_URL=https://marathonmajorsfantasy.com npm test
```

## What Gets Tested

### Migration-Specific Checks

✅ **Next.js Migration Verification**
- Confirms app is running on Next.js
- Verifies pages structure
- Checks API routes are accessible

✅ **Bug Fixes Verification**
- Drag handle column in athlete table
- Duplicate ID fix (athlete-management-container)
- Type mismatch fix (VARCHAR vs INTEGER for year)

✅ **API Endpoint Migration**
- All endpoints respond with correct status codes
- CORS headers are present
- Request/response formats unchanged

✅ **Static Asset Serving**
- HTML, CSS, JavaScript files served correctly
- JSON data files accessible
- Proper content types

### Functionality Tests

✅ **Database Operations**
- Connection to Neon Postgres
- Schema exists and is correct
- Data seeding works
- Queries execute successfully

✅ **Game Workflow**
- Create game with players
- Save and retrieve rankings
- Execute draft
- Enter results
- Finalize game

✅ **Performance**
- Response times under 5 seconds
- Concurrent requests handled
- Connection pooling works

## Expected Output

### Successful Run
```
╔════════════════════════════════════════════════════════════╗
║      Fantasy Marathon - Post-Migration Test Suite         ║
╚════════════════════════════════════════════════════════════╝

🎯 Target: http://localhost:3000

🔍 Checking if server is reachable...
✅ Server is reachable

============================================================
📝 API Endpoints
   Tests all API endpoints for proper responses
============================================================
✅ Database initialized: Neon Postgres database is ready
✅ Athletes endpoint working
✅ Races endpoint working
...

📊 TEST SUMMARY
============================================================
✅ API Endpoints
✅ Database Connection
✅ Frontend Integration
✅ Complete Game Flow

Total: 4 test suites
Passed: 4 ✅
Failed: 0
Duration: 12.34s
============================================================

🎉 All tests passed! Your Next.js migration is working correctly! ✨
```

## Troubleshooting

### Server Not Reachable
```
❌ Cannot reach server at http://localhost:3000
```
**Solution:** Make sure your app is running with `npm run dev` or `npm start`

### Database Connection Errors
```
❌ DATABASE_URL not configured
```
**Solution:** Ensure your `.env` file has `DATABASE_URL` set, or pull it with `vercel env pull`

### Test Failures
If tests fail:
1. Check the specific error message
2. Verify the database is initialized: visit `/api/init-db`
3. Check API endpoint manually in browser
4. Review server logs for errors
5. Ensure all migrations have been run

## CI/CD Integration

✅ **Automated testing is now configured!** Tests run automatically on every pull request via GitHub Actions.

### GitHub Actions Workflow

The test suite runs automatically on:
- Every push to a pull request
- Every push to the main branch
- Manual workflow dispatch

**Workflow file:** `.github/workflows/test.yml`

**What it does:**
1. Builds the Next.js application
2. Starts the production server
3. Runs all 8 test suites sequentially
4. Posts results as a comment on pull requests
5. Uploads test artifacts for debugging

**View workflow runs:** [Actions tab](../../actions/workflows/test.yml)

### Manual Integration

You can also integrate tests into custom workflows:

```yaml
- name: Run all tests
  env:
    TEST_URL: http://localhost:3000
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: npm test
```

Or run individual test suites:

```yaml
- name: Run specific test suite
  run: npm run test:nextjs
  env:
    TEST_URL: http://localhost:3000
```

## Test Coverage

Current coverage:
- ✅ API endpoints: 100%
- ✅ Database operations: 90%
- ✅ Frontend integration: 85%
- ✅ Game workflow: 100%
- ✅ Next.js routing & SSR: 100%
- ✅ Salary cap draft: 95%
- ✅ Performance baselines: Established
- ✅ Legacy compatibility: 100%

**Total Test Suites:** 8 comprehensive suites
**Total Test Cases:** 100+ individual tests

## Performance Baselines

The performance benchmark tests establish baselines for:
- **Page Load Time:** < 5000ms
- **API Response Time:** < 2000ms  
- **Navigation Time:** < 3000ms
- **Concurrent Requests:** 10+ simultaneous users
- **Bundle Size:** Tracked and monitored

Run `npm run test:performance` to measure current performance against baselines.

## Regression Testing

The test suite includes comprehensive regression tests to ensure:
- **No breaking changes** in API endpoints or data structures
- **Backward compatibility** with legacy features and data formats
- **Performance regressions** are detected early
- **Safe refactoring** with confidence

## Testing Baseline & Audit Results

### Baseline Status (Issue #82 - November 2025)

**Enhanced with:**
- ✅ Coverage reporting (c8 with 90% thresholds)
- ✅ CI workflow publishing coverage to PR comments
- ✅ Real SSR performance assertions (TTFB < 5000ms)
- ✅ E2E dynamic import tests
- ✅ Comprehensive test cleanup utilities

**Total Test Coverage:** 125+ individual test cases across 13+ test suites

### Test Audit Summary

**Core Test Suites (13 files, ~4,400+ lines):**
- All passing ✅
- Comprehensive coverage of state management, dynamic imports, SSR, components
- Performance instrumentation and monitoring
- Legacy regression protection

**Test Quality:**
- State manager: 100% coverage
- Dynamic imports: 100% coverage
- API endpoints: 100% coverage
- Game flow: 100% coverage
- Salary cap draft: 95% coverage
- Components: 85% coverage

**Obsolete Files Removed:**
- `scoring-tests.js` - Marked `.obsolete` (one-off test, not integrated)

**Consolidated Tests:**
- Budget utilities merged into salary-cap-draft tests
- API client tests merged into api-endpoints tests

### Test Suite Maintenance

All tests now include:
- Proper cleanup via `test-utils.js`
- Unique test IDs for isolation
- Coverage reporting integration
- CI/CD automation
- Performance assertions where applicable

## Test Execution Results

### Tests That Run Without Database

These tests can run in any environment:

- ✅ `nextjs-routing.test.js` - Next.js & SSR validation (framework, routes, SSR, static assets)
- ✅ `performance-benchmarks.test.js` - Performance baselines (bundle size, page load, asset timing)

### Tests That Require Database Connection

These tests need `DATABASE_URL` configured:

- `api-endpoints.test.js` - API functionality
- `database.test.js` - Database integrity
- `frontend-integration.test.js` - Some API integration tests
- `game-flow.test.js` - End-to-end workflows
- `salary-cap-draft.test.js` - Draft functionality
- `legacy-regression.test.js` - API compatibility

### Expected Behavior

**With Database:**
- All 125+ tests should pass ✅
- Full API coverage
- Complete game flow testing
- Performance baselines established

**Without Database:**
- ~60% of tests pass (non-DB tests)
- Frontend and routing tests pass
- Performance tracking works
- API tests gracefully skip/fail

This is **correct behavior** - tests detect missing database configuration and report it appropriately.

## Future Improvements

- [ ] Add visual regression testing (screenshots)
- [ ] Add load testing (Artillery, k6)
- [ ] Add mobile-specific tests
- [ ] Increase component test coverage to 90%
- [ ] Add E2E tests for complete user journeys
- [ ] Add authentication tests (when user accounts implemented)

## Support

If tests fail after migration, check:
1. NEXTJS_MIGRATION.md for migration details
2. Server logs for errors
3. Database console for data issues
4. GitHub Issues for known problems
