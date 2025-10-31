/**
 * Fantasy Marathon - NYRR Leaderboard Bookmarklet
 * 
 * This bookmarklet scrapes live race results from the NYRR leaderboard page
 * and sends them to the Fantasy Marathon API.
 * 
 * Usage:
 * 1. Navigate to NYRR leaderboard page (e.g., https://liveresults.nyrr.org/e/NY2025#/leaderboard/...)
 * 2. Click the bookmarklet
 * 3. Select the split type and confirm
 * 4. Data is automatically sent to your game
 */

(function() {
  'use strict';

  // Configuration - UPDATE THESE VALUES
  const CONFIG = {
    apiEndpoint: 'https://marathon-majors-league.vercel.app/api/import-live-results',
    gameId: 'default', // Will prompt user to enter
    sessionToken: null // Will prompt user to enter if needed
  };

  // Constants for data extraction
  const EXTRACTION_CONSTANTS = {
    MIN_NAME_LENGTH: 5,
    COUNTRY_CODE_LENGTH: 3,
    COUNTRY_CODE_PATTERN: /^[A-Z]{3}$/,
    TIME_PATTERN: /^\d{1,2}:\d{2}(:\d{2})?$/
  };

  // Detect gender from URL or page content
  function detectGender() {
    const url = window.location.href.toLowerCase();
    const pageText = document.body.innerText.toLowerCase();
    
    if (url.includes('women') || url.includes('female') || pageText.includes('top women')) {
      return 'women';
    } else if (url.includes('men') || url.includes('male') || pageText.includes('top men')) {
      return 'men';
    }
    
    // Default to prompting user
    return null;
  }

  // Parse time string to consistent format (HH:MM:SS or MM:SS)
  function normalizeTime(timeStr) {
    if (!timeStr) return null;
    
    // Remove any non-time characters
    timeStr = timeStr.trim().replace(/[^0-9:]/g, '');
    
    // Handle different formats
    const parts = timeStr.split(':');
    
    if (parts.length === 2) {
      // MM:SS format
      return `0:${timeStr}`;
    } else if (parts.length === 3) {
      // HH:MM:SS format
      return timeStr;
    }
    
    return timeStr;
  }

  // Extract athlete data from the leaderboard table
  function scrapeLeaderboard() {
    const athletes = [];
    
    // Try multiple selectors for different table structures
    const selectors = [
      '.leaderboard-row',
      'tr.result-row',
      'table tbody tr',
      '[class*="result"]',
      '[class*="athlete"]'
    ];
    
    let rows = [];
    for (const selector of selectors) {
      rows = document.querySelectorAll(selector);
      if (rows.length > 0) break;
    }
    
    if (rows.length === 0) {
      throw new Error('Could not find leaderboard rows. Make sure you\'re on the leaderboard page.');
    }
    
    rows.forEach((row, index) => {
      try {
        const cells = row.querySelectorAll('td, [class*="cell"]');
        if (cells.length === 0) return;
        
        // Extract data - adjust these selectors based on actual NYRR structure
        let rank = null, name = null, country = null, time = null;
        
        // Try to extract from cells
        cells.forEach((cell, i) => {
          const text = cell.innerText.trim();
          
          // Rank is usually first column (number)
          if (i === 0 && /^\d+$/.test(text)) {
            rank = parseInt(text);
          }
          
          // Name is usually a longer text field
          if (text.length > EXTRACTION_CONSTANTS.MIN_NAME_LENGTH && !time && !EXTRACTION_CONSTANTS.TIME_PATTERN.test(text) && !EXTRACTION_CONSTANTS.COUNTRY_CODE_PATTERN.test(text)) {
            name = text;
          }
          
          // Country code (3 letters)
          if (EXTRACTION_CONSTANTS.COUNTRY_CODE_PATTERN.test(text)) {
            country = text;
          }
          
          // Time (HH:MM:SS or MM:SS format)
          if (EXTRACTION_CONSTANTS.TIME_PATTERN.test(text)) {
            time = normalizeTime(text);
          }
        });
        
        // Alternative: try specific selectors
        if (!name) {
          const nameEl = row.querySelector('[class*="name"], .athlete-name, .runner-name');
          if (nameEl) name = nameEl.innerText.trim();
        }
        
        if (!time) {
          const timeEl = row.querySelector('[class*="time"], .finish-time, .split-time');
          if (timeEl) time = normalizeTime(timeEl.innerText.trim());
        }
        
        if (!country) {
          const countryEl = row.querySelector('[class*="country"], .country-code');
          if (countryEl) country = countryEl.innerText.trim();
        }
        
        if (name && time) {
          athletes.push({
            rank: rank || (index + 1),
            name,
            country: country || 'UNK',
            time
          });
        }
      } catch (err) {
        console.warn('Error processing row:', err);
      }
    });
    
    return athletes;
  }

  // Create UI overlay for user input
  function showInputDialog(athletes, detectedGender) {
    return new Promise((resolve, reject) => {
      // Create overlay
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      `;
      
      // Create dialog
      const dialog = document.createElement('div');
      dialog.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      `;
      
      dialog.innerHTML = `
        <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 24px;">
          🏃 Fantasy Marathon - Import Results
        </h2>
        
        <div style="margin-bottom: 20px; padding: 15px; background: #f0f9ff; border-radius: 5px; border-left: 4px solid #3b82f6;">
          <p style="margin: 0; color: #1e40af; font-weight: bold;">
            Found ${athletes.length} athletes on this page
          </p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
            Game ID:
          </label>
          <input type="text" id="fm-game-id" value="${CONFIG.gameId}" 
            style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 5px; font-size: 14px;"
            placeholder="Enter your game ID (e.g., default)">
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
            Split Type:
          </label>
          <select id="fm-split-type" 
            style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 5px; font-size: 14px;">
            <option value="5k">5K Split</option>
            <option value="10k">10K Split</option>
            <option value="15k">15K Split</option>
            <option value="20k">20K Split</option>
            <option value="half">Half Marathon (21.1K)</option>
            <option value="25k">25K Split</option>
            <option value="30k">30K Split</option>
            <option value="35k">35K Split</option>
            <option value="40k">40K Split</option>
            <option value="finish" selected>Finish Time</option>
          </select>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
            Division:
          </label>
          <select id="fm-gender" 
            style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 5px; font-size: 14px;">
            <option value="men" ${detectedGender === 'men' ? 'selected' : ''}>Men</option>
            <option value="women" ${detectedGender === 'women' ? 'selected' : ''}>Women</option>
          </select>
        </div>
        
        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #374151;">
            Session Token (optional):
          </label>
          <input type="text" id="fm-session-token" 
            style="width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 5px; font-size: 14px;"
            placeholder="Only needed if commissioner access required">
          <small style="color: #6b7280; font-size: 12px;">Leave blank if you're the commissioner</small>
        </div>
        
        <div style="display: flex; gap: 10px; margin-top: 25px;">
          <button id="fm-cancel" 
            style="flex: 1; padding: 12px; background: #6b7280; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: 600;">
            Cancel
          </button>
          <button id="fm-submit" 
            style="flex: 1; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: 600;">
            Import Results
          </button>
        </div>
      `;
      
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
      
      // Handle submit
      document.getElementById('fm-submit').onclick = () => {
        const gameId = document.getElementById('fm-game-id').value.trim();
        const splitType = document.getElementById('fm-split-type').value;
        const gender = document.getElementById('fm-gender').value;
        const sessionToken = document.getElementById('fm-session-token').value.trim() || null;
        
        if (!gameId) {
          alert('Please enter a Game ID');
          return;
        }
        
        document.body.removeChild(overlay);
        resolve({ gameId, splitType, gender, sessionToken });
      };
      
      // Handle cancel
      document.getElementById('fm-cancel').onclick = () => {
        document.body.removeChild(overlay);
        reject(new Error('User cancelled'));
      };
    });
  }

  // Send data to API
  async function sendToAPI(gameId, splitType, gender, athletes, sessionToken) {
    const payload = {
      gameId,
      splitType,
      gender,
      athletes,
      sessionToken
    };
    
    const response = await fetch(CONFIG.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to import results');
    }
    
    return await response.json();
  }

  // Show result message
  function showResult(success, message, details = null) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: white;
      padding: 30px;
      border-radius: 10px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;
    
    let detailsHtml = '';
    if (details) {
      detailsHtml = `
        <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 5px; font-size: 14px;">
          <p style="margin: 0 0 10px 0; font-weight: 600;">Summary:</p>
          <ul style="margin: 0; padding-left: 20px;">
            <li>Total athletes: ${details.summary?.total || 0}</li>
            <li>Successfully imported: ${details.summary?.successful || 0}</li>
            <li>Failed: ${details.summary?.failed || 0}</li>
          </ul>
          
          ${details.failedAthletes?.length > 0 ? `
            <p style="margin: 15px 0 5px 0; font-weight: 600; color: #dc2626;">Failed Athletes:</p>
            <ul style="margin: 0; padding-left: 20px; color: #991b1b;">
              ${details.failedAthletes.map(a => `<li>${a.name}: ${a.reason}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      `;
    }
    
    dialog.innerHTML = `
      <h2 style="margin: 0 0 20px 0; color: ${success ? '#059669' : '#dc2626'}; font-size: 24px;">
        ${success ? '✅ Success!' : '❌ Error'}
      </h2>
      
      <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
        ${message}
      </p>
      
      ${detailsHtml}
      
      <button id="fm-close" 
        style="margin-top: 25px; width: 100%; padding: 12px; background: #3b82f6; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; font-weight: 600;">
        Close
      </button>
    `;
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    document.getElementById('fm-close').onclick = () => {
      document.body.removeChild(overlay);
    };
  }

  // Main execution
  async function main() {
    try {
      // Scrape athletes from page
      const athletes = scrapeLeaderboard();
      
      if (athletes.length === 0) {
        throw new Error('No athletes found on this page. Make sure you\'re viewing the leaderboard.');
      }
      
      // Detect gender
      const detectedGender = detectGender();
      
      // Show input dialog
      const { gameId, splitType, gender, sessionToken } = await showInputDialog(athletes, detectedGender);
      
      // Send to API
      const result = await sendToAPI(gameId, splitType, gender, athletes, sessionToken);
      
      // Show success message
      showResult(true, `Successfully imported ${result.summary.successful} of ${result.summary.total} athletes!`, result);
      
    } catch (error) {
      console.error('Bookmarklet error:', error);
      showResult(false, error.message);
    }
  }

  // Run
  main();
})();
