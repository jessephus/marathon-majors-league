# Bulk Athlete Confirmation Tool

**Status:** ✅ Active  
**Date:** November 24, 2025  
**Location:** `scripts/bulk-confirm-athletes.js`  
**Type:** Commissioner Administrative Tool  

---

## Overview

The Bulk Athlete Confirmation Tool is a command-line script that enables commissioners to efficiently confirm multiple athletes for a race by processing CSV or JSON files. This tool eliminates the need for manual, one-by-one confirmation through the web UI, making it significantly faster to set up races with large athlete fields.

## Key Features

### 1. **Intelligent Name Matching**
- Uses Levenshtein distance algorithm for fuzzy name matching
- Handles typos, spelling variations, and name formatting differences
- 70% similarity threshold for matches (configurable)
- Reports ambiguous matches when multiple similar names exist

### 2. **Automatic Athlete Creation**
- Creates new athlete records for names not found in database
- Searches World Athletics API by name to find athlete profiles
- Enriches new athletes with official WA data (PB, rankings, country)
- Uses best-match similarity scoring for WA search results

### 3. **World Athletics Integration**
- GraphQL API integration for athlete search
- Profile data enrichment (personal best, season best, rankings)
- Automatic country and date of birth extraction
- Headshot URL generation from World Athletics ID

### 4. **Flexible Input Formats**
- **CSV Support**: Standard comma-separated format with headers
- **JSON Support**: Array of athlete objects
- Minimal required fields: name, gender
- Optional fields: country (helps with matching)

### 5. **Safe Operations**
- **Dry-run mode**: Preview changes before committing
- **Idempotent**: Can be safely re-run without duplicates
- **Comprehensive reporting**: Shows matched, created, ambiguous, and failed athletes
- **Error handling**: Continues processing even if some athletes fail

## Usage

### Basic Command Structure

```bash
node scripts/bulk-confirm-athletes.js --file <path> --race-id <id> [options]
```

### Required Arguments

- `--file, -f`: Path to CSV or JSON file containing athlete names
- `--race-id, -r`: Database ID of the race to confirm athletes for

### Optional Flags

- `--dry-run`: Preview changes without modifying the database
- `--create-new`: Create new athletes if not found (default: true)
- `--no-enrich`: Skip World Athletics enrichment for new athletes
- `--help, -h`: Display help message

### Examples

#### Dry Run (Recommended First Step)
```bash
node scripts/bulk-confirm-athletes.js \
  --file athletes.csv \
  --race-id 1 \
  --dry-run
```

#### Confirm Athletes from CSV
```bash
node scripts/bulk-confirm-athletes.js \
  --file /path/to/athletes.csv \
  --race-id 1
```

#### Confirm Athletes from JSON
```bash
node scripts/bulk-confirm-athletes.js \
  --file /path/to/athletes.json \
  --race-id 1
```

#### Fast Mode (Skip Enrichment)
```bash
node scripts/bulk-confirm-athletes.js \
  --file athletes.csv \
  --race-id 1 \
  --no-enrich
```

## Input File Formats

### CSV Format

CSV files must include a header row with `name` and `gender` columns. The `country` column is optional but recommended.

```csv
name,gender,country
Eliud Kipchoge,men,KEN
Sifan Hassan,women,NED
Hellen Obiri,women,KEN
Kelvin Kiptum,men,KEN
Tigst Assefa,women,ETH
```

**Required Columns:**
- `name`: Full athlete name (case-insensitive)
- `gender`: Must be exactly `men` or `women`

**Optional Columns:**
- `country`: 3-letter country code (e.g., KEN, USA, ETH)

### JSON Format

JSON files must contain an array of athlete objects.

```json
[
  {
    "name": "Eliud Kipchoge",
    "gender": "men",
    "country": "KEN"
  },
  {
    "name": "Sifan Hassan",
    "gender": "women",
    "country": "NED"
  },
  {
    "name": "Hellen Obiri",
    "gender": "women",
    "country": "KEN"
  }
]
```

**Required Properties:**
- `name`: Full athlete name (string)
- `gender`: Must be exactly `"men"` or `"women"`

**Optional Properties:**
- `country`: 3-letter country code (string)

### Example Files

Sample input files are provided in `scripts/examples/`:
- `athletes-sample.csv` - CSV format example with 10 athletes
- `athletes-sample.json` - JSON format example with 10 athletes

## How It Works

### Step 1: File Parsing
The script reads the input file and extracts athlete information. It validates that required fields are present and formats the data into a standard structure.

### Step 2: Database Matching
For each athlete in the input:
1. Fetches all athletes from database with matching gender
2. Calculates name similarity using Levenshtein distance
3. Identifies matches above 70% similarity threshold
4. Reports ambiguous cases with multiple similar matches

**Name Normalization:**
- Converts to lowercase
- Removes punctuation
- Normalizes whitespace
- Handles common variations (e.g., "Mohamed" vs "Mohammed")

