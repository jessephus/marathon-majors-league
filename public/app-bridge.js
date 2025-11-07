/**
 * App Bridge Module
 * 
 * Shared utilities between SSR landing page and legacy app.js monolith.
 * 
 * Purpose:
 * - Provides minimal functions needed for SSR landing page without loading full monolith
 * - Eliminates code duplication between inline scripts and app.js
 * - Serves as temporary bridge before Phase 1 modularization (see PROCESS_MONOLITH_AUDIT.md)
 * 
 * Lifecycle:
 * - Created: November 2025 (PR #107 - Landing Page SSR)
 * - Will be absorbed into Phase 1 utility extraction (utils/ui-helpers.js)
 * 
 * Related:
 * - Issue #82: Componentization
 * - PROCESS_MONOLITH_AUDIT.md: Phase 0 bridge module
 * - MIGRATION_LANDING_PAGE_SSR.md: SSR implementation details
 */

// ============================================================================
// CONSTANTS
// ============================================================================

const API_BASE = window.location.origin;
let GAME_ID = 'default'; // Made mutable for game switching
const TEAM_SESSION_KEY = 'marathon_fantasy_team';
const COMMISSIONER_SESSION_KEY = 'marathon_fantasy_commissioner';

// Initialize GAME_ID from localStorage if available
if (typeof localStorage !== 'undefined') {
    const savedGameId = localStorage.getItem('current_game_id');
    if (savedGameId) {
        GAME_ID = savedGameId;
    }
}

// ============================================================================
// GAME MANAGEMENT
// ============================================================================

/**
 * Switch to a different game
 * @param {string} gameId - ID of game to switch to
 */
function switchGame(gameId) {
    GAME_ID = gameId;
    localStorage.setItem('current_game_id', gameId);
    
    // Reload to fetch new game data
    location.reload();
}

/**
 * Initialize game switcher dropdown
 */
function initializeGameSwitcher() {
    const gameSelect = document.getElementById('game-select');
    if (!gameSelect) {
        console.log('[App Bridge] Game select element not found');
        return;
    }

    // Set current game in dropdown
    gameSelect.value = GAME_ID;
    console.log('[App Bridge] Set game select to:', GAME_ID);

    // Remove existing listener if any
    const newGameSelect = gameSelect.cloneNode(true);
    gameSelect.parentNode.replaceChild(newGameSelect, gameSelect);

    // Handle game switch
    newGameSelect.addEventListener('change', (e) => {
        const newGameId = e.target.value;
        if (newGameId !== GAME_ID) {
            const gameName = newGameId === 'NY2025' ? 'NY 2025' : 'Default Game';
            if (confirm(`Switch to ${gameName}? This will reload the page.`)) {
                switchGame(newGameId);
            } else {
                // Reset to current game if cancelled
                e.target.value = GAME_ID;
            }
        }
    });

    console.log('[App Bridge] Game switcher initialized');
}

// ============================================================================
// PAGE NAVIGATION
// ============================================================================

/**
 * Navigate between SPA pages
 * @param {string} pageId - ID of page element to show
 */
export function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the requested page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        
        // Special handling for salary cap draft page
        if (pageId === 'salary-cap-draft-page' && typeof window.setupSalaryCapDraft === 'function') {
            window.setupSalaryCapDraft();
        }
    } else {
        console.error('[App Bridge] Page not found:', pageId);
    }
}

// ============================================================================
// MODAL UTILITIES
// ============================================================================

/**
 * Close a modal by ID
 * @param {string} modalId - ID of modal element
 */
export function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        
        // Reset form if exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

/**
 * Open a modal by ID
 * @param {string} modalId - ID of modal element
 */
export function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        
        // Focus first input if exists
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            firstInput.focus();
        }
    }
}

/**
 * Setup close handlers for a modal (X button, overlay click, ESC key)
 * @param {string} modalId - ID of modal element
 * @param {string} closeBtnId - ID of close button (optional)
 * @param {string} cancelBtnId - ID of cancel button (optional)
 */
