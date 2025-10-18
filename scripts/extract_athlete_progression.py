#!/usr/bin/env python3
"""
Extract athlete progression and detailed race results from World Athletics profile pages.

This script fetches an athlete's profile page and extracts:
1. Progression data (year-by-year season's bests) - ALL years in one request
2. Detailed race results - current year only due to anti-bot protection

The data is embedded in __NEXT_DATA__ JSON on the page. Progression data includes
all years in a single page load, while race results are limited to the current
year due to World Athletics' anti-bot protection.

Usage:
    python3 scripts/extract_athlete_progression.py --athlete-id 14593938
    python3 scripts/extract_athlete_progression.py --url "https://worldathletics.org/athletes/kenya/peres-jepchirchir-14593938"
    
    # With race results from current year
    python3 scripts/extract_athlete_progression.py --athlete-id 14593938 --years 2025
    
    # Filter by discipline
    python3 scripts/extract_athlete_progression.py --athlete-id 14593938 --disciplines "Marathon" "Half Marathon"
"""

import argparse
import json
import re
import sys
from typing import Dict, List, Optional
import requests
from bs4 import BeautifulSoup


def extract_next_data(html: str) -> Optional[Dict]:
    """
    Extract the __NEXT_DATA__ JSON blob from the HTML.
    
    Args:
        html: Raw HTML content from the page
        
    Returns:
        Parsed JSON data or None if not found
    """
    soup = BeautifulSoup(html, 'html.parser')
    
    # Find the script tag with id="__NEXT_DATA__"
    next_data_script = soup.find('script', {'id': '__NEXT_DATA__'})
    
    if not next_data_script:
        print("❌ Could not find __NEXT_DATA__ script tag", file=sys.stderr)
        return None
    
    try:
        data = json.loads(next_data_script.string)
        return data
    except json.JSONDecodeError as e:
        print(f"❌ Failed to parse __NEXT_DATA__ JSON: {e}", file=sys.stderr)
        return None


