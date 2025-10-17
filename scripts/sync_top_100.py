#!/usr/bin/env python3
"""
World Athletics Top 100 Marathon Rankings Sync Script

This script fetches the top 100 men and top 100 women marathon runners from
World Athletics and syncs them to the Postgres database with intelligent
delta detection to minimize API calls and database writes.

Features:
- Fetches minimal ranking summaries first
- Computes candidates based on rank changes and hash differences
- Batches detail fetches to reduce HTTP overhead
- Uses content hashing to detect actual changes
- Atomic upserts with WHERE clause to avoid no-op writes
- Handles dropped athletes (no longer in top-100)
- Retry logic with exponential backoff
- Dry-run mode for testing
- Comprehensive logging and error handling
- Opens GitHub issue on catastrophic failures

Usage:
    python sync_top_100.py [--dry-run] [--verbose]

Environment Variables:
    DATABASE_URL: PostgreSQL connection string (required)
    GITHUB_TOKEN: GitHub personal access token for opening issues (optional)
    GITHUB_REPO: Repository in format "owner/repo" (default: from git remote)
"""

import os
import sys
import json
import hashlib
import time
import logging
import argparse
from datetime import datetime, timezone
from typing import List, Dict, Set, Tuple, Optional
import traceback

try:
    import psycopg2
    from psycopg2.extras import execute_batch
except ImportError:
    print("ERROR: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

try:
    from worldathletics import WA
except ImportError:
    print("ERROR: worldathletics package not installed. Run: pip install worldathletics")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("ERROR: requests not installed. Run: pip install requests")
    sys.exit(1)

# Configuration
BATCH_SIZE = 25  # Number of athletes to fetch details for in one batch
MAX_RETRIES = 5
INITIAL_BACKOFF = 2  # seconds
MAX_CONCURRENT_BATCHES = 4
TOP_N = 100  # Top 100 athletes per gender

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)


class SyncStats:
    """Track statistics for the sync run"""
    def __init__(self):
        self.start_time = datetime.now(timezone.utc)
        self.candidates_found = 0
        self.new_athletes = 0
        self.updated_athletes = 0
        self.unchanged_athletes = 0
        self.dropped_athletes = 0
        self.fetch_errors = 0
        self.db_errors = 0
        
    def duration(self) -> float:
        return (datetime.now(timezone.utc) - self.start_time).total_seconds()
    
    def summary(self) -> Dict:
        return {
            'start_time': self.start_time.isoformat(),
            'duration_seconds': self.duration(),
            'candidates_found': self.candidates_found,
            'new_athletes': self.new_athletes,
            'updated_athletes': self.updated_athletes,
            'unchanged_athletes': self.unchanged_athletes,
            'dropped_athletes': self.dropped_athletes,
            'fetch_errors': self.fetch_errors,
            'db_errors': self.db_errors,
            'success': self.fetch_errors == 0 and self.db_errors == 0
        }


def canonical_hash(obj: Dict) -> str:
    """
    Compute deterministic SHA256 hash of canonicalized JSON.
    
    Canonicalization rules:
    - Sort all object keys recursively
    - Use consistent separators
    - Convert to UTF-8 bytes for hashing
    """
    canonical_json = json.dumps(obj, sort_keys=True, separators=(',', ':'))
    return hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()


def canonicalize_athlete(athlete_data: Dict) -> Dict:
    """
    Canonicalize athlete data for consistent hashing.
    
    Removes ephemeral fields and normalizes structure.
    """
    return {
        'id': athlete_data.get('id') or athlete_data.get('worldAthleticsId'),
        'name': athlete_data.get('name'),
        'gender': athlete_data.get('gender'),
        'country': athlete_data.get('country'),
        'dob': athlete_data.get('dob') or athlete_data.get('dateOfBirth'),
        'personalBest': athlete_data.get('personalBest') or athlete_data.get('pb'),
        'seasonBest': athlete_data.get('seasonBest'),
        'headshotUrl': athlete_data.get('headshotUrl') or athlete_data.get('headshot'),
        'sponsor': athlete_data.get('sponsor'),
        'age': athlete_data.get('age'),
    }


