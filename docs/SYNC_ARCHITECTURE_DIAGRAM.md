# World Athletics Sync System - Visual Architecture

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GitHub Repository                                │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  .github/workflows/sync-top-100.yml                              │  │
│  │  ┌──────────────────────────────────────────────────────────────┐│  │
│  │  │  Cron: 0 2 */2 * * (Every 2 days at 2 AM UTC)              ││  │
│  │  │  Manual: workflow_dispatch                                   ││  │
│  │  └──────────────────────────────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      GitHub Actions Runner                               │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  1. Install Python 3.11                                          │  │
│  │  2. Install dependencies (psycopg2, worldathletics, requests)    │  │
│  │  3. Run migration SQL (add sync tracking fields)                 │  │
│  │  4. Execute sync_top_100.py                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    scripts/sync_top_100.py                               │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STEP 1: Fetch Rankings List (Minimal)                          │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │  World Athletics API (worldathletics package)             │ │   │
│  │  │  GET: Top 100 men marathon rankings                       │ │   │
│  │  │  GET: Top 100 women marathon rankings                     │ │   │
│  │  │  Returns: [id, rank, name, country] × 200                 │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STEP 2: Load Database Snapshot                                 │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │  Neon Postgres Database                                   │ │   │
│  │  │  SELECT world_athletics_id, data_hash, marathon_rank      │ │   │
│  │  │  FROM athletes WHERE world_athletics_id IN (200 IDs)      │ │   │
│  │  │  Returns: Current state for comparison                    │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STEP 3: Detect Candidates                                      │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │  Compare Rankings vs Database:                            │ │   │
│  │  │  • NEW: Not in database → must fetch                      │ │   │
│  │  │  • RANK CHANGED: Rank differs → must fetch                │ │   │
│  │  │  • STALE: Last fetched > 7 days → should fetch            │ │   │
│  │  │                                                             │ │   │
│  │  │  Typical results:                                          │ │   │
│  │  │  • First run: 200 candidates (all new)                    │ │   │
│  │  │  • Incremental: 5-20 candidates (rank changes + stale)    │ │   │
│  │  │  • No changes: 0 candidates                                │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STEP 4: Fetch Details (Batched)                                │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │  For each batch of 25 candidates:                         │ │   │
│  │  │  ┌─────────────────────────────────────────────────────┐ │ │   │
│  │  │  │  World Athletics API                                 │ │ │   │
│  │  │  │  GET: Full athlete details                           │ │ │   │
│  │  │  │  Returns: Complete profile with PB, DOB, etc.        │ │ │   │
│  │  │  │  Rate limit: 200ms between requests (5 req/sec)      │ │ │   │
│  │  │  └─────────────────────────────────────────────────────┘ │ │   │
│  │  │                                                             │ │   │
│  │  │  Retry logic:                                              │ │   │
│  │  │  • Exponential backoff: 2s, 4s, 8s, 16s, 32s              │ │   │
│  │  │  • Max 5 attempts per request                              │ │   │
│  │  │  • Skip individual failures, continue batch                │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STEP 5: Canonicalize & Hash                                    │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │  For each athlete:                                         │ │   │
│  │  │  1. Extract relevant fields (id, name, dob, pb, etc.)     │ │   │
│  │  │  2. Sort keys deterministically                            │ │   │
│  │  │  3. Compute SHA256 hash of canonical JSON                  │ │   │
│  │  │  4. Compare hash to database                               │ │   │
│  │  │                                                             │ │   │
│  │  │  Example:                                                   │ │   │
│  │  │  canonical = {"id": "123", "name": "...", ...}            │ │   │
│  │  │  data_hash = sha256(json.dumps(canonical, sort_keys=True))│ │   │
│  │  │  = "a3f5c8d9..."                                           │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STEP 6: Upsert to Database (Hash-Guarded)                      │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │  Neon Postgres Database                                   │ │   │
│  │  │  ┌───────────────────────────────────────────────────┐   │ │   │
│  │  │  │  INSERT INTO athletes (...) VALUES (...)           │   │ │   │
│  │  │  │  ON CONFLICT (world_athletics_id) DO UPDATE        │   │ │   │
│  │  │  │  SET name = EXCLUDED.name,                         │   │ │   │
│  │  │  │      data_hash = EXCLUDED.data_hash,               │   │ │   │
│  │  │  │      marathon_rank = EXCLUDED.marathon_rank,       │   │ │   │
│  │  │  │      last_fetched_at = NOW(),                      │   │ │   │
│  │  │  │      ...                                            │   │ │   │
│  │  │  │  WHERE athletes.data_hash IS DISTINCT FROM        │   │ │   │
│  │  │  │        EXCLUDED.data_hash                          │   │ │   │
│  │  │  │     OR athletes.marathon_rank IS DISTINCT FROM    │   │ │   │
│  │  │  │        EXCLUDED.marathon_rank                      │   │ │   │
│  │  │  └───────────────────────────────────────────────────┘   │ │   │
│  │  │                                                             │ │   │
│  │  │  Result:                                                    │ │   │
│  │  │  • If hash & rank match: No write (0 rows updated)         │ │   │
│  │  │  • If hash or rank differ: Update (1 row updated)          │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STEP 7: Mark Dropped Athletes                                  │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │  UPDATE athletes                                           │ │   │
│  │  │  SET last_seen_at = NULL                                   │ │   │
│  │  │  WHERE world_athletics_id NOT IN (current top 100)         │ │   │
│  │  │    AND last_seen_at IS NOT NULL                            │ │   │
│  │  │    AND marathon_rank <= 100                                │ │   │
│  │  │                                                             │ │   │
│  │  │  Preserves historical data for athletes who drop out       │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          │                                               │
│                          ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  STEP 8: Log Statistics & Write Output                          │   │
│  │  ┌───────────────────────────────────────────────────────────┐ │   │
│  │  │  sync_stats.json:                                          │ │   │
│  │  │  {                                                          │ │   │
│  │  │    "start_time": "2025-10-17T02:00:00Z",                   │ │   │
│  │  │    "duration_seconds": 45.2,                               │ │   │
│  │  │    "candidates_found": 20,                                 │ │   │
│  │  │    "new_athletes": 5,                                      │ │   │
│  │  │    "updated_athletes": 10,                                 │ │   │
│  │  │    "unchanged_athletes": 5,                                │ │   │
│  │  │    "dropped_athletes": 2,                                  │ │   │
│  │  │    "fetch_errors": 0,                                      │ │   │
│  │  │    "db_errors": 0,                                         │ │   │
│  │  │    "success": true                                         │ │   │
│  │  │  }                                                          │ │   │
│  │  └───────────────────────────────────────────────────────────┘ │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────────────────┘
                          │
         ┌────────────────┴────────────────┬────────────────┐
         ▼                                 ▼                ▼
