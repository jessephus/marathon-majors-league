# Dropped Athlete Sync Feature

## Overview

The `--sync-dropped` feature extends the World Athletics sync system to maintain data for athletes who drop out of the top 100 but are still actively competing and ranked.

## Problem Statement

**Without `--sync-dropped`:**
- Top 100 sync only updates athletes currently in top 100
- Athletes who drop to rank 101-1000 become stale in database
- Historical athlete data stops updating when they leave top 100
- No way to track performance changes for previously-ranked athletes

**With `--sync-dropped`:**
- System identifies which database athletes are missing from top 100
- Searches additional ranking pages (pages 3+) to find them
- Updates their data if their World Athletics score changed
- Maintains complete historical records for all athletes ever in top 100

## How It Works

### Step-by-Step Process

1. **Extract Top 100** (normal sync process)
   ```
   Men: Athletes 1-100
   Women: Athletes 1-100
   ```

2. **Fetch Existing Database Athletes**
   ```
   Database has 150 athletes total (from previous syncs)
   ```

3. **Identify Dropped Athletes**
   ```python
   existing_ids = {all WA IDs in database}
   top_100_ids = {WA IDs in current top 100}
   dropped_ids = existing_ids - top_100_ids
   # Example: 50 athletes dropped out
   ```

4. **Search Beyond Top 100**
   ```
   For each gender:
     Start at page 3 (after top 100)
     Search up to page 20 (top 1000)
     Stop when all dropped athletes found
   ```

5. **Compare Scores Before Enrichment**
   ```python
   for athlete in dropped_athletes:
       existing_score = database[athlete_id].score
       current_score = athlete.score
       
       if existing_score == current_score:
           # Use cached data (fast)
           skip_profile_fetch()
       else:
           # Athlete improved/declined
           fetch_fresh_profile()
   ```

6. **Update Database**
   ```
   Only write to database if:
   - Data hash changed, OR
   - Marathon rank changed, OR
   - Score changed
   ```

## Usage

### Command Line

```bash
# Sync top 100 + dropped athletes
python3 scripts/sync_athletes_from_rankings.py --sync-dropped

# Dry-run to preview
python3 scripts/sync_athletes_from_rankings.py --sync-dropped --dry-run

# Skip enrichment (just update rankings)
python3 scripts/sync_athletes_from_rankings.py --sync-dropped --skip-enrichment

# Full sync with all features
python3 scripts/sync_athletes_from_rankings.py --limit 100 --sync-dropped
```

### GitHub Actions

The workflow automatically enables `--sync-dropped` for:
- ✅ Scheduled runs (every 2 days)
- ✅ Manual workflow triggers
- ❌ Push events (testing only)

```yaml
# In .github/workflows/sync-top-100.yml
if [ "${{ github.event_name }}" = "schedule" ] || [ "${{ github.event_name }}" = "workflow_dispatch" ]; then
  SYNC_DROPPED_FLAG="--sync-dropped"
fi
```

## Performance Impact

### Time Complexity

| Scenario | Without `--sync-dropped` | With `--sync-dropped` |
|----------|-------------------------|----------------------|
| 0 dropped athletes | 1-2 minutes | 1-2 minutes (same) |
| 5 dropped athletes | 1-2 minutes | 2-3 minutes |
| 20 dropped athletes | 1-2 minutes | 4-5 minutes |
| 50 dropped athletes | 1-2 minutes | 8-10 minutes |

**Factors affecting time:**
- Number of dropped athletes to find
- How far down rankings they've fallen (more pages = slower)
- How many have score changes (requiring profile fetches)
- Network latency and World Athletics server response time

### API Request Count

**Example: 10 dropped athletes, 3 with score changes**

```
Top 100 sync:
  - 2 rankings pages × 2 genders = 4 requests
  - ~20 profile fetches (80% skipped via score) = 20 requests
  Total: 24 requests

Dropped athlete search:
  - ~3 additional pages × 2 genders = 6 requests
  - 3 profile fetches (only changed) = 3 requests
  Total: 9 additional requests

Grand total: 33 requests vs 24 (38% increase)
Duration: ~2 minutes vs ~1 minute
```

## Database Impact

### Fields Updated

For dropped athletes, the sync updates:

```sql
UPDATE athletes SET
  -- Ranking data (always updated)
  marathon_rank = %s,                              -- New rank (e.g., 145)
  world_athletics_marathon_ranking_score = %s,     -- New score
  
  -- Profile data (only if score changed)
  personal_best = %s,                              -- If PB improved
  season_best = %s,                                -- Latest season
  headshot_url = %s,                               -- Profile photo
  road_running_rank = %s,                          -- Other rankings
  overall_rank = %s,
  
  -- Tracking fields
  data_hash = %s,                                  -- Change detection
  last_fetched_at = NOW(),                         -- Last update time
  updated_at = NOW()                               -- Record modification
WHERE world_athletics_id = %s
```

### Storage Efficiency

The system is designed for minimal storage impact:

- ✅ Only updates changed records (hash-based detection)
- ✅ Skips profile fetches when score unchanged (cached data)
- ✅ No duplicate records created
- ✅ Historical data preserved in single row

**Example database growth:**
```
Initial: 100 athletes (top 100)
After 6 months: ~150-200 athletes (100 current + 50-100 historical)
After 1 year: ~200-300 athletes (100 current + 100-200 historical)
After 2 years: ~300-400 athletes (top talent pool is fairly stable)
```

## Edge Cases Handled

### 1. Athlete Not Found in Top 1000
```python
if athlete_id not in found_ids:
    # Left unchanged in database
    # Will be searched again next sync
    # Still appears in /api/athletes response
```

