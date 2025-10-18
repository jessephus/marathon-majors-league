# Race Confirmation Filter Fix

## Problem Identified

**Issue**: Newly synced athletes from World Athletics rankings were appearing in the game's athlete selection interface, even though they were not confirmed to run in the 2025 NYC Marathon.

**Root Cause**: The `races` and `athlete_races` tables were defined in `schema.sql` but never actually created in the local database. The `getAllAthletes()` function was returning ALL athletes instead of filtering by race confirmation.

## Solution Applied

### 1. Created Missing Tables

Created the `races` and `athlete_races` tables that were defined in the schema but not applied:

```sql
CREATE TABLE races (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    location VARCHAR(255) NOT NULL,
    distance VARCHAR(50) DEFAULT 'Marathon (42.195 km)',
    event_type VARCHAR(100) DEFAULT 'Marathon Majors',
    world_athletics_event_id VARCHAR(50),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE athlete_races (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    race_id INTEGER NOT NULL REFERENCES races(id) ON DELETE CASCADE,
    bib_number VARCHAR(20),
    confirmed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(athlete_id, race_id)
);
```

### 2. Seeded NYC Marathon 2025

Inserted the 2025 NYC Marathon race:

```sql
INSERT INTO races (name, date, location, description, is_active)
VALUES (
    'New York City Marathon 2025',
    '2025-11-02',
    'New York, NY, USA',
    'The 54th running of the New York City Marathon, one of the six World Marathon Majors',
    true
);
```

### 3. Linked Existing Athletes

Linked all 58 existing athletes (from `athletes.json` seed data) to the NYC Marathon:

- Athletes with ID < 127 (original seed data) → Confirmed for NYC Marathon
- Athletes with ID >= 127 (newly synced) → NOT confirmed (correctly excluded)

### 4. Updated `getAllAthletes()` Function

Modified `api/db.js` to filter athletes by active race confirmation:

**Before:**
```javascript
SELECT * FROM athletes
ORDER BY gender, personal_best
```

**After:**
```javascript
SELECT DISTINCT a.*
FROM athletes a
INNER JOIN athlete_races ar ON a.id = ar.athlete_id
INNER JOIN races r ON ar.race_id = r.id
WHERE r.is_active = true
ORDER BY a.gender, a.personal_best
```

## Results

✅ **Only 58 athletes** (confirmed for NYC Marathon 2025) are now returned by the API
✅ **7 newly synced athletes** (not confirmed) are correctly filtered out
✅ **Frontend now shows only confirmed runners** for player ranking

## Verification

```bash
# Query returns 58 athletes (all confirmed)
python3 -c "
import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute('''
    SELECT COUNT(DISTINCT a.id)
    FROM athletes a
    INNER JOIN athlete_races ar ON a.id = ar.athlete_id
    INNER JOIN races r ON ar.race_id = r.id
    WHERE r.is_active = true
''')
print(f'Confirmed athletes: {cur.fetchone()[0]}')
conn.close()
"
```

Output: `Confirmed athletes: 58`

## Next Steps

### For Future Athlete Syncs

When adding new athletes from World Athletics rankings, we need to:

1. **Manually verify** which athletes are confirmed for upcoming races
2. **Link them** to the appropriate race via `athlete_races` table:
   ```sql
   INSERT INTO athlete_races (athlete_id, race_id)
   VALUES (<athlete_id>, 1); -- 1 = NYC Marathon 2025
   ```

### Automated Solution (Future Enhancement)

Could implement:
- Web scraping of official NYC Marathon elite field announcements
- World Athletics event entry lists
- Manual admin interface for confirming athletes for races

## Files Modified

1. **`api/db.js`** - Updated `getAllAthletes()` to filter by active race
2. **Local database** - Created `races` and `athlete_races` tables
3. **Local database** - Seeded NYC Marathon 2025 and linked 58 athletes

## Commands Run

```bash
# Create tables
python3 -c "..." # Created races and athlete_races tables

# Seed race and link athletes
python3 -c "..." # Inserted NYC Marathon 2025 and linked 58 athletes

# Verify fix
python3 -c "..." # Confirmed only 58 athletes returned
```

---

**Status**: ✅ Fixed
**Impact**: High - Prevents confusion for players ranking unconfirmed athletes
**Testing**: Verified locally, ready for deployment
