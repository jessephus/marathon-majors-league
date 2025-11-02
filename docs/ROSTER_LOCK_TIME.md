# Roster Lock Time Feature

## Overview

The roster lock time feature allows commissioners to set a deadline after which roster edits are permanently locked. This prevents team changes after a certain time, ensuring fairness when the race or event begins.

## How It Works

### Database Schema

A `roster_lock_time` column was added to the `games` table:

```sql
ALTER TABLE games 
ADD COLUMN roster_lock_time TIMESTAMP WITH TIME ZONE;
```

### Default Configuration

For the **default game**, the roster lock time is set to:
- **Date**: November 2, 2025
- **Time**: 8:35 AM EST (13:35 UTC)

This is configured via the migration script `migrations/005_roster_lock_time.sql`.

### Behavior

1. **Before Lock Time**: Users can edit their rosters normally via the salary cap draft interface
2. **After Lock Time**: 
   - The roster becomes permanently locked (similar to when race results are entered)
   - All edit buttons are hidden
   - Users can view their roster but cannot make changes
   - A notice is displayed showing the lock time

### UI Indicators

The salary cap draft page displays:
- **Before lock**: "⏰ Roster Lock: Rosters will lock at [date/time]" (orange background)
- **After lock**: "⏰ Roster Lock: Rosters locked as of [date/time]" (red background)

## Running the Migration

To apply the roster lock time migration to your database:

```bash
node scripts/run-roster-lock-migration.js
```

This will:
1. Add the `roster_lock_time` column to the `games` table
2. Set the lock time for the 'default' game to 8:35 AM EST on November 2, 2025
3. Verify the migration was successful

## API Changes

### GET /api/game-state

**Response now includes**:
```json
{
  "players": [...],
  "draftComplete": false,
  "resultsFinalized": false,
  "rosterLockTime": "2025-11-02T13:35:00.000Z",
  "rankings": {...},
  "teams": {...},
  "results": {...}
}
```

### POST /api/game-state

**Request body can now include**:
```json
{
  "players": [...],
  "draftComplete": false,
  "resultsFinalized": false,
  "rosterLockTime": "2025-11-02T13:35:00.000Z"
}
```

## Frontend Changes

### salary-cap-draft.js

The salary cap draft initialization now:
1. Fetches the game state to get `rosterLockTime`
2. Compares current time with lock time
3. Sets `salaryCapState.permanentlyLocked = true` if current time >= lock time
4. Displays a notice showing when rosters will lock (or are locked)

### app.js

The global `gameState` object now includes:
```javascript
gameState = {
  // ... existing fields
  rosterLockTime: null  // ISO timestamp or null
}
```

## Customization

To set a different lock time for a game:

```sql
UPDATE games 
SET roster_lock_time = '2025-11-03 09:00:00+00'::timestamptz
WHERE game_id = 'your-game-id';
```

Or via the API:

```javascript
await fetch('/api/game-state?gameId=your-game-id', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    rosterLockTime: '2025-11-03T09:00:00.000Z'
  })
});
```

## Time Zone Considerations

- The database stores times in UTC with timezone information (`TIMESTAMP WITH TIME ZONE`)
- The frontend displays times in the user's local timezone
- EST (Eastern Standard Time) is UTC-5
- EDT (Eastern Daylight Time) is UTC-4
- November 2, 2025 falls under EST (before daylight saving ends)

## Testing

To test the roster lock time behavior:

1. Set a lock time in the near future:
```sql
UPDATE games 
SET roster_lock_time = NOW() + INTERVAL '5 minutes'
WHERE game_id = 'default';
```

2. Visit the salary cap draft page and observe:
   - Before lock time: Notice shows countdown
   - After lock time: Roster becomes locked, edit buttons disappear

## Troubleshooting

### Lock Time Not Appearing

Check that:
1. The migration has been run successfully
2. The game exists in the database
3. The `roster_lock_time` column has a value

```sql
SELECT game_id, roster_lock_time FROM games WHERE game_id = 'default';
```

### Lock Not Working

Check browser console for:
- Game state fetch errors
- Time comparison logic
- Verify `salaryCapState.permanentlyLocked` is being set

## Related Files

- `migrations/005_roster_lock_time.sql` - Database migration
- `scripts/run-roster-lock-migration.js` - Migration runner
- `pages/api/db.js` - Database query updates
- `pages/api/game-state.js` - API endpoint updates
- `public/salary-cap-draft.js` - Frontend lock logic
- `public/app.js` - Global state management
- `pages/index.js` - UI elements
- `public/style.css` - Styling for lock notice
