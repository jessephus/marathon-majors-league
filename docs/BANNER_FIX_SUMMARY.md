# Banner Display Fix - Summary

## Problem
The manual review banner (added in commit 71b98ad) was not displaying when Finish results were entered but not yet finalized.

## Root Cause
The banner display logic checked for `!isTemporary` to determine if the banner should show. However, the `isTemporary` flag is `true` whenever **any** athlete has splits without finish times, even if other athletes have finish times entered.

### Original Logic
```javascript
// Backend: isTemporary is true if ANY athlete has splits without finish
const useTemporaryScoring = hasAnyResults && !isFinalized && hasSplitsWithoutFinish;

// Frontend: Banner only shows when isTemporary is false
const raceFinishedNotFinalized = !isTemporary && !gameState.resultsFinalized && standings.length > 0;
```

### The Issue
If a commissioner enters finish times for some athletes but other athletes still only have splits:
- `hasSplitsWithoutFinish` = true (at least one athlete has splits without finish)
- `isTemporary` = true (using temporary scoring)
- `!isTemporary` = false
- **Banner doesn't show** ❌

But we WANT the banner to show because finish times exist and aren't finalized yet.

## Solution
Added a new flag `hasFinishTimes` to track whether **any** finish times exist (regardless of temporary scoring status).

### Updated Logic
```javascript
// Backend: Track if ANY finish times exist
const hasAnyFinishTimes = allResults.some(r => r.finish_time !== null);

// Return this flag in the API response
return {
  standings,
  isTemporary: useTemporaryScoring,
  hasFinishTimes: hasAnyFinishTimes,
  projectionInfo: useTemporaryScoring ? projectionInfo : null
};

// Frontend: Banner shows when finish times exist (regardless of temporary scoring)
const raceFinishedNotFinalized = hasFinishTimes && !gameState.resultsFinalized && standings.length > 0;
```

## Files Modified
1. **pages/api/standings.js**
   - Added `hasAnyFinishTimes` calculation
   - Added `hasFinishTimes` to API response (both GET and POST endpoints)
   - Added finish time check when using cached standings

2. **public/app.js**
   - Updated banner display logic to use `hasFinishTimes` instead of `!isTemporary`
   - Preserved all other behavior (live projections banner, etc.)

## Test Coverage
Created comprehensive test suite in `tests/banner-display.test.js` covering:

1. ✅ **All athletes with finish times** - Banner shows
2. ✅ **Some with finish times, some with splits** - Banner shows (this was the bug!)
3. ✅ **Only splits, no finish times** - Banner doesn't show
4. ✅ **Results finalized** - Banner doesn't show
5. ✅ **No results** - Banner doesn't show

All tests pass.

## Behavior Matrix

| Scenario | hasFinishTimes | isTemporary | resultsFinalized | Banner Shows? |
|----------|----------------|-------------|------------------|---------------|
| All finish times entered | ✅ | ❌ | ❌ | ✅ YES |
| Some finish, some splits | ✅ | ✅ | ❌ | ✅ YES (fixed!) |
| Only splits | ❌ | ✅ | ❌ | ❌ NO |
| Results finalized | ✅ | ❌ | ✅ | ❌ NO |
| No results | ❌ | ❌ | ❌ | ❌ NO |

## UI Impact
When the banner displays, users will see:
- **Icon**: ⏳ (hourglass)
- **Title**: "Race Finished - Results Being Manually Reviewed"
- **Detail**: "This could take a while. Check back tomorrow for final official results."
- **Styling**: Orange/amber gradient background (distinct from blue live projections banner)

## Backward Compatibility
✅ Fully backward compatible
- Existing temporary scoring logic unchanged
- Live projections banner unchanged
- No breaking changes to API contract
- New field is optional (defaults to false)