### Step 3: New Athlete Creation
For athletes not found in the database:

1. **World Athletics Search** (if enrichment enabled):
   - Searches WA GraphQL API by name and gender
   - Finds best match using similarity scoring
   - Requires >70% similarity to use result

2. **Profile Enrichment**:
   - Fetches detailed athlete profile from WA
   - Extracts personal best, season best, rankings
   - Calculates age from date of birth
   - Generates headshot URL

3. **Database Insertion**:
   - Creates athlete record with enriched data
   - Uses fallback values if enrichment fails
   - Assigns default PB of 2:30:00 if unknown

### Step 4: Race Confirmation
- Bulk inserts into `athlete_races` junction table
- Uses `ON CONFLICT DO NOTHING` for idempotency
- Reports newly confirmed vs already confirmed athletes

### Step 5: Reporting
Comprehensive output includes:
- Matching summary (matched/not found/ambiguous)
- Details of created athletes with enrichment status
- Confirmation results
- Final summary with counts

## Output Example

```
╔══════════════════════════════════════════════════════════════╗
║   Bulk Athlete Confirmation Tool                            ║
╚══════════════════════════════════════════════════════════════╝

📍 Target Race: New York City Marathon 2025 (2025-11-03)
📂 Input File: athletes.csv

📖 Loading athletes from file...
   Found 10 athletes in file

🔍 Matching athletes to database...

  Checking: Eliud Kipchoge (men)
    ✅ Matched to: Eliud Kipchoge (100.0% similar)
  Checking: Sifan Hassan (women)
    ✅ Matched to: Sifan Hassan (100.0% similar)
  Checking: New Runner Name (women)
    ❌ Not found

================================================================
📊 MATCHING SUMMARY
================================================================
   ✅ Matched:    8
   ❌ Not Found:  2
   ⚠️  Ambiguous:  0

================================================================
🆕 CREATING NEW ATHLETES
================================================================

  Creating: New Runner Name (women, ETH)
    🔍 Searching World Athletics...
    ✅ Found on WA: New Runner Name (95.2% match)
       ID: 12345678, Country: ETH
    📊 Fetching profile data...
    ✅ Enriched with PB: 2:18:34, Rank: 25
    ✅ Created athlete ID 123

  Creating: Another New Athlete (men, KEN)
    🔍 Searching World Athletics...
    ⚠️  Not found on World Athletics
    ✅ Created athlete ID 124

================================================================
✅ CONFIRMATION SUMMARY
================================================================
   ✅ Newly Confirmed: 10
   ℹ️  Already Confirmed: 0
   ❌ Errors: 0

================================================================
🎉 FINAL SUMMARY
================================================================
   Total Athletes Processed: 10
   Successfully Matched: 8
   Newly Created: 2
   Ambiguous Matches: 0
   Failed to Process: 0

✅ Bulk confirmation complete!
```

## Error Handling

### Ambiguous Matches
When multiple database athletes match an input name with similar scores:

```
⚠️  AMBIGUOUS MATCHES
The following athletes have multiple possible matches.
Please manually verify or update the input file with more specific names.

  John Smith:
    - John Smith (USA) - 85.5% match
    - Jon Smith (KEN) - 82.3% match
```

**Resolution:**
- Use the web UI to manually select the correct athlete
- Update input file with more distinctive information (e.g., country)
- Check existing database records for duplicates

### World Athletics Not Found
When an athlete can't be found on World Athletics:

```
  Creating: Unknown Athlete (women, USA)
    🔍 Searching World Athletics...
    ⚠️  Not found on World Athletics
    ✅ Created athlete ID 125
```

**Result:**
- Athlete is still created with minimal data
- Uses provided country or defaults to 'UNK'
- Uses default personal best of 2:30:00
- Can be manually enriched later via web UI

### API Errors
The script includes comprehensive error handling:
- Network timeouts are caught and logged
- API failures don't stop processing
- Partial results are saved
- Detailed error messages for debugging

## Best Practices

### 1. Always Dry Run First
```bash
# Preview changes before committing
node scripts/bulk-confirm-athletes.js --file athletes.csv --race-id 1 --dry-run
```

### 2. Use Example Files for Testing
```bash
# Test with provided sample data
node scripts/bulk-confirm-athletes.js \
  --file scripts/examples/athletes-sample.csv \
  --race-id 1 \
  --dry-run
```

### 3. Include Country Information
Adding country codes improves matching accuracy and provides fallback data if World Athletics search fails.

### 4. Review Ambiguous Matches
When the tool reports ambiguous matches, manually review them in the web UI or update your input file with more distinctive information.

### 5. Keep Input Files for Reference
Save your input files for documentation and potential re-runs if needed.

