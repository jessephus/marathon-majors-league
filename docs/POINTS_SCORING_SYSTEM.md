# Points-Based Scoring System (Version 2)

## Overview

The Fantasy Marathon application now uses an advanced **points-based scoring system (Version 2)** that rewards both placement and performance quality. This system replaces the legacy "lowest combined time" approach with a comprehensive points algorithm.

## Key Features

### 🏆 Placement Points (Top 10)
Athletes earn points based on their finish position:
- 1st place: **10 points**
- 2nd place: **9 points**
- 3rd place: **8 points**
- ...continuing to...
- 10th place: **1 point**

**Tie Handling**: Athletes with identical finish times share the same placement using standard competition ranking (e.g., two runners tying for 2nd both get 9 points, and the next finisher is ranked 4th).

### ⏱️ Time Gap Bonuses
Additional points are awarded based on how close an athlete finishes to the winner:

| Time Behind Winner | Bonus Points |
|-------------------|--------------|
| ≤ 60 seconds | +5 points |
| ≤ 120 seconds (2 min) | +4 points |
| ≤ 180 seconds (3 min) | +3 points |
| ≤ 300 seconds (5 min) | +2 points |
| ≤ 600 seconds (10 min) | +1 point |

The system awards points for the first matching window (e.g., finishing 45 seconds behind = +5 points).

### 📈 Performance Bonuses

#### Negative Split (+2 points)
Awarded when an athlete runs the second half faster than the first half, demonstrating excellent pacing and finishing strength.

#### Even Pace (+1 point)
Awarded when the difference between first and second half times is within 0.5% of total time, showing consistent pacing throughout.

#### Fast Finish Kick (+1 point)
Awarded when the final 5km is run 3% faster than average pace, demonstrating strong closing speed.

**Note**: Multiple performance bonuses can stack unless explicitly excluded in the configuration.

### 🌎 Record Bonuses

#### World Record (WR)
- **+15 points** for setting a new marathon world record
- Badge: 🌎 WR (gold background)

#### Course Record (CR)
- **+5 points** for setting a new course record
- Badge: 🏆 CR (blue background)

**Mutual Exclusivity**: If both WR and CR are set in the same race, only the WR bonus is awarded (since a WR automatically breaks the CR).

#### Provisional Records
Records may be marked as "provisional" pending official confirmation:
- **Withhold Policy** (default): No points awarded until confirmed
- **Provisional Policy**: Points awarded immediately but may be revoked if rejected
- Provisional records show with a dashed border badge

## Scoring Calculation Flow

1. **Placement Assignment**: All finishers are ranked by finish time with tie handling
2. **Placement Points**: Points awarded based on position (top 10 only)
3. **Time Gap Calculation**: Gap to winner measured in seconds
4. **Time Gap Points**: Bonus points awarded based on gap windows
5. **Performance Bonuses**: Splits analyzed for negative split, even pace, and fast finish
6. **Record Detection**: Times compared against course and world records
7. **Total Calculation**: All points summed for final athlete score

## Points Breakdown Display

Each athlete's score includes a detailed breakdown showing:
- Placement position and points
- Time gap and bonus window
- Each performance bonus earned
- Record bonuses (with status indicator)
- **Total points** in bold

Users can click on any athlete's points to see the full breakdown in a modal popup.

## Leaderboard & Standings

The leaderboard displays team standings with:
- **Rank**: Position in the league (with tie handling)
- **Player**: Team name
- **Races**: Number of races with results
- **Wins**: First-place finishes
- **Top 3**: Podium finishes
- **WR/CR**: Count of confirmed records
- **Total Points**: Sum of all athlete points (bold, blue)
- **Avg**: Average points per athlete

Teams are sorted by total points (highest first). Ties share the same rank number.

## Configuration

All scoring parameters are stored in the `scoring_rules` table with versioning support. The default Version 2 configuration can be found in `migrations/002_points_scoring_system.sql`.

### Scoring Rules Structure
```json
{
  "placement_points": [10, 9, 8, 7, 6, 5, 4, 3, 2, 1],
  "max_scored_place": 10,
  "time_gap_windows": [...],
  "performance_bonuses": {
    "NegativeSplit": {"enabled": true, "points": 2},
    "EvenPace": {"enabled": true, "points": 1, "tolerance_ratio": 0.005},
    "FastFinishKick": {"enabled": true, "points": 1, "pace_improvement_ratio": 0.03}
  },
  "record_bonuses": {
    "CourseRecord": {"enabled": true, "points": 5},
    "WorldRecord": {"enabled": true, "points": 15}
  },
  "record_bonuses_mutually_exclusive": true,
  "record_requires_confirmation": true,
  "record_provisional_points_policy": "withhold"
}
```

## API Endpoints

### Calculate Scores
```
POST /api/scoring?gameId=<gameId>&action=calculate
Body: { "raceId": 1, "rulesVersion": 2 }
```

Runs the scoring algorithm for all results in a game.

### Get Scored Results
```
GET /api/scoring?gameId=<gameId>
```

