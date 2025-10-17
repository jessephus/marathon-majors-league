# Scripts Directory

This directory contains utility scripts for maintaining the Fantasy NY Marathon application.

## enrich-athletes.js

Automatically fetches and updates athlete data from World Athletics.

### What it does

For each athlete in `athletes.json`, the script:
1. Searches for their World Athletics profile
2. Extracts their unique athlete ID
3. Updates their official headshot URL
4. Fetches current world rankings (marathon & road running)
5. Saves the enriched data back to `athletes.json`

### Usage

```bash
# Run from the project root
node scripts/enrich-athletes.js
```

### Features

- ✅ **Automatic URL construction**: Builds World Athletics profile URLs from athlete names
- ✅ **Data extraction**: Parses HTML to find athlete IDs and rankings
- ✅ **Rate limiting**: Waits 2 seconds between requests to be respectful
- ✅ **Backup creation**: Creates `athletes.json.backup` before modifying data
- ✅ **Progress logging**: Shows detailed progress for each athlete
- ✅ **Error handling**: Continues processing even if some athletes aren't found

### Output Format

The script adds/updates these fields for each athlete:

```json
{
  "id": 1,
  "name": "Eliud Kipchoge",
  "country": "KEN",
  "pb": "2:01:09",
  "headshotUrl": "https://media.aws.iaaf.org/athletes/14208194.jpg",
  "worldAthletics": {
    "id": "14208194",
    "profileUrl": "https://worldathletics.org/athletes/kenya/eliud-kipchoge-14208194",
    "marathonRank": 61,
    "roadRunningRank": 45
  }
}
```

### Country Code Mapping

The script maps country codes to World Athletics country slugs:

- KEN → kenya
- NED → netherlands
- ETH → ethiopia
- USA → united-states
- GBR → great-britain-ni
- etc.

### Expected Runtime

- ~58 athletes × 2 seconds = ~2 minutes total
- Creates backup before starting
- Shows progress for each athlete

### Troubleshooting

**"Not found" errors**: Some athletes may not be found if:
- Their name format differs on World Athletics
- They don't have a World Athletics profile
- The URL format is different for their country

**Rate limiting errors**: If you see connection errors, the script already includes 2-second delays. You can increase the delay in the code if needed.

### Manual Verification

After running, you can verify the data:
1. Check `athletes.json` for updated `headshotUrl` and `worldAthletics` fields
2. Visit a few profile URLs to confirm they're correct
3. If needed, restore from `athletes.json.backup`

### Next Steps

After enrichment, you may want to:
1. Update the frontend to display rankings
2. Add athlete profile links
3. Use the headshots in the UI
4. Create a cron job to update rankings periodically
