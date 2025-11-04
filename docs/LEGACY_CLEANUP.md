# Legacy Code Cleanup - Issue #83

This document records the cleanup of obsolete, duplicated, and legacy code from the codebase.

## Overview

As part of the optimization project (Issue #69), this cleanup removes technical debt accumulated during the project's evolution from vanilla JS to Next.js, and from Blob storage to Postgres.

## Code Removed

### 1. Dead Code in `public/app.js`

#### `displayLegacyStandings()` - REMOVED
**Status**: Dead code (never called)  
**Purpose**: Was meant to display time-based standings as fallback  
**Why removed**: Function is never invoked anywhere in the codebase  
**Lines removed**: ~23 lines  
**Git commit**: e9b6e53

### 2. Deprecated Functions Marked for Future Removal

The following functions support the deprecated average-time scoring system. They remain in the codebase as error fallbacks but are clearly marked with deprecation warnings:

#### Time-Based Scoring Functions (DEPRECATED - Fallback Only)
- `displayLegacyScore()` - Display average time score (fallback for points system failure)
- `calculateTeamScore()` - Sum athlete finish times
- `calculateAverageTime()` - Compute team average time
- `timeToSeconds()` - Convert time strings to seconds
- `secondsToTime()` - Convert seconds to time strings

**Status**: Deprecated but retained as fallbacks  
**Why retained**: Currently used when points-based scoring API fails  
**Documentation**: Added comprehensive deprecation comments explaining:
- These are ONLY for fallback use
- Points-based scoring is the primary system
- Should only execute in error conditions
- TODO: Remove once points system is confirmed stable

**Future action**: Can be removed once points-based scoring is proven 100% reliable in production.

### 3. Obsolete Helper Scripts - REMOVED

The following scripts were one-off debugging tools created to fix specific bugs that have been resolved:

#### Removed Scripts:
1. **`scripts/check-munyao-time.js`** - Debugged specific athlete time formatting issue
2. **`scripts/check-munyao-current.js`** - Checked munyao data in current state
3. **`scripts/fix-munyao-time.js`** - Fixed munyao-specific time issue
4. **`scripts/check-raw-db.js`** - One-off database debugging
5. **`scripts/check-raw-values.js`** - One-off raw value debugging
6. **`scripts/check-athlete.js`** - Generic athlete existence check

**Why removed**: These were temporary debugging scripts for resolved issues. They are not part of normal maintenance workflows and would confuse new contributors.

**Alternative**: For debugging, developers should:
- Use database admin tools (Neon dashboard)
- Write SQL queries directly
- Use `scripts/validate-schema.js` for schema validation
- Check API endpoints with curl/Postman

**Backup**: Scripts were committed to git history and can be retrieved if needed.

## Scoring System Clarification

### Points-Based Scoring (Current - Primary)
**File**: `/pages/api/scoring-engine.js`  
**Documentation**: `/docs/POINTS_SCORING_SYSTEM.md`

**Features**:
- Placement points (top 10 finishers)
- Time gap bonuses
- Performance bonuses (negative split, even pace, fast finish)
- Record bonuses (world record, course record)

**Status**: **PRIMARY SCORING METHOD** - Fully implemented and production-ready

### Average Time Scoring (Legacy - Deprecated)
**Status**: **DEPRECATED** - Retained only as error fallback

**Functions**: See "Deprecated Functions" section above

**When used**: Only when points-based scoring fails to load (network error, API timeout, etc.)

**Future**: Should be removed once points system is 100% stable

## Game Modes Clarification

Created comprehensive documentation to distinguish between two game modes that were previously unclear:

### Season League Mode
- **Team Building**: Players rank athletes, commissioner executes snake draft
- **API Endpoints**: `/api/rankings`, `/api/draft`
- **Database**: `player_rankings`, `draft_teams` tables
- **Use Case**: Season-long leagues with friends

### Single Race Mode
- **Team Building**: Direct athlete selection within $30,000 salary cap
- **API Endpoints**: `/api/salary-cap-draft`
- **Database**: `users`, `user_games` tables with salary tracking
- **Use Case**: Daily fantasy-style single event

**Documentation**: Created `/docs/GAME_MODES.md` with complete comparison table, component boundaries, and contributor guide.

## Documentation Updates

### New Documentation
1. **`/docs/GAME_MODES.md`** - Comprehensive game mode guide
   - Season League vs Single Race comparison
   - Component boundaries (APIs, frontend, database)
   - Naming conventions to avoid confusion
   - Contributor quick reference

### Updated Documentation
1. **`/docs/README.md`** - Added game modes section
   - Links to GAME_MODES.md
   - Links to SALARY_CAP_DRAFT.md
   - Links to POINTS_SCORING_SYSTEM.md

## Testing Impact

### Tests Not Changed
All existing tests remain valid:
- `/tests/game-flow.test.js` - Tests Season League snake draft
- `/tests/salary-cap-draft.test.js` - Tests Single Race salary cap
- `/tests/api-endpoints.test.js` - Tests all API endpoints
- `/tests/legacy-regression.test.js` - Ensures backward compatibility

**Why no test changes**: 
- Dead code removal doesn't affect functionality
- Deprecated functions still work (just marked for future removal)
- Script removal doesn't affect automated test suite

### Manual Testing Recommended
After deployment, verify:
1. Points-based scoring displays correctly on leaderboard
2. Legacy time fallback works if points API is unavailable (simulate network error)
3. Both game modes (Season League, Single Race) work as expected

## Impact Summary

### Code Quality
- **Removed**: ~23 lines of dead code
- **Documented**: ~60 lines of deprecated code with clear warnings
- **Added**: Comprehensive game mode documentation
- **Clarified**: Scoring system status and future direction

### Developer Experience
- **Before**: Confusing mix of vanilla JS/Next.js, unclear game modes
- **After**: Clear documentation, deprecated code marked, obsolete scripts removed

### Technical Debt
- **Reduced**: Removed 6 obsolete debugging scripts
- **Documented**: Created migration path for remaining deprecated code
- **Clarified**: Game mode boundaries and naming conventions

## Remaining Work

### Future Cleanup Opportunities
1. **Fully remove legacy scoring** once points system is 100% stable
2. **Consider refactoring app.js** (~6500 lines) into smaller modules
3. **Evaluate script folder** for additional consolidation opportunities

### Not Changed (Intentionally)
1. **Next.js + Vanilla JS hybrid** - Works well, no need to change
2. **Both game modes** - Both actively used, should be maintained
3. **Migration helpers** - Useful for developers working on migrations

## References

### Related Issues
- Issue #69 - Optimize Performance (parent issue)
- Issue #83 - Legacy Clean Up (this issue)

### Related Documentation
- `/docs/GAME_MODES.md` - Game mode guide (NEW)
- `/docs/POINTS_SCORING_SYSTEM.md` - Scoring documentation
- `/docs/SALARY_CAP_DRAFT.md` - Salary cap guide
- `/docs/NEXTJS_MIGRATION.md` - Next.js migration context
- `/docs/MIGRATION.md` - Database migration history

## Conclusion

This cleanup:
- ✅ Removes dead code that was never executed
- ✅ Clearly marks deprecated code for future removal
- ✅ Documents game mode boundaries to avoid confusion
- ✅ Removes obsolete debugging scripts
- ✅ Maintains backward compatibility
- ✅ Provides clear migration path forward

The codebase is now cleaner, better documented, and easier for new contributors to understand.