┌──────────────────┐            ┌──────────────────┐  ┌──────────────────┐
│  GitHub Actions  │            │  GitHub Issues   │  │  GitHub Commit   │
│  Artifacts       │            │  (on failure)    │  │  Comments        │
│                  │            │                  │  │  (scheduled run) │
│  • sync_stats    │            │  Title:          │  │                  │
│    .json         │            │  "Sync Failed"   │  │  "✅ Sync OK"    │
│  • 30-day        │            │                  │  │  Duration: 45s   │
│    retention     │            │  Body:           │  │  New: 5          │
│                  │            │  • Error details │  │  Updated: 10     │
│                  │            │  • Stack trace   │  │                  │
│                  │            │  • Run link      │  │                  │
└──────────────────┘            └──────────────────┘  └──────────────────┘
```

## Data Flow Diagram

```
World Athletics API          GitHub Actions              Neon Postgres DB
─────────────────           ────────────────           ──────────────────

 Top 100 Rankings                                       Athletes Table
 ┌─────────────┐              Fetch List                ┌──────────────┐
 │ Men (100)   │──────────────────────────────────────▶│ 200+ records │
 │ Women (100) │              (2 requests)              │ Indexed by   │
 └─────────────┘                                        │ WA ID        │
                                                        └──────────────┘
                                  │                            │
                                  ▼                            │
                           ┌─────────────┐                     │
                           │  Compare    │◀────────────────────┘
                           │  Rankings   │    Load snapshot
                           │     vs      │    (1 query)
                           │  Database   │
                           └─────────────┘
                                  │
                                  ▼
                    ┌──────────────────────────┐
                    │  Detect Candidates:      │
                    │  • New (not in DB)       │
                    │  • Rank changed          │
                    │  • Stale (>7 days)       │
                    └──────────────────────────┘
                                  │
                                  ▼
 Athlete Details                                        
 ┌─────────────┐              Fetch Candidates          
 │ Full Profile│◀─────────────────────────────┐         
 │ • Name      │     (N/25 requests)          │         
 │ • DOB       │     (batch size 25)          │         
 │ • PB        │     (200ms delay)            │         
 │ • Headshot  │                              │         
 │ • etc.      │                              │         
 └─────────────┘                              │         
        │                                     │         
        ▼                                     │         
 ┌─────────────┐                             │         
 │ Canonicalize│                              │         
 │ & Hash      │                              │         
 │ SHA256      │                              │         
 └─────────────┘                              │         
        │                                     │         
        ▼                                     │         
                               Upsert         │        Athletes Table
                               (hash-guarded) │        ┌──────────────┐
                         ──────────────────────────────▶│ Updated      │
                         Only write if changed         │ records      │
                                                        │ • data_hash  │
                                                        │ • timestamps │
                                                        └──────────────┘
