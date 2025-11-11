# Shared Utilities Directory

This directory contains shared utility modules extracted from the monolithic `public/app.js` file as part of the Phase 1 modularization effort (Issue #82).

## Files

### `formatting.js`
Pure formatting functions for time, pace, ordinals, and XSS prevention.

**Functions:**
- `formatSplitLabel(splitName)` - Convert split keys to display labels (e.g., '5k' → '5K')
- `formatTimeGap(gapSeconds)` - Format time differences with sub-second precision
- `formatTimeFromMs(ms)` - Convert milliseconds to H:MM:SS format
- `formatPacePerMile(msPerMeter)` - Calculate pace from milliseconds per meter
- `timeStringToSeconds(timeStr)` - Parse time strings to total seconds
- `roundTimeToSecond(timeStr)` - Round time strings to nearest second
- `getOrdinal(n)` - Generate ordinal suffixes (1st, 2nd, 3rd, etc.)
- `escapeHtml(text)` - XSS prevention (browser and Node.js compatible)
- `getRecordBadge(recordType, recordStatus)` - Generate record badge HTML
- `getCountryFlag(countryCode)` - Convert ISO 3166-1 alpha-3 codes to flag emojis

**Characteristics:**
- ✅ All functions are pure (no side effects)
- ✅ Both browser and Node.js compatible
- ✅ 100% test coverage (81 tests)
- ✅ Comprehensive JSDoc documentation

**Usage:**
```javascript
// ES6 module import
import { formatTimeGap, getOrdinal } from './utils/formatting.js';

// Format time difference
formatTimeGap(154); // '+2:34'

// Get ordinal suffix
getOrdinal(1); // '1st'
getOrdinal(21); // '21st'
```

**Testing:**
```bash
npm run test:formatting
```

## Related Directories

- `../config/` - Configuration constants (session keys, cache TTLs, scoring config)
- `../lib/` - Additional shared libraries (UI helpers, budget utils, state management)
- `../src/features/draft/` - Draft-specific utilities (validation, state machine)

## Documentation

For more information about the modularization effort, see:
- `docs/PROCESS_MONOLITH_AUDIT.md` - Full audit and migration plan
- `docs/CORE_ARCHITECTURE.md` - Architecture overview
- Issue #82 - Parent componentization epic

## Test Coverage

```
Total tests: 81
✓ Passed: 81
✗ Failed: 0
Function Coverage: 100%
```

All formatting utilities have comprehensive unit tests with 100% coverage. Tests cover:
- Normal cases
- Edge cases (empty, null, invalid inputs)
- Boundary conditions (min/max values, overflow scenarios)
- Error handling

## Migration Status

**Phase 1: Completed** ✅ (November 11, 2025)
- Formatting utilities extracted
- Configuration constants centralized
- Unit tests created with 100% coverage
- Documentation updated

**Next Steps:**
- Phase 4: Update `public/app.js` to import from these modules (requires ES6 module support)
- Alternative: Convert app.js to React components and import directly

## Contributing

When adding new utility functions:
1. Keep functions pure (no side effects)
2. Add comprehensive JSDoc documentation
3. Write unit tests (aim for 100% coverage)
4. Update this README
5. Follow existing patterns and conventions
