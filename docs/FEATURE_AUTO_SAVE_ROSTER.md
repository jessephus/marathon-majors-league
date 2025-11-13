# Auto-Save Feature for Salary Cap Draft

## Overview

The auto-save feature automatically saves partial team rosters to prevent data loss when users navigate away before completing their team selection.

## User Experience

### For New Teams (No Complete Roster Submitted)

When a user is building their team for the first time:

1. **Automatic Saving**: Every time they select or remove an athlete, the roster auto-saves to the database after a 1-second delay
2. **Seamless Experience**: No visible indicators - happens silently in the background
3. **Data Persistence**: If the user closes their browser or navigates away, their partial selections are preserved
4. **Return Visit**: When they return using their session URL, their partial roster loads automatically

### For Editing Submitted Teams

When a user has already submitted a complete team and returns to edit:

1. **No Auto-Save**: Changes are NOT automatically saved
2. **Explicit Submit**: User must click "Submit Team" to save any modifications
3. **Safety**: Prevents accidental overwrites of carefully constructed rosters

### For Locked Rosters

After the race starts (roster lock time):

1. **Read-Only**: Auto-save is disabled (roster cannot be modified)
2. **View Only**: Users can view their team but cannot make changes

## Technical Implementation

### Database Schema

Added `is_complete` column to `salary_cap_teams` table:

```sql
ALTER TABLE salary_cap_teams 
ADD COLUMN is_complete BOOLEAN DEFAULT FALSE;
```

- `is_complete = FALSE`: Auto-saved partial roster (in progress)
- `is_complete = TRUE`: Fully submitted complete roster (3 men + 3 women)

### API Endpoints

#### POST `/api/teams/partial-save`

Auto-saves partial rosters without marking them as complete.

**Request:**
```json
{
  "roster": [
    { "slotId": "M1", "athleteId": 123, "salary": 5000 },
    { "slotId": "M2", "athleteId": null, "salary": null },
    ...
  ]
}
```

**Response:**
```json
{
  "message": "Partial roster auto-saved",
  "athleteCount": 2,
  "totalSpent": 11000,
  "autoSaveEnabled": true
}
```

**Behavior:**
- Accepts incomplete rosters (any number of athletes)
- Sets `is_complete = FALSE` in database
- Rejects if roster already marked as complete (returns `autoSaveEnabled: false`)
- Requires valid session token for authentication

#### POST `/api/salary-cap-draft` (Updated)

Submits complete rosters (unchanged from user perspective).

**Changes:**
- Sets `is_complete = TRUE` when team is submitted
- Deletes any previous auto-saved partial rosters for the same player

### Frontend Implementation

#### Component: `pages/team/[session].tsx`

**Auto-Save Logic:**

```typescript
// Auto-save function
const autoSaveRoster = useCallback(async (currentRoster) => {
  // Don't auto-save if:
  // 1. Team has already been submitted (hasSubmittedRoster is true)
  // 2. User is editing an already submitted roster (isEditingRoster is true)
  // 3. Roster is locked
  // 4. No session token
  if (hasSubmittedRoster || isEditingRoster || locked || !sessionToken) {
    return;
  }

  // POST to /api/teams/partial-save
  // ...
}, [hasSubmittedRoster, isEditingRoster, locked, sessionToken]);

// Trigger auto-save when roster changes (debounced)
useEffect(() => {
  // Skip on initial mount
  if (isInitialMount.current) {
    isInitialMount.current = false;
    return;
  }

  // Debounce: wait 1 second after last change
  const timer = setTimeout(() => {
    autoSaveRoster(roster);
  }, 1000);

  return () => clearTimeout(timer);
}, [roster, autoSaveRoster]);
```

**Key Features:**
- Debounced by 1 second to avoid excessive API calls
- Uses `useRef` to prevent auto-save on initial page load
- Silently fails if auto-save encounters an error (convenience feature)

#### SSR Updates

Server-side rendering now:
- Fetches `isComplete` flag from database
- Loads both partial and complete rosters
- Passes `isRosterComplete` prop to component
- Component uses flag to determine if auto-save should be enabled

## Migration

### Migration Script: `011_add_is_complete_to_salary_cap_teams.sql`

```sql
-- Add is_complete column
ALTER TABLE salary_cap_teams 
ADD COLUMN IF NOT EXISTS is_complete BOOLEAN DEFAULT FALSE;

-- Mark all existing rosters as complete
-- (they were manually submitted before auto-save feature)
UPDATE salary_cap_teams sct1
SET is_complete = TRUE
WHERE (
  SELECT COUNT(*)
  FROM salary_cap_teams sct2
  WHERE sct2.game_id = sct1.game_id 
    AND sct2.player_code = sct1.player_code
) = 6;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_salary_cap_teams_is_complete 
ON salary_cap_teams(game_id, player_code, is_complete);
```

**Important:** Existing rosters with 6 athletes are marked as complete to maintain backward compatibility.

## Testing

### Unit Tests: `tests/auto-save-roster.test.js`

Test coverage includes:
- ✅ Partial roster auto-save endpoint validation
- ✅ Complete roster rejection (auto-save disabled)
- ✅ Request format validation
- ✅ HTTP method validation (POST only)
- ✅ Authentication requirement
- ✅ Database migration verification

### Manual Testing Checklist

- [ ] Create new team → select athletes → close browser → return via session URL → verify selections persisted
- [ ] Submit complete team → return to edit → make changes without submitting → verify changes NOT saved
- [ ] Submit complete team → return to edit → make changes and submit → verify changes saved
- [ ] After roster lock time → verify cannot make changes
- [ ] Multiple athlete selections in quick succession → verify only one auto-save after debounce

## Error Handling

### Auto-Save Failures

Auto-save failures are handled gracefully:
- Console error logged for debugging
- No user-facing error message (silent fail)
- Does not interrupt user's team building experience
- User can still manually submit via "Submit Team" button

### Session Expiration

If session expires during auto-save:
- API returns 401 error with `sessionExpired: true`
- Frontend logs error to console
- User must create new session to continue

## Performance Considerations

### Debouncing

- 1-second debounce reduces API calls significantly
- Example: 5 rapid selections = 1 API call instead of 5

### Database Efficiency

- Index on `(game_id, player_code, is_complete)` for fast lookups
- Partial saves use `DELETE + INSERT` pattern (no orphaned records)

### SSR Optimization

- Only fetches athlete details for existing roster slots
- Empty rosters skip athlete fetch (client loads on demand)

## Future Enhancements

Potential improvements:
- Visual indicator when auto-save completes (small toast notification)
- "Undo" functionality to revert recent changes
- Conflict resolution if multiple devices edit simultaneously
- Export/import roster functionality
