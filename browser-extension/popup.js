// Popup script - Production version with API integration
console.log('🎯 Fantasy Marathon Extension Popup loaded');

// Configuration - change this for your deployment
const API_BASE = 'http://localhost:3000'; // Change to 'https://your-app.vercel.app' for production

document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const btn = document.getElementById('scrapeBtn');
  const status = document.getElementById('status');
  
  btn.disabled = true;
  btn.textContent = '🔍 Scraping...';
  status.style.display = 'none';
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    console.log('🚀 Starting scrape from:', tab.url);
    
    // Check if we're on NYRR/RTRT site
    if (!tab.url.includes('nyrr.org') && !tab.url.includes('rtrt.me')) {
      throw new Error('Please navigate to the NYRR leaderboard page first');
    }
    
    // Auto-detect gender from page
    try {
      const genderResponse = await chrome.tabs.sendMessage(tab.id, { action: 'detectGender' });
      if (genderResponse && genderResponse.gender) {
        console.log(`Auto-detected gender: ${genderResponse.gender}`);
        document.getElementById('gender').value = genderResponse.gender;
      }
    } catch (error) {
      console.log('Could not auto-detect gender, using manual selection');
    }
    
    // Scrape leaderboard from content script (tries all frames including iframe)
    console.log('Scraping leaderboard from all frames...');
    
    let athletes = [];
    
    try {
      // Get all frames in the tab
      const frames = await chrome.webNavigation.getAllFrames({ tabId: tab.id });
      console.log(`Found ${frames.length} frames to check`);
      
      for (const frame of frames) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, 
            { action: 'scrapeLeaderboard' },
            { frameId: frame.frameId }
          );
          
          if (response && response.success && response.athletes && response.athletes.length > 0) {
            console.log(`✅ Found ${response.athletes.length} athletes`);
            athletes = response.athletes;
            break; // Found data, stop looking
          }
        } catch (error) {
          // Frame not accessible, continue
        }
      }
    } catch (error) {
      // Fallback: try simple sendMessage (works if content script is in main frame)
      console.log('Trying fallback method...');
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeLeaderboard' });
        if (response && response.success && response.athletes && response.athletes.length > 0) {
          athletes = response.athletes;
          console.log(`✅ Found ${athletes.length} athletes via fallback`);
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
    }
    
    if (athletes.length === 0) {
      throw new Error('No athletes found. Try refreshing the NYRR page and try again.');
    }
    
    // Get form values
    const gameId = document.getElementById('gameId').value.trim();
    const splitType = document.getElementById('splitType').value;
    const gender = document.getElementById('gender').value;
    
    // Build API payload
    const payload = {
      gameId,
      splitType,
      gender,
      athletes
    };
    
    console.log(`📦 Sending ${athletes.length} athletes to API...`);
    showStatus('info', `📤 Sending ${athletes.length} athletes to API...`);
    
    // Send to API
    const apiResponse = await fetch(`${API_BASE}/api/import-live-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!apiResponse.ok) {
      throw new Error(`API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }
    
    const result = await apiResponse.json();
    
    if (result.success) {
      console.log(`✅ Success! Imported ${result.summary.successful} of ${result.summary.total}`);
      
      showStatus('success', 
        `✅ Successfully imported!\n\n` +
        `Total Athletes: ${result.summary.total}\n` +
        `Imported: ${result.summary.successful}\n` +
        `Failed: ${result.summary.failed}\n\n` +
        (result.summary.failed > 0 
          ? `Some athletes not in database.\nCheck console for details.` 
          : `All athletes matched!`)
      );
      
      if (result.summary.failed > 0) {
        console.log('⚠️  Failed athletes:', result.errors);
      }
      
      console.log('Matched athletes:', result.matches);
    } else {
      throw new Error('Import failed. Check console for details.');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    showStatus('error', `❌ Error: ${error.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '📥 Import Live Results';
  }
});

function showStatus(type, message) {
  const status = document.getElementById('status');
  status.className = `status ${type}`;
  status.textContent = message;
  status.style.display = 'block';
}

// Load saved settings
chrome.storage.sync.get(['gameId'], (data) => {
  if (data.gameId) {
    document.getElementById('gameId').value = data.gameId;
  }
});

// Save settings when changed
document.getElementById('gameId').addEventListener('change', (e) => {
  chrome.storage.sync.set({ gameId: e.target.value });
});
