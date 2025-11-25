#!/usr/bin/env python3
"""
Enrich Missing World Athletics IDs Script

This script identifies athletes in the database that are missing World Athletics IDs,
searches World Athletics website using HTML scraping to find their IDs,
and bulk updates them in the database.

Usage:
  python scripts/enrich-missing-wa-ids.py --dry-run
  python scripts/enrich-missing-wa-ids.py

Options:
  --dry-run    Show what would be updated without making changes
  --limit N    Limit to processing N athletes (default: no limit)
"""

import os
import sys
import time
import re
import argparse
from urllib.parse import quote_plus
from difflib import SequenceMatcher

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    import requests
    from bs4 import BeautifulSoup
    from dotenv import load_dotenv
except ImportError:
    print("Error: Required packages not found.")
    print("Please install: pip install requests beautifulsoup4 python-dotenv")
    sys.exit(1)

# Load environment variables
load_dotenv()

# World Athletics configuration
WA_BASE_URL = 'https://worldathletics.org'
WA_SEARCH_URL = f'{WA_BASE_URL}/athletes/search'
WA_REQUEST_DELAY_MS = 2000  # 2 seconds between searches

# Database configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable not set")
    sys.exit(1)


def normalize_wa_id(wa_id):
    """Remove leading zeros from World Athletics ID"""
    if not wa_id:
        return wa_id
    return wa_id.lstrip('0')


def calculate_name_similarity(name1, name2):
    """Calculate similarity between two names (0.0 to 1.0)"""
    return SequenceMatcher(None, name1.lower(), name2.lower()).ratio()


def search_world_athletics(athlete_name, gender):
    """
    Search World Athletics for an athlete by name
    Returns: (athlete_id, similarity_score, profile_url) or (None, 0, None)
    """
    print(f"  Searching World Athletics for: {athlete_name} ({gender})")
    
    try:
        # Build search URL
        search_url = f"{WA_SEARCH_URL}?q={quote_plus(athlete_name)}"
        
        # Fetch search results
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(search_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find athlete links using data-athlete-id attribute
        athlete_elements = soup.select('[data-athlete-id]')
        
        if not athlete_elements:
            print(f"    No results found")
            return None, 0, None
        
        # Process each result to find best match
        best_match = None
        best_similarity = 0
        
        for elem in athlete_elements:
            # Extract athlete ID from data attribute
            athlete_id = elem.get('data-athlete-id')
            if not athlete_id:
                continue
            
            # Get athlete name from the element text
            result_name = elem.get_text(strip=True)
            
            # Calculate similarity
            similarity = calculate_name_similarity(athlete_name, result_name)
            
            if similarity > best_similarity:
                best_similarity = similarity
                # Construct profile URL from athlete ID
                # We need href to construct the full URL
                href = elem.get('href', '')
                if href:
                    profile_url = WA_BASE_URL + href if not href.startswith('http') else href
                else:
                    profile_url = f"{WA_BASE_URL}/athletes/{athlete_id}"
                best_match = (athlete_id, similarity, profile_url)
        
        # Only return matches above 70% similarity threshold
        if best_match and best_similarity > 0.70:
            print(f"    Found match: ID {best_match[0]} ({best_similarity:.1%} similar)")
            return best_match
        else:
            print(f"    No confident match found (best: {best_similarity:.1%})")
            return None, 0, None
            
    except requests.RequestException as e:
        print(f"    Error searching: {e}")
        return None, 0, None


def get_athletes_without_wa_id(limit=None):
    """Query database for athletes missing World Athletics IDs"""
    try:
        import psycopg2
        from urllib.parse import urlparse
        
        # Parse DATABASE_URL
        result = urlparse(DATABASE_URL)
        
        # Connect to database
        conn = psycopg2.connect(
            database=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname,
            port=result.port
        )
        
        cursor = conn.cursor()
        
        # Query for athletes without WA IDs
        query = """
            SELECT id, name, country, gender
            FROM athletes
            WHERE world_athletics_id IS NULL OR world_athletics_id = ''
            ORDER BY id
        """
        
        if limit:
            query += f" LIMIT {limit}"
        
        cursor.execute(query)
        athletes = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return [
            {
                'id': row[0],
                'name': row[1],
                'country': row[2],
                'gender': row[3]
            }
            for row in athletes
        ]
        
    except Exception as e:
        print(f"Database error: {e}")
        sys.exit(1)


def update_athlete_wa_id(athlete_id, wa_id, dry_run=False):
    """Update athlete's World Athletics ID in database"""
    if dry_run:
        print(f"    [DRY RUN] Would update athlete {athlete_id} with WA ID: {wa_id}")
        return True
    
    try:
        import psycopg2
        from urllib.parse import urlparse
        
        # Parse DATABASE_URL
        result = urlparse(DATABASE_URL)
        
        # Connect to database
        conn = psycopg2.connect(
            database=result.path[1:],
            user=result.username,
            password=result.password,
            host=result.hostname,
            port=result.port
        )
        
        cursor = conn.cursor()
        
        # Update athlete
        cursor.execute(
            "UPDATE athletes SET world_athletics_id = %s WHERE id = %s",
            (wa_id, athlete_id)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"    ✅ Updated athlete {athlete_id} with WA ID: {wa_id}")
        return True
        
    except Exception as e:
        print(f"    ❌ Error updating athlete {athlete_id}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(
        description='Enrich athletes with missing World Athletics IDs'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be updated without making changes'
    )
    parser.add_argument(
        '--limit',
        type=int,
        help='Limit number of athletes to process'
    )
    
    args = parser.parse_args()
    
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║   Enrich Missing World Athletics IDs                        ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print()
    
    # Get athletes without WA IDs
    print("📖 Querying database for athletes without WA IDs...")
    athletes = get_athletes_without_wa_id(limit=args.limit)
    print(f"   Found {len(athletes)} athletes without WA IDs")
    print()
    
    if not athletes:
        print("✅ All athletes have World Athletics IDs!")
        return
    
    # Process each athlete
    print("🔍 Searching World Athletics for missing IDs...")
    print()
    
    found_count = 0
    not_found_count = 0
    updated_count = 0
    error_count = 0
    
    for i, athlete in enumerate(athletes, 1):
        print(f"[{i}/{len(athletes)}] {athlete['name']} ({athlete['gender']}, {athlete['country']})")
        
        # Search World Athletics
        wa_id, similarity, profile_url = search_world_athletics(
            athlete['name'],
            athlete['gender']
        )
        
        if wa_id:
            found_count += 1
            
            # Normalize ID (remove leading zeros)
            wa_id = normalize_wa_id(wa_id)
            
            # Update database
            if update_athlete_wa_id(athlete['id'], wa_id, dry_run=args.dry_run):
                updated_count += 1
            else:
                error_count += 1
        else:
            not_found_count += 1
        
        # Rate limiting - wait between searches
        if i < len(athletes):  # Don't wait after last athlete
            time.sleep(WA_REQUEST_DELAY_MS / 1000.0)
        
        print()
    
    # Print summary
    print("=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print(f"Total Athletes Processed: {len(athletes)}")
    print(f"✅ Found WA IDs:         {found_count}")
    print(f"❌ Not Found:            {not_found_count}")
    print(f"💾 Successfully Updated: {updated_count}")
    print(f"⚠️  Errors:              {error_count}")
    print()
    
    if args.dry_run:
        print("🔍 This was a DRY RUN. Run without --dry-run to apply changes.")
    elif updated_count > 0:
        print("✅ Database updated successfully!")
    
    print()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
