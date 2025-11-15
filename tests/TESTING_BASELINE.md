# Testing Baseline Documentation

**Last Updated:** November 13, 2025  
**Issue References:** [#69](https://github.com/jessephus/marathon-majors-league/issues/69), [#82](https://github.com/jessephus/marathon-majors-league/issues/82)

## Overview

This document describes the comprehensive testing baseline established for the Fantasy NY Marathon application. This baseline provides a safety net for code restructuring, optimization, and refactoring efforts, with enhanced coverage reporting and performance assertions added in November 2025.

## Recent Enhancements (Issue #82)

**November 13, 2025:** Extended baseline for migrated components & state manager

✅ **Added Coverage Reporting**
- c8 coverage tool configured with 90% thresholds
- CI workflow publishes coverage to PR comments
- HTML reports uploaded as artifacts
- See [COVERAGE.md](COVERAGE.md) for details

✅ **Enhanced SSR Integration Tests**
- Added real performance assertions (TTFB < 5000ms)
- Added initial HTML content verification
- Added duplicate fetch detection
- See `tests/ssr-integration.test.js`

✅ **Added E2E Dynamic Import Tests**
- Commissioner panels lazy loading verification
- Athlete modal chunk loading tests
- Chunk size analysis
- Error handling verification
- See `tests/dynamic-import-e2e.test.js`

✅ **Test Cleanup**
- Removed obsolete scoring-tests.js
- Comprehensive audit documented in [AUDIT_RESULTS.md](AUDIT_RESULTS.md)

## Purpose

Before any codebase restructuring or optimization, we need:
1. **Confidence** that changes don't break existing functionality
2. **Baselines** to detect performance regressions
3. **Coverage** of all major user flows and API integrations
4. **Protection** for legacy features and backward compatibility

## Test Suite Structure

### Enhanced Test Suites (Issue #82 - November 2025)

| Suite | Purpose | Test Cases | Coverage |
|-------|---------|------------|----------|
| **state-manager.test.js** ✨ | State manager unit tests | 34 | 100% |
| **state-manager-integration.test.js** ✨ | TTL, pub/sub, events | 31 | 100% |
| **dynamic-imports.test.js** ✨ | Dynamic import utilities | 10 | 100% |
| **dynamic-import-e2e.test.js** 🆕 | E2E chunk loading | 12 | N/A |
| **ssr-integration.test.js** 🆕 | SSR performance assertions | 8+ | N/A |
| **leaderboard-components.test.js** ✨ | Component migration | 16 | 85% |
| **coverage** 🆕 | Code coverage reporting | - | 90%+ |

**Total (Enhanced):** 125+ individual test cases

✨ = Enhanced with additional coverage  
🆕 = Newly added for Issue #82

### 8 Comprehensive Test Suites (Original Baseline)

| Suite | Purpose | Test Cases | Coverage |
|-------|---------|------------|----------|
| **api-endpoints.test.js** | API functionality | 12+ | 100% |
| **database.test.js** | Database integrity | 8+ | 90% |
| **frontend-integration.test.js** | Frontend serving | 10+ | 85% |
| **game-flow.test.js** | End-to-end workflows | 6+ | 100% |
| **nextjs-routing.test.js** 🆕 | Next.js & SSR | 25+ | 100% |
| **salary-cap-draft.test.js** 🆕 | Draft functionality | 20+ | 95% |
| **performance-benchmarks.test.js** 🆕 | Performance baselines | 15+ | N/A |
| **legacy-regression.test.js** 🆕 | Backward compatibility | 20+ | 100% |

**Total:** 100+ individual test cases

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Core functionality
npm run test:api
npm run test:db
npm run test:frontend
npm run test:flow

# Testing baseline (Issue #69)
npm run test:nextjs
npm run test:salarycap
npm run test:performance
npm run test:legacy

# Enhanced suites (Issue #82)
npm run test:state          # State manager unit tests
npm run test:state:integration  # TTL & pub/sub tests
npm run test:dynamic        # Dynamic import tests
npm run test:dynamic:e2e    # E2E chunk loading
npm run test:ssr            # SSR performance tests

# Coverage reporting
npm run test:coverage       # Full coverage report
npm run test:coverage:new   # New modules (90% threshold)
```

### Test Against Production
```bash
TEST_URL=https://marathonmajorsfantasy.com npm test
```

## Test Coverage Details

### 1. Next.js Routing and SSR (`nextjs-routing.test.js`)

**Purpose:** Validate Next.js framework integration and server-side rendering.

**Key Tests:**
- ✅ Confirms Next.js is powering the application (x-powered-by header)
- ✅ Validates all essential routes render correctly
- ✅ Verifies server-side rendering produces initial HTML
- ✅ Checks SEO meta tags and social sharing tags
- ✅ Tests client-side navigation setup
- ✅ Validates fallback and error handling
- ✅ Confirms static asset serving (CSS, JS, images)
- ✅ Checks cache headers for performance
- ✅ Tests legacy route compatibility

**Why Important:**
- Ensures Next.js migration didn't break routing
- Validates SSR for better initial page load
- Confirms SEO optimization is maintained
- Protects against framework-related issues

### 2. Salary Cap Draft (`salary-cap-draft.test.js`)

**Purpose:** Comprehensive testing of the daily fantasy-style draft system.

**Key Tests:**
- ✅ Team creation via API
- ✅ Session management (create, verify, extend)
- ✅ Athlete selection with salary data
- ✅ Budget validation ($30,000 cap)
- ✅ Team composition validation (3 men + 3 women)
- ✅ Draft persistence and retrieval
- ✅ Concurrent submission handling
- ✅ Error handling for edge cases

**User Flows Covered:**
1. Create new team session
2. Browse and select athletes
3. Stay within budget constraints
4. Submit valid team composition
5. Retrieve drafted team later
6. Handle errors gracefully

**Why Important:**
- Core feature of the application
- Complex business logic around budgets and composition
- Critical user experience path
- Integration with session management

### 3. Performance Benchmarks (`performance-benchmarks.test.js`)

**Purpose:** Establish baseline metrics to detect performance regressions.

**Baseline Thresholds:**
- Page Load Time: **< 5000ms**
- API Response Time: **< 2000ms**
- Navigation Time: **< 3000ms**
- Concurrent Requests: **10+ users**

**Metrics Tracked:**
- Bundle size (JavaScript, CSS)
- Time to First Byte (TTFB)
- Page load performance
- API endpoint response times
- Static asset load times
- Concurrent user handling
- Database connection pooling
- Cache effectiveness

**Performance Report:**
Generates a comprehensive baseline report including:
- Current metrics vs. thresholds
- Bundle size breakdown
- API timing analysis
- Cache hit rates
- Recommendations for optimization

**Why Important:**
- Detects performance regressions before they reach production
- Provides data-driven optimization targets
- Tracks impact of code changes on performance
- Essential for maintaining good user experience

### 4. Legacy Regression (`legacy-regression.test.js`)

**Purpose:** Ensure backward compatibility with existing features and data.

**Key Tests:**
- ✅ Legacy API schema preservation
- ✅ MVP feature functionality (snake draft, rankings, results)
- ✅ Data format compatibility (gameId, player codes, gender fields)
- ✅ CORS headers preservation
- ✅ Database schema compatibility
- ✅ Error handling patterns
- ✅ Session token formats
- ✅ Frontend integration points

**Breaking Change Detection:**
- Fails if critical endpoints are removed
- Fails if required data fields are deleted
- Validates response format consistency
- Checks for unexpected schema changes

**Why Important:**
- Protects existing users and their data
- Prevents accidental breaking changes
- Maintains API contracts
- Enables safe refactoring

## Performance Baseline Details

### Current Baseline Metrics (Example)

```
Page Load:          1,800ms (threshold: 5,000ms) ✅
API Athletes:       450ms   (threshold: 2,000ms) ✅
API Standings:      680ms   (threshold: 2,000ms) ✅
CSS Load:           120ms   (threshold: 3,000ms) ✅
JS Load:            850ms   (threshold: 3,000ms) ✅

Bundle Sizes:
  app.js:           267 KB
  salary-cap-draft.js: 59 KB
  style.css:        45 KB
```

### How to Use Baselines

1. **Before Optimization:**
   ```bash
   npm run test:performance > baseline-before.txt
   ```

2. **Make Changes:**
   - Implement optimization or refactoring
   - Code changes, dependency updates, etc.

3. **After Changes:**
   ```bash
   npm run test:performance > baseline-after.txt
   ```

4. **Compare Results:**
   ```bash
   diff baseline-before.txt baseline-after.txt
   ```

5. **Validate:**
   - Ensure metrics improved or stayed same
   - No threshold violations
   - No unexpected regressions

## Regression Testing Strategy

### What is Protected

1. **API Contracts**
   - Endpoint URLs and methods
   - Request/response formats
   - Required vs. optional fields
   - Error response structures

2. **Data Schemas**
   - Database table structures
   - Field names and types
   - Relationships and constraints
   - Migration compatibility

3. **User Flows**
   - Team creation and draft
   - Session management
   - Results entry and viewing
   - Commissioner operations

4. **Performance**
   - Page load times
   - API response times
   - Bundle sizes
   - Concurrent handling

### When Tests Should Fail

Tests are designed to fail if:
- Critical endpoints are removed or broken
- Required data fields are deleted
- Response formats change unexpectedly
- Performance degrades beyond thresholds
- Legacy features stop working
- CORS or security configs change
- Session management breaks

## CI/CD Integration

### ✅ Automated Testing Configured

Tests now run automatically via GitHub Actions on every pull request!

**Workflow:** `.github/workflows/test.yml`

**Triggers:**
- Every push to a pull request
- Every push to main branch  
- Manual workflow dispatch

**What happens:**
1. Application is built with `npm run build`
2. Production server starts on port 3000
3. All 8 test suites run sequentially
4. Results posted as PR comment
5. Test artifacts uploaded for debugging

**View runs:** Navigate to the [Actions tab](../../actions/workflows/test.yml) in GitHub

### GitHub Actions Workflow Example

The automated workflow (`.github/workflows/test.yml`) includes:

```yaml
name: Test Suite

on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm start &
      - run: npm test
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Manual Workflow Integration

For custom workflows, you can run individual test suites:

```yaml
- name: Run Next.js tests
  run: npm run test:nextjs
  env:
    TEST_URL: http://localhost:3000

- name: Run performance benchmarks  
  run: npm run test:performance
  env:
    TEST_URL: http://localhost:3000
```

### Pre-deployment Checks

Before any deployment:
```bash
# 1. Run full test suite
npm test

# 2. Check performance
npm run test:performance

# 3. Verify no breaking changes
npm run test:legacy

# 4. Review results
# All tests should pass ✅
```

## Best Practices

### For Developers

1. **Run tests locally before committing:**
   ```bash
   npm test
   ```

2. **Add tests for new features:**
   - Follow existing patterns
   - Cover happy path and edge cases
   - Include error handling

3. **Update baselines after optimization:**
   - Document performance improvements
   - Update threshold if needed
   - Include before/after metrics

4. **Check legacy compatibility:**
   - Run regression tests
   - Verify API contracts unchanged
   - Test with existing data

### For Code Reviews

1. **Require passing tests:**
   - All test suites must pass
   - No performance regressions
   - No breaking changes

2. **Review test coverage:**
   - New features have tests
   - Edge cases covered
   - Error handling tested

3. **Validate performance:**
   - Check benchmark results
   - Ensure metrics within thresholds
   - Review bundle size changes

## Troubleshooting

### Server Not Running
```bash
# Start development server
npm run dev

# Or production server
npm run build && npm start
```

### Database Not Initialized
```bash
# Initialize database
curl http://localhost:3000/api/init-db

# Or visit in browser
open http://localhost:3000/api/init-db
```

### Tests Failing After Changes

1. **Review error messages:**
   - What exactly failed?
   - Is it expected (breaking change)?
   - Or is it a bug?

2. **Check if intentional:**
   - Did API contract change?
   - Did you remove a feature?
   - Update tests if intentional

3. **Fix the issue:**
   - Restore compatibility
   - Or update tests with justification
   - Document breaking changes

### Performance Regression

1. **Identify slow components:**
   ```bash
   npm run test:performance
   ```

2. **Compare with baseline:**
   - Check specific metrics
   - Identify bottlenecks
   - Use browser DevTools

3. **Optimize:**
   - Bundle analysis: `npm run build:analyze`
   - Code splitting
   - Caching improvements
   - Database query optimization

## Next Steps

### Continuous Improvement

1. **Add more test coverage:**
   - Visual regression tests (screenshots)
   - Load testing (Artillery, k6)
   - Mobile-specific tests
   - Accessibility tests

2. **Enhance performance monitoring:**
   - Real User Monitoring (RUM)
   - Lighthouse CI integration
   - Core Web Vitals tracking

3. **Automated regression detection:**
   - Automated baseline comparisons
   - Performance budgets
   - Breaking change alerts

### Safe Refactoring Process

With this test baseline in place, you can now safely:

1. **Restructure code:**
   - Tests verify behavior unchanged
   - Confidence in refactoring
   - Fast feedback loop

2. **Optimize performance:**
   - Measure improvements
   - Ensure no regressions
   - Data-driven decisions

3. **Add new features:**
   - Build on solid foundation
   - Protected by regression tests
   - Performance monitored

---

## Code Coverage Reporting (Issue #82)

**Added:** November 13, 2025

### Coverage Tool: c8

We use c8 for JavaScript/TypeScript code coverage with the following thresholds:

| Metric | Threshold | Scope |
|--------|-----------|-------|
| Lines | 90% | New modules in lib/ and components/ |
| Functions | 90% | New modules in lib/ and components/ |
| Branches | 85% | New modules in lib/ and components/ |
| Statements | 90% | New modules in lib/ and components/ |

### Running Coverage

```bash
# Full coverage report
npm run test:coverage

# New modules only (enforces 90% threshold)
npm run test:coverage:new

# View HTML report
open coverage/index.html
```

### CI Integration

Coverage is automatically checked on every pull request:

1. **Runs tests with coverage** on all new modules
2. **Posts PR comment** with coverage metrics
3. **Uploads HTML report** as artifact
4. **Fails if thresholds not met** (90% lines/functions, 85% branches)

### Example PR Comment

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

- `lib/state-manager.ts` - Centralized state management
- `lib/state-provider.tsx` - React Context provider
- `lib/dynamic-import.ts` - Dynamic import utilities
- `lib/performance-monitor.ts` - Performance tracking
- `components/LeaderboardTable.tsx` - Leaderboard display
- `components/ResultsTable.tsx` - Race results display
- `components/Footer.tsx` - Shared footer component

**For complete coverage documentation, see [COVERAGE.md](COVERAGE.md)**

---

## Summary

This testing baseline provides:

✅ **Confidence** - 100+ tests covering all major flows
✅ **Performance** - Baseline metrics for regression detection  
✅ **Compatibility** - Legacy feature protection
✅ **Safety** - Breaking change detection
✅ **Documentation** - Clear testing strategy
✅ **Automation** - Ready for CI/CD integration

**You can now refactor, optimize, and restructure with confidence!**

---

**Related Documentation:**
- [tests/README.md](README.md) - Test suite overview
- [docs/PERFORMANCE_OPTIMIZATION.md](../docs/PERFORMANCE_OPTIMIZATION.md) - Performance guide
- [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) - Technical architecture
- [docs/DEVELOPMENT.md](../docs/DEVELOPMENT.md) - Development guide

**Issue Reference:** [#69 - Testing Baseline for Optimization](https://github.com/jessephus/marathon-majors-league/issues/69)