export function setupModalCloseHandlers(modalId, closeBtnId, cancelBtnId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    // Close on X button
    if (closeBtnId) {
        const closeBtn = document.getElementById(closeBtnId);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modalId));
        }
    }

    // Close on cancel button
    if (cancelBtnId) {
        const cancelBtn = document.getElementById(cancelBtnId);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => closeModal(modalId));
        }
    }

    // Close on overlay click
    const overlay = modal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => closeModal(modalId));
    }

    // Close on ESC key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            closeModal(modalId);
        }
    });
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Store team session in localStorage
 * @param {Object} sessionData - Session data object
 */
export function storeTeamSession(sessionData) {
    localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(sessionData));
}

/**
 * Get team session from localStorage
 * @returns {Object|null} Session data or null
 */
export function getTeamSession() {
    const data = localStorage.getItem(TEAM_SESSION_KEY);
    return data ? JSON.parse(data) : null;
}

/**
 * Clear team session from localStorage
 */
export function clearTeamSession() {
    localStorage.removeItem(TEAM_SESSION_KEY);
}

/**
 * Store commissioner session in localStorage
 * @param {Object} sessionData - Session data object
 */
export function storeCommissionerSession(sessionData) {
    localStorage.setItem(COMMISSIONER_SESSION_KEY, JSON.stringify(sessionData));
}

/**
 * Get commissioner session from localStorage
 * @returns {Object|null} Session data or null
 */
export function getCommissionerSession() {
    const data = localStorage.getItem(COMMISSIONER_SESSION_KEY);
    return data ? JSON.parse(data) : null;
}

/**
 * Clear commissioner session from localStorage
 */
export function clearCommissionerSession() {
    localStorage.removeItem(COMMISSIONER_SESSION_KEY);
}

// ============================================================================
// UI UTILITIES
// ============================================================================

/**
 * Remove loading overlay from page
 */
export function removeLoadingOverlay() {
    const overlay = document.getElementById('app-loading-overlay');
    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => {
            overlay.remove();
        }, 300);
    }
}

// ============================================================================
// TEAM CREATION HANDLER
// ============================================================================

/**
 * Handle team creation form submission
 * @param {Event} e - Form submit event
 */
export async function handleTeamCreation(e) {
    e.preventDefault();
    
    const teamName = document.getElementById('team-name')?.value.trim();
    const ownerName = document.getElementById('team-owner')?.value.trim();
    
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
                playerCode: teamName,
                expiryDays: 90
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Failed to create session:', errorText);
            throw new Error('Failed to create session');
        }
        
        const data = await response.json();
        
        // Store session info in localStorage
        const sessionData = {
            token: data.session.token,
            teamName: teamName,
            playerCode: data.session.playerCode || teamName,
            ownerName: ownerName || null,
            expiresAt: data.session.expiresAt
        };
        storeTeamSession(sessionData);
        
        // Update global session variable
        anonymousSession = sessionData;
        if (typeof window !== 'undefined') {
            window.anonymousSession = anonymousSession;
            
            // Dispatch event to notify components
            window.dispatchEvent(new CustomEvent('sessionsUpdated', {
                detail: { anonymousSession, commissionerSession }
            }));
        }
        
        // Also store the game ID separately for salary-cap-draft.js compatibility
        localStorage.setItem('current_game_id', GAME_ID);
        
        // Close modal
        closeModal('team-creation-modal');
        
        // Navigate to salary cap draft page
        showPage('salary-cap-draft-page');
    } catch (error) {
        console.error('Error creating team:', error);
        alert('Failed to create team. Please try again.');
    }
}

// ============================================================================
// SESSION MANAGEMENT (for footer buttons and session state)
// ============================================================================

/**
 * Anonymous session object - loaded from localStorage
 * Structure: { token, expiresAt, sessionType, displayName, gameId, playerCode }
 */
let anonymousSession = null;

/**
 * Commissioner session object - loaded from localStorage
 * Structure: { sessionToken, userId, role, gameId, displayName, ... }
 */
let commissionerSession = null;

/**
 * Initialize session objects from localStorage
 */
