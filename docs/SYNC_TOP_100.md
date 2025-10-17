# World Athletics Top 100 Sync System

## Overview

This system automatically syncs the top 100 men and top 100 women marathon runners from World Athletics to the Postgres database. It uses intelligent delta detection to minimize API calls and database writes.

## Architecture

### Components

1. **sync_top_100.py** - Main Python script that orchestrates the sync
2. **GitHub Actions Workflow** - Automated scheduling and execution
3. **Database Migration** - Adds sync tracking fields to the athletes table
4. **World Athletics API** - Data source via the `worldathletics` Python package

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Actions Cron                      │
│                  (Every 2 days at 2:00 AM)                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│               Run Database Migration (if needed)             │
│          Add: data_hash, last_fetched_at, etc.              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Step 1: Fetch Rankings List (Minimal Data)         │
│   - Top 100 men from World Athletics marathon rankings      │
│   - Top 100 women from World Athletics marathon rankings    │
│   - Only fetch: ID, rank, name, country                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Step 2: Load Database Snapshot                      │
│   - Query existing athlete records for these 200 IDs        │
│   - Retrieve: data_hash, marathon_rank, last_fetched_at     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Step 3: Detect Candidates for Update                │
│   - NEW: Not in database                                    │
│   - RANK CHANGED: Rank differs from DB                      │
│   - STALE: Last fetched > 7 days ago                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│       Step 4: Fetch Full Details (Batched, 25 at a time)    │
│   - Only fetch details for candidates                       │
│   - Use worldathletics package to get complete data         │
│   - Rate limiting: 200ms between requests (5 req/sec)       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│     Step 5: Canonicalize JSON & Compute Hash                │
│   - Normalize athlete data structure                        │
│   - Sort keys deterministically                             │
│   - Compute SHA256 hash of canonical JSON                   │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          Step 6: Upsert to Database (Hash-Guarded)           │
│   - UPSERT with WHERE clause: only write if changed         │
│   - Compare data_hash and marathon_rank                     │
│   - Update last_fetched_at and last_seen_at                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│        Step 7: Mark Dropped Athletes                         │
│   - Athletes no longer in top-100                           │
│   - Set last_seen_at = NULL                                 │
│   - Keep their data for historical purposes                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Step 8: Log Statistics & Results                │
│   - Write sync_stats.json                                   │
│   - Upload as GitHub Actions artifact                       │
│   - Create issue on catastrophic failure                    │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema Changes

### New Fields in `athletes` Table

```sql
-- Unique constraint for World Athletics ID
world_athletics_id VARCHAR(50) UNIQUE

-- Sync tracking fields
ranking_source VARCHAR(50) DEFAULT 'world_marathon'  -- Source of ranking data
last_fetched_at TIMESTAMP WITH TIME ZONE            -- Last detail fetch time
last_seen_at TIMESTAMP WITH TIME ZONE               -- Last time in top-100
data_hash TEXT                                      -- SHA256 of canonical JSON
raw_json JSONB                                      -- Complete athlete data

-- New indexes
CREATE INDEX idx_athletes_data_hash ON athletes(data_hash);
CREATE INDEX idx_athletes_last_seen ON athletes(last_seen_at);
CREATE INDEX idx_athletes_ranking_source ON athletes(ranking_source);
```

### Migration

The migration is automatically run by GitHub Actions before each sync. It can also be run manually:

```bash
psql $DATABASE_URL < migrations/add_sync_tracking_fields.sql
```

## Usage

### Automated (Recommended)

The sync runs automatically every 2 days at 2:00 AM UTC via GitHub Actions.

**Schedule**: `0 2 */2 * *` (Every other day at 2 AM)

### Manual Trigger

You can manually trigger the sync from GitHub:

1. Go to **Actions** tab
2. Select **"Sync World Athletics Top 100"** workflow
3. Click **"Run workflow"**
4. Choose options:
   - **Dry run**: Test mode, no database writes
   - **Verbose**: Enable detailed logging

### Local Execution