```

## Error Handling Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    Sync Process Start                         │
└───────────────────────┬──────────────────────────────────────┘
                        │
                        ▼
              ┌─────────────────────┐
              │ Database Connection │
              │ Successful?         │
              └─────────────────────┘
                │              │
          YES   │              │   NO
                ▼              ▼
     ┌──────────────┐    ┌──────────────┐
     │ Continue     │    │ FATAL ERROR  │
     │ Sync         │    │ Create Issue │
     └──────────────┘    │ Exit Code 1  │
                         └──────────────┘
                │
                ▼
     ┌──────────────────────┐
     │ Fetch Rankings       │
     │ Successful?          │
     └──────────────────────┘
                │              │
          YES   │              │   NO
                ▼              ▼
     ┌──────────────┐    ┌──────────────┐
     │ Continue     │    │ Retry with   │
     │              │    │ Backoff      │──┐
     └──────────────┘    │ (5 attempts) │  │
                         └──────────────┘  │
                │                   │      │
                │              FAIL │      │ SUCCESS
                │                   ▼      │
                │            ┌──────────────┐
                │            │ FATAL ERROR  │
                │            │ Create Issue │
                │            │ Exit Code 1  │
                │            └──────────────┘
                │                            │
                └────────────────────────────┘
                │
                ▼
     ┌──────────────────────────┐
     │ Fetch Athlete Details    │
     │ (Individual Request)     │
     └──────────────────────────┘
                │              │
          SUCCESS│              │ FAILURE
                ▼              ▼
     ┌──────────────┐    ┌──────────────┐
     │ Process      │    │ Log Warning  │
     │ Athlete      │    │ Skip Athlete │
     │ Data         │    │ Continue     │──┐
     └──────────────┘    └──────────────┘  │
                │                           │
                └───────────────────────────┘
                │
                ▼
     ┌──────────────────────────┐
     │ Database Write           │
     │ Successful?              │
     └──────────────────────────┘
                │              │
          YES   │              │   NO
                ▼              ▼
     ┌──────────────┐    ┌──────────────┐
     │ Commit       │    │ Rollback     │
     │ Transaction  │    │ Log Error    │
     └──────────────┘    │ Continue     │
                         └──────────────┘
                │
                ▼
     ┌──────────────────────────┐
     │ All Athletes Processed?  │
     └──────────────────────────┘
                │              │
          YES   │              │   NO
                ▼              └──┐
     ┌──────────────┐            │
     │ Write Stats  │◀───────────┘
     │ Upload       │
     │ Artifact     │
     └──────────────┘
                │
                ▼
     ┌──────────────────────────┐
     │ Check Error Count        │
     │ fetch_errors > 0 OR      │
     │ db_errors > 0?           │
     └──────────────────────────┘
                │              │
          NO    │              │   YES
                ▼              ▼
     ┌──────────────┐    ┌──────────────┐
     │ SUCCESS      │    │ PARTIAL FAIL │
     │ Post Comment │    │ Create Issue │
     │ Exit Code 0  │    │ Exit Code 1  │
     └──────────────┘    └──────────────┘
```

