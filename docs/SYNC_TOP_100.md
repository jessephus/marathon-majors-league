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

The script uses SHA256 hashing to detect if an athlete's data has actually changed:
- **New athletes**: Added to database (top 100 ranking improved)
- **Changed athletes**: Updated in database (PB improved, rank changed, etc.)
- **Unchanged athletes**: Skipped (no database write)
- **Dropped athletes**: Remain in database but with older `last_seen_at` timestamp

This means:
- ✅ Minimal database writes (only real changes)
- ✅ No unnecessary API calls
- ✅ Fast execution (skip enrichment for unchanged athletes)
- ✅ Historical data preserved (athletes who drop out of top 100 remain)

## Usage

### Command Line

```bash
# Dry-run mode (preview changes without updating database)
python3 scripts/sync_athletes_from_rankings.py --dry-run

# Limit to top 20 per gender (faster for testing)
python3 scripts/sync_athletes_from_rankings.py --dry-run --limit 20

# Skip profile enrichment (much faster, basic data only)
python3 scripts/sync_athletes_from_rankings.py --dry-run --skip-enrichment

# Production run (actually updates database)
python3 scripts/sync_athletes_from_rankings.py

# Full top 100 sync with enrichment
python3 scripts/sync_athletes_from_rankings.py --limit 100
```

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
│   └── scrape_all_rankings()        # Scrape all pages needed
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
   [Scrape Table]
        ↓
   Basic Athlete Data (name, country, rank, ID)
        ↓
   [Fetch Profile Pages] ← Optional (--skip-enrichment)
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

## Performance

### Timing Estimates

| Configuration | Duration | Notes |
|--------------|----------|-------|
| Top 10, skip enrichment | ~10 seconds | Fast testing |
| Top 10, with enrichment | ~45 seconds | Profile fetches slow |
| Top 100, skip enrichment | ~30 seconds | Basic data only |
| Top 100, with enrichment | ~6-8 minutes | Full sync with all data |

**Why Enrichment is Slow:**
- Each profile fetch takes 2-3 seconds (network latency)
- Deliberate 3-second delay between requests (politeness)
- 100 athletes × 3 seconds = ~5 minutes minimum
- Plus parsing and processing time

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