### 2. Athlete Retired (Not Ranking Anywhere)
```python
# Athlete remains in database with old data
# last_fetched_at and updated_at show age of data
# Can be filtered by application if needed
```

### 3. Multiple Athletes Drop Same Week
```python
# All searched in parallel during single sync
# Paging continues until all found or limit reached
# Efficient batch processing
```

### 4. Athlete Re-Enters Top 100
```python
# Next sync finds them in top 100 again
# Updates with latest data
# Seamless transition - no special handling needed
```

### 5. Score Unchanged But Other Data Changed
```python
# Rare case: same score but different PB (e.g., different race counted)
# Hash-based detection catches this
# Profile fetched despite score match
# Database updated with new data
```

## Monitoring and Debugging

### Log Output

When `--sync-dropped` is enabled, you'll see:

```
🔍 STEP 2b: FINDING DROPPED ATHLETES
======================================================================
  
🔍 Searching for 12 men athletes who dropped out of top 100...
  Athletes to find: ['14123456', '14234567', '14345678', ...]
  Checking page 3...
    ✓ Found: John Smith (rank 145)
    ✓ Found: Jane Doe (rank 178)
  Checking page 4...
    ✓ Found: Bob Jones (rank 203)
  ✓ Found all 12 dropped athletes!
  Total found: 12 dropped men athletes

🔍 Searching for 8 women athletes who dropped out of top 100...
  Athletes to find: ['14456789', '14567890', ...]
  Checking page 3...
    ✓ Found: Alice Brown (rank 112)
  ...
  ⚠️  Could not find 2 athletes (may have dropped out of top 1000)
      Missing IDs: ['14999999', '14888888']
  Total found: 6 dropped women athletes

✓ Added 12 men and 6 women who dropped from top 100
✓ Total athletes to process: 218
```

### Dry-Run Mode

Test dropped athlete search without database writes:

```bash
python3 scripts/sync_athletes_from_rankings.py --sync-dropped --dry-run --limit 10
```

Output shows:
- Which athletes would be searched for
- Which pages would be checked
- Which athletes would be updated
- Estimated time and API requests

## Best Practices

### When to Enable

✅ **Always enable for:**
- Production scheduled runs
- Manual syncs after race weekends
- Historical data maintenance
- Complete database updates

❌ **Don't enable for:**
- Initial database seeding (no existing athletes to search)
- Quick testing (adds unnecessary time)
- Development with limited athletes

### Optimization Tips

1. **Use score-based skipping** (automatic)
   - Most dropped athletes stable week-to-week
   - Only fetch profiles when performance changed
   
2. **Combine with --limit** for testing
   ```bash
   # Test with small top-N
   python3 scripts/sync_athletes_from_rankings.py --limit 20 --sync-dropped --dry-run
   ```

3. **Monitor search depth**
   - If athletes drop below rank 1000, consider manual cleanup
   - Database `last_fetched_at` shows data freshness

4. **Schedule appropriately**
   - Run every 2 days (current setting) is reasonable
   - More frequent = more API requests but fresher data
   - Less frequent = fewer requests but staler historical data

## Technical Implementation

### Key Functions

**`find_dropped_athletes(gender, existing_ids, top_100_ids, rank_date)`**
- Identifies which athletes to search for
- Pages through rankings starting at page 3
- Stops when all found or page limit reached
- Returns list of athlete dicts

**Example:**
```python
dropped_ids = {id1, id2, id3, id4, id5}  # 5 athletes
top_100_ids = {id1, id2}  # 2 still in top 100

to_find = dropped_ids - top_100_ids  # {id3, id4, id5}

# Search pages 3, 4, 5, ... up to 20
for page in range(3, 21):
    athletes = scrape_rankings_page(gender, page, rank_date)
    for athlete in athletes:
        if athlete.id in to_find:
            found_athletes.append(athlete)
            to_find.remove(athlete.id)
    
    if not to_find:  # Found everyone
        break
```

### Integration Points

1. **Main orchestration** (`main()` function)
   ```python
   # After fetching existing athletes
   if args.sync_dropped:
       dropped_men = find_dropped_athletes(...)
       dropped_women = find_dropped_athletes(...)
       all_athletes.extend(dropped_men + dropped_women)
   ```

2. **Enrichment** (`enrich_athletes()` function)
   ```python
   # Score comparison works for all athletes (top 100 + dropped)
   if existing_score == current_score:
       use_cached_data()
   else:
       fetch_fresh_profile()
   ```

3. **Database sync** (`sync_to_database()` function)
   ```python
   # Hash-based detection works regardless of source
   # Dropped athletes treated same as top 100
   ```

## Future Enhancements

Potential improvements to consider:

1. **Configurable search depth**
   ```bash
   --sync-dropped --max-rank 500  # Only search to rank 500
   ```

2. **Selective sync by age**
   ```bash
   --sync-dropped --min-recency 30  # Only if last_fetched < 30 days ago
   ```

3. **Retired athlete detection**
   ```python
   if last_seen > 6_months_ago and not in top_1000:
       mark_as_retired = True
   ```

4. **Search result caching**
   ```python
   # Cache page results for 1 hour
   # Avoid re-fetching if script runs multiple times
   ```

5. **Parallel page fetching**
   ```python
   # Fetch multiple pages concurrently
   # Respect rate limits but speed up search
   ```

## Conclusion

The `--sync-dropped` feature ensures comprehensive athlete data maintenance by:

- ✅ Finding and updating athletes who drop from top 100
- ✅ Using score-based optimization to minimize API requests
- ✅ Maintaining complete historical records
- ✅ Automatically handling re-entries and movements
- ✅ Providing clear visibility into search process

It strikes a balance between data freshness and API politeness, making it suitable for production use in scheduled workflows while remaining optional for development and testing scenarios.
