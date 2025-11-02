// Content script that runs on NYRR/RTRT pages
console.log('🏃 Fantasy Marathon extension loaded');
console.log('📍 URL:', window.location.href);
console.log('🖼️  In iframe:', window !== window.top);

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeLeaderboard') {
    console.log('📥 Received scrape request from popup');
    try {
      const athletes = scrapeLeaderboard();
      console.log('✅ Scraped athletes:', athletes);
      
      // Send response back to popup
      sendResponse({ success: true, athletes });
      
      // Also send to background script so popup can collect from all frames
      chrome.runtime.sendMessage({
        action: 'scrapedData',
        athletes,
        url: window.location.href,
        isIframe: window !== window.top
      }).catch(err => {
        // Popup might be closed, that's okay
        console.log('Could not send to background:', err.message);
      });
      
    } catch (error) {
      console.error('❌ Scraping error:', error);
      sendResponse({ success: false, error: error.message, url: window.location.href });
    }
    return true; // Keep message channel open for async response
  }
  
  if (request.action === 'detectGender') {
    const gender = detectGender();
    console.log('🔍 Detected gender:', gender);
    sendResponse({ gender });
    return true;
  }
});

function detectGender() {
  const url = window.location.href.toLowerCase();
  const pageText = document.body.innerText.toLowerCase();
  
  console.log('🔍 Detecting gender from URL and page content...');
  
  if (url.includes('women') || url.includes('female') || pageText.includes('top women')) {
    console.log('   → Detected: WOMEN');
    return 'women';
  } else if (url.includes('men') || url.includes('male') || pageText.includes('top men')) {
    console.log('   → Detected: MEN');
    return 'men';
  }
  
  console.log('   → Could not auto-detect gender');
  return null;
}

function normalizeTime(timeStr) {
  if (!timeStr) return null;
  
  // Remove any non-time characters
  timeStr = timeStr.trim().replace(/[^0-9:]/g, '');
  const parts = timeStr.split(':');
  
  // Convert MM:SS to H:MM:SS format
  if (parts.length === 2) {
    return `0:${timeStr}`;
  } else if (parts.length === 3) {
    return timeStr;
  }
  
  return timeStr;
}