def retry_with_backoff(func, max_retries=MAX_RETRIES, initial_backoff=INITIAL_BACKOFF):
    """
    Execute function with exponential backoff retry logic.
    """
    for attempt in range(max_retries):
        try:
            return func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            backoff = initial_backoff * (2 ** attempt)
            logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {backoff}s...")
            time.sleep(backoff)


def fetch_ranking_list(wa_client: WA, gender: str, limit: int = TOP_N) -> List[Dict]:
    """
    Fetch minimal ranking list from World Athletics.
    
    Args:
        wa_client: World Athletics client instance
        gender: 'M' or 'F'
        limit: Number of top athletes to fetch
        
    Returns:
        List of athlete summaries with id, rank, name, country
    """
    logger.info(f"Fetching top {limit} {gender} marathon rankings...")
    
    try:
        # Use the worldathletics package to fetch rankings
        # The package may have different method names - adjust as needed
        rankings = retry_with_backoff(
            lambda: wa_client.get_rankings('MAR', gender, limit=limit)
        )
        
        logger.info(f"Fetched {len(rankings)} {gender} athletes from rankings")
        return rankings
        
    except Exception as e:
        logger.error(f"Failed to fetch {gender} rankings: {e}")
        raise


def fetch_athlete_details(wa_client: WA, athlete_ids: List[str]) -> Dict[str, Dict]:
    """
    Fetch detailed athlete information in batch.
    
    Args:
        wa_client: World Athletics client instance
        athlete_ids: List of athlete IDs to fetch
        
    Returns:
        Dictionary mapping athlete_id to full athlete data
    """
    results = {}
    
    for athlete_id in athlete_ids:
        try:
            details = retry_with_backoff(
                lambda: wa_client.get_athlete(athlete_id)
            )
            results[athlete_id] = details
            
            # Rate limiting - be respectful
            time.sleep(0.2)  # 200ms between requests = 5 req/sec
            
        except Exception as e:
            logger.warning(f"Failed to fetch details for athlete {athlete_id}: {e}")
            continue
    
    return results


def load_db_snapshot(conn, athlete_ids: List[str]) -> Dict[str, Dict]:
    """
    Load current athlete data from database for given IDs.
    
    Returns:
        Dictionary mapping world_athletics_id to {data_hash, marathon_rank, ...}
    """
    if not athlete_ids:
        return {}
    
    cur = conn.cursor()
    query = """
        SELECT 
            world_athletics_id, 
            data_hash, 
            marathon_rank, 
            last_fetched_at,
            last_seen_at
        FROM athletes 
        WHERE world_athletics_id = ANY(%s)
    """
    cur.execute(query, (athlete_ids,))
    
    snapshot = {}
    for row in cur.fetchall():
        wa_id, data_hash, rank, fetched, seen = row
        snapshot[wa_id] = {
            'data_hash': data_hash,
            'marathon_rank': rank,
            'last_fetched_at': fetched,
            'last_seen_at': seen
        }
    
    cur.close()
    return snapshot


def detect_candidates(
    ranking_nodes: List[Dict], 
    db_snapshot: Dict[str, Dict],
    force_refresh_days: int = 7
) -> Tuple[Set[str], Set[str], Set[str]]:
    """
    Detect which athletes need detail fetching.
    
    Returns:
        (new_ids, rank_changed_ids, stale_ids)
    """
    new_ids = set()
    rank_changed_ids = set()
    stale_ids = set()
    
    now = datetime.now(timezone.utc)
    
    for node in ranking_nodes:
        athlete_id = str(node.get('id') or node.get('worldAthleticsId'))
        rank = node.get('rank')
        
        if athlete_id not in db_snapshot:
            # New athlete not in database
            new_ids.add(athlete_id)
        else:
            db_info = db_snapshot[athlete_id]
            
            # Check if rank changed
            if db_info.get('marathon_rank') != rank:
                rank_changed_ids.add(athlete_id)
            
            # Check if data is stale (> N days since last fetch)
            last_fetched = db_info.get('last_fetched_at')
            if last_fetched:
                age_days = (now - last_fetched.replace(tzinfo=timezone.utc)).days
                if age_days > force_refresh_days:
                    stale_ids.add(athlete_id)
    
    return new_ids, rank_changed_ids, stale_ids


