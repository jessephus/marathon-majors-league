# Configuration Constants

This directory contains centralized configuration constants extracted from the monolithic `public/app.js` file as part of the Phase 1 modularization effort (Issue #82).

## Files

### `constants.js`
Centralized configuration values for the entire application.

**Configuration Sections:**

#### Session Storage Keys
- `TEAM_SESSION_KEY` - Key for team session localStorage
- `COMMISSIONER_SESSION_KEY` - Key for commissioner session localStorage
- `CURRENT_GAME_ID_KEY` - Key for current game ID

#### Session Timeouts
- `COMMISSIONER_SESSION_TIMEOUT` - 30 days (milliseconds)
- `TEAM_SESSION_TIMEOUT` - 90 days (milliseconds)

#### Cache TTL Configuration
- `RESULTS_CACHE_TTL` - 30 seconds (short TTL for live results)
- `GAME_STATE_CACHE_TTL` - 60 seconds (moderate TTL for game state)
- `ATHLETES_CACHE_TTL` - 5 minutes (longer TTL for athlete data)

#### Leaderboard Configuration
- `LEADERBOARD_REFRESH_INTERVAL` - 60 seconds auto-refresh

#### Salary Cap Draft Configuration
- `SALARY_CAP_BUDGET` - $30,000 total budget
- `MIN_MEN_ATHLETES` - 3 required
- `MIN_WOMEN_ATHLETES` - 3 required
- `TOTAL_ROSTER_SLOTS` - 6 total slots (3M + 3W)

#### Scoring Configuration
- `SCORING_SYSTEM` - Complete scoring configuration
  - Placement points (1st-50th place)
  - Time bonus thresholds
  - Record bonus points

#### UI Configuration
- Modal z-index values
- Loading overlay durations
- Drag and drop sensitivity
- Pagination defaults

#### Error/Success Messages
- Centralized user-facing messages for consistency

#### Feature Flags
- Toggle features on/off (snake draft, salary cap, live results, etc.)

#### Route Paths
- Centralized route definitions

**Usage:**
```javascript
// ES6 module import
import { 
  SALARY_CAP_BUDGET, 
  MIN_MEN_ATHLETES,
  RESULTS_CACHE_TTL 
} from './config/constants.js';

// Use in validation
if (totalSpent > SALARY_CAP_BUDGET) {
  return 'Over budget!';
}

// Use in caching
const cacheExpiry = Date.now() + RESULTS_CACHE_TTL;
```

**Computed Values:**
```javascript
import { getApiBase, isDevelopment } from './config/constants.js';

// API base URL (computed at runtime)
const apiUrl = getApiBase(); // Returns window.location.origin in browser

// Development mode detection
if (isDevelopment()) {
  console.log('Running in development mode');
}
```

## Benefits

✅ **Single source of truth** - All configuration in one place  
✅ **Easy to modify** - Change values without hunting through code  
✅ **Type safety** - JSDoc comments provide IDE hints  
✅ **Consistency** - Same values used everywhere  
✅ **Testability** - Easy to mock in tests

## Migration Status

**Phase 1: Completed** ✅ (November 11, 2025)
- Constants extracted from `public/app.js`
- Organized by category
- Documented with comments
- Ready for import

**Next Steps:**
- Phase 4: Update `public/app.js` to import from this module
- Add TypeScript types for better IDE support
- Migrate environment-specific config to `.env` files

## Related Files

- `../utils/formatting.js` - Pure formatting functions
- `../lib/` - Additional shared libraries
- `../src/features/draft/validation.js` - Uses salary cap constants

## Documentation

For more information about the modularization effort, see:
- `docs/PROCESS_MONOLITH_AUDIT.md` - Full audit and migration plan
- `docs/CORE_ARCHITECTURE.md` - Architecture overview
- Issue #82 - Parent componentization epic

## Contributing

When adding new constants:
1. Group by category (session, cache, scoring, UI, etc.)
2. Add descriptive comments
3. Use ALL_CAPS naming convention
4. Export as named exports (not default)
5. Update this README
6. Document any computed values or functions
