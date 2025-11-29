/**
 * Session Manager - Centralized Session Management
 * 
 * TypeScript module for managing team and commissioner sessions across the application.
 * Consolidates session logic from app-bridge.js and session-utils.js.
 * 
 * Features:
 * - Type-safe session storage and retrieval
 * - localStorage persistence
 * - Session expiry validation
 * - Event dispatching for React component updates
 * - SSR-compatible session detection
 * 
 * Migration from:
 * - public/app-bridge.js (client-side session management)
 * - lib/session-utils.js (SSR session detection)
 * 
 * Related:
 * - lib/state-provider.tsx - React Context for session state
 * - components/Footer.tsx - Session-aware footer component
 */

import { DEFAULT_GAME_ID } from '../config/constants';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Session types that can be detected
 */
export enum SessionType {
  ANONYMOUS = 'anonymous',
  TEAM = 'team',
  COMMISSIONER = 'commissioner'
}

/**
 * Team/Player session data structure
 */
export interface TeamSession {
  token: string;
  teamName: string;
  playerCode: string;
  ownerName?: string | null;
  expiresAt: string;
  sessionType?: 'player';
  gameId?: string;
}

/**
 * Commissioner session data structure
 */
export interface CommissionerSession {
  isCommissioner: boolean;
  loginTime: string;
  expiresAt: string;
  sessionToken?: string;
  userId?: number;
  role?: string;
  gameId?: string;
  displayName?: string;
}

/**
 * Parsed cookies object
 */
export interface ParsedCookies {
  [key: string]: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TEAM_SESSION_KEY = 'marathon_fantasy_team';
export const COMMISSIONER_SESSION_KEY = 'marathon_fantasy_commissioner';
export const GAME_ID_KEY = 'current_game_id';

// Session expiry durations (milliseconds)
export const TEAM_SESSION_TIMEOUT = 90 * 24 * 60 * 60 * 1000; // 90 days
export const COMMISSIONER_SESSION_TIMEOUT = 30 * 24 * 60 * 60 * 1000; // 30 days

// ============================================================================
// TEAM SESSION MANAGEMENT
// ============================================================================

/**
 * Store team session in localStorage
 */
export function storeTeamSession(sessionData: TeamSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(TEAM_SESSION_KEY, JSON.stringify(sessionData));
    
    // Also update global window object for backward compatibility
    if (window) {
      (window as any).anonymousSession = sessionData;
    }
    
    // Dispatch event to notify React components
    dispatchSessionsUpdated();
  } catch (error) {
    console.error('[Session Manager] Error storing team session:', error);
  }
}

/**
 * Get team session from localStorage
 */
export function getTeamSession(): TeamSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(TEAM_SESSION_KEY);
    if (!data) return null;
    
    const session = JSON.parse(data) as TeamSession;
    
    // Validate session is not expired
    if (isSessionExpired(session.expiresAt)) {
      clearTeamSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[Session Manager] Error retrieving team session:', error);
    return null;
  }
}

/**
 * Clear team session from localStorage
 */
export function clearTeamSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(TEAM_SESSION_KEY);
    
    // Clear global window object
    if (window) {
      (window as any).anonymousSession = null;
    }
    
    // Dispatch event to notify React components
    dispatchSessionsUpdated();
  } catch (error) {
    console.error('[Session Manager] Error clearing team session:', error);
  }
}

// ============================================================================
// COMMISSIONER SESSION MANAGEMENT
// ============================================================================

/**
 * Store commissioner session in localStorage
 */
export function storeCommissionerSession(sessionData: CommissionerSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(COMMISSIONER_SESSION_KEY, JSON.stringify(sessionData));
    
    // Also update global window object for backward compatibility
    if (window) {
      (window as any).commissionerSession = sessionData;
    }
    
    // Dispatch event to notify React components
    dispatchSessionsUpdated();
  } catch (error) {
    console.error('[Session Manager] Error storing commissioner session:', error);
  }
}

/**
 * Get commissioner session from localStorage
 */
export function getCommissionerSession(): CommissionerSession | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const data = localStorage.getItem(COMMISSIONER_SESSION_KEY);
    if (!data) return null;
    
    const session = JSON.parse(data) as CommissionerSession;
    
    // Validate session is not expired
    if (isSessionExpired(session.expiresAt)) {
      clearCommissionerSession();
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('[Session Manager] Error retrieving commissioner session:', error);
    return null;
  }
}

/**
 * Clear commissioner session from localStorage
 */
export function clearCommissionerSession(): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(COMMISSIONER_SESSION_KEY);
    
    // Clear global window object
    if (window) {
      (window as any).commissionerSession = null;
    }
    
    // Dispatch event to notify React components
    dispatchSessionsUpdated();
  } catch (error) {
    console.error('[Session Manager] Error clearing commissioner session:', error);
  }
}

// ============================================================================
// SESSION VALIDATION
// ============================================================================

/**
 * Check if a session is expired
 */
export function isSessionExpired(expiresAt: string): boolean {
  try {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    return expiryDate <= now;
  } catch (error) {
    console.error('[Session Manager] Error parsing expiry date:', error);
    return true; // Treat invalid dates as expired
  }
}

/**
 * Validate team session and return if valid
 */
export function getValidTeamSession(): TeamSession | null {
  const session = getTeamSession();
  if (!session) return null;
  
  // Double-check expiry (redundant with getTeamSession but explicit)
  if (isSessionExpired(session.expiresAt)) {
    clearTeamSession();
    return null;
  }
  
  return session;
}

