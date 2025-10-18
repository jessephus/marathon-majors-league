# Scripts Directory

This directory contains scripts for collecting and managing athlete data from World Athletics.

## 📚 Quick Reference

### Testing the Backfill Script
```bash
# Dry run on 5 athletes (recommended first step!)
python3 scripts/backfill_athlete_progression.py --dry-run --limit 5

# Live run on 10 athletes
python3 scripts/backfill_athlete_progression.py --limit 10

# Full backfill (skips existing data)
python3 scripts/backfill_athlete_progression.py --skip-existing
```

### Common Commands
```bash
# Sync top 100 athletes with progression data
python3 scripts/sync_athletes_from_rankings.py

# Sync without progression (faster)
python3 scripts/sync_athletes_from_rankings.py --skip-progression

# Sync a single athlete
python3 scripts/sync_athletes_from_rankings.py --athlete-id 14593938

# Extract single athlete to JSON
python3 scripts/extract_athlete_progression.py --athlete-id 14593938 --output data.json

# Legacy: Enrich athletes with World Athletics data
node scripts/enrich-athletes.js
```

---

## 📜 Scripts Overview

### 1. `sync_athletes_from_rankings.py` ⭐ Main Sync Script

**Purpose**: Syncs top 100 marathon athletes from World Athletics rankings to the database.