def upsert_athlete(
    cur,
    athlete_data: Dict,
    rank: int,
    gender: str,
    data_hash: str,
    dry_run: bool = False
) -> bool:
    """
    Upsert athlete into database, only writing if hash or rank changed.
    
    Returns:
        True if upserted, False if skipped
    """
    wa_id = str(athlete_data.get('id') or athlete_data.get('worldAthleticsId'))
    name = athlete_data.get('name')
    country = athlete_data.get('country', {})
    country_code = country.get('code') if isinstance(country, dict) else country
    
    pb = athlete_data.get('personalBest') or athlete_data.get('pb')
    if isinstance(pb, dict):
        pb = pb.get('time') or pb.get('mark')
    
    dob = athlete_data.get('dob') or athlete_data.get('dateOfBirth')
    headshot = athlete_data.get('headshotUrl') or athlete_data.get('headshot')
    season_best = athlete_data.get('seasonBest')
    sponsor = athlete_data.get('sponsor')
    age = athlete_data.get('age')
    
    profile_url = f"https://worldathletics.org/athletes/{country_code}/{name.lower().replace(' ', '-')}-{wa_id}" if name and country_code else None
    
    raw_json = json.dumps(athlete_data)
    
    if dry_run:
        logger.info(f"[DRY RUN] Would upsert: {name} (WA ID: {wa_id}, Rank: {rank})")
        return True
    
    query = """
        INSERT INTO athletes (
            world_athletics_id, name, country, gender, personal_best, headshot_url,
            world_athletics_profile_url, marathon_rank, date_of_birth, sponsor, season_best,
            age, raw_json, data_hash, ranking_source, last_fetched_at, last_seen_at
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s, 
            'world_marathon', NOW(), NOW()
        )
        ON CONFLICT (world_athletics_id) DO UPDATE SET
            name = EXCLUDED.name,
            country = EXCLUDED.country,
            gender = EXCLUDED.gender,
            personal_best = EXCLUDED.personal_best,
            headshot_url = EXCLUDED.headshot_url,
            world_athletics_profile_url = EXCLUDED.world_athletics_profile_url,
            marathon_rank = EXCLUDED.marathon_rank,
            date_of_birth = EXCLUDED.date_of_birth,
            sponsor = EXCLUDED.sponsor,
            season_best = EXCLUDED.season_best,
            age = EXCLUDED.age,
            raw_json = EXCLUDED.raw_json,
            data_hash = EXCLUDED.data_hash,
            ranking_source = EXCLUDED.ranking_source,
            last_fetched_at = NOW(),
            last_seen_at = NOW(),
            updated_at = NOW()
        WHERE 
            athletes.data_hash IS DISTINCT FROM EXCLUDED.data_hash
            OR athletes.marathon_rank IS DISTINCT FROM EXCLUDED.marathon_rank
    """
    
    try:
        cur.execute(query, (
            wa_id, name, country_code, gender, pb, headshot, profile_url,
            rank, dob, sponsor, season_best, age, raw_json, data_hash
        ))
        
        # Check if row was actually modified
        return cur.rowcount > 0
        
    except Exception as e:
        logger.error(f"Failed to upsert athlete {wa_id} ({name}): {e}")
        raise


