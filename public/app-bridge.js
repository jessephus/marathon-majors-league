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
const GAME_ID = 'demo-game';
const TEAM_SESSION_KEY = 'marathon_fantasy_team';
const COMMISSIONER_SESSION_KEY = 'marathon_fantasy_commissioner';

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
        handleTeamCreation
    };
}
