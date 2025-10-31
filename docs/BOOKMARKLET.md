# Live Results Bookmarklet Documentation

## Overview

The **Live Results Bookmarklet** is a semi-automated tool that allows commissioners to quickly import live race results from the NYRR (New York Road Runners) leaderboard page directly into their Fantasy Marathon game. This eliminates the need to manually enter each athlete's time during the race.

## What is a Bookmarklet?

A bookmarklet is a special bookmark that contains JavaScript code. When you click it, it runs custom code on the current webpage. In this case, it scrapes athlete data from the NYRR leaderboard and sends it to the Fantasy Marathon API.

## Features

### Automatic Data Extraction
- **Scrapes athlete information** from the NYRR leaderboard table
- **Extracts**: Name, time, country code, and ranking
- **Auto-detects** men's vs women's division from the page URL or content
- **Handles multiple table formats** using flexible selectors

### Smart Athlete Matching
- **Exact name matching** finds athletes in your database
- **Fuzzy matching fallback** matches by last name if exact match fails
- **Detailed error reporting** shows which athletes couldn't be matched

### Multiple Split Support
Supports all standard marathon splits:
- 5K split
- 10K split  
- Half marathon (21.1K)
- 30K split
- 35K split
- 40K split
- Finish time

### User-Friendly Interface
- **Visual dialog** for confirming settings before import
- **Progress indication** shows how many athletes were found
- **Success/failure summary** reports results of the import
- **Error details** explain why specific athletes failed to import

## Installation

### Step 1: Show Your Bookmarks Bar

**Chrome/Edge:**
- Windows: Press `Ctrl+Shift+B`
- Mac: Press `Cmd+Shift+B`

**Firefox:**
- Windows: Press `Ctrl+Shift+B`
- Mac: Press `Cmd+Shift+B`

**Safari:**
- Go to View → Show Bookmarks Bar

### Step 2: Add the Bookmarklet

Visit the bookmarklet installation page:
```
https://your-app-url.vercel.app/bookmarklet
```

Drag the orange "Import NYRR Results" button to your bookmarks bar.

**Note:** Do NOT click the button - you must drag it to the bookmarks bar!

## How to Use

### During Race Day

1. **Navigate to NYRR Leaderboard**
   - Go to the live results page for the marathon
   - Example: `https://liveresults.nyrr.org/e/NY2025#/leaderboard/top-men-overall-marathon/FINISH`

2. **Click the Bookmarklet**
   - Click "Import NYRR Results" from your bookmarks bar
   - A dialog will appear showing how many athletes were detected

3. **Configure Import Settings**
   - **Game ID**: Your game's unique identifier (e.g., "default")
   - **Split Type**: Select which split you're capturing (5K, 10K, Half, etc.)
   - **Division**: Verify Men/Women (usually auto-detected)
   - **Session Token**: Optional - only needed if authentication is required

4. **Import Results**
   - Click "Import Results" button
   - Wait for confirmation message
   - Review the success/failure summary

5. **Repeat for Each Split**
   - As the race progresses, navigate to updated leaderboard pages
   - Click the bookmarklet again
   - Select the new split type
   - Import the latest results

## API Endpoint

### POST `/api/import-live-results`

Receives scraped leaderboard data and updates race results.

#### Request Body

```json
{
  "gameId": "default",
  "splitType": "half",
  "gender": "men",
  "athletes": [
    {
      "name": "Eliud Kipchoge",
      "time": "1:00:30",
      "country": "KEN",
      "rank": 1
    },
    {
      "name": "Kenenisa Bekele",
      "time": "1:00:45",
      "country": "ETH",
      "rank": 2
    }
  ],
  "sessionToken": "optional-auth-token"
}
```

#### Response

```json
{
  "message": "Import completed",
  "summary": {
    "total": 50,
    "successful": 48,
    "failed": 2
  },
  "updatedAthletes": [
    {
      "id": 123,
      "name": "Eliud Kipchoge",
      "time": "1:00:30",
      "split": "half"
    }
  ],
  "failedAthletes": [
    {
      "name": "Unknown Runner",
      "reason": "Athlete not found in database"
    }
  ],
  "splitType": "half",
  "gender": "men"
}
```

#### Error Responses

**400 Bad Request**
```json
{
  "error": "Missing required fields",
  "required": ["gameId", "splitType", "gender", "athletes (array)"]
}
```

