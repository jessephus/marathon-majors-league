#!/usr/bin/env python3
"""
Scrape World Athletics website for top marathon athletes.

This is a pragmatic approach when the GraphQL API is inaccessible.
We scrape the public rankings page which has all the data we need.
"""

import requests
from bs4 import BeautifulSoup
import json
import re
import time
from typing import List, Dict

def scrape_marathon_rankings(gender: str, limit: int = 100) -> List[Dict]:
    """
    Scrape marathon rankings from World Athletics World Rankings page.
    
    Args:
        gender: 'men' or 'women'
        limit: Number of athletes to scrape (default 100)
    
    Returns:
        List of athlete dictionaries with rank, name, country, pb, etc.
    """
    # World Athletics World Rankings URL with pagination
    # Using recent date - adjust rankDate as needed
    from datetime import datetime, timedelta
    
    # Use a recent Tuesday (rankings update on Tuesdays)
    today = datetime.now()
    days_since_tuesday = (today.weekday() - 1) % 7
    recent_tuesday = today - timedelta(days=days_since_tuesday)
    rank_date = recent_tuesday.strftime('%Y-%m-%d')
    
    athletes = []
    page = 1
    max_pages = (limit // 50) + 1  # Each page typically has ~50 results
    
    print(f"Fetching {gender}'s marathon world rankings (limit: {limit})...")
    
    while len(athletes) < limit and page <= max_pages:
        url = f"https://worldathletics.org/world-rankings/marathon/{gender}?regionType=world&page={page}&rankDate={rank_date}&limitByCountry=0"
        print(f"  Fetching page {page}: {url}")
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            # Each athlete row has a data-athlete-url attribute on the <tr>
            rows = soup.select('table tr[data-athlete-url]')
            if not rows:
                print(f"  No athlete rows found on page {page}")
                break
            
            page_athletes = 0
            for row in rows:
                if len(athletes) >= limit:
                    break
                try:
                    # Extract athlete profile URL and ID from data-athlete-url
                    profile_url = row.get('data-athlete-url')
                    athlete_id = None
                    if profile_url:
                        # Example: /athletes/kenya/eliud-kipchoge-14208194
                        parts = profile_url.split('/')[-1].split('-')
                        for part in reversed(parts):
                            if part.isdigit() and len(part) >= 7:
                                athlete_id = part
                                break
                    cells = row.select('td')
                    if len(cells) < 5:
                        continue
                    rank_text = cells[0].get_text(strip=True)
                    if not rank_text.isdigit():
                        continue
                    rank = int(rank_text)
                    name = cells[1].get_text(strip=True)
                    dob = cells[2].get_text(strip=True) if len(cells) > 2 else None
                    country_cell = cells[3]
                    country = country_cell.get_text(strip=True)
                    if country:
                        country = country.split()[0]
                    points = cells[4].get_text(strip=True) if len(cells) > 4 else None
                    athlete_data = {
                        'rank': rank,
                        'name': name,
                        'country': country,
                        'dob': dob,
                        'ranking_points': points,
                        'world_athletics_id': athlete_id,
                        'profile_url': f"https://worldathletics.org{profile_url}" if profile_url else None,
                        'gender': 'M' if gender == 'men' else 'F'
                    }
                    athletes.append(athlete_data)
                    page_athletes += 1
                    id_str = f"ID: {athlete_id}" if athlete_id else "No ID"
                    print(f"    {rank}. {name} ({country}) - {id_str}")
                except Exception as e:
                    print(f"    Warning: Error parsing row: {e}")
                    continue
            print(f"  Scraped {page_athletes} athletes from page {page}")
            if page_athletes == 0:
                print(f"  No athletes found on page {page}, stopping")
                break
            
            # Be polite to the server
            time.sleep(2)
            page += 1
            
        except requests.RequestException as e:
            print(f"  Error fetching page {page}: {e}")
            break
    
    print(f"Successfully scraped {len(athletes)} total athletes from {gender}'s rankings")
    return athletes


def main():
    print("=" * 60)
    print("World Athletics Marathon Rankings Scraper")
    print("=" * 60)
    
    # Scrape men's rankings
    print("\n📊 Scraping men's rankings...")
    men = scrape_marathon_rankings('men', limit=100)
    
    time.sleep(2)  # Be polite to the server
    
    # Scrape women's rankings
    print("\n📊 Scraping women's rankings...")
    women = scrape_marathon_rankings('women', limit=100)
    
    # Save results
    results = {
        'scraped_at': time.strftime('%Y-%m-%d %H:%M:%S UTC'),
        'source': 'worldathletics.org',
        'men': men,
        'women': women
    }
    
    output_file = 'scraped_rankings.json'
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n✓ Saved {len(men)} men and {len(women)} women to {output_file}")
    print("\n📝 Next steps:")
    print("  1. Review scraped_rankings.json")
    print("  2. Run sync script to update database")
    print("  3. Manually verify key athletes")


if __name__ == '__main__':
    main()
