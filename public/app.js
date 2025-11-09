// Guard: Only run this script if legacy HTML structure exists
// This prevents errors when the new WelcomeCard React component is active
if (typeof window !== 'undefined' && !document.getElementById('landing-page')) {
    console.log('[App.js] Legacy HTML structure not found, skipping initialization');
    // Exit immediately without setting up event listeners
} else {

// Game State
let gameState = {
    athletes: { men: [], women: [] },
    players: [],
    currentPlayer: null,
    rankings: {},
    teams: {},
    results: {},
    draftComplete: false,
    resultsFinalized: false,
    rosterLockTime: null,
    // Caching for API optimization
    resultsCache: null,
    gameStateCache: null
};

// Anonymous Session Management (for teams)
let anonymousSession = {
    token: null,
    teamName: null,
    playerCode: null,
    ownerName: null,
    expiresAt: null
};

// Commissioner Session (TOTP-based)
let commissionerSession = {
    isCommissioner: false,
    loginTime: null,
    expiresAt: null
};

// Session Storage Keys
const TEAM_SESSION_KEY = 'marathon_fantasy_team';
const COMMISSIONER_SESSION_KEY = 'marathon_fantasy_commissioner';

// Session Timeout (30 days in milliseconds)
const COMMISSIONER_SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days

// Cache TTL settings (in milliseconds)
const RESULTS_CACHE_TTL = 30000; // 30 seconds - short TTL for live results
const GAME_STATE_CACHE_TTL = 60000; // 60 seconds - moderate TTL for game state

// View state for ranking page
let rankingViewState = {
    currentGender: 'men'
};

// Leaderboard sticky behavior cleanup function
let leaderboardStickyCleanup = null;

// Keep track of escape key handler for game recap modal
let gameRecapEscapeHandler = null;

// API base URL - will be relative in production
const API_BASE = window.location.origin === 'null' ? '' : window.location.origin;

// Development mode (reduce console noise in production)
const IS_DEV = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Helper for dev-only logging
function devLog(...args) {
    if (IS_DEV) {
        console.log(...args);
    }
}

// Game ID - can be switched between default and demo
let GAME_ID = localStorage.getItem('current_game_id') || 'default';

// Function to get current game ID
function getCurrentGameId() {
    return GAME_ID;
}

// Function to switch games
function switchGame(gameId) {
    GAME_ID = gameId;
    localStorage.setItem('current_game_id', gameId);
    
    // Invalidate all caches when switching games
    invalidateResultsCache();
    gameState.gameStateCache = null;
    
    location.reload(); // Reload to fetch new game data
}

/**
 * Get gender-specific runner SVG fallback for athletes without headshots
 * @param {string} gender - 'men' or 'women'
 * @returns {string} Data URI of SVG image
 */
function getRunnerSvg(gender) {
    const isMale = gender === 'men';
    
    // Return image URLs for default runner avatars
    const maleRunnerImg = '/images/man-runner.png';
    const femaleRunnerImg = '/images/woman-runner.png';
    
    return isMale ? maleRunnerImg : femaleRunnerImg;
}

// Load game state from database
// ⚠️ LEGACY FUNCTION - gameState.players[] is DEPRECATED
// This function loads the games.players[] array which is no longer maintained
// for salary cap draft teams. It will show stale data for new teams.
// 
// Modern implementation:
//   - See TeamsOverviewPanel.tsx (queries anonymous_sessions table)
//   - Use /api/salary-cap-draft endpoint for team data
async function loadGameState() {
    try {
        const response = await fetch(`${API_BASE}/api/game-state?gameId=${GAME_ID}`);
        if (response.ok) {
            const data = await response.json();
            gameState.players = data.players || []; // ⚠️ DEPRECATED - Stale for salary cap draft
            gameState.draftComplete = data.draftComplete || false;
            gameState.resultsFinalized = data.resultsFinalized || false;
            gameState.rosterLockTime = data.rosterLockTime || null;
            gameState.rankings = data.rankings || {};
            gameState.teams = data.teams || {};
            gameState.results = data.results || {};
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

// Save game state to database
async function saveGameState() {
    try {
        await fetch(`${API_BASE}/api/game-state?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                players: gameState.players,
                draftComplete: gameState.draftComplete,
                resultsFinalized: gameState.resultsFinalized,
                rosterLockTime: gameState.rosterLockTime
            })
        });
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

// Cached fetch for race results
async function fetchResultsCached() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (gameState.resultsCache && 
        gameState.resultsCache.gameId === GAME_ID &&
        (now - gameState.resultsCache.timestamp) < RESULTS_CACHE_TTL) {
        devLog('📦 Using cached results data');
        return gameState.resultsCache.data;
    }
    
    // Fetch fresh data
    devLog('🌐 Fetching fresh results data');
    const response = await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`);
    if (!response.ok) {
        throw new Error('Failed to fetch results');
    }
    
    const data = await response.json();
    
    // Cache the results
    gameState.resultsCache = {
        data,
        timestamp: now,
        gameId: GAME_ID
    };
    
    return data;
}

// Invalidate results cache (call when commissioner updates results)
function invalidateResultsCache() {
    devLog('🗑️ Invalidating results cache');
    gameState.resultsCache = null;
}

// Cached fetch for game state with ETag-like optimization
async function loadGameStateCached(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached data if still valid and not forcing refresh
    if (!forceRefresh && 
        gameState.gameStateCache && 
        gameState.gameStateCache.gameId === GAME_ID &&
        (now - gameState.gameStateCache.timestamp) < GAME_STATE_CACHE_TTL) {
        devLog('📦 Using cached game state');
        return;
    }
    
    // Fetch fresh data
    devLog('🌐 Fetching fresh game state');
    try {
        const response = await fetch(`${API_BASE}/api/game-state?gameId=${GAME_ID}`);
        if (response.ok) {
            const data = await response.json();
            gameState.players = data.players || [];
            gameState.draftComplete = data.draftComplete || false;
            gameState.resultsFinalized = data.resultsFinalized || false;
            gameState.rosterLockTime = data.rosterLockTime || null;
            gameState.rankings = data.rankings || {};
            gameState.teams = data.teams || {};
            gameState.results = data.results || {};
            
            // Cache the game state
            gameState.gameStateCache = {
                timestamp: now,
                gameId: GAME_ID
            };
        }
    } catch (error) {
        console.error('Error loading game state:', error);
    }
}

// Promise cache for athletes loading to prevent concurrent duplicate loads
let athletesLoadPromise = null;

// Load athletes data with promise caching
async function loadAthletes() {
    // If already loaded, return immediately
    if (gameState.athletes?.men?.length > 0 && gameState.athletes?.women?.length > 0) {
        console.log('✅ Athletes already loaded in memory, skipping fetch');
        return gameState.athletes;
    }
    
    // If currently loading, wait for existing promise
    if (athletesLoadPromise) {
        console.log('⏳ Athletes load already in progress, waiting...');
        return athletesLoadPromise;
    }
    
    // Start new load
    console.log('🌐 Starting fresh athletes load');
    athletesLoadPromise = (async () => {
        try {
            // Load from database API (will auto-seed if empty)
            const response = await fetch(`${API_BASE}/api/athletes`);

            // If a preview is protected by Vercel SSO, the response will be an HTML page
            // with a 401/403 status. Detect that and show a clearer message.
            const contentType = response.headers.get('content-type') || '';
            if (response.status === 401 || response.status === 403 || contentType.includes('text/html')) {
                // Provide a useful message to the user about signing into Vercel or using the share token
                const message = 'This deployment is protected by Vercel Preview Authentication. Please sign in to Vercel or use a preview share link to access API endpoints.';
                console.error('Preview protected:', response.status, response.statusText);
                alert(message);
                throw new Error(message);
            }

            if (!response.ok) {
                throw new Error(`Failed to load athletes: ${response.status} ${response.statusText}`);
            }

            const athletes = await response.json();
            
            // Validate we got data
            if (!athletes || !athletes.men || !athletes.women) {
                throw new Error('Invalid athletes data structure received from API');
            }
            
            if (athletes.men.length === 0 && athletes.women.length === 0) {
                throw new Error('No athletes data available - database may not be initialized');
            }
            
            gameState.athletes = athletes;
            console.log(`✅ Loaded ${athletes.men.length} men and ${athletes.women.length} women athletes from database`);
            
            return athletes;
        } catch (error) {
            console.error('Error loading athletes:', error);
            throw error;
        } finally {
            // Clear the promise cache after completion (success or failure)
            athletesLoadPromise = null;
        }
    })();
    
    return athletesLoadPromise;
}

// Initialize the app
async function init() {
    const initStartTime = performance.now();
    console.log('⏱️ [PERF] App initialization started');
    
    console.log('[App Init] Starting application initialization...');
    console.log('[App Init] Current localStorage keys:', Object.keys(localStorage));
    console.log('[App Init] Team session key exists:', !!localStorage.getItem(TEAM_SESSION_KEY));
    console.log('[App Init] Commissioner session key exists:', !!localStorage.getItem(COMMISSIONER_SESSION_KEY));
    
    // Setup UI immediately for faster perceived load time
    const uiStartTime = performance.now();
    setupEventListeners();
    setupAthleteModal();
    console.log(`⏱️ [PERF] UI setup complete: ${(performance.now() - uiStartTime).toFixed(2)}ms`);
    
    // Show landing page immediately (will be hidden if session exists)
    showPage('landing-page');
    
    // Load critical data in parallel (with caching)
    const gameStateStartTime = performance.now();
    const gameStatePromise = loadGameStateCached();
    
    // Try to restore session immediately (only needs gameState, not athletes)
    await gameStatePromise;
    console.log(`⏱️ [PERF] Game state loaded: ${(performance.now() - gameStateStartTime).toFixed(2)}ms`);
    
    const sessionStartTime = performance.now();
    const hasSession = await restoreSession();
    console.log(`⏱️ [PERF] Session restoration: ${(performance.now() - sessionStartTime).toFixed(2)}ms`);
    
    console.log('[App Init] Session restoration complete. Has session:', hasSession);
    
    // Load athletes in background (only needed for ranking page)
    const athletesStartTime = performance.now();
    loadAthletes().then(() => {
        console.log(`⏱️ [PERF] Athletes loaded (background): ${(performance.now() - athletesStartTime).toFixed(2)}ms`);
    }).catch(error => {
        console.error('Failed to load athletes:', error);
    });
    
    // If no session restored, show welcome card
    if (!hasSession) {
        console.log('[App Init] No session found, showing welcome card');
        showWelcomeCard();
    } else {
        console.log('[App Init] Session restored, welcome card hidden');
    }
    
    console.log(`⏱️ [PERF] Total init time: ${(performance.now() - initStartTime).toFixed(2)}ms`);
    
    // Hide loading overlay after initialization
    const loadingOverlay = document.getElementById('app-loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.style.opacity = '0';
        loadingOverlay.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
            loadingOverlay.remove();
        }, 300);
    }
}

// Show/hide welcome card based on session state
function showWelcomeCard() {
    const welcomeCard = document.querySelector('.welcome-card');
    if (welcomeCard) {
        welcomeCard.style.display = 'block';
    }
}

function hideWelcomeCard() {
    const welcomeCard = document.querySelector('.welcome-card');
    if (welcomeCard) {
        welcomeCard.style.display = 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Landing page
    document.getElementById('create-team-btn').addEventListener('click', showTeamCreationModal);
    
    // Team Creation Modal
    document.getElementById('close-team-modal').addEventListener('click', hideTeamCreationModal);
    document.getElementById('cancel-team-creation').addEventListener('click', hideTeamCreationModal);
    document.getElementById('team-creation-form').addEventListener('submit', handleTeamCreation);
    document.querySelector('#team-creation-modal .modal-overlay').addEventListener('click', hideTeamCreationModal);
    
    // Commissioner TOTP Modal
    document.getElementById('close-totp-modal').addEventListener('click', hideCommissionerTOTPModal);
    document.getElementById('cancel-totp-login').addEventListener('click', hideCommissionerTOTPModal);
    document.getElementById('commissioner-totp-form').addEventListener('submit', handleCommissionerTOTPLogin);
    document.querySelector('#commissioner-totp-modal .modal-overlay').addEventListener('click', hideCommissionerTOTPModal);
    
    // Footer buttons
    document.getElementById('home-button').addEventListener('click', async () => {
        // Navigate based on session state
        if (anonymousSession.token) {
            // Team session - always go to salary cap draft page (shows roster when locked)
            await setupSalaryCapDraft();
            showPage('salary-cap-draft-page');
        } else if (commissionerSession.isCommissioner) {
            // Commissioner session - go to commissioner page
            handleCommissionerMode();
        } else {
            // No session - show landing page with welcome card
            showWelcomeCard();
            showPage('landing-page');
        }
    });
    document.getElementById('commissioner-mode').addEventListener('click', showCommissionerTOTPModal);
    
    // Game switcher
    const gameSelect = document.getElementById('game-select');
    if (gameSelect) {
        // Set current game in dropdown
        gameSelect.value = GAME_ID;
        
        // Handle game switch
        gameSelect.addEventListener('change', (e) => {
            const newGameId = e.target.value;
            if (newGameId !== GAME_ID) {
                if (confirm(`Switch to ${newGameId === 'NY2025' ? 'NY 2025' : 'Default Game'}? This will reload the page.`)) {
                    switchGame(newGameId);
                } else {
                    // Reset to current game if cancelled
                    e.target.value = GAME_ID;
                }
            }
        });
    }

    // Ranking page
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', (e) => switchTab(e.target.dataset.gender));
    });
    document.getElementById('submit-rankings').addEventListener('click', handleSubmitRankings);

    // Draft page
    document.getElementById('view-teams').addEventListener('click', async () => {
        // Reload game state to get latest results (use cache)
        await loadGameStateCached();
        displayTeams();
        showPage('teams-page');
    });

    // Teams page
    document.getElementById('back-to-landing').addEventListener('click', () => showPage('landing-page'));
    
    // Leaderboard page
    document.getElementById('view-leaderboard-btn')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const originalText = btn.textContent;
        
        // Disable button and show loading state
        btn.disabled = true;
        btn.textContent = 'Loading...';
        
        try {
            // Show page immediately with loading state
            showPage('leaderboard-page');
            // Then load the data
            await displayLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            // Error is already handled in displayLeaderboard()
        } finally {
            // Re-enable button
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
    document.getElementById('view-leaderboard-from-roster')?.addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const originalText = btn.textContent;
        
        // Disable button and show loading state
        btn.disabled = true;
        btn.textContent = 'Loading...';
        
        try {
            // Show page immediately with loading state
            showPage('leaderboard-page');
            // Then load the data
            await displayLeaderboard();
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            // Error is already handled in displayLeaderboard()
        } finally {
            // Re-enable button
            btn.disabled = false;
            btn.textContent = originalText;
        }
    });
    document.getElementById('back-to-roster')?.addEventListener('click', () => showPage('salary-cap-draft-page'));
    
    // Leaderboard tab switching
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.addEventListener('click', async (e) => {
            const clickedTab = e.target;
            const tabType = clickedTab.dataset.tab;
            
            // Prevent switching if already active or loading
            if (clickedTab.classList.contains('active') || clickedTab.disabled) {
                return;
            }
            
            // Disable all tabs during loading
            const allTabs = document.querySelectorAll('.leaderboard-tab');
            allTabs.forEach(t => t.disabled = true);
            
            // Update active tab
            allTabs.forEach(t => t.classList.remove('active'));
            clickedTab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.leaderboard-tab-content').forEach(c => c.classList.remove('active'));
            
            try {
                if (tabType === 'fantasy') {
                    document.getElementById('fantasy-results-tab').classList.add('active');
                    await displayLeaderboard();
                } else if (tabType === 'race') {
                    document.getElementById('race-results-tab').classList.add('active');
                    await displayRaceResultsLeaderboard();
                }
            } catch (error) {
                console.error('Error switching leaderboard tabs:', error);
            } finally {
                // Re-enable all tabs
                allTabs.forEach(t => t.disabled = false);
            }
        });
    });

    // Commissioner page
    document.getElementById('run-draft').addEventListener('click', handleRunDraft);
    document.getElementById('manage-results-btn').addEventListener('click', () => {
        showPage('results-management-page');
        displayResultsManagement();
    });
    document.getElementById('finalize-results').addEventListener('click', handleFinalizeResults);
    document.getElementById('reset-results').addEventListener('click', handleResetResults);
    document.getElementById('reset-game').addEventListener('click', handleResetGame);
    document.getElementById('view-athletes').addEventListener('click', () => {
        showPage('athlete-management-page');
        handleViewAthletes();
    });
    document.getElementById('filter-confirmed').addEventListener('change', handleViewAthletes);
    document.getElementById('filter-missing-wa-id').addEventListener('change', handleViewAthletes);
    document.getElementById('filter-gender').addEventListener('change', handleViewAthletes);
    document.getElementById('sort-athletes').addEventListener('change', handleViewAthletes);
    document.getElementById('back-from-commissioner').addEventListener('click', () => showPage('landing-page'));
    document.getElementById('back-to-commissioner').addEventListener('click', () => showPage('commissioner-page'));
    
    // Demo Data button
    document.getElementById('load-demo-data').addEventListener('click', handleLoadDemoData);
    
    // Manage Teams page
    document.getElementById('manage-teams-btn').addEventListener('click', () => {
        showPage('manage-teams-page');
        displayTeamsTable();
    });
    document.getElementById('back-to-commissioner-from-teams').addEventListener('click', () => showPage('commissioner-page'));
    
    // Results Management page
    document.getElementById('back-to-commissioner-from-results').addEventListener('click', () => showPage('commissioner-page'));
    document.getElementById('results-view-select').addEventListener('change', () => displayResultsManagement());
    
    // Add Result modal
    const addResultModal = document.getElementById('add-result-modal');
    document.getElementById('add-result-btn').addEventListener('click', async () => {
        await populateAthleteSelect();
        addResultModal.style.display = 'flex';
    });
    document.getElementById('add-result-modal-close').addEventListener('click', () => {
        addResultModal.style.display = 'none';
    });
    document.getElementById('cancel-add-result').addEventListener('click', () => {
        addResultModal.style.display = 'none';
    });
    // Close modal when clicking the overlay
    addResultModal.addEventListener('click', (e) => {
        if (e.target === addResultModal) {
            addResultModal.style.display = 'none';
        }
    });
    document.getElementById('add-result-form').addEventListener('submit', handleAddResult);
    
    // Athlete Management modal
    const addAthleteModal = document.getElementById('add-athlete-modal');
    document.getElementById('add-athlete-btn').addEventListener('click', () => {
        addAthleteModal.style.display = 'flex';
    });
    document.getElementById('add-athlete-modal-close').addEventListener('click', () => {
        addAthleteModal.style.display = 'none';
    });
    document.getElementById('cancel-add-athlete').addEventListener('click', () => {
        addAthleteModal.style.display = 'none';
    });
    // Close modal when clicking the overlay
    addAthleteModal.addEventListener('click', (e) => {
        if (e.target === addAthleteModal) {
            addAthleteModal.style.display = 'none';
        }
    });
    document.getElementById('add-athlete-form').addEventListener('submit', handleAddAthlete);
    
    // Game Recap modal
    const closeRecapButton = document.getElementById('close-recap');
    if (closeRecapButton) {
        closeRecapButton.addEventListener('click', () => closeGameRecap(true));
    }

    const gameRecapModal = document.getElementById('game-recap-modal');
    if (gameRecapModal) {
        gameRecapModal.addEventListener('click', (e) => {
            if (e.target === gameRecapModal || e.target.classList.contains('modal-overlay')) {
                closeGameRecap(false);
            }
        });
    }
}

// Show page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// ========== TEAM CREATION MODAL FUNCTIONS ==========

function showTeamCreationModal() {
    document.getElementById('team-creation-modal').style.display = 'flex';
    document.getElementById('team-name').focus();
}

function hideTeamCreationModal() {
    document.getElementById('team-creation-modal').style.display = 'none';
    document.getElementById('team-creation-form').reset();
}

async function handleTeamCreation(e) {
    e.preventDefault();
    
    const teamName = document.getElementById('team-name').value.trim();
    const ownerName = document.getElementById('team-owner').value.trim();
    
    if (!teamName) {
        alert('Please enter a team name');
        return;
    }
    
    try {
        // Create anonymous session via API
        const response = await fetch(`${API_BASE}/api/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionType: 'player',
                displayName: teamName,
                gameId: GAME_ID,
                playerCode: teamName,  // Use team name as player code
                expiryDays: 90
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create session');
        }
        
        const data = await response.json();
        const playerCode = data.session?.playerCode || teamName;

        // Persist both the display name and the canonical player code
        anonymousSession = {
            token: data.session.token,
            teamName: teamName,
            playerCode,
            ownerName: ownerName || null,
            expiresAt: data.session.expiresAt
        };
        
        localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(anonymousSession));
        
        // Set as current player
        gameState.currentPlayer = playerCode;
        document.getElementById('player-name').textContent = teamName;
        
        // ⚠️ DEPRECATED: Add to players list
        // This updates games.players[] array which is no longer the source of truth
        // for salary cap draft teams. Teams are tracked in anonymous_sessions table.
        // This is only maintained for legacy compatibility - the commissioner view
        // in this legacy site will show stale data and should be replaced with
        // TeamsOverviewPanel.tsx which queries the correct tables.
        if (!gameState.players.includes(playerCode)) {
            gameState.players.push(playerCode);
            await saveGameState();
        }
        
        // Show success message with unique URL
        const uniqueURL = `${window.location.origin}/?session=${data.session.token}`;
        alert(`✅ Team created!\n\n📋 Team: ${teamName}\n\n🔗 Your unique URL (save this to access your team from other devices):\n${uniqueURL}\n\nThis URL will be saved in your browser.`);
        
        hideWelcomeCard();  // Hide welcome card after team creation
        
        // Update footer buttons
        updateFooterButtons();
        
        // Hide modal and go to salary cap draft page
        hideTeamCreationModal();
        
        // Always go to salary cap draft page (it shows roster when locked)
        await setupSalaryCapDraft();
        showPage('salary-cap-draft-page');
        
    } catch (error) {
        console.error('Error creating team:', error);
        alert('Error creating team. Please try again.');
    }
}

// ========== COMMISSIONER TOTP MODAL FUNCTIONS ==========

function showCommissionerTOTPModal() {
    // Check if already authenticated
    if (commissionerSession.isCommissioner) {
        // Session exists, go directly to commissioner page
        handleCommissionerMode();
        return;
    }
    
    // No session, show TOTP login modal
    document.getElementById('commissioner-totp-modal').style.display = 'flex';
    document.getElementById('totp-code').focus();
}

function hideCommissionerTOTPModal() {
    document.getElementById('commissioner-totp-modal').style.display = 'none';
    document.getElementById('commissioner-totp-form').reset();
}

async function handleCommissionerTOTPLogin(e) {
    e.preventDefault();
    
    const totpCode = document.getElementById('totp-code').value.trim();
    
    if (!totpCode || !/^\d{6}$/.test(totpCode)) {
        alert('Please enter a valid 6-digit code');
        return;
    }
    
    try {
        // Verify TOTP with backend
        const response = await fetch(`${API_BASE}/api/auth/totp/verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'commissioner@marathonmajorsfantasy.com',
                totpCode: totpCode
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            
            // Save commissioner session with 30-day expiration
            const now = new Date();
            const expiresAt = new Date(now.getTime() + COMMISSIONER_SESSION_TIMEOUT);
            
            commissionerSession = {
                isCommissioner: true,
                loginTime: now.toISOString(),
                expiresAt: expiresAt.toISOString()
            };
            
            console.log('[Commissioner Login] Saving new commissioner session:', {
                loginTime: commissionerSession.loginTime,
                expiresAt: commissionerSession.expiresAt,
                timeoutDays: COMMISSIONER_SESSION_TIMEOUT / (24 * 60 * 60 * 1000)
            });
            
            localStorage.setItem(COMMISSIONER_SESSION_KEY, JSON.stringify(commissionerSession));
            
            console.log('[Commissioner Login] Commissioner session saved to localStorage');
            
            hideWelcomeCard();  // Hide welcome card after commissioner login
            
            // Update footer buttons
            updateFooterButtons();
            
            // Hide modal and go to commissioner page
            hideCommissionerTOTPModal();
            showPage('commissioner-page');
            
            // Refresh display if needed
            if (gameState.players.length > 0) {
                displayPlayerCodes();
            }
            if (gameState.draftComplete) {
                updateLiveStandings();
                
                // Update finalize button visibility
                if (gameState.resultsFinalized) {
                    document.getElementById('finalize-results').style.display = 'none';
                } else if (Object.keys(gameState.results).length > 0) {
                    document.getElementById('finalize-results').style.display = 'inline-block';
                } else {
                    document.getElementById('finalize-results').style.display = 'none';
                }
            }
        } else {
            const error = await response.json();
            alert(error.error || 'Invalid TOTP code. Please try again.');
            document.getElementById('totp-code').value = '';
            document.getElementById('totp-code').focus();
        }
    } catch (error) {
        console.error('Error verifying TOTP:', error);
        alert('Error logging in. Please try again.');
    }
}

// ========== SESSION RESTORATION ==========

// Check for session token in URL (for cross-device access)
async function checkURLForSession() {
    const params = new URLSearchParams(window.location.search);
    const sessionToken = params.get('session');
    
    if (sessionToken) {
        // Verify and load session from backend
        const success = await verifyAndLoadSession(sessionToken);
        
        // Clean URL (remove session parameter)
        const cleanURL = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanURL);
        return success;
    }
    
    return false;
}

