# Athlete Management Fix - Confirmed Only Filter

## Issue
The "Show only confirmed for NYC Marathon" checkbox in the Athlete Management page was not working. It always showed only the 58 confirmed athletes regardless of whether the checkbox was checked or unchecked.

## Root Cause
The `/api/athletes` endpoint was calling `getAllAthletes()` which had race filtering hardcoded with an `INNER JOIN`, always excluding athletes not confirmed for active races.

## Solution

### 1. Updated `getAllAthletes()` in `api/db.js`
Added a `confirmedOnly` parameter (default: `false`) that controls the query logic:

**When `confirmedOnly = true`:**
- Uses `INNER JOIN` with `athlete_races` and `races` tables
- Only returns athletes confirmed for active races
- Returns 58 athletes (current confirmed count)

**When `confirmedOnly = false`:**
- Uses `LEFT JOIN` with `athlete_races` 
- Returns ALL athletes with a `nycConfirmed` boolean field
- Returns 90 athletes (total in database)
- Each athlete has `nycConfirmed: true/false` based on presence in `athlete_races`

### 2. Updated `/api/athletes` endpoint
- Accepts `?confirmedOnly=true/false` query parameter
- Defaults to `true` for backward compatibility (game pages expect only confirmed athletes)
- Passes parameter to `getAllAthletes(confirmedOnly)`

### 3. Updated Frontend `handleViewAthletes()` in `app.js`
- Reads checkbox state: `const confirmedOnly = document.getElementById('filter-confirmed').checked`
- Passes to API: ``fetch(`${API_BASE}/api/athletes?confirmedOnly=${confirmedOnly}`)``
- Updated table to show actual confirmation status: `${athlete.nycConfirmed ? '✓ Yes' : '✗ No'}`

## Testing Results

### Database Verification
```
✓ Confirmed athletes (INNER JOIN): 58
📊 Total athletes in database: 90
📈 Not confirmed: 32

Sample of unconfirmed athletes:
  ID 158: Brigid KOSGEI (women) - NYC: ✗ No
  ID 157: Mestawut FIKIR (women) - NYC: ✗ No
  ID 156: Tigist KETEMA (women) - NYC: ✗ No
  ID 155: Haven Hailu DESSE (women) - NYC: ✗ No
```

### Expected Behavior
1. **Checkbox CHECKED** (default): Shows 58 confirmed athletes
2. **Checkbox UNCHECKED**: Shows all 90 athletes with confirmation status column showing ✓ Yes or ✗ No

### Backward Compatibility
✅ Game pages (ranking, draft, results) still work correctly
- They don't pass the `confirmedOnly` parameter
- API defaults to `true`, returning only confirmed athletes
- No changes needed to existing game functionality

## Files Modified
1. `api/db.js` - Added `confirmedOnly` parameter to `getAllAthletes()`
2. `api/athletes.js` - Added query parameter handling
3. `app.js` - Updated `handleViewAthletes()` to pass checkbox state and display confirmation status

## Impact
- ✅ Athlete Management page now shows filtering working correctly
- ✅ Commissioner can view all 90 athletes or just the 58 confirmed ones
- ✅ Confirmation status clearly indicated with ✓ Yes / ✗ No
- ✅ No impact on game functionality (ranking, draft, results)
- ✅ Maintains proper data isolation between confirmed and unconfirmed athletes

## Date
October 18, 2025