### 6. Use Fast Mode for Large Files
If you're confirming athletes that already exist in the database:
```bash
node scripts/bulk-confirm-athletes.js --file athletes.csv --race-id 1 --no-enrich
```

### 7. Verify Race ID
Always check that you're using the correct race ID:
```bash
# Query races table to find the right ID
SELECT id, name, date FROM races WHERE is_active = true;
```

## Technical Implementation

### Dependencies
- `@neondatabase/serverless`: Database connection
- `dotenv`: Environment variable management
- Native Node.js modules (fs, path)

### Database Tables
- **athletes**: Main athlete data (read/write)
- **races**: Race information (read only)
- **athlete_races**: Junction table for confirmations (write)

### World Athletics API
- **Endpoint**: `https://graphql-prod-4746.prod.aws.worldathletics.org/graphql`
- **Methods**: `searchCompetitors`, `getSingleCompetitor`
- **Rate Limiting**: 1-second delay between requests
- **Authentication**: Public API key (included in script)

### Algorithms

**Levenshtein Distance:**
```javascript
function levenshteinDistance(str1, str2) {
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  // Dynamic programming implementation
  // Returns minimum edit distance between strings
}
```

**Name Similarity Score:**
```javascript
function nameSimilarity(name1, name2) {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  if (norm1 === norm2) return 1.0;
  const distance = levenshteinDistance(norm1, norm2);
  return 1 - (distance / Math.max(norm1.length, norm2.length));
}
```

## Environment Setup

### Required Environment Variable
```bash
DATABASE_URL=postgresql://user:password@host.neon.tech/database
```

### Local Development
```bash
# Create .env file in project root
echo "DATABASE_URL=your_connection_string" > .env

# Test connection
node scripts/bulk-confirm-athletes.js --help
```

### Production Use
```bash
# Pull environment from Vercel
vercel env pull

# Or set directly
export DATABASE_URL="postgresql://..."
```

## Performance Characteristics

### Speed
- **Matching**: ~100 athletes/second (database lookup)
- **WA Search**: ~1 athlete/second (with rate limiting)
- **Profile Enrichment**: ~1 athlete/second (with rate limiting)

### Typical Run Times
- 10 existing athletes (matching only): ~1 second
- 10 new athletes (with enrichment): ~20 seconds
- 100 existing athletes: ~2 seconds
- 100 new athletes (with enrichment): ~3 minutes

### Optimization Tips
- Use `--no-enrich` for faster processing of existing athletes
- Pre-populate database with known athletes using sync scripts
- Run during off-peak hours for large batches

## Troubleshooting

### Issue: "DATABASE_URL environment variable not set"
**Solution:** Create a `.env` file or set the environment variable:
```bash
export DATABASE_URL="postgresql://..."
```

### Issue: "Race with ID X not found"
**Solution:** Query the database to find the correct race ID:
```sql
SELECT id, name, date FROM races;
```

### Issue: "CSV must have 'name' and 'gender' columns"
**Solution:** Ensure your CSV has a proper header row:
```csv
name,gender,country
Athlete Name,men,KEN
```

### Issue: Too many ambiguous matches
**Solution:** Add country information to your input file to improve matching specificity.

### Issue: World Athletics enrichment fails
**Solution:** 
- Check internet connectivity
- Verify WA API is accessible
- Run with `--no-enrich` to skip enrichment
- Manually enrich athletes later via web UI

## Security Considerations

- Script requires direct database access (commissioner-level access)
- Should be run locally, not exposed via web interface
- Uses read-only WA API (public data only)
- No user authentication token required
- Validates all input data before database operations

## Future Enhancements

Potential improvements for future versions:

- [ ] Support for Excel (.xlsx) input files
- [ ] Batch confirmation across multiple races
- [ ] Undo/rollback functionality
- [ ] Progress bar for large file processing
- [ ] Auto-detection of athlete duplicates
- [ ] Integration with race registration systems
- [ ] Email notification of results
- [ ] Web UI wrapper for non-technical commissioners

## Related Documentation

- **[Scripts README](../scripts/README.md)** - Overview of all scripts
- **[Database Guide](TECH_DATABASE.md)** - Database schema reference
- **[Commissioner Panels](FEATURE_COMMISSIONER_PANELS.md)** - Web UI tools
- **[Sync Top 100](FEATURE_SYNC_TOP_100.md)** - Athlete data automation
- **[User Guide](CORE_USER_GUIDE.md)** - Commissioner instructions

## Changelog

### November 24, 2025 - Initial Release
- ✅ CSV and JSON file parsing
- ✅ Intelligent name matching with Levenshtein distance
- ✅ World Athletics search and enrichment
- ✅ Bulk race confirmation
- ✅ Dry-run mode
- ✅ Comprehensive error handling and reporting
- ✅ Example input files
- ✅ Full documentation

---

**Document Version:** 1.0  
**Last Updated:** November 24, 2025  
**Maintainer:** GitHub Copilot
