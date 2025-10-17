# Athlete Data Enrichment Guide

## Challenge: World Athletics Search

The World Athletics website (`worldathletics.org`) uses JavaScript to render search results, which makes automated scraping difficult. The search page at `https://worldathletics.org/athletes-home?query=[name]` loads results dynamically via JavaScript.

## Solution: Manual ID Collection

We've created two approaches for enriching athlete data:

### Option 1: Manual Enrichment Script (Recommended)

**File**: `scripts/manual-enrich.js`

This script lets you manually provide World Athletics IDs for each athlete.

**How to find athlete IDs:**

1. Go to https://worldathletics.org/athletes-home
2. Search for an athlete (e.g., "Kipchoge")
3. Click on their profile
4. Copy the ID from the URL: `https://worldathletics.org/athletes/kenya/eliud-kipchoge-14208194`
   - The ID is: `14208194`

**Usage:**

1. Edit `scripts/manual-enrich.js`
2. Add athlete name and ID pairs to the `athleteIds` object:
   ```javascript
   const athleteIds = {
     'Eliud Kipchoge': '14208194',
     'Sifan Hassan': '14489606',
     // Add more...
   };
   ```
3. Run: `node scripts/manual-enrich.js`

**Advantages:**
- ✅ Guaranteed accuracy
- ✅ No rate limiting issues
- ✅ Works reliably every time

**Disadvantages:**
- ⏰ Time consuming (58 athletes)
- 📝 Manual data entry required

### Option 2: Automated Scraping (Advanced)

**File**: `scripts/enrich-athletes.js`

This script attempts to automatically fetch data from World Athletics.

**Current Status:** ⚠️ Not working due to JavaScript-rendered search results

**What would be needed to fix it:**
- Use a headless browser (Puppeteer/Playwright) to execute JavaScript
- Or use World Athletics API if they have one
- Or reverse-engineer their API calls from browser DevTools

### Option 3: Batch Search URLs

For your convenience, here are search URLs for all 58 athletes. You can open these in tabs and manually collect IDs:

**Men's Athletes:**
- https://worldathletics.org/athletes-home?query=Eliud%20Kipchoge
- https://worldathletics.org/athletes-home?query=Benson%20Kipruto
- https://worldathletics.org/athletes-home?query=Deresa%20Geleta
- https://worldathletics.org/athletes-home?query=Evans%20Chebet
- https://worldathletics.org/athletes-home?query=Alexander%20Mutiso
- https://worldathletics.org/athletes-home?query=Abdi%20Nageeye
- https://worldathletics.org/athletes-home?query=Alphonce%20Simbu
- https://worldathletics.org/athletes-home?query=Sondre%20Nordstad%20Moen
- https://worldathletics.org/athletes-home?query=Felix%20Bour
- https://worldathletics.org/athletes-home?query=Matthias%20Kyburz
- https://worldathletics.org/athletes-home?query=Abel%20Kipchumba
- https://worldathletics.org/athletes-home?query=Biya%20Simbassa
- https://worldathletics.org/athletes-home?query=Albert%20Korir
- https://worldathletics.org/athletes-home?query=Tsegay%20Tuemay
- https://worldathletics.org/athletes-home?query=Emmanuel%20Levisse
- https://worldathletics.org/athletes-home?query=Pat%20Tiernan
- https://worldathletics.org/athletes-home?query=Daniele%20Meucci
- https://worldathletics.org/athletes-home?query=Alex%20Maier
- _(... and more)_

## Recommended Workflow

1. **Start with top athletes**: Focus on the most important athletes first (top 10-15 per gender)
2. **Use manual script**: Update `manual-enrich.js` with IDs as you find them
3. **Run incrementally**: Run the script each time you add 5-10 athletes
4. **Backup automatically created**: The script creates `athletes.json.backup` before each run

## Current Status

**Enriched Athletes:** 3/58 (5%)
- ✅ Eliud Kipchoge (14208194)
- ✅ Sifan Hassan (14489606)
- ✅ Hellen Obiri (14424921)

**Remaining:** 55 athletes need World Athletics IDs

## Alternative: Using the Data You Have

If full enrichment is too time-consuming, you can:
- Keep the placeholder headshots you currently have
- Add IDs only for top-tier athletes that fans will recognize
- Add data incrementally over time as you find it

The app will work fine with partial data - the headshots and World Athletics links are enhancements, not requirements.