/**
 * Validate commissioner session and return if valid
 */
export function getValidCommissionerSession(): CommissionerSession | null {
  const session = getCommissionerSession();
  if (!session) return null;
  
  // Double-check expiry
  if (isSessionExpired(session.expiresAt)) {
    clearCommissionerSession();
    return null;
  }
  
  return session;
}

// ============================================================================
// SESSION DETECTION (SSR-compatible)
// ============================================================================

/**
 * Parse cookie string into object
 */
export function parseCookies(cookieString: string): ParsedCookies {
  const cookies: ParsedCookies = {};
  
  if (!cookieString || cookieString.trim() === '') {
    return cookies;
  }
  
  cookieString.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    const value = rest.join('=').trim();
    if (name && value) {
      cookies[name.trim()] = decodeURIComponent(value);
    }
  });
  
  return cookies;
}

/**
 * Detect session type from cookies or localStorage
 * Can run server-side (with cookies) or client-side
 */
export function detectSessionType(cookies?: string | ParsedCookies): SessionType {
  let parsedCookies: ParsedCookies = {};
  
  // Parse cookies if provided as string
  if (typeof cookies === 'string') {
    parsedCookies = parseCookies(cookies);
  } else if (cookies) {
    parsedCookies = cookies;
  }
  
  // Check for commissioner session (higher priority)
  const commissionerCookie = parsedCookies[COMMISSIONER_SESSION_KEY];
  const commissionerLocal = typeof window !== 'undefined' 
    ? localStorage.getItem(COMMISSIONER_SESSION_KEY)
    : null;
  
  const commissionerData = commissionerCookie || commissionerLocal;
  
  if (commissionerData) {
    try {
      const session = JSON.parse(commissionerData) as CommissionerSession;
      if (session.expiresAt && !isSessionExpired(session.expiresAt)) {
        return SessionType.COMMISSIONER;
      }
    } catch (error) {
      console.error('[Session Manager] Error parsing commissioner session:', error);
    }
  }
  
  // Check for team session
  const teamCookie = parsedCookies[TEAM_SESSION_KEY];
  const teamLocal = typeof window !== 'undefined'
    ? localStorage.getItem(TEAM_SESSION_KEY)
    : null;
  
  const teamData = teamCookie || teamLocal;
  
  if (teamData) {
    try {
      const session = JSON.parse(teamData) as TeamSession;
      if (session.expiresAt && !isSessionExpired(session.expiresAt)) {
        return SessionType.TEAM;
      }
    } catch (error) {
      console.error('[Session Manager] Error parsing team session:', error);
    }
  }
  
  return SessionType.ANONYMOUS;
}

// ============================================================================
// SESSION INITIALIZATION
// ============================================================================

/**
 * Initialize sessions from localStorage on page load
 * Updates global window objects and dispatches events
 */
export function initializeSessions(): void {
  if (typeof window === 'undefined') return;
  
  // Load team session
  const teamSession = getTeamSession();
  if (teamSession) {
    (window as any).anonymousSession = teamSession;
  }
  
  // Load commissioner session
  const commissionerSession = getCommissionerSession();
  if (commissionerSession) {
    (window as any).commissionerSession = commissionerSession;
  }
  
  // Dispatch initial event
  dispatchSessionsUpdated();
}

// ============================================================================
// EVENT DISPATCHING
// ============================================================================

/**
 * Dispatch sessionsUpdated event to notify React components
 */
export function dispatchSessionsUpdated(): void {
  if (typeof window === 'undefined') return;
  
  const teamSession = getTeamSession();
  const commissionerSession = getCommissionerSession();
  
  window.dispatchEvent(new CustomEvent('sessionsUpdated', {
    detail: {
      anonymousSession: teamSession,
      commissionerSession: commissionerSession
    }
  }));
}

// ============================================================================
// GAME ID MANAGEMENT
// ============================================================================

/**
 * Get current game ID from localStorage
 */
export function getCurrentGameId(): string {
  if (typeof window === 'undefined') return DEFAULT_GAME_ID;
  
  try {
    return localStorage.getItem(GAME_ID_KEY) || DEFAULT_GAME_ID;
  } catch (error) {
    console.error('[Session Manager] Error retrieving game ID:', error);
    return DEFAULT_GAME_ID;
  }
}

/**
 * Set current game ID in localStorage
 */
export function setCurrentGameId(gameId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(GAME_ID_KEY, gameId);
  } catch (error) {
    console.error('[Session Manager] Error storing game ID:', error);
  }
}

/**
 * Switch to a different game and reload
 */
export function switchGame(gameId: string): void {
  setCurrentGameId(gameId);
  window.location.reload();
}

// ============================================================================
// BACKWARD COMPATIBILITY EXPORTS
// ============================================================================

// Export individual functions for gradual migration
export default {
  // Session types
  SessionType,
  
  // Team session
  storeTeamSession,
  getTeamSession,
  clearTeamSession,
  getValidTeamSession,
  
  // Commissioner session
  storeCommissionerSession,
  getCommissionerSession,
  clearCommissionerSession,
  getValidCommissionerSession,
  
  // Validation
  isSessionExpired,
  
  // Detection
  detectSessionType,
  parseCookies,
  
  // Initialization
  initializeSessions,
  dispatchSessionsUpdated,
  
  // Game management
  getCurrentGameId,
  setCurrentGameId,
  switchGame,
  
  // Constants
  TEAM_SESSION_KEY,
  COMMISSIONER_SESSION_KEY,
  GAME_ID_KEY
};
