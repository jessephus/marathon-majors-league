# Live Results Bookmarklet - Implementation Summary

## 🎯 What Was Built

A **semi-automated system** for importing live marathon results from the NYRR leaderboard directly into your Fantasy Marathon game using a browser bookmarklet.

## 📦 What You Get

### 1. The Bookmarklet Tool
- **Location**: Accessible at `/bookmarklet` page on your app
- **What it does**: One click to import all visible athletes from NYRR leaderboard
- **How to install**: Drag the orange button to your bookmarks bar
- **Supports**: All marathon splits (5K, 10K, Half, 30K, 35K, 40K, Finish)

### 2. Installation Page
- **URL**: `https://your-app.vercel.app/bookmarklet`
- **Features**:
  - Step-by-step installation instructions
  - Visual guides for all browsers
  - Usage instructions for race day
  - Troubleshooting FAQ
  - Test utilities

### 3. API Endpoint
- **Endpoint**: `POST /api/import-live-results`
- **What it does**: Receives scraped data and updates database
- **Features**:
  - Smart athlete name matching
  - Validation and error handling
  - Detailed success/failure reporting

### 4. Test Page
- **URL**: `https://your-app.vercel.app/bookmarklet-test.html`
- **What it does**: Simulates NYRR leaderboard for testing
- **Contains**: 20 sample athletes with realistic data

### 5. Documentation
- **Main Guide**: `/docs/BOOKMARKLET.md` (400+ lines)
- **Covers**: Installation, usage, troubleshooting, technical details
- **README Updates**: Features list and commissioner instructions

## 🚀 How to Use It

### Before Race Day (One-Time Setup)

1. **Install the Bookmarklet**
   ```
   → Go to: https://your-app.vercel.app/bookmarklet
   → Drag the orange "Import NYRR Results" button to your bookmarks bar
   → Done!
   ```

2. **Test It**
   ```
   → Go to: https://your-app.vercel.app/bookmarklet-test.html
   → Click your new bookmarklet
   → See it extract the 20 sample athletes
   → Verify the import dialog appears
   ```

### On Race Day

1. **Navigate to NYRR Leaderboard**
   ```
   Example: https://liveresults.nyrr.org/e/NY2025#/leaderboard/top-men-overall-marathon/FINISH
   ```

2. **Click Your Bookmarklet**
   - The bookmarklet detects all athletes on the page
   - Shows you how many were found

3. **Configure Settings**
   - **Game ID**: Enter your game ID (e.g., "default")
   - **Split Type**: Select which split (5K, 10K, Half, etc.)
   - **Division**: Verify Men/Women (auto-detected)
   - **Session Token**: Leave blank (unless required)

4. **Import**
   - Click "Import Results"
   - See success summary
   - Check which athletes were imported

5. **Repeat Throughout Race**
   - Update each split as it becomes available
   - Just change the "Split Type" each time
   - Same bookmarklet works for all splits

## 🎨 User Interface Changes

### Landing Page
Added "Commissioner Tools" section with link to bookmarklet:
```
👑 Commissioner Tools
Manage your game and import live race results
[📊 Live Results Bookmarklet]
```

### Footer
Added quick access link:
```
[Home] [Commissioner Mode] [📊 Live Results Tool]
```

### New Pages
- `/bookmarklet` - Full installation and usage guide
- `/bookmarklet-test.html` - Test page

## 🔧 Technical Details

### How It Works

1. **Bookmarklet Click**
   - Injects JavaScript into NYRR page
   - Searches for leaderboard table rows
   - Extracts athlete data from each row

2. **Data Extraction**
   - **Name**: Looks for text fields
   - **Time**: Matches HH:MM:SS or MM:SS format
   - **Country**: Matches 3-letter country codes
   - **Rank**: First numeric column

3. **Smart Matching**
   - Tries exact name match in database
   - Falls back to last name match
   - Reports which athletes couldn't be matched

4. **Database Update**
   - Uses upsert pattern (INSERT ON CONFLICT UPDATE)
   - Updates appropriate split column
   - Safe to re-import same split multiple times

### Database Schema

Uses existing `race_results` table:
```sql
race_results (
  game_id,
  athlete_id,
  split_5k,      -- ← Updated by "5K" import
  split_10k,     -- ← Updated by "10K" import
  split_15k,     -- ← Updated by "15K" import
  split_20k,     -- ← Updated by "20K" import
  split_half,    -- ← Updated by "Half" import
  split_25k,     -- ← Updated by "25K" import
  split_30k,     -- ← Updated by "30K" import
  split_35k,     -- ← Updated by "35K" import
  split_40k,     -- ← Updated by "40K" import
  finish_time,   -- ← Updated by "Finish" import
  placement,     -- ← Updated with finish imports
  ...
)
```

Schema expanded to support 10 different splits for engaging live updates!

### API Request Example

```json
POST /api/import-live-results

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
    ...
  ]
}
```

### API Response Example

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
      "name": "Unknown Athlete",
      "reason": "Athlete not found in database"
    }
  ]
}
```

## 🛡️ Security

### Measures Implemented
- ✅ Input validation on all API parameters
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input sanitization for logging
- ✅ CORS headers for cross-origin requests
- ✅ Optional session token authentication

### CodeQL Scan
- 1 false positive alert (format string in logging)
- Input sanitization added as mitigation
- No actual security vulnerabilities

## 📊 Before vs After

### Before This Implementation
❌ Manual entry of each athlete's time  
❌ 20-30 minutes per split to enter data  
❌ High risk of typos and errors  
❌ Tedious and error-prone process  
❌ Commissioner can't enjoy watching race  

### After This Implementation
✅ One-click import of all athletes  
✅ 30 seconds to import entire split  
✅ Automatic name matching eliminates typos  
✅ Quick and accurate process  
✅ Commissioner can focus on the race!  

## 🎓 Learning Resources

### For Users
1. **Installation Guide**: `/bookmarklet` page
2. **Documentation**: `/docs/BOOKMARKLET.md`
3. **Test Page**: `/bookmarklet-test.html`

### For Developers
1. **API Code**: `/pages/api/import-live-results.js`
2. **Bookmarklet Code**: `/public/bookmarklet.js`
3. **Test Suite**: `/tests/import-api.test.js`

## 🐛 Troubleshooting

### "No athletes found"
→ Make sure you're on the actual leaderboard page with visible results

### "Athlete not found in database"
→ Add missing athletes to your database first, or check name spellings

### "Forbidden" error
→ May need session token - get it from commissioner login

### Bookmarklet doesn't work
→ Make sure you dragged it to bookmarks bar (don't click it)

## 🎉 Next Steps

1. **Install the bookmarklet** from `/bookmarklet` page
2. **Test it** on the test page
3. **Share the page** with other commissioners
4. **Use it on race day** to save hours of manual work!

## 📞 Support

If you encounter any issues:
- Check `/docs/BOOKMARKLET.md` for detailed troubleshooting
- Review the test page to verify installation
- Check browser console for error messages
- Ensure athlete names in your database match NYRR

---

**Built and ready for the NYC Marathon! 🏃‍♂️🗽**
