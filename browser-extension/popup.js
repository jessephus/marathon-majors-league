// Popup script - DEBUG MODE (outputs to console only)
console.log('🎯 Fantasy Marathon Extension Popup loaded');

document.getElementById('scrapeBtn').addEventListener('click', async () => {
  const btn = document.getElementById('scrapeBtn');
  const status = document.getElementById('status');
  
  btn.disabled = true;
  btn.textContent = '🔍 Scraping...';
  status.style.display = 'none';
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('🚀 STARTING SCRAPE PROCESS');
    console.log('═══════════════════════════════════════');
    console.log('📍 Current tab URL:', tab.url);
    console.log('📄 Tab title:', tab.title);
    
    // Check if we're on NYRR/RTRT site
    if (!tab.url.includes('nyrr.org') && !tab.url.includes('rtrt.me')) {
      console.error('❌ Not on NYRR/RTRT site!');
      showStatus('error', '❌ Please navigate to the NYRR leaderboard page first');
      return;
    }
    
    console.log('✅ On NYRR/RTRT site');
    console.log('');
    
    // Auto-detect gender from page
    console.log('🔍 Auto-detecting gender...');
    const genderResponse = await chrome.tabs.sendMessage(tab.id, { action: 'detectGender' });
    if (genderResponse.gender) {
      console.log(`✅ Auto-detected gender: ${genderResponse.gender.toUpperCase()}`);
      document.getElementById('gender').value = genderResponse.gender;
    } else {
      console.log('⚠️  Could not auto-detect gender, using manual selection');
    }
    console.log('');
    
    // Scrape leaderboard from content script
    console.log('📥 Sending scrape request to content script...');
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'scrapeLeaderboard' });
    
    if (!response.success) {
      console.error('❌ Scraping failed:', response.error);
      throw new Error(response.error);
    }
    
    const athletes = response.athletes;
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('✅ SCRAPING SUCCESSFUL!');
    console.log('═══════════════════════════════════════');
    
    if (athletes.length === 0) {
      throw new Error('No athletes found on this page');
    }
    
    // Get form values
    const gameId = document.getElementById('gameId').value.trim();
    const splitType = document.getElementById('splitType').value;
    const gender = document.getElementById('gender').value;
    
    console.log('');
    console.log('📋 PAYLOAD THAT WOULD BE SENT TO API:');
    console.log('═══════════════════════════════════════');
    
    const payload = {
      gameId,
      splitType,
      gender,
      athletes,
      timestamp: new Date().toISOString()
    };
    
    console.log(JSON.stringify(payload, null, 2));
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('📊 SUMMARY:');
    console.log('═══════════════════════════════════════');
    console.log(`Game ID: ${gameId}`);
    console.log(`Split Type: ${splitType}`);
    console.log(`Gender: ${gender}`);
    console.log(`Athletes Found: ${athletes.length}`);
    console.log('');
    console.log('💾 This data is ready to be sent to:');
    console.log('   POST /api/import-live-results');
    console.log('');
    console.log('🔧 Next steps:');
    console.log('   1. Create the /api/import-live-results endpoint');
    console.log('   2. Test the endpoint with this data');
    console.log('   3. Remove DEBUG MODE from popup.js');
    console.log('═══════════════════════════════════════');
    
    showStatus('success', 
      `✅ Successfully scraped ${athletes.length} athletes!\n` +
      `Check console (F12) for detailed output.\n\n` +
      `Ready to send to API:\n` +
      `• Game: ${gameId}\n` +
      `• Split: ${splitType}\n` +
      `• Division: ${gender}\n` +
      `• Athletes: ${athletes.length}`
    );
    
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════');
    console.error('❌ ERROR:');
    console.error('═══════════════════════════════════════');
    console.error(error);
    console.error('═══════════════════════════════════════');
    showStatus('error', `❌ Error: ${error.message}`);
  } finally {
    btn.disabled = false;
    btn.textContent = '🔍 Scrape to Console (Debug)';
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