**Features**:
- Scrapes World Athletics marathon rankings (top 100 men and women)
- Fetches detailed athlete profiles (headshots, rankings, personal bests)
- **NEW**: Automatically fetches progression data (year-by-year season's bests)
- **NEW**: Automatically fetches 2025 race results
- Smart change detection (only updates changed records)
- Supports syncing dropped athletes (those who fell out of top 100)

**Usage**:
```bash
# Full sync with progression data
python3 scripts/sync_athletes_from_rankings.py

# Dry run to see what would change
python3 scripts/sync_athletes_from_rankings.py --dry-run

# Limit to top 20 per gender
python3 scripts/sync_athletes_from_rankings.py --limit 20

# Skip progression data (faster)
python3 scripts/sync_athletes_from_rankings.py --skip-progression

# Sync a single athlete
python3 scripts/sync_athletes_from_rankings.py --athlete-id 14593938
```

**Command-Line Options**:
- `--dry-run` - Show what would be updated without making changes
- `--limit N` - Limit to top N athletes per gender (default: 100)
- `--skip-enrichment` - Skip fetching profile pages (faster but less data)
- `--skip-progression` - Skip fetching progression and race results data
- `--sync-dropped` - Also sync athletes who dropped out of top 100
- `--athlete-id ID` - Sync a single athlete by their World Athletics ID

---

### 2. `backfill_athlete_progression.py` 🔄 Bulk Historical Data

**Purpose**: Backfill progression data for all existing athletes in the database.

**Features**:
- Iterates through all athletes in database
- Fetches progression and 2025 race results for each
- Saves directly to database tables
- Polite rate limiting (default: 5 seconds between athletes)
- Resume capability (can start from specific athlete ID)
- Skip existing data option

**⚠️ TESTING FLAGS** (Use these first!):
- `--dry-run` - **Show what would happen without saving** (always test first!)
- `--limit N` - **Only process N athletes** (start with 5-10 for testing)
- `--start-from ID` - Resume from specific athlete database ID
- `--delay N` - Delay between athletes in seconds (default: 5)
- `--skip-existing` - Skip athletes that already have data

**Usage**:
```bash
# STEP 1: Dry run first to see what would happen
python3 scripts/backfill_athlete_progression.py --dry-run --limit 5

# STEP 2: Test with limited athletes
python3 scripts/backfill_athlete_progression.py --limit 10

# STEP 3: Skip athletes that already have data
python3 scripts/backfill_athlete_progression.py --skip-existing

# STEP 4: Full backfill (takes a long time!)
python3 scripts/backfill_athlete_progression.py

# Resume from a specific athlete
python3 scripts/backfill_athlete_progression.py --start-from 50

# Faster rate (use with caution!)
python3 scripts/backfill_athlete_progression.py --delay 3
```

**Example Output**:
```
Starting athlete progression backfill...
Fetching all athletes from database...
Found 58 athletes to process

Processing athlete 1/58: Eliud Kipchoge (ID: 14208194)
  ✓ Saved 8 progression records
  ✓ Saved 3 race results
  
Processing athlete 2/58: Kelvin Kiptum (ID: 15237184)
  ✓ Saved 5 progression records
  ✓ Saved 2 race results

BACKFILL COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total athletes processed: 58
Successful: 56
Failed: 2
Skipped (already have data): 0
Total progression records saved: 423
Total race results saved: 167
Total time: 5m 12s
```

---

### 3. `extract_athlete_progression.py` 📊 Standalone Extraction

**Purpose**: Extract progression and race results for a single athlete (can save to JSON or database).

**Features**:
- Fetches year-by-year progression data (all seasons)
- Fetches current year race results
- Can save to JSON file or directly to database
- Supports filtering by discipline (Marathon, Half Marathon, etc.)

**Usage**:
```bash
# Extract to JSON file
python3 scripts/extract_athlete_progression.py --athlete-id 14593938 --output data.json

# Extract with current year results
python3 scripts/extract_athlete_progression.py --athlete-id 14593938 --years 2025

# Filter by discipline
python3 scripts/extract_athlete_progression.py \
  --athlete-id 14593938 \
  --disciplines "Marathon" "Half Marathon" \
  --output results.json
```

**Command-Line Options**:
- `--athlete-id ID` - World Athletics athlete ID (required)
- `--url URL` - Direct URL to athlete profile (alternative to --athlete-id)
- `--years YEAR [YEAR ...]` - Years to fetch race results for (e.g., 2025)
- `--disciplines DISC [DISC ...]` - Filter by discipline (e.g., "Marathon")
- `--output FILE` - Output JSON file path
- `--no-display` - Don't display data (only save to file)

---

### 4. `enrich-athletes.js` 🔧 Legacy Enrichment Script

**Purpose**: Legacy script for enriching athlete data from World Athletics (Node.js).

**Status**: Largely superseded by `sync_athletes_from_rankings.py`, but still works for manual enrichment.

**Features**:
- Searches for World Athletics profiles by name
- Extracts athlete IDs and rankings
- Updates `athletes.json` with enriched data
- Creates automatic backups

**Usage**:
```bash
# Run from project root
node scripts/enrich-athletes.js
```

**What it does**:
1. Searches for each athlete's World Athletics profile
2. Extracts their unique athlete ID
3. Updates their official headshot URL
4. Fetches current world rankings (marathon & road running)
5. Saves the enriched data back to `athletes.json`

**Features**:
- ✅ Automatic URL construction from athlete names
- ✅ Rate limiting (2 seconds between requests)
- ✅ Backup creation (`athletes.json.backup`)
- ✅ Progress logging
- ✅ Error handling

---

## 🗄️ Database Schema

### New Tables (For Progression Data)

#### `athlete_progression`
Stores year-by-year season's best performances for each athlete across different disciplines.

**Columns**:
- `athlete_id` - Foreign key to athletes table
- `discipline` - Event name (e.g., "Marathon Road")
- `season` - Year (e.g., "2023")
- `mark` - Performance time/distance
- `venue` - Location of performance
- `competition_date` - Date of performance
- `competition_name` - Event name
- `result_score` - World Athletics points

**Indexes**:
- `athlete_id` (for fast lookups)
- `discipline` (for filtering)
- `season` (for time-based queries)

**Unique Constraint**: `(athlete_id, discipline, season)` for UPSERT operations

---

#### `athlete_race_results`
Stores detailed race results for each athlete by year.

**Columns**:
- `athlete_id` - Foreign key to athletes table
- `year` - Race year
- `competition_date` - Race date
- `competition_name` - Event name
- `venue` - Race location
- `discipline` - Event type
- `position` - Finish position
- `finish_time` - Final time
- `race_points` - World Athletics points

**Indexes**:
- `athlete_id` (for fast lookups)
- `year` (for time-based queries)
- `discipline` (for filtering)

**Unique Constraint**: `(athlete_id, year, competition_date, competition_name, discipline)`

---

## 🔄 Workflow

### Initial Setup (One Time)

1. **Run database migrations**:
   ```bash
   # Schema is automatically created on deployment
   # Or manually run schema.sql against your database
   ```

2. **Sync top 100 athletes with progression data**:
   ```bash
   python3 scripts/sync_athletes_from_rankings.py
   ```
   This will:
   - Fetch top 100 men and women from rankings
   - Get their profile data (headshots, PBs, rankings)
   - **Automatically fetch progression and 2025 results**
   - Save everything to the database

3. **(Optional) Backfill historical athletes**:
   If you had athletes before this feature was added:
   ```bash
   # Start with a dry run
   python3 scripts/backfill_athlete_progression.py --dry-run --limit 5
   
   # Then run for real with skip-existing
   python3 scripts/backfill_athlete_progression.py --skip-existing
   ```

---

### Regular Maintenance (Automated via GitHub Actions)

The sync script runs every 2 days automatically via GitHub Actions:
- Updates top 100 rankings
- Fetches new progression data for changed athletes
- Detects and adds new elite athletes
- Updates existing athlete data

---

### Manual Operations

**Sync a specific athlete**:
```bash
python3 scripts/sync_athletes_from_rankings.py --athlete-id 14593938
```

**Export athlete data to JSON**:
```bash
python3 scripts/extract_athlete_progression.py \
  --athlete-id 14593938 \
  --years 2025 \
  --output peres_jepchirchir.json
```

**Update all athletes' progression data**:
```bash
python3 scripts/backfill_athlete_progression.py --delay 3
```

---

## ⚡ Rate Limiting & Best Practices

To be respectful to World Athletics servers:

### 1. Use Appropriate Delays
- **Sync script**: 2-3 seconds between pages, 3-5 seconds between profiles
- **Backfill script**: Default 5 seconds between athletes (adjustable with `--delay`)
- **Extract script**: Used by other scripts, inherits their delays

### 2. Avoid Excessive Re-runs
- Sync script is scheduled to run every 2 days automatically
- Backfill only needs to run once (or when adding many new athletes)
- **Always use `--dry-run` first** to test before full runs

### 3. Use Skip Flags When Appropriate
- `--skip-existing` to avoid re-fetching unchanged data
- `--skip-progression` if you only need basic athlete data
- `--limit` for testing before full runs

---

## 🔧 Troubleshooting

### "Database connection failed"
- Ensure `DATABASE_URL` environment variable is set
- Check `.env` file in project root
- Verify database is accessible

### "Import error: extract_athlete_progression"
- Ensure you're running from project root
- Check Python path includes scripts directory
- Verify all dependencies are installed: `pip install -r requirements.txt`

### "Rate limited / 429 errors"
- Increase delay between requests (`--delay 10`)
- Use `--skip-existing` to reduce load
- Wait before retrying

### "Progression data not appearing"
- Check that tables were created (run schema.sql)
- Verify athlete has World Athletics ID
- Check logs for specific errors
- Try individual athlete first: `--athlete-id XXXXX`

### Backfill script hanging or timing out
- Use `--limit` to process smaller batches
- Increase `--delay` to give more time between requests
- Use `--start-from` to resume from where it stopped
- Check your internet connection

---

## 🌐 API Integration

The new progression and race results data is available via the API:

### Get Single Athlete with Progression Data
```bash
# Basic athlete data
GET /api/athletes?id=123

# Include progression data
GET /api/athletes?id=123&include=progression

# Include race results
GET /api/athletes?id=123&include=results

# Include both
GET /api/athletes?id=123&include=progression,results

# Filter by discipline
GET /api/athletes?id=123&include=progression&discipline=Marathon

# Filter results by year
GET /api/athletes?id=123&include=results&year=2025
```

### Response Format
```json
{
  "id": 123,
  "name": "Eliud Kipchoge",
  "country": "KEN",
  "gender": "men",
  "pb": "2:01:09",
  "headshotUrl": "https://...",
  "progression": [
    {
      "athleteId": 123,
      "discipline": "Marathon Road",
      "season": "2023",
      "mark": "2:01:09",
      "venue": "Berlin",
      "competitionDate": "2023-09-24",
      "competitionName": "Berlin Marathon",
      "resultScore": 1234
    }
  ],
  "raceResults": [
    {
      "athleteId": 123,
      "year": 2025,
      "competitionDate": "2025-04-13",
      "competitionName": "Boston Marathon",
      "venue": "Boston, USA",
      "discipline": "Marathon",
      "position": "1",
      "finishTime": "2:05:52",
      "racePoints": 1200
    }
  ]
}
```

---

## 📊 Data Added to Athletes

For each athlete, the scripts collect and store:

### Basic Profile (from rankings)
```json
{
  "id": 1,
  "name": "Eliud Kipchoge",
  "country": "KEN",
  "pb": "2:01:09",
  "headshotUrl": "https://media.aws.iaaf.org/athletes/14208194.jpg",
  "worldAthletics": {
    "id": "14208194",
    "profileUrl": "https://worldathletics.org/athletes/kenya/eliud-kipchoge-14208194",
    "marathonRank": 61,
    "roadRunningRank": 45,
    "overallRank": 102
  },
  "age": 40,
  "dateOfBirth": "1984-11-05",
  "sponsor": "Nike",
  "seasonBest": "2:01:09"
}
```

### Progression Data (year-by-year season's bests)
- All disciplines the athlete has competed in
- Season's best mark for each year
- Competition details (name, date, venue)
- World Athletics points

### Race Results (detailed 2025 results)
- All races competed in current year
- Finish position and time
- Competition details
- Race points

---

## 🎯 Success Metrics

### Sync Script
- **Coverage**: ~95% of top 100 athletes have full data
- **Update frequency**: Every 2 days (automated)
- **Average runtime**: 8-12 minutes for 200 athletes
- **Data quality**: Official World Athletics data

### Backfill Script
- **Progression records**: ~8-10 per athlete (varies by career length)
- **Race results**: ~2-5 per athlete for current year
- **Success rate**: ~95%+ (some athletes have limited data)
- **Average runtime**: ~5-8 minutes for 100 athletes (at 3-second delay)

---

## 📝 Notes

### Athletes Not Found
If an athlete isn't found during enrichment:
1. They may have a different name format on World Athletics
2. They may not specialize in marathon
3. Their profile may not be publicly accessible
4. You can manually add their ID if needed

### Manual Fallback
If automated scripts fail, you can:
1. Use `scripts/manual-enrich.js` for individual athletes
2. Search World Athletics directly and update the JSON
3. Leave them without enriched data (app still works with basic info)

---

## 🚀 Future Enhancements

- [ ] Add support for more disciplines (10K, Half Marathon)
- [ ] Historical race results (multiple years)
- [ ] Performance analytics and trends
- [ ] Comparison tools between athletes
- [ ] Export to CSV/Excel formats
- [ ] Integration with race timing systems

---

**For more details, see the main project [README.md](../README.md) and [ARCHITECTURE.md](../docs/ARCHITECTURE.md)**

```

### Country Code Mapping

The script maps country codes to World Athletics country slugs:

- KEN → kenya
- NED → netherlands
- ETH → ethiopia
- USA → united-states
- GBR → great-britain-ni
- etc.

### Expected Runtime

- ~58 athletes × 2 seconds = ~2 minutes total
- Creates backup before starting
- Shows progress for each athlete

### Troubleshooting

**"Not found" errors**: Some athletes may not be found if:
- Their name format differs on World Athletics
- They don't have a World Athletics profile
- The URL format is different for their country

**Rate limiting errors**: If you see connection errors, the script already includes 2-second delays. You can increase the delay in the code if needed.

### Manual Verification

After running, you can verify the data:
1. Check `athletes.json` for updated `headshotUrl` and `worldAthletics` fields
2. Visit a few profile URLs to confirm they're correct
3. If needed, restore from `athletes.json.backup`

### Next Steps

After enrichment, you may want to:
1. Update the frontend to display rankings
2. Add athlete profile links
3. Use the headshots in the UI
4. Create a cron job to update rankings periodically
