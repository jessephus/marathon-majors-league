#!/usr/bin/env python3
"""
Backfill Athlete Progression and Race Results

This script fetches progression data and race results for all existing athletes
in the database. It's designed to be run once to populate historical data for
athletes that were added before this feature existed.

The script:
1. Fetches all athletes from the database
2. Iterates through each athlete slowly (with delays to be polite)
3. Fetches progression and 2025 race results from their World Athletics profile
4. Saves the data to athlete_progression and athlete_race_results tables

Usage:
    python3 scripts/backfill_athlete_progression.py [--dry-run] [--limit N] [--start-from ID]
    
Options:
    --dry-run       Show what would be fetched without saving to database
    --limit N       Only process N athletes (for testing)
    --start-from ID Start from a specific athlete database ID (for resuming)
    --delay N       Delay between athletes in seconds (default: 5)
"""

import os
import sys
import time
import argparse
from pathlib import Path
from typing import List, Dict, Optional

# Add parent directory to path to import from extract_athlete_progression
sys.path.insert(0, str(Path(__file__).parent))

# Import database support
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("Error: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

# Import functions from extract_athlete_progression
try:
    from extract_athlete_progression import (
        fetch_and_save_progression_data,
        load_env_file
    )
except ImportError as e:
    print(f"Error importing from extract_athlete_progression: {e}")
    sys.exit(1)

# Load environment variables
load_env_file()

# Configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable not set")
    print("Create a .env file in the project root with: DATABASE_URL=postgresql://...")
    sys.exit(1)

DEFAULT_DELAY = 5  # Seconds between athlete fetches


def get_db_connection():
    """Get database connection."""
    return psycopg2.connect(DATABASE_URL)


def fetch_all_athletes(conn, start_from_id: Optional[int] = None) -> List[Dict]:
    """
    Fetch all athletes from database that have a World Athletics ID.
    
    Args:
        conn: Database connection
        start_from_id: Optional athlete ID to start from (for resuming)
        
    Returns:
        List of athlete dictionaries with id, name, world_athletics_id
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if start_from_id:
            cur.execute("""
                SELECT id, name, world_athletics_id, gender, country
                FROM athletes
                WHERE world_athletics_id IS NOT NULL
                  AND id >= %s
                ORDER BY id
            """, (start_from_id,))
        else:
            cur.execute("""
                SELECT id, name, world_athletics_id, gender, country
                FROM athletes
                WHERE world_athletics_id IS NOT NULL
                ORDER BY id
            """)
        
        return [dict(row) for row in cur.fetchall()]


def check_existing_data(conn, athlete_db_id: int) -> Dict[str, int]:
    """
    Check how much progression and race result data already exists for an athlete.
    
    Args:
        conn: Database connection
        athlete_db_id: Database ID of the athlete
        
    Returns:
        Dict with counts of existing progression and race_results
    """
    with conn.cursor() as cur:
        # Count progression records
        cur.execute("""
            SELECT COUNT(*) FROM athlete_progression WHERE athlete_id = %s
        """, (athlete_db_id,))
        progression_count = cur.fetchone()[0]
        
        # Count race results
        cur.execute("""
            SELECT COUNT(*) FROM athlete_race_results WHERE athlete_id = %s
        """, (athlete_db_id,))
        results_count = cur.fetchone()[0]
        
        return {
            'progression': progression_count,
            'race_results': results_count
        }


def backfill_all_athletes(
    limit: Optional[int] = None,
    start_from_id: Optional[int] = None,
    dry_run: bool = False,
    delay: int = DEFAULT_DELAY,
    skip_existing: bool = False
):
    """
    Backfill progression data for all athletes in database.
    
    Args:
        limit: Optional limit on number of athletes to process
        start_from_id: Optional athlete ID to start from
        dry_run: If True, don't save to database
        delay: Seconds to wait between athletes
        skip_existing: If True, skip athletes that already have data
    """
    conn = get_db_connection()
    
    try:
        # Fetch all athletes
        print("=" * 80)
        print("ATHLETE PROGRESSION BACKFILL")
        print("=" * 80)
        print(f"Mode: {'DRY RUN' if dry_run else 'LIVE UPDATE'}")
        print(f"Delay: {delay} seconds between athletes")
        if skip_existing:
            print("Skip Strategy: Athletes with existing data will be skipped")
        if limit:
            print(f"Limit: Processing only {limit} athletes")
        if start_from_id:
            print(f"Starting from: Athlete DB ID {start_from_id}")
        print("=" * 80)
        
        athletes = fetch_all_athletes(conn, start_from_id)
        total_count = len(athletes)
        
        if limit:
            athletes = athletes[:limit]
        
        print(f"\nFound {total_count} athletes with World Athletics IDs")
        print(f"Processing {len(athletes)} athletes\n")
        
        # Statistics
        stats = {
            'processed': 0,
            'skipped': 0,
            'successful': 0,
            'failed': 0,
            'total_progression': 0,
            'total_results': 0
        }
        
        # Process each athlete
        for i, athlete in enumerate(athletes, 1):
            athlete_id = athlete['world_athletics_id']
            athlete_db_id = athlete['id']
            name = athlete['name']
            
            print(f"\n[{i}/{len(athletes)}] Processing {name} (ID: {athlete_id}, DB_ID: {athlete_db_id})")
            
            # Check existing data
            existing = check_existing_data(conn, athlete_db_id)
            
            if skip_existing and (existing['progression'] > 0 or existing['race_results'] > 0):
                print(f"  ⏭️  Skipping - already has {existing['progression']} progression records and {existing['race_results']} race results")
                stats['skipped'] += 1
                continue
            
            if existing['progression'] > 0 or existing['race_results'] > 0:
                print(f"  ℹ️  Athlete already has {existing['progression']} progression records and {existing['race_results']} race results (will update)")
            
            try:
                # Fetch and save progression data
                progression, race_results, prog_saved, results_saved = fetch_and_save_progression_data(
                    athlete_id=athlete_id,
                    athlete_db_id=athlete_db_id,
                    disciplines_filter=["Marathon", "Half Marathon"],  # Focus on marathon events
                    save_to_db=not dry_run
                )
                
                stats['processed'] += 1
                stats['successful'] += 1
                stats['total_progression'] += prog_saved
                stats['total_results'] += results_saved
                
                if dry_run:
                    print(f"  🔍 DRY RUN - Would save {len(progression)} progression events and {len(race_results)} race results")
                
            except Exception as e:
                print(f"  ❌ Error processing athlete: {e}")
                stats['failed'] += 1
                stats['processed'] += 1
            
            # Be polite - delay before next athlete
            if i < len(athletes):
                print(f"  ⏳ Waiting {delay} seconds before next athlete...")
                time.sleep(delay)
        
        # Print summary
        print("\n" + "=" * 80)
        print("BACKFILL COMPLETE")
        print("=" * 80)
        print(f"📊 Statistics:")
        print(f"   Total athletes in database: {total_count}")
        print(f"   Athletes processed: {stats['processed']}")
        print(f"   Successful: {stats['successful']}")
        print(f"   Failed: {stats['failed']}")
        print(f"   Skipped: {stats['skipped']}")
        print(f"   Total progression records saved: {stats['total_progression']}")
        print(f"   Total race results saved: {stats['total_results']}")
        
        if dry_run:
            print(f"\n🔍 This was a DRY RUN - no changes were made to the database")
        
    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser(
        description='Backfill progression data for all athletes in database',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Dry run to see what would happen
  %(prog)s --dry-run
  
  # Process only 10 athletes for testing
  %(prog)s --limit 10
  
  # Skip athletes that already have data
  %(prog)s --skip-existing
  
  # Resume from a specific athlete ID
  %(prog)s --start-from 100
  
  # Full backfill with 3 second delay
  %(prog)s --delay 3
        """
    )
    
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be fetched without saving to database'
    )
    
    parser.add_argument(
        '--limit',
        type=int,
        help='Only process N athletes (for testing)'
    )
    
    parser.add_argument(
        '--start-from',
        type=int,
        help='Start from a specific athlete database ID (for resuming)'
    )
    
    parser.add_argument(
        '--delay',
        type=int,
        default=DEFAULT_DELAY,
        help=f'Delay between athletes in seconds (default: {DEFAULT_DELAY})'
    )
    
    parser.add_argument(
        '--skip-existing',
        action='store_true',
        help='Skip athletes that already have progression or race result data'
    )
    
    args = parser.parse_args()
    
    # Run backfill
    backfill_all_athletes(
        limit=args.limit,
        start_from_id=args.start_from,
        dry_run=args.dry_run,
        delay=args.delay,
        skip_existing=args.skip_existing
    )


if __name__ == '__main__':
    main()
