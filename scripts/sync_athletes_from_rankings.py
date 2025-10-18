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

import requests
from bs4 import BeautifulSoup

# Database imports
try:
    import psycopg2
    from psycopg2.extras import RealDictCursor
except ImportError:
    print("Error: psycopg2 not installed. Run: pip install psycopg2-binary")
    sys.exit(1)

# Configuration
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable not set")
    sys.exit(1)

BASE_URL = "https://worldathletics.org"
RANKING_URL_TEMPLATE = f"{BASE_URL}/world-rankings/marathon/{{gender}}?regionType=world&page={{page}}&rankDate={{rank_date}}&limitByCountry=0"
REQUEST_TIMEOUT = 30
DELAY_BETWEEN_REQUESTS = 2  # Be polite to the server
DELAY_BETWEEN_PROFILES = 3  # Even more polite for profile fetches

# ============================================================================
# PART 1: SCRAPING RANKINGS
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
                
                # Ranking points
                points = cells[4].get_text(strip=True) if len(cells) > 4 else None
                
                athlete_data = {
                    'rank': rank,
                    'name': name,
                    'country': country,
                    'dob': dob,
                    'ranking_points': points,
                    'world_athletics_id': athlete_id,
                    'profile_url': full_profile_url,
                    'gender': 'M' if gender == 'men' else 'F'
                }
                
                athletes.append(athlete_data)
                print(f"    {rank}. {name} ({country}) - ID: {athlete_id or 'N/A'}")
                
            except Exception as e:
                print(f"    Warning: Error parsing row: {e}")
                continue
        
        print(f"  Scraped {len(athletes)} athletes from page {page}")
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
    print(f"\nScraping {gender}'s marathon world rankings (limit: {limit})...")
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
    
    print(f"Total scraped: {len(all_athletes)} {gender}")
    return all_athletes


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
                # Calculate age
                birth_date = datetime.strptime(basic_info['birthDate'], '%Y-%m-%d')
                age = (datetime.now() - birth_date).days // 365
                result['age'] = age
                result['date_of_birth'] = basic_info['birthDate']
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


def enrich_athletes(athletes: List[Dict]) -> List[Dict]:
    """
    Enrich athlete data by fetching their profile pages.
    
    Returns updated list with additional fields from profiles.
    """
    print("\n" + "=" * 70)
    print("ENRICHING ATHLETE PROFILES")
    print("=" * 70)
    
    enriched = []
    
    for i, athlete in enumerate(athletes, 1):
        print(f"\n[{i}/{len(athletes)}] Processing {athlete['name']}...")
        
        if not athlete.get('world_athletics_id') or not athlete.get('profile_url'):
            print(f"  ⚠️  Skipping - no profile URL")
            enriched.append(athlete)
            continue
        
        profile_data = fetch_athlete_profile(
            athlete['world_athletics_id'],
            athlete['profile_url'],
            athlete['name']
        )
        
        if profile_data:
            # Merge profile data into athlete data
            athlete.update(profile_data)
        
        enriched.append(athlete)
        
        # Be very polite when fetching profiles
        if i < len(athletes):
            time.sleep(DELAY_BETWEEN_PROFILES)
    
    return enriched


# ============================================================================
# PART 3: DATABASE SYNC WITH DELTA DETECTION
# ============================================================================

def get_db_connection():
    """Get database connection."""
    return psycopg2.connect(DATABASE_URL)


def compute_hash(athlete: Dict) -> str:
    """
    Compute SHA256 hash of athlete data for change detection.
    
    Only includes fields that matter for updates (not rank or points).
    """
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
        'dob': athlete.get('dob'),
        'date_of_birth': athlete.get('date_of_birth'),
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
                last_fetched_at, ranking_source
            FROM athletes
            WHERE world_athletics_id IS NOT NULL
        """)
        
        athletes = {}
        for row in cur.fetchall():
            athletes[row['world_athletics_id']] = dict(row)
        
        return athletes


def detect_changes(scraped_athletes: List[Dict], existing_athletes: Dict[str, Dict]) -> Tuple[List[Dict], List[Dict], List[Dict]]:
    """
    Detect which athletes are new, changed, or unchanged.
    
    Returns (new_athletes, changed_athletes, unchanged_athletes)
    """
    new_athletes = []
    changed_athletes = []
    unchanged_athletes = []
    
    for athlete in scraped_athletes:
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
                    age, date_of_birth, data_hash,
                    last_fetched_at, ranking_source
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), 'world_rankings'
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
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("WORLD ATHLETICS TOP 100 MARATHON SYNC")
    print("=" * 70)
    print(f"Mode: {'DRY RUN' if args.dry_run else 'LIVE UPDATE'}")
    print(f"Limit: Top {args.limit} per gender")
    print(f"Enrichment: {'Disabled' if args.skip_enrichment else 'Enabled'}")
    print("=" * 70)
    
    # Step 1: Scrape rankings
    print("\n📥 STEP 1: SCRAPING RANKINGS")
    print("=" * 70)
    
    men = scrape_all_rankings('men', limit=args.limit)
    time.sleep(DELAY_BETWEEN_REQUESTS)
    women = scrape_all_rankings('women', limit=args.limit)
    
    all_athletes = men + women
    print(f"\n✓ Scraped {len(all_athletes)} total athletes ({len(men)} men, {len(women)} women)")
    
    # Step 2: Enrich with profile data (unless skipped)
    if not args.skip_enrichment:
        all_athletes = enrich_athletes(all_athletes)
    else:
        print("\n⏭️  Skipping profile enrichment (--skip-enrichment flag)")
    
    # Step 3: Detect changes
    print("\n🔍 STEP 2: DETECTING CHANGES")
    print("=" * 70)
    
    conn = get_db_connection()
    try:
        existing_athletes = fetch_existing_athletes(conn)
        print(f"Found {len(existing_athletes)} existing athletes in database")
    finally:
        conn.close()
    
    new_athletes, changed_athletes, unchanged_athletes = detect_changes(all_athletes, existing_athletes)
    
    print(f"\n📊 Change Detection Results:")
    print(f"   New: {len(new_athletes)}")
    print(f"   Changed: {len(changed_athletes)}")
    print(f"   Unchanged: {len(unchanged_athletes)}")
    
    # Step 4: Sync to database
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