// Verify session with backend and load it
async function verifyAndLoadSession(token) {
    console.log('Verifying session token:', token);
    
    try {
        const response = await fetch(`${API_BASE}/api/session/verify?token=${encodeURIComponent(token)}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log('Session verified:', data);

            const playerCode = data.session.playerCode || data.session.displayName;
            const displayName = data.session.displayName || playerCode;
            
            // Save session to state and localStorage
            anonymousSession = {
                token: token,
                teamName: displayName,
                playerCode,
                ownerName: null,
                expiresAt: data.session.expiresAt
            };
            
            localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(anonymousSession));
            
            // Set as current player
            gameState.currentPlayer = playerCode;
            document.getElementById('player-name').textContent = displayName;
            
            hideWelcomeCard();  // Hide welcome card after session verified
            
            console.log('Game state:', gameState);
            console.log('Draft complete?', gameState.draftComplete);
            console.log('Has rankings?', !!gameState.rankings[playerCode]);
            
            // Always navigate to salary cap draft page (shows roster when locked)
            console.log('Navigating to salary cap draft page');
            await setupSalaryCapDraft();
            showPage('salary-cap-draft-page');
            
            return true;
        } else {
            console.error('Session verification failed:', response.status);
            return false;
        }
    } catch (error) {
        console.error('Error verifying session:', error);
        return false;
    }
}

// Restore session from localStorage
async function restoreSession() {
    console.log('[Session Restore] Starting session restoration...');
    
    let hasTeamSession = false;
    let hasCommissionerSession = false;
    
    // Priority 1: Check URL for session token (cross-device sharing)
    const hasURLSession = await checkURLForSession();
    if (hasURLSession) {
        console.log('[Session Restore] URL session found and loaded');
        hideWelcomeCard();  // Hide welcome card for sessions from URL
        updateFooterButtons();  // Update UI after session restored
        return true;  // verifyAndLoadSession handles navigation
    }
    
    // Load both team and commissioner sessions (they can coexist!)
    try {
        // Check for team session in localStorage
        const teamSessionData = localStorage.getItem(TEAM_SESSION_KEY);
        if (teamSessionData) {
            console.log('[Session Restore] Found team session in localStorage:', teamSessionData);
            const session = JSON.parse(teamSessionData);
            
            // Check if expired
            if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
                console.warn('[Session Restore] Team session EXPIRED at:', session.expiresAt);
                localStorage.removeItem(TEAM_SESSION_KEY);
                anonymousSession = { token: null, teamName: null, playerCode: null, ownerName: null, expiresAt: null };
            } else {
                console.log('[Session Restore] Team session is valid, expires at:', session.expiresAt);

                const normalizedSession = {
                    token: session.token || null,
                    teamName: session.teamName || session.playerCode || null,
                    playerCode: session.playerCode || session.teamName || null,
                    ownerName: session.ownerName || null,
                    expiresAt: session.expiresAt || null
                };

                anonymousSession = normalizedSession;

                if (normalizedSession.playerCode) {
                    gameState.currentPlayer = normalizedSession.playerCode;
                }
                if (normalizedSession.teamName) {
                    document.getElementById('player-name').textContent = normalizedSession.teamName;
                }

                // Backfill playerCode for legacy sessions stored without it
                if (!session.playerCode && normalizedSession.playerCode) {
                    localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(normalizedSession));
                }
                hasTeamSession = true;
            }
        } else {
            console.log('[Session Restore] No team session found in localStorage');
        }
        
        // Check for commissioner session (independent of team session)
        const commissionerSessionData = localStorage.getItem(COMMISSIONER_SESSION_KEY);
        if (commissionerSessionData) {
            console.log('[Session Restore] Found commissioner session in localStorage:', commissionerSessionData);
            const session = JSON.parse(commissionerSessionData);
            
            // Check if session has expired
            if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
                console.warn('[Session Restore] Commissioner session EXPIRED at:', session.expiresAt);
                localStorage.removeItem(COMMISSIONER_SESSION_KEY);
                commissionerSession = { isCommissioner: false, loginTime: null, expiresAt: null };
            } else if (session.isCommissioner) {
                console.log('[Session Restore] Commissioner session is valid, expires at:', session.expiresAt);
                commissionerSession = session;
                hasCommissionerSession = true;
            }
        } else {
            console.log('[Session Restore] No commissioner session found in localStorage');
        }
        
        // Determine which view to show based on what sessions exist
        if (hasTeamSession || hasCommissionerSession) {
            hideWelcomeCard();
            
            // If user is both commissioner and has a team, prioritize team view
            // (they can switch to commissioner mode via the button)
            if (hasTeamSession) {
                console.log('[Session Restore] Navigating to salary cap draft page (team session)');
                await setupSalaryCapDraft();
                showPage('salary-cap-draft-page');
            } else if (hasCommissionerSession) {
                console.log('[Session Restore] Navigating to commissioner page (commissioner-only session)');
                handleCommissionerMode();
            }
            
            updateFooterButtons();
            return true;
        }
    } catch (error) {
        console.error('[Session Restore] Error restoring session:', error);
    }
    
    console.log('[Session Restore] No valid sessions found');
    return false;
}

// Update footer buttons based on session state
function updateFooterButtons() {
    const footer = document.querySelector('footer');
    const footerActions = footer ? footer.querySelector('.footer-actions') : null;
    const gameSwitcher = document.querySelector('.game-switcher');
    
    console.log('[Footer Buttons] updateFooterButtons called');
    console.log('[Footer Buttons] anonymousSession:', anonymousSession);
    console.log('[Footer Buttons] session token:', anonymousSession.token ? 'exists' : 'none');
    console.log('[Footer Buttons] Commissioner session:', commissionerSession.isCommissioner ? 'active' : 'none');
    console.log('[Footer Buttons] footer element:', footer ? 'found' : 'NOT FOUND');
    console.log('[Footer Buttons] footerActions element:', footerActions ? 'found' : 'NOT FOUND');
    
    // Update game-switcher visibility based on commissioner status
    if (gameSwitcher) {
        if (commissionerSession.isCommissioner) {
            gameSwitcher.classList.add('visible');
            console.log('Game switcher shown (commissioner logged in)');
        } else {
            gameSwitcher.classList.remove('visible');
            console.log('Game switcher hidden (not a commissioner)');
        }
    }
    
    // Remove existing session buttons if they exist
    const existingLogout = document.getElementById('logout-button');
    const existingCopyUrl = document.getElementById('copy-url-button');
    if (existingLogout) existingLogout.remove();
    if (existingCopyUrl) existingCopyUrl.remove();
    
    if (anonymousSession.token) {
        console.log('Adding logout and copy URL buttons for team session');
        // User has an active team session - show logout and copy URL buttons
    const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-button';
        logoutBtn.className = 'btn btn-secondary';
        logoutBtn.textContent = 'Logout';
        logoutBtn.addEventListener('click', handleLogout);
        
        const copyUrlBtn = document.createElement('button');
        copyUrlBtn.id = 'copy-url-button';
        copyUrlBtn.className = 'btn btn-secondary';
        copyUrlBtn.textContent = 'Copy My URL';
        copyUrlBtn.addEventListener('click', handleCopyUrl);
        
        // Find the commissioner mode button
        if (footerActions) {
            footerActions.appendChild(logoutBtn);
            footerActions.appendChild(copyUrlBtn);
        } else {
            footer.appendChild(logoutBtn);
            footer.appendChild(copyUrlBtn);
        }
        console.log('Session buttons appended to footer actions');
    } else if (commissionerSession.isCommissioner) {
        console.log('Adding logout button for commissioner session');
        // Commissioner is logged in - show logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-button';
        logoutBtn.className = 'btn btn-secondary';
        logoutBtn.textContent = 'Logout';
        logoutBtn.addEventListener('click', handleCommissionerLogout);
        
        if (footerActions) {
            footerActions.appendChild(logoutBtn);
        } else {
            footer.appendChild(logoutBtn);
        }
        console.log('Commissioner logout button appended to footer actions');
    }
}

// Handle team logout
function handleLogout() {
    if (confirm('Are you sure you want to logout? Make sure you have saved your team URL!')) {
        console.log('[Team Logout] User confirmed team logout');
        console.log('[Team Logout] Clearing team session, preserving commissioner session');
        
        // Clear team session ONLY (don't touch commissioner session)
        localStorage.removeItem(TEAM_SESSION_KEY);
    anonymousSession = { token: null, teamName: null, playerCode: null, ownerName: null, expiresAt: null };
        gameState.currentPlayer = null;
        
        console.log('[Team Logout] Team session cleared, commissioner session still active:', commissionerSession.isCommissioner);
        
        updateFooterButtons();
        showPage('landing-page');
    } else {
        console.log('[Team Logout] User cancelled logout');
    }
}

// Handle commissioner logout
function handleCommissionerLogout() {
    if (confirm('Are you sure you want to logout from Commissioner mode?')) {
        console.log('[Commissioner Logout] User confirmed commissioner logout');
        console.log('[Commissioner Logout] Current session before clearing:', commissionerSession);
        
        // Clear commissioner session ONLY (don't touch team session)
        localStorage.removeItem(COMMISSIONER_SESSION_KEY);
        commissionerSession = { isCommissioner: false, loginTime: null, expiresAt: null };
        
        console.log('[Commissioner Logout] Commissioner session cleared, team session still active:', !!anonymousSession.token);
        
        // Call logout API to clear the HttpOnly cookie
        fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        }).then(response => {
            if (response.ok) {
                console.log('[Commissioner Logout] Commissioner cookie cleared via API');
            } else {
                console.warn('[Commissioner Logout] Failed to clear commissioner cookie via API');
            }
        }).catch(error => {
            console.error('[Commissioner Logout] Error calling logout API:', error);
        });
        
        updateFooterButtons();
        showPage('landing-page');
    } else {
        console.log('[Commissioner Logout] User cancelled logout');
    }
}

// Handle copy URL
function handleCopyUrl() {
    const gameId = GAME_ID;
    const sessionUrl = `${window.location.origin}${window.location.pathname}?session=${anonymousSession.token}&game=${gameId}`;
    
    navigator.clipboard.writeText(sessionUrl).then(() => {
        const originalText = document.getElementById('copy-url-button').textContent;
        document.getElementById('copy-url-button').textContent = '✅ Copied!';
        setTimeout(() => {
            document.getElementById('copy-url-button').textContent = originalText;
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert(`Copy this URL to access your team:\n\n${sessionUrl}`);
    });
}

// ========== END SESSION FUNCTIONS ==========

// Handle enter game
async function handleEnterGame() {
    const code = document.getElementById('player-code').value.trim().toUpperCase();
    if (!code) {
        alert('Please enter a player code');
        return;
    }

    if (!gameState.players.includes(code)) {
        alert('Invalid player code. Please check with your commissioner.');
        return;
    }

    gameState.currentPlayer = code;
    document.getElementById('player-name').textContent = code;

    // Always go to salary cap draft page (it shows roster when locked)
    await setupSalaryCapDraft();
    showPage('salary-cap-draft-page');
    
    // Delay slightly to ensure page is fully rendered, then check for game recap
    setTimeout(async () => {
        await checkAndShowGameRecap();
    }, 500);
}

// Handle create new game (Account-Free)
async function handleCreateNewGame() {
    try {
        // Create anonymous commissioner session
        const response = await fetch(`${API_BASE}/api/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionType: 'commissioner',
                displayName: 'Commissioner',
                gameId: GAME_ID,
                expiryDays: 90
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to create session');
        }
        
        const data = await response.json();
        
        // Save session
        const session = {
            token: data.session.token,
            type: 'commissioner',
            expiresAt: data.session.expiresAt,
            displayName: 'Commissioner',
            gameId: GAME_ID
        };
        saveSession(session);
        
        // Show success message with unique URL
        alert(`✅ Game Created Successfully!\n\n` +
              `Your unique commissioner URL:\n${data.uniqueUrl}\n\n` +
              `⚠️ IMPORTANT: Save this URL! You'll need it to return to your game.\n\n` +
              `You can bookmark it or save it to your home screen.`);
        
        // Navigate to commissioner page
        showPage('commissioner-page');
        
    } catch (error) {
        console.error('Error creating game:', error);
        alert('Failed to create game. Please try again.');
    }
}

// Handle commissioner mode
function handleCommissionerMode() {
    console.log('[Commissioner Mode] Attempting to access commissioner mode');
    console.log('[Commissioner Mode] Current commissionerSession:', commissionerSession);
    
    // Check if already authenticated via TOTP
    if (commissionerSession.isCommissioner) {
        console.log('[Commissioner Mode] Commissioner authenticated, showing page');
        // Already authenticated, just show the page
        showPage('commissioner-page');
        // Refresh player codes display if players exist
        if (gameState.players.length > 0) {
            displayPlayerCodes();
        }
        // Update button states based on results and finalized state
        if (gameState.draftComplete) {
            updateLiveStandings();
            
            // Update finalize button visibility based on results
            if (gameState.resultsFinalized) {
                document.getElementById('finalize-results').style.display = 'none';
            } else if (Object.keys(gameState.results).length > 0) {
                document.getElementById('finalize-results').style.display = 'inline-block';
            } else {
                document.getElementById('finalize-results').style.display = 'none';
            }
        }
    } else {
        // Not authenticated - show TOTP login modal instead of password prompt
        console.warn('[Commissioner Mode] User not authenticated, session state:', commissionerSession);
        alert('Please log in with your TOTP code using the "Commissioner Mode" button in the footer.');
    }
}

// Setup ranking page
async function setupRankingPage() {
    // Ensure athletes are loaded before displaying
    if (!gameState.athletes.men || gameState.athletes.men.length === 0) {
        await loadAthletes();
    }
    switchTab('men');
}

// Switch tab
function switchTab(gender) {
    rankingViewState.currentGender = gender;
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.gender === gender);
    });
    
    // Always display table view
    displayAthleteTable(gender);
}


// Display athlete table view
function displayAthleteTable(gender) {
    const tbody = document.getElementById('athlete-table-body');
    tbody.innerHTML = '';
    
    if (!gameState.currentPlayer) return;
    
    // Get or initialize rankings for this gender
    if (!gameState.rankings[gameState.currentPlayer]) {
        gameState.rankings[gameState.currentPlayer] = { men: [], women: [] };
    }
    
    let rankings = gameState.rankings[gameState.currentPlayer][gender];
    
    // If no rankings yet, initialize with all athletes sorted by PB
    if (rankings.length === 0) {
        rankings = sortAthletesByPB([...(gameState.athletes[gender] || [])]);
        gameState.rankings[gameState.currentPlayer][gender] = rankings;
    }
    
    // Display all athletes in their current rank order
    rankings.forEach((athlete, index) => {
        const row = document.createElement('tr');
        row.className = 'ranked-row';
        row.draggable = false; // Only enable when handle is grabbed
        row.dataset.athleteId = athlete.id;
        row.dataset.gender = gender;
        row.dataset.rankIndex = index;
        
        // Drag handle cell (first column)
        const dragHandleCell = document.createElement('td');
        dragHandleCell.className = 'drag-handle-cell';
        dragHandleCell.innerHTML = `
            <div class="drag-handle" title="Drag to reorder">
                <span class="drag-grip">⋮⋮</span>
            </div>
        `;
        
        const dragHandle = dragHandleCell.querySelector('.drag-handle');
        
        // Desktop: Enable dragging only when handle is clicked
        dragHandle.addEventListener('mousedown', (e) => {
            row.draggable = true;
        });
        
        // Desktop drag event listeners (on the row)
        row.addEventListener('dragstart', handleTableRowDragStart);
        row.addEventListener('dragover', handleTableRowDragOver);
        row.addEventListener('drop', handleTableRowDrop);
        row.addEventListener('dragend', (e) => {
            handleTableRowDragEnd.call(row, e);
            row.draggable = false; // Disable after drag
        });
        
        // Mobile: Touch event listeners on the handle only
        dragHandle.addEventListener('touchstart', handleTableRowTouchStart.bind(row), { passive: false });
        dragHandle.addEventListener('touchmove', handleTableRowTouchMove.bind(row), { passive: false });
        dragHandle.addEventListener('touchend', handleTableRowTouchEnd.bind(row), { passive: false });
        
        row.appendChild(dragHandleCell);
        
        // Rank cell (editable)
        const rankCell = document.createElement('td');
        rankCell.className = 'rank-cell-input';
        
        const rankInput = document.createElement('input');
        rankInput.type = 'number';
        rankInput.className = 'table-rank-input';
        rankInput.min = '1';
        rankInput.max = rankings.length.toString();
        rankInput.value = index + 1;
        rankInput.title = 'Edit rank and press Enter';
        rankInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                handleTableRankChange(gender, athlete.id, parseInt(rankInput.value));
                rankInput.blur();
            }
        });
        rankInput.addEventListener('blur', () => {
            // Revert to current rank if invalid
            const updatedRank = gameState.rankings[gameState.currentPlayer][gender].findIndex(r => r.id === athlete.id);
            rankInput.value = updatedRank + 1;
        });
        rankInput.addEventListener('click', (e) => {
            e.stopPropagation();
            rankInput.select();
        });
        rankCell.appendChild(rankInput);
        row.appendChild(rankCell);
        
        // Name cell (clickable to open modal)
        const nameCell = document.createElement('td');
        nameCell.className = 'name-cell';
        nameCell.textContent = athlete.name;
        nameCell.style.cursor = 'pointer';
        nameCell.addEventListener('click', () => openAthleteModal(athlete));
        row.appendChild(nameCell);
        
        // Country cell
        const countryCell = document.createElement('td');
        countryCell.className = 'country-cell';
        countryCell.innerHTML = `${getCountryFlag(athlete.country)} ${athlete.country}`;
        row.appendChild(countryCell);
        
        // PB cell
        const pbCell = document.createElement('td');
        pbCell.className = 'pb-cell';
        pbCell.textContent = athlete.pb || '-';
        row.appendChild(pbCell);
        
        // Season Best cell
        const sbCell = document.createElement('td');
        sbCell.textContent = athlete.seasonBest || '-';
        row.appendChild(sbCell);
        
        // Marathon Rank cell
        const marathonRankCell = document.createElement('td');
        marathonRankCell.className = 'rank-display-cell';
        if (athlete.marathonRank) {
            marathonRankCell.textContent = `#${athlete.marathonRank}`;
            if (athlete.marathonRank <= 10) {
                marathonRankCell.classList.add('top-rank');
            }
        } else {
            marathonRankCell.textContent = '-';
        }
        row.appendChild(marathonRankCell);
        
        // Overall Rank cell
        const overallRankCell = document.createElement('td');
        overallRankCell.className = 'rank-display-cell';
        if (athlete.overallRank) {
            overallRankCell.textContent = `#${athlete.overallRank}`;
            if (athlete.overallRank <= 10) {
                overallRankCell.classList.add('top-rank');
            }
        } else {
            overallRankCell.textContent = '-';
        }
        row.appendChild(overallRankCell);
        
        // Age cell
        const ageCell = document.createElement('td');
        ageCell.textContent = athlete.age || '-';
        row.appendChild(ageCell);
        
        tbody.appendChild(row);
    });
}

// Drag and drop for table rows (desktop + mobile touch)
let draggedTableRow = null;
let touchStartY = 0;
let touchCurrentY = 0;
let isDragging = false;

function handleTableRowDragStart(e) {
    draggedTableRow = this;
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleTableRowDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedTableRow !== this) {
        const tbody = this.parentElement;
        const rankedRows = Array.from(tbody.querySelectorAll('.ranked-row'));
        const draggedIndex = rankedRows.indexOf(draggedTableRow);
        const targetIndex = rankedRows.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentElement.insertBefore(draggedTableRow, this.nextSibling);
        } else {
            this.parentElement.insertBefore(draggedTableRow, this);
        }
    }
    
    return false;
}

function handleTableRowDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    // Update rankings based on new table row order
    const gender = this.dataset.gender;
    const tbody = this.parentElement;
    const rankedRows = Array.from(tbody.querySelectorAll('.ranked-row'));
    
    const newOrder = rankedRows.map(row => {
        const athleteId = parseInt(row.dataset.athleteId);
        const allAthletes = [...gameState.athletes.men, ...gameState.athletes.women];
        return allAthletes.find(a => a.id === athleteId);
    }).filter(Boolean);
    
    gameState.rankings[gameState.currentPlayer][gender] = newOrder;
    
    // Refresh displays
    displayAthleteTable(gender);
    
    return false;
}

function handleTableRowDragEnd(e) {
    this.style.opacity = '1';
    draggedTableRow = null;
}

// Mobile touch handlers for drag handle
function handleTableRowTouchStart(e) {
    // Start dragging immediately when handle is touched (this is bound to the row)
    const row = this;
    
    isDragging = true;
    draggedTableRow = row;
    touchStartY = e.touches[0].clientY;
    touchCurrentY = touchStartY;
    
    row.style.opacity = '0.8';
    row.style.zIndex = '1000';
    row.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
    row.style.backgroundColor = '#90caf9';
    
    e.preventDefault(); // Prevent default touch behavior on handle
}

function handleTableRowTouchMove(e) {
    if (!isDragging || !draggedTableRow) return;
    
    // Prevent scrolling while dragging
    e.preventDefault();
    
    const touch = e.touches[0];
    touchCurrentY = touch.clientY; // Update current touch position
    const deltaY = touchCurrentY - touchStartY;
    
    // Visual feedback - move the row
    draggedTableRow.style.transform = `translateY(${deltaY}px)`;
    
    // Find which row we're hovering over by temporarily hiding the dragged row
    
    // Temporarily hide the dragged row from pointer events to detect what's underneath
    const originalPointerEvents = draggedTableRow.style.pointerEvents;
    draggedTableRow.style.pointerEvents = 'none';
    
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    const rowBelow = elementBelow ? elementBelow.closest('.ranked-row') : null;
    
    // Restore pointer events
    draggedTableRow.style.pointerEvents = originalPointerEvents;
    
    if (rowBelow && rowBelow !== draggedTableRow) {
        const tbody = draggedTableRow.parentElement;
        const rankedRows = Array.from(tbody.querySelectorAll('.ranked-row'));
        const draggedIndex = rankedRows.indexOf(draggedTableRow);
        const targetIndex = rankedRows.indexOf(rowBelow);
        
        if (draggedIndex < targetIndex) {
            tbody.insertBefore(draggedTableRow, rowBelow.nextSibling);
        } else {
            tbody.insertBefore(draggedTableRow, rowBelow);
        }
        
        // Reset transform and touch position after reordering
        draggedTableRow.style.transform = '';
        touchStartY = touch.clientY;
    }
}

function handleTableRowTouchEnd(e) {
    if (!draggedTableRow) return;
    
    if (isDragging) {
        // Prevent click events from firing
        e.preventDefault();
        
        // Update rankings based on new table row order
        const gender = draggedTableRow.dataset.gender;
        const tbody = draggedTableRow.parentElement;
        const rankedRows = Array.from(tbody.querySelectorAll('.ranked-row'));
        
        const newOrder = rankedRows.map(row => {
            const athleteId = parseInt(row.dataset.athleteId);
            const allAthletes = [...gameState.athletes.men, ...gameState.athletes.women];
            return allAthletes.find(a => a.id === athleteId);
        }).filter(Boolean);
        
        gameState.rankings[gameState.currentPlayer][gender] = newOrder;
        
        // Refresh displays
        displayAthleteTable(gender);
    }
    
    // Reset state
    if (draggedTableRow) {
        draggedTableRow.style.opacity = '';
        draggedTableRow.style.transform = '';
        draggedTableRow.style.zIndex = '';
        draggedTableRow.style.boxShadow = '';
        draggedTableRow.style.backgroundColor = '';
        draggedTableRow.style.pointerEvents = '';
    }
    draggedTableRow = null;
    isDragging = false;
    dragCancelled = false;
}

// Handle rank change from table input
function handleTableRankChange(gender, athleteId, newRank) {
    const rankings = gameState.rankings[gameState.currentPlayer][gender];
    
    // Validate rank
    if (newRank < 1 || newRank > rankings.length || isNaN(newRank)) {
        alert(`Please enter a valid rank between 1 and ${rankings.length}`);
        displayAthleteTable(gender);
        return;
    }
    
    // Find athlete's current position
    const currentIndex = rankings.findIndex(a => a.id === athleteId);
    if (currentIndex === -1) return;
    
    // Don't do anything if rank hasn't changed
    if (currentIndex === newRank - 1) {
        displayAthleteTable(gender);
        return;
    }
    
    // Remove athlete from current position
    const athlete = rankings.splice(currentIndex, 1)[0];
    
    // Insert at new position
    rankings.splice(newRank - 1, 0, athlete);
    
    // Refresh display
    displayAthleteTable(gender);
}

// Sort athletes by personal best time (fastest first)
function sortAthletesByPB(athletes) {
    return athletes.sort((a, b) => {
        const aTime = timeStringToSeconds(a.pb) || 999999;
        const bTime = timeStringToSeconds(b.pb) || 999999;
        return aTime - bTime;
    });
}

// Convert time string to seconds for sorting
function timeStringToSeconds(timeStr) {
    if (!timeStr || timeStr === '-') return null;
    const parts = timeStr.split(':');
    if (parts.length === 3) {
        const [h, m, s] = parts.map(Number);
        return h * 3600 + m * 60 + s;
    }
    return null;
}

// Legacy functions - no longer used with table-only view
function addAthleteToRanking(gender, athlete) {
    // Not used - table view manages all athletes
}

function removeAthleteFromRanking(gender, athleteId) {
    // Not used - table view manages all athletes
}

function updateRankingDisplay(gender) {
    // Not used - no separate ranking display boxes
}

function setupDragAndDrop(gender) {
    // Not used - table has its own drag and drop
}

function handleManualRankChange(gender, athleteId, newRank) {
    // Not used - table has its own rank change handler
}

// Drag and drop handlers for ranking boxes (legacy - not used)
function handleDragStart(e) {}
function handleDragOver(e) { return false; }
function handleDrop(e) { return false; }
function handleDragEnd(e) {}
function getDragAfterElement(container, y) { return null; }

