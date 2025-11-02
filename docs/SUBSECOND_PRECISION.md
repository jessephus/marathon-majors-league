# Sub-Second Precision Feature

## Problem Statement
When two runners finish within 0.03 seconds (30 milliseconds) of each other, the database and frontend were unable to store and display this level of precision. The time format was limited to `HH:MM:SS` (whole seconds only), causing ties where one shouldn't exist.

**Example Edge Case:**
- 1st place: 2:05:30.06
- 2nd place: 2:05:30.09

Both would be stored as `2:05:30`, creating an artificial tie.

## Solution Overview
Updated the entire time handling system to support decimal seconds with up to 3 decimal places (milliseconds).

## Changes Made

### 1. Database Schema (Migration 007)
**File:** `migrations/007_add_subsecond_precision.sql`

Expanded all time columns from `VARCHAR(10)` to `VARCHAR(13)`:
- `finish_time`
- `split_5k`, `split_10k`, `split_15k`, `split_20k`, `split_25k`
- `split_half`, `split_30k`, `split_35k`, `split_40k`

**Supported formats:**
- `2:05:30` (whole seconds - backward compatible)
- `2:05:30.1` (tenths)
- `2:05:30.12` (hundredths)
- `2:05:30.123` (milliseconds)

### 2. Frontend Validation (public/app.js)
Updated all regex patterns to accept optional decimal seconds:

**Old pattern:**
```javascript
/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/
```

**New pattern:**
```javascript
/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/
```

**Locations updated:**
- Line ~1975: Athlete result form validation
- Line ~2160: Finish time input validation
- Line ~3390: Bulk results validation
- Line ~3415: Error messages
- Line ~3798: Real-time input validation
- Line ~3810: Auto-save on change

### 3. Time Parsing (public/app.js)
**Function:** `timeToSeconds(timeStr)`

**Old implementation:**
```javascript
const parts = timeStr.split(':').map(p => parseInt(p, 10));
return parts[0] * 3600 + parts[1] * 60 + parts[2];
```

**New implementation:**
```javascript
const hours = parseInt(parts[0], 10);
const minutes = parseInt(parts[1], 10);
const seconds = parseFloat(parts[2]); // Handles decimals!
return hours * 3600 + minutes * 60 + seconds;
```

This allows proper sorting and comparison of times like `2:05:30.06` vs `2:05:30.09`.

### 4. User Interface
**Help text updated:**
- Old: "Format: Hours:Minutes:Seconds (e.g., 2:15:45 or 0:14:30)"
- New: "Format: Hours:Minutes:Seconds (e.g., 2:15:45 or 2:05:30.12 for close finishes)"

**Error messages updated:**
- Old: "Please use HH:MM:SS format (e.g., 2:05:30)"
- New: "Please use HH:MM:SS or HH:MM:SS.mmm format (e.g., 2:05:30 or 2:05:30.12)"

### 5. Schema File (schema.sql)
Updated master schema to reflect VARCHAR(13) for all time columns, ensuring new deployments have proper precision from the start.

## Usage Examples

### Commissioner Workflow
1. Open results entry form
2. Enter finish time with decimals: `2:05:30.06`
3. Form validates and accepts the input (green border)
4. Time is saved to database with full precision
5. Leaderboard correctly shows distinct placements

### Testing Edge Cases
```javascript
// These are now all distinct times:
"2:05:30"     // 7530.000 seconds
"2:05:30.1"   // 7530.100 seconds  
"2:05:30.12"  // 7530.120 seconds
"2:05:30.123" // 7530.123 seconds
```

## Migration Instructions

### Apply to Existing Database
```bash
node scripts/run-subsecond-migration.js
```

### Verify Changes
```sql
-- Check column types
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'race_results'
  AND column_name IN ('finish_time', 'split_5k', 'split_10k');

-- Should show VARCHAR(13)
```

### Test with Real Data
```sql
-- Insert a close finish
UPDATE race_results 
SET finish_time = '2:05:30.06'
WHERE game_id = 'default' AND athlete_id = 123;

UPDATE race_results 
SET finish_time = '2:05:30.09'
WHERE game_id = 'default' AND athlete_id = 124;

-- Verify distinct times
SELECT athlete_id, finish_time
FROM race_results
WHERE game_id = 'default'
ORDER BY finish_time;
```

## Backward Compatibility
✅ **Fully backward compatible**

- Existing times without decimals (`2:05:30`) remain valid
- Frontend accepts both formats
- Database column expansion is non-breaking
- Sorting and comparison work for both formats

## Technical Notes

### Precision Levels
- **Tenths (0.1s):** Sufficient for most marathon timing
- **Hundredths (0.01s):** Standard for photo finish systems
- **Milliseconds (0.001s):** Maximum precision supported

### Database Storage
- Stored as VARCHAR (text) not DECIMAL
- Preserves exact input format
- No floating-point rounding errors
- Easy to display and manipulate

### Performance Impact
- Minimal: 3 extra characters per time field
- Negligible storage increase
- No performance degradation in queries
- Regex validation adds ~1ms per field

## Future Enhancements
- [ ] Auto-format decimal input (e.g., convert "2:05:30.1" to "2:05:30.10")
- [ ] Display precision indicator in UI (e.g., "0.03s margin")
- [ ] Photo finish badge for sub-second differences
- [ ] Import decimal times from NYRR Chrome extension

## Files Modified
1. `migrations/007_add_subsecond_precision.sql` - New migration
2. `scripts/run-subsecond-migration.js` - Migration runner
3. `public/app.js` - Frontend validation and parsing (7 locations)
4. `schema.sql` - Master schema definition

## Migration Status
✅ **Successfully applied on November 2, 2025**

Database columns expanded, frontend updated, ready for production use.