function scrapeLeaderboard() {
  const athletes = [];
  
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('🔍 Starting leaderboard scrape...');
  console.log('═══════════════════════════════════════');
  console.log('📍 URL:', window.location.href);
  console.log('📄 Page title:', document.title);
  console.log('🖼️  In iframe:', window !== window.top);
  console.log('');
  
  // Try multiple selectors to find leaderboard rows
  const selectors = [
    'div[class*="leaderboard"] div[class*="row"]',
    'div[class*="result-row"]',
    'div[class*="result"] div[class*="row"]',
    'table tbody tr',
    'tr',
    '[role="row"]',
    'div[class*="athlete"]',
    'div[class*="competitor"]'
  ];
  
  let rows = [];
  let successfulSelector = null;
  
  for (const selector of selectors) {
    rows = Array.from(document.querySelectorAll(selector));
    console.log(`🔎 Trying selector "${selector}": found ${rows.length} elements`);
    
    // We want at least 10 rows (typical leaderboard has many more)
    if (rows.length >= 10) {
      successfulSelector = selector;
      console.log(`✅ Using selector "${selector}" (${rows.length} rows found)`);
      break;
    }
  }
  
  if (rows.length === 0) {
    console.error('❌ No leaderboard rows found with any selector!');
    console.log('');
    console.log('📋 Page HTML preview (first 1000 chars):');
    console.log(document.body.innerHTML.substring(0, 1000));
    throw new Error('No leaderboard rows found. Make sure you\'re on the leaderboard page.');
  }
  
  console.log('');
  console.log(`📊 Processing ${rows.length} rows...`);
  console.log('');
  
  let processedCount = 0;
  let skippedCount = 0;
  
  rows.forEach((row, index) => {
    try {
      // Get all text content from the row
      const text = row.innerText || row.textContent;
      if (!text || text.trim().length === 0) {
        skippedCount++;
        return;
      }
      
      // Log first few rows for debugging
      if (index < 3) {
        console.log(`📝 Row ${index + 1} text:`, text.substring(0, 200));
      }
      
      // Try to parse structured data from cells
      const cells = row.querySelectorAll('td, div[class*="cell"], span[class*="cell"], div[class*="col"]');
      let name = null;
      let times = []; // Collect all time-like values
      
      // Debug: log cells for first few rows
      if (index < 5) {
        const cellTexts = Array.from(cells).map(c => (c.innerText || c.textContent || '').trim());
        console.log(`📊 Row ${index + 1} cells:`, cellTexts);
      }
      
      cells.forEach((cell, cellIndex) => {
        const cellText = (cell.innerText || cell.textContent || '').trim();
        if (!cellText) return;
        
        // Time - look for time pattern even if there's extra text
        // Match HH:MM:SS or MM:SS or H:MM:SS anywhere in the cell
        const timeMatch = cellText.match(/(\d{1,2}:\d{2}:\d{2})/);
        if (timeMatch) {
          times.push({value: normalizeTime(timeMatch[1]), cellIndex, original: cellText});
        } else {
          // Also check for MM:SS format
          const shortTimeMatch = cellText.match(/^(\d{1,2}:\d{2})$/);
          if (shortTimeMatch) {
            times.push({value: normalizeTime(shortTimeMatch[1]), cellIndex, original: cellText});
          }
        }
        
        // Name (longer text, not time, not country code, not just a number)
        if (cellText.length > 5 && 
            !/^\d+$/.test(cellText) &&                    // Not just a number
            !/^[A-Z]{3}$/.test(cellText) &&               // Not a country code
            !/^\d{1,2}:\d{2}/.test(cellText) &&           // Not a time
            !/^[\d\s\-:]+$/.test(cellText) &&             // Not pace/diff numbers
            !name) {
          // Clean up name - remove bib numbers and sponsors
          // Names often come as "First Last\n123\nSponsor"
          let cleanName = cellText;
          
          // Split by newlines and take first part (actual name)
          if (cleanName.includes('\n')) {
            cleanName = cleanName.split('\n')[0].trim();
          }
          
          // Only accept if it's still substantial after cleaning
          if (cleanName.length > 5) {
            name = cleanName;
          }
        }
      });
      
      // Pick the right time:
      // Usually structure is: Place | Name | Time | Pace
      // We want Time (first time value), not Pace (second time value)
      // BUT if there's only one time, use it
      let time = null;
      if (times.length > 0) {
        // Debug logging for first few rows
        if (index < 5) {
          console.log(`⏱️  Row ${index + 1} found ${times.length} times:`, times);
        }
        time = times[0].value;
      }
      
      // Only add if we found both name and time
      if (name && time) {
        // Additional validation: skip header/junk rows
        const lowerName = name.toLowerCase();
        const isJunk = 
          lowerName.includes('start time') ||
          lowerName.includes('pro women') ||
          lowerName.includes('pro men') ||
          lowerName.includes('marathon') ||
          lowerName.length < 5;
        
        if (!isJunk) {
          const athlete = {
            name,
            time
          };
          
          athletes.push(athlete);
          processedCount++;
          
          // Log first 5 athletes for verification
          if (processedCount <= 5) {
            console.log(`✅ Athlete ${processedCount}:`, athlete);
          }
        } else {
          skippedCount++;
        }
      } else {
        skippedCount++;
        if (index < 5) {
          console.log(`⚠️  Row ${index + 1} skipped (missing data): name=${!!name}, time=${!!time}`);
        }
      }
    } catch (err) {
      console.warn(`⚠️  Error processing row ${index + 1}:`, err.message);
      skippedCount++;
    }
  });
  
  console.log('');
  console.log('═══════════════════════════════════════');
  console.log('📊 SCRAPING RESULTS:');
  console.log('═══════════════════════════════════════');
  console.log(`✅ Successfully scraped: ${processedCount} athletes`);
  console.log(`⚠️  Skipped rows: ${skippedCount}`);
  console.log(`📋 Total rows processed: ${rows.length}`);
  console.log('');
  console.log('📦 Sample of scraped data (first 10):');
  console.table(athletes.slice(0, 10));
  console.log('');
  console.log('📦 Full scraped data:');
  console.log(JSON.stringify(athletes, null, 2));
  console.log('═══════════════════════════════════════');
  
  if (athletes.length === 0) {
    throw new Error('No athletes found. Data extraction may need adjustment for this page format.');
  }
  
  return athletes;
}