// Handle submit rankings
async function handleSubmitRankings() {
    const allMenRankings = gameState.rankings[gameState.currentPlayer]?.men || [];
    const allWomenRankings = gameState.rankings[gameState.currentPlayer]?.women || [];

    // Extract top 10 from each gender
    const menRankings = allMenRankings.slice(0, 10);
    const womenRankings = allWomenRankings.slice(0, 10);

    if (menRankings.length !== 10 || womenRankings.length !== 10) {
        alert('Please ensure you have ranked at least 10 men and 10 women before submitting.');
        return;
    }

    try {
        // Save top 10 rankings to database
        await fetch(`${API_BASE}/api/rankings?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerCode: gameState.currentPlayer,
                men: menRankings,
                women: womenRankings
            })
        });

        alert('Rankings submitted successfully! The draft will run once all players have submitted.');
        showPage('landing-page');
    } catch (error) {
        console.error('Error submitting rankings:', error);
        alert('Error submitting rankings. Please try again.');
    }
}

// Commissioner functions
function hasPlayerSubmittedRankings(playerCode) {
    const ranking = gameState.rankings[playerCode];
    return ranking && 
           ranking.men && 
           ranking.women && 
           ranking.men.length === 10 && 
           ranking.women.length === 10;
}

async function displayPlayerCodes() {
    const display = document.getElementById('player-codes-display');
    // Hide player links - only show "Manage Players/Teams" button
    display.innerHTML = '';
}

/**
 * Display teams table in commissioner view
 * 
 * ⚠️ LEGACY FUNCTION - Shows STALE DATA for salary cap draft teams
 * This function loops through gameState.players[] which is a DEPRECATED array
 * that is no longer maintained for salary cap draft teams.
 * 
 * Teams created after deprecation will NOT appear in this view.
 * 
 * For accurate team data, use the modern Teams Overview Panel:
 *   - Location: components/commissioner/TeamsOverviewPanel.tsx
 *   - Data source: anonymous_sessions table (queried via /api/salary-cap-draft)
 *   - Features: Real-time team list, copy links, view team, delete team
 * 
 * This legacy function is kept for backward compatibility with snake draft mode only.
 */
async function displayTeamsTable() {
    const tableBody = document.getElementById('teams-status-table-body');
    tableBody.innerHTML = '';
    
    // ⚠️ DEPRECATED: Loops through games.players[] array
    // This will not include salary cap teams created after deprecation.
    // Use TeamsOverviewPanel.tsx for accurate data.
    
    // Batch create sessions for all players concurrently
    const sessionPromises = gameState.players.map(code => 
        fetch(`${API_BASE}/api/session/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sessionType: 'player',
                displayName: code,
                gameId: GAME_ID,
                playerCode: code,
                expiryDays: 90
            })
        })
        .then(response => response.ok ? response.json() : null)
        .catch(() => null)
    );
    
    const sessionResults = await Promise.all(sessionPromises);
    
    // Build table rows with session data
    gameState.players.forEach((code, index) => {
        const hasSubmitted = hasPlayerSubmittedRankings(code);
        const hasDraftedTeam = gameState.teams && gameState.teams[code] && gameState.teams[code].length > 0;
        const sessionData = sessionResults[index];
        
        const row = document.createElement('tr');
        row.className = hasSubmitted ? 'team-row-submitted' : 'team-row-pending';
        
        // Status icon column
        const statusCell = document.createElement('td');
        const statusIcon = document.createElement('span');
        statusIcon.className = 'status-icon-table';
        statusIcon.textContent = hasSubmitted ? '✓' : '○';
        statusIcon.style.color = hasSubmitted ? '#10b981' : '#94a3b8';
        statusIcon.style.fontSize = '20px';
        statusCell.appendChild(statusIcon);
        row.appendChild(statusCell);
        
        // Team name column
        const nameCell = document.createElement('td');
        nameCell.textContent = code;
        nameCell.style.fontWeight = '600';
        row.appendChild(nameCell);
        
        // Player link column with copy button
        const linkCell = document.createElement('td');
        if (sessionData && sessionData.uniqueUrl) {
            const uniqueURL = sessionData.uniqueUrl;
            const sessionToken = uniqueURL.split('?session=')[1];
            
            const linkWrapper = document.createElement('div');
            linkWrapper.style.display = 'flex';
            linkWrapper.style.alignItems = 'center';
            linkWrapper.style.gap = '8px';
            
            const urlLink = document.createElement('a');
            urlLink.href = uniqueURL;
            urlLink.target = '_blank';
            urlLink.textContent = sessionToken.substring(0, 8) + '...';
            urlLink.style.color = '#2C39A2';
            urlLink.style.textDecoration = 'none';
            
            const copyBtn = document.createElement('button');
            copyBtn.className = 'btn-copy-mini';
            copyBtn.textContent = '📋';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(uniqueURL).then(() => {
                    copyBtn.textContent = '✅';
                    setTimeout(() => {
                        copyBtn.textContent = '📋';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    copyBtn.textContent = '❌';
                    setTimeout(() => {
                        copyBtn.textContent = '📋';
                    }, 2000);
                });
            };
            
            linkWrapper.appendChild(urlLink);
            linkWrapper.appendChild(copyBtn);
            linkCell.appendChild(linkWrapper);
        } else {
            linkCell.textContent = 'Error';
        }
        row.appendChild(linkCell);
        
        // Rankings status column
        const rankingsCell = document.createElement('td');
        const rankingsBadge = document.createElement('span');
        rankingsBadge.className = hasSubmitted ? 'badge-success' : 'badge-pending';
        rankingsBadge.textContent = hasSubmitted ? 'Submitted' : 'Pending';
        rankingsCell.appendChild(rankingsBadge);
        row.appendChild(rankingsCell);
        
        // Draft status column
        const draftCell = document.createElement('td');
        draftCell.className = 'draft-status-column';
        const draftBadge = document.createElement('span');
        draftBadge.className = hasDraftedTeam ? 'badge-success' : 'badge-pending';
        draftBadge.textContent = hasDraftedTeam ? 'Drafted' : 'Not Drafted';
        draftCell.appendChild(draftBadge);
        row.appendChild(draftCell);
        
        // Actions column
        const actionsCell = document.createElement('td');
        
        // View button (disabled for now)
        const viewButton = document.createElement('button');
        viewButton.className = 'btn-mini';
        viewButton.textContent = 'View';
        viewButton.disabled = true;
        viewButton.title = 'Team details coming in a future update';
        viewButton.style.marginRight = '4px';
        actionsCell.appendChild(viewButton);
        
        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn-mini btn-danger-mini';
        deleteButton.textContent = 'Delete';
        deleteButton.title = 'Delete this player/team';
        deleteButton.onclick = async () => {
            if (confirm(`Are you sure you want to delete player "${code}" and all associated data?\n\nThis will remove:\n- Rankings\n- Drafted team\n- Session access\n\nThis action cannot be undone.`)) {
                try {
                    const sessionToken = sessionData?.uniqueUrl?.split('?session=')[1];
                    const response = await fetch(`${API_BASE}/api/teams/delete`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            gameId: GAME_ID,
                            playerCode: code,
                            sessionToken: sessionToken
                        })
                    });
                    
                    if (!response.ok) {
                        throw new Error('Failed to delete team');
                    }
                    
                    const result = await response.json();
                    console.log('Delete result:', result);
                    
                    // Refresh game state and table
                    await loadGameState();
                    await displayTeamsTable();
                    
                    alert(`Successfully deleted player "${code}"`);
                } catch (error) {
                    console.error('Error deleting team:', error);
                    alert('Failed to delete team. Please try again.');
                }
            }
        };
        actionsCell.appendChild(deleteButton);
        
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
}

// Display and manage race results in a table
async function displayResultsManagement() {
    const tableBody = document.getElementById('results-table-body');
    const noResultsMessage = document.getElementById('no-results-message');
    const viewSelect = document.getElementById('results-view-select');
    const headerCell = document.getElementById('time-column-header');
    const currentView = viewSelect.value;
    
    tableBody.innerHTML = '';
    
    // Update column header based on view
    const headerTitles = {
        'finish': 'Finish Time',
        '5k': '5K Split',
        '10k': '10K Split',
        'half': 'Half Marathon Split',
        '30k': '30K Split',
        '35k': '35K Split',
        '40k': '40K Split',
        'bonuses': 'Bonus Points'
    };
    headerCell.textContent = headerTitles[currentView] || 'Finish Time';
    
    // Load current results from database
    try {
        const response = await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch results');
        }
        const data = await response.json();
        
        // Use the scored array which has full athlete info
        const scoredResults = data.scored || [];
        
        // Filter to only athletes with ANY results (finish time, splits, or bonus points)
        const athletesWithResults = scoredResults.filter(result => {
            // Check if athlete has finish time
            if (result.finish_time && result.finish_time.trim() !== '') {
                return true;
            }
            // Check if athlete has any split times
            if ((result.split_5k && result.split_5k.trim() !== '') ||
                (result.split_10k && result.split_10k.trim() !== '') ||
                (result.split_half && result.split_half.trim() !== '') ||
                (result.split_30k && result.split_30k.trim() !== '') ||
                (result.split_35k && result.split_35k.trim() !== '') ||
                (result.split_40k && result.split_40k.trim() !== '')) {
                return true;
            }
            // Check if athlete has any bonus points
            if (result.performance_bonus_points > 0 || result.record_bonus_points > 0) {
                return true;
            }
            return false;
        });
        
        if (athletesWithResults.length === 0) {
            // Show no results message
            noResultsMessage.style.display = 'block';
            document.getElementById('results-table').style.display = 'none';
            return;
        }
        
        // Show table and hide no results message
        noResultsMessage.style.display = 'none';
        document.getElementById('results-table').style.display = 'table';
        
        // Results are already sorted by the API query
        // Build table rows
        athletesWithResults.forEach(result => {
            const row = document.createElement('tr');
            row.className = 'result-row';
            
            // Athlete name column
            const nameCell = document.createElement('td');
            nameCell.textContent = result.athlete_name || 'Unknown';
            nameCell.style.fontWeight = '600';
            row.appendChild(nameCell);
            
            // Country column
            const countryCell = document.createElement('td');
            countryCell.textContent = result.country || '-';
            row.appendChild(countryCell);
            
            // Gender column
            const genderCell = document.createElement('td');
            const gender = result.gender || '';
            genderCell.textContent = gender.charAt(0).toUpperCase() + gender.slice(1);
            row.appendChild(genderCell);
            
            // Time/Data column - changes based on current view
            const dataCell = document.createElement('td');
            
            if (currentView === 'bonuses') {
                // Show record eligibility checkboxes
                // Performance bonuses are automatically calculated from splits
                const bonusContainer = document.createElement('div');
                bonusContainer.className = 'bonus-points-container';
                bonusContainer.style.display = 'flex';
                bonusContainer.style.flexDirection = 'column';
                bonusContainer.style.gap = '8px';
                
                // Note about performance bonuses
                const perfNote = document.createElement('div');
                perfNote.style.fontSize = '0.85em';
                perfNote.style.color = '#666';
                perfNote.style.marginBottom = '4px';
                perfNote.textContent = 'Performance Bonus (+' + (result.performance_bonus_points || 0) + ' pts) - auto-calculated from splits';
                bonusContainer.appendChild(perfNote);
                
                // World Record checkbox
                const wrBonus = document.createElement('label');
                wrBonus.className = 'bonus-checkbox';
                const wrCheck = document.createElement('input');
                wrCheck.type = 'checkbox';
                wrCheck.checked = result.record_type === 'WORLD' || result.record_type === 'BOTH';
                wrCheck.dataset.athleteId = result.athlete_id;
                wrCheck.dataset.recordType = 'world';
                wrBonus.appendChild(wrCheck);
                wrBonus.appendChild(document.createTextNode(' World Record (+15 pts)'));
                bonusContainer.appendChild(wrBonus);
                
                // Course Record checkbox
                const crBonus = document.createElement('label');
                crBonus.className = 'bonus-checkbox';
                const crCheck = document.createElement('input');
                crCheck.type = 'checkbox';
                crCheck.checked = result.record_type === 'COURSE' || result.record_type === 'BOTH';
                crCheck.dataset.athleteId = result.athlete_id;
                crCheck.dataset.recordType = 'course';
                crBonus.appendChild(crCheck);
                crBonus.appendChild(document.createTextNode(' Course Record (+5 pts)'));
                bonusContainer.appendChild(crBonus);
                
                dataCell.appendChild(bonusContainer);
            } else {
                // Show time input
                const timeInput = document.createElement('input');
                timeInput.type = 'text';
                
                // Get the appropriate value based on current view
                const fieldMap = {
                    'finish': result.finish_time,
                    '5k': result.split_5k,
                    '10k': result.split_10k,
                    'half': result.split_half,
                    '30k': result.split_30k,
                    '35k': result.split_35k,
                    '40k': result.split_40k
                };
                
                timeInput.value = fieldMap[currentView] || '';
                timeInput.placeholder = currentView === 'finish' ? '2:05:30' : '0:14:30';
                timeInput.pattern = '[0-9]{1,2}:[0-9]{2}:[0-9]{2}';
                timeInput.style.width = '100px';
                timeInput.style.padding = '4px 8px';
                timeInput.style.border = '1px solid #ddd';
                timeInput.style.borderRadius = '4px';
                timeInput.dataset.athleteId = result.athlete_id;
                timeInput.dataset.field = currentView;
                
                // Validation styling on input (supports decimal seconds)
                timeInput.addEventListener('input', (e) => {
                    const time = e.target.value.trim();
                    if (time === '') {
                        e.target.style.borderColor = '#ddd';
                        e.target.style.backgroundColor = '';
                    } else if (/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/.test(time)) {
                        e.target.style.borderColor = '#28a745';
                        e.target.style.backgroundColor = '#d4edda';
                    } else {
                        e.target.style.borderColor = '#dc3545';
                        e.target.style.backgroundColor = '#f8d7da';
                    }
                });
                
                dataCell.appendChild(timeInput);
            }
            
            row.appendChild(dataCell);
            
            // Actions column with Save and Delete buttons
            const actionsCell = document.createElement('td');
            actionsCell.className = 'actions-cell';
            
            // Save button
            const saveBtn = document.createElement('button');
            saveBtn.className = 'btn-mini btn-success';
            saveBtn.textContent = 'Save';
            saveBtn.onclick = async () => {
                try {
                    if (currentView === 'bonuses') {
                        // Save record eligibility (performance bonuses are auto-calculated)
                        const wrCheck = dataCell.querySelector('input[data-record-type="world"]');
                        const crCheck = dataCell.querySelector('input[data-record-type="course"]');
                        
                        let recordType = 'NONE';
                        if (wrCheck.checked && crCheck.checked) {
                            recordType = 'BOTH';
                        } else if (wrCheck.checked) {
                            recordType = 'WORLD';
                        } else if (crCheck.checked) {
                            recordType = 'COURSE';
                        }
                        
                        const updateData = {
                            [result.athlete_id]: {
                                finish_time: result.finish_time,
                                record_type: recordType,
                                record_status: recordType !== 'NONE' ? 'confirmed' : 'none'
                            }
                        };
                        
                        await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                results: updateData,
                                autoScore: true  // Trigger scoring engine after save
                            })
                        });
                        
                        // Reload data to show updated scores
                        await displayResultsManagement();
                    } else {
                        // Save time data
                        const timeInput = dataCell.querySelector('input[type="text"]');
                        const newTime = timeInput.value.trim();
                        
                        if (newTime && !/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/.test(newTime)) {
                            alert('Invalid time format. Please use HH:MM:SS or HH:MM:SS.mmm format (e.g., 2:05:30 or 2:05:30.12)');
                            return;
                        }
                        
                        // Build update payload based on current field
                        const updateData = {
                            [result.athlete_id]: {}
                        };
                        
                        // Always include finish_time to maintain record
                        if (currentView === 'finish') {
                            updateData[result.athlete_id].finish_time = newTime;
                        } else {
                            updateData[result.athlete_id].finish_time = result.finish_time;
                            const splitFieldMap = {
                                '5k': 'split_5k',
                                '10k': 'split_10k',
                                'half': 'split_half',
                                '30k': 'split_30k',
                                '35k': 'split_35k',
                                '40k': 'split_40k'
                            };
                            updateData[result.athlete_id][splitFieldMap[currentView]] = newTime;
                        }
                        
                        await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                results: updateData,
                                autoScore: true  // Trigger scoring engine after save
                            })
                        });
                        
                        // Update local state if finish time
                        if (currentView === 'finish') {
                            gameState.results[result.athlete_id] = newTime;
                        }
                    }
                    
                    // Invalidate cache
                    invalidateResultsCache();
                    
                    // Show success feedback
                    saveBtn.textContent = '✓';
                    setTimeout(() => {
                        saveBtn.textContent = 'Save';
                    }, 2000);
                    
                    // Refresh the table to show updated data
                    displayResultsManagement();
                } catch (error) {
                    console.error('Error saving result:', error);
                    alert(`Error saving result: ${error.message}. Please try again.`);
                }
            };
            
            // Delete button (only for finish time view)
            if (currentView === 'finish') {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-mini btn-danger';
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = async () => {
                    if (confirm(`Are you sure you want to delete the result for ${result.athlete_name}?`)) {
                        try {
                            // Delete the result by setting it to empty string
                            await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ results: { [result.athlete_id]: '' } })
                            });
                            
                            // Update local state
                            delete gameState.results[result.athlete_id];
                            
                            // Invalidate cache
                            invalidateResultsCache();
                            
                            // Refresh the table
                            displayResultsManagement();
                        } catch (error) {
                            console.error('Error deleting result:', error);
                            alert(`Error deleting result: ${error.message}. Please try again.`);
                        }
                    }
                };
                
                actionsCell.appendChild(saveBtn);
                actionsCell.appendChild(deleteBtn);
            } else {
                actionsCell.appendChild(saveBtn);
            }
            
            row.appendChild(actionsCell);
            
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading results:', error);
        noResultsMessage.innerHTML = '<p>Error loading results. Please try again.</p>';
        noResultsMessage.style.display = 'block';
        document.getElementById('results-table').style.display = 'none';
    }
}

// Populate athlete select for adding new results
async function populateAthleteSelect() {
    const select = document.getElementById('result-athlete-select');
    
    // Clear existing options except the first one
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    try {
        // Fetch all athletes confirmed for NYC Marathon
        console.log('[Add Result] Fetching athletes from:', `${API_BASE}/api/athletes`);
        const response = await fetch(`${API_BASE}/api/athletes`);
        console.log('[Add Result] Athletes response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Add Result] Failed to fetch athletes:', response.status, errorText);
            throw new Error(`Failed to fetch athletes: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('[Add Result] Athletes data received:', data);
        
        // Handle both formats: {athletes: [...]} or {men: [...], women: [...]}
        let athletes = [];
        if (data.athletes) {
            athletes = data.athletes;
        } else if (data.men || data.women) {
            // Combine men and women arrays
            athletes = [...(data.men || []), ...(data.women || [])];
        }
        
        console.log('[Add Result] Number of athletes:', athletes.length);
        
        if (athletes.length === 0) {
            console.warn('[Add Result] No athletes found in response');
            alert('No athletes found. Please ensure athletes are loaded in the system.');
            return;
        }
        
        // Sort athletes by name
        const sortedAthletes = [...athletes].sort((a, b) => {
            const nameA = a.name || '';
            const nameB = b.name || '';
            return nameA.localeCompare(nameB);
        });
        
        // Add all confirmed athletes to select
        sortedAthletes.forEach(athlete => {
            const option = document.createElement('option');
            option.value = athlete.id;
            option.textContent = `${athlete.name} (${athlete.country}) - ${athlete.gender}`;
            select.appendChild(option);
        });
        
        console.log('[Add Result] Successfully added', sortedAthletes.length, 'athletes to dropdown');
        
    } catch (error) {
        console.error('[Add Result] Error loading athletes:', error);
        alert(`Error loading athletes: ${error.message}. Please try again.`);
    }
}

// Handle adding a new result
async function handleAddResult(e) {
    e.preventDefault();
    
    const athleteId = parseInt(document.getElementById('result-athlete-select').value, 10);
    const finishTime = document.getElementById('result-finish-time').value.trim();
    const split5k = document.getElementById('result-split-5k').value.trim();
    const split10k = document.getElementById('result-split-10k').value.trim();
    const splitHalf = document.getElementById('result-split-half').value.trim();
    const split30k = document.getElementById('result-split-30k').value.trim();
    const split35k = document.getElementById('result-split-35k').value.trim();
    const split40k = document.getElementById('result-split-40k').value.trim();
    
    if (!athleteId || !finishTime) {
        alert('Please select an athlete and enter a finish time.');
        return;
    }
    
    // Validate time format (allow optional decimal seconds)
    const timePattern = /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/;
    if (!timePattern.test(finishTime)) {
        alert('Invalid finish time format. Please use HH:MM:SS or HH:MM:SS.mmm format (e.g., 2:05:30 or 2:05:30.12)');
        return;
    }
    
    // Build result payload
    const resultData = {
        finish_time: finishTime
    };
    
    // Add splits if provided
    if (split5k && timePattern.test(split5k)) resultData.split_5k = split5k;
    if (split10k && timePattern.test(split10k)) resultData.split_10k = split10k;
    if (splitHalf && timePattern.test(splitHalf)) resultData.split_half = splitHalf;
    if (split30k && timePattern.test(split30k)) resultData.split_30k = split30k;
    if (split35k && timePattern.test(split35k)) resultData.split_35k = split35k;
    if (split40k && timePattern.test(split40k)) resultData.split_40k = split40k;
    
    try {
        // Save result to database
        await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: { [athleteId]: resultData } })
        });
        
        // Update local state
        gameState.results[athleteId] = finishTime;
        
        // Invalidate cache
        invalidateResultsCache();
        
        // Close modal
        document.getElementById('add-result-modal').style.display = 'none';
        
        // Reset form
        document.getElementById('add-result-form').reset();
        
        // Refresh the table
        displayResultsManagement();
        
        alert('Result added successfully!');
    } catch (error) {
        console.error('Error adding result:', error);
        alert(`Error adding result: ${error.message}. Please try again.`);
    }
}

// Snake draft algorithm
async function handleRunDraft() {
    // Check if all players have submitted rankings
    const allSubmitted = gameState.players.every(player => gameState.rankings[player]);
    
    if (!allSubmitted) {
        alert('Not all players have submitted their rankings yet.');
        return;
    }

    // Run snake draft
    gameState.teams = {};
    gameState.players.forEach(player => {
        gameState.teams[player] = { men: [], women: [] };
    });

    // Randomize player order
    const draftOrder = [...gameState.players].sort(() => Math.random() - 0.5);

    // Draft men (3 per player)
    snakeDraft(draftOrder, 'men', 3);

    // Draft women (3 per player)
    snakeDraft(draftOrder, 'women', 3);

    gameState.draftComplete = true;

    try {
        // Save draft results to database
        await fetch(`${API_BASE}/api/draft?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ teams: gameState.teams })
        });

        // Display draft results
        displayDraftResults();
        document.getElementById('draft-status').innerHTML = '<p style="color: green; font-weight: bold;">✓ Draft completed successfully!</p>';
        showPage('draft-page');
    } catch (error) {
        console.error('Error saving draft:', error);
        alert('Error saving draft results. Please try again.');
    }
}

function snakeDraft(draftOrder, gender, perPlayer) {
    const numRounds = perPlayer;
    let reverse = false;

    for (let round = 0; round < numRounds; round++) {
        const order = reverse ? [...draftOrder].reverse() : [...draftOrder];
        
        order.forEach(player => {
            // Get player's rankings for this gender
            const rankings = gameState.rankings[player][gender];
            
            // Find highest ranked available athlete
            for (let athlete of rankings) {
                const isAvailable = !Object.values(gameState.teams).some(team => 
                    team[gender].some(a => a.id === athlete.id)
                );
                
                if (isAvailable) {
                    gameState.teams[player][gender].push(athlete);
                    break;
                }
            }
        });
        
        reverse = !reverse;
    }
}

function displayDraftResults() {
    const container = document.getElementById('draft-results');
    container.innerHTML = '';

    Object.entries(gameState.teams).forEach(([player, team]) => {
        const card = createTeamCard(player, team);
        container.appendChild(card);
    });
}

// Helper function to format split labels for display
function formatSplitLabel(splitName) {
    const splitLabels = {
        '5k': '5K',
        '10k': '10K',
        'half': 'Half Marathon',
        '30k': '30K',
        '35k': '35K',
        '40k': '40K'
    };
    
    return splitLabels[splitName] || (splitName ? splitName.toUpperCase() : 'recent split');
}

// Display leaderboard with team rankings
async function displayLeaderboard() {
    const container = document.getElementById('leaderboard-display');
    container.innerHTML = '<div class="loading-spinner">Loading leaderboard...</div>';

    try {
        // Fetch standings from API (single optimized call)
        // The API will return hasResults flag if no results exist
        const response = await fetch(`${API_BASE}/api/standings?gameId=${GAME_ID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch standings');
        }
        
        const data = await response.json();
        
        // Check if results exist via API response
        if (data.hasResults === false) {
            container.innerHTML = '<p>No race results available yet. Check back once the race begins!</p>';
            return;
        }
        
        const standings = data.standings || [];
        const isTemporary = data.isTemporary || false;
        const hasFinishTimes = data.hasFinishTimes || false;
        const projectionInfo = data.projectionInfo || null;
        
        if (standings.length === 0) {
            container.innerHTML = '<p>No standings available yet.</p>';
            return;
        }

        // Find current player's rank
        const currentPlayerCode = anonymousSession.playerCode || gameState.currentPlayer || anonymousSession.teamName;
        const currentPlayerStanding = standings.find(s => s.player_code === currentPlayerCode);
        const currentPlayerRank = currentPlayerStanding ? currentPlayerStanding.rank : null;

        // Build leaderboard HTML
        let leaderboardHTML = '<div class="leaderboard-container">';
        
        // Determine banner state
        // Case 1: Race finished with finish times, but not yet finalized (manual review)
        // Case 2: Live projections based on splits (race in progress)
        const raceFinishedNotFinalized = hasFinishTimes && !gameState.resultsFinalized && standings.length > 0;
        
        if (raceFinishedNotFinalized) {
            // Show manual review banner
            leaderboardHTML += `
                <div class="temporary-scores-banner review-state">
                    <span class="banner-icon">⏳</span>
                    <div class="banner-content">
                        <strong>Race Finished - Results Being Manually Reviewed</strong>
                        <span class="banner-detail">This could take a while. Check back tomorrow for final official results.</span>
                    </div>
                </div>
            `;
        } else if (isTemporary && projectionInfo) {
            // Show live projections banner
            const splitLabel = formatSplitLabel(projectionInfo.mostCommonSplit);
            leaderboardHTML += `
                <div class="temporary-scores-banner">
                    <span class="banner-icon">⚡</span>
                    <div class="banner-content">
                        <strong>Live Projections</strong>
                        <span class="banner-detail">Based on ${splitLabel} times • Scores will update as race progresses</span>
                    </div>
                </div>
            `;
        }
        
        // Show ALL teams with sticky behavior for current player
        standings.forEach((standing, index) => {
            const isCurrentPlayer = standing.player_code === currentPlayerCode;
            leaderboardHTML += createLeaderboardRow(standing, isCurrentPlayer);
        });
        
        leaderboardHTML += '</div>';
        
        container.innerHTML = leaderboardHTML;
        
        // Initialize bidirectional sticky behavior for highlighted row
        initLeaderboardStickyBehavior();
        
        // If showing temporary scores, set up auto-refresh
        if (isTemporary) {
            setupLeaderboardAutoRefresh();
        }
        
    } catch (error) {
        console.error('Error displaying leaderboard:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Unable to load leaderboard</p>
                <p style="font-size: 0.9em; color: var(--dark-gray);">${error.message}</p>
                <button onclick="displayLeaderboard()" class="btn btn-secondary">Try Again</button>
            </div>
        `;
    }
}

// Initialize bidirectional sticky behavior for leaderboard highlight
function initLeaderboardStickyBehavior() {
    const highlightedRow = document.querySelector('.leaderboard-row-highlight');
    if (!highlightedRow) return; // No highlighted row
    
    // Remove any existing listeners to prevent memory leaks
    if (leaderboardStickyCleanup) {
        leaderboardStickyCleanup();
        leaderboardStickyCleanup = null;
    }
    
    // Track current sticky state to avoid unnecessary DOM updates
    let currentStickyMode = null; // 'top', 'bottom', or null
    
    // Calculate the natural position of the highlighted row
    function updateStickyBehavior() {
        // Check if element still exists
        if (!highlightedRow.isConnected) return;
        
        // Temporarily remove sticky classes to get true natural dimensions
        const wasTop = highlightedRow.classList.contains('sticky-top');
        const wasBottom = highlightedRow.classList.contains('sticky-bottom');
        if (wasTop || wasBottom) {
            highlightedRow.classList.remove('sticky-top', 'sticky-bottom');
        }
        
        // Get natural dimensions and position
        const rowNaturalTop = highlightedRow.offsetTop;
        const rowNaturalHeight = highlightedRow.offsetHeight;
        
        // Restore previous state temporarily for consistent measurements
        if (wasTop) highlightedRow.classList.add('sticky-top');
        if (wasBottom) highlightedRow.classList.add('sticky-bottom');
        
        const viewportHeight = window.innerHeight;
        const scrollTop = window.scrollY;
        
        // Header offset (accounting for page header)
        const headerOffset = 80;
        const bottomOffset = 20;
        
        // Calculate viewport boundaries
        const viewportTop = scrollTop + headerOffset;
        const viewportBottom = scrollTop + viewportHeight - bottomOffset;
        
        // Determine what sticky mode should be active
        let newStickyMode = null;
        if (rowNaturalTop < viewportTop) {
            newStickyMode = 'top';
        } else if (rowNaturalTop + rowNaturalHeight > viewportBottom) {
            newStickyMode = 'bottom';
        }
        
        // Only update DOM if sticky mode changed
        if (newStickyMode !== currentStickyMode) {
            highlightedRow.classList.remove('sticky-top', 'sticky-bottom');
            if (newStickyMode === 'top') {
                highlightedRow.classList.add('sticky-top');
            } else if (newStickyMode === 'bottom') {
                highlightedRow.classList.add('sticky-bottom');
            }
            currentStickyMode = newStickyMode;
        }
    }
    
    // Update on scroll with requestAnimationFrame throttling
    let ticking = false;
    function onScroll() {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(() => {
                try {
                    if (highlightedRow.isConnected) {
                        updateStickyBehavior();
                    }
                } finally {
                    ticking = false;
                }
            });
        }
    }
    
    function onResize() {
        if (highlightedRow.isConnected) {
            currentStickyMode = null; // Force recalculation on resize
            updateStickyBehavior();
        }
    }
    
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    
    // Store cleanup function to prevent memory leaks
    leaderboardStickyCleanup = () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onResize);
    };
    
    // Initial update
    updateStickyBehavior();
}