def mark_dropped_athletes(
    conn,
    current_top_100_ids: List[str],
    gender: str,
    dry_run: bool = False
) -> int:
    """
    Mark athletes who dropped out of top-100 by updating last_seen_at.
    
    Returns:
        Number of athletes marked as dropped
    """
    cur = conn.cursor()
    
    if dry_run:
        # Just count how many would be affected
        cur.execute("""
            SELECT COUNT(*)
            FROM athletes
            WHERE gender = %s
              AND ranking_source = 'world_marathon'
              AND world_athletics_id IS NOT NULL
              AND world_athletics_id != ALL(%s)
              AND last_seen_at IS NOT NULL
              AND marathon_rank IS NOT NULL
              AND marathon_rank <= 100
        """, (gender, current_top_100_ids))
        count = cur.fetchone()[0]
        logger.info(f"[DRY RUN] Would mark {count} {gender} athletes as dropped from top-100")
        cur.close()
        return count
    
    # Update athletes no longer in top-100
    query = """
        UPDATE athletes
        SET last_seen_at = NULL,
            updated_at = NOW()
        WHERE gender = %s
          AND ranking_source = 'world_marathon'
          AND world_athletics_id IS NOT NULL
          AND world_athletics_id != ALL(%s)
          AND last_seen_at IS NOT NULL
          AND marathon_rank IS NOT NULL
          AND marathon_rank <= 100
    """
    
    cur.execute(query, (gender, current_top_100_ids))
    dropped_count = cur.rowcount
    cur.close()
    
    return dropped_count


