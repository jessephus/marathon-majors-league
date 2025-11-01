# Fantasy Marathon - Chrome Extension

## 🚀 Installation

### Step 1: Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right corner)
3. Click **"Load unpacked"**
4. Select the `browser-extension` folder from this repository
5. The extension should now appear in your extensions list

### Step 2: Pin the Extension

1. Click the **puzzle piece icon** (🧩) in Chrome toolbar
2. Find **"Fantasy Marathon Live Results"**
3. Click the **pin icon** to keep it visible in your toolbar

## 📖 Usage (Debug Mode)

Currently, the extension is in **DEBUG MODE** - it scrapes data and outputs to the browser console instead of sending to the API.

### How to Test:

1. **Navigate to NYRR Leaderboard**
   - Go to: https://liveresults.nyrr.org/e/NYRR-NY2025#/leaderboard/...
   - Or any NYRR race leaderboard page

2. **Open the Extension**
   - Click the extension icon in your Chrome toolbar
   - A popup will appear

3. **Configure Settings**
   - Game ID: e.g., `demo-game`
   - Split Type: Select the checkpoint (5K, 10K, Half, Finish, etc.)
   - Division: Men or Women (auto-detected from page)

4. **Open Developer Console**
   - Press `F12` or right-click → Inspect
   - Go to the **Console** tab

5. **Click "Scrape to Console"**
   - The extension will scrape the leaderboard
   - Results will be logged to the console with detailed formatting

6. **Review Output**
   - Check console for scraped athlete data
   - Verify names, countries, times, ranks are correct
   - Copy the JSON payload shown in console

## 🔍 What Gets Scraped

The extension extracts:
- **Rank**: Position in race (1, 2, 3, ...)
- **Name**: Athlete's full name
- **Country**: 3-letter country code (USA, KEN, ETH, etc.)
- **Time**: Finish or split time (normalized to H:MM:SS format)

Example output:
```json
{
  "rank": 1,
  "name": "Eliud Kipchoge",
  "country": "KEN",
  "time": "2:04:05"
}
```

## 🛠️ How It Works

### Content Script (`content.js`)
- Runs on every NYRR/RTRT page
- Attempts multiple CSS selectors to find leaderboard rows
- Parses athlete data from table cells/divs
- Works even when data is in an iframe (bypasses cross-origin restrictions!)

### Popup (`popup.html` + `popup.js`)
- User interface for configuration
- Triggers scraping via message to content script
- Currently logs to console (DEBUG MODE)
- Will send to API in production mode

### Background Script (`background.js`)
- Service worker that runs in background
- Handles extension lifecycle events

## 🔧 Next Steps

### Phase 1: Test Scraping ✅ (Current)
- [x] Load extension in Chrome
- [x] Navigate to NYRR leaderboard
- [x] Click extension and review console output
- [x] Verify data quality

### Phase 2: Create API Endpoint
- [ ] Create `/api/import-live-results` endpoint
- [ ] Accept scraped data payload
- [ ] Match athletes to database by name/country
- [ ] Update race results in game

### Phase 3: Production Mode
- [ ] Remove DEBUG MODE from `popup.js`
- [ ] Enable API sending
- [ ] Add session token authentication
- [ ] Test end-to-end workflow

## 📝 Troubleshooting

### Extension not loading?
- Make sure Developer Mode is enabled in `chrome://extensions/`
- Check for errors in the Extensions page

### Content script not running?
- Refresh the NYRR page after loading extension
- Check console for "Fantasy Marathon extension loaded" message

### No data scraped?
- Make sure you're on the actual leaderboard page (not home page)
- Open console and look for detailed error messages
- The extension tries multiple selectors - check which ones were attempted

### Wrong gender detected?
- Manually select the correct division in the popup
- Gender auto-detection looks for "men"/"women" in URL and page text

## 🔐 Permissions Explained

- **activeTab**: Access current tab's content to scrape leaderboard
- **storage**: Save game ID and settings between uses
- **host_permissions**: Access NYRR and RTRT domains to inject content script

## 📦 Files

```
browser-extension/
├── manifest.json      # Extension configuration
├── content.js         # Scraper (runs on NYRR pages)
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic (DEBUG MODE)
├── background.js      # Background service worker
└── README.md          # This file
```

## 🎨 Future Enhancements

- Icon images (16x16, 48x48, 128x128)
- Options page for API endpoint configuration
- Error recovery and retry logic
- Support for other race timing sites
- Export scraped data as CSV
