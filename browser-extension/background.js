// Background service worker for the extension
console.log('🏃 Fantasy Marathon extension background script loaded');

// Handle installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('✅ Fantasy Marathon extension installed successfully!');
  console.log('📖 Usage: Navigate to NYRR leaderboard and click the extension icon');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log('🖱️  Extension icon clicked on tab:', tab.url);
});