Returns all results with scoring breakdown.

### Confirm Provisional Record
```
POST /api/scoring?gameId=<gameId>&action=confirm-record
Body: { "resultId": 123, "recordType": "WORLD" }
```

Confirms a provisional record and awards points.

### Reject Provisional Record
```
POST /api/scoring?gameId=<gameId>&action=reject-record
Body: { "resultId": 123, "recordType": "COURSE" }
```

Rejects a provisional record and removes any awarded points.

### Get Standings
```
GET /api/standings?gameId=<gameId>&cached=true
```

Returns calculated league standings. Use `cached=true` for faster response from cache.

### Recalculate Standings
```
POST /api/standings?gameId=<gameId>
```

Forces recalculation of standings and updates cache.

## Database Tables

### `race_results` (Enhanced)
Added columns for scoring:
- `placement` - Finish position with tie handling
- `placement_points` - Points from placement
- `time_gap_seconds` - Seconds behind winner
- `time_gap_points` - Time gap bonus points
- `performance_bonus_points` - Sum of performance bonuses
- `record_bonus_points` - Record bonus points
- `total_points` - Total points earned
- `points_version` - Scoring rules version used
- `breakdown` - JSONB with detailed breakdown
- `first_half_time_ms`, `second_half_time_ms`, `last_5k_time_ms` - Split data
- `record_type`, `record_status` - Record tracking

### `scoring_rules`
Stores versioned scoring configuration:
- `version` - Unique version number
- `rules` - JSONB configuration
- `created_at`, `created_by`, `description` - Metadata

### `league_standings`
Cached leaderboard data:
- `game_id`, `player_code` - Identification
- `races_count`, `wins`, `top3` - Stats
- `total_points`, `average_points` - Scoring
- `world_records`, `course_records` - Records count
- `last_updated_at` - Cache timestamp

### `records_audit`
Tracks record status changes:
- `race_result_id` - Result reference
- `record_type` - COURSE or WORLD
- `status_before`, `status_after` - Status change
- `points_delta` - Points change
- `changed_by`, `changed_at` - Audit trail

### `race_records`
Reference data for course and world records:
- `race_id`, `gender`, `record_type` - Key
- `time_ms` - Record time in milliseconds
- `athlete_name`, `set_date` - Record details
- `verified` - Confirmation status

## Migration

The scoring system is implemented via database migration `002_points_scoring_system.sql`. To apply:

1. **Via Neon Console**: Run the SQL script in the SQL Editor
2. **Via psql**: `psql $DATABASE_URL -f migrations/002_points_scoring_system.sql`
3. **Automatic**: The system will attempt to apply on first access

### Backward Compatibility

The system maintains backward compatibility:
- Legacy time-based results are preserved
- Frontend falls back to time-based display if scoring data unavailable
- Existing results can be rescored using the new system

## Usage Examples

### Commissioner Workflow

1. **Enter Results**: Enter athlete finish times as usual
2. **Auto-Scoring**: System automatically calculates points when results are saved
3. **View Standings**: Updated leaderboard shows points-based rankings
4. **Detailed Breakdowns**: Click any athlete's points to see breakdown
5. **Record Management**: Confirm or reject provisional records if any appear

### Player Experience

1. **View Teams**: See your team with updated points display
2. **Check Rankings**: Real-time leaderboard with points totals
3. **Explore Breakdowns**: Click athlete points to understand scoring
4. **Track Records**: See WR/CR badges on record-setting performances

## Performance Considerations

- **Incremental Updates**: Standings update incrementally, not fully recalculated
- **Caching**: Leaderboard data is cached for fast access
- **Indexing**: Strategic indexes on scoring columns for query performance
- **Batch Processing**: Large recalculations use batching and pagination

## Future Enhancements

Potential additions being considered:
- **Team Scoring Variants**: Aggregate top N finishers
- **Course Difficulty Adjustments**: Terrain/weather multipliers
- **Age-Group Records**: Category-specific bonuses
- **Streak Bonuses**: Consecutive top finishes
- **Performance Index**: Normalized vs personal best

## Testing

See test scenarios in the codebase:
- Placement with ties
- Time gap window boundaries
- Performance bonus edge cases
- Record detection and confirmation
- Provisional record workflows
- Standings calculation accuracy

## Troubleshooting

### Scoring Not Appearing
- Check that migration has been applied
- Verify results have been entered
- Trigger manual scoring: `POST /api/scoring?action=calculate`

### Points Don't Match Expected
- Review breakdown JSON in database
- Check scoring rules version
- Verify split time data availability

### Standings Not Updating
- Force recalculation: `POST /api/standings`
- Check for database connection issues
- Clear browser cache

## Support

For issues or questions about the scoring system:
1. Check this documentation
2. Review the API endpoint responses
3. Examine breakdown JSON in database
4. Consult the migration script for configuration details

---

**Version 2 Scoring System** - Rewarding excellence in marathon fantasy competition! 🏃‍♂️🏆
