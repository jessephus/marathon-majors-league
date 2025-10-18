#!/usr/bin/env python3
"""
Unified World Athletics Top 100 Marathon Athletes Sync Script

This script combines all the logic needed to:
1. Scrape top 100 men and women from World Athletics World Rankings
2. Extract athlete IDs and profile URLs from the rankings page
3. Fetch detailed athlete data from profile pages (headshots, rankings, etc.)
4. Compare with existing database and only update changed records
5. Update the Neon Postgres database with new/changed athlete data

Usage:
    python3 scripts/sync_athletes_from_rankings.py [--dry-run] [--limit N]

Options:
    --dry-run       Show what would be updated without making changes
    --limit N       Limit to top N athletes per gender (default: 100)
"""

import os
import sys
import json
import time
import hashlib
import argparse
import re
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from urllib.parse import urljoin
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# Database imports
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("Error: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

# Load environment variables from .env file if it exists (for local development)
def load_env_file():
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ.setdefault(key.strip(), value.strip())

load_env_file()

# Configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable not set")
    print("Create a .env file in the project root with: DATABASE_URL=postgresql://...")
    sys.exit(1)

BASE_URL = "https://worldathletics.org"
RANKING_URL_TEMPLATE = f"{BASE_URL}/world-rankings/marathon/{{gender}}?regionType=world&page={{page}}&rankDate={{rank_date}}&limitByCountry=0"
REQUEST_TIMEOUT = 30
DELAY_BETWEEN_REQUESTS = 2  # Be polite to the server
DELAY_BETWEEN_PROFILES = 3  # Even more polite for profile fetches

# ============================================================================
# PART 1: EXTRACTING RANKINGS
# ============================================================================

def get_recent_tuesday() -> str:
    """Get the most recent Tuesday (when rankings update)."""
    today = datetime.now()
    days_since_tuesday = (today.weekday() - 1) % 7
    recent_tuesday = today - timedelta(days=days_since_tuesday)
    return recent_tuesday.strftime('%Y-%m-%d')


def scrape_rankings_page(gender: str, page: int, rank_date: str) -> List[Dict]:
    """
    Scrape a single page of World Rankings.
    
    Returns list of athlete dictionaries with basic data from rankings table.
    """
    url = RANKING_URL_TEMPLATE.format(gender=gender, page=page, rank_date=rank_date)
    print(f"  Fetching page {page}: {url}")
    
    try:
        response = requests.get(url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Each athlete row has a data-athlete-url attribute
        rows = soup.select('table tr[data-athlete-url]')
        
        if not rows:
            print(f"  No athlete rows found on page {page}")
            return []
        
        athletes = []
        for row in rows:
            try:
                # Extract athlete profile URL and ID from data-athlete-url
                profile_url = row.get('data-athlete-url')
                athlete_id = None
                full_profile_url = None
                
                if profile_url:
                    full_profile_url = urljoin(BASE_URL, profile_url)
                    # Example: /athletes/kenya/eliud-kipchoge-14208194
                    parts = profile_url.split('/')[-1].split('-')
                    for part in reversed(parts):
                        if part.isdigit() and len(part) >= 7:
                            athlete_id = part
                            break
                
                cells = row.select('td')
                if len(cells) < 5:
                    continue
                
                # Extract data from table cells
                rank_text = cells[0].get_text(strip=True)
                if not rank_text.isdigit():
                    continue
                
                rank = int(rank_text)
                name = cells[1].get_text(strip=True)
                dob = cells[2].get_text(strip=True) if len(cells) > 2 else None
                
                # Country - extract 3-letter code
                country = cells[3].get_text(strip=True)
                if country:
                    country = country.split()[0]  # Take first code if multiple
                
                # World Athletics Score (column 4) - their rolling 18-month score
                wa_score = cells[4].get_text(strip=True) if len(cells) > 4 else None
                # Convert to integer if present
                try:
                    wa_score = int(wa_score) if wa_score else None
                except ValueError:
                    wa_score = None
                
                athlete_data = {
                    'rank': rank,
                    'name': name,
                    'country': country,
                    'dob': dob,
                    'world_athletics_marathon_ranking_score': wa_score,
                    'world_athletics_id': athlete_id,
                    'profile_url': full_profile_url,
                    'gender': gender  # Store as 'men' or 'women' to match database constraint
                }
                
                athletes.append(athlete_data)
                print(f"    {rank}. {name} ({country}) - ID: {athlete_id or 'N/A'}")
                
            except Exception as e:
                print(f"    Warning: Error parsing row: {e}")
                continue
        
        print(f"  Extracted {len(athletes)} athletes from page {page}")
        return athletes
        
    except requests.RequestException as e:
        print(f"  Error fetching page {page}: {e}")
        return []


def scrape_all_rankings(gender: str, limit: int = 100) -> List[Dict]:
    """
    Scrape all pages needed to get top N athletes.
    
    Returns complete list of athletes with basic ranking data.
    """
    rank_date = get_recent_tuesday()
    print(f"\nExtracting {gender}'s marathon world rankings (limit: {limit})...")
    print(f"Using rank date: {rank_date}")
    
    all_athletes = []
    page = 1
    max_pages = (limit // 50) + 2  # Safety margin
    
    while len(all_athletes) < limit and page <= max_pages:
        page_athletes = scrape_rankings_page(gender, page, rank_date)
        
        if not page_athletes:
            break
        
        all_athletes.extend(page_athletes)
        
        # Stop if we have enough
        if len(all_athletes) >= limit:
            all_athletes = all_athletes[:limit]
            break
        
        # Be polite to the server
        time.sleep(DELAY_BETWEEN_REQUESTS)
        page += 1
    
    print(f"Total extracted: {len(all_athletes)} {gender}")
    return all_athletes


def find_dropped_athletes(gender: str, existing_athlete_ids: set, top_100_ids: set, rank_date: str) -> List[Dict]:
    """
    Search beyond top 100 to find athletes who dropped out of rankings.
    
    Pages through rankings starting at page 3 (after top 100) until all
    existing athletes are found or we reach a reasonable limit.
    
    Args:
        gender: 'men' or 'women'
        existing_athlete_ids: Set of all WA IDs in database for this gender
        top_100_ids: Set of WA IDs currently in top 100
        rank_date: Recent Tuesday date string
    
    Returns:
        List of athlete dicts for those who dropped out but still rank
    """
    # Find which athletes we need to look for (in DB but not in top 100)
    dropped_ids = existing_athlete_ids - top_100_ids
    
    if not dropped_ids:
        print(f"  No dropped {gender} athletes to search for")
        return []
    
    print(f"\n🔍 Searching for {len(dropped_ids)} {gender} athletes who dropped out of top 100...")
    print(f"  Athletes to find: {sorted(list(dropped_ids)[:10])}{'...' if len(dropped_ids) > 10 else ''}")
    
    found_athletes = []
    found_ids = set()
    page = 3  # Start after top 100 (pages 1-2 cover top 100)
    max_page = 20  # Reasonable limit (top 1000 athletes)
    
    while found_ids < dropped_ids and page <= max_page:
        print(f"  Checking page {page}...")
        page_athletes = scrape_rankings_page(gender, page, rank_date)
        
        if not page_athletes:
            print(f"  No more athletes found on page {page}, stopping search")
            break
        
        # Check which athletes on this page are in our dropped list
        for athlete in page_athletes:
            athlete_id = athlete.get('world_athletics_id')
            if athlete_id and athlete_id in dropped_ids and athlete_id not in found_ids:
                found_athletes.append(athlete)
                found_ids.add(athlete_id)
                print(f"    ✓ Found: {athlete['name']} (rank {athlete.get('rank', 'N/A')})")
        
        # Stop if we found everyone
        if found_ids == dropped_ids:
            print(f"  ✓ Found all {len(dropped_ids)} dropped athletes!")
            break
        
        # Be polite to the server
        time.sleep(DELAY_BETWEEN_REQUESTS)
        page += 1
    
    still_missing = dropped_ids - found_ids
    if still_missing:
        print(f"  ⚠️  Could not find {len(still_missing)} athletes (may have dropped out of top 1000)")
        print(f"      Missing IDs: {sorted(list(still_missing)[:5])}{'...' if len(still_missing) > 5 else ''}")
    
    print(f"  Total found: {len(found_athletes)} dropped {gender} athletes")
    return found_athletes


# ============================================================================
# PART 2: ENRICHING ATHLETE PROFILES
# ============================================================================

def fetch_athlete_profile(athlete_id: str, profile_url: str, name: str) -> Optional[Dict]:
    """
    Fetch detailed athlete data from their profile page.
    
    Extracts:
    - Headshot URL
    - Marathon rank
    - Road running rank
    - Overall rank
    - Personal best
    - Season best
    - Age
    - Sponsor (if available)
    """
    print(f"  Fetching profile: {name} ({athlete_id})...")
    
    try:
        response = requests.get(profile_url, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        
        html = response.text
        
        # Extract data from __NEXT_DATA__ JSON embedded in page
        json_match = re.search(r'<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)</script>', html)
        
        if not json_match:
            print(f"    ⚠️  No __NEXT_DATA__ found, trying fallback methods")
            return fetch_profile_fallback(athlete_id, html, name)
        
        try:
            next_data = json.loads(json_match.group(1))
            competitor = next_data.get('props', {}).get('pageProps', {}).get('competitor', {})
            
            if not competitor:
                print(f"    ⚠️  No competitor data found")
                return fetch_profile_fallback(athlete_id, html, name)
            
            # Extract all available data
            result = {
                'world_athletics_id': athlete_id,
                'profile_url': profile_url,
                'headshot_url': f"https://media.aws.iaaf.org/athletes/{athlete_id}.jpg"
            }
            
            # World Rankings
            world_rankings = competitor.get('worldRankings', {}).get('current', [])
            for ranking in world_rankings:
                event_group = ranking.get('eventGroup', '').lower()
                place = ranking.get('place')
                
                if place:
                    if 'marathon' in event_group:
                        result['marathon_rank'] = place
                        print(f"    ✓ Marathon rank: #{place}")
                    elif 'road running' in event_group:
                        result['road_running_rank'] = place
                        print(f"    ✓ Road Running rank: #{place}")
                    elif 'overall' in event_group:
                        result['overall_rank'] = place
                        print(f"    ✓ Overall rank: #{place}")
            
            # Personal Records
            personal_bests = competitor.get('personalBests', {}).get('results', [])
            for pb in personal_bests:
                if pb.get('discipline') == 'Marathon':
                    result['personal_best'] = pb.get('mark')
                    print(f"    ✓ Personal best: {pb.get('mark')}")
                    break
            
            # Season Best
            season_bests = competitor.get('seasonBests', {}).get('results', [])
            for sb in season_bests:
                if sb.get('discipline') == 'Marathon':
                    result['season_best'] = sb.get('mark')
                    print(f"    ✓ Season best: {sb.get('mark')}")
                    break
            
            # Basic info
            basic_info = competitor.get('basicData', {})
            if basic_info.get('birthDate'):
                # Calculate age - handle multiple date formats
                birth_date_str = basic_info['birthDate']
                try:
                    # Try ISO format first (YYYY-MM-DD)
                    birth_date = datetime.strptime(birth_date_str, '%Y-%m-%d')
                except ValueError:
                    try:
                        # Try World Athletics format (DD MMM YYYY)
                        birth_date = datetime.strptime(birth_date_str, '%d %b %Y')
                    except ValueError:
                        print(f"    ⚠️  Could not parse birth date: {birth_date_str}")
                        birth_date = None
                
                if birth_date:
                    age = (datetime.now() - birth_date).days // 365
                    result['age'] = age
                    result['date_of_birth'] = birth_date.strftime('%Y-%m-%d')
                    print(f"    ✓ Age: {age}")
            
            # Sponsor (may not always be available)
            # This might be in different places depending on the page structure
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"    ❌ Failed to parse JSON: {e}")
            return fetch_profile_fallback(athlete_id, html, name)
    
    except requests.RequestException as e:
        print(f"    ❌ Error fetching profile: {e}")
        return None


def fetch_profile_fallback(athlete_id: str, html: str, name: str) -> Dict:
    """
    Fallback method to extract basic data from HTML when JSON parsing fails.
    """
    result = {
        'world_athletics_id': athlete_id,
        'headshot_url': f"https://media.aws.iaaf.org/athletes/{athlete_id}.jpg"
    }
    
    # Try to extract rankings from HTML text
    marathon_rank_match = re.search(r'#(\d+)\s+(?:Man\'s|Woman\'s)\s+marathon', html, re.IGNORECASE)
    if marathon_rank_match:
        result['marathon_rank'] = int(marathon_rank_match.group(1))
        print(f"    ✓ Marathon rank (fallback): #{marathon_rank_match.group(1)}")
    
    road_rank_match = re.search(r'#(\d+)\s+(?:Man\'s|Woman\'s)\s+road\s+running', html, re.IGNORECASE)
    if road_rank_match:
        result['road_running_rank'] = int(road_rank_match.group(1))
        print(f"    ✓ Road Running rank (fallback): #{road_rank_match.group(1)}")
    
    return result


def enrich_athletes(athletes: List[Dict], existing_athletes: Dict[str, Dict] = None) -> List[Dict]:
    """
    Enrich athlete data by fetching their profile pages.
    
    Uses World Athletics score for efficient change detection:
    - If athlete exists and score is unchanged, skip enrichment (fast)
    - If athlete is new or score changed, fetch full profile (slow)
    
    Returns updated list with additional fields from profiles.
    """
    print("\n" + "=" * 70)
    print("ENRICHING ATHLETE PROFILES")
    print("=" * 70)
    
    if existing_athletes is None:
        existing_athletes = {}
    
    enriched = []
    skipped_count = 0
    enriched_count = 0
    
    for i, athlete in enumerate(athletes, 1):
        print(f"\n[{i}/{len(athletes)}] Processing {athlete['name']}...")
        
        if not athlete.get('world_athletics_id') or not athlete.get('profile_url'):
            print(f"  ⚠️  Skipping - no profile URL")
            enriched.append(athlete)
            continue
        
        # Check if we can skip enrichment (athlete exists with same score)
        wa_id = athlete.get('world_athletics_id')
        existing = existing_athletes.get(wa_id)
        
        if existing:
            existing_score = existing.get('world_athletics_marathon_ranking_score')
            current_score = athlete.get('world_athletics_marathon_ranking_score')
            
            if existing_score and current_score and existing_score == current_score:
                print(f"  ⏭️  Score unchanged ({current_score}) - using cached data")
                # Copy enrichment data from existing record
                athlete['headshot_url'] = existing.get('headshot_url')
                athlete['marathon_rank'] = existing.get('marathon_rank')
                athlete['road_running_rank'] = existing.get('road_running_rank')
                athlete['overall_rank'] = existing.get('overall_rank')
                athlete['personal_best'] = existing.get('personal_best')
                athlete['season_best'] = existing.get('season_best')
                athlete['age'] = existing.get('age')
                athlete['date_of_birth'] = existing.get('date_of_birth')
                athlete['sponsor'] = existing.get('sponsor')
                enriched.append(athlete)
                skipped_count += 1
                continue
        
        profile_data = fetch_athlete_profile(
            athlete['world_athletics_id'],
            athlete['profile_url'],
            athlete['name']
        )
        
        if profile_data:
            # Merge profile data into athlete data
            athlete.update(profile_data)
            enriched_count += 1
        
        enriched.append(athlete)
        
        # Be very polite when fetching profiles
        if i < len(athletes):
            time.sleep(DELAY_BETWEEN_PROFILES)
    
    print(f"\n✅ Enrichment complete:")
    print(f"   Fetched profiles: {enriched_count}")
    print(f"   Used cached data: {skipped_count}")
    print(f"   Total processed: {len(enriched)}")
    
    return enriched
    return enriched


# ============================================================================
# PART 3: DATABASE SYNC WITH DELTA DETECTION
# ============================================================================

def get_db_connection():
    """Get database connection."""
    return psycopg2.connect(DATABASE_URL)


def run_migration(conn):
    """
    Run database migration to add sync tracking fields if they don't exist.
    This is idempotent and safe to run multiple times.
    """
    migration_path = Path(__file__).parent.parent / 'migrations' / 'add_sync_tracking_fields.sql'
    
    if not migration_path.exists():
        print("⚠️  Migration file not found, skipping migration")
        return
    
    print("🔄 Running database migration...")
    
    with conn.cursor() as cur:
        with open(migration_path) as f:
            migration_sql = f.read()
        
        try:
            # Execute the entire migration
            cur.execute(migration_sql)
            conn.commit()
            print("✅ Migration completed successfully")
        except Exception as e:
            conn.rollback()
            print(f"⚠️  Migration error (may already be applied): {e}")


def compute_hash(athlete: Dict) -> str:
    """
    Compute SHA256 hash of athlete data for change detection.
    
    Only includes fields that matter for updates (not rank or points).
    """
    # Convert date objects to strings for JSON serialization
    dob = athlete.get('dob')
    if dob and not isinstance(dob, str):
        dob = str(dob)
    
    date_of_birth = athlete.get('date_of_birth')
    if date_of_birth and not isinstance(date_of_birth, str):
        date_of_birth = str(date_of_birth)
    
    relevant_fields = {
        'name': athlete.get('name'),
        'country': athlete.get('country'),
        'gender': athlete.get('gender'),
        'personal_best': athlete.get('personal_best'),
        'season_best': athlete.get('season_best'),
        'marathon_rank': athlete.get('marathon_rank'),
        'road_running_rank': athlete.get('road_running_rank'),
        'overall_rank': athlete.get('overall_rank'),
        'age': athlete.get('age'),
        'dob': dob,
        'date_of_birth': date_of_birth,
    }
    
    # Sort keys for consistency
    data_str = json.dumps(relevant_fields, sort_keys=True)
    return hashlib.sha256(data_str.encode()).hexdigest()


def fetch_existing_athletes(conn) -> Dict[str, Dict]:
    """
    Fetch all existing athletes from database.
    
    Returns dict keyed by world_athletics_id.
    """
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT 
                id, world_athletics_id, name, country, gender,
                personal_best, season_best, headshot_url,
                marathon_rank, road_running_rank, overall_rank,
                age, date_of_birth, sponsor, data_hash,
                last_fetched_at, ranking_source, world_athletics_marathon_ranking_score
            FROM athletes
            WHERE world_athletics_id IS NOT NULL
        """)
        
        athletes = {}
        for row in cur.fetchall():
            athletes[row['world_athletics_id']] = dict(row)
        
        return athletes


def detect_changes(extracted_athletes: List[Dict], existing_athletes: Dict[str, Dict]) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Detect which athletes are new, changed, or unchanged.
    
    Returns (new_athletes, changed_athletes, unchanged_athletes)
    """
    new_athletes = []
    changed_athletes = []
    unchanged_athletes = []
    
    for athlete in extracted_athletes:
        wa_id = athlete.get('world_athletics_id')
        
        if not wa_id:
            print(f"  ⚠️  Skipping {athlete['name']} - no World Athletics ID")
            continue
        
        new_hash = compute_hash(athlete)
        
        if wa_id not in existing_athletes:
            athlete['data_hash'] = new_hash
            new_athletes.append(athlete)
        else:
            existing = existing_athletes[wa_id]
            old_hash = existing.get('data_hash')
            
            if old_hash != new_hash:
                athlete['data_hash'] = new_hash
                athlete['db_id'] = existing['id']
                changed_athletes.append(athlete)
            else:
                unchanged_athletes.append(athlete)
    
    return new_athletes, changed_athletes, unchanged_athletes


def upsert_athlete(conn, athlete: Dict, is_update: bool = False):
    """
    Insert or update athlete in database.
    """
    with conn.cursor() as cur:
        if is_update:
            # Update existing athlete
            cur.execute("""
                UPDATE athletes SET
                    name = %s,
                    country = %s,
                    gender = %s,
                    personal_best = %s,
                    season_best = %s,
                    headshot_url = %s,
                    world_athletics_profile_url = %s,
                    marathon_rank = %s,
                    road_running_rank = %s,
                    overall_rank = %s,
                    age = %s,
                    date_of_birth = %s,
                    world_athletics_marathon_ranking_score = %s,
                    data_hash = %s,
                    last_fetched_at = NOW(),
                    ranking_source = 'world_rankings',
                    updated_at = NOW()
                WHERE id = %s
            """, (
                athlete.get('name'),
                athlete.get('country'),
                athlete.get('gender'),
                athlete.get('personal_best'),
                athlete.get('season_best'),
                athlete.get('headshot_url'),
                athlete.get('profile_url'),
                athlete.get('marathon_rank'),
                athlete.get('road_running_rank'),
                athlete.get('overall_rank'),
                athlete.get('age'),
                athlete.get('date_of_birth'),
                athlete.get('world_athletics_marathon_ranking_score'),
                athlete.get('data_hash'),
                athlete.get('db_id')
            ))
        else:
            # Insert new athlete
            cur.execute("""
                INSERT INTO athletes (
                    name, country, gender, personal_best, season_best,
                    headshot_url, world_athletics_id, world_athletics_profile_url,
                    marathon_rank, road_running_rank, overall_rank,
                    age, date_of_birth, world_athletics_marathon_ranking_score, data_hash,
                    last_fetched_at, ranking_source
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), 'world_rankings'
                )
            """, (
                athlete.get('name'),
                athlete.get('country'),
                athlete.get('gender'),
                athlete.get('personal_best'),
                athlete.get('season_best'),
                athlete.get('headshot_url'),
                athlete.get('world_athletics_id'),
                athlete.get('profile_url'),
                athlete.get('marathon_rank'),
                athlete.get('road_running_rank'),
                athlete.get('overall_rank'),
                athlete.get('age'),
                athlete.get('date_of_birth'),
                athlete.get('world_athletics_marathon_ranking_score'),
                athlete.get('data_hash')
            ))


def sync_to_database(new_athletes: List[Dict], changed_athletes: List[Dict], dry_run: bool = False):
    """
    Sync athletes to database.
    """
    print("\n" + "=" * 70)
    print("DATABASE SYNC")
    print("=" * 70)
    
    if dry_run:
        print("🔍 DRY RUN MODE - No changes will be made\n")
    
    print(f"📊 Summary:")
    print(f"   New athletes: {len(new_athletes)}")
    print(f"   Changed athletes: {len(changed_athletes)}")
    print(f"   Total updates: {len(new_athletes) + len(changed_athletes)}")
    
    if not new_athletes and not changed_athletes:
        print("\n✓ Database is up to date - no changes needed!")
        return
    
    if dry_run:
        print("\n📝 New athletes that would be added:")
        for athlete in new_athletes[:10]:  # Show first 10
            print(f"   + {athlete['name']} ({athlete['country']}) - ID: {athlete['world_athletics_id']}")
        if len(new_athletes) > 10:
            print(f"   ... and {len(new_athletes) - 10} more")
        
        print("\n📝 Athletes that would be updated:")
        for athlete in changed_athletes[:10]:  # Show first 10
            print(f"   ⟳ {athlete['name']} ({athlete['country']}) - ID: {athlete['world_athletics_id']}")
        if len(changed_athletes) > 10:
            print(f"   ... and {len(changed_athletes) - 10} more")
        
        print("\n🔍 DRY RUN COMPLETE - Run without --dry-run to apply changes")
        return
    
    # Actual database updates
    conn = get_db_connection()
    try:
        print("\n💾 Applying changes to database...")
        
        # Insert new athletes
        for i, athlete in enumerate(new_athletes, 1):
            print(f"   [{i}/{len(new_athletes)}] Adding {athlete['name']}")
            upsert_athlete(conn, athlete, is_update=False)
        
        # Update changed athletes
        for i, athlete in enumerate(changed_athletes, 1):
            print(f"   [{i}/{len(changed_athletes)}] Updating {athlete['name']}")
            upsert_athlete(conn, athlete, is_update=True)
        
        conn.commit()
        print("\n✅ Database sync complete!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Database error: {e}")
        raise
    finally:
        conn.close()


# ============================================================================
# MAIN ORCHESTRATION
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description='Sync top marathon athletes from World Athletics to database'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be updated without making changes'
    )
    parser.add_argument(
        '--limit',
        type=int,
        default=100,
        help='Number of athletes to fetch per gender (default: 100)'
    )
    parser.add_argument(
        '--skip-enrichment',
        action='store_true',
        help='Skip fetching profile pages (faster but less data)'
    )
    parser.add_argument(
        '--sync-dropped',
        action='store_true',
        help='Also sync athletes who dropped out of top 100 (searches beyond top 100)'
    )
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("WORLD ATHLETICS TOP 100 MARATHON SYNC")
    print("=" * 70)
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE UPDATE'}")
    print(f"Limit: Top {args.limit} per gender")
    print(f"Enrichment: {'Disabled' if args.skip_enrichment else 'Enabled'}")
    print(f"Sync Dropped Athletes: {'Yes' if args.sync_dropped else 'No'}")
    print("=" * 70)
    
    # Step 1: Scrape rankings
    print("\n📥 STEP 1: EXTRACTING RANKINGS")
    print("=" * 70)
    
    men = scrape_all_rankings('men', limit=args.limit)
    time.sleep(DELAY_BETWEEN_REQUESTS)
    women = scrape_all_rankings('women', limit=args.limit)
    
    all_athletes = men + women
    print(f"\n✓ Extracted {len(all_athletes)} total athletes ({len(men)} men, {len(women)} women)")
    
    # Step 2: Fetch existing athletes for score comparison
    print("\n🔍 STEP 2: FETCHING EXISTING DATA")
    print("=" * 70)
    
    conn = get_db_connection()
    try:
        # Run migration first to ensure columns exist
        run_migration(conn)
        
        existing_athletes = fetch_existing_athletes(conn)
        print(f"Found {len(existing_athletes)} existing athletes in database")
    finally:
        conn.close()
    
    # Step 2b: Find athletes who dropped out of top 100 (if enabled)
    if args.sync_dropped and existing_athletes:
        print("\n🔍 STEP 2b: FINDING DROPPED ATHLETES")
        print("=" * 70)
        
        rank_date = get_recent_tuesday()
        
        # Get IDs from top 100
        top_100_men_ids = {a['world_athletics_id'] for a in men if a.get('world_athletics_id')}
        top_100_women_ids = {a['world_athletics_id'] for a in women if a.get('world_athletics_id')}
        
        # Get IDs of existing athletes by gender
        existing_men_ids = {wa_id for wa_id, data in existing_athletes.items() 
                           if data.get('gender') == 'M'}
        existing_women_ids = {wa_id for wa_id, data in existing_athletes.items() 
                             if data.get('gender') == 'F'}
        
        # Find dropped athletes beyond top 100
        dropped_men = find_dropped_athletes('men', existing_men_ids, top_100_men_ids, rank_date)
        time.sleep(DELAY_BETWEEN_REQUESTS)
        dropped_women = find_dropped_athletes('women', existing_women_ids, top_100_women_ids, rank_date)
        
        # Add dropped athletes to the processing list
        if dropped_men or dropped_women:
            all_athletes.extend(dropped_men)
            all_athletes.extend(dropped_women)
            print(f"\n✓ Added {len(dropped_men)} men and {len(dropped_women)} women who dropped from top 100")
            print(f"✓ Total athletes to process: {len(all_athletes)}")
    
    # Step 3: Enrich with profile data (unless skipped)
    if not args.skip_enrichment:
        print("\n📥 STEP 3: ENRICHING PROFILES")
        print("=" * 70)
        all_athletes = enrich_athletes(all_athletes, existing_athletes)
    else:
        print("\n⏭️  Skipping profile enrichment (--skip-enrichment flag)")
    
    # Step 4: Detect changes
    print("\n🔍 STEP 4: DETECTING CHANGES")
    print("=" * 70)
    
    new_athletes, changed_athletes, unchanged_athletes = detect_changes(all_athletes, existing_athletes)
    
    print(f"\n📊 Change Detection Results:")
    print(f"   New: {len(new_athletes)}")
    print(f"   Changed: {len(changed_athletes)}")
    print(f"   Unchanged: {len(unchanged_athletes)}")
    
    # Step 5: Sync to database
    sync_to_database(new_athletes, changed_athletes, dry_run=args.dry_run)
    
    # Summary
    print("\n" + "=" * 70)
    print("SYNC COMPLETE")
    print("=" * 70)
    print(f"✓ Processed {len(all_athletes)} athletes")
    print(f"✓ New: {len(new_athletes)}")
    print(f"✓ Updated: {len(changed_athletes)}")
    print(f"✓ Unchanged: {len(unchanged_athletes)}")
    
    if args.dry_run:
        print("\n🔍 This was a DRY RUN - no changes were made")
        print("   Run without --dry-run to apply changes")


if __name__ == '__main__':
    main()
