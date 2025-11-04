# World Athletics Top 100 Sync System

## Overview

The **sync_athletes_from_rankings.py** script is a unified solution that automates the process of:
1. Scraping the top 100 marathon athletes (men and women) from World Athletics World Rankings
2. Enriching athlete data by fetching their profile pages
3. Detecting changes using SHA256 hashing
4. Updating the Neon Postgres database with only changed records

This system runs automatically every 2 days via GitHub Actions and can also be triggered manually.

## Features

### ✅ Complete End-to-End Automation
- **Scraping**: Extracts data from World Athletics World Rankings pages (not the API)
- **Profile Fetching**: Visits each athlete's profile to get detailed information
- **Delta Detection**: Only updates records that have actually changed
- **Database Sync**: Efficient updates with hash-based change detection
- **Dry-Run Mode**: Preview changes without making database modifications

### ✅ Data Extracted

From **World Rankings Page**:
- Athlete name and country
- World ranking (current position)
- Ranking points
- Date of birth
- World Athletics ID (from profile URL)
- Profile URL

From **Athlete Profile Page**:
- Official headshot URL
- Marathon world rank (#1-#10000+)
- Road running world rank
- Overall world rank
- Personal best time
- Season best time
- Age and date of birth
- Sponsor information (when available)

### ✅ Intelligent Change Detection

The script uses SHA256 hashing and World Athletics marathon ranking scores to detect if an athlete's data has actually changed:
- **New athletes**: Added to database (top 100 ranking improved)
- **Changed athletes**: Updated in database (PB improved, rank changed, etc.)
- **Unchanged athletes**: Skipped (no database write)
- **Dropped athletes** (with `--sync-dropped`): Searches beyond top 100 to keep them synced
- **Score-based skip**: If World Athletics marathon ranking score unchanged, skip expensive profile fetch

This means:
- ✅ Minimal database writes (only real changes)
- ✅ No unnecessary API calls
- ✅ Fast execution (skip enrichment for unchanged athletes via score comparison)
- ✅ Historical data preserved (athletes who drop out of top 100 can still be synced)
- ✅ Performance optimization (typical sync reduced from 6-8 min to under 1 min)

## Usage

### Command Line

```bash
# Dry-run mode (preview changes without updating database)
python3 scripts/sync_athletes_from_rankings.py --dry-run

# Limit to top 20 per gender (faster for testing)
python3 scripts/sync_athletes_from_rankings.py --dry-run --limit 20

# Skip profile enrichment (much faster, basic data only)
python3 scripts/sync_athletes_from_rankings.py --dry-run --skip-enrichment

# Sync athletes who dropped out of top 100 (searches beyond top 100)
python3 scripts/sync_athletes_from_rankings.py --sync-dropped

# Production run (actually updates database)
python3 scripts/sync_athletes_from_rankings.py

# Full top 100 sync with enrichment + dropped athletes
python3 scripts/sync_athletes_from_rankings.py --limit 100 --sync-dropped
```

### Command Line Options

| Flag | Description |
|------|-------------|
| `--dry-run` | Preview changes without updating database |
| `--limit N` | Number of athletes to fetch per gender (default: 100) |
| `--skip-enrichment` | Skip profile fetching (faster, basic data only) |
| `--sync-dropped` | Also sync athletes who dropped out of top 100 |

### GitHub Actions

The script runs automatically via the `.github/workflows/sync-top-100.yml` workflow:

**Scheduled**: Every 2 days at 2:00 AM UTC (Tuesday/Thursday/Saturday)
```yaml
schedule:
  - cron: '0 2 */2 * *'
```

**Manual Trigger**: Via Actions tab with options:
- ✅ Dry-run mode toggle
- ✅ Can be run from any branch

**Push Trigger** (for testing):
- Runs automatically on push to `copilot/**` or `feature/**` branches
- Always runs in dry-run mode for safety
- Only triggers if sync script or workflow file changes

### Environment Variables

Required:
```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Optional:
```bash
DEBUG=true  # Enable verbose profile fetching debug output
```

## Architecture

### Script Structure

```
sync_athletes_from_rankings.py
├── PART 1: SCRAPING RANKINGS
│   ├── get_recent_tuesday()         # Calculate most recent Tuesday
│   ├── scrape_rankings_page()       # Scrape single page
│   ├── scrape_all_rankings()        # Scrape all pages needed
│   └── find_dropped_athletes()      # Find athletes beyond top 100
│
├── PART 2: ENRICHING ATHLETE PROFILES
│   ├── fetch_athlete_profile()      # Fetch detailed profile data
│   ├── fetch_profile_fallback()     # Fallback HTML parsing
│   └── enrich_athletes()            # Batch enrich all athletes
│
├── PART 3: DATABASE SYNC
│   ├── compute_hash()               # SHA256 hash for change detection
│   ├── fetch_existing_athletes()    # Get current database state
│   ├── detect_changes()             # Compare scraped vs existing
│   ├── upsert_athlete()             # Insert or update record
│   └── sync_to_database()           # Batch database operations
│
└── MAIN ORCHESTRATION
    └── main()                       # Coordinate all steps
```

### Data Flow

```
World Athletics Rankings Page
        ↓
   [Scrape Table - Top 100]
        ↓
   Basic Athlete Data (name, country, rank, score, ID)
        ↓
   [Find Dropped Athletes] ← Optional (--sync-dropped)
        ↓                      Pages through rankings beyond top 100
   All Athletes to Process    to find athletes who previously ranked
        ↓
   [Fetch Existing from DB]
        ↓
   [Compare Scores] ← Smart skip: if score unchanged, skip profile fetch
        ↓
   [Fetch Profile Pages] ← Only for new/changed athletes
        ↓
   Enriched Data (headshot, PB, ranks)
        ↓
   [Compute Hashes]
        ↓
   [Compare with Database]
        ↓
   New, Changed, Unchanged Lists
        ↓
   [Database Sync] ← Optional (--dry-run)
        ↓
   Updated Neon Postgres Database
```

### Dropped Athlete Sync Feature

When `--sync-dropped` is enabled, the script:

1. **Identifies dropped athletes**: Compares database IDs with current top 100
2. **Searches beyond top 100**: Pages through rankings (pages 3+) up to top 1000
3. **Finds and syncs**: Updates data for athletes who dropped but still rank
4. **Smart skipping**: Uses score comparison to avoid unnecessary profile fetches
5. **Ignores truly dropped**: Athletes not found in top 1000 are left unchanged

**Example workflow:**
```
Database has: Athletes A, B, C, D, E (5 total)
Top 100 now:  Athletes A, B, C (3 still ranking)
Dropped:      Athletes D, E (2 dropped from top 100)

With --sync-dropped:
  → Search pages 3+ for athletes D and E
  → Found D at rank 145, E at rank 203
  → Compare their scores with database
  → If score unchanged, use cached data (fast)
  → If score changed, fetch fresh profile (slow)
  → Update database with current rankings
```

**When to use:**
- ✅ **Scheduled runs**: Keeps all existing athletes current
- ✅ **Historical tracking**: Maintains complete athlete history
- ❌ **Initial sync**: Not needed when database is empty
- ❌ **Quick tests**: Adds significant time for testing

## Performance

### Timing Estimates

| Configuration | Duration | Notes |
|--------------|----------|-------|
| Top 10, skip enrichment | ~10 seconds | Fast testing |
| Top 10, with enrichment | ~45 seconds | Profile fetches slow |
| Top 100, skip enrichment | ~30 seconds | Basic data only |
| Top 100, with enrichment (first run) | ~6-8 minutes | Full sync with all data |
| Top 100, with enrichment (subsequent) | ~1 minute | Score-based skip optimization |
| Top 100 + dropped (5 athletes) | ~2-3 minutes | Extra pages + enrichment |
| Top 100 + dropped (20 athletes) | ~4-5 minutes | More search pages needed |

**Why Enrichment is Slow:**
- Each profile fetch takes 2-3 seconds (network latency)
- Deliberate 3-second delay between requests (politeness)
- 100 athletes × 3 seconds = ~5 minutes minimum
- Plus parsing and processing time

**Score-Based Optimization:**
- First run: Fetches all profiles (~6-8 minutes for 100 athletes)
- Subsequent runs: Only fetches changed athletes (~1 minute typical)
- Most top-100 athletes stable week-to-week (80-90% unchanged)
- World Athletics marathon ranking score indicates performance changes

### Rate Limiting

The script is intentionally polite to World Athletics servers:

```python
DELAY_BETWEEN_REQUESTS = 2   # Rankings pages
DELAY_BETWEEN_PROFILES = 3   # Profile pages (slower)
```

This ensures we don't overwhelm their servers and reduces chance of being blocked.

## Error Handling

### Graceful Degradation

- **Missing athlete ID**: Athlete skipped, warning logged
- **Profile fetch fails**: Uses fallback HTML parsing
- **Network timeout**: Continues with next athlete
- **Database error**: Transaction rolled back, error reported
- **Parse error**: Row skipped, processing continues

### Failure Modes

1. **No athletes found**: Script exits with error
2. **Database connection fails**: Script exits immediately
3. **Profile enrichment fails**: Continues with basic data only
4. **Partial sync failure**: Creates GitHub issue with details

## GitHub Actions Integration

### Workflow Features

✅ **Automatic scheduling** every 2 days
✅ **Manual trigger** with dry-run option
✅ **Automatic migration** of database schema
✅ **Artifact uploads** with sync statistics
✅ **Issue creation** on failure
✅ **Commit comments** on success (scheduled runs only)

### Outputs

**Artifacts** (retained for 30 days):
- `sync_stats.json` - Detailed statistics about the sync
- `sync_output.log` - Full console output

**GitHub Issues** (on failure):
- Automatic issue creation with:
  - Link to failed workflow run
  - Partial statistics
  - Debug information
  - Action items for fixing

## Database Schema

The script uses and maintains these database fields:

```sql
-- Core athlete fields
id                           SERIAL PRIMARY KEY
name                         VARCHAR(255)
country                      CHAR(3)
gender                       VARCHAR(10)
personal_best                VARCHAR(10)
season_best                  VARCHAR(10)
headshot_url                 TEXT
world_athletics_id           VARCHAR(50)
world_athletics_profile_url  TEXT
marathon_rank                INTEGER
road_running_rank            INTEGER
overall_rank                 INTEGER
age                          INTEGER
date_of_birth                DATE

-- Sync tracking fields
ranking_source               VARCHAR(50)   -- 'world_rankings'
last_fetched_at              TIMESTAMP     -- Last successful fetch
data_hash                    VARCHAR(64)   -- SHA256 for change detection
created_at                   TIMESTAMP
updated_at                   TIMESTAMP
```

### Indexes

For performance, these indexes exist:
- `idx_athletes_wa_id` on `world_athletics_id`
- `idx_athletes_data_hash` on `data_hash`
- `idx_athletes_ranking_source` on `ranking_source`

## Comparison with Previous Approaches

### ❌ GraphQL API Approach (Failed)
- Used `worldathletics` Python package
- **Problem**: API endpoints don't exist (DNS resolution fails)
- **Status**: Abandoned

### ❌ Direct GraphQL Calls (Failed)
- Attempted to call World Athletics GraphQL directly
- **Problem**: Endpoints hardcoded in package don't resolve
- **Status**: Abandoned

### ✅ Web Scraping Approach (Current)
- Scrapes public World Rankings pages
- **Advantages**:
  - ✅ Actually works (public pages are accessible)
  - ✅ No API authentication needed
  - ✅ Stable HTML structure
  - ✅ All needed data available
- **Disadvantages**:
  - ⚠️ Slower than API would be
  - ⚠️ Subject to HTML structure changes
  - ⚠️ Need to be polite with rate limiting

## Dropped Athlete Sync Feature

The `--sync-dropped` flag extends the sync system to maintain data for athletes who drop out of the top 100 but are still actively competing.

### How It Works

1. **Identify Dropped Athletes**: Compare database athletes vs. current top 100
2. **Search Beyond Top 100**: Scan ranking pages 3-20 (ranks 101-1000) to find them
3. **Score-Based Updates**: Only fetch profiles if their World Athletics score changed
4. **Maintain Historical Data**: Keep all previously-ranked athletes up to date

**Example:**
```bash
# Sync top 100 + maintain dropped athletes
python3 scripts/sync_athletes_from_rankings.py --sync-dropped

# Preview which dropped athletes will be updated
python3 scripts/sync_athletes_from_rankings.py --sync-dropped --dry-run
```

### Benefits
- ✅ Athletes who drop to rank 101-1000 stay current
- ✅ Historical athlete data doesn't go stale
- ✅ Score comparison prevents unnecessary profile fetches
- ✅ Automatic detection of which athletes to search for

### Performance
- **Without score check**: ~5-8 minutes (fetches all profiles)
- **With score check**: ~45-60 seconds (skips unchanged athletes)
- Only updates athletes whose ranking score actually changed

## Finding World Athletics IDs

When adding athletes manually or fixing missing IDs, use these methods:

### Method 1: World Athletics Website Search

1. Go to https://worldathletics.org/
2. Use search bar (top right)
3. Enter athlete's full name
4. Click athlete's profile
5. Copy ID from URL

**Example:**
- Search: "Charles Hicks"
- URL: `https://worldathletics.org/athletes/united-states/charles-hicks-14208500`
- **World Athletics ID**: `14208500`

### Method 2: Direct Search URL

Use this pattern:
```
https://worldathletics.org/athletes/search?q=[ATHLETE NAME]
```

Example: `https://worldathletics.org/athletes/search?q=Charles%20Hicks`

### Search Tips

1. **Try name variations**:
   - Full name vs. nickname (Jonathan vs. Jonny)
   - With/without middle names
   - Different spellings

2. **Use country filter** if multiple results

3. **Verify identity**:
   - Check recent marathon results (2024-2025)
   - Compare personal best times
   - Review competition history

4. **Not found?**
   - Athlete might not be in World Athletics database
   - Some debutants don't have profiles yet
   - Leave blank and revisit later

### Common Issues

**"Multiple athletes with same name"**
- Filter by country
- Check personal best times
- Look at competition history

**"Athlete not found"**
- Try alternative spellings
- Check if they've competed internationally
- US-only runners may not be listed

**Adding IDs via Commissioner Mode**
1. Go to Commissioner Mode > Athlete Management
2. Find athlete in list
3. Enter World Athletics ID
4. Click 💾 Save
5. Run `--sync-dropped` to fetch their data

## Troubleshooting

### "No athletes found on page"
- Rankings page structure may have changed
- Check URL is correct: `https://worldathletics.org/world-rankings/marathon/men`
- Inspect page source for `<tr data-athlete-url>` elements

### "No __NEXT_DATA__ found"
- Profile page structure changed
- Script falls back to HTML parsing automatically
- May get less data but should still work

### "Database connection failed"
- Check `DATABASE_URL` environment variable is set
- Verify Neon database is active (not paused)
- Check network connectivity

### "Hash collision" or "Duplicate athletes"
- Rare, but possible if two athletes have identical data
- Check `world_athletics_id` uniqueness constraint

## Future Improvements

### Potential Enhancements
- [ ] Parallel profile fetching (with rate limiting)
- [ ] Caching profile HTML to avoid re-fetching unchanged athletes
- [ ] Support for other distances (half marathon, 10K, etc.)
- [ ] Email notifications on sync failure
- [ ] Slack/Discord webhook integration
- [ ] Historical ranking tracking over time
- [ ] Performance analytics and trends

### If World Athletics API Becomes Available
If a working API is discovered or released:
1. Keep web scraping as fallback
2. Add API integration as primary method
3. Compare both sources for accuracy
4. Gradually phase out scraping if API is reliable

## Related Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Overall system architecture
- **[NEON_SETUP.md](../NEON_SETUP.md)** - Database setup guide
- **[MIGRATION.md](MIGRATION.md)** - Migration history from Blob Storage
- **[WORLDATHLETICS_API_DECISION.md](WORLDATHLETICS_API_DECISION.md)** - Why GraphQL failed

## Support

For issues or questions:
1. Check GitHub Actions workflow logs
2. Review automatically created issues
3. Test locally with `--dry-run --limit 10`
4. Open a new issue with full output

---

**Last Updated**: October 17, 2025
**Script Version**: 1.0.0 (Unified Web Scraping Approach)
