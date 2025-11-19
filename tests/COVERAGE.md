# Coverage Reporting Configuration

## Overview

This document explains the test coverage configuration for the Fantasy Marathon application, implemented as part of Issue #82 (Testing Baseline Extension).

## Coverage Tool: c8

We use `c8` (v8 coverage) for JavaScript/TypeScript code coverage. It's a modern, zero-config coverage tool that works natively with Node.js.

## Configuration

Coverage configuration is stored in `.c8rc.json`:

```json
{
  "include": [
    "lib/**/*.ts",
    "lib/**/*.tsx",
    "lib/**/*.js",
    "components/**/*.tsx"
  ],
  "lines": 90,
  "functions": 90,
  "branches": 85,
  "statements": 90
}
```

## Coverage Thresholds

Per Issue #82 requirements, new modules must meet these thresholds:

| Metric | Threshold | Scope |
|--------|-----------|-------|
| Lines | 90% | All new lib/ and components/ files |
| Functions | 90% | All new lib/ and components/ files |
| Branches | 85% | All new lib/ and components/ files |
| Statements | 90% | All new lib/ and components/ files |

## Running Coverage

### Full Coverage Report
```bash
npm run test:coverage
```

### Coverage for New Modules Only
```bash
npm run test:coverage:new
```

This runs coverage for:
- State manager tests
- Dynamic import tests
- SSR integration tests

## CI/CD Integration

Coverage is automatically checked on every pull request via GitHub Actions workflow (`.github/workflows/coverage.yml`).

### What the CI Does

1. **Runs tests with coverage** on all modules
2. **Generates coverage report** (HTML, JSON, LCOV)
3. **Posts PR comment** with coverage metrics
4. **Uploads artifacts** (HTML report viewable in Actions)
5. **Fails if thresholds not met** (90% lines/functions, 85% branches)

### PR Comment Format

```markdown
## 📊 Test Coverage Report

| Metric | Coverage | Status | Target |
|--------|----------|--------|--------|
| Lines | 92.5% | ✅ | 90% |
| Statements | 93.1% | ✅ | 90% |
| Functions | 91.2% | ✅ | 90% |
| Branches | 87.3% | ✅ | 85% |

🎉 **All coverage targets met!**
```

## Viewing Coverage Reports

### Local Development

After running `npm run test:coverage`, open:
```
coverage/index.html
```

This shows:
- Overall coverage summary
- File-by-file breakdown
- Line-by-line coverage highlighting
- Uncovered code paths

### CI/CD

1. Go to GitHub Actions tab
2. Click on the coverage workflow run
3. Download coverage-report artifact
4. Extract and open `index.html`

## Monitored Modules

Coverage is specifically tracked for Phase 4 migrated modules:

### State Management
- `lib/state-manager.ts` - Centralized state management
- `lib/state-provider.tsx` - React Context provider
- `lib/use-state-manager.ts` - React hooks

### Performance & Features
- `lib/dynamic-import.ts` - Dynamic import utilities
- `lib/performance-monitor.ts` - Performance tracking
- `lib/feature-flags.ts` - Feature flag system

### Components
- `components/LeaderboardTable.tsx` - Leaderboard display
- `components/ResultsTable.tsx` - Race results display
- `components/Footer.tsx` - Shared footer component

## Improving Coverage

### Identify Uncovered Lines

1. Run `npm run test:coverage`
2. Open `coverage/index.html`
3. Click on file with low coverage
4. Red highlighting shows uncovered lines

### Add Tests

1. Identify uncovered code paths
2. Add test cases in appropriate test file
3. Re-run coverage to verify

### Example

If `lib/state-manager.ts` shows 85% coverage:

```bash
# View detailed coverage
open coverage/lib/state-manager.ts.html

# Add tests to tests/state-manager.test.js
# Re-run coverage
npm run test:coverage:new
```

## Exclusions

The following are excluded from coverage:

- Test files (`*.test.ts`, `*.spec.js`)
- Type definitions (`*.d.ts`)
- Build output (`.next/`, `dist/`)
- Dependencies (`node_modules/`)

## Troubleshooting

### Coverage Not Running

**Issue:** `c8: command not found`  
**Solution:** Run `npm install`

### Thresholds Failing

**Issue:** CI fails with coverage below threshold  
**Solution:** 
1. Run `npm run test:coverage:new` locally
2. Open `coverage/index.html` to see gaps
3. Add tests for uncovered code
4. Verify locally before pushing

### No Coverage Data

**Issue:** Coverage report shows 0%  
**Solution:**
- Ensure tests are actually running (check logs)
- Verify file paths match `.c8rc.json` includes
- Check that tests import modules being tested

## Best Practices

### Write Testable Code

- Keep functions small and focused
- Avoid side effects
- Use dependency injection
- Separate business logic from UI

### Test Critical Paths

Priority order for coverage:
1. **State mutations** - High impact, easy to break
2. **Business logic** - Calculation, validation
3. **Error handling** - Edge cases, failures
4. **UI logic** - Conditional rendering, interactions

### Maintain High Coverage

- Add tests for new code before merging
- Don't delete tests to increase coverage
- Review coverage reports regularly
- Fix coverage gaps promptly

## Coverage Goals

### Current State (Estimated)

| Module | Coverage | Status |
|--------|----------|--------|
| state-manager.ts | ~95% | ✅ Excellent |
| dynamic-import.ts | ~90% | ✅ Good |
| performance-monitor.ts | ~85% | ⚠️ Needs improvement |
| state-provider.tsx | Unknown | ⚠️ Needs coverage |
| LeaderboardTable.tsx | Unknown | ⚠️ Needs coverage |

### Target State

All new modules should achieve:
- ✅ **90%+ lines** coverage
- ✅ **90%+ functions** coverage
- ✅ **85%+ branches** coverage

## Related Documentation

- [TESTING_BASELINE.md](TESTING_BASELINE.md) - Overall testing strategy
- [AUDIT_RESULTS.md](AUDIT_RESULTS.md) - Test audit findings
- [TEST_SUITE_SUMMARY.md](TEST_SUITE_SUMMARY.md) - Test suite overview
- [Issue #82](https://github.com/jessephus/marathon-majors-league/issues/82) - Testing baseline extension

## Updates

**November 13, 2025:** Initial coverage configuration added
- Configured c8 with 90/90/85 thresholds
- Added CI workflow for automatic coverage reporting
- Created coverage documentation

---

**Maintained by:** Development Team  
**Last Updated:** November 13, 2025
