/**
 * Navigation Utilities
 * 
 * Helper functions for dynamic navigation based on user session state.
 * 
 * Use Cases:
 * - Team links that adapt based on active session
 * - Conditional navigation to team pages vs. signup modals
 * - SSR-safe navigation helpers
 */

import { getTeamSession, getCommissionerSession } from './session-manager';

/**
 * Get the appropriate href for the "My Team" navigation link
 * 
 * Logic:
 * - If team session exists and is valid: /team/{sessionToken}
 * - Otherwise: /?action=create-team (triggers team creation modal on home page)
 * 
 * @returns {string} The href to use for team navigation
 */
export function getTeamHref(): string {
  // Client-side only (session manager uses localStorage)
  if (typeof window === 'undefined') {
    return '/?action=create-team';
  }
  
  try {
    const teamSession = getTeamSession();
    
    if (teamSession && teamSession.token) {
      return `/team/${teamSession.token}`;
    }
  } catch (error) {
    console.error('[Navigation Utils] Error getting team session:', error);
  }
  
  // Default to home with create-team action to trigger modal
  return '/?action=create-team';
}
}

/**
 * Check if user has an active team session
 * 
 * @returns {boolean} True if active session exists
 */
export function hasActiveTeamSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const teamSession = getTeamSession();
    return teamSession !== null && !!teamSession.token;
  } catch (error) {
    console.error('[Navigation Utils] Error checking team session:', error);
    return false;
  }
}

/**
 * Check if user has an active commissioner session
 * 
 * @returns {boolean} True if active commissioner session exists
 */
export function hasActiveCommissionerSession(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  
  try {
    const commissionerSession = getCommissionerSession();
    return commissionerSession !== null && commissionerSession.isCommissioner === true;
  } catch (error) {
    console.error('[Navigation Utils] Error checking commissioner session:', error);
    return false;
  }
}

/**
 * Get team session token if available
 * 
 * @returns {string | null} Session token or null
 */
export function getTeamSessionToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const teamSession = getTeamSession();
    return teamSession?.token || null;
  } catch (error) {
    console.error('[Navigation Utils] Error getting team session token:', error);
    return null;
  }
}
