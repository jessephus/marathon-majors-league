/**
 * Session restoration cache optimization
 * This script adds caching to prevent redundant session checks
 */

// Session restoration cache
let sessionRestorationCache = {
  lastCheck: null,
  result: null,
  cacheValidFor: 60000, // 1 minute
};

/**
 * Cached version of restoreSession
 * Only performs full restoration if cache is stale
 * 
 * Note: This assumes restoreSession is defined in the global scope (app.js)
 * Include this script AFTER app.js in your HTML
 */
async function restoreSessionCached() {
  // Check if restoreSession is available
  if (typeof restoreSession !== 'function') {
    console.warn('[Session Cache] restoreSession not found, skipping cache');
    return false;
  }
  
  const now = Date.now();
  
  // Return cached result if still valid
  if (
    sessionRestorationCache.lastCheck &&
    sessionRestorationCache.result !== null &&
    now - sessionRestorationCache.lastCheck < sessionRestorationCache.cacheValidFor
  ) {
    console.log('[Session Cache] Using cached session restoration result');
    return sessionRestorationCache.result;
  }
  
  console.log('[Session Cache] Cache miss or stale, performing full restoration');
  const result = await restoreSession();
  
  // Cache the result
  sessionRestorationCache.lastCheck = now;
  sessionRestorationCache.result = result;
  
  return result;
}

/**
 * Invalidate session cache when session changes
 */
function invalidateSessionCache() {
  console.log('[Session Cache] Invalidating session cache');
  sessionRestorationCache.lastCheck = null;
  sessionRestorationCache.result = null;
}

/**
 * Optimized showPage that doesn't re-run session restoration
 * Instead of calling restoreSession on every navigation, use cached result
 */
function showPageOptimized(pageId) {
  console.log(`[Navigation] Navigating to ${pageId}`);
  
  // Hide all pages
  document.querySelectorAll('.page').forEach(page => 
    page.classList.remove('active')
  );
  
  // Show requested page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  } else {
    console.error(`[Navigation] Page not found: ${pageId}`);
  }
  
  // Update URL without triggering full reload
  if (window.history && window.history.pushState) {
    const pageRoutes = {
      'landing-page': '/',
      'salary-cap-draft-page': '/draft',
      'leaderboard-page': '/leaderboard',
      'commissioner-page': '/commissioner',
      'teams-page': '/teams',
      'athlete-management-page': '/athletes',
    };
    
    const route = pageRoutes[pageId] || '/';
    window.history.pushState({ pageId }, '', route);
  }
}

/**
 * API call deduplication
 * Prevents multiple identical requests from being sent simultaneously
 */
const pendingRequests = new Map();

async function fetchWithDedup(url, options = {}) {
  const key = `${url}-${JSON.stringify(options)}`;
  
  // If request is already pending, return the existing promise
  if (pendingRequests.has(key)) {
    console.log('[Dedup] Reusing pending request for:', url);
    return pendingRequests.get(key);
  }
  
  // Create new request
  const promise = fetch(url, options)
    .then(r => r.json())
    .finally(() => {
      // Clean up after request completes
      pendingRequests.delete(key);
    });
  
  pendingRequests.set(key, promise);
  return promise;
}

/**
 * Throttle function for expensive operations
 * Ensures function is called at most once per delay period
 */
function throttle(func, delay) {
  let timeoutId = null;
  let lastRan = 0;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastRan >= delay) {
      func.apply(this, args);
      lastRan = now;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func.apply(this, args);
        lastRan = Date.now();
      }, delay - (now - lastRan));
    }
  };
}

/**
 * Debounce function for UI events
 * Only calls function after user has stopped triggering events
 */
function debounce(func, delay) {
  let timeoutId = null;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Example usage of optimizations
 */

// Replace restoreSession calls with cached version
// Instead of: await restoreSession()
// Use: await restoreSessionCached()

// Replace showPage calls with optimized version
// Instead of: showPage('leaderboard-page')
// Use: showPageOptimized('leaderboard-page')

// Throttle expensive operations like standings updates
const updateStandingsThrottled = throttle(async () => {
  // Original updateLiveStandings code
  await updateLiveStandings();
}, 10000); // Max once per 10 seconds

// Debounce search/filter operations
const searchAthletesDebounced = debounce((searchTerm) => {
  // Original search logic
  filterAthletes(searchTerm);
}, 300); // Wait 300ms after user stops typing

// Use deduped fetch for API calls
// Instead of: fetch(`${API_BASE}/api/standings?gameId=${GAME_ID}`)
// Use: fetchWithDedup(`${API_BASE}/api/standings?gameId=${GAME_ID}`)

/**
 * Event listener for handling session changes
 * Invalidate cache when user logs in/out
 */
window.addEventListener('storage', (e) => {
  if (e.key === TEAM_SESSION_KEY || e.key === COMMISSIONER_SESSION_KEY) {
    console.log('[Session Cache] Session changed in another tab, invalidating cache');
    invalidateSessionCache();
  }
});

// Export for use in other modules (if using modules)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    restoreSessionCached,
    invalidateSessionCache,
    showPageOptimized,
    fetchWithDedup,
    throttle,
    debounce,
  };
}
