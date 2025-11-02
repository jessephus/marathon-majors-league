# Temporary Scoring Feature

## Overview

The Temporary Scoring feature provides live leaderboard updates during an in-progress marathon race by calculating projected scores based on split times. This keeps players engaged and competitive even before final results are available.

## How It Works

### Automatic Detection

The system automatically switches to temporary scoring when all three conditions are met:

1. **Results exist**: At least one athlete has race data in the database
2. **Race not finalized**: The `results_finalized` flag is `false` in the game state
3. **Splits without finish**: Some athletes have split times but no finish times

### Projection Algorithm

#### Step 1: Identify Most Recent Split

For each athlete, the system finds the most recent (furthest) split time in this priority order:

- 40k split (most accurate, closest to finish)
- 35k split
- 30k split
- Half marathon split
- 10k split
- 5k split (least accurate, early in race)

#### Step 2: Calculate Current Pace

```javascript
currentPace = splitTimeMs / splitDistanceKm
// Example: 1:02:30 half marathon = 3750 seconds / 21.0975 km = 177.7 sec/km
```

#### Step 3: Apply Fatigue Factor

The system applies a fatigue factor based on how far into the race the split was taken:

| Split | Progress | Fatigue Factor | Reasoning |
|-------|----------|----------------|-----------|
| 40k | 94.8% | 1.01x | Very close to finish, minimal slowdown expected |
| 35k | 83.0% | 1.02x | Slight slowdown in final miles |
| 30k | 71.1% | 1.04x | More significant slowdown expected |
| Half | 50.0% | 1.06x | Substantial slowdown typical in second half |
| 10k | 23.7% | 1.08x | Very early, rough projection |
| 5k | 11.9% | 1.08x | Very early, rough projection |

#### Step 4: Project Finish Time

```javascript
remainingDistance = 42.195 km - splitDistanceKm
projectedRemainingTime = remainingDistance × currentPace × fatigueFactor
projectedFinishTime = splitTime + projectedRemainingTime
```

#### Step 5: Assign Temporary Placements

Athletes are ranked by projected finish time within their gender, with standard competition ranking (ties get same place number).

#### Step 6: Calculate Temporary Points

Temporary scoring uses a simplified point system based on placement only:

- 1st place: 10 points
- 2nd place: 9 points
- 3rd place: 8 points
- ...
- 10th place: 1 point
- 11th+ place: 0 points

**Note**: Temporary scores do NOT include time gap bonuses, performance bonuses, or record bonuses. These complex calculations require final finish times and are only computed when the race is complete.

### Transition to Final Scores

When final finish times become available, the system automatically:

1. Detects that finish times are now present
2. Switches from temporary to final scoring
3. Calculates full points including all bonuses
4. Removes the "Live Projections" banner
5. Displays final standings

No manual intervention is required.

## User Interface

### Live Projections Banner

When temporary scoring is active, a prominent blue banner appears at the top of the leaderboard:

```
⚡ Live Projections
Based on HALF MARATHON times • Scores will update as race progresses
```

The banner includes:
- **Pulsing lightning bolt icon**: Indicates live/updating status
- **"Live Projections" heading**: Clear indication these are not final scores
- **Split information**: Shows which split is being used for calculations
- **Update notice**: Reminds users scores will change

### Auto-Refresh

During temporary scoring, the leaderboard automatically refreshes every 30 seconds to pull the latest split data and recalculate projections.

Auto-refresh stops when:
- Race is finalized and final scores are displayed
- User navigates away from leaderboard page

## API Changes

### GET /api/standings

**New Response Fields:**

```json
{
  "gameId": "default",
  "standings": [...],
  "hasResults": true,
  "cached": false,
  "isTemporary": true,
  "projectionInfo": {
    "mostCommonSplit": "half",
    "splitCounts": {
      "half": 12,
      "40k": 3,
      "30k": 1
    },
    "totalWithProjections": 16
  }
}
```

- `isTemporary` (boolean): Indicates if standings are based on projections
- `projectionInfo` (object): Details about which splits are being used
  - `mostCommonSplit` (string): The split most athletes are using
  - `splitCounts` (object): Breakdown of which splits are in use
  - `totalWithProjections` (number): Number of athletes with projections

### Cache Behavior

**Temporary Scores:**
- Client cache: 10 seconds (maxAge)
- CDN cache: 20 seconds (sMaxAge)
- Stale while revalidate: 60 seconds
- Database cache: DISABLED (changes too frequently)

**Final Scores:**
- Client cache: 30 seconds (maxAge)
- CDN cache: 60 seconds (sMaxAge)
- Stale while revalidate: 300 seconds
- Database cache: ENABLED

## Technical Implementation

### Module: `pages/api/lib/temporary-scoring.js`

**Exported Functions:**

#### `calculateTemporaryScores(results)`
Main function to calculate temporary scores for all results.

**Parameters:**
- `results` (array): Race results with split times

**Returns:**
```javascript
[
  {
    athlete_id: 1,
    gender: 'men',
    projected_finish_ms: 7650000,
    projected_finish_time: '2:07:30',
    projected_placement: 1,
    temporary_points: 10,
    projection_source: 'half',
    is_temporary: true,
    // ... other result fields
  }
]
```

#### `hasTemporaryScores(results)`
Check if any results have temporary scores.