function initializeSessions() {
    // Load anonymous team session
    const teamSessionData = localStorage.getItem(TEAM_SESSION_KEY);
    if (teamSessionData) {
        try {
            anonymousSession = JSON.parse(teamSessionData);
            console.log('[App Bridge] Loaded anonymous session:', anonymousSession);
        } catch (error) {
            console.error('[App Bridge] Failed to parse team session:', error);
        }
    }

    // Load commissioner session
    const commissionerSessionData = localStorage.getItem(COMMISSIONER_SESSION_KEY);
    if (commissionerSessionData) {
        try {
            commissionerSession = JSON.parse(commissionerSessionData);
            console.log('[App Bridge] Loaded commissioner session:', commissionerSession);
        } catch (error) {
            console.error('[App Bridge] Failed to parse commissioner session:', error);
        }
    }

    // Make sessions globally available for other modules
    if (typeof window !== 'undefined') {
        window.anonymousSession = anonymousSession;
        window.commissionerSession = commissionerSession;
        
        // Dispatch custom event to notify components that sessions have been updated
        window.dispatchEvent(new CustomEvent('sessionsUpdated', {
            detail: { anonymousSession, commissionerSession }
        }));
        
        console.log('[App Bridge] Dispatched sessionsUpdated event');
    }
}

// ============================================================================
// COMMISSIONER AUTHENTICATION
// ============================================================================

/**
 * Handle commissioner TOTP login form submission
 * @param {Event} e - Form submit event
 */
async function handleCommissionerTOTPLogin(e) {
    e.preventDefault();
    console.log('[App Bridge] Commissioner TOTP login form submitted');
    
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
            console.log('[App Bridge] TOTP verification successful');
            
            // Save commissioner session with 30-day expiration
            const COMMISSIONER_SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days
            const now = new Date();
            const expiresAt = new Date(now.getTime() + COMMISSIONER_SESSION_TIMEOUT);
            
            commissionerSession = {
                isCommissioner: true,
                loginTime: now.toISOString(),
                expiresAt: expiresAt.toISOString(),
                ...data.session // Include any session data from backend
            };
            
            console.log('[App Bridge] Saving commissioner session:', {
                loginTime: commissionerSession.loginTime,
                expiresAt: commissionerSession.expiresAt
            });
            
            localStorage.setItem(COMMISSIONER_SESSION_KEY, JSON.stringify(commissionerSession));
            
            // Update global variable
            if (typeof window !== 'undefined') {
                window.commissionerSession = commissionerSession;
                
                // Dispatch event to notify components
                window.dispatchEvent(new CustomEvent('sessionsUpdated', {
                    detail: { anonymousSession, commissionerSession }
                }));
            }
            
            console.log('[App Bridge] Commissioner session saved to localStorage');
            
            // Hide modal
            closeModal('commissioner-totp-modal');
            
            // Update footer buttons to show game switcher
            updateFooterButtons();
            
            // Initialize game switcher now that commissioner is logged in
            initializeGameSwitcher();
            
            // Navigate to commissioner page
            showPage('commissioner-page');
            
            // Clear the form
            document.getElementById('totp-code').value = '';
            
        } else {
            const error = await response.json();
            console.error('[App Bridge] TOTP verification failed:', error);
            alert(error.error || 'Invalid TOTP code. Please try again.');
        }
    } catch (error) {
        console.error('[App Bridge] Error during TOTP login:', error);
        alert('Login failed. Please check your connection and try again.');
    }
}

/**
 * Handle commissioner mode button click
 * Checks if commissioner is already authenticated and shows page, 
 * or opens TOTP login modal
 */
function handleCommissionerMode() {
    console.log('[App Bridge] Commissioner Mode button clicked');
    console.log('[App Bridge] Current commissionerSession:', commissionerSession);
    
    // Check if already authenticated via TOTP
    if (commissionerSession && commissionerSession.isCommissioner) {
        console.log('[App Bridge] Commissioner authenticated, showing page');
        // Already authenticated, just show the page
        showPage('commissioner-page');
    } else {
        console.log('[App Bridge] Not authenticated, opening TOTP modal');
        // Not authenticated, show TOTP login modal
        openModal('commissioner-totp-modal');
    }
}

/**
 * Handle commissioner logout
 * Clears commissioner session (localStorage AND cookie)
 * Does NOT clear team session - commissioner can logout without affecting their team
 */