// Create a single leaderboard row
function createLeaderboardRow(standing, isCurrentPlayer = false) {
    const rank = standing.rank;
    const displayRank = rank <= 3 ? '' : `#${rank}`; // Don't show number for medal positions
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    
    const rowClass = isCurrentPlayer ? 'leaderboard-row leaderboard-row-highlight' : 'leaderboard-row';
    
    // Stats summary
    const stats = `${standing.wins} wins, ${standing.top3} top-3`;
    
    return `
        <div class="${rowClass}" data-player-code="${escapeHtml(standing.player_code)}" onclick="viewTeamDetails('${escapeHtml(standing.player_code)}')">
            <div class="leaderboard-rank-section">
                <span class="rank-medal">${medal}</span>
                <span class="rank-number">${displayRank}</span>
            </div>
            <div class="leaderboard-team-section">
                <div class="leaderboard-team-name">${escapeHtml(standing.player_code)}</div>
                <div class="leaderboard-team-stats">${stats}</div>
            </div>
            <div class="leaderboard-score-section">
                <div class="leaderboard-total-points">${standing.total_points}</div>
                <div class="leaderboard-points-label">pts</div>
            </div>
        </div>
    `;
}

// Auto-refresh leaderboard during live race with temporary scoring
let leaderboardRefreshInterval = null;

function setupLeaderboardAutoRefresh() {
    // Clear any existing refresh interval
    if (leaderboardRefreshInterval) {
        clearInterval(leaderboardRefreshInterval);
        leaderboardRefreshInterval = null;
    }
    
    // Set up auto-refresh every 30 seconds during live race
    leaderboardRefreshInterval = setInterval(async () => {
        try {
            // Only refresh if we're still on the leaderboard page
            const leaderboardPage = document.getElementById('leaderboard-page');
            if (leaderboardPage && leaderboardPage.classList.contains('active')) {
                await displayLeaderboard();
            } else {
                // Stop refreshing if we navigated away
                clearInterval(leaderboardRefreshInterval);
                leaderboardRefreshInterval = null;
            }
        } catch (error) {
            console.error('Error during auto-refresh:', error);
        }
    }, 30000); // Refresh every 30 seconds
}

// Display race results (actual athlete performance)
async function displayRaceResultsLeaderboard() {
    console.log('🔥 displayRaceResultsLeaderboard v2.0 called');
    const container = document.getElementById('race-results-display');
    container.innerHTML = '<div class="loading-spinner">Loading race results...</div>';

    try {
        // Ensure athletes are loaded
        if (!gameState.athletes || !gameState.athletes.men || !gameState.athletes.women) {
            console.log('Athletes not loaded, loading now...');
            await loadAthletes();
            console.log('After loadAthletes, gameState.athletes:', gameState.athletes);
        }
        
        // Double-check athletes loaded successfully
        if (!gameState.athletes || !gameState.athletes.men || !gameState.athletes.women) {
            console.error('Athletes still not loaded after loadAthletes()');
            throw new Error('Athletes data failed to load. Please refresh the page and try again.');
        }
        
        console.log(`Athletes loaded: ${gameState.athletes.men.length} men, ${gameState.athletes.women.length} women`);
        
        // Fetch race results with caching
        const resultsData = await fetchResultsCached();
        console.log('Results data:', resultsData);
        const scoredResults = resultsData.scored || [];
        
        if (scoredResults.length === 0) {
            container.innerHTML = '<p>No race results available yet. Check back once the race begins!</p>';
            return;
        }

        // Create a map of athletes by ID for faster lookup
        const athletesById = new Map();
        gameState.athletes.men.forEach(a => athletesById.set(a.id, { ...a, gender: a.gender || 'men' }));
        gameState.athletes.women.forEach(a => athletesById.set(a.id, { ...a, gender: a.gender || 'women' }));

        // Merge in fallback athlete info from results API to cover athletes not in local cache
        scoredResults.forEach(result => {
            const existing = athletesById.get(result.athlete_id);
            const merged = {
                id: result.athlete_id,
                name: result.athlete_name || existing?.name || `Athlete #${result.athlete_id}`,
                gender: (existing?.gender || result.gender || 'unknown').toLowerCase(),
                country: result.country || existing?.country || '--',
                pb: result.personal_best || existing?.pb || existing?.personal_best,
                personal_best: result.personal_best || existing?.personal_best,
                headshotUrl: result.headshot_url || existing?.headshotUrl || existing?.headshot_url,
                headshot_url: result.headshot_url || existing?.headshot_url || existing?.headshotUrl
            };

            // Preserve any additional fields already stored (e.g., rankings)
            athletesById.set(result.athlete_id, existing ? { ...existing, ...merged } : merged);
        });
        
        // Store data for filtering
        window.raceResultsData = {
            scoredResults,
            athletesById,
            menResults: scoredResults.filter(r => {
                const athlete = athletesById.get(r.athlete_id);
                return athlete && athlete.gender === 'men';
            }).sort((a, b) => (a.placement || 999) - (b.placement || 999)),
            womenResults: scoredResults.filter(r => {
                const athlete = athletesById.get(r.athlete_id);
                return athlete && athlete.gender === 'women';
            }).sort((a, b) => (a.placement || 999) - (b.placement || 999))
        };

        // Initial render with men's results and finish time
        renderFilteredRaceResults('men', 'finish');
        
        // Set up event listeners for controls
        setupRaceResultsControls();
        
    } catch (error) {
        console.error('Error displaying leaderboard race results:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Unable to load race results</p>
                <p style="font-size: 0.9em; color: var(--dark-gray);">${error.message}</p>
                <button onclick="displayRaceResultsLeaderboard()" class="btn btn-secondary">Try Again</button>
            </div>
        `;
    }
}

// Setup event listeners for race results controls
function setupRaceResultsControls() {
    // Gender toggle buttons
    const genderButtons = document.querySelectorAll('.gender-toggle-btn');
    genderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            genderButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');
            
            // Get current split selection
            const splitSelect = document.getElementById('split-select');
            const currentSplit = splitSelect ? splitSelect.value : 'finish';
            
            // Re-render with selected gender
            renderFilteredRaceResults(btn.dataset.gender, currentSplit);
        });
    });
    
    // Split selector dropdown
    const splitSelect = document.getElementById('split-select');
    if (splitSelect) {
        splitSelect.addEventListener('change', () => {
            // Get current gender selection
            const activeGenderBtn = document.querySelector('.gender-toggle-btn.active');
            const currentGender = activeGenderBtn ? activeGenderBtn.dataset.gender : 'men';
            
            // Re-render with selected split
            renderFilteredRaceResults(currentGender, splitSelect.value);
        });
    }
}

// Render filtered race results based on gender and split
function renderFilteredRaceResults(gender, splitType) {
    const container = document.getElementById('race-results-display');
    
    if (!window.raceResultsData) {
        container.innerHTML = '<p>No race results data available</p>';
        return;
    }
    
    const { menResults, womenResults, athletesById } = window.raceResultsData;
    const results = gender === 'men' ? menResults : womenResults;
    const genderLabel = gender === 'men' ? 'Men' : 'Women';
    
    if (results.length === 0) {
        container.innerHTML = `<p>No ${genderLabel.toLowerCase()}'s results available yet.</p>`;
        return;
    }
    
    // Build race results HTML
    let resultsHTML = '<div class="race-results-container">';
    resultsHTML += '<div class="race-gender-section">';
    resultsHTML += `<h3 class="gender-header">${genderLabel}'s Results</h3>`;
    resultsHTML += '<div class="race-results-list">';
    
    results.forEach(result => {
        const athlete = athletesById.get(result.athlete_id);
        if (athlete) {
            resultsHTML += createRaceResultRow(result, athlete, splitType);
        }
    });
    
    resultsHTML += '</div></div></div>';
    container.innerHTML = resultsHTML;
}

// Helper: Round time to nearest second (for display)
function roundTimeToSecond(timeStr) {
    if (!timeStr || timeStr === 'DNF' || timeStr === 'DNS' || timeStr === 'N/A') {
        return timeStr;
    }
    
    // Parse time string (H:MM:SS or H:MM:SS.mmm)
    const parts = timeStr.split(':');
    if (parts.length !== 3) return timeStr;
    
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsWithDecimal = parseFloat(parts[2]);
    
    // Round to nearest second
    const roundedSeconds = Math.round(secondsWithDecimal);
    
    // Handle 60 seconds case (round up to next minute)
    if (roundedSeconds >= 60) {
        const newMinutes = minutes + 1;
        if (newMinutes >= 60) {
            return `${hours + 1}:00:00`;
        }
        return `${hours}:${newMinutes.toString().padStart(2, '0')}:00`;
    }
    
    return `${hours}:${minutes.toString().padStart(2, '0')}:${roundedSeconds.toString().padStart(2, '0')}`;
}

// Helper: Format time gap with sub-second precision
function formatTimeGap(gapSeconds) {
    if (gapSeconds <= 0) return '';
    
    const minutes = Math.floor(gapSeconds / 60);
    const seconds = gapSeconds % 60;
    
    // Show sub-second precision if gap is less than 1 second
    if (gapSeconds < 1) {
        return `+0:00.${Math.round(seconds * 100).toString().padStart(2, '0')}`;
    }
    
    // Show decimal seconds if there's a fractional part
    const wholeSec = Math.floor(seconds);
    const decimal = seconds - wholeSec;
    
    if (decimal > 0) {
        const decimalStr = Math.round(decimal * 100).toString().padStart(2, '0');
        return `+${minutes}:${wholeSec.toString().padStart(2, '0')}.${decimalStr}`;
    }
    
    // No decimals needed
    return `+${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper: Format milliseconds to H:MM:SS format
function formatTimeFromMs(ms) {
    if (!ms || ms <= 0) return '0:00:00';
    
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Helper: Convert pace from ms per meter to min/mile format
function formatPacePerMile(msPerMeter) {
    if (!msPerMeter || msPerMeter <= 0) return 'N/A';
    
    // 1 mile = 1609.34 meters
    const msPerMile = msPerMeter * 1609.34;
    const totalSeconds = Math.floor(msPerMile / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
}

// Create a single race result row
function createRaceResultRow(result, athlete, splitType = 'finish') {
    const placement = result.placement || '-';
    const points = result.total_points || 0;
    const medal = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '';
    
    // Detect DNS (Did Not Start) - no finish time AND no splits at all
    const hasSomeSplits = result.split_5k || result.split_10k || result.split_half || 
                          result.split_30k || result.split_35k || result.split_40k;
    const isDNS = !result.finish_time && !hasSomeSplits;
    const isDNF = !result.finish_time && hasSomeSplits;
    
    // Determine which time to display based on splitType
    let displayTime = 'N/A';
    let timeLabel = 'Finish';
    
    switch(splitType) {
        case 'finish':
            if (isDNS) {
                displayTime = 'DNS';
            } else if (isDNF) {
                displayTime = 'DNF';
            } else {
                displayTime = result.finish_time || 'N/A';
                // Round finish time to nearest second for display
                if (displayTime !== 'N/A') {
                    displayTime = roundTimeToSecond(displayTime);
                }
            }
            timeLabel = 'Finish';
            break;
        case '5k':
            displayTime = result.split_5k || 'N/A';
            timeLabel = '5K';
            break;
        case '10k':
            displayTime = result.split_10k || 'N/A';
            timeLabel = '10K';
            break;
        case 'half':
            displayTime = result.split_half || 'N/A';
            timeLabel = 'Half';
            break;
        case '30k':
            displayTime = result.split_30k || 'N/A';
            timeLabel = '30K';
            break;
        case '35k':
            displayTime = result.split_35k || 'N/A';
            timeLabel = '35K';
            break;
        case '40k':
            displayTime = result.split_40k || 'N/A';
            timeLabel = '40K';
            break;
    }
    
    // Calculate gap from winner if available (only for finish time)
    let gapFromFirst = '';
    if (splitType === 'finish' && result.breakdown && result.breakdown.time_gap) {
        const gapSeconds = result.breakdown.time_gap.gap_seconds || 0;
        if (gapSeconds > 0) {
            gapFromFirst = formatTimeGap(gapSeconds);
        }
    }

    // Points breakdown shorthand
    let shorthand = '-';
    if (result.breakdown) {
        const parts = [];
        if (result.breakdown.placement && result.breakdown.placement.points > 0) {
            parts.push(`P${result.breakdown.placement.points}`);
        }
        if (result.breakdown.time_gap && result.breakdown.time_gap.points > 0) {
            parts.push(`G${result.breakdown.time_gap.points}`);
        }
        const perfBonus = result.breakdown.performance_bonuses?.reduce((sum, b) => sum + b.points, 0) || 0;
        const recBonus = result.breakdown.record_bonuses?.reduce((sum, b) => sum + b.points, 0) || 0;
        const totalBonus = perfBonus + recBonus;
        if (totalBonus > 0) {
            parts.push(`B${totalBonus}`);
        }
        shorthand = parts.length > 0 ? parts.join('+') : '-';
    }

    const headshotUrl = athlete.headshot_url || athlete.headshotUrl;
    const fallbackImg = getRunnerSvg((athlete.gender || 'men').toLowerCase());
    const countryCode = (athlete.country || '').toUpperCase();
    const personalBest = athlete.pb || athlete.personal_best || athlete.personalBest || '';
    
    // Add status class for styling
    const statusClass = isDNS ? 'status-dns' : isDNF ? 'status-dnf' : '';
    
    // Combine athlete and result data for modal
    const combinedData = {
        ...athlete,
        ...result,
        athlete_id: result.athlete_id || athlete.id,
        id: athlete.id
    };

    return `
        <div class="race-result-row ${statusClass}" onclick="openAthleteScoringModal(${JSON.stringify(combinedData).replace(/"/g, '&quot;')})">
            <div class="race-result-placement">
                ${medal ? `<span class="placement-medal">${medal}</span>` : `<span class="placement-number">#${placement}</span>`}
            </div>
            <div class="race-result-athlete">
                <img src="${headshotUrl || fallbackImg}" alt="${escapeHtml(athlete.name)}" class="race-result-headshot" onerror="this.onerror=null; this.src='${fallbackImg}';" />
                <div class="athlete-details">
                    <div class="athlete-name">${escapeHtml(athlete.name)}</div>
                    <div class="athlete-meta">
                        <span class="athlete-country">${getCountryFlagEmoji(countryCode)} ${countryCode || 'N/A'}</span>
                        ${personalBest ? `<span class="athlete-pb">PB: ${personalBest}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="race-result-performance">
                <div class="finish-time ${isDNS || isDNF ? 'status-label' : ''}">${displayTime}</div>
                ${gapFromFirst ? `<div class="time-gap">${gapFromFirst}</div>` : (splitType !== 'finish' ? `<div class="time-gap">${timeLabel} Split</div>` : '')}
            </div>
            <div class="race-result-points">
                <div class="points-value">${points} pts</div>
                <div class="points-breakdown">${shorthand}</div>
            </div>
        </div>
    `;
}

function displayTeams() {
    const container = document.getElementById('teams-display');
    container.innerHTML = '';

    if (!gameState.draftComplete) {
        container.innerHTML = '<p>Draft has not been completed yet.</p>';
        return;
    }

    // Add live results notice if results exist but not finalized
    if (Object.keys(gameState.results).length > 0 && !gameState.resultsFinalized) {
        const notice = document.createElement('div');
        notice.style.cssText = 'background: var(--warning-bg); color: var(--warning-text); padding: 8px 12px; border-radius: 5px; margin-bottom: 15px; text-align: center; font-size: 0.85em; border-left: 3px solid var(--warning-yellow);';
        notice.innerHTML = '⚡ <strong>Live Results:</strong> Refresh to see updates';
        container.appendChild(notice);
    }

    Object.entries(gameState.teams).forEach(([player, team]) => {
        const card = createTeamCard(player, team, true);
        container.appendChild(card);
    });
}

// Helper function to get country flag emoji
function getCountryFlag(countryCode) {
    // Generate flag emoji from country code using Unicode Regional Indicator symbols
    // Regional Indicators: A = U+1F1E6, B = U+1F1E7, ... Z = U+1F1FF
    const getFlag = (code) => {
        if (!code || code.length < 2) return '\u{1F3C1}'; // checkered flag
        
        // Map country codes to ISO 3166-1 alpha-2 codes
        const isoMap = {
            'AUS': 'AU', 'CAN': 'CA', 'ERI': 'ER', 'ETH': 'ET',
            'FRA': 'FR', 'GBR': 'GB', 'IRE': 'IE', 'ITA': 'IT',
            'JPN': 'JP', 'KEN': 'KE', 'MEX': 'MX', 'NED': 'NL',
            'NOR': 'NO', 'SUI': 'CH', 'TAN': 'TZ', 'USA': 'US',
            // Legacy codes
            'BEL': 'BE', 'UGA': 'UG', 'MAR': 'MA', 'CHN': 'CN',
            'ARG': 'AR', 'ESP': 'ES'
        };
        
        const iso = isoMap[code];
        if (!iso) return '\u{1F3C1}'; // checkered flag
        
        // Convert ISO code to Regional Indicator symbols
        // A = U+1F1E6, B = U+1F1E7, etc.
        const codePoints = iso.split('').map(char => 
            0x1F1E6 + char.charCodeAt(0) - 65
        );
        
        return String.fromCodePoint(...codePoints);
    };
    
    return getFlag(countryCode);
}

// Helper function to enrich athlete data with current information from athletes.json
function enrichAthleteData(athlete, gender) {
    // Find the current athlete data from gameState.athletes
    const currentData = gameState.athletes[gender]?.find(a => a.id === athlete.id);
    // Merge the saved athlete data with current data, prioritizing current data
    return currentData ? { ...athlete, ...currentData } : athlete;
}

// Helper function to create headshot element
function createHeadshotElement(athlete, className) {
    // Don't create headshot for missing URLs or default placeholders
    if (!athlete.headshotUrl || 
        athlete.headshotUrl.includes('default.jpg') || 
        athlete.headshotUrl.includes('placeholder')) {
        return null;
    }
    
    const headshotDiv = document.createElement('div');
    headshotDiv.className = className;
    const img = document.createElement('img');
    img.src = athlete.headshotUrl;
    img.alt = athlete.name;
    img.onerror = function() {
        // Hide the entire headshot container if image fails to load
        headshotDiv.style.display = 'none';
    };
    headshotDiv.appendChild(img);
    return headshotDiv;
}

// Helper function to format athlete details
function formatAthleteDetails(athlete, includePersonalBest = false) {
    let detailsParts = [];
    if (includePersonalBest) detailsParts.push(`PB: ${athlete.pb}`);
    
    // Add World Athletics rankings if available
    if (athlete.marathonRank) {
        detailsParts.push(`Marathon #${athlete.marathonRank}`);
    }
    // Show road running rank if available (even if marathon rank exists)
    if (athlete.roadRunningRank) {
        detailsParts.push(`Road #${athlete.roadRunningRank}`);
    }
    
    // Legacy fields (for backward compatibility)
    if (athlete.age) detailsParts.push(`Age: ${athlete.age}`);
    if (athlete.sponsor) detailsParts.push(athlete.sponsor);
    if (athlete.worldRanking) detailsParts.push(`${includePersonalBest ? '#' : 'Rank: #'}${athlete.worldRanking}`);
    
    return detailsParts.join(' • ');
}

// Helper function to generate team initials
function getTeamInitials(teamName) {
    if (!teamName) return 'T';
    
    const words = teamName.trim().split(/\s+/);
    let initials = '';
    
    if (words.length === 1) {
        // Single word: take first 2 letters
        initials = words[0].substring(0, 2).toUpperCase();
    } else {
        // Multiple words: take first letter of first 2 words
        initials = words.slice(0, 2).map(w => w[0]).join('').toUpperCase();
    }
    
    return initials;
}