**Returns:** `boolean`

#### `getProjectionSummary(results)`
Get summary of which splits are being used.

**Returns:**
```javascript
{
  mostCommonSplit: 'half',
  splitCounts: { half: 12, '40k': 3 },
  totalWithProjections: 15
}
```

### Modified Files

1. **`pages/api/standings.js`**
   - Updated `calculateStandings()` to detect and use temporary scoring
   - Added support for new return format with metadata
   - Adjusted cache TTLs based on temporary vs final scoring

2. **`public/app.js`**
   - Updated `displayLeaderboard()` to show temporary banner
   - Added `setupLeaderboardAutoRefresh()` for 30-second polling
   - Banner displays split information from API response

3. **`public/style.css`**
   - Added `.temporary-scores-banner` styling
   - Added animations for banner appearance
   - Added pulsing animation for icon

## Accuracy Considerations

### When Projections Are Most Accurate

- **40k split**: Very accurate (within 1-2 minutes typically)
- **35k split**: Quite accurate (within 2-3 minutes)
- **30k split**: Reasonably accurate (within 3-5 minutes)
- **Half split**: Moderately accurate (within 5-8 minutes)

### When Projections Are Less Accurate

- **10k/5k splits**: Less accurate due to:
  - Longer remaining distance
  - More opportunity for pace changes
  - Larger impact of fatigue variability
  - Possible strategic racing (starting conservative)

### Factors That Affect Accuracy

1. **Weather changes**: Wind, temperature shifts during race
2. **Course elevation**: Hills in second half affect pace differently
3. **Individual pacing strategy**: Some runners negative split, others fade
4. **Tactical racing**: Races with packs and surges are harder to predict
5. **Hydration/fueling issues**: Unpredictable individual factors

## Example Scenarios

### Scenario 1: Half Marathon Splits Available

```
Athlete A: Half split 1:02:30
Athlete B: Half split 1:03:00
Athlete C: Half split 1:02:45

Projected finish times:
A: 2:12:39 (pace: 177.7 sec/km × 1.06 fatigue factor)
C: 2:13:17
B: 2:13:42

Temporary standings:
1st: Athlete A - 10 points
2nd: Athlete C - 9 points  
3rd: Athlete B - 8 points
```

### Scenario 2: Mixed Splits

```
Athlete A: 40k split 1:56:00 (uses 40k, fatigue factor 1.01)
Athlete B: Half split 1:03:00 (uses half, fatigue factor 1.06)
Athlete C: 30k split 1:27:00 (uses 30k, fatigue factor 1.04)

Each athlete's projection uses their most recent split with 
appropriate fatigue factor for that point in the race.
```

## Testing

Run the test suite:

```bash
node tests/temporary-scoring.test.js
```

Tests verify:
- Temporary score calculation
- Split detection and selection
- Placement assignment  
- Points calculation
- Gender separation
- Summary generation

## Future Enhancements

Possible improvements:

1. **Historical pace data**: Use athlete's typical race patterns
2. **Course-specific factors**: Adjust for known course characteristics
3. **Weather integration**: Real-time adjustments for conditions
4. **Confidence intervals**: Show range of likely finish times
5. **Manual refresh button**: Let users refresh on demand
6. **Projection accuracy tracking**: Learn from actual vs projected over time

## Troubleshooting

### Banner not appearing

**Check:**
1. Are splits entered in database? (`split_half`, `split_40k`, etc.)
2. Are finish times null? (Should be null for temporary scoring)
3. Is `results_finalized` false in games table?
4. Check browser console for JavaScript errors

### Projections seem inaccurate

**Possible causes:**
1. Using early splits (5k/10k) - inherently less accurate
2. Athlete pacing strategy changed mid-race
3. Course has elevation changes in second half
4. Weather conditions changed during race

Remember: Temporary scores are **projections**, not guarantees. They're meant to provide entertainment and engagement during the race, not definitive predictions.

### Leaderboard not auto-refreshing

**Check:**
1. Is user still on leaderboard page?
2. Are temporary scores active? (Auto-refresh only works with temporary scoring)
3. Check browser console for errors
4. Verify API endpoint is responding (check Network tab)

## Best Practices

### For Commissioners

1. **Enter splits progressively**: Enter 10k, then half, then 30k, etc. as they become available
2. **Don't finalize early**: Keep `results_finalized` false until all athletes have finished
3. **Monitor accuracy**: Check if projections align reasonably with actual results
4. **Communicate with players**: Let them know temporary scores are projections

### For Developers

1. **Test with varied data**: Mix of different splits, some with finish times, some without
2. **Consider edge cases**: DNF athletes, missing splits, ties
3. **Monitor performance**: Auto-refresh creates regular API calls
4. **Cache appropriately**: Temporary scores change frequently, don't over-cache

## Summary

The Temporary Scoring feature provides an engaging live leaderboard experience during marathon races by:

✅ Automatically detecting when to use split-based projections  
✅ Calculating reasonable finish time estimates with fatigue factors  
✅ Providing simplified scoring for quick updates  
✅ Displaying clear visual indicators that scores are temporary  
✅ Auto-refreshing to keep standings current  
✅ Seamlessly transitioning to final scores when race completes  

This keeps players engaged throughout the race without requiring any manual intervention from commissioners or developers.