```bash
# Install dependencies
cd scripts
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://..."
export GITHUB_TOKEN="ghp_..." # Optional, for issue creation
export GITHUB_REPO="owner/repo" # Optional, for issue creation

# Run sync
python sync_top_100.py

# Dry run (no DB writes)
python sync_top_100.py --dry-run

# Verbose logging
python sync_top_100.py --verbose

# Both
python sync_top_100.py --dry-run --verbose
```

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GITHUB_TOKEN` | No | GitHub PAT for creating issues on failure |
| `GITHUB_REPO` | No | Repository in format "owner/repo" |

### Script Constants

Edit `scripts/sync_top_100.py` to change:

```python
BATCH_SIZE = 25              # Athletes per batch detail fetch
MAX_RETRIES = 5              # Retry attempts for failed requests
INITIAL_BACKOFF = 2          # Initial retry backoff in seconds
TOP_N = 100                  # Number of top athletes to sync per gender
```

### Workflow Schedule

Edit `.github/workflows/sync-top-100.yml`:

```yaml
schedule:
  - cron: '0 2 */2 * *'  # Every 2 days at 2 AM UTC
```

Common schedules:
- Daily: `'0 2 * * *'`
- Every 3 days: `'0 2 */3 * *'`
- Weekly: `'0 2 * * 0'` (Sunday)
- Monthly: `'0 2 1 * *'` (1st of month)

## Performance & Efficiency

### Delta Detection Strategy

The system uses multiple strategies to avoid unnecessary work:

1. **Rank Changes**: Immediate detection of rank movements
2. **Content Hashing**: SHA256 hash comparison detects any data changes
3. **Staleness**: Refresh athletes not updated in 7+ days
4. **Hash-Guarded Writes**: `WHERE data_hash IS DISTINCT FROM` prevents no-op writes

### Typical Performance

| Scenario | API Calls | DB Writes | Duration |
|----------|-----------|-----------|----------|
| First run (200 new athletes) | 202 | 200 | ~60s |
| No changes (all current) | 2 | 0 | ~5s |
| 10 rank changes | 12 | 10 | ~10s |
| 50 stale athletes | 52 | 50 | ~30s |

### Rate Limiting

- **200ms delay** between athlete detail requests
- **Maximum 5 requests/second** to World Athletics
- **25 athletes per batch** to reduce HTTP overhead
- **Exponential backoff** on retry (2s, 4s, 8s, 16s, 32s)

## Monitoring & Logging

### GitHub Actions Artifacts

Every run uploads `sync_stats.json`:

```json
{
  "start_time": "2025-10-17T02:00:00Z",
  "duration_seconds": 45.2,
  "candidates_found": 20,
  "new_athletes": 5,
  "updated_athletes": 10,
  "unchanged_athletes": 5,
  "dropped_athletes": 2,
  "fetch_errors": 0,
  "db_errors": 0,
  "success": true
}
```

Access artifacts:
1. Go to **Actions** → **Workflow run**
2. Scroll to **Artifacts** section
3. Download `sync-stats-{run_number}`

### Automatic Issue Creation

On catastrophic failure, an issue is automatically created with:
- Error message and stack trace
- Partial statistics
- Link to failed workflow run
- Debug information (branch, commit, actor)
- Labels: `sync-failure`, `automated`, `bug`

### Manual Monitoring

Query the database to monitor sync health:

```sql
-- Recent sync activity
SELECT 
  gender,
  COUNT(*) as total_athletes,
  COUNT(*) FILTER (WHERE last_seen_at IS NOT NULL) as in_top_100,
  MAX(last_fetched_at) as last_sync,
  MIN(last_fetched_at) as oldest_data
FROM athletes
WHERE ranking_source = 'world_marathon'
GROUP BY gender;

-- Athletes with stale data (>7 days)
SELECT name, gender, marathon_rank, last_fetched_at
FROM athletes
WHERE ranking_source = 'world_marathon'
  AND last_fetched_at < NOW() - INTERVAL '7 days'
  AND last_seen_at IS NOT NULL
ORDER BY last_fetched_at ASC;