// Helper function to create SVG avatar placeholder
function createTeamAvatarSVG(teamName, size = 48) {
    const initials = getTeamInitials(teamName);
    
    // Generate a consistent color based on the team name
    const hashCode = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return hash;
    };
    
    // Use the team name or a default to generate consistent color
    const hue = Math.abs(hashCode(teamName || 'DefaultTeam')) % 360;
    const saturation = 65;
    const lightness = 55;
    
    const svgNS = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("width", size);
    svg.setAttribute("height", size);
    svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
    svg.style.borderRadius = "50%";
    svg.style.flexShrink = "0";
    svg.style.border = "3px solid white";
    svg.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
    
    // Background circle
    const circle = document.createElementNS(svgNS, "circle");
    circle.setAttribute("cx", size / 2);
    circle.setAttribute("cy", size / 2);
    circle.setAttribute("r", size / 2);
    circle.setAttribute("fill", `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    svg.appendChild(circle);
    
    // Text (initials)
    const text = document.createElementNS(svgNS, "text");
    text.setAttribute("x", "50%");
    text.setAttribute("y", "50%");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "white");
    text.setAttribute("font-size", size * 0.4);
    text.setAttribute("font-weight", "bold");
    text.setAttribute("font-family", "system-ui, -apple-system, sans-serif");
    text.textContent = initials;
    svg.appendChild(text);
    
    return svg;
}

function createTeamCard(player, team, showScore = false) {
    const card = document.createElement('div');
    card.className = 'team-card';

    // Create team header with avatar, team name, and player code
    const header = document.createElement('div');
    header.className = 'team-card-header';
    
    // Create avatar
    const displayName = team.displayName || player;
    const avatar = createTeamAvatarSVG(displayName, 48);
    avatar.className = 'team-card-avatar';
    header.appendChild(avatar);
    
    // Create team info section
    const teamInfo = document.createElement('div');
    teamInfo.className = 'team-card-info';
    
    // Team name (display name if available)
    const teamNameDiv = document.createElement('div');
    teamNameDiv.className = 'team-card-name';
    teamNameDiv.textContent = displayName;
    teamInfo.appendChild(teamNameDiv);
    
    // Player code (if different from display name)
    if (team.displayName && team.displayName !== player) {
        const playerCodeDiv = document.createElement('div');
        playerCodeDiv.className = 'team-card-player-code';
        playerCodeDiv.textContent = `Player: ${player}`;
        teamInfo.appendChild(playerCodeDiv);
    }
    
    header.appendChild(teamInfo);
    card.appendChild(header);

    // Show score/ranking at the top if results are available
    if (showScore && Object.keys(gameState.results).length > 0) {
        // Try to fetch points-based standings
        fetchScoringDetails().then(scoringResults => {
            if (scoringResults && scoringResults.length > 0) {
                // Calculate total points for this player's team
                const teamAthleteIds = [...team.men, ...team.women].map(a => a.id);
                const teamPoints = scoringResults
                    .filter(r => teamAthleteIds.includes(r.athlete_id))
                    .reduce((sum, r) => sum + (r.total_points || 0), 0);
                
                // Get all team points for ranking
                const allTeamPoints = {};
                Object.entries(gameState.teams).forEach(([p, t]) => {
                    const athleteIds = [...t.men, ...t.women].map(a => a.id);
                    allTeamPoints[p] = scoringResults
                        .filter(r => athleteIds.includes(r.athlete_id))
                        .reduce((sum, r) => sum + (r.total_points || 0), 0);
                });
                
                const sortedTeams = Object.entries(allTeamPoints).sort((a, b) => b[1] - a[1]);
                const rank = sortedTeams.findIndex(([p, pts]) => p === player) + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
                
                // Update or create score div
                let scoreDiv = card.querySelector('.score');
                if (!scoreDiv) {
                    scoreDiv = document.createElement('div');
                    scoreDiv.className = 'score';
                    card.insertBefore(scoreDiv, card.children[1]);
                }
                
                scoreDiv.style.fontWeight = rank === 1 ? 'bold' : 'normal';
                scoreDiv.style.color = rank === 1 ? 'var(--primary-red)' : 'inherit';
                scoreDiv.style.marginBottom = '15px';
                scoreDiv.style.padding = '10px';
                scoreDiv.style.background = rank === 1 ? 'rgba(220, 53, 69, 0.1)' : 'var(--light-gray)';
                scoreDiv.style.borderRadius = '5px';
                scoreDiv.innerHTML = `
                    <div style="font-size: 1.2em; margin-bottom: 5px;">
                        ${medal} Rank: #${rank} of ${sortedTeams.length}
                    </div>
                    <div style="color: var(--primary-blue); font-weight: bold; font-size: 1.1em;">
                        Total Points: ${teamPoints}
                    </div>
                    <div style="font-size: 0.9em; color: var(--dark-gray); margin-top: 4px;">
                        Average: ${(teamPoints / teamAthleteIds.length).toFixed(1)} pts/athlete
                    </div>
                `;
            } else {
                // No scoring results yet - show pending message
                let scoreDiv = card.querySelector('.score');
                if (!scoreDiv) {
                    scoreDiv = document.createElement('div');
                    scoreDiv.className = 'score';
                    card.insertBefore(scoreDiv, card.children[1]);
                }
                scoreDiv.style.marginBottom = '15px';
                scoreDiv.style.padding = '10px';
                scoreDiv.style.background = 'var(--light-gray)';
                scoreDiv.style.borderRadius = '5px';
                scoreDiv.innerHTML = '<div style="color: var(--dark-gray);">Awaiting results...</div>';
            }
        }).catch(err => {
            console.error('Error displaying points score:', err);
            // Show error message - no fallback to deprecated scoring
            let scoreDiv = card.querySelector('.score');
            if (!scoreDiv) {
                scoreDiv = document.createElement('div');
                scoreDiv.className = 'score';
                card.insertBefore(scoreDiv, card.children[1]);
            }
            scoreDiv.style.marginBottom = '15px';
            scoreDiv.style.padding = '10px';
            scoreDiv.style.background = 'var(--light-gray)';
            scoreDiv.style.borderRadius = '5px';
            scoreDiv.innerHTML = `
                <div style="color: var(--warning-red);">
                    ⚠️ Unable to load scoring data
                </div>
                <div style="font-size: 0.85em; color: var(--dark-gray); margin-top: 4px;">
                    Please refresh the page
                </div>
            `;
        });
        
        // Show placeholder while loading
        const scoreDiv = document.createElement('div');
        scoreDiv.className = 'score';
        scoreDiv.style.marginBottom = '15px';
        scoreDiv.style.padding = '10px';
        scoreDiv.style.background = 'var(--light-gray)';
        scoreDiv.style.borderRadius = '5px';
        scoreDiv.innerHTML = '<div>Calculating points...</div>';
        card.appendChild(scoreDiv);
    }

    // Men's team
    const menSection = document.createElement('div');
    menSection.className = 'team-section';
    
    const menTitle = document.createElement('h4');
    menTitle.textContent = "Men's Team";
    menSection.appendChild(menTitle);
    
    team.men.forEach(athlete => {
        const enrichedAthlete = enrichAthleteData(athlete, 'men');
        const athleteDiv = createAthleteRow(enrichedAthlete, showScore);
        menSection.appendChild(athleteDiv);
    });
    card.appendChild(menSection);

    // Women's team
    const womenSection = document.createElement('div');
    womenSection.className = 'team-section';
    
    const womenTitle = document.createElement('h4');
    womenTitle.textContent = "Women's Team";
    womenSection.appendChild(womenTitle);
    
    team.women.forEach(athlete => {
        const enrichedAthlete = enrichAthleteData(athlete, 'women');
        const athleteDiv = createAthleteRow(enrichedAthlete, showScore);
        womenSection.appendChild(athleteDiv);
    });
    card.appendChild(womenSection);

    return card;
}

// Create athlete row with points info
function createAthleteRow(enrichedAthlete, showScore) {
    const time = gameState.results[enrichedAthlete.id] || '-';
    const athleteDiv = document.createElement('div');
    athleteDiv.className = 'athlete';
    athleteDiv.dataset.athleteId = enrichedAthlete.id;
    
    // Create headshot container
    const headshot = createHeadshotElement(enrichedAthlete, 'headshot');
    if (headshot) athleteDiv.appendChild(headshot);
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'athlete-info';
    
    const nameDiv = document.createElement('div');
    nameDiv.className = 'name';
    
    // Add World Athletics link if available
    if (enrichedAthlete.worldAthleticsProfileUrl) {
        const link = document.createElement('a');
        link.href = enrichedAthlete.worldAthleticsProfileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = enrichedAthlete.name;
        link.style.color = 'inherit';
        link.title = 'View World Athletics profile';
        nameDiv.appendChild(link);
    } else {
        nameDiv.textContent = enrichedAthlete.name;
    }
    
    const countryDiv = document.createElement('div');
    countryDiv.className = 'country';
    countryDiv.innerHTML = `${getCountryFlag(enrichedAthlete.country)} ${enrichedAthlete.country}`;
    
    const detailsText = formatAthleteDetails(enrichedAthlete);
    if (detailsText) {
        const detailsDiv = document.createElement('div');
        detailsDiv.className = 'details';
        detailsDiv.textContent = detailsText;
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(countryDiv);
        infoDiv.appendChild(detailsDiv);
    } else {
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(countryDiv);
    }
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'time';
    timeDiv.textContent = time;
    
    // Add points info if available and showing score
    if (showScore && time !== '-') {
        fetchScoringDetails().then(scoringResults => {
            const result = scoringResults.find(r => r.athlete_id === enrichedAthlete.id);
            if (result) {
                // Add record badge if applicable
                const badge = getRecordBadge(result.record_type, result.record_status);
                if (badge) {
                    nameDiv.innerHTML += badge;
                }
                
                // Add points to time display
                const pointsSpan = document.createElement('span');
                pointsSpan.style.cssText = 'display: block; font-size: 0.9em; color: var(--primary-blue); font-weight: bold; margin-top: 2px;';
                pointsSpan.textContent = `${result.total_points} pts`;
                pointsSpan.title = 'Click for breakdown';
                pointsSpan.style.cursor = 'pointer';
                
                // Add click handler for breakdown
                pointsSpan.addEventListener('click', () => {
                    showPointsBreakdownModal(enrichedAthlete.name, result);
                });
                
                timeDiv.appendChild(pointsSpan);
            }
        }).catch(err => {
            console.error('Error fetching scoring for athlete:', err);
        });
    }
    
    athleteDiv.appendChild(infoDiv);
    athleteDiv.appendChild(timeDiv);
    
    return athleteDiv;
}

// Show points breakdown in a modal
function showPointsBreakdownModal(athleteName, result) {
    if (!result || !result.breakdown) return;
    
    const breakdown = result.breakdown;
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); display: flex; align-items: center;
        justify-content: center; z-index: 10000; padding: 20px;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white; border-radius: 10px; padding: 20px;
        max-width: 500px; width: 100%; max-height: 80vh; overflow-y: auto;
    `;
    
    let html = `
        <h3 style="margin: 0 0 15px 0; color: var(--primary-blue);">${escapeHtml(athleteName)} - Points Breakdown</h3>
        <div style="border-bottom: 2px solid var(--light-gray); margin-bottom: 15px;"></div>
    `;
    
    // Placement
    if (breakdown.placement && breakdown.placement.points > 0) {
        html += `
            <div style="margin-bottom: 12px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                <div style="font-weight: bold; color: var(--dark-gray);">🏁 Placement</div>
                <div>${getOrdinal(breakdown.placement.position)} place</div>
                <div style="color: var(--primary-blue); font-weight: bold;">+${breakdown.placement.points} points</div>
            </div>
        `;
    }
    
    // Time gap
    if (breakdown.time_gap && breakdown.time_gap.points > 0) {
        html += `
            <div style="margin-bottom: 12px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                <div style="font-weight: bold; color: var(--dark-gray);">⏱️ Time Gap</div>
                <div>${breakdown.time_gap.gap_seconds} seconds behind winner</div>
                <div style="font-size: 0.85em; color: #666;">(Within ${breakdown.time_gap.window?.max_gap_seconds}s window)</div>
                <div style="color: var(--primary-blue); font-weight: bold;">+${breakdown.time_gap.points} points</div>
            </div>
        `;
    }
    
    // Performance bonuses
    if (breakdown.performance_bonuses && breakdown.performance_bonuses.length > 0) {
        breakdown.performance_bonuses.forEach(bonus => {
            const icon = bonus.type === 'NEGATIVE_SPLIT' ? '📈' : 
                        bonus.type === 'EVEN_PACE' ? '⚖️' : '🚀';
            const name = bonus.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            html += `
                <div style="margin-bottom: 12px; padding: 10px; background: #f8f9fa; border-radius: 5px;">
                    <div style="font-weight: bold; color: var(--dark-gray);">${icon} ${name}</div>
                    <div style="color: var(--primary-blue); font-weight: bold;">+${bonus.points} points</div>
                </div>
            `;
        });
    }
    
    // Record bonuses
    if (breakdown.record_bonuses && breakdown.record_bonuses.length > 0) {
        breakdown.record_bonuses.forEach(record => {
            const icon = record.type === 'WORLD_RECORD' ? '🌎' : '🏆';
            const name = record.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const statusText = record.status === 'provisional' ? ' (Provisional - Pending)' : '';
            html += `
                <div style="margin-bottom: 12px; padding: 10px; background: #fff3cd; border-radius: 5px; border: 2px solid #ffc107;">
                    <div style="font-weight: bold; color: var(--dark-gray);">${icon} ${name}${statusText}</div>
                    <div style="color: var(--primary-blue); font-weight: bold;">+${record.points} points</div>
                </div>
            `;
        });
    }
    
    // Total
    html += `
        <div style="margin-top: 15px; padding: 15px; background: var(--primary-blue); color: white; border-radius: 5px; text-align: center;">
            <div style="font-size: 0.9em; opacity: 0.9;">TOTAL POINTS</div>
            <div style="font-size: 2em; font-weight: bold;">${result.total_points}</div>
        </div>
        <button id="close-modal" style="margin-top: 15px; width: 100%; padding: 10px; background: var(--dark-gray); color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 1em;">
            Close
        </button>
    `;
    
    content.innerHTML = html;
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close handlers
    document.getElementById('close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
}

// Results management - Update live results
async function handleUpdateResults() {
    // First, collect all results from the form inputs (in case user hasn't left the field yet)
    const form = document.getElementById('results-form');
    
    // Check if form exists
    if (!form) {
        alert('Please complete the draft first before entering results.');
        return;
    }
    
    const inputs = form.querySelectorAll('input[data-athlete-id]');
    
    console.log('Found', inputs.length, 'input fields');
    
    if (inputs.length === 0) {
        alert('No results form found. Please make sure the draft is complete.');
        return;
    }
    
    // Collect all values from inputs and track invalid ones
    let hasAnyValues = false;
    const invalidFields = [];
    inputs.forEach(input => {
        const athleteId = parseInt(input.dataset.athleteId, 10);
        const time = input.value.trim();
        console.log(`Athlete ${athleteId}: "${time}"`);
        if (time) {
            hasAnyValues = true;
            if (/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/.test(time)) {
                gameState.results[athleteId] = time;
                console.log(`Added result for athlete ${athleteId}: ${time}`);
                // Mark as valid
                input.style.borderColor = '#28a745';
                input.style.backgroundColor = '#d4edda';
            } else {
                console.log(`Invalid format for athlete ${athleteId}: ${time}`);
                // Mark as invalid
                input.style.borderColor = '#dc3545';
                input.style.backgroundColor = '#f8d7da';
                // Get athlete name from label
                const label = input.previousElementSibling;
                if (label) {
                    invalidFields.push(label.textContent + ': "' + time + '"');
                }
            }
        }
    });
    
    console.log('Total results in gameState:', Object.keys(gameState.results).length);

    if (Object.keys(gameState.results).length === 0) {
        if (invalidFields.length > 0) {
            alert('Invalid time format detected. Please use HH:MM:SS or HH:MM:SS.mmm format (e.g., 2:05:30 or 2:05:30.12).\n\nFields with invalid format:\n' + invalidFields.slice(0, 5).join('\n') + (invalidFields.length > 5 ? '\n... and ' + (invalidFields.length - 5) + ' more' : ''));
        } else if (hasAnyValues) {
            alert('Please check the time format. Times should be in HH:MM:SS or HH:MM:SS.mmm format (e.g., 2:05:30 or 2:05:30.12)');
        } else {
            alert('Please enter results first using the form above.');
        }
        return;
    }

    // Update live standings display
    updateLiveStandings();
    
    // Show finalize button
    document.getElementById('finalize-results').style.display = 'inline-block';

    try {
        // Save results to database with auto-scoring
        await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                results: gameState.results,
                autoScore: true  // Trigger scoring engine to calculate points
            })
        });
        
        // Invalidate results cache so players see fresh data
        invalidateResultsCache();
        
        alert('Live results updated! Players can now see the current standings.');
    } catch (error) {
        console.error('Error saving results:', error);
        alert('Error saving results. Please check the console for details.');
    }
}

// Finalize results and crown winner
async function handleFinalizeResults() {
    if (!confirm('Are you sure you want to finalize the results? This will lock all results and show final standings.')) {
        return;
    }

    try {
        // Fetch current standings to get final points
        const response = await fetch(`${API_BASE}/api/standings?gameId=${GAME_ID}`);
        const data = await response.json();
        const standings = data.standings || [];
        
        if (standings.length === 0) {
            alert('No standings available to finalize. Please enter race results first.');
            return;
        }

        // Find winner (highest points wins)
        const winner = standings[0]; // Already sorted by points descending
        
        const display = document.getElementById('winner-display');
        if (display) {
            display.innerHTML = `
                <h3>🏆 Winner: ${winner.player_code}</h3>
                <p>Total Points: ${winner.total_points}</p>
                <hr style="margin: 10px 0; border-color: rgba(255,255,255,0.3);">
                ${standings.map((team, i) => {
                    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                    return `<div>${medal} ${i + 1}. ${team.player_code}: ${team.total_points} pts</div>`;
                }).join('')}
            `;
        }

        // Mark results as finalized in local state
        gameState.resultsFinalized = true;
        
        // Hide the finalize button and update button text (check if elements exist)
        const finalizeBtn = document.getElementById('finalize-results');
        if (finalizeBtn) {
            finalizeBtn.style.display = 'none';
        }
        
        const updateBtn = document.getElementById('update-results');
        if (updateBtn) {
            updateBtn.textContent = 'Results Finalized';
            updateBtn.disabled = true;
        }

        // Save finalized state to database
        await fetch(`${API_BASE}/api/game-state?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                players: gameState.players,
                draftComplete: gameState.draftComplete,
                resultsFinalized: true
            })
        });
        
        // Invalidate results cache after finalizing
        invalidateResultsCache();
        
        alert('Results finalized successfully! Players will now see the final standings and game recap.');
    } catch (error) {
        console.error('Error finalizing results:', error);
        alert('Error finalizing results. Please try again.');
    }
}

// Update live standings display with points-based scoring
async function updateLiveStandings() {
    const display = document.getElementById('live-standings');
    
    if (Object.keys(gameState.results).length === 0) {
        display.innerHTML = '';
        return;
    }

    // Show link to leaderboard instead of full standings list
    display.innerHTML = `
        <div style="margin-top: 20px; padding: 15px; background: var(--light-gray); border-radius: 5px; text-align: center;">
            <p style="margin: 0 0 10px 0; font-weight: 500;">Results have been entered</p>
            <button id="view-leaderboard-from-commissioner" class="btn btn-primary">
                📊 View Full Leaderboard
            </button>
        </div>
    `;
    
    // Add event listener to the button
    const viewLeaderboardBtn = document.getElementById('view-leaderboard-from-commissioner');
    if (viewLeaderboardBtn) {
        viewLeaderboardBtn.addEventListener('click', () => {
            showPage('leaderboard-page');
            loadLeaderboard();
        });
    }
}

// Display points-based standings (Version 2)
function displayPointsStandings(standings, display) {
    if (!standings || standings.length === 0) {
        display.innerHTML = '<p style="color: var(--dark-gray); margin-top: 10px;">No standings available yet.</p>';
        return;
    }

    display.innerHTML = `
        <h4 style="margin-top: 20px;">🏆 Current Standings (Points League)</h4>
        <div style="background: var(--light-gray); padding: 15px; border-radius: 5px; margin-top: 10px; overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                <thead>
                    <tr style="border-bottom: 2px solid var(--dark-gray);">
                        <th style="padding: 8px; text-align: left;">Rank</th>
                        <th style="padding: 8px; text-align: left;">Player</th>
                        <th style="padding: 8px; text-align: center;">Races</th>
                        <th style="padding: 8px; text-align: center;">Wins</th>
                        <th style="padding: 8px; text-align: center;">Top 3</th>
                        <th style="padding: 8px; text-align: center;" title="World Records">WR</th>
                        <th style="padding: 8px; text-align: center;" title="Course Records">CR</th>
                        <th style="padding: 8px; text-align: right;"><strong>Total Points</strong></th>
                        <th style="padding: 8px; text-align: right;">Avg</th>
                    </tr>
                </thead>
                <tbody>
                    ${standings.map((standing, i) => {
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '';
                        const isLeader = i === 0;
                        return `
                            <tr style="border-bottom: 1px solid #ddd; ${isLeader ? 'background: #fff9e6;' : ''}">
                                <td style="padding: 8px; font-weight: ${isLeader ? 'bold' : 'normal'};">${medal}${standing.rank}</td>
                                <td style="padding: 8px; font-weight: ${isLeader ? 'bold' : 'normal'}; color: ${isLeader ? 'var(--primary-red)' : 'inherit'};">${escapeHtml(standing.player_code)}</td>
                                <td style="padding: 8px; text-align: center;">${standing.races_count}</td>
                                <td style="padding: 8px; text-align: center;">${standing.wins || 0}</td>
                                <td style="padding: 8px; text-align: center;">${standing.top3 || 0}</td>
                                <td style="padding: 8px; text-align: center;">${standing.world_records || 0}</td>
                                <td style="padding: 8px; text-align: center;">${standing.course_records || 0}</td>
                                <td style="padding: 8px; text-align: right; font-weight: bold; color: var(--primary-blue);">${standing.total_points}</td>
                                <td style="padding: 8px; text-align: right;">${standing.average_points.toFixed(1)}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// Fetch detailed scoring data for all results
async function fetchScoringDetails() {
    try {
        const response = await fetch(`${API_BASE}/api/scoring?gameId=${GAME_ID}`);
        if (response.ok) {
            const data = await response.json();
            return data.results || [];
        }
    } catch (error) {
        console.error('Error fetching scoring details:', error);
    }
    return [];
}

// Create points breakdown tooltip
function createPointsBreakdown(athleteId, scoringResults) {
    const result = scoringResults.find(r => r.athlete_id === athleteId);
    
    if (!result || !result.breakdown) {
        return null;
    }
    
    const breakdown = result.breakdown;
    const parts = [];
    
    // Placement points
    if (breakdown.placement && breakdown.placement.points > 0) {
        parts.push(`<div><strong>Placement:</strong> ${getOrdinal(breakdown.placement.position)} = +${breakdown.placement.points} pts</div>`);
    }
    
    // Time gap points
    if (breakdown.time_gap && breakdown.time_gap.points > 0) {
        parts.push(`<div><strong>Time Gap:</strong> ${breakdown.time_gap.gap_seconds}s (≤${breakdown.time_gap.window.max_gap_seconds}s) = +${breakdown.time_gap.points} pts</div>`);
    }
    
    // Performance bonuses
    if (breakdown.performance_bonuses && breakdown.performance_bonuses.length > 0) {
        const bonusText = breakdown.performance_bonuses.map(b => {
            const name = b.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return `${name} +${b.points}`;
        }).join(', ');
        parts.push(`<div><strong>Bonuses:</strong> ${bonusText}</div>`);
    }
    
    // Record bonuses
    if (breakdown.record_bonuses && breakdown.record_bonuses.length > 0) {
        breakdown.record_bonuses.forEach(r => {
            const badge = r.type === 'WORLD_RECORD' ? '🌎 WR' : '🏆 CR';
            const statusText = r.status === 'provisional' ? ' (Provisional)' : '';
            parts.push(`<div><strong>${badge}${statusText}:</strong> +${r.points} pts</div>`);
        });
    }
    
    parts.push(`<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #ddd;"><strong>Total:</strong> ${result.total_points} points</div>`);
    
    return `
        <div class="points-breakdown" style="
            background: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 10px;
            font-size: 0.85em;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            max-width: 300px;
        ">
            ${parts.join('')}
        </div>
    `;
}

// Get ordinal suffix for placement
function getOrdinal(n) {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

// Add record badge to athlete display
function getRecordBadge(recordType, recordStatus) {
    if (recordType === 'NONE' || !recordType) {
        return '';
    }
    
    let badge = '';
    let title = '';
    let style = 'padding: 2px 6px; border-radius: 3px; font-size: 0.75em; font-weight: bold; margin-left: 6px;';
    
    if (recordType === 'WORLD' || recordType === 'BOTH') {
        badge = 'WR';
        title = 'World Record';
        style += ' background: gold; color: #333;';
    } else if (recordType === 'COURSE') {
        badge = 'CR';
        title = 'Course Record';
        style += ' background: #2C39A2; color: white;';
    }
    
    if (recordStatus === 'provisional') {
        style += ' border: 2px dashed #666;';
        title += ' (Provisional - Pending Confirmation)';
    }
    
    return `<span style="${style}" title="${title}">${badge}</span>`;
}

function setupResultsForm() {
    const form = document.getElementById('results-form');
    form.innerHTML = '<h4>Enter Athlete Finish Times (HH:MM:SS or HH:MM:SS.mmm)</h4><p style="color: var(--dark-gray); font-size: 0.9em; margin-bottom: 15px;">Format: Hours:Minutes:Seconds (e.g., 2:15:45 or 2:05:30.12 for close finishes)</p>';

    // Get all unique athletes from teams
    const allAthletes = new Set();
    Object.values(gameState.teams).forEach(team => {
        [...team.men, ...team.women].forEach(athlete => {
            allAthletes.add(JSON.stringify(athlete));
        });
    });

    Array.from(allAthletes).map(a => JSON.parse(a)).forEach(athlete => {
        const entry = document.createElement('div');
        entry.className = 'result-entry';
        const currentTime = gameState.results[athlete.id] || '';
        entry.innerHTML = `
            <label>${escapeHtml(athlete.name)} (${escapeHtml(athlete.country)})</label>
            <input type="text" 
                   data-athlete-id="${athlete.id}"
                   value="${escapeHtml(currentTime)}"
                   placeholder="0:14:30 or 2:05:30"
                   pattern="[0-9]{1,2}:[0-9]{2}:[0-9]{2}">
        `;
        form.appendChild(entry);
    });

    // Add event listeners to save results and validate format
    form.querySelectorAll('input').forEach(input => {
        // Real-time validation on input
        input.addEventListener('input', (e) => {
            const time = e.target.value.trim();
            if (time === '') {
                // Empty is valid (not yet entered)
                e.target.style.borderColor = '';
                e.target.style.backgroundColor = '';
                return;
            }
            
            // Check if format is valid (HH:MM:SS or H:MM:SS with optional .mmm decimals)
            if (/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/.test(time)) {
                // Valid format
                e.target.style.borderColor = '#28a745';
                e.target.style.backgroundColor = '#d4edda';
            } else {
                // Invalid format
                e.target.style.borderColor = '#dc3545';
                e.target.style.backgroundColor = '#f8d7da';
            }
        });
        
        // Save on change (when user leaves the field)
        input.addEventListener('change', async (e) => {
            const athleteId = parseInt(e.target.dataset.athleteId, 10);
            const time = e.target.value;
            if (time && /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}(\.[0-9]{1,3})?$/.test(time)) {
                gameState.results[athleteId] = time;
                // Auto-save to database with scoring
                try {
                    await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            results: { [athleteId]: time },
                            autoScore: true  // Trigger scoring engine
                        })
                    });
                    // Update live standings as results are entered
                    updateLiveStandings();
                } catch (error) {
                    console.error('Error saving result:', error);
                }
            }
        });
    });
}

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function handleResetResults() {
    if (!confirm('Are you sure you want to reset live results? This will clear all athlete times but keep teams and draft intact.')) {
        return;
    }

    try {
        // Clear results from database
        await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: {} })
        });

        // Clear resultsFinalized flag
        gameState.resultsFinalized = false;
        await saveGameState();

        // Update local game state
        gameState.results = {};
        
        // Invalidate results cache after reset
        invalidateResultsCache();

        // Clear displayed data
        document.getElementById('live-standings').innerHTML = '';
        document.getElementById('winner-display').innerHTML = '';
        
        // Reset finalize button state
        document.getElementById('finalize-results').style.display = 'none';

        alert('Live results have been reset. You can now enter new times from the Manage Live Results page.');
    } catch (error) {
        console.error('Error resetting results:', error);
        alert('Error resetting results. Please try again.');
    }
}

