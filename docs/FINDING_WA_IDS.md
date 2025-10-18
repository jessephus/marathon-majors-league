# Quick Guide: Finding World Athletics IDs

## For the 10 Athletes Missing WA_IDs

This guide helps commissioners find and add World Athletics IDs for athletes currently missing them.

## Method 1: World Athletics Website Search

1. **Go to:** https://worldathletics.org/
2. **Search:** Use the search bar (top right)
3. **Enter:** Athlete's full name
4. **Click:** The athlete's profile
5. **Copy ID:** From the URL

**Example:**
- Search for: "Charles Hicks"
- Profile URL: `https://worldathletics.org/athletes/united-states/charles-hicks-14208500`
- **World Athletics ID:** `14208500`

## Method 2: Direct Search URL Pattern

Use this URL pattern to search:
```
https://worldathletics.org/athletes/search?q=[ATHLETE NAME]
```

Example:
```
https://worldathletics.org/athletes/search?q=Charles%20Hicks
```

## Athletes to Look Up

### Men (7 athletes)

| ID  | Name                        | Country | Alternative Names         |
|-----|-----------------------------|---------| --------------------------|
| 31  | Charles Hicks               | USA     | Charlie Hicks             |
| 33  | Charles Philibert-Thiboutot | CAN     | C. Philibert-Thiboutot    |
| 15  | Emmanuel Levisse            | FRA     | -                         |
| 29  | Hillary Bor                 | USA     | Hilary Bor                |
| 32  | Joe Klecker                 | USA     | Joseph Klecker            |
| 19  | Jonny Mellor                | GBR     | Jonathan Mellor           |
| 30  | Patrick Dever               | USA     | Pat Dever                 |

### Women (3 athletes)

| ID  | Name                        | Country | Alternative Names         |
|-----|-----------------------------|---------| --------------------------|
| 125 | Amanda Vestri               | USA     | -                         |
| 124 | Jessica Warner-Judd         | GBR     | Jess Warner-Judd          |
| 123 | Karoline Bjerkeli Grøvdal   | NOR     | Karoline Grovdal          |

## Tips for Searching

1. **Try variations:**
   - Full name vs. shortened name (Jonathan vs. Jonny)
   - With/without middle names
   - Different spellings

2. **Use country filter:** 
   - If multiple results, filter by country

3. **Check recent results:**
   - Look for marathon results from 2024-2025
   - Verify it's the same athlete

4. **Not found?**
   - Athlete might not be in World Athletics database yet
   - Some debutants don't have profiles
   - Leave blank and revisit after their first marathon

## Common Issues

### "Multiple athletes with same name"
- Use country to narrow down
- Check personal best times match
- Look at competition history

### "Athlete not found"
- Try alternative name spellings
- Check if they've competed internationally
- Some US-only runners might not be listed

### "Profile exists but no ID in URL"
- This is rare - all WA profiles have IDs
- Try accessing profile from different page
- Report if consistently missing

## After Adding IDs

1. **Save each one** using the 💾 Save button
2. **Verify saved** by refreshing the page
3. **Run sync script** with `--sync-dropped` flag
4. **Check database** to confirm IDs are stored

## Example Workflow

```bash
# 1. Find IDs manually on World Athletics website
# 2. Enter them in Commissioner Mode > Athlete Management
# 3. Click Save for each athlete
# 4. Verify all 10 have IDs now

# 5. Test with sync script
python3 scripts/sync_athletes_from_rankings.py --limit 30 --sync-dropped

# 6. Check if dropped athletes are being found
# Look for output: "✓ Found: [Athlete Name] (rank X)"
```

## Batch Entry Template

For easy copying to team/group chat:

```
Need help finding World Athletics IDs for these 10 athletes:

MEN:
- Charles Hicks (USA)
- Charles Philibert-Thiboutot (CAN)  
- Emmanuel Levisse (FRA)
- Hillary Bor (USA)
- Joe Klecker (USA)
- Jonny Mellor (GBR)
- Patrick Dever (USA)

WOMEN:
- Amanda Vestri (USA)
- Jessica Warner-Judd (GBR)
- Karoline Bjerkeli Grøvdal (NOR)

Please search at: https://worldathletics.org/
Format: Copy ID from URL (e.g., 14208500)
```

## World Athletics ID Format

- **Always numeric** (no letters)
- **Usually 8 digits** (e.g., 14208500)
- **Sometimes shorter** for older athletes (e.g., 123456)
- **Case insensitive** (it's just numbers)

## Verification

After entering all IDs, run this SQL to verify:

```sql
SELECT 
    id, 
    name, 
    country,
    world_athletics_id
FROM athletes
WHERE id IN (31, 33, 15, 29, 32, 19, 30, 125, 124, 123)
ORDER BY gender, name;
```

Expected: All 10 should have `world_athletics_id` populated.

## Questions?

If you can't find an athlete's ID:
1. Check alternative name spellings
2. Verify they've competed internationally  
3. Leave blank for now (can add later)
4. Document why it's missing (e.g., "US-only, not in WA database")

---

**Remember:** Having World Athletics IDs enables automatic sync updates when athletes drop out of the top 100. It's worth the effort to find them!
