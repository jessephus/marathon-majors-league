// Popup script - Production version with API integration
console.log('🎯 Fantasy Marathon Extension Popup loaded');

// Configuration - change this for your deployment
const API_BASE = 'http://localhost:3000'; // Change to 'https://your-app.vercel.app' for production

// Auto-detect split type and gender from URL when popup opens
async function autoDetectFromURL() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url.toLowerCase();
    
    // Detect gender from URL
    let gender = 'women'; // default
    // Check women first since 'men' is substring of 'women'
    if (url.includes('women') || url.includes('female') || url.includes('elite-w')) {
      gender = 'women';
    } else if (url.includes('/men') || url.includes('-men') || url.includes('male') || url.includes('elite-m')) {
      gender = 'men';
    }
    document.getElementById('gender').value = gender;
    console.log('Auto-detected gender from URL:', gender);
    
    // Detect split type from URL
    // Check from longest to shortest to avoid substring matches (e.g., 15k contains 5k)
    let splitType = 'finish'; // default
    if (url.includes('half') || url.includes('21k')) {
      splitType = 'half';
    } else if (url.includes('40k') || url.includes('40-k')) {
      splitType = '40k';
    } else if (url.includes('35k') || url.includes('35-k')) {
      splitType = '35k';
    } else if (url.includes('30k') || url.includes('30-k')) {
      splitType = '30k';
    } else if (url.includes('25k') || url.includes('25-k')) {
      splitType = '25k';
    } else if (url.includes('20k') || url.includes('20-k')) {
      splitType = '20k';
    } else if (url.includes('15k') || url.includes('15-k')) {
      splitType = '15k';
    } else if (url.includes('10k') || url.includes('10-k')) {
      splitType = '10k';
    } else if (url.includes('/5k') || url.includes('-5k')) {
      splitType = '5k';
    } else if (url.includes('finish') || url.includes('final') || url.includes('result')) {
      splitType = 'finish';
    }
    document.getElementById('splitType').value = splitType;
    console.log('Auto-detected split type from URL:', splitType);
    
  } catch (error) {
    console.log('Could not auto-detect from URL:', error);
  }
}

// Run auto-detection when popup opens
autoDetectFromURL();

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
    console.log('Payload:', JSON.stringify(payload, null, 2));
    showStatus('info', `📤 Sending ${athletes.length} athletes to API...`);
    
    // Send to API
    const apiResponse = await fetch(`${API_BASE}/api/import-live-results`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('API Response Status:', apiResponse.status, apiResponse.statusText);
    
    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API error: ${apiResponse.status} ${apiResponse.statusText}`);
    }
    
    const result = await apiResponse.json();
    console.log('API Result:', result);
    
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
        console.log('');
        console.log('═══════════════════════════════════════');
        console.log('⚠️  ATHLETES NOT FOUND IN DATABASE');
        console.log('═══════════════════════════════════════');
        console.log('');
        console.log('These athletes need to be added or mapped:');
        console.log('');
        result.errors.forEach((error, index) => {
          console.log(`${index + 1}. "${error.name}" - ${error.error}`);
        });
        console.log('');
        console.log('Copy these names to create athlete mappings');
        console.log('═══════════════════════════════════════');
        console.log('');
      }
      
      if (result.summary.successful > 0) {
        console.log('');
        console.log('✅ Successfully matched athletes:');
        result.matches.forEach((match, index) => {
          console.log(`${index + 1}. "${match.name}" → ${match.time}`);
        });
        console.log('');
      }
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