async function handleResetGame() {
    if (confirm('Are you sure you want to reset the entire game? This will delete ALL data including teams, rosters, rankings, results, and scores. This cannot be undone!')) {
        console.log('[Reset Game] User confirmed complete game reset');
        
        try {
            // Show loading state
            const resetBtn = document.getElementById('reset-game');
            const originalText = resetBtn.textContent;
            resetBtn.textContent = 'Resetting...';
            resetBtn.disabled = true;

            // Call comprehensive reset API endpoint
            const response = await fetch(`${API_BASE}/api/reset-game?gameId=${GAME_ID}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || error.error || 'Reset failed');
            }

            const result = await response.json();
            console.log('[Reset Game] Reset successful:', result);

            // Update local game state to match reset database
            gameState.players = [];
            gameState.currentPlayer = null;
            gameState.rankings = {};
            gameState.teams = {};
            gameState.results = {};
            gameState.draftComplete = false;
            gameState.resultsFinalized = false;

            // Clear localStorage team session (user might have been on a team)
            // Note: Commissioner session is preserved
            localStorage.removeItem(TEAM_SESSION_KEY);
            anonymousSession = { token: null, teamName: null, playerCode: null, ownerName: null, expiresAt: null };

            // Clear any displayed data in commissioner dashboard (with null safety)
            const playerCodesDisplay = document.getElementById('player-codes-display');
            if (playerCodesDisplay) playerCodesDisplay.innerHTML = '';
            
            const draftStatus = document.getElementById('draft-status');
            if (draftStatus) draftStatus.innerHTML = '';
            
            const resultsForm = document.getElementById('results-form');
            if (resultsForm) resultsForm.innerHTML = '';
            
            const winnerDisplay = document.getElementById('winner-display');
            if (winnerDisplay) winnerDisplay.innerHTML = '';
            
            const liveStandings = document.getElementById('live-standings');
            if (liveStandings) liveStandings.innerHTML = '';
            
            // Show success message with details
            alert(`Game reset complete!\n\nDeleted:\n- ${result.deleted.draftTeams} team rosters\n- ${result.deleted.playerRankings} player rankings\n- ${result.deleted.raceResults} race results\n- ${result.deleted.leagueStandings} standings entries\n- ${result.deleted.anonymousSessions} team sessions\n\nAll athlete data has been preserved.`);
            
            // Reload game state from database (force refresh, don't use cache)
            await loadGameStateCached(true);
            
            // Invalidate results cache since we just reset
            invalidateResultsCache();
            
            // Navigate to landing page
            showPage('landing-page');
            
            // Restore button
            resetBtn.textContent = originalText;
            resetBtn.disabled = false;
            
        } catch (error) {
            console.error('[Reset Game] Error resetting game:', error);
            alert(`Error resetting game: ${error.message}\n\nPlease try again or contact support.`);
            
            // Restore button
            const resetBtn = document.getElementById('reset-game');
            resetBtn.textContent = 'Reset Game';
            resetBtn.disabled = false;
        }
    } else {
        console.log('[Reset Game] User cancelled reset');
    }
}

// Handle load demo data
async function handleLoadDemoData() {
    const btn = document.getElementById('load-demo-data');
    const originalText = btn.textContent;
    
    try {
        btn.disabled = true;
        btn.textContent = '⏳ Loading demo data...';
        
        // Get checkbox value for including results
        const includeResults = confirm('Include fake race results?\n\nClick OK to include results, Cancel for teams only.');
        
        const response = await fetch(`${API_BASE}/api/load-demo-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ includeResults })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to load demo data');
        }
        
        const data = await response.json();
        
        // Display results in modal
        displayDemoDataResults(data);
        
        btn.textContent = '✓ Demo data loaded!';
        setTimeout(() => {
            btn.textContent = originalText;
            btn.disabled = false;
        }, 3000);
        
    } catch (error) {
        console.error('Demo data error:', error);
        alert(`Error loading demo data: ${error.message}`);
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Display demo data results in modal
function displayDemoDataResults(data) {
    // Create modal content
    const modal = document.createElement('div');
    modal.id = 'demo-data-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 10px;
        padding: 30px;
        max-width: 900px;
        max-height: 80vh;
        overflow-y: auto;
        width: 100%;
    `;
    
    const stats = data.stats || {};
    
    let html = `
        <h2 style="margin-top: 0;">🎭 Demo Game Created Successfully!</h2>
        <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <strong>Game ID:</strong> ${data.gameId}<br>
            <strong>Teams:</strong> ${stats.totalTeams} teams × 6 athletes = ${stats.totalAthletes} roster slots<br>
            <strong>Unique Athletes:</strong> ${stats.uniqueAthletes} (some may be on multiple teams)<br>
            <strong>Salary Cap:</strong> $${(data.salaryCap / 1000).toFixed(0)}K per team<br>
            <strong>Results:</strong> ${data.resultsCreated ? `✅ ${stats.resultsCount} athletes with finish times & splits` : '⏳ Not created (add via commissioner mode)'}
        </div>
        
        <h3 style="margin-top: 20px;">📋 Team Details</h3>
    `;
    
    data.teams.forEach(team => {
        const url = team.sessionUrl;
        const budgetPct = ((team.totalSpent / data.salaryCap) * 100).toFixed(0);
        
        html += `
            <div style="border: 2px solid #2C39A2; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <div>
                        <h3 style="margin: 0; color: #2C39A2;">${team.teamName}</h3>
                        <div style="color: #666; font-size: 0.9em; margin-top: 5px;">${team.strategy}</div>
                    </div>
                    <div style="text-align: right; font-size: 0.9em;">
                        <div><strong>Spent:</strong> $${(team.totalSpent / 1000).toFixed(1)}K (${budgetPct}%)</div>
                        <div style="color: #28a745;"><strong>Left:</strong> $${(team.remaining / 1000).toFixed(1)}K</div>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Session URL:</strong>
                    <div style="display: flex; gap: 10px; align-items: center; margin-top: 5px;">
                        <input 
                            type="text" 
                            value="${url}" 
                            readonly 
                            style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px; font-family: monospace;"
                        />
                        <button 
                            onclick="navigator.clipboard.writeText('${url}'); this.textContent = '✓ Copied'; setTimeout(() => this.textContent = 'Copy', 2000);"
                            style="padding: 8px 16px; background: #2C39A2; color: white; border: none; border-radius: 4px; cursor: pointer; white-space: nowrap;"
                        >
                            Copy
                        </button>
                    </div>
                </div>
                
                <div>
                    <strong>Roster (${team.athletes.length} athletes):</strong>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; margin-top: 8px; font-size: 0.9em;">
                        ${team.athletes.map(a => `
                            <div style="padding: 5px; background: ${a.gender === 'men' ? '#e3f2fd' : '#fce4ec'}; border-radius: 4px;">
                                <strong>${a.name}</strong> (${a.country})<br>
                                <span style="color: #666;">
                                    ${a.gender === 'men' ? '👨' : '👩'} 
                                    $${(a.salary / 1000).toFixed(1)}K
                                    ${a.marathonRank ? ` • Rank #${a.marathonRank}` : ''}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    html += `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 0.9em;">
            <strong>📝 Next Steps:</strong>
            <ol style="margin: 10px 0 0 20px; padding: 0;">
                ${data.instructions.map(i => `<li style="margin: 5px 0;">${i}</li>`).join('')}
            </ol>
        </div>
        
        <button 
            onclick="document.getElementById('demo-data-modal').remove();"
            style="width: 100%; padding: 12px; background: #ff6900; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; margin-top: 20px; font-weight: bold;"
        >
            Close
        </button>
    `;
    
    content.innerHTML = html;
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Handle view athletes
async function handleViewAthletes() {
    const container = document.getElementById('athlete-management-container');
    
    // Get filter values
    const confirmedOnly = document.getElementById('filter-confirmed').checked;
    const missingWaIdOnly = document.getElementById('filter-missing-wa-id').checked;
    const genderFilter = document.getElementById('filter-gender').value;
    const sortBy = document.getElementById('sort-athletes').value;
    
    try {
        container.innerHTML = '<p>Loading athletes...</p>';
        
        // Fetch all athletes from API with confirmedOnly parameter
        const response = await fetch(`${API_BASE}/api/athletes?confirmedOnly=${confirmedOnly}`);
        if (!response.ok) throw new Error('Failed to load athletes');
        const athletesData = await response.json();
        
        // Combine men and women
        let allAthletes = [
            ...athletesData.men.map(a => ({...a, gender: 'men'})),
            ...athletesData.women.map(a => ({...a, gender: 'women'}))
        ];
        
        // Apply gender filter
        if (genderFilter !== 'all') {
            allAthletes = allAthletes.filter(a => a.gender === genderFilter);
        }
        
        // Apply missing WA ID filter
        if (missingWaIdOnly) {
            allAthletes = allAthletes.filter(a => !a.worldAthleticsId || a.worldAthleticsId.trim() === '');
        }
        
        // Sort athletes
        allAthletes.sort((a, b) => {
            if (sortBy === 'id') return a.id - b.id;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            if (sortBy === 'marathon_rank') {
                const rankA = a.marathonRank || 9999;
                const rankB = b.marathonRank || 9999;
                return rankA - rankB;
            }
            if (sortBy === 'pb') {
                const pbA = a.pb || '9:99:99';
                const pbB = b.pb || '9:99:99';
                return pbA.localeCompare(pbB);
            }
            return 0;
        });
        
        // Display table
        if (allAthletes.length === 0) {
            container.innerHTML = '<p>No athletes found.</p>';
            return;
        }
        
        const table = document.createElement('table');
        table.className = 'athlete-table';
        table.innerHTML = `
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Country</th>
                    <th>Gender</th>
                    <th>Personal Best</th>
                    <th>Marathon Rank</th>
                    <th>Age</th>
                    <th>World Athletics ID</th>
                    <th>NYC Confirmed</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${allAthletes.map(athlete => `
                    <tr data-athlete-id="${athlete.id}">
                        <td>${athlete.id}</td>
                        <td>
                            <a href="#" class="athlete-name-link" data-athlete-id="${athlete.id}" title="View athlete details">
                                ${athlete.name}
                            </a>
                        </td>
                        <td>${athlete.country}</td>
                        <td>${athlete.gender === 'men' ? 'M' : 'W'}</td>
                        <td>${athlete.pb || 'N/A'}</td>
                        <td>${athlete.marathonRank ? '#' + athlete.marathonRank : 'N/A'}</td>
                        <td>${athlete.age || 'N/A'}</td>
                        <td class="wa-id-cell">
                            <input 
                                type="text" 
                                class="wa-id-input" 
                                data-athlete-id="${athlete.id}"
                                value="${athlete.worldAthleticsId || ''}" 
                                placeholder="Enter WA ID"
                                title="World Athletics ID (e.g., 14208500)"
                            />
                        </td>
                        <td>
                            <button 
                                class="btn-toggle-confirmed btn-small ${athlete.nycConfirmed ? 'btn-success' : 'btn-secondary'}"
                                data-athlete-id="${athlete.id}"
                                data-confirmed="${athlete.nycConfirmed}"
                                title="Click to ${athlete.nycConfirmed ? 'unconfirm' : 'confirm'} for NYC Marathon"
                            >${athlete.nycConfirmed ? '✓ Confirmed' : '✗ Not Confirmed'}</button>
                        </td>
                        <td class="actions-cell">
                            <button 
                                class="btn-save-wa-id btn-small" 
                                data-athlete-id="${athlete.id}"
                                title="Save World Athletics ID"
                            >Save</button>
                            <button 
                                class="btn-sync-athlete btn-small btn-secondary" 
                                data-athlete-id="${athlete.id}"
                                data-athlete-name="${athlete.name}"
                                data-wa-id="${athlete.worldAthleticsId || ''}"
                                title="Sync athlete data from World Athletics"
                                ${!athlete.worldAthleticsId ? 'disabled' : ''}
                            >Sync</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.innerHTML = `
            <p><strong>${allAthletes.length} athlete(s) found</strong></p>
            <div class="table-scroll">
                ${table.outerHTML}
            </div>
        `;
        
        // Add event listeners to athlete name links
        document.querySelectorAll('.athlete-name-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const athleteId = parseInt(e.target.dataset.athleteId, 10);
                const athlete = allAthletes.find(a => a.id === athleteId);
                if (athlete) {
                    openAthleteModal(athlete);
                }
            });
        });
        
        // Add event listeners to save buttons
        document.querySelectorAll('.btn-save-wa-id').forEach(button => {
            button.addEventListener('click', handleSaveWorldAthleticsId);
        });
        
        // Add event listeners to sync buttons
        document.querySelectorAll('.btn-sync-athlete').forEach(button => {
            button.addEventListener('click', handleSyncAthlete);
        });
        
        // Add event listeners to toggle confirmation buttons
        document.querySelectorAll('.btn-toggle-confirmed').forEach(button => {
            button.addEventListener('click', (e) => {
                const athleteId = parseInt(e.target.dataset.athleteId, 10);
                const currentStatus = e.target.dataset.confirmed === 'true';
                handleToggleConfirmation(athleteId, currentStatus);
            });
        });
        
    } catch (error) {
        console.error('Error loading athletes:', error);
        container.innerHTML = '<p style="color: red;">Error loading athletes. Please try again.</p>';
    }
}

// Handle saving World Athletics ID
async function handleSaveWorldAthleticsId(event) {
    const button = event.target;
    const athleteId = button.getAttribute('data-athlete-id');
    const input = document.querySelector(`.wa-id-input[data-athlete-id="${athleteId}"]`);
    const worldAthleticsId = input.value.trim();
    
    // Confirm if removing ID
    if (!worldAthleticsId) {
        if (!confirm('Are you sure you want to remove the World Athletics ID for this athlete?')) {
            return;
        }
    }
    
    try {
        button.disabled = true;
        button.textContent = 'Saving...';
        
        const response = await fetch(`${API_BASE}/api/update-athlete`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                athleteId: parseInt(athleteId),
                worldAthleticsId: worldAthleticsId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update');
        }
        
        const result = await response.json();
        
        // Show success feedback
        button.textContent = 'Saved!';
        button.style.backgroundColor = '#4CAF50';
        
        // Reset button after 2 seconds
        setTimeout(() => {
            button.textContent = 'Save';
            button.style.backgroundColor = '';
            button.disabled = false;
        }, 2000);
        
        console.log('Updated athlete:', result.athlete);
        
    } catch (error) {
        console.error('Error saving World Athletics ID:', error);
        alert('Failed to save World Athletics ID: ' + error.message);
        button.textContent = 'Save';
        button.disabled = false;
    }
}

// Handle syncing individual athlete
async function handleSyncAthlete(event) {
    const button = event.target;
    const athleteId = button.getAttribute('data-athlete-id');
    const athleteName = button.getAttribute('data-athlete-name');
    const worldAthleticsId = button.getAttribute('data-wa-id');
    
    if (!worldAthleticsId) {
        alert('Cannot sync athlete without a World Athletics ID. Please add the ID first.');
        return;
    }
    
    try {
        button.disabled = true;
        const originalText = button.textContent;
        button.textContent = 'Syncing...';
        button.style.opacity = '0.6';
        
        const response = await fetch(`${API_BASE}/api/sync-athlete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                athleteId: parseInt(athleteId),
                worldAthleticsId: worldAthleticsId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to sync athlete');
        }
        
        const result = await response.json();
        
        // Show success feedback
        button.textContent = 'Synced!';
        button.style.backgroundColor = '#4CAF50';
        button.style.opacity = '1';
        
        // Reload the athlete table to show updated data
        setTimeout(async () => {
            button.textContent = originalText;
            button.style.backgroundColor = '';
            button.disabled = false;
            
            // Refresh the table
            await handleViewAthletes();
        }, 2000);
        
        console.log('Synced athlete:', result.athlete);
        
    } catch (error) {
        console.error('Error syncing athlete:', error);
        alert('Failed to sync athlete: ' + error.message + '\n\nThis may be because:\n- The World Athletics ID is incorrect\n- The athlete is not in the current rankings\n- Network or server error');
        button.textContent = 'Sync';
        button.style.opacity = '1';
        button.disabled = false;
    }
}

/**
 * Handle adding a new athlete
 */
async function handleAddAthlete(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('athlete-name').value.trim(),
        country: document.getElementById('athlete-country').value.trim().toUpperCase(),
        gender: document.getElementById('athlete-gender').value,
        personalBest: document.getElementById('athlete-pb').value.trim(),
        seasonBest: document.getElementById('athlete-season-best').value.trim() || null,
        marathonRank: document.getElementById('athlete-marathon-rank').value ? parseInt(document.getElementById('athlete-marathon-rank').value) : null,
        age: document.getElementById('athlete-age').value ? parseInt(document.getElementById('athlete-age').value) : null,
        sponsor: document.getElementById('athlete-sponsor').value.trim() || null,
        worldAthleticsId: document.getElementById('athlete-wa-id').value.trim() || null,
        headshotUrl: document.getElementById('athlete-headshot').value.trim() || null,
        confirmForNYC: document.getElementById('athlete-confirm-nyc').checked
    };
    
    try {
        const response = await fetch(`${API_BASE}/api/add-athlete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || error.error || 'Failed to add athlete');
        }
        
        const result = await response.json();
        alert(`✓ Athlete added successfully! ID: ${result.athleteId}`);
        
        // Close modal and reset form
        document.getElementById('add-athlete-modal').style.display = 'none';
        document.getElementById('add-athlete-form').reset();
        
        // Refresh athlete list
        handleViewAthletes();
        
    } catch (error) {
        console.error('Error adding athlete:', error);
        alert(`Error adding athlete: ${error.message}`);
    }
}

/**
 * Handle toggling athlete confirmation for NYC Marathon
 */
async function handleToggleConfirmation(athleteId, currentStatus) {
    const newStatus = !currentStatus;
    const action = newStatus ? 'confirm' : 'unconfirm';
    
    if (!confirm(`Are you sure you want to ${action} this athlete for the NYC Marathon?`)) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/api/toggle-athlete-confirmation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                athleteId: athleteId,
                confirmed: newStatus
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || error.error || 'Failed to toggle confirmation');
        }
        
        // Refresh athlete list
        handleViewAthletes();
        
    } catch (error) {
        console.error('Error toggling confirmation:', error);
        alert(`Error: ${error.message}`);
    }
}

// ============================================================================
// ATHLETE CARD MODAL
// ============================================================================

/**
 * Open athlete detail modal with progression and race results
 * @param {number|object} athleteIdOrData - Athlete ID or full athlete object
 */
async function openAthleteModal(athleteIdOrData) {
    const modal = document.getElementById('athlete-modal');
    let athleteId, athleteData;
    
    // Handle both ID and full object
    if (typeof athleteIdOrData === 'object') {
        athleteData = athleteIdOrData;
        athleteId = athleteData.id;
    } else {
        athleteId = athleteIdOrData;
        // Find athlete in current data
        athleteData = [...gameState.athletes.men, ...gameState.athletes.women]
            .find(a => a.id === athleteId);
    }
    
    if (!athleteData) {
        console.error('Athlete not found:', athleteId);
        return;
    }
    
    // Populate basic info
    populateAthleteBasicInfo(athleteData);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Load progression and results data
    await loadAthleteDetailedData(athleteId);
}

/**
 * Open athlete modal showing scoring breakdown from leaderboards
 * @param {number|object} athleteIdOrData - Athlete ID or full athlete object with scoring data
 */
async function openAthleteScoringModal(athleteIdOrData) {
    const modal = document.getElementById('athlete-modal');
    let athleteId, athleteData;
    
    // Handle both ID and full object
    if (typeof athleteIdOrData === 'object') {
        athleteData = athleteIdOrData;
        athleteId = athleteData.id || athleteData.athlete_id;
    } else {
        athleteId = athleteIdOrData;
        // Find athlete in current data
        athleteData = [...gameState.athletes.men, ...gameState.athletes.women]
            .find(a => a.id === athleteId);
    }
    
    if (!athleteData) {
        console.error('Athlete not found:', athleteId);
        return;
    }
    
    // Populate basic athlete masthead info
    populateAthleteBasicInfo(athleteData);
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Wait for modal to be visible in DOM, then load scoring
    setTimeout(() => {
        loadAthleteScoringData(athleteId, athleteData);
    }, 0);
}

/**
 * Load and display scoring breakdown for an athlete
 */
async function loadAthleteScoringData(athleteId, athleteData) {
    console.log('loadAthleteScoringData called with:', { athleteId, athleteData });
    
    const modal = document.getElementById('athlete-modal');
    if (!modal) {
        console.error('Athlete modal not found');
        return;
    }
    
    const tabsContainer = modal.querySelector('.tabs-container');
    const contentArea = modal.querySelector('.tab-content-container');
    
    if (!tabsContainer || !contentArea) {
        console.error('Modal elements not found', { tabsContainer, contentArea });
        return;
    }
    
    // Hide tabs since we're only showing scoring
    tabsContainer.style.display = 'none';
    
    // Show loading state
    contentArea.innerHTML = '<div class="loading-spinner">Loading scoring details...</div>';
    
    try {
        let athleteResult = null;
        
        // Check if athleteData already has result information (from race results page)
        if (athleteData && (athleteData.finish_time || athleteData.split_5k || athleteData.total_points !== undefined)) {
            console.log('Using athleteData directly as result:', athleteData);
            athleteResult = athleteData;
        } else {
            console.log('Fetching results from API for athlete:', athleteId);
            // Fetch race results for this athlete
            const response = await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`);
            const data = await response.json();
            
            // Find this athlete's result
            const results = data.scored || data.results || [];
            athleteResult = results.find(r => 
                r.athlete_id === athleteId || r.id === athleteId
            );
            console.log('Found athleteResult from API:', athleteResult);
        }
        
        // Check for DNS (Did Not Start) or DNF (Did Not Finish)
        if (athleteResult) {
            const hasSomeSplits = athleteResult.split_5k || athleteResult.split_10k || 
                                  athleteResult.split_half || athleteResult.split_30k || 
                                  athleteResult.split_35k || athleteResult.split_40k;
            const isDNS = !athleteResult.finish_time && !hasSomeSplits;
            const isDNF = !athleteResult.finish_time && hasSomeSplits;
            
            console.log('DNS/DNF detection:', { 
                finish_time: athleteResult.finish_time, 
                hasSomeSplits, 
                isDNS, 
                isDNF 
            });
            
            if (isDNS) {
                // Show DNS status - compact single-line version
                contentArea.innerHTML = `
                    <div style="padding: 24px; max-width: 600px; margin: 0 auto;">
                        <h2 style="margin: 0 0 24px 0; font-size: 24px; color: #1e293b; border-bottom: 2px solid #e74c3c; padding-bottom: 12px;">
                            Race Status
                        </h2>
                        
                        <div style="background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); 
                                    color: white; padding: 16px 24px; border-radius: 8px; margin-bottom: 24px; 
                                    display: flex; align-items: center; justify-content: center; gap: 16px;">
                            <div style="font-size: 32px;">⚠️</div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold;">DNS</div>
                                <div style="font-size: 14px; opacity: 0.95;">Did Not Start</div>
                            </div>
                        </div>
                        
                        <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                            <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #334155;">What happened?</h3>
                            <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                This athlete was confirmed for the race but did not cross the starting line. 
                                This could be due to a last-minute withdrawal, injury, or other circumstances.
                            </p>
                        </div>
                        
                        <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; text-align: center;">
                            <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Points Earned</div>
                            <div style="font-size: 48px; font-weight: bold; color: #94a3b8;">0</div>
                            <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">No points awarded for DNS</p>
                        </div>
                    </div>
                `;
                return;
            }
            
            if (isDNF) {
                // Show DNF status with last recorded split - compact version
                const splits = [
                    { label: '40K', time: athleteResult.split_40k, distance: '40km' },
                    { label: '35K', time: athleteResult.split_35k, distance: '35km' },
                    { label: '30K', time: athleteResult.split_30k, distance: '30km' },
                    { label: 'Half', time: athleteResult.split_half, distance: '21.1km' },
                    { label: '10K', time: athleteResult.split_10k, distance: '10km' },
                    { label: '5K', time: athleteResult.split_5k, distance: '5km' }
                ];
                
                const lastSplit = splits.find(s => s.time);
                
                let splitsHTML = '';
                splits.reverse().forEach(split => {
                    if (split.time) {
                        const isLast = split === lastSplit;
                        splitsHTML += `
                            <div style="display: flex; justify-content: space-between; padding: 12px 0; 
                                        border-bottom: 1px solid #e2e8f0; ${isLast ? 'background: #fef2f2; margin: 0 -16px; padding: 12px 16px;' : ''}">
                                <span style="color: ${isLast ? '#dc2626' : '#475569'}; font-weight: ${isLast ? '600' : '400'};">
                                    ${split.label} (${split.distance})
                                    ${isLast ? ' <span style="background: #dc2626; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">LAST SPLIT</span>' : ''}
                                </span>
                                <span style="font-family: 'Monaco', 'Courier New', monospace; color: ${isLast ? '#dc2626' : '#1e293b'}; font-weight: ${isLast ? '700' : '600'};">
                                    ${split.time}
                                </span>
                            </div>
                        `;
                    }
                });
                
                contentArea.innerHTML = `
                    <div style="padding: 24px; max-width: 600px; margin: 0 auto;">
                        <h2 style="margin: 0 0 24px 0; font-size: 24px; color: #1e293b; border-bottom: 2px solid #f59e0b; padding-bottom: 12px;">
                            Race Status
                        </h2>
                        
                        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                                    color: white; padding: 16px 24px; border-radius: 8px; margin-bottom: 24px; 
                                    display: flex; align-items: center; justify-content: center; gap: 16px;">
                            <div style="font-size: 32px;">🛑</div>
                            <div>
                                <div style="font-size: 24px; font-weight: bold;">DNF</div>
                                <div style="font-size: 14px; opacity: 0.95;">Did Not Finish</div>
                            </div>
                        </div>
                        
                        ${lastSplit ? `
                            <div style="background: #fffbeb; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 24px;">
                                <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #334155;">Last Recorded Position</h3>
                                <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                    This athlete was last recorded at the <strong>${lastSplit.label}</strong> timing mat (${lastSplit.distance}) 
                                    with a time of <strong>${lastSplit.time}</strong>. They did not complete the full marathon distance.
                                </p>
                            </div>
                        ` : ''}
                        
                        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
                            <h3 style="margin: 0 0 16px 0; font-size: 18px; color: #334155;">Recorded Splits</h3>
                            ${splitsHTML || '<p style="margin: 0; color: #94a3b8; text-align: center;">No split data available</p>'}
                        </div>
                        
                        <div style="background: #fff5f5; padding: 20px; border-radius: 8px; border-left: 4px solid #e74c3c;">
                            <h3 style="margin: 0 0 12px 0; font-size: 18px; color: #334155;">What happened?</h3>
                            <p style="margin: 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                                This athlete started the race but did not cross the finish line. This could be due to injury, 
                                exhaustion, time cutoffs, or other race-day circumstances.
                            </p>
                        </div>
                        
                        <div style="margin-top: 24px; padding: 16px; background: #f8fafc; border-radius: 8px; text-align: center;">
                            <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Points Earned</div>
                            <div style="font-size: 48px; font-weight: bold; color: #94a3b8;">0</div>
                            <p style="margin: 8px 0 0 0; color: #94a3b8; font-size: 12px;">No points awarded for DNF</p>
                        </div>
                    </div>
                `;
                return;
            }
        }
        
        if (!athleteResult || !athleteResult.total_points) {
            contentArea.innerHTML = `
                <div style="padding: 24px; text-align: center;">
                    <p style="color: #64748b; font-size: 16px;">No scoring data available for this athlete yet.</p>
                    <p style="color: #94a3b8; font-size: 14px; margin-top: 8px;">Check back once race results have been entered.</p>
                </div>
            `;
            return;
        }
        
        // Parse breakdown if it's a JSON string
        let breakdown = athleteResult.breakdown;
        if (typeof breakdown === 'string') {
            try {
                breakdown = JSON.parse(breakdown);
            } catch (e) {
                console.error('Error parsing breakdown JSON:', e);
                breakdown = null;
            }
        }
        
        // Build scoring detail HTML
        let scoringHTML = `
            <div style="padding: 24px; max-width: 600px; margin: 0 auto;">
                <h2 style="margin: 0 0 24px 0; font-size: 24px; color: #1e293b; border-bottom: 2px solid var(--primary-blue); padding-bottom: 12px;">
                    Scoring Breakdown
                </h2>
                
                <!-- Total Points Summary -->
                <div style="background: linear-gradient(135deg, var(--primary-blue) 0%, var(--primary-orange) 100%); 
                            color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
                    <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">TOTAL POINTS</div>
                    <div style="font-size: 48px; font-weight: bold;">${athleteResult.total_points}</div>
                </div>
        `;
        
        // Placement Points
        if (breakdown && breakdown.placement) {
            const placement = breakdown.placement.position;
            const points = breakdown.placement.points;
            const medal = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '';
            
            scoringHTML += `
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid var(--primary-blue);">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; font-size: 18px; color: #334155;">
                            ${medal} Placement Points
                        </h3>
                        <span style="font-size: 24px; font-weight: bold; color: var(--primary-blue);">+${points}</span>
                    </div>
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                        Finished in <strong>#${placement}</strong> place
                    </p>
                </div>
            `;
        }
        
        // Time Gap Points
        if (breakdown && breakdown.time_gap && breakdown.time_gap.points > 0) {
            const gapSeconds = breakdown.time_gap.gap_seconds;
            const points = breakdown.time_gap.points;
            const window = breakdown.time_gap.window;
            
            // Format gap time
            let gapDisplay = '';
            if (gapSeconds < 60) {
                gapDisplay = `${gapSeconds.toFixed(2)}s`;
            } else {
                const minutes = Math.floor(gapSeconds / 60);
                const seconds = (gapSeconds % 60).toFixed(2);
                gapDisplay = `${minutes}:${seconds.padStart(5, '0')}`;
            }
            
            scoringHTML += `
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #10b981;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h3 style="margin: 0; font-size: 18px; color: #334155;">⚡ Time Gap Bonus</h3>
                        <span style="font-size: 24px; font-weight: bold; color: #10b981;">+${points}</span>
                    </div>
                    <p style="margin: 0; color: #64748b; font-size: 14px;">
                        Finished <strong>${gapDisplay}</strong> behind winner
                        ${window ? `<br><em>Within ${window.max_gap_seconds}s threshold</em>` : ''}
                    </p>
                </div>
            `;
        }
        
        // Performance Bonuses
        if (breakdown && breakdown.performance_bonuses && breakdown.performance_bonuses.length > 0) {
            const totalPerfPoints = breakdown.performance_bonuses.reduce((sum, b) => sum + b.points, 0);
            
            scoringHTML += `
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #f59e0b;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0; font-size: 18px; color: #334155;">🏃 Performance Bonuses</h3>
                        <span style="font-size: 24px; font-weight: bold; color: #f59e0b;">+${totalPerfPoints}</span>
                    </div>
            `;
            
            breakdown.performance_bonuses.forEach(bonus => {
                const icon = bonus.type === 'NEGATIVE_SPLIT' ? '📈' : 
                           bonus.type === 'EVEN_PACE' ? '⚖️' : '🚀';
                const label = bonus.type === 'NEGATIVE_SPLIT' ? 'Negative Split' :
                            bonus.type === 'EVEN_PACE' ? 'Even Pace' : 'Fast Finish Kick';
                
                // Debug logging for Fast Finish Kick
                if (bonus.type === 'FAST_FINISH_KICK') {
                    console.log('Fast Finish Kick bonus:', bonus);
                    console.log('Bonus details:', bonus.details);
                }
                
                // Build details text based on bonus type
                let detailsText = '';
                if (bonus.details) {
                    if (bonus.type === 'NEGATIVE_SPLIT' && bonus.details.first_half_ms && bonus.details.second_half_ms) {
                        const firstHalf = formatTimeFromMs(bonus.details.first_half_ms);
                        const secondHalf = formatTimeFromMs(bonus.details.second_half_ms);
                        detailsText = `<br><span style="font-size: 12px; color: #64748b;">1st half: ${firstHalf} | 2nd half: ${secondHalf}</span>`;
                    } else if (bonus.type === 'EVEN_PACE' && bonus.details.first_half_ms && bonus.details.second_half_ms) {
                        const firstHalf = formatTimeFromMs(bonus.details.first_half_ms);
                        const secondHalf = formatTimeFromMs(bonus.details.second_half_ms);
                        const diff = Math.abs(bonus.details.second_half_ms - bonus.details.first_half_ms);
                        const diffDisplay = formatTimeFromMs(diff);
                        detailsText = `<br><span style="font-size: 12px; color: #64748b;">1st half: ${firstHalf} | 2nd half: ${secondHalf} (±${diffDisplay})</span>`;
                    } else if (bonus.type === 'FAST_FINISH_KICK') {
                        // Check for new field names first, fall back to old field names
                        const sprintMs = bonus.details.final_sprint_ms || bonus.details.last_5k_ms;
                        const sprintPace = bonus.details.final_sprint_pace_ms_per_m || bonus.details.last_5k_pace_ms_per_m;
                        const first40kPace = bonus.details.first_40k_pace_ms_per_m;
                        
                        if (sprintPace && first40kPace) {
                            // New format with detailed pace comparison (pace only, no time)
                            const finalSprintDistance = bonus.details.final_sprint_distance_km || 2.195;
                            const finalSprintPace = formatPacePerMile(sprintPace);
                            const first40kPaceFormatted = formatPacePerMile(first40kPace);
                            
                            detailsText = `<br><span style="font-size: 12px; color: #64748b;">
                                Final ${finalSprintDistance.toFixed(2)}km: ${finalSprintPace} pace<br>
                                First 40km: ${first40kPaceFormatted} pace
                            </span>`;
                        } else if (sprintMs) {
                            // Old format or partial data - just show the time
                            const sprintTime = formatTimeFromMs(sprintMs);
                            detailsText = `<br><span style="font-size: 12px; color: #64748b;">Final sprint: ${sprintTime}</span>`;
                        }
                    }
                }
                
                scoringHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                        <span style="color: #475569; font-size: 14px;">${icon} ${label}${detailsText}</span>
                        <span style="font-weight: 600; color: #f59e0b;">+${bonus.points} pts</span>
                    </div>
                `;
            });
            
            scoringHTML += `</div>`;
        }
        
        // Record Bonuses
        if (breakdown && breakdown.record_bonuses && breakdown.record_bonuses.length > 0) {
            const totalRecordPoints = breakdown.record_bonuses.reduce((sum, b) => sum + b.points, 0);
            
            scoringHTML += `
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid #dc2626;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <h3 style="margin: 0; font-size: 18px; color: #334155;">🏆 Record Bonuses</h3>
                        <span style="font-size: 24px; font-weight: bold; color: #dc2626;">+${totalRecordPoints}</span>
                    </div>
            `;
            
            breakdown.record_bonuses.forEach(bonus => {
                const icon = bonus.type === 'WORLD_RECORD' ? '🌎' : '🏆';
                const label = bonus.type === 'WORLD_RECORD' ? 'World Record' : 'Course Record';
                const statusBadge = bonus.status === 'provisional' ? 
                    '<span style="background: #fbbf24; color: #78350f; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px;">PROVISIONAL</span>' : '';
                
                scoringHTML += `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0;">
                        <span style="color: #475569; font-size: 14px;">${icon} ${label}${statusBadge}</span>
                        <span style="font-weight: 600; color: #dc2626;">+${bonus.points} pts</span>
                    </div>
                `;
            });
            
            scoringHTML += `</div>`;
        }
        
        // Race info footer
        if (athleteResult.finish_time) {
            scoringHTML += `
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 14px; text-align: center;">
                    <strong>Finish Time:</strong> ${athleteResult.finish_time}
                </div>
            `;
        }
        
        scoringHTML += `</div>`;
        
        // Display the scoring breakdown
        contentArea.innerHTML = scoringHTML;
        
    } catch (error) {
        console.error('Error loading athlete scoring data:', error);
        contentArea.innerHTML = `
            <div style="padding: 24px; text-align: center;">
                <p style="color: #ef4444;">Error loading scoring data</p>
                <p style="color: #64748b; font-size: 14px;">${error.message}</p>
            </div>
        `;
    }
}

/**
 * Convert ISO 3166-1 alpha-3 country code to flag emoji
 */
function getCountryFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length < 2) return '🏁';
    const sanitized = countryCode.replace(/[^A-Za-z]/g, '').toUpperCase();
    if (sanitized.length < 2) return '🏁';
    
    // Map of common alpha-3 to alpha-2 codes for marathon countries
    const alpha3ToAlpha2 = {
        'KEN': 'KE', 'ETH': 'ET', 'USA': 'US', 'GBR': 'GB', 'JPN': 'JP',
        'FRA': 'FR', 'GER': 'DE', 'ITA': 'IT', 'ESP': 'ES', 'NED': 'NL',
        'BEL': 'BE', 'SUI': 'CH', 'AUT': 'AT', 'CAN': 'CA', 'AUS': 'AU',
        'NZL': 'NZ', 'UGA': 'UG', 'TAN': 'TZ', 'ERI': 'ER', 'BRN': 'BH',
        'MAR': 'MA', 'ALG': 'DZ', 'RSA': 'ZA', 'MEX': 'MX', 'BRA': 'BR',
        'CHN': 'CN', 'KOR': 'KR', 'PRK': 'KP', 'IND': 'IN', 'ISR': 'IL',
        'POL': 'PL', 'UKR': 'UA', 'RUS': 'RU', 'BLR': 'BY', 'CZE': 'CZ',
        'SVK': 'SK', 'HUN': 'HU', 'ROU': 'RO', 'BUL': 'BG', 'SRB': 'RS',
        'CRO': 'HR', 'SLO': 'SI', 'SWE': 'SE', 'NOR': 'NO', 'DEN': 'DK',
        'FIN': 'FI', 'ISL': 'IS', 'IRL': 'IE', 'POR': 'PT', 'TUR': 'TR'
    };
    
    const alpha2 = alpha3ToAlpha2[sanitized] || sanitized.slice(0, 2);
    const codePoints = alpha2.split('').map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

/**
 * Get gradient colors based on country flag colors
 */
function getCountryGradient(countryCode) {
    const flagColors = {
        'KEN': ['#BB0000', '#006600', '#000000'], // Kenya - Red, Green, Black
        'ETH': ['#009543', '#FCDD09', '#DA121A'], // Ethiopia - Green, Yellow, Red
        'USA': ['#B22234', '#FFFFFF', '#3C3B6E'], // USA - Red, White, Blue
        'GBR': ['#012169', '#FFFFFF', '#C8102E'], // UK - Blue, White, Red
        'JPN': ['#BC002D', '#FFFFFF'], // Japan - Red, White
        'UGA': ['#000000', '#FCDC04', '#D90000'], // Uganda - Black, Yellow, Red
        'TAN': ['#1EB53A', '#FCD116', '#00A3DD'], // Tanzania - Green, Yellow, Blue
        'GER': ['#000000', '#DD0000', '#FFCE00'], // Germany - Black, Red, Gold
        'FRA': ['#002395', '#FFFFFF', '#ED2939'], // France - Blue, White, Red
        'ESP': ['#AA151B', '#F1BF00'], // Spain - Red, Yellow
        'ITA': ['#009246', '#FFFFFF', '#CE2B37'], // Italy - Green, White, Red
        'NED': ['#21468B', '#FFFFFF', '#AE1C28'], // Netherlands - Blue, White, Red
        'BEL': ['#000000', '#FDDA24', '#EF3340'], // Belgium - Black, Yellow, Red
        'MAR': ['#C1272D', '#006233'], // Morocco - Red, Green
        'ERI': ['#12A2DD', '#EA0000', '#4CA64C'], // Eritrea - Blue, Red, Green
        'BRN': ['#CE1126', '#FFFFFF'], // Bahrain - Red, White
        'CHN': ['#DE2910', '#FFDE00'], // China - Red, Yellow
        'MEX': ['#006847', '#FFFFFF', '#CE1126'], // Mexico - Green, White, Red
        'BRA': ['#009B3A', '#FEDF00', '#002776'], // Brazil - Green, Yellow, Blue
        'CAN': ['#FF0000', '#FFFFFF'], // Canada - Red, White
        'AUS': ['#012169', '#FFFFFF', '#E4002B'], // Australia - Blue, White, Red
        'NOR': ['#BA0C2F', '#FFFFFF', '#00205B'], // Norway - Red, White, Blue
        'SWE': ['#006AA7', '#FECC00'], // Sweden - Blue, Yellow
        'FIN': ['#003580', '#FFFFFF'], // Finland - Blue, White
        'POL': ['#FFFFFF', '#DC143C'], // Poland - White, Red
        'RUS': ['#FFFFFF', '#0039A6', '#D52B1E'], // Russia - White, Blue, Red
        'UKR': ['#0057B7', '#FFD700'], // Ukraine - Blue, Yellow
        'RSA': ['#007A4D', '#FFB612', '#DE3831'], // South Africa - Green, Yellow, Red
        'POR': ['#006600', '#FF0000'], // Portugal - Green, Red
        'IRL': ['#169B62', '#FFFFFF', '#FF883E'], // Ireland - Green, White, Orange
        'BUL': ['#FFFFFF', '#00966E', '#D62612'], // Bulgaria - White, Green, Red
        'ROU': ['#002B7F', '#FCD116', '#CE1126'], // Romania - Blue, Yellow, Red
        'CZE': ['#11457E', '#FFFFFF', '#D7141A'], // Czech Republic - Blue, White, Red
        'HUN': ['#CD2A3E', '#FFFFFF', '#436F4D'], // Hungary - Red, White, Green
        'CRO': ['#FF0000', '#FFFFFF', '#171796'], // Croatia - Red, White, Blue
        'TUR': ['#E30A17', '#FFFFFF'], // Turkey - Red, White
    };
    
    const colors = flagColors[countryCode] || ['#2C39A2', '#ff6900']; // Default to app colors
    
    // Create gradient with 2-3 colors
    if (colors.length === 2) {
        return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 100%)`;
    } else if (colors.length === 3) {
        return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
    }
    
    return `linear-gradient(135deg, ${colors[0]} 0%, ${colors[1]} 50%, ${colors[2]} 100%)`;
}

/**
 * Populate basic athlete information in the modal
 */
function populateAthleteBasicInfo(athlete) {
    // Apply country gradient to masthead
    const masthead = document.getElementById('card-masthead');
    masthead.style.background = getCountryGradient(athlete.country);
    
    // Photo with gender-specific runner fallback
    const photo = document.getElementById('modal-athlete-photo');
    const isMale = athlete.gender === 'men';
    
    const defaultRunnerSvg = getRunnerSvg(athlete.gender);
    
    // Handle both headshot_url (from database) and headshotUrl (camelCase)
    const headshotUrl = athlete.headshot_url || athlete.headshotUrl;
    
    if (headshotUrl) {
        photo.src = headshotUrl;
        photo.alt = athlete.name;
        // Handle 404 errors by falling back to gender-specific runner icon
        photo.onerror = function() {
            this.onerror = null; // Prevent infinite loop
            this.src = defaultRunnerSvg;
        };
    } else {
        photo.src = defaultRunnerSvg;
        photo.alt = 'No photo';
    }
    
    // Basic info
    const nameEl = document.getElementById('modal-athlete-name');
    const countryEl = document.getElementById('modal-athlete-country');
    const genderEl = document.getElementById('modal-athlete-gender');
    const ageEl = document.getElementById('modal-athlete-age');
    
    if (nameEl) nameEl.textContent = athlete.name;
    if (countryEl) countryEl.textContent = getCountryFlagEmoji(athlete.country);
    if (genderEl) genderEl.textContent = athlete.gender === 'men' ? 'Men' : 'Women';
    if (ageEl) ageEl.textContent = athlete.age ? `${athlete.age}yo` : 'Age N/A';
    
    // Masthead stats
    const pbEl = document.getElementById('modal-athlete-pb');
    const marathonRankEl = document.getElementById('modal-athlete-marathon-rank');
    
    if (pbEl) pbEl.textContent = athlete.pb || 'N/A';
    if (marathonRankEl) marathonRankEl.textContent = athlete.marathonRank ? `#${athlete.marathonRank}` : 'N/A';
    
    // Overview tab stats (duplicated for overview section)
    const overviewPbEl = document.getElementById('overview-pb');
    const sbEl = document.getElementById('modal-athlete-sb');
    const overviewMarathonRankEl = document.getElementById('overview-marathon-rank');
    const overallRankEl = document.getElementById('modal-athlete-overall-rank');
    
    if (overviewPbEl) overviewPbEl.textContent = athlete.pb || 'N/A';
    if (sbEl) sbEl.textContent = athlete.seasonBest || athlete.pb || 'N/A';
    if (overviewMarathonRankEl) overviewMarathonRankEl.textContent = athlete.marathonRank ? `#${athlete.marathonRank}` : 'N/A';
    if (overallRankEl) overallRankEl.textContent = athlete.overallRank ? `#${athlete.overallRank}` : 'N/A';
    
    // Sponsor
    const sponsorSection = document.getElementById('modal-athlete-sponsor-section');
    const sponsorEl = document.getElementById('modal-athlete-sponsor');
    if (sponsorSection && sponsorEl) {
        if (athlete.sponsor) {
            sponsorEl.textContent = athlete.sponsor;
            sponsorSection.style.display = 'flex';
        } else {
            sponsorSection.style.display = 'none';
        }
    }
    
    // Profile tab
    const dobEl = document.getElementById('modal-athlete-dob');
    const waIdEl = document.getElementById('modal-athlete-wa-id');
    const roadRankEl = document.getElementById('modal-athlete-road-rank');
    
    if (dobEl) dobEl.textContent = athlete.dateOfBirth ? 
        new Date(athlete.dateOfBirth).toLocaleDateString() : 'N/A';
    if (waIdEl) waIdEl.textContent = athlete.worldAthleticsId || 'N/A';
    if (roadRankEl) roadRankEl.textContent = athlete.roadRunningRank ? 
        `#${athlete.roadRunningRank}` : 'N/A';
    
    // World Athletics link
    const waLink = document.getElementById('modal-wa-link');
    if (waLink) {
        if (athlete.worldAthleticsProfileUrl) {
            waLink.href = athlete.worldAthleticsProfileUrl;
            waLink.style.display = 'flex';
        } else if (athlete.worldAthleticsId) {
            waLink.href = `https://worldathletics.org/athletes/_/${athlete.worldAthleticsId}`;
            waLink.style.display = 'flex';
        } else {
            waLink.style.display = 'none';
        }
    }
}

/**
 * Load progression and race results from API
 */
async function loadAthleteDetailedData(athleteId) {
    const resultsDiv = document.getElementById('results-list');
    const progressionLoading = document.getElementById('progression-loading');
    const resultsLoading = document.getElementById('results-loading');
    const progressionEmpty = document.getElementById('progression-empty');
    const resultsEmpty = document.getElementById('results-empty');
    const chartContainer = document.querySelector('.chart-container');
    const selectedRaceInfo = document.getElementById('selected-race-info');
    
    // Show loading states (only if elements exist)
    if (progressionLoading) progressionLoading.style.display = 'block';
    if (resultsLoading) resultsLoading.style.display = 'block';
    if (resultsDiv) resultsDiv.innerHTML = '';
    if (progressionEmpty) progressionEmpty.style.display = 'none';
    if (resultsEmpty) resultsEmpty.style.display = 'none';
    if (chartContainer) chartContainer.style.display = 'none';
    if (selectedRaceInfo) selectedRaceInfo.style.display = 'none';
    
    try {
        // Fetch athlete profile with progression and results
        const response = await fetch(`${API_BASE}/api/athletes?id=${athleteId}&include=progression,results&year=2025`);
        if (!response.ok) throw new Error('Failed to load athlete data');
        
        const data = await response.json();
        
        // Hide loading spinners (only if elements exist)
        if (progressionLoading) progressionLoading.style.display = 'none';
        if (resultsLoading) resultsLoading.style.display = 'none';
        
        // Display progression data
        if (data.progression && data.progression.length > 0) {
            displayProgression(data.progression);
        } else {
            if (progressionEmpty) {
                progressionEmpty.style.display = 'block';
            }
        }
        
        // Display race results
        if (data.raceResults && data.raceResults.length > 0) {
            displayRaceResults(data.raceResults);
        } else {
            if (resultsEmpty) {
                resultsEmpty.style.display = 'block';
            }
        }
        
    } catch (error) {
        console.error('Error loading athlete details:', error);
        if (progressionLoading) progressionLoading.style.display = 'none';
        if (resultsLoading) resultsLoading.style.display = 'none';
        if (progressionEmpty) {
            progressionEmpty.textContent = 'Error loading data';
            progressionEmpty.style.display = 'block';
        }
        if (resultsEmpty) {
            resultsEmpty.textContent = 'Error loading data';
            resultsEmpty.style.display = 'block';
        }
    }
}

/**
 * Display progression data in the modal
 */
let progressionChart = null;
let currentProgressionData = null;

function displayProgression(progression) {
    currentProgressionData = progression;
    
    // Get unique disciplines
    const disciplines = [...new Set(progression.map(item => item.discipline))].sort();
    
    // Show discipline selector if more than one discipline
    const disciplineSelector = document.getElementById('discipline-selector');
    if (disciplines.length > 1) {
        disciplineSelector.style.display = 'block';
        disciplineSelector.innerHTML = disciplines.map(d => 
            `<option value="${d}">${d}</option>`
        ).join('');
        
        // Add change event listener
        disciplineSelector.onchange = function() {
            renderProgressionChart(currentProgressionData, this.value);
        };
    } else {
        disciplineSelector.style.display = 'none';
    }
    
    // Render chart with default discipline (Marathon or first available)
    const defaultDiscipline = disciplines.includes('Marathon') ? 'Marathon' : disciplines[0];
    if (disciplineSelector) {
        disciplineSelector.value = defaultDiscipline;
    }
    renderProgressionChart(progression, defaultDiscipline);
}

function renderProgressionChart(progression, discipline = 'Marathon') {
    const canvas = document.getElementById('progression-chart-canvas');
    const ctx = canvas.getContext('2d');
    const progressionTitle = document.getElementById('progression-title');
    
    // Update title with current discipline
    if (progressionTitle) {
        progressionTitle.textContent = `Season's Best: ${discipline}`;
    }
    
    // Filter by discipline and group by season (best mark per season)
    const filtered = progression.filter(item => item.discipline === discipline);
    const grouped = filtered.reduce((acc, item) => {
        const season = item.season;
        if (!acc[season] || item.mark < acc[season].mark) {
            acc[season] = item;
        }
        return acc;
    }, {});
    
    // Sort by season and limit to last 7 years
    const sorted = Object.values(grouped).sort((a, b) => 
        parseInt(a.season) - parseInt(b.season)
    );
    const limited = sorted.slice(-7);
    
    if (limited.length === 0) {
        document.getElementById('progression-empty').style.display = 'block';
        canvas.parentElement.style.display = 'none';
        return;
    }
    
    document.getElementById('progression-empty').style.display = 'none';
    canvas.parentElement.style.display = 'block';
    
    // Convert time strings to seconds for plotting
    const timeToSeconds = (timeStr) => {
        if (!timeStr) return null;
        const parts = timeStr.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }
        return null;
    };
    
    const secondsToTime = (seconds) => {
        if (!seconds) return 'N/A';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hours > 0) {
            return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
        }
        return `${minutes}:${String(secs).padStart(2, '0')}`;
    };
    
    const chartData = limited.map(item => ({
        x: item.season,
        y: timeToSeconds(item.mark),
        ...item
    }));
    
    // Destroy previous chart if exists
    if (progressionChart) {
        progressionChart.destroy();
    }
    
    // Create new chart
    progressionChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: discipline,
                data: chartData,
                borderColor: '#ff6900',
                backgroundColor: 'rgba(255, 105, 0, 0.1)',
                borderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#ff6900',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    title: {
                        display: true,
                        text: 'Year',
                        font: {
                            weight: 'bold',
                            size: 13
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return Math.floor(value);
                        },
                        stepSize: 1
                    },
                    grid: {
                        display: false
                    }
                },
                y: {
                    reverse: true, // Lower times are better
                    title: {
                        display: true,
                        text: 'Time',
                        font: {
                            weight: 'bold',
                            size: 13
                        }
                    },
                    ticks: {
                        callback: function(value) {
                            return secondsToTime(value);
                        }
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const index = elements[0].index;
                    const data = chartData[index];
                    displaySelectedRaceInfo(data);
                }
            }
        }
    });
}