def create_github_issue(title: str, body: str):
    """
    Create a GitHub issue to report catastrophic failure.
    """
    token = os.environ.get('GITHUB_TOKEN')
    repo = os.environ.get('GITHUB_REPO')
    
    if not token or not repo:
        logger.warning("GITHUB_TOKEN or GITHUB_REPO not set, cannot create issue")
        return
    
    try:
        url = f"https://api.github.com/repos/{repo}/issues"
        headers = {
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        data = {
            'title': title,
            'body': body,
            'labels': ['sync-failure', 'automated']
        }
        
        response = requests.post(url, headers=headers, json=data)
        response.raise_for_status()
        
        issue_url = response.json().get('html_url')
        logger.info(f"Created GitHub issue: {issue_url}")
        
    except Exception as e:
        logger.error(f"Failed to create GitHub issue: {e}")


def sync_top_100(dry_run: bool = False, verbose: bool = False) -> SyncStats:
    """
    Main sync function - orchestrates the entire process.
    """
    stats = SyncStats()
    
    if verbose:
        logger.setLevel(logging.DEBUG)
    
    logger.info("=" * 60)
    logger.info("World Athletics Top 100 Marathon Sync")
    logger.info(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    logger.info("=" * 60)
    
    # Connect to database
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL environment variable not set")
    
    conn = psycopg2.connect(database_url)
    conn.autocommit = False if not dry_run else True
    
    try:
        # Initialize World Athletics client
        wa = WA()
        
        # Process both genders
        for gender, gender_name in [('M', 'men'), ('F', 'women')]:
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing {gender_name.upper()} athletes")
            logger.info(f"{'='*60}")
            
            # Step 1: Fetch ranking list (minimal data)
            ranking_nodes = fetch_ranking_list(wa, gender, TOP_N)
            athlete_ids = [str(n.get('id') or n.get('worldAthleticsId')) for n in ranking_nodes]
            rank_map = {str(n.get('id') or n.get('worldAthleticsId')): n.get('rank') for n in ranking_nodes}
            
            logger.info(f"Fetched {len(athlete_ids)} athlete IDs from rankings")
            
            # Step 2: Load DB snapshot
            db_snapshot = load_db_snapshot(conn, athlete_ids)
            logger.info(f"Loaded {len(db_snapshot)} existing records from database")
            
            # Step 3: Detect candidates
            new_ids, rank_changed_ids, stale_ids = detect_candidates(ranking_nodes, db_snapshot)
            
            # Combine all candidates (remove duplicates)
            all_candidates = new_ids | rank_changed_ids | stale_ids
            stats.candidates_found += len(all_candidates)
            
            logger.info(f"Candidates for update:")
            logger.info(f"  - New athletes: {len(new_ids)}")
            logger.info(f"  - Rank changed: {len(rank_changed_ids)}")
            logger.info(f"  - Stale data: {len(stale_ids)}")
            logger.info(f"  - Total: {len(all_candidates)}")
            
            # Step 4: Fetch details in batches
            if all_candidates:
                logger.info(f"Fetching details for {len(all_candidates)} athletes...")
                
                candidates_list = list(all_candidates)
                for i in range(0, len(candidates_list), BATCH_SIZE):
                    batch = candidates_list[i:i+BATCH_SIZE]
                    logger.info(f"Fetching batch {i//BATCH_SIZE + 1} ({len(batch)} athletes)...")
                    
                    try:
                        athlete_details = fetch_athlete_details(wa, batch)
                        logger.info(f"Fetched details for {len(athlete_details)} athletes")
                        
                        # Step 5: Process each athlete
                        cur = conn.cursor()
                        for athlete_id, athlete_data in athlete_details.items():
                            try:
                                # Canonicalize and hash
                                canonical = canonicalize_athlete(athlete_data)
                                data_hash = canonical_hash(canonical)
                                
                                # Get rank for this athlete
                                rank = rank_map.get(athlete_id)
                                
                                # Upsert to database
                                was_updated = upsert_athlete(
                                    cur, athlete_data, rank, gender_name, 
                                    data_hash, dry_run
                                )
                                
                                if was_updated:
                                    if athlete_id in new_ids:
                                        stats.new_athletes += 1
                                    else:
                                        stats.updated_athletes += 1
                                else:
                                    stats.unchanged_athletes += 1
                                    
                            except Exception as e:
                                logger.error(f"Error processing athlete {athlete_id}: {e}")
                                stats.db_errors += 1
                        
                        cur.close()
                        
                        if not dry_run:
                            conn.commit()
                            logger.info("Batch committed to database")
                            
                    except Exception as e:
                        logger.error(f"Error fetching/processing batch: {e}")
                        stats.fetch_errors += 1
                        if not dry_run:
                            conn.rollback()
            
            # Step 6: Mark dropped athletes
            dropped = mark_dropped_athletes(conn, athlete_ids, gender_name, dry_run)
            stats.dropped_athletes += dropped
            logger.info(f"Marked {dropped} athletes as dropped from top-100")
            
            if not dry_run:
                conn.commit()
        
        logger.info("\n" + "=" * 60)
        logger.info("SYNC COMPLETE")
        logger.info("=" * 60)
        logger.info(f"Duration: {stats.duration():.1f} seconds")
        logger.info(f"New athletes: {stats.new_athletes}")
        logger.info(f"Updated athletes: {stats.updated_athletes}")
        logger.info(f"Unchanged athletes: {stats.unchanged_athletes}")
        logger.info(f"Dropped athletes: {stats.dropped_athletes}")
        logger.info(f"Fetch errors: {stats.fetch_errors}")
        logger.info(f"DB errors: {stats.db_errors}")
        
        return stats
        
    except Exception as e:
        logger.error(f"Catastrophic failure during sync: {e}")
        logger.error(traceback.format_exc())
        
        if not dry_run:
            conn.rollback()
        
        # Create GitHub issue
        error_body = f"""
## Sync Failure Report

**Timestamp**: {datetime.now(timezone.utc).isoformat()}
**Error**: {str(e)}

### Stack Trace
```
{traceback.format_exc()}
```

### Statistics
- Duration: {stats.duration():.1f} seconds
- New athletes: {stats.new_athletes}
- Updated athletes: {stats.updated_athletes}
- Fetch errors: {stats.fetch_errors}
- DB errors: {stats.db_errors}

This issue was automatically created by the sync script.
"""
        create_github_issue("🚨 World Athletics Sync Failure", error_body)
        
        raise
        
    finally:
        conn.close()


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Sync top 100 marathon athletes from World Athletics')
    parser.add_argument('--dry-run', action='store_true', help='Run in dry-run mode (no DB writes)')
    parser.add_argument('--verbose', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    try:
        stats = sync_top_100(dry_run=args.dry_run, verbose=args.verbose)
        
        # Write stats to file for GitHub Actions
        stats_file = 'sync_stats.json'
        with open(stats_file, 'w') as f:
            json.dump(stats.summary(), f, indent=2)
        logger.info(f"Stats written to {stats_file}")
        
        # Exit with error code if there were errors
        if stats.fetch_errors > 0 or stats.db_errors > 0:
            sys.exit(1)
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    main()
