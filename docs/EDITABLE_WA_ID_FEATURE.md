# Editable World Athletics ID Feature

## Problem Statement

The sync script's "dropped athlete" feature searches for athletes who have fallen out of the top 100 rankings but are still in the database. However, this search **requires the athlete to have a World Athletics ID** to identify them.

**Current Issue:**
- 10 athletes confirmed for NYC Marathon 2025 have **no World Athletics ID**
- If these athletes drop out of the top 100, the sync script cannot find them
- They become "orphaned" in the database with outdated data

## Solution

Added an **editable World Athletics ID column** in the Commissioner's Athlete Management page, allowing commissioners to:
1. View which athletes are missing World Athletics IDs
2. Add/edit the World Athletics ID for any athlete
3. Enable automatic tracking when athletes drop out of top 100

## Implementation

### 1. New API Endpoint: `/api/update-athlete`

**Method:** `PUT`

**Request Body:**
```json
{
  "athleteId": 31,
  "worldAthleticsId": "14208500"
}
```

**Response:**
```json
{
  "message": "World Athletics ID updated successfully",
  "athlete": {
    "id": 31,
    "name": "Charles Hicks",
    "worldAthleticsId": "14208500"
  }
}
```

**Features:**
- Updates `world_athletics_id` and `updated_at` timestamp
- Allows setting to null/empty to remove an ID
- Returns 404 if athlete not found
- Validates input and trims whitespace

### 2. Updated Athlete Management UI

**New Columns in Table:**
- **World Athletics ID**: Editable text input field
- **Actions**: Save button for each athlete

**New Features:**
- Input fields pre-populated with existing WA_ID (if any)
- Placeholder text: "Enter WA ID"
- Tooltip help text
- Save button per row
- Visual feedback (✓ Saved!, button color change)
- Confirmation prompt when removing an ID
- Info message explaining importance of WA_IDs

### 3. Frontend Changes (`app.js`)

**New Function:** `handleSaveWorldAthleticsId()`
- Validates input (allows empty to remove ID)
- Shows confirmation dialog when removing
- Displays loading state ("💾 Saving...")
- Shows success state ("✓ Saved!") for 2 seconds
- Error handling with user-friendly alerts

**Updated Function:** `handleViewAthletes()`
- Added World Athletics ID column to table
- Added Actions column with save buttons
- Added info message about WA_ID importance
- Attached event listeners to all save buttons

### 4. Styling (`style.css`)

New CSS classes:
- `.wa-id-input` - Styled text input (monospace font, 120px width)
- `.btn-small` - Compact button for table actions
- `.info-message` - Blue info box with icon
- Focus states for accessibility
- Hover effects for better UX

## Usage Instructions

### For Commissioners:

1. **Access Athlete Management:**
   - Enter Commissioner Mode (password: kipchoge)
   - Click "View All Athletes"
   - Uncheck "Show only confirmed for NYC Marathon" to see all athletes

2. **Find Athletes Without WA_ID:**
   - Look for empty input fields in "World Athletics ID" column
   - Currently **10 athletes** are missing IDs (all confirmed for NYC)

3. **Add a World Athletics ID:**
   - Enter the athlete's WA_ID in the input field
   - Click "💾 Save" button for that athlete
   - Wait for "✓ Saved!" confirmation
   - The ID is now saved in the database

4. **Find World Athletics IDs:**
   - Go to [World Athletics website](https://worldathletics.org/)
   - Search for the athlete by name
   - Copy the ID from their profile URL
   - Example: `https://worldathletics.org/athletes/united-states/charles-hicks-14208500` → ID is `14208500`

5. **Remove a World Athletics ID:**
   - Clear the input field
   - Click "💾 Save"
   - Confirm the removal when prompted

### For Sync Script:

Once World Athletics IDs are added:
- The `--sync-dropped` flag will be able to find these athletes
- If they fall out of top 100, script will search pages 3+ for them
- Their data will be kept up-to-date automatically

## Athletes Currently Missing WA_ID

All confirmed for NYC Marathon 2025:

| ID  | Name                        | Gender | Personal Best |
|-----|-----------------------------|--------|---------------|
| 31  | Charles Hicks               | Men    | Debut         |
| 33  | Charles Philibert-Thiboutot | Men    | Debut         |
| 15  | Emmanuel Levisse            | Men    | 2:07:41       |
| 29  | Hillary Bor                 | Men    | Debut         |
| 32  | Joe Klecker                 | Men    | Debut         |
| 19  | Jonny Mellor                | Men    | 2:09:09       |
| 30  | Patrick Dever               | Men    | Debut         |
| 125 | Amanda Vestri               | Women  | Debut         |
| 124 | Jessica Warner-Judd         | Women  | Debut         |
| 123 | Karoline Bjerkeli Grøvdal   | Women  | N/A           |

## Testing

### Manual Test:
1. Start local dev server: `vercel dev`
2. Enter Commissioner Mode
3. Navigate to Athlete Management
4. Find Charles Hicks (ID 31)
5. Enter WA_ID: `14208500` (if that's correct)
6. Click Save
7. Verify success message
8. Refresh page and confirm ID persists

### Database Verification:
```sql
SELECT id, name, world_athletics_id
FROM athletes
WHERE world_athletics_id IS NOT NULL
ORDER BY id;
```

## Benefits

✅ **Complete sync coverage** - All athletes can be tracked even after dropping from top 100  
✅ **Commissioner control** - Easy UI for managing athlete data  
✅ **No manual SQL** - Everything through web interface  
✅ **Validation** - Prevents invalid data entry  
✅ **Audit trail** - `updated_at` timestamp tracks changes  
✅ **Reversible** - Can remove IDs if entered incorrectly  

## Future Enhancements

Potential improvements:
- Bulk edit functionality for multiple athletes
- Auto-lookup WA_ID from World Athletics API
- Validation against World Athletics API to verify IDs
- Import WA_IDs from CSV file
- Show which athletes will benefit from having IDs added
- Track edit history for accountability

## Files Modified

1. **`api/update-athlete.js`** (NEW) - API endpoint for updating WA_ID
2. **`app.js`** - Added editable column and save functionality
3. **`style.css`** - Styling for inputs, buttons, and info messages
4. **`api/db.js`** - Already includes worldAthleticsId in getAllAthletes()

## Related Documentation

- **`docs/DROPPED_ATHLETE_SYNC.md`** - How dropped athlete search works
- **`docs/SYNC_TOP_100.md`** - Main sync documentation
- **`scripts/sync_athletes_from_rankings.py`** - Sync script implementation

## Date
October 18, 2025