**403 Forbidden**
```json
{
  "error": "Forbidden",
  "message": "Only commissioners can import race results"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

## Database Schema

The bookmarklet updates the `race_results` table:

```sql
CREATE TABLE race_results (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(255) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    finish_time VARCHAR(10),
    split_5k VARCHAR(10),
    split_10k VARCHAR(10),
    split_half VARCHAR(10),
    split_30k VARCHAR(10),
    split_35k VARCHAR(10),
    split_40k VARCHAR(10),
    placement INTEGER,
    -- ... other scoring fields ...
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(game_id, athlete_id)
);
```

Each import performs an **upsert** (INSERT ... ON CONFLICT UPDATE) to update existing records or create new ones.

## Technical Implementation

### Bookmarklet Code Structure

1. **Loader Snippet** (what's in the bookmark)
   ```javascript
   javascript:(function(){
     var s=document.createElement('script');
     s.src='https://your-app/bookmarklet.js?v='+Date.now();
     document.body.appendChild(s);
   })();
   ```
   
   This tiny snippet loads the full bookmarklet code from your server, ensuring it's always up-to-date.

2. **Main Script** (`/public/bookmarklet.js`)
   - Scrapes the leaderboard table
   - Detects gender from URL/page content
   - Creates UI overlay for user input
   - Sends data to API
   - Displays results

### Athlete Name Matching

The API uses a two-tier matching strategy:

1. **Exact Match** (case-insensitive)
   ```sql
   SELECT id FROM athletes 
   WHERE LOWER(name) = LOWER('Eliud Kipchoge')
   AND gender = 'men'
   ```

2. **Fuzzy Match** (by last name)
   ```sql
   SELECT id FROM athletes 
   WHERE LOWER(name) LIKE LOWER('%Kipchoge%')
   AND gender = 'men'
   ```

This handles variations in name formatting between the NYRR leaderboard and your athlete database.

### Split Column Mapping

```javascript
const splitColumnMap = {
  '5k': 'split_5k',
  '10k': 'split_10k',
  'half': 'split_half',
  '30k': 'split_30k',
  '35k': 'split_35k',
  '40k': 'split_40k',
  'finish': 'finish_time'
};
```

## Troubleshooting

### Problem: No Athletes Found

**Symptoms:**
- Bookmarklet shows "No athletes found on this page"

**Solutions:**
1. Make sure you're on the actual leaderboard page with visible results
2. Try scrolling to load all results if page uses lazy loading
3. The NYRR page structure may have changed - contact support for updates

### Problem: Athletes Not Matched

**Symptoms:**
- Import summary shows high failure rate
- Specific athletes listed as "not found in database"

**Solutions:**
1. Check athlete names in your Fantasy Marathon database
2. Ensure names match between NYRR and your database
3. Add missing athletes to your database before importing
4. Check that gender filter matches the division you're importing

### Problem: Authentication Errors

**Symptoms:**
- "Forbidden" or "Only commissioners can import" error

**Solutions:**
1. Verify you're logged in as commissioner in Fantasy Marathon
2. Copy your session token from the app
3. Paste it into the "Session Token" field in the bookmarklet dialog

### Problem: Incorrect Split Data

**Symptoms:**
- Times appear in wrong split column
- Half marathon times showing as 5K times, etc.

**Solutions:**
1. Double-check the "Split Type" selection in the dialog
2. Each import should only update ONE split type
3. If you made a mistake, import again with the correct split type

## Best Practices

### Before Race Day

1. **Test with historical data**
   - Use last year's results page to test the bookmarklet
   - Verify all athletes are properly matched
   - Practice the import workflow

2. **Verify athlete database**
   - Ensure all elite athletes are in your database
   - Check name spellings match NYRR format
   - Add any missing athletes before race day

3. **Set up authentication**
   - Test that you can access commissioner functions
   - Save your session token in a safe place
   - Know how to refresh it if it expires

### During Race Day

1. **Import progressively**
   - Start with early splits (5K, 10K)
   - Don't wait until the end to import everything
   - Each split provides more data for players

2. **Verify each import**
   - Check the success/failure summary after each import
   - Review failed athletes and investigate why
   - Re-import if needed to fix errors

3. **Communicate with players**
   - Let players know when you update results
   - Tell them to refresh to see latest data
   - Announce when you import final finish times

### After the Race

1. **Finalize results**
   - After importing finish times, finalize the game
   - This locks results and declares the winner
   - Players can't accidentally overwrite data

2. **Review for accuracy**
   - Spot-check a few athletes against official results
   - Verify top finishers have correct times
   - Fix any discrepancies before finalizing

## Security Considerations

### CORS (Cross-Origin Resource Sharing)

The API endpoint accepts requests from any origin (`Access-Control-Allow-Origin: *`) because the bookmarklet runs from the NYRR domain but needs to send data to your Fantasy Marathon domain.

### Authentication

- **Optional session token** provides commissioner verification
- **Rate limiting** (future enhancement) could prevent abuse
- **Input validation** prevents SQL injection and XSS attacks

### Data Privacy

- Only public leaderboard data is scraped
- No personal information beyond what's publicly visible
- Athlete names and times are already public on NYRR

## Future Enhancements

### Potential Improvements

1. **Automatic polling**
   - Browser extension could auto-refresh and import
   - No manual clicking required
   - Configurable polling interval

2. **Real-time updates**
   - WebSocket connection for live updates
   - Players see changes instantly without refresh
   - True live leaderboard experience

3. **Multiple race support**
   - Import from different marathon events
   - Support for other race websites (Boston, London, etc.)
   - Unified scraping interface

4. **Advanced matching**
   - Machine learning for name matching
   - Handle nicknames and variations
   - Confidence scores for fuzzy matches

5. **Historical data**
   - Store all imports with timestamps
   - Show progression through race
   - Replay race timeline for players

## Support

### Getting Help

If you encounter issues:

1. Check this documentation first
2. Review troubleshooting section
3. Test with the installation page: `/bookmarklet`
4. Contact support with:
   - Error messages
   - Screenshots
   - Game ID
   - Which split you were importing

### Reporting Bugs

When reporting issues, include:

- Browser name and version
- NYRR page URL you were using
- Full error message from bookmarklet
- Number of athletes on page
- Summary of successful vs failed imports

### Contributing

The bookmarklet is open source! Improvements welcome:

- Better table detection for NYRR changes
- Support for additional race websites
- UI/UX enhancements
- Performance optimizations

## Changelog

### Version 1.0.0 (Initial Release)

- Basic leaderboard scraping
- Support for all standard splits
- Men's and women's division detection
- Athlete name matching with fuzzy fallback
- Interactive configuration dialog
- Success/failure reporting
- API endpoint for data import
- Installation page with instructions

---

**Ready to use the bookmarklet?** Visit `/bookmarklet` to install it now!
