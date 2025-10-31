// Game State
let gameState = {
    athletes: { men: [], women: [] },
    players: [],
    currentPlayer: null,
    rankings: {},
    teams: {},
    results: {},
    draftComplete: false,
    resultsFinalized: false
};

// Anonymous Session Management (for teams)
let anonymousSession = {
    token: null,
    teamName: null,
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

// View state for ranking page
let rankingViewState = {
    currentGender: 'men'
};

// API base URL - will be relative in production
const API_BASE = window.location.origin === 'null' ? '' : window.location.origin;

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
async function loadGameState() {
    try {
        const response = await fetch(`${API_BASE}/api/game-state?gameId=${GAME_ID}`);
        if (response.ok) {
            const data = await response.json();
            gameState.players = data.players || [];
            gameState.draftComplete = data.draftComplete || false;
            gameState.resultsFinalized = data.resultsFinalized || false;
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
                resultsFinalized: gameState.resultsFinalized
            })
        });
    } catch (error) {
        console.error('Error saving game state:', error);
    }
}

// Load athletes data
async function loadAthletes() {
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
        console.log(`Loaded ${athletes.men.length} men and ${athletes.women.length} women athletes from database`);
        
    } catch (error) {
        console.error('Error loading athletes:', error);
        
        // Show user-friendly error message
        const errorMessage = `
            <div style="padding: 20px; background: #fee; border: 2px solid #c33; border-radius: 8px; margin: 20px;">
                <h3 style="color: #c33; margin-top: 0;">⚠️ Unable to Load Athletes</h3>
                <p><strong>Error:</strong> ${error.message}</p>
                <p>The database may not be initialized yet. Please try one of the following:</p>
                <ol>
                    <li>Wait a few moments and refresh the page</li>
                    <li>Contact the commissioner to initialize the database</li>
                    <li>Visit <code>/api/init-db</code> to manually initialize</li>
                </ol>
            </div>
        `;
        
        // Display error in the UI
        const mainContent = document.querySelector('main') || document.body;
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = errorMessage;
        mainContent.insertBefore(errorDiv, mainContent.firstChild);
        
        // Set empty arrays to prevent further errors
        gameState.athletes = { men: [], women: [] };
    }
}

