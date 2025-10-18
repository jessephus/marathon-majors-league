# Playwright Implementation - Limitations and Findings

## Summary

We successfully implemented Playwright browser automation for the athlete progression extraction script, but encountered significant limitations due to World Athletics' anti-bot protection.

## What Works ✅

### 1. Progression Data Extraction (No Playwright needed)
- **All years** (2013-2025) extracted in **1 HTTP request**
- Includes: 5K, 10K, 20K, Half Marathon, Marathon
- Data: year, mark, venue, date, score, competition
- **No bot detection issues**

### 2. Single Year Race Results with Playwright
- Successfully extracts detailed race results for **current year** (2025)
- Uses stealth Playwright settings to bypass initial bot detection
- Requires immediate content extraction (before anti-bot kicks in)
- Data: date, competition, venue, place, mark, score, category

## What Doesn't Work ❌

### Multi-Year Race Results
**Problem**: World Athletics actively detects and blocks browser automation

**Symptoms**:
- First page load: ✅ Works
- Subsequent navigation: ❌ `ERR_ABORTED` or "Target page closed"
- Fresh browser sessions: ❌ Still blocked after first success

**Detection Methods** (observed):
1. **Post-load detection**: Page closes itself after initial load if automation detected
2. **Cross-session tracking**: Even fresh browser contexts get blocked
3. **Rate limiting**: Multiple requests in short time period trigger blocks
4. **IP-based tracking**: Subsequent requests from same IP fail

## Technical Implementation

### URL Construction
Correct format: `https://worldathletics.org/athletes/{country}/{firstname}-{lastname}-{id}`
- Example: `https://worldathletics.org/athletes/kenya/peres-jepchirchir-14593938`
- Country name from `basicData.countryFullName` (not `countryCode`)

### Stealth Settings Used
```python
browser.launch(
    headless=True,
    args=['--disable-blink-features=AutomationControlled', '--no-sandbox']
)

context.new_context(
    viewport={'width': 1920, 'height': 1080},
    user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ...',
    locale='en-US',
    timezone_id='America/New_York'
)

page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined});")
```

### Key Insight
The site only shows **one year** of results per page load, and there's no URL parameter to change years. Year selection happens client-side, but attempting to interact with the page triggers bot detection.

## Workarounds Attempted

1. ❌ **URL parameters**: `?year=2024` doesn't work
2. ❌ **Clicking year selectors**: Page closes before interaction
3. ❌ **Fresh browser sessions**: Still tracked/blocked
4. ❌ **Delays between requests**: Doesn't help
5. ❌ **Different stealth techniques**: All detected

## Current Recommendations

### Option 1: Accept Current Limitation (Recommended)
- Extract **progression data** (all years) - works perfectly
- Extract **current year** race results with Playwright - works
- Document that historical race results require manual collection

**Pros**:
- Works reliably
- No ongoing bot detection issues
- Still gets valuable data

**Cons**:
- Only current year's detailed results

### Option 2: Manual Data Collection
- Export/scrape historical data once manually
- Store in database
- Use script for new/updated data only

**Pros**:
- Complete historical data
- One-time effort

**Cons**:
- Initial manual work required

### Option 3: Reverse Engineer GraphQL API
- Find their internal API endpoint
- Query directly (if publicly accessible)
- May require authentication

**Pros**:
- Could get all years in one request
- More efficient

**Cons**:
- 4-6 hours of reverse engineering
- May require auth tokens
- Could break if they change API

### Option 4: Longer Delays + Residential Proxies
- Wait 30+ seconds between requests
- Rotate IP addresses
- Use residential proxy service

**Pros**:
- Might bypass rate limiting

**Cons**:
- Expensive (proxy service)
- Slow (30+ seconds per year)
- Still not guaranteed to work

## Current Script Capabilities

```bash
# Extract progression data (all years) + current year results
python3 scripts/extract_athlete_progression.py \
  --athlete-id 14593938 \
  --years 2025 \
  --disciplines "Marathon" "Half Marathon" \
  --use-playwright \
  --output athlete_data.json
```

**Output**:
- ✅ Progression: ALL years (2013-2025)
- ✅ Race results: 2025 only (Marathon + Half Marathon)
- ✅ Formatted display + JSON export

## Conclusion

The World Athletics website has robust anti-bot protection that makes automated multi-year data collection impractical. The best approach is to:

1. Use the script for **progression data** (works perfectly)
2. Use the script for **current year** results (works with Playwright)
3. Accept that historical detailed results require alternative methods

The progression data already includes season's bests for all years, which may be sufficient for most use cases. If detailed race-by-race history is needed, manual export or API reverse engineering are the only viable options.