async function handleCommissionerLogout() {
    console.log('[App Bridge] Commissioner logout button clicked');
    
    // Confirm logout
    const confirmed = confirm('Are you sure you want to logout from Commissioner mode?');
    if (!confirmed) {
        console.log('[App Bridge] Commissioner logout cancelled');
        return;
    }
    
    console.log('[App Bridge] Current commissioner session before clearing:', commissionerSession);
    
    // Clear commissioner session from localStorage (but preserve team session)
    localStorage.removeItem(COMMISSIONER_SESSION_KEY);
    commissionerSession = null;
    if (typeof window !== 'undefined') {
        window.commissionerSession = null;
    }
    
    console.log('[App Bridge] Commissioner session cleared from localStorage');
    console.log('[App Bridge] Team session still active:', !!anonymousSession?.token);
    
    // Call logout API to clear the HttpOnly cookie
    try {
        const response = await fetch(`${API_BASE}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            console.log('[App Bridge] Commissioner cookie cleared via API');
        } else {
            console.warn('[App Bridge] Failed to clear commissioner cookie via API, but proceeding with logout');
        }
    } catch (error) {
        console.error('[App Bridge] Error calling commissioner logout API:', error);
        // Continue with logout anyway
    }
    
    // Update footer buttons (remove commissioner logout, keep team buttons if team session exists)
    updateFooterButtons();
    
    // Navigate to home/landing page
    showPage('landing-page');
}

// ============================================================================
// FOOTER BUTTONS
// ============================================================================

/**
 * Update footer buttons based on session state
 * Shows logout and copy URL buttons when user has an active session
 */
function updateFooterButtons() {
    console.log('[App Bridge] Called updateFooterButtons()');
    console.log('[App Bridge] anonymousSession:', anonymousSession);
    console.log('[App Bridge] commissionerSession:', commissionerSession);

    // Try to find footer by ID first, then by tag name
    const footer = document.getElementById('footer') || document.querySelector('footer');
    if (!footer) {
        console.warn('[App Bridge] Footer element not found');
        return;
    }
    console.log('[App Bridge] Found footer element');

    // Get or create footer-actions container
    let footerActions = footer.querySelector('.footer-actions');
    if (!footerActions) {
        footerActions = document.createElement('div');
        footerActions.className = 'footer-actions';
        footer.appendChild(footerActions);
        console.log('[App Bridge] Created footer-actions container');
    } else {
        console.log('[App Bridge] Found existing footer-actions');
    }

    // Update game-switcher visibility based on commissioner status
    const gameSwitcher = footer.querySelector('.game-switcher');
    const hasCommissionerSession = commissionerSession && commissionerSession.isCommissioner;
    
    if (gameSwitcher) {
        if (hasCommissionerSession) {
            gameSwitcher.classList.add('visible');
            console.log('[App Bridge] Game switcher shown (commissioner logged in)');
        } else {
            gameSwitcher.classList.remove('visible');
            console.log('[App Bridge] Game switcher hidden (not a commissioner)');
        }
    }

    // Remove only session-specific buttons (logout/copy URL), preserve permanent ones
    const existingLogoutBtn = footerActions.querySelector('.logout-btn');
    const existingCopyUrlBtn = footerActions.querySelector('.copy-url-btn');
    if (existingLogoutBtn) existingLogoutBtn.remove();
    if (existingCopyUrlBtn) existingCopyUrlBtn.remove();

    // Determine what buttons to show based on active sessions
    const hasTeamSession = anonymousSession && anonymousSession.token;

    // Priority: Team session logout takes precedence over commissioner logout
    // This matches the legacy behavior where one button handles both cases
    if (hasTeamSession) {
        // Team session active (with or without commissioner session)
        // Show logout button for team and copy URL button
        console.log('[App Bridge] Team session active - showing team logout and copy URL');

        // Logout button (logs out team)
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-secondary logout-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = handleLogout;
        footerActions.appendChild(logoutBtn);

        // Copy URL button
        const copyUrlBtn = document.createElement('button');
        copyUrlBtn.className = 'btn btn-secondary copy-url-btn';
        copyUrlBtn.textContent = 'Copy My URL';
        copyUrlBtn.onclick = handleCopyUrl;
        footerActions.appendChild(copyUrlBtn);

        console.log('[App Bridge] Added team logout and copy URL buttons');

    } else if (hasCommissionerSession) {
        // Only commissioner session active (no team session)
        console.log('[App Bridge] Only commissioner session active - showing commissioner logout');

        // Logout button (logs out commissioner)
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn btn-secondary logout-btn';
        logoutBtn.textContent = 'Logout';
        logoutBtn.onclick = handleCommissionerLogout;
        footerActions.appendChild(logoutBtn);

        console.log('[App Bridge] Added commissioner logout button');

    } else {
        console.log('[App Bridge] No active session, no footer buttons to add');
    }
}

/**
 * Handle logout button click
 * Clears the team session (localStorage AND cookie) and navigates to home
 */
async function handleLogout() {
    console.log('[App Bridge] Logout button clicked');

    // Confirm logout
    const confirmed = confirm('Are you sure you want to logout? You\'ll need your session URL to access your team again.');
    if (!confirmed) {
        console.log('[App Bridge] Logout cancelled');
        return;
    }

    // Clear team session from localStorage
    clearTeamSession();
    anonymousSession = null;
    if (typeof window !== 'undefined') {
        window.anonymousSession = null;
    }

    console.log('[App Bridge] Team session cleared from localStorage');

    // Call logout API to clear the HttpOnly cookie
    try {
        const response = await fetch(`${API_BASE}/api/session/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            console.log('[App Bridge] Session cookie cleared via API');
        } else {
            console.warn('[App Bridge] Failed to clear session cookie via API, but proceeding with logout');
        }
    } catch (error) {
        console.error('[App Bridge] Error calling logout API:', error);
        // Continue with logout anyway
    }

    // Navigate to home (this will refresh the page and show logged-out state)
    if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/';
    }
}