// Initialize the app
async function init() {
    console.log('[App Init] Starting application initialization...');
    console.log('[App Init] Current localStorage keys:', Object.keys(localStorage));
    console.log('[App Init] Team session key exists:', !!localStorage.getItem(TEAM_SESSION_KEY));
    console.log('[App Init] Commissioner session key exists:', !!localStorage.getItem(COMMISSIONER_SESSION_KEY));
    
    // Setup UI immediately for faster perceived load time
    setupEventListeners();
    setupAthleteModal();
    
    // Show landing page immediately (will be hidden if session exists)
    showPage('landing-page');
    
    // Load critical data in parallel
    const gameStatePromise = loadGameState();
    
    // Try to restore session immediately (only needs gameState, not athletes)
    await gameStatePromise;
    const hasSession = await restoreSession();
    
    console.log('[App Init] Session restoration complete. Has session:', hasSession);
    
    // Load athletes in background (only needed for ranking page)
    loadAthletes().catch(error => {
        console.error('Failed to load athletes:', error);
    });
    
    // If no session restored, show welcome card
    if (!hasSession) {
        console.log('[App Init] No session found, showing welcome card');
        showWelcomeCard();
    } else {
        console.log('[App Init] Session restored, welcome card hidden');
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
                if (confirm(`Switch to ${newGameId === 'demo-game' ? 'Demo Game' : 'Default Game'}? This will reload the page.`)) {
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
        // Reload game state to get latest results
        await loadGameState();
        displayTeams();
        showPage('teams-page');
    });

    // Teams page
    document.getElementById('back-to-landing').addEventListener('click', () => showPage('landing-page'));
    
    // Leaderboard page
    document.getElementById('view-leaderboard-btn')?.addEventListener('click', async () => {
        await displayLeaderboard();
        showPage('leaderboard-page');
    });
    document.getElementById('view-leaderboard-from-roster')?.addEventListener('click', async () => {
        await displayLeaderboard();
        showPage('leaderboard-page');
    });
    document.getElementById('back-to-roster')?.addEventListener('click', () => showPage('salary-cap-draft-page'));
    
    // Leaderboard tab switching
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.addEventListener('click', async (e) => {
            const tabType = e.target.dataset.tab;
            
            // Update active tab
            document.querySelectorAll('.leaderboard-tab').forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.leaderboard-tab-content').forEach(c => c.classList.remove('active'));
            
            if (tabType === 'fantasy') {
                document.getElementById('fantasy-results-tab').classList.add('active');
                await displayLeaderboard();
            } else if (tabType === 'race') {
                document.getElementById('race-results-tab').classList.add('active');
                await displayRaceResultsLeaderboard();
            }
        });
    });

    // Commissioner page
    document.getElementById('run-draft').addEventListener('click', handleRunDraft);
    document.getElementById('update-results').addEventListener('click', handleUpdateResults);
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
        
        // Save session to state and localStorage
        anonymousSession = {
            token: data.session.token,
            teamName: teamName,
            ownerName: ownerName || null,
            expiresAt: data.session.expiresAt
        };
        
        localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(anonymousSession));
        
        // Set as current player
        gameState.currentPlayer = teamName;
        document.getElementById('player-name').textContent = teamName;
        
        // Add to players list if not already there
        if (!gameState.players.includes(teamName)) {
            gameState.players.push(teamName);
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
                setupResultsForm();
                updateLiveStandings();
                
                // Update button states
                if (gameState.resultsFinalized) {
                    document.getElementById('update-results').textContent = 'Results Finalized';
                    document.getElementById('update-results').disabled = true;
                    document.getElementById('finalize-results').style.display = 'none';
                } else {
                    document.getElementById('update-results').textContent = 'Update Live Results';
                    document.getElementById('update-results').disabled = false;
                    if (Object.keys(gameState.results).length > 0) {
                        document.getElementById('finalize-results').style.display = 'inline-block';
                    }
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
            
            // Save session to state and localStorage
            anonymousSession = {
                token: token,
                teamName: data.session.displayName,
                ownerName: null,
                expiresAt: data.session.expiresAt
            };
            
            localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(anonymousSession));
            
            // Set as current player
            gameState.currentPlayer = anonymousSession.teamName;
            document.getElementById('player-name').textContent = anonymousSession.teamName;
            
            hideWelcomeCard();  // Hide welcome card after session verified
            
            console.log('Game state:', gameState);
            console.log('Draft complete?', gameState.draftComplete);
            console.log('Has rankings?', !!gameState.rankings[anonymousSession.teamName]);
            
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
                anonymousSession = { token: null, teamName: null, ownerName: null, expiresAt: null };
            } else {
                console.log('[Session Restore] Team session is valid, expires at:', session.expiresAt);
                anonymousSession = session;
                gameState.currentPlayer = session.teamName;
                document.getElementById('player-name').textContent = session.teamName;
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
    
    console.log('updateFooterButtons called, session token:', anonymousSession.token ? 'exists' : 'none');
    console.log('Commissioner session:', commissionerSession.isCommissioner ? 'active' : 'none');
    
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
        const commissionerBtn = footer.querySelector('.btn[onclick*="showCommissionerTOTPModal"]') || 
                                 footer.querySelector('.btn:last-child');
        
        if (commissionerBtn) {
            // Insert before the commissioner button
            commissionerBtn.insertAdjacentElement('beforebegin', copyUrlBtn);
            commissionerBtn.insertAdjacentElement('beforebegin', logoutBtn);
            console.log('Buttons inserted before commissioner button');
        } else {
            // Fallback: append to footer
            footer.appendChild(logoutBtn);
            footer.appendChild(copyUrlBtn);
            console.log('Buttons appended to footer (fallback)');
        }
    } else if (commissionerSession.isCommissioner) {
        console.log('Adding logout button for commissioner session');
        // Commissioner is logged in - show logout button
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logout-button';
        logoutBtn.className = 'btn btn-secondary';
        logoutBtn.textContent = 'Logout';
        logoutBtn.addEventListener('click', handleCommissionerLogout);
        
        // Insert before the commissioner mode button
        const commissionerBtn = footer.querySelector('.btn[onclick*="showCommissionerTOTPModal"]') || 
                                 footer.querySelector('.btn:last-child');
        
        if (commissionerBtn) {
            commissionerBtn.insertAdjacentElement('beforebegin', logoutBtn);
            console.log('Commissioner logout button inserted');
        } else {
            footer.appendChild(logoutBtn);
            console.log('Commissioner logout button appended (fallback)');
        }
    }
}