## Monitoring Dashboard (SQL Queries)

```sql
-- Real-time Sync Health Dashboard

-- 1. Top-100 Coverage by Gender
SELECT 
  gender,
  COUNT(*) as total_athletes,
  COUNT(*) FILTER (WHERE last_seen_at IS NOT NULL) as currently_in_top_100,
  COUNT(*) FILTER (WHERE last_seen_at IS NULL AND marathon_rank <= 100) as dropped_from_top_100
FROM athletes
WHERE ranking_source = 'world_marathon'
GROUP BY gender;

-- 2. Last Sync Time
SELECT 
  gender,
  MAX(last_fetched_at) as last_successful_sync,
  COUNT(*) FILTER (WHERE last_fetched_at > NOW() - INTERVAL '48 hours') as synced_recently
FROM athletes
WHERE ranking_source = 'world_marathon'
GROUP BY gender;

-- 3. Stale Data Alert (>7 days)
SELECT 
  gender,
  COUNT(*) as stale_athletes,
  MIN(last_fetched_at) as oldest_data_date
FROM athletes
WHERE ranking_source = 'world_marathon'
  AND last_fetched_at < NOW() - INTERVAL '7 days'
  AND last_seen_at IS NOT NULL
GROUP BY gender;

-- 4. Recent Changes (last 24 hours)
SELECT 
  name,
  gender,
  marathon_rank,
  updated_at,
  CASE 
    WHEN created_at > NOW() - INTERVAL '24 hours' THEN 'NEW'
    ELSE 'UPDATED'
  END as change_type
FROM athletes
WHERE updated_at > NOW() - INTERVAL '24 hours'
  AND ranking_source = 'world_marathon'
ORDER BY updated_at DESC
LIMIT 20;

-- 5. Data Hash Distribution (uniqueness check)
SELECT 
  COUNT(DISTINCT data_hash) as unique_hashes,
  COUNT(*) as total_athletes,
  COUNT(*) - COUNT(DISTINCT data_hash) as duplicate_hashes
FROM athletes
WHERE ranking_source = 'world_marathon';
```

## Performance Timeline

```
Time (s)  Event                                    Cumulative API Calls
─────────────────────────────────────────────────────────────────────
0.0       ▶ Start sync process                     0
0.5       │ Fetch men's rankings                   1
1.0       │ Fetch women's rankings                 2
1.5       │ Load DB snapshot (query)               2
2.0       │ Detect candidates: 50 found            2
          │
2.5       ├─ Batch 1 (25 athletes)
3.0       │  ├─ Athlete 1                          3
3.2       │  ├─ Athlete 2                          4
3.4       │  ├─ Athlete 3                          5
...       │  ... (200ms between each)
8.0       │  └─ Athlete 25                         27
8.5       │  └─ Commit batch to DB                 27
          │
9.0       ├─ Batch 2 (25 athletes)
...       │  ... (same pattern)
14.0      │  └─ Commit batch to DB                 52
          │
15.0      ├─ Mark dropped athletes                 52
15.5      ├─ Write statistics                      52
16.0      ▶ Sync complete                          52

Total Duration: 16 seconds
Total API Calls: 52 (2 rankings + 50 details)
Total DB Writes: 50 (only changed athletes)
```

## Success Indicators

```
✅ Sync Healthy                    ⚠️ Sync Degraded                  ❌ Sync Failed
─────────────────                 ──────────────────                 ─────────────
• Duration < 60s                  • Duration 60-120s                • Duration > 120s
• Fetch errors = 0                • Fetch errors 1-5                • Fetch errors > 5
• DB errors = 0                   • DB errors 1-2                   • DB errors > 2
• All top-100 synced              • 95-99% top-100 synced           • < 95% synced
• Last run < 48h ago              • Last run 48-96h ago             • Last run > 96h ago
• No stale data                   • Some stale data (< 10%)         • Much stale (> 10%)
• Issue count = 0                 • 1-2 recent issues               • 3+ recent issues
```

---

**Visual Guide Version**: 1.0.0  
**Last Updated**: October 17, 2025  
**See Also**: docs/SYNC_TOP_100.md