-- Recent changes (within 24 hours)
SELECT name, gender, marathon_rank, updated_at
FROM athletes
WHERE updated_at > NOW() - INTERVAL '24 hours'
ORDER BY updated_at DESC;
```

## Error Handling

### Retry Logic

- **Network errors**: Exponential backoff (5 attempts)
- **Rate limiting (429)**: Automatic backoff
- **Server errors (5xx)**: Retry with backoff
- **Individual athlete failures**: Log warning, continue with others

### Failure Modes

| Error Type | Handling | Impact |
|------------|----------|--------|
| Database connection | Fatal, create issue | Run fails |
| Ranking fetch failure | Fatal, create issue | Run fails |
| Single athlete fetch failure | Log warning, skip | Continue run |
| Hash computation error | Log error, skip | Continue run |
| Database write error | Log error, rollback batch | Retry next run |

### Recovery

Most errors are transient and will resolve on the next scheduled run. For persistent failures:

1. Check GitHub issue for details
2. Review workflow run logs
3. Test locally with `--dry-run --verbose`
4. Fix underlying issue (network, API changes, schema)
5. Manually trigger workflow to retry

## Troubleshooting

### Issue: No athletes being updated

**Cause**: Data hasn't changed, hash matches

**Solution**: This is expected behavior. Check:
```bash
python sync_top_100.py --dry-run --verbose
```

### Issue: All athletes marked as candidates

**Cause**: `data_hash` field is NULL in database

**Solution**: Run migration:
```bash
psql $DATABASE_URL < migrations/add_sync_tracking_fields.sql
```

### Issue: worldathletics package errors

**Cause**: API schema changes or package updates

**Solution**: 
1. Check package documentation
2. Update package: `pip install --upgrade worldathletics`
3. Modify script to match new API

### Issue: Rate limiting (429 errors)

**Cause**: Too many requests to World Athletics

**Solution**: Increase delay in script:
```python
time.sleep(0.5)  # Change from 0.2 to 0.5 (2 req/sec)
```

### Issue: Database connection timeout

**Cause**: Neon database suspended or network issues

**Solution**:
1. Check Neon console for database status
2. Verify `DATABASE_URL` secret in GitHub
3. Test connection locally

## Testing

### Dry Run Mode

Always test changes with dry-run first:

```bash
python sync_top_100.py --dry-run --verbose
```

This will:
- ✅ Fetch rankings and athlete details
- ✅ Compute hashes and detect changes
- ✅ Show what would be written
- ❌ NOT write to database
- ❌ NOT commit transactions

### Unit Testing

Test individual components:

```python
from sync_top_100 import canonical_hash, canonicalize_athlete

# Test canonicalization
athlete = {'id': '123', 'name': 'Test', 'dob': '1990-01-01'}
canonical = canonicalize_athlete(athlete)
hash1 = canonical_hash(canonical)
hash2 = canonical_hash(canonical)  # Should be identical

assert hash1 == hash2, "Hashing is not deterministic!"
```

### Integration Testing

1. Run against test database first
2. Use `--dry-run` to preview changes
3. Check `sync_stats.json` output
4. Verify database state with SQL queries

## Future Enhancements

### Possible Improvements

1. **Parallel Fetching**: Use `asyncio` and `aiohttp` for concurrent requests
2. **WebSocket Updates**: Real-time ranking changes
3. **Historical Tracking**: Store rank change history
4. **Athlete Comparison**: Track performance trends
5. **Smart Refresh**: Use World Athletics' `lastModified` field if available
6. **Sponsor Data**: Find reliable source for sponsor information
7. **Result Integration**: Sync recent race results automatically
8. **Cache Layer**: Redis for frequently accessed athlete data

### Sponsor Data

The `sponsor` field is included in the schema but not currently populated. Potential sources:

- Athlete bio/description parsing
- Manual curation via CSV import
- Third-party athletics databases
- Social media scraping (with consent)

To add sponsor data manually:

```sql
UPDATE athletes
SET sponsor = 'Nike'
WHERE world_athletics_id = '14208194';
```

## Security Considerations

### Secrets Management

- `DATABASE_URL` stored as GitHub secret
- `GITHUB_TOKEN` uses built-in Actions token (read/write permissions)
- No API keys needed (World Athletics API is public)

### Data Privacy

- Only public World Athletics data is collected
- No personal information beyond public profiles
- GDPR compliance: Data subject to athlete's public profile settings

### Rate Limiting Respect

- Maximum 5 requests/second (well below typical limits)
- Exponential backoff on errors
- Batch requests to minimize load

## Support

### Documentation

- This file: `docs/SYNC_TOP_100.md`
- Script docstrings: `scripts/sync_top_100.py`
- GitHub Actions: `.github/workflows/sync-top-100.yml`

### Getting Help

1. Check troubleshooting section above
2. Review GitHub Actions logs
3. Run locally with `--verbose` flag
4. Open issue with sync-failure details

### Contributing

To improve the sync system:

1. Test changes locally with `--dry-run`
2. Update this documentation
3. Add unit tests for new functionality
4. Submit PR with clear description

---

**Last Updated**: October 17, 2025
**Version**: 1.0.0