function displaySelectedRaceInfo(raceData) {
    const container = document.getElementById('selected-race-info');
    const content = document.getElementById('race-info-content');
    
    content.innerHTML = `
        <div class="race-info-item">
            <div class="race-info-label">Year</div>
            <div class="race-info-value">${raceData.season}</div>
        </div>
        <div class="race-info-item">
            <div class="race-info-label">Time</div>
            <div class="race-info-value">${raceData.mark}</div>
        </div>
        <div class="race-info-item">
            <div class="race-info-label">Venue</div>
            <div class="race-info-value">${raceData.venue || 'Unknown'}</div>
        </div>
        <div class="race-info-item">
            <div class="race-info-label">Discipline</div>
            <div class="race-info-value">${raceData.discipline}</div>
        </div>
    `;
    
    container.style.display = 'block';
}


/**
 * Display race results in the modal
 */
function displayRaceResults(results) {
    const container = document.getElementById('results-list');
    
    // Sort by date (most recent first)
    const sorted = results.sort((a, b) => 
        new Date(b.competitionDate) - new Date(a.competitionDate)
    );
    
    container.innerHTML = sorted.map(result => {
        const date = new Date(result.competitionDate);
        const formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        return `
            <div class="result-item">
                <div class="result-header">
                    <div class="result-competition">${result.competitionName}</div>
                    <div class="result-position">${result.position || 'N/A'}</div>
                </div>
                <div class="result-details">
                    <div class="result-time">${result.finishTime || 'N/A'}</div>
                    <div class="result-venue">${result.venue}</div>
                    <div class="result-date">${formattedDate}</div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Close the athlete modal
 */
function closeAthleteModal() {
    const modal = document.getElementById('athlete-modal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Reset to overview tab
    switchModalTab('overview');
}

/**
 * Switch between tabs in the modal
 */
function switchModalTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
    
    // Update tab panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    const activePanel = document.getElementById(`tab-${tabName}`);
    if (activePanel) {
        activePanel.classList.add('active');
    }
}

/**
 * Setup modal event listeners
 */
function setupAthleteModal() {
    const modal = document.getElementById('athlete-modal');
    const closeBtn = modal.querySelector('.modal-close');
    const overlay = modal.querySelector('.modal-overlay');
    
    // Close button
    closeBtn.addEventListener('click', closeAthleteModal);
    
    // Click outside to close
    overlay.addEventListener('click', closeAthleteModal);
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeAthleteModal();
        }
    });
    
    // Tab switching
    document.querySelectorAll('.tab-button').forEach(tab => {
        tab.addEventListener('click', () => {
            switchModalTab(tab.dataset.tab);
        });
    });
}

/**
 * View team details from leaderboard
 */
async function viewTeamDetails(playerCode) {
    try {
        // Fetch team data
        const response = await fetch(`${API_BASE}/api/salary-cap-draft?gameId=${getCurrentGameId()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch team data');
        }
        
        const teamData = await response.json();
        const team = teamData[playerCode];
        
        if (!team) {
            showErrorNotification(`Team ${playerCode} not found`);
            return;
        }
        
        // Fetch results to show points breakdown
        const resultsResponse = await fetch(`${API_BASE}/api/results?gameId=${getCurrentGameId()}`);
        const resultsData = await resultsResponse.json();
        const scoredResults = resultsData.scored || [];
        
        // Calculate total points for this team
        const teamAthleteIds = [
            ...(team.men || []).map(a => a.id),
            ...(team.women || []).map(a => a.id)
        ];
        const teamResults = scoredResults.filter(r => teamAthleteIds.includes(r.athlete_id));
        
        // Check if we're using temporary scoring (some results may have finish times, some only splits)
        const hasAnyTemporaryScoring = teamResults.some(r => r.is_temporary === true && !r.total_points);
        
        // Calculate total points (prefer total_points if available, fall back to temporary_points)
        const totalPoints = teamResults.reduce((sum, r) => {
            // Use total_points if available (from full scoring engine)
            if (r.total_points !== undefined && r.total_points !== null) {
                return sum + r.total_points;
            }
            // Fall back to temporary_points for results that only have splits
            return sum + (r.temporary_points || 0);
        }, 0);
        
        // Get display name for avatar and title
        const displayName = team.displayName || playerCode;
        const avatarSvg = createTeamAvatarSVG(displayName, 56);
        const avatarHTML = avatarSvg.outerHTML;
        
        // Build modal content
        let modalHTML = `
            <div class="team-details-modal-overlay" id="team-details-overlay" onclick="closeTeamDetails()">
                <div class="team-details-modal" onclick="event.stopPropagation()">
                    <div class="team-details-header">
                        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                            ${avatarHTML}
                            <div style="flex: 1; min-width: 0;">
                                <h2 style="margin: 0; font-size: 1.5rem; color: var(--primary-orange);">${escapeHtml(displayName)}</h2>
                                ${team.displayName && team.displayName !== playerCode ? `<div style="font-size: 0.9rem; color: var(--dark-gray); font-style: italic; margin-top: 2px;">Player: ${escapeHtml(playerCode)}</div>` : ''}
                            </div>
                        </div>
                        <button class="modal-close-btn" onclick="closeTeamDetails()">×</button>
                    </div>
        `;
        
        // Add temporary scoring banner if applicable
        if (hasAnyTemporaryScoring) {
            modalHTML += `
                    <div class="team-details-temp-banner">
                        <span class="banner-icon">⚡</span>
                        <div class="banner-text">
                            <strong>Live Projections</strong>
                            <span>Some points based on current pace from splits</span>
                        </div>
                    </div>
            `;
        }
        
        modalHTML += `
                    <div class="team-details-summary">
                        <div class="summary-stat">
                            <div class="stat-label">Total Points</div>
                            <div class="stat-value">${totalPoints}${hasAnyTemporaryScoring ? '*' : ''}</div>
                        </div>
                        <div class="summary-stat">
                            <div class="stat-label">Salary</div>
                            <div class="stat-value">$${(team.totalSpent / 1000).toFixed(1)}K</div>
                        </div>
                    </div>
                    <div class="team-details-athletes">
        `;
        
        // Show men
        if (team.men && team.men.length > 0) {
            modalHTML += '<div class="gender-section"><h3>MEN</h3>';
            team.men.forEach(athlete => {
                const result = scoredResults.find(r => r.athlete_id === athlete.id);
                
                // Prefer full scoring if available, fall back to temporary
                const hasFullScoring = result && result.total_points !== undefined && result.total_points !== null;
                const points = hasFullScoring ? result.total_points : (result?.temporary_points || 0);
                const placement = hasFullScoring ? (result.placement || null) : (result?.projected_placement || null);
                const finishTime = hasFullScoring ? (result.finish_time || null) : (result?.projected_finish_time || null);
                const breakdown = hasFullScoring ? result.breakdown : null;
                
                // Calculate gap from first place (only for final results)
                let gapFromFirst = '';
                if (hasFullScoring && breakdown && breakdown.time_gap) {
                    const gapSeconds = breakdown.time_gap.gap_seconds || 0;
                    if (gapSeconds > 0) {
                        const minutes = Math.floor(gapSeconds / 60);
                        const seconds = Math.floor(gapSeconds % 60);
                        gapFromFirst = `+${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                }
                
                // Create shorthand notation: P=placement, G=time gap, B=bonuses
                let shorthand = '';
                if (!hasFullScoring) {
                    // For temporary scoring, just show placement points
                    shorthand = points > 0 ? `P${points}` : '-';
                } else if (breakdown) {
                    const parts = [];
                    if (breakdown.placement && breakdown.placement.points > 0) {
                        parts.push(`P${breakdown.placement.points}`);
                    }
                    if (breakdown.time_gap && breakdown.time_gap.points > 0) {
                        parts.push(`G${breakdown.time_gap.points}`);
                    }
                    const perfBonus = breakdown.performance_bonuses?.reduce((sum, b) => sum + b.points, 0) || 0;
                    const recBonus = breakdown.record_bonuses?.reduce((sum, b) => sum + b.points, 0) || 0;
                    const totalBonus = perfBonus + recBonus;
                    if (totalBonus > 0) {
                        parts.push(`B${totalBonus}`);
                    }
                    shorthand = parts.length > 0 ? parts.join('+') : '-';
                }
                
                const headshotUrl = athlete.headshot_url || athlete.headshotUrl || getRunnerSvg('men');
                const fallbackImg = getRunnerSvg('men');
                
                // Prepare athlete data with result info for scoring modal
                const athleteWithResult = {
                    ...athlete,
                    ...result,
                    athlete_id: athlete.id
                };
                
                modalHTML += `
                    <div class="athlete-card" onclick='closeTeamDetails(); openAthleteScoringModal(${JSON.stringify(athleteWithResult).replace(/'/g, "&#39;").replace(/"/g, '&quot;')});' style="cursor: pointer;">
                        <div class="athlete-card-left">
                            <img src="${headshotUrl}" alt="${escapeHtml(athlete.name)}" class="athlete-headshot" onerror="this.onerror=null; this.src='${fallbackImg}';" />
                            <div class="athlete-info">
                                <div class="athlete-name">${escapeHtml(athlete.name)}</div>
                                <div class="athlete-meta">
                                    <span class="athlete-country">${getCountryFlagEmoji(athlete.country)} ${athlete.country}</span>
                                    <span class="athlete-salary">$${(athlete.salary / 1000).toFixed(1)}K</span>
                                </div>
                            </div>
                        </div>
                        <div class="athlete-card-center">
                            <div class="race-time">${finishTime || '-'}</div>
                            <div class="race-details">
                                ${placement ? `<span class="race-placement">${!hasFullScoring ? '~' : ''}#${placement}</span>` : ''}
                                ${gapFromFirst ? `<span class="race-gap">${gapFromFirst}</span>` : ''}
                            </div>
                        </div>
                        <div class="athlete-card-right">
                            <div class="points-value">${points} pts</div>
                            <div class="points-notation">
                                <span class="breakdown-code">${shorthand}</span>
                                <button class="info-icon" onclick="event.stopPropagation(); showPointsInfo();" title="Points breakdown">ⓘ</button>
                            </div>
                        </div>
                    </div>
                `;
            });
            modalHTML += '</div>';
        }
        
        // Show women
        if (team.women && team.women.length > 0) {
            modalHTML += '<div class="gender-section"><h3>WOMEN</h3>';
            team.women.forEach(athlete => {
                const result = scoredResults.find(r => r.athlete_id === athlete.id);
                
                // Prefer full scoring if available, fall back to temporary
                const hasFullScoring = result && result.total_points !== undefined && result.total_points !== null;
                const points = hasFullScoring ? result.total_points : (result?.temporary_points || 0);
                const placement = hasFullScoring ? (result.placement || null) : (result?.projected_placement || null);
                const finishTime = hasFullScoring ? (result.finish_time || null) : (result?.projected_finish_time || null);
                const breakdown = hasFullScoring ? result.breakdown : null;
                
                // Calculate gap from first place (only for final results)
                let gapFromFirst = '';
                if (hasFullScoring && breakdown && breakdown.time_gap) {
                    const gapSeconds = breakdown.time_gap.gap_seconds || 0;
                    if (gapSeconds > 0) {
                        const minutes = Math.floor(gapSeconds / 60);
                        const seconds = Math.floor(gapSeconds % 60);
                        gapFromFirst = `+${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                }
                
                // Create shorthand notation
                let shorthand = '';
                if (!hasFullScoring) {
                    // For temporary scoring, just show placement points
                    shorthand = points > 0 ? `P${points}` : '-';
                } else if (breakdown) {
                    const parts = [];
                    if (breakdown.placement && breakdown.placement.points > 0) {
                        parts.push(`P${breakdown.placement.points}`);
                    }
                    if (breakdown.time_gap && breakdown.time_gap.points > 0) {
                        parts.push(`G${breakdown.time_gap.points}`);
                    }
                    const perfBonus = breakdown.performance_bonuses?.reduce((sum, b) => sum + b.points, 0) || 0;
                    const recBonus = breakdown.record_bonuses?.reduce((sum, b) => sum + b.points, 0) || 0;
                    const totalBonus = perfBonus + recBonus;
                    if (totalBonus > 0) {
                        parts.push(`B${totalBonus}`);
                    }
                    shorthand = parts.length > 0 ? parts.join('+') : '-';
                }
                
                const headshotUrl = athlete.headshot_url || athlete.headshotUrl || getRunnerSvg('women');
                const fallbackImg = getRunnerSvg('women');
                
                // Prepare athlete data with result info for scoring modal
                const athleteWithResult = {
                    ...athlete,
                    ...result,
                    athlete_id: athlete.id
                };
                
                modalHTML += `
                    <div class="athlete-card" onclick='closeTeamDetails(); openAthleteScoringModal(${JSON.stringify(athleteWithResult).replace(/'/g, "&#39;").replace(/"/g, '&quot;')});' style="cursor: pointer;">
                        <div class="athlete-card-left">
                            <img src="${headshotUrl}" alt="${escapeHtml(athlete.name)}" class="athlete-headshot" onerror="this.onerror=null; this.src='${fallbackImg}';" />
                            <div class="athlete-info">
                                <div class="athlete-name">${escapeHtml(athlete.name)}</div>
                                <div class="athlete-meta">
                                    <span class="athlete-country">${getCountryFlagEmoji(athlete.country)} ${athlete.country}</span>
                                    <span class="athlete-salary">$${(athlete.salary / 1000).toFixed(1)}K</span>
                                </div>
                            </div>
                        </div>
                        <div class="athlete-card-center">
                            <div class="race-time">${finishTime || '-'}</div>
                            <div class="race-details">
                                ${placement ? `<span class="race-placement">${!hasFullScoring ? '~' : ''}#${placement}</span>` : ''}
                                ${gapFromFirst ? `<span class="race-gap">${gapFromFirst}</span>` : ''}
                            </div>
                        </div>
                        <div class="athlete-card-right">
                            <div class="points-value">${points} pts</div>
                            <div class="points-notation">
                                <span class="breakdown-code">${shorthand}</span>
                                <button class="info-icon" onclick="event.stopPropagation(); showPointsInfo();" title="Points breakdown">ⓘ</button>
                            </div>
                            <div class="points-total">${points} pts</div>
                        </div>
                    </div>
                `;
            });
            modalHTML += '</div>';
        }
        
        modalHTML += `
                    </div>
                </div>
            </div>
        `;
        
        // Add to document
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
    } catch (error) {
        console.error('Error viewing team details:', error);
        showErrorNotification('Failed to load team details');
    }
}

function closeTeamDetails() {
    const modal = document.getElementById('team-details-overlay');
    if (modal) {
        modal.remove();
    }
}

function showPointsInfo() {
    const infoHTML = `
        <div class="points-info-modal-overlay" id="points-info-overlay" onclick="closePointsInfo()">
            <div class="points-info-modal" onclick="event.stopPropagation()">
                <div class="points-info-header">
                    <h3>Points Breakdown Notation</h3>
                    <button class="modal-close-btn" onclick="closePointsInfo()">×</button>
                </div>
                <div class="points-info-content">
                    <div class="notation-explanation">
                        <div class="notation-row">
                            <span class="notation-code">P#</span>
                            <span class="notation-desc"><strong>Placement Points</strong> - 10 pts for 1st down to 1 pt for 10th</span>
                        </div>
                        <div class="notation-row">
                            <span class="notation-code">G#</span>
                            <span class="notation-desc"><strong>Time Gap Bonus</strong> - +5 pts within 60s of winner, +4 within 2min, +3 within 3min, +2 within 5min, +1 within 10min</span>
                        </div>
                        <div class="notation-row">
                            <span class="notation-code">B#</span>
                            <span class="notation-desc"><strong>Performance Bonuses</strong> - +2 pts for negative split (faster 2nd half) OR +1 pt for even pace (mutually exclusive), PLUS +1 pt for fast finish kick (stackable)</span>
                        </div>
                        <div class="notation-row">
                            <span class="notation-code">R#</span>
                            <span class="notation-desc"><strong>Record Bonuses</strong> - +15 pts for world record, +5 pts for course record (provisional until confirmed)</span>
                        </div>
                    </div>
                    <div class="notation-example">
                        <strong>Example:</strong> "P10+G5+B3" = 18 total points
                        <ul>
                            <li>10 pts for 1st place finish</li>
                            <li>+5 pts for finishing within 60 seconds of winner</li>
                            <li>+3 pts for performance bonuses (negative split +2, fast finish kick +1)</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', infoHTML);
}

function closePointsInfo() {
    const modal = document.getElementById('points-info-overlay');
    if (modal) {
        modal.remove();
    }
}

// ============================================================================
// GAME RECAP MODAL
// ============================================================================

/**
 * Confetti animation for game recap
 */
function createConfetti() {
    const canvas = document.getElementById('confetti-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    const confettiPieces = [];
    const confettiCount = 150;
    const colors = ['#ff6900', '#2C39A2', '#ffd700', '#ff1493', '#00ff00', '#00bfff'];
    
    for (let i = 0; i < confettiCount; i++) {
        confettiPieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            w: Math.random() * 10 + 5,
            h: Math.random() * 10 + 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            rotation: Math.random() * 360,
            rotationSpeed: Math.random() * 10 - 5,
            speedX: Math.random() * 3 - 1.5,
            speedY: Math.random() * 3 + 2
        });
    }
    
    let animationId;
    let startTime = Date.now();
    const duration = 5000; // 5 seconds
    
    function draw() {
        const elapsed = Date.now() - startTime;
        
        // Stop after 5 seconds
        if (elapsed > duration) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            cancelAnimationFrame(animationId);
            return;
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        confettiPieces.forEach((piece, index) => {
            ctx.save();
            ctx.translate(piece.x, piece.y);
            ctx.rotate((piece.rotation * Math.PI) / 180);
            ctx.fillStyle = piece.color;
            ctx.fillRect(-piece.w / 2, -piece.h / 2, piece.w, piece.h);
            ctx.restore();
            
            // Update position
            piece.y += piece.speedY;
            piece.x += piece.speedX;
            piece.rotation += piece.rotationSpeed;
            
            // Don't reset - let them fall off screen
            // (removed the reset code so confetti doesn't loop)
        });
        
        animationId = requestAnimationFrame(draw);
    }
    
    draw();
}

/**
 * Check if player has seen the game recap
 */
function hasSeenGameRecap(playerCode) {
    const key = `gameRecap_${GAME_ID}_${playerCode}`;
    return localStorage.getItem(key) === 'true';
}

/**
 * Mark that player has seen the game recap
 */
function markGameRecapSeen(playerCode) {
    const key = `gameRecap_${GAME_ID}_${playerCode}`;
    localStorage.setItem(key, 'true');
}

/**
 * Show game recap modal for the current player
 */
async function showGameRecap(playerCode) {
    console.log('[showGameRecap] Starting for player:', playerCode);
    try {
        // Fetch standings
        console.log('[showGameRecap] Fetching standings...');
        const standingsResponse = await fetch(`${API_BASE}/api/standings?gameId=${GAME_ID}`);
        const standingsData = await standingsResponse.json();
        const standings = standingsData.standings || [];
        console.log('[showGameRecap] Got standings:', standings.length, 'teams');
        
        if (standings.length === 0) {
            console.log('[showGameRecap] No standings, returning');
            return; // No standings to show
        }
        
        // Find current player's team
        const playerTeam = standings.find(s => s.player_code === playerCode);
        console.log('[showGameRecap] Player team:', playerTeam);
        if (!playerTeam) {
            console.log('[showGameRecap] Player not in standings, returning');
            return; // Player not in standings
        }
        
        const placement = standings.indexOf(playerTeam) + 1;
        const totalTeams = standings.length;
        console.log('[showGameRecap] Placement:', placement, 'of', totalTeams);
        
        // Fetch player's athlete results to find top scorer
        const resultsResponse = await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`);
        const resultsData = await resultsResponse.json();
        const allResults = resultsData.scored || resultsData.results || [];
        console.log('[showGameRecap] All results:', allResults.length, 'athletes');
        
        // Get player's team athletes - try salary-cap-draft first, then draft
        let teamAthletes = [];
        try {
            const teamResponse = await fetch(`${API_BASE}/api/salary-cap-draft?gameId=${GAME_ID}&playerCode=${playerCode}`);
            const teamData = await teamResponse.json();
            console.log('[showGameRecap] Team data response:', teamData);
            
            // Check multiple possible formats
            if (teamData.team && (teamData.team.men || teamData.team.women)) {
                // Format: { team: { men: [...], women: [...] } }
                teamAthletes = [...(teamData.team.men || []), ...(teamData.team.women || [])];
            } else if (teamData[playerCode] && (teamData[playerCode].men || teamData[playerCode].women)) {
                // Format: { "Team Name": { men: [...], women: [...] } }
                teamAthletes = [...(teamData[playerCode].men || []), ...(teamData[playerCode].women || [])];
            } else if (teamData.teams && teamData.teams[playerCode]) {
                // Draft format: { teams: { "PLAYER_CODE": [...] } }
                teamAthletes = teamData.teams[playerCode];
            }
            console.log('[showGameRecap] Team athletes:', teamAthletes);
        } catch (e) {
            console.error('Error fetching team:', e);
        }
        
        // Find player's results and top scorer
        const teamAthleteIds = teamAthletes.map(a => a.id);
        console.log('[showGameRecap] Team athlete IDs:', teamAthleteIds);
        const playerResults = allResults.filter(r => teamAthleteIds.includes(r.athlete_id || r.id));
        console.log('[showGameRecap] Filtered player results:', playerResults);
        
        let topScorer = null;
        let topPoints = 0;
        playerResults.forEach(r => {
            const points = r.total_points || 0;
            if (points > topPoints) {
                topPoints = points;
                topScorer = {
                    name: r.name || teamAthletes.find(a => a.id === r.athlete_id)?.name,
                    points: points
                };
            }
        });
        
        // Count podium finishes (top 3)
        const podiumCount = playerResults.filter(r => r.placement && r.placement <= 3).length;
        
        // Generate placement message
        let placementHTML = '';
        const medal = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '';
        
        if (placement === 1) {
            placementHTML = `
                <div style="font-size: 64px; margin-bottom: 16px;">🥇</div>
                <h3 style="font-size: 28px; color: var(--primary-orange); margin: 0;">
                    Congratulations, Champion!
                </h3>
                <p style="font-size: 18px; color: #64748b; margin-top: 8px;">
                    You finished in <strong>1st place</strong> with <strong>${playerTeam.total_points} points</strong>!
                </p>
            `;
        } else if (placement === 2) {
            placementHTML = `
                <div style="font-size: 64px; margin-bottom: 16px;">🥈</div>
                <h3 style="font-size: 28px; color: #94a3b8; margin: 0;">
                    Amazing Performance!
                </h3>
                <p style="font-size: 18px; color: #64748b; margin-top: 8px;">
                    You finished in <strong>2nd place</strong> with <strong>${playerTeam.total_points} points</strong>
                </p>
            `;
        } else if (placement === 3) {
            placementHTML = `
                <div style="font-size: 64px; margin-bottom: 16px;">🥉</div>
                <h3 style="font-size: 28px; color: #cd7f32; margin: 0;">
                    Great Job!
                </h3>
                <p style="font-size: 18px; color: #64748b; margin-top: 8px;">
                    You finished in <strong>3rd place</strong> with <strong>${playerTeam.total_points} points</strong>
                </p>
            `;
        } else {
            placementHTML = `
                <h3 style="font-size: 28px; color: var(--primary-blue); margin: 0;">
                    Thanks for Competing!
                </h3>
                <p style="font-size: 18px; color: #64748b; margin-top: 8px;">
                    You finished in <strong>#${placement}</strong> of ${totalTeams} teams with <strong>${playerTeam.total_points} points</strong>
                </p>
            `;
        }
        
        // Generate stats
        console.log('[showGameRecap] Player results:', playerResults);
        const athletesFinished = playerResults.filter(r => {
            // Check multiple possible field names
            return r.finish_time || r.finish_time_ms || r.finishTime || r.total_points > 0;
        }).length;
        console.log('[showGameRecap] Athletes finished:', athletesFinished, 'out of', playerResults.length);
        
        const statsHTML = `
            <h4 style="margin: 0 0 16px 0; color: #1e293b;">Your Team Stats</h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; text-align: center;">
                <div>
                    <div style="font-size: 32px; font-weight: bold; color: var(--primary-blue);">${playerTeam.total_points}</div>
                    <div style="font-size: 14px; color: #64748b;">Total Points</div>
                </div>
                <div>
                    <div style="font-size: 32px; font-weight: bold; color: var(--primary-orange);">${athletesFinished}</div>
                    <div style="font-size: 14px; color: #64748b;">Athletes Finished</div>
                </div>
            </div>
        `;
        
        // Generate highlights
        let highlightsHTML = '<h4 style="margin: 0 0 12px 0; color: #1e293b;">Team Highlights</h4><ul style="margin: 0; padding-left: 20px; text-align: left;">';
        let hasHighlights = false;
        
        // Top scorer
        if (topScorer && topScorer.name) {
            highlightsHTML += `<li style="margin-bottom: 8px;">🌟 <strong>${topScorer.name}</strong> was your top scorer with ${topScorer.points} points</li>`;
            hasHighlights = true;
        }
        
        // Podium finishes
        if (podiumCount > 0) {
            highlightsHTML += `<li style="margin-bottom: 8px;">🏆 ${podiumCount} athlete${podiumCount > 1 ? 's' : ''} finished on the podium (top 3)</li>`;
            hasHighlights = true;
        }
        
        // Team wins
        if (playerTeam.wins > 0) {
            highlightsHTML += `<li style="margin-bottom: 8px;">🥇 ${playerTeam.wins} race win${playerTeam.wins > 1 ? 's' : ''}</li>`;
            hasHighlights = true;
        }
        
        // Add message if no highlights
        if (!hasHighlights) {
            highlightsHTML += `<li style="margin-bottom: 8px; color: #64748b;">Check out the full standings to see how everyone performed!</li>`;
        }
        
        highlightsHTML += '</ul>';
        
        console.log('[showGameRecap] Populating modal elements...');
        // Populate modal
        const recapPlacement = document.getElementById('recap-placement');
        const recapStats = document.getElementById('recap-stats');
        const recapHighlights = document.getElementById('recap-highlights');
        
        console.log('[showGameRecap] Elements found:', {
            recapPlacement: !!recapPlacement,
            recapStats: !!recapStats,
            recapHighlights: !!recapHighlights
        });
        
        if (recapPlacement) recapPlacement.innerHTML = placementHTML;
        if (recapStats) recapStats.innerHTML = statsHTML;
        if (recapHighlights) recapHighlights.innerHTML = highlightsHTML;
        
        // Show modal with proper centering
        const modal = document.getElementById('game-recap-modal');
        console.log('[showGameRecap] Modal element:', modal);
        console.log('[showGameRecap] Modal current classes:', modal?.className);
        
        if (modal) {
            modal.classList.add('active');
            modal.style.display = ''; // Remove inline display:none
            console.log('[showGameRecap] Added active class, new classes:', modal.className);
            document.body.style.overflow = 'hidden';
            
            // Wire up close button (navigates to leaderboard)
            const closeButton = document.getElementById('close-recap');
            if (closeButton) {
                closeButton.onclick = () => closeGameRecap(true);
                console.log('[showGameRecap] Attached click handler to close button');
            }
            
            // Wire up overlay (just close modal)
            const overlay = modal.querySelector('.modal-overlay');
            if (overlay) {
                overlay.onclick = () => closeGameRecap(false);
                console.log('[showGameRecap] Attached click handler to overlay');
            }
            
            if (!modal.dataset.recapClickListener) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        closeGameRecap(false);
                    }
                });
                modal.dataset.recapClickListener = 'true';
            }
            
            if (!gameRecapEscapeHandler) {
                gameRecapEscapeHandler = (event) => {
                    if (event.key === 'Escape') {
                        closeGameRecap(false);
                    }
                };
                document.addEventListener('keydown', gameRecapEscapeHandler);
                console.log('[showGameRecap] Escape key handler attached');
            }
            
            // Start confetti (will auto-stop after 5 seconds)
            console.log('[showGameRecap] Starting confetti...');
            createConfetti();
            
            // Mark as seen
            console.log('[showGameRecap] Marking as seen...');
            markGameRecapSeen(playerCode);
            console.log('[showGameRecap] COMPLETE - Modal should be visible now!');
        } else {
            console.error('[showGameRecap] Modal element not found!');
        }
        
    } catch (error) {
        console.error('Error showing game recap:', error);
    }
}

/**
 * Close game recap modal
 * @param {boolean} navigateToLeaderboard - whether to jump to standings after closing
 */
function closeGameRecap(navigateToLeaderboard = false) {
    const modal = document.getElementById('game-recap-modal');
    if (!modal) {
        return;
    }

    modal.classList.remove('active');
    modal.style.display = 'none'; // Set back to display:none
    document.body.style.overflow = '';
    
    // Remove escape handler if attached
    if (gameRecapEscapeHandler) {
        document.removeEventListener('keydown', gameRecapEscapeHandler);
        gameRecapEscapeHandler = null;
    }
    
    // Clear confetti
    const canvas = document.getElementById('confetti-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    if (navigateToLeaderboard) {
        showPage('leaderboard-page');
        displayLeaderboard().catch(err => {
            console.error('Error loading leaderboard:', err);
        });
    }
}

/**
 * Check and show game recap if appropriate
 */
async function checkAndShowGameRecap() {
    console.log('=== checkAndShowGameRecap called ===');
    
    // Try to get player code from session storage (Next.js version) or gameState (old version)
    let playerCode = null;
    try {
        const sessionData = localStorage.getItem('marathon_fantasy_team');
        if (sessionData) {
            const session = JSON.parse(sessionData);
            playerCode = session.playerCode;
        }
    } catch (e) {
        console.log('Could not get playerCode from localStorage, trying gameState');
    }
    
    // Fallback to gameState.currentPlayer if localStorage doesn't have it
    if (!playerCode && gameState.currentPlayer) {
        playerCode = gameState.currentPlayer;
    }
    
    console.log('Player code:', playerCode);
    
    // Only show for players (not commissioners)
    if (!playerCode) {
        console.log('No player code found, skipping recap');
        return;
    }
    
    // Only show if player hasn't seen it yet
    const alreadySeen = hasSeenGameRecap(playerCode);
    console.log('Has player already seen recap?', alreadySeen);
    if (alreadySeen) {
        console.log('Player has already seen recap, skipping. To test again, run: localStorage.removeItem("gameRecap_' + GAME_ID + '_' + playerCode + '")');
        return;
    }
    
    try {
        // Fetch game state to check if results are finalized
        console.log('Fetching game state from API...');
        const response = await fetch(`${API_BASE}/api/game-state?gameId=${GAME_ID}`);
        const data = await response.json();
        const isFinalized = data.resultsFinalized || false;
        
        console.log('Game finalized status:', isFinalized);
        console.log('Full game state data:', data);
        
        // Only show if results are finalized
        if (!isFinalized) {
            console.log('Results not finalized yet');
            return;
        }
        
        // Update local state
        gameState.resultsFinalized = isFinalized;
        
        // Show the recap
        console.log('Showing game recap for player:', playerCode);
        await showGameRecap(playerCode);
    } catch (error) {
        console.error('Error checking game recap:', error);
    }
}

// Make functions available globally
window.viewTeamDetails = viewTeamDetails;
window.closeTeamDetails = closeTeamDetails;
window.showPointsInfo = showPointsInfo;
window.closePointsInfo = closePointsInfo;
window.checkAndShowGameRecap = checkAndShowGameRecap;
window.closeGameRecap = closeGameRecap;
window.restoreSession = restoreSession;
window.updateFooterButtons = updateFooterButtons;
window.anonymousSession = anonymousSession;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

} // End of legacy mode guard