/**
 * Handle copy URL button click
 * Copies the session URL to clipboard
 */
async function handleCopyUrl() {
    console.log('[App Bridge] Copy URL button clicked');

    if (!anonymousSession || !anonymousSession.token) {
        console.warn('[App Bridge] No session token to copy');
        alert('No session found. Please create a team first.');
        return;
    }

    // Construct session URL
    const sessionUrl = `${window.location.origin}/?session=${anonymousSession.token}`;
    console.log('[App Bridge] Session URL:', sessionUrl);

    try {
        // Copy to clipboard
        await navigator.clipboard.writeText(sessionUrl);
        console.log('[App Bridge] URL copied to clipboard');

        // Show success message
        alert('URL copied to clipboard! Share this URL to access your team from any device.');
    } catch (error) {
        console.error('[App Bridge] Failed to copy URL:', error);

        // Fallback: show the URL in an alert
        alert(`Copy this URL to access your team:\n\n${sessionUrl}`);
    }
}

// Initialize sessions when the script loads
initializeSessions();

// ============================================================================
// GLOBAL EXPORTS (for backward compatibility)
// ============================================================================

// Make functions globally available for legacy code compatibility
if (typeof window !== 'undefined') {
    window.appBridge = {
        showPage,
        closeModal,
        openModal,
        setupModalCloseHandlers,
        storeTeamSession,
        getTeamSession,
        clearTeamSession,
        removeLoadingOverlay,
        handleTeamCreation,
        initializeSessions,
        updateFooterButtons,
        handleLogout,
        handleCopyUrl,
        handleCommissionerTOTPLogin,
        handleCommissionerMode,
        handleCommissionerLogout,
        switchGame,
        initializeGameSwitcher
    };

    // Also expose these functions directly for easier access
    window.updateFooterButtons = updateFooterButtons;
    window.initializeSessions = initializeSessions;
    window.handleCommissionerTOTPLogin = handleCommissionerTOTPLogin;
    window.handleCommissionerMode = handleCommissionerMode;
    window.handleCommissionerLogout = handleCommissionerLogout;
    window.switchGame = switchGame;
    window.initializeGameSwitcher = initializeGameSwitcher;
    window.anonymousSession = anonymousSession;
    window.commissionerSession = commissionerSession;
}