// Handle team logout
function handleLogout() {
    if (confirm('Are you sure you want to logout? Make sure you have saved your team URL!')) {
        console.log('[Team Logout] User confirmed team logout');
        console.log('[Team Logout] Clearing team session, preserving commissioner session');
        
        // Clear team session ONLY (don't touch commissioner session)
        localStorage.removeItem(TEAM_SESSION_KEY);
        anonymousSession = { token: null, teamName: null, ownerName: null, expiresAt: null };
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
        // Setup results form if draft is complete
        if (gameState.draftComplete) {
            setupResultsForm();
            updateLiveStandings();
            
            // Update button states based on finalized state
            if (gameState.resultsFinalized) {
                document.getElementById('update-results').textContent = 'Results Finalized';
                document.getElementById('update-results').disabled = true;
                document.getElementById('finalize-results').style.display = 'none';
            } else {
                document.getElementById('update-results').textContent = 'Update Live Results';
                document.getElementById('update-results').disabled = false;
                if (Object.keys(gameState.results).length > 0) {
                    document.getElementById('finalize-results').style.display = 'inline-block';
                } else {
                    document.getElementById('finalize-results').style.display = 'none';
                }
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
    display.innerHTML = '<h4>Share these unique URLs with your players:</h4>';
    
    for (const code of gameState.players) {
        const hasSubmitted = hasPlayerSubmittedRankings(code);
        
        const item = document.createElement('div');
        item.className = `player-code-item ${hasSubmitted ? 'submitted' : 'pending'}`;
        
        const statusIcon = document.createElement('span');
        statusIcon.className = 'status-icon';
        statusIcon.textContent = hasSubmitted ? '✓' : '○';
        
        // Create anonymous session for player
        try {
            const response = await fetch(`${API_BASE}/api/session/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionType: 'player',
                    displayName: code,
                    gameId: GAME_ID,
                    playerCode: code,
                    expiryDays: 90
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const uniqueURL = data.uniqueUrl;
                const sessionToken = uniqueURL.split('?session=')[1];
                
                const contentWrapper = document.createElement('div');
                contentWrapper.className = 'player-code-content';
                
                // First row: Team name and clickable UUID
                const topRow = document.createElement('div');
                topRow.className = 'player-code-top-row';
                
                const codeLabel = document.createElement('strong');
                codeLabel.textContent = `${code}: `;
                
                const urlLink = document.createElement('a');
                urlLink.className = 'session-link';
                urlLink.href = uniqueURL;
                urlLink.target = '_blank';
                urlLink.textContent = sessionToken;
                
                topRow.appendChild(codeLabel);
                topRow.appendChild(urlLink);
                
                // Second row: Copy button and status
                const bottomRow = document.createElement('div');
                bottomRow.className = 'player-code-bottom-row';
                
                const copyButton = document.createElement('button');
                copyButton.className = 'btn-copy-small';
                copyButton.textContent = '📋 Copy Link';
                copyButton.onclick = () => {
                    navigator.clipboard.writeText(uniqueURL).then(() => {
                        copyButton.textContent = '✅ Copied!';
                        setTimeout(() => {
                            copyButton.textContent = '📋 Copy Link';
                        }, 2000);
                    }).catch(err => {
                        console.error('Failed to copy:', err);
                        alert('Failed to copy URL. Please copy manually.');
                    });
                };
                
                const statusText = document.createElement('span');
                statusText.className = 'status-text';
                statusText.textContent = hasSubmitted ? 'Rankings submitted' : 'Pending';
                
                bottomRow.appendChild(copyButton);
                bottomRow.appendChild(statusText);
                
                contentWrapper.appendChild(topRow);
                contentWrapper.appendChild(bottomRow);
                
                item.appendChild(statusIcon);
                item.appendChild(contentWrapper);
            } else {
                // Fallback to legacy code display
                const codeText = document.createElement('span');
                codeText.textContent = `${code} - ${window.location.origin}${window.location.pathname}?player=${code}`;
                item.appendChild(statusIcon);
                item.appendChild(codeText);
            }
        } catch (error) {
            console.error('Error creating player session:', error);
            // Fallback to legacy code display
            const codeText = document.createElement('span');
            codeText.textContent = `${code}`;
            item.appendChild(statusIcon);
            item.appendChild(codeText);
        }
        
        display.appendChild(item);
    }
    
    // Add summary
    const submittedCount = gameState.players.filter(code => hasPlayerSubmittedRankings(code)).length;
    
    const summary = document.createElement('div');
    summary.className = 'rankings-summary';
    summary.innerHTML = `<strong>${submittedCount} of ${gameState.players.length} players have submitted rankings</strong>`;
    display.appendChild(summary);
}

async function displayTeamsTable() {
    const tableBody = document.getElementById('teams-status-table-body');
    tableBody.innerHTML = '';
    
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
        const viewButton = document.createElement('button');
        viewButton.className = 'btn-mini';
        viewButton.textContent = 'View';
        viewButton.disabled = true; // Disable until feature is implemented
        viewButton.style.opacity = '0.5';
        viewButton.style.cursor = 'not-allowed';
        viewButton.title = 'Team details coming in a future update';
        actionsCell.appendChild(viewButton);
        row.appendChild(actionsCell);
        
        tableBody.appendChild(row);
    });
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

// Display leaderboard with team rankings
async function displayLeaderboard() {
    const container = document.getElementById('leaderboard-display');
    container.innerHTML = '<div class="loading-spinner">Loading leaderboard...</div>';

    try {
        // First check if there are any race results for this game
        const resultsResponse = await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`);
        const resultsData = await resultsResponse.json();
        
        const hasResults = resultsData && Object.keys(resultsData).length > 0;
        
        if (!hasResults) {
            container.innerHTML = '<p>No race results available yet. Check back once the race begins!</p>';
            return;
        }

        // Fetch standings from API
        const response = await fetch(`${API_BASE}/api/standings?gameId=${GAME_ID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch standings');
        }
        
        const data = await response.json();
        const standings = data.standings || [];
        
        if (standings.length === 0) {
            container.innerHTML = '<p>No standings available yet.</p>';
            return;
        }

        // Find current player's rank
        const currentPlayerCode = anonymousSession.teamName || gameState.currentPlayer;
        const currentPlayerStanding = standings.find(s => s.player_code === currentPlayerCode);
        const currentPlayerRank = currentPlayerStanding ? currentPlayerStanding.rank : null;

        // Build leaderboard HTML
        let leaderboardHTML = '<div class="leaderboard-container">';
        
        // Determine which teams to show
        const TOP_COUNT = 3;
        const showEllipsis = standings.length > TOP_COUNT + 1 && currentPlayerRank && currentPlayerRank > TOP_COUNT + 1;
        
        standings.forEach((standing, index) => {
            const rank = standing.rank;
            const isCurrentPlayer = standing.player_code === currentPlayerCode;
            const isTop3 = rank <= TOP_COUNT;
            
            // Show top 3, current player (if not in top 3), and ellipsis when needed
            if (isTop3 || isCurrentPlayer) {
                // Show ellipsis before current player if needed
                if (isCurrentPlayer && showEllipsis && rank > TOP_COUNT + 1) {
                    leaderboardHTML += '<div class="leaderboard-ellipsis">...</div>';
                }
                
                leaderboardHTML += createLeaderboardRow(standing, isCurrentPlayer);
            }
        });
        
        leaderboardHTML += '</div>';
        
        container.innerHTML = leaderboardHTML;
        
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

// Display race results (actual athlete performance)
async function displayRaceResultsLeaderboard() {
    console.log('🔥 displayRaceResultsLeaderboard v1.0 called');
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
        
        // Fetch race results
        const response = await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch race results');
        }
        
        const resultsData = await response.json();
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
        
        // Separate men and women results using the map
        const menResults = [];
        const womenResults = [];
        const otherResults = [];
        
        scoredResults.forEach(result => {
            const athlete = athletesById.get(result.athlete_id);
            if (athlete) {
                if (athlete.gender === 'men') {
                    menResults.push(result);
                } else if (athlete.gender === 'women') {
                    womenResults.push(result);
                } else {
                    otherResults.push(result);
                }
            }
        });

        // Sort by placement (already sorted from API, but ensure it)
        menResults.sort((a, b) => (a.placement || 999) - (b.placement || 999));
        womenResults.sort((a, b) => (a.placement || 999) - (b.placement || 999));
        otherResults.sort((a, b) => (a.placement || 999) - (b.placement || 999));

        // Build race results HTML
        let resultsHTML = '<div class="race-results-container">';
        
        // Men's Results
        if (menResults.length > 0) {
            resultsHTML += '<div class="race-gender-section">';
            resultsHTML += '<h3 class="gender-header">Men\'s Results</h3>';
            resultsHTML += '<div class="race-results-list">';
            
            menResults.forEach(result => {
                const athlete = athletesById.get(result.athlete_id);
                if (athlete) {
                    resultsHTML += createRaceResultRow(result, athlete);
                }
            });
            
            resultsHTML += '</div></div>';
        }

        // Women's Results
        if (womenResults.length > 0) {
            resultsHTML += '<div class="race-gender-section">';
            resultsHTML += '<h3 class="gender-header">Women\'s Results</h3>';
            resultsHTML += '<div class="race-results-list">';
            
            womenResults.forEach(result => {
                const athlete = athletesById.get(result.athlete_id);
                if (athlete) {
                    resultsHTML += createRaceResultRow(result, athlete);
                }
            });
            
            resultsHTML += '</div></div>';
        }

        if (otherResults.length > 0) {
            resultsHTML += '<div class="race-gender-section">';
            resultsHTML += '<h3 class="gender-header">Additional Results</h3>';
            resultsHTML += '<div class="race-results-list">';
            otherResults.forEach(result => {
                const athlete = athletesById.get(result.athlete_id);
                if (athlete) {
                    resultsHTML += createRaceResultRow(result, athlete);
                }
            });
            resultsHTML += '</div></div>';
        }

        resultsHTML += '</div>';
        container.innerHTML = resultsHTML;
        
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

// Create a single race result row
function createRaceResultRow(result, athlete) {
    const placement = result.placement || '-';
    const finishTime = result.finish_time || 'DNF';
    const points = result.total_points || 0;
    const medal = placement === 1 ? '🥇' : placement === 2 ? '🥈' : placement === 3 ? '🥉' : '';
    
    // Calculate gap from winner if available
    let gapFromFirst = '';
    if (result.breakdown && result.breakdown.time_gap) {
        const gapSeconds = result.breakdown.time_gap.gap_seconds || 0;
        if (gapSeconds > 0) {
            const minutes = Math.floor(gapSeconds / 60);
            const seconds = Math.floor(gapSeconds % 60);
            gapFromFirst = `+${minutes}:${seconds.toString().padStart(2, '0')}`;
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

    return `
        <div class="race-result-row" onclick="openAthleteModal(${JSON.stringify(athlete).replace(/"/g, '&quot;')})">
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
                <div class="finish-time">${finishTime}</div>
                ${gapFromFirst ? `<div class="time-gap">${gapFromFirst}</div>` : ''}
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

function createTeamCard(player, team, showScore = false) {
    const card = document.createElement('div');
    card.className = 'team-card';

    const title = document.createElement('h3');
    title.textContent = player;
    card.appendChild(title);

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
                // Fallback to legacy time-based display
                displayLegacyScore(card, player, team);
            }
        }).catch(err => {
            console.error('Error displaying points score:', err);
            displayLegacyScore(card, player, team);
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

// Helper to display legacy time-based score
function displayLegacyScore(card, player, team) {
    const averageTime = calculateAverageTime(team);
    
    // Calculate team rankings
    const allScores = {};
    Object.entries(gameState.teams).forEach(([p, t]) => {
        allScores[p] = calculateTeamScore(t);
    });
    const sortedTeams = Object.entries(allScores).sort((a, b) => a[1] - b[1]);
    const rank = sortedTeams.findIndex(([p, s]) => p === player) + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    
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
        <div>Average Finish Time: ${averageTime}</div>
    `;
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
            if (/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/.test(time)) {
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
            alert('Invalid time format detected. Please use HH:MM:SS format (e.g., 2:05:30 or 0:14:30).\n\nFields with invalid format:\n' + invalidFields.slice(0, 5).join('\n') + (invalidFields.length > 5 ? '\n... and ' + (invalidFields.length - 5) + ' more' : ''));
        } else if (hasAnyValues) {
            alert('Please check the time format. Times should be in HH:MM:SS format (e.g., 2:05:30)');
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
        // Save results to database
        await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: gameState.results })
        });
        
        alert('Live results updated! Players can now see the current standings.');
    } catch (error) {
        console.error('Error saving results:', error);
        alert('Error saving results. Please check the console for details.');
    }
}

// Finalize results and crown winner
async function handleFinalizeResults() {
    if (!confirm('Are you sure you want to finalize the results? This will declare the winner and lock all results.')) {
        return;
    }

    const scores = {};
    const averageTimes = {};
    Object.entries(gameState.teams).forEach(([player, team]) => {
        scores[player] = calculateTeamScore(team);
        averageTimes[player] = calculateAverageTime(team);
    });

    // Find winner (lowest score wins in marathon)
    const winner = Object.entries(scores).reduce((best, [player, score]) => {
        if (!best || score < best.score) {
            return { player, score };
        }
        return best;
    }, null);

    const display = document.getElementById('winner-display');
    display.innerHTML = `
        <h3>🏆 Winner: ${winner.player}</h3>
        <p>Average Finish Time: ${averageTimes[winner.player]}</p>
        <hr style="margin: 10px 0; border-color: rgba(255,255,255,0.3);">
        ${Object.entries(scores).sort((a, b) => a[1] - b[1]).map(([player, score], i) => 
            `<div>${i + 1}. ${player}: ${averageTimes[player]}</div>`
        ).join('')}
    `;

    // Mark results as finalized
    gameState.resultsFinalized = true;
    
    // Hide the finalize button and update button text
    document.getElementById('finalize-results').style.display = 'none';
    document.getElementById('update-results').textContent = 'Results Finalized';
    document.getElementById('update-results').disabled = true;

    try {
        // Save finalized state
        await saveGameState();
        
        // Save results to database
        await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ results: gameState.results })
        });
    } catch (error) {
        console.error('Error saving results:', error);
    }
}

// Update live standings display with points-based scoring
async function updateLiveStandings() {
    const display = document.getElementById('live-standings');
    
    if (Object.keys(gameState.results).length === 0) {
        display.innerHTML = '';
        return;
    }

    try {
        // Fetch standings from API (includes points calculations)
        const response = await fetch(`${API_BASE}/api/standings?gameId=${GAME_ID}`);
        if (response.ok) {
            const data = await response.json();
            displayPointsStandings(data.standings, display);
        } else {
            // Fallback to legacy time-based standings
            displayLegacyStandings(display);
        }
    } catch (error) {
        console.error('Error fetching standings:', error);
        // Fallback to legacy time-based standings
        displayLegacyStandings(display);
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

// Legacy time-based standings (fallback)
function displayLegacyStandings(display) {
    const scores = {};
    const averageTimes = {};
    Object.entries(gameState.teams).forEach(([player, team]) => {
        scores[player] = calculateTeamScore(team);
        averageTimes[player] = calculateAverageTime(team);
    });

    const sortedTeams = Object.entries(scores).sort((a, b) => a[1] - b[1]);

    display.innerHTML = `
        <h4 style="margin-top: 20px;">Current Standings (Time-Based)</h4>
        <div style="background: var(--light-gray); padding: 15px; border-radius: 5px; margin-top: 10px;">
            ${sortedTeams.map(([player, score], i) => {
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
                return `<div style="padding: 8px 0; font-weight: ${i === 0 ? 'bold' : 'normal'}; color: ${i === 0 ? 'var(--primary-red)' : 'inherit'};">
                    ${medal} ${escapeHtml(player)}: ${averageTimes[player]}
                </div>`;
            }).join('')}
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

function calculateTeamScore(team) {
    let totalSeconds = 0;
    
    [...team.men, ...team.women].forEach(athlete => {
        const time = gameState.results[athlete.id];
        if (time) {
            totalSeconds += timeToSeconds(time);
        }
    });

    return totalSeconds;
}

function timeToSeconds(timeStr) {
    // Convert "HH:MM:SS" or "H:MM:SS" to seconds
    const parts = timeStr.split(':').map(p => parseInt(p, 10));
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
}

function secondsToTime(totalSeconds) {
    // Convert seconds to "H:MM:SS" format
    // Round to handle floating point precision
    const roundedSeconds = Math.round(totalSeconds);
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const seconds = roundedSeconds % 60;
    
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function calculateAverageTime(team) {
    const totalSeconds = calculateTeamScore(team);
    const numAthletes = team.men.length + team.women.length;
    
    if (numAthletes === 0) {
        return '0:00:00';
    }
    
    const averageSeconds = totalSeconds / numAthletes;
    return secondsToTime(averageSeconds);
}

function setupResultsForm() {
    const form = document.getElementById('results-form');
    form.innerHTML = '<h4>Enter Athlete Finish Times (HH:MM:SS - e.g., 2:05:30)</h4><p style="color: var(--dark-gray); font-size: 0.9em; margin-bottom: 15px;">Format: Hours:Minutes:Seconds (e.g., 2:15:45 or 0:14:30)</p>';

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
            
            // Check if format is valid (HH:MM:SS or H:MM:SS)
            if (/^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/.test(time)) {
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
            if (time && /^[0-9]{1,2}:[0-9]{2}:[0-9]{2}$/.test(time)) {
                gameState.results[athleteId] = time;
                // Auto-save to database
                try {
                    await fetch(`${API_BASE}/api/results?gameId=${GAME_ID}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ results: { [athleteId]: time } })
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

        // Clear displayed data
        document.getElementById('live-standings').innerHTML = '';
        document.getElementById('winner-display').innerHTML = '';
        
        // Re-setup the results form with empty values
        if (gameState.draftComplete) {
            setupResultsForm();
        }

        // Reset button states
        document.getElementById('update-results').textContent = 'Update Live Results';
        document.getElementById('update-results').disabled = false;
        document.getElementById('finalize-results').style.display = 'none';

        alert('Live results have been reset. You can now enter new times.');
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
            anonymousSession = { token: null, teamName: null, ownerName: null, expiresAt: null };

            // Clear any displayed data in commissioner dashboard
            document.getElementById('player-codes-display').innerHTML = '';
            document.getElementById('draft-status').innerHTML = '';
            document.getElementById('results-form').innerHTML = '';
            document.getElementById('winner-display').innerHTML = '';
            document.getElementById('live-standings').innerHTML = '';
            
            // Show success message with details
            alert(`Game reset complete!\n\nDeleted:\n- ${result.deleted.draftTeams} team rosters\n- ${result.deleted.playerRankings} player rankings\n- ${result.deleted.raceResults} race results\n- ${result.deleted.leagueStandings} standings entries\n- ${result.deleted.anonymousSessions} team sessions\n\nAll athlete data has been preserved.`);
            
            // Reload game state from database
            await loadGameState();
            
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
    
    if (athlete.headshotUrl) {
        photo.src = athlete.headshotUrl;
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
    document.getElementById('modal-athlete-name').textContent = athlete.name;
    document.getElementById('modal-athlete-country').textContent = getCountryFlagEmoji(athlete.country);
    document.getElementById('modal-athlete-gender').textContent = athlete.gender === 'men' ? 'Men' : 'Women';
    document.getElementById('modal-athlete-age').textContent = athlete.age ? `${athlete.age}yo` : 'Age N/A';
    
    // Masthead stats
    document.getElementById('modal-athlete-pb').textContent = athlete.pb || 'N/A';
    document.getElementById('modal-athlete-marathon-rank').textContent = athlete.marathonRank ? `#${athlete.marathonRank}` : 'N/A';
    
    // Overview tab stats (duplicated for overview section)
    document.getElementById('overview-pb').textContent = athlete.pb || 'N/A';
    document.getElementById('modal-athlete-sb').textContent = athlete.seasonBest || athlete.pb || 'N/A';
    document.getElementById('overview-marathon-rank').textContent = athlete.marathonRank ? `#${athlete.marathonRank}` : 'N/A';
    document.getElementById('modal-athlete-overall-rank').textContent = athlete.overallRank ? `#${athlete.overallRank}` : 'N/A';
    
    // Sponsor
    const sponsorSection = document.getElementById('modal-athlete-sponsor-section');
    if (athlete.sponsor) {
        document.getElementById('modal-athlete-sponsor').textContent = athlete.sponsor;
        sponsorSection.style.display = 'flex';
    } else {
        sponsorSection.style.display = 'none';
    }
    
    // Profile tab
    document.getElementById('modal-athlete-dob').textContent = athlete.dateOfBirth ? 
        new Date(athlete.dateOfBirth).toLocaleDateString() : 'N/A';
    document.getElementById('modal-athlete-wa-id').textContent = athlete.worldAthleticsId || 'N/A';
    document.getElementById('modal-athlete-road-rank').textContent = athlete.roadRunningRank ? 
        `#${athlete.roadRunningRank}` : 'N/A';
    
    // World Athletics link
    const waLink = document.getElementById('modal-wa-link');
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
    
    // Show loading states
    progressionLoading.style.display = 'block';
    resultsLoading.style.display = 'block';
    resultsDiv.innerHTML = '';
    progressionEmpty.style.display = 'none';
    resultsEmpty.style.display = 'none';
    if (chartContainer) chartContainer.style.display = 'none';
    if (selectedRaceInfo) selectedRaceInfo.style.display = 'none';
    
    try {
        // Fetch athlete profile with progression and results
        const response = await fetch(`${API_BASE}/api/athletes?id=${athleteId}&include=progression,results&year=2025`);
        if (!response.ok) throw new Error('Failed to load athlete data');
        
        const data = await response.json();
        
        // Hide loading spinners
        progressionLoading.style.display = 'none';
        resultsLoading.style.display = 'none';
        
        // Display progression data
        if (data.progression && data.progression.length > 0) {
            displayProgression(data.progression);
        } else {
            progressionEmpty.style.display = 'block';
        }
        
        // Display race results
        if (data.raceResults && data.raceResults.length > 0) {
            displayRaceResults(data.raceResults);
        } else {
            resultsEmpty.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error loading athlete details:', error);
        progressionLoading.style.display = 'none';
        resultsLoading.style.display = 'none';
        progressionEmpty.textContent = 'Error loading data';
        progressionEmpty.style.display = 'block';
        resultsEmpty.textContent = 'Error loading data';
        resultsEmpty.style.display = 'block';
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
        const totalPoints = teamResults.reduce((sum, r) => sum + (r.total_points || 0), 0);
        
        // Build modal content
        let modalHTML = `
            <div class="team-details-modal-overlay" id="team-details-overlay" onclick="closeTeamDetails()">
                <div class="team-details-modal" onclick="event.stopPropagation()">
                    <div class="team-details-header">
                        <h2>${escapeHtml(playerCode)}</h2>
                        <button class="modal-close-btn" onclick="closeTeamDetails()">×</button>
                    </div>
                    <div class="team-details-summary">
                        <div class="summary-stat">
                            <div class="stat-label">Total Points</div>
                            <div class="stat-value">${totalPoints}</div>
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
                const points = result ? result.total_points || 0 : 0;
                const placement = result ? result.placement : null;
                const breakdown = result ? result.breakdown : null;
                const finishTime = result ? result.finish_time : null;
                
                // Calculate gap from first place
                let gapFromFirst = '';
                if (result && breakdown && breakdown.time_gap) {
                    const gapSeconds = breakdown.time_gap.gap_seconds || 0;
                    if (gapSeconds > 0) {
                        const minutes = Math.floor(gapSeconds / 60);
                        const seconds = Math.floor(gapSeconds % 60);
                        gapFromFirst = `+${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                }
                
                // Create shorthand notation: P=placement, G=time gap, B=bonuses
                let shorthand = '';
                if (breakdown) {
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
                
                modalHTML += `
                    <div class="athlete-card">
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
                                ${placement ? `<span class="race-placement">#${placement}</span>` : ''}
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
                const points = result ? result.total_points || 0 : 0;
                const placement = result ? result.placement : null;
                const breakdown = result ? result.breakdown : null;
                const finishTime = result ? result.finish_time : null;
                
                // Calculate gap from first place
                let gapFromFirst = '';
                if (result && breakdown && breakdown.time_gap) {
                    const gapSeconds = breakdown.time_gap.gap_seconds || 0;
                    if (gapSeconds > 0) {
                        const minutes = Math.floor(gapSeconds / 60);
                        const seconds = Math.floor(gapSeconds % 60);
                        gapFromFirst = `+${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }
                }
                
                // Create shorthand notation
                let shorthand = '';
                if (breakdown) {
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
                
                modalHTML += `
                    <div class="athlete-card">
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
                                ${placement ? `<span class="race-placement">#${placement}</span>` : ''}
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
                            <span class="notation-desc"><strong>Performance Bonuses</strong> - +2 pts for negative split (faster 2nd half), +1 pt for even pace, +1 pt for fast finish kick</span>
                        </div>
                        <div class="notation-row">
                            <span class="notation-code">R#</span>
                            <span class="notation-desc"><strong>Record Bonuses</strong> - +15 pts for world record, +5 pts for course record (provisional until confirmed)</span>
                        </div>
                    </div>
                    <div class="notation-example">
                        <strong>Example:</strong> "P10+G5+B2" = 17 total points
                        <ul>
                            <li>10 pts for 1st place finish</li>
                            <li>+5 pts for finishing within 60 seconds of winner</li>
                            <li>+2 pts for performance bonuses (negative split)</li>
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

// Make functions available globally
window.viewTeamDetails = viewTeamDetails;
window.closeTeamDetails = closeTeamDetails;
window.showPointsInfo = showPointsInfo;
window.closePointsInfo = closePointsInfo;
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