def get_athlete_url(athlete_id: str) -> Optional[str]:
    """
    Get the full athlete profile URL by extracting athlete data.
    
    Fetches the page and constructs the full URL from athlete name and country.
    
    Args:
        athlete_id: World Athletics athlete ID
        
    Returns:
        Full URL (e.g., https://worldathletics.org/athletes/kenya/peres-jepchirchir-14593938)
    """
    search_url = f"https://worldathletics.org/athletes/_/{athlete_id}"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(search_url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # Extract __NEXT_DATA__ to get athlete details
        match = re.search(r'<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)</script>', response.text)
        if not match:
            return search_url  # Fallback to short URL
        
        data = json.loads(match.group(1))
        props = data.get('props', {})
        page_props = props.get('pageProps', {})
        competitor = page_props.get('competitor', {})
        basic = competitor.get('basicData', {})
        
        # Extract name components
        # Use countryFullName (e.g., "Kenya") instead of countryCode (e.g., "KEN")
        country_full = basic.get('countryFullName', '')
        country = country_full.lower().replace(' ', '-') if country_full else basic.get('countryCode', '').lower()
        given_name = basic.get('givenName', '').lower().replace(' ', '-')
        family_name = basic.get('familyName', '').lower().replace(' ', '-')
        
        if country and family_name:
            # Construct the full URL
            full_url = f"https://worldathletics.org/athletes/{country}/{given_name}-{family_name}-{athlete_id}"
            return full_url
        
        # Fallback to short URL if we can't construct it
        return search_url
        
    except (requests.RequestException, json.JSONDecodeError, KeyError) as e:
        print(f"⚠️  Could not construct full URL, using short format: {e}", file=sys.stderr)
        return search_url


def fetch_athlete_page(athlete_id: str) -> Optional[str]:
    """
    Fetch the athlete profile page HTML.
    
    Args:
        athlete_id: World Athletics athlete ID
        
    Returns:
        HTML content or None if request failed
    """
    # Get the full URL first (with country and name)
    athlete_url = get_athlete_url(athlete_id)
    if not athlete_url:
        return None
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(athlete_url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"❌ Failed to fetch athlete page: {e}", file=sys.stderr)
        return None


def fetch_athlete_page_by_url(url: str) -> Optional[str]:
    """
    Fetch the athlete profile page HTML by direct URL.
    
    Args:
        url: Full URL to the athlete profile page
        
    Returns:
        HTML content or None if request failed
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return response.text
    except requests.RequestException as e:
        print(f"❌ Failed to fetch athlete page: {e}", file=sys.stderr)
        return None


def extract_progression_data(next_data: Dict) -> Optional[List[Dict]]:
    """
    Extract progression data from the __NEXT_DATA__ structure.
    
    Args:
        next_data: Parsed __NEXT_DATA__ JSON
        
    Returns:
        List of progression records or None if not found
    """
    try:
        # Navigate the JSON structure
        props = next_data.get('props', {})
        page_props = props.get('pageProps', {})
        competitor = page_props.get('competitor', {})
        
        # Get progression data
        progression = competitor.get('progressionOfSeasonsBests', [])
        
        if not progression:
            print("⚠️  No progression data found", file=sys.stderr)
            return None
        
        return progression
    except (KeyError, TypeError) as e:
        print(f"❌ Failed to extract progression data: {e}", file=sys.stderr)
        return None


def extract_race_results(next_data: Dict, disciplines_filter: Optional[List[str]] = None) -> Optional[List[Dict]]:
    """
    Extract detailed race results from the __NEXT_DATA__ structure.
    
    Args:
        next_data: Parsed __NEXT_DATA__ JSON
        disciplines_filter: Optional list of disciplines to filter (e.g., ["Marathon", "Half Marathon"])
        
    Returns:
        List of race results or None if not found
    """
    try:
        props = next_data.get('props', {})
        page_props = props.get('pageProps', {})
        competitor = page_props.get('competitor', {})
        
        # Get results by year data
        results_by_year = competitor.get('resultsByYear', {})
        results_by_event = results_by_year.get('resultsByEvent', [])
        year = results_by_year.get('parameters', {}).get('resultsByYear', 'Unknown')
        
        if not results_by_event:
            return []
        
        # Process each event's results
        all_results = []
        for event in results_by_event:
            discipline = event.get('discipline', 'Unknown')
            
            # Apply discipline filter if provided
            if disciplines_filter and discipline not in disciplines_filter:
                continue
            
            event_id = event.get('eventId', 'Unknown')
            
            for result in event.get('results', []):
                result_data = {
                    'year': year,
                    'discipline': discipline,
                    'event_id': event_id,
                    'date': result.get('date', 'Unknown'),
                    'competition': result.get('competition', 'Unknown'),
                    'competition_id': result.get('competitionId'),
                    'venue': result.get('venue', 'Unknown'),
                    'country': result.get('country', 'Unknown'),
                    'place': result.get('place', 'Unknown'),
                    'mark': result.get('mark', 'Unknown'),
                    'result_score': result.get('resultScore'),
                    'category': result.get('category', 'Unknown'),
                    'race': result.get('race', 'Unknown'),
                    'wind': result.get('wind'),
                    'not_legal': result.get('notLegal', False),
                    'remark': result.get('remark', ''),
                }
                all_results.append(result_data)
        
        return all_results
    except (KeyError, TypeError) as e:
        print(f"❌ Failed to extract race results: {e}", file=sys.stderr)
        return None


def fetch_results_for_years(
    athlete_id: str,
    years: List[int],
    disciplines_filter: Optional[List[str]] = None
) -> List[Dict]:
    """
    Fetch race results from the athlete's page.
    
    Note: Due to World Athletics' anti-bot protection, only the current year's
    race results can be reliably fetched via HTTP requests.
    
    Args:
        athlete_id: World Athletics athlete ID
        years: List of years to fetch (currently only gets current year)
        disciplines_filter: Optional list of disciplines to filter
        
    Returns:
        List of race results from the current year
    """
    all_results = []
    
    print(f"\n📊 Fetching race results...")
    
    html = fetch_athlete_page(athlete_id)
    if not html:
        return all_results
    
    next_data = extract_next_data(html)
    if not next_data:
        return all_results
    
    results = extract_race_results(next_data, disciplines_filter)
    if results:
        all_results.extend(results)
        year = results[0]['year'] if results else 'Unknown'
        print(f"  ✅ Extracted {len(results)} results from year {year}")
    
    return all_results


def extract_basic_info(next_data: Dict) -> Optional[Dict]:
    """
    Extract basic athlete information.
    
    Args:
        next_data: Parsed __NEXT_DATA__ JSON
        
    Returns:
        Dictionary with basic athlete info or None if not found
    """
    try:
        props = next_data.get('props', {})
        page_props = props.get('pageProps', {})
        competitor = page_props.get('competitor', {})
        basic_data = competitor.get('basicData', {})
        
        return {
            'athlete_id': competitor.get('_id'),
            'given_name': basic_data.get('givenName'),
            'family_name': basic_data.get('familyName'),
            'country_code': basic_data.get('countryCode'),
            'country_name': basic_data.get('countryFullName'),
            'birth_date': basic_data.get('birthDate'),
            'sex': 'F' if not basic_data.get('male') else 'M'
        }
    except (KeyError, TypeError) as e:
        print(f"❌ Failed to extract basic info: {e}", file=sys.stderr)
        return None


def format_progression_for_display(progression: List[Dict]) -> None:
    """
    Print progression data in a readable format.
    
    Args:
        progression: List of progression records
    """
    print("\n📊 PROGRESSION DATA (Season's Bests by Year)\n")
    print("=" * 80)
    
    for event in progression:
        discipline = event.get('discipline', 'Unknown')
        event_id = event.get('eventId')
        is_main_event = event.get('mainEvent', False)
        
        marker = "⭐" if is_main_event else "  "
        print(f"\n{marker} {discipline} (Event ID: {event_id})")
        print("-" * 80)
        
        results = event.get('results', [])
        if not results:
            print("  No results recorded")
            continue
        
        # Sort by season (year)
        results_sorted = sorted(results, key=lambda x: x.get('season', ''))
        
        for result in results_sorted:
            season = result.get('season')
            mark = result.get('mark')
            venue = result.get('venue', 'Unknown')
            date = result.get('date', 'Unknown')
            competition = result.get('competition', 'Unknown')
            score = result.get('resultScore', 'N/A')
            
            print(f"  {season}: {mark:10s} | {date:12s} | {venue:30s} | Score: {score}")
            print(f"         Competition: {competition}")


def format_race_results_for_display(results: List[Dict]) -> None:
    """
    Display race results in a formatted table.
    
    Args:
        results: List of race result dictionaries
    """
    if not results:
        print("\n⚠️  No race results found")
        return
    
    print(f"\n{'='*100}")
    print(f"🏃 DETAILED RACE RESULTS")
    print(f"{'='*100}\n")
    
    # Group by discipline
    by_discipline = {}
    for result in results:
        discipline = result['discipline']
        if discipline not in by_discipline:
            by_discipline[discipline] = []
        by_discipline[discipline].append(result)
    
    # Display each discipline
    for discipline, disc_results in by_discipline.items():
        print(f"\n{'─'*100}")
        print(f"   {discipline} ({len(disc_results)} races)")
        print(f"{'─'*100}")
        
        # Sort by date (newest first)
        disc_results.sort(key=lambda x: x['date'], reverse=True)
        
        for result in disc_results:
            print(f"\n  📅 {result['date']:15s} | 🏁 Place: {result['place']:5s} | ⏱️  {result['mark']}")
            print(f"      {result['competition']}")
            print(f"      📍 {result['venue']}")
            if result['result_score']:
                print(f"      💯 Score: {result['result_score']}")
            if result['remark']:
                print(f"      💬 {result['remark']}")
    
    print(f"\n{'='*100}\n")


def save_data_json(
    athlete_info: Dict,
    progression: List[Dict],
    race_results: Optional[List[Dict]],
    output_file: str
) -> None:
    """
    Save all extracted data to a JSON file.
    
    Args:
        athlete_info: Basic athlete information
        progression: List of progression records
        race_results: Optional list of detailed race results
        output_file: Path to output JSON file
    """
    from datetime import datetime
    
    output_data = {
        'athlete': athlete_info,
        'progression': progression,
        'race_results': race_results or [],
        'extracted_at': datetime.now().isoformat()
    }
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Saved data to: {output_file}")


def main():
    parser = argparse.ArgumentParser(
        description='Extract athlete progression data and race results from World Athletics profiles',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Extract just progression data
  %(prog)s --athlete-id 14593938
  
  # Extract progression + race results from multiple years
  %(prog)s --athlete-id 14593938 --years 2022 2023 2024 2025
  
  # Filter by discipline (Marathon and Half Marathon only)
  %(prog)s --athlete-id 14593938 --disciplines "Marathon" "Half Marathon" --years 2024 2025
  
  # Save to specific file
  %(prog)s --url "https://worldathletics.org/athletes/kenya/peres-jepchirchir-14593938" --output peres.json
        """
    )
    
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        '--athlete-id',
        type=str,
        help='World Athletics athlete ID (e.g., 14593938)'
    )
    group.add_argument(
        '--url',
        type=str,
        help='Full URL to athlete profile page'
    )
    
    parser.add_argument(
        '--output',
        type=str,
        help='Output JSON file path (default: data_<athlete_id>.json)'
    )
    
    parser.add_argument(
        '--years',
        type=int,
        nargs='+',
        help='Years to fetch race results for (e.g., 2022 2023 2024 2025)'
    )
    
    parser.add_argument(
        '--disciplines',
        type=str,
        nargs='+',
        help='Filter results by discipline (e.g., "Marathon" "Half Marathon")'
    )
    
    parser.add_argument(
        '--no-display',
        action='store_true',
        help='Do not display data (only save to file)'
    )
    
    args = parser.parse_args()
    
    # Fetch the page
    print("🌐 Fetching athlete profile page...")
    
    if args.url:
        html = fetch_athlete_page_by_url(args.url)
        # Extract athlete ID from URL for filename
        match = re.search(r'(\d+)$', args.url)
        athlete_id = match.group(1) if match else 'unknown'
    else:
        html = fetch_athlete_page(args.athlete_id)
        athlete_id = args.athlete_id
    
    if not html:
        sys.exit(1)
    
    print("✅ Page fetched successfully")
    
    # Extract __NEXT_DATA__
    print("🔍 Extracting __NEXT_DATA__ JSON...")
    next_data = extract_next_data(html)
    
    if not next_data:
        sys.exit(1)
    
    print("✅ JSON extracted successfully")
    
    # Extract athlete info
    athlete_info = extract_basic_info(next_data)
    if athlete_info:
        print(f"\n👤 Athlete: {athlete_info['given_name']} {athlete_info['family_name']}")
        print(f"   Country: {athlete_info['country_name']} ({athlete_info['country_code']})")
        print(f"   Born: {athlete_info['birth_date']}")
    
    # Extract progression data
    print("\n📈 Extracting progression data...")
    progression = extract_progression_data(next_data)
    
    if not progression:
        sys.exit(1)
    
    print(f"✅ Found progression data for {len(progression)} events")
    
    # Display progression data (unless --no-display)
    if not args.no_display:
        format_progression_for_display(progression)
    
    # Extract race results if years specified
    race_results = []
    if args.years:
        print(f"\n🏁 Extracting race results...")
        current_results = extract_race_results(next_data, args.disciplines)
        
        if current_results:
            race_results.extend(current_results)
            year = current_results[0]['year']
            print(f"  ✅ Extracted {len(current_results)} results from year {year}")
            
            if not args.no_display:
                format_race_results_for_display(current_results)
        else:
            print(f"  ⚠️  No results found")
    
    # Save to JSON file
    if args.output:
        output_file = args.output
    else:
        output_file = f"data_{athlete_id}.json"
    
    if athlete_info and progression:
        save_data_json(athlete_info, progression, race_results if race_results else None, output_file)
    
    print("\n✅ Done!")


if __name__ == '__main__':
    main()
