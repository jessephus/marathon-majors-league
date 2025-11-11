/**
 * Session Utilities for Server-Side Rendering
 * 
 * Provides utilities for detecting and handling sessions in SSR context.
 * These functions can run server-side (getServerSideProps) or client-side.
 */

/**
 * Session types that can be detected
 */
export const SessionType = {
  ANONYMOUS: 'anonymous',      // No session exists
  TEAM: 'team',                // Team/player session exists
  COMMISSIONER: 'commissioner'  // Commissioner session exists
};

/**
 * Detect session type from cookies
 * This function can run server-side or client-side
 * 
 * @param {Object} cookies - Parsed cookies object or document.cookie string
 * @returns {string} One of SessionType values
 */
export function detectSessionType(cookies) {
  // console.log('[Session Utils] Detecting session type');
  
  // Server-side: cookies is the raw cookie header string from req.headers.cookie
  // Client-side: cookies is document.cookie (empty string if HttpOnly)
  if (typeof cookies === 'string') {
    // console.log('[Session Utils] Cookie string length:', cookies.length);
    
    // Only parse if we have cookies (server-side can read HttpOnly cookies)
    if (cookies.length > 0) {
      // console.log('[Session Utils] Parsing server-side cookies');
      cookies = parseCookies(cookies);
    } else {
      // Client-side: document.cookie is empty due to HttpOnly
      // Fall back to localStorage only
      // console.log('[Session Utils] Client-side: HttpOnly cookies not readable, checking localStorage');
      cookies = {};
    }
  }
  
  // console.log('[Session Utils] Parsed cookies object:', cookies);
  // console.log('[Session Utils] Looking for marathon_fantasy_team cookie');
  
  // Check for team session in cookie or localStorage
  const hasTeamSession = cookies?.marathon_fantasy_team || 
    (typeof window !== 'undefined' && localStorage.getItem('marathon_fantasy_team'));
  
  // console.log('[Session Utils] hasTeamSession:', !!hasTeamSession);
  
  // Check for commissioner session in cookie or localStorage
  const hasCommissionerSession = cookies?.marathon_fantasy_commissioner || 
    (typeof window !== 'undefined' && localStorage.getItem('marathon_fantasy_commissioner'));
  
  // Validate sessions are not expired
  if (hasCommissionerSession) {
    try {
      const session = typeof hasCommissionerSession === 'string' 
        ? JSON.parse(hasCommissionerSession) 
        : hasCommissionerSession;
      
      if (session.expiresAt && new Date(session.expiresAt) > new Date()) {
        // console.log('[Session Utils] Detected commissioner session from cookie');
        return SessionType.COMMISSIONER;
      } else {
        // console.log('[Session Utils] Commissioner session expired:', session.expiresAt);
      }
    } catch (error) {
      console.error('[Session Utils] Error parsing commissioner session:', error);
    }
  }
  
  if (hasTeamSession) {
    try {
      const session = typeof hasTeamSession === 'string' 
        ? JSON.parse(hasTeamSession) 
        : hasTeamSession;
      
      if (session.expiresAt && new Date(session.expiresAt) > new Date()) {
        console.log('[Session Utils] Detected team session from cookie');
        return SessionType.TEAM;
      } else {
        console.log('[Session Utils] Team session expired:', session.expiresAt);
      }
    } catch (error) {
      console.error('[Session Utils] Error parsing team session:', error);
      console.log('[Session Utils] Raw cookie value:', hasTeamSession);
    }
  }
  
  console.log('[Session Utils] No valid session found, returning ANONYMOUS');
  return SessionType.ANONYMOUS;
}

/**
 * Parse cookie string into object
 * 
 * @param {string} cookieString - Raw cookie string
 * @returns {Object} Parsed cookies
 */
function parseCookies(cookieString) {
  if (!cookieString) return {};
  
  return cookieString.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    if (key && value) {
      acc[key] = decodeURIComponent(value);
    }
    return acc;
  }, {});
}

/**
 * Check if a session token exists in URL query parameters
 * 
 * @param {Object} query - Next.js query object or URLSearchParams
 * @returns {string|null} Session token if exists, null otherwise
 */
export function getSessionFromURL(query) {
  if (query instanceof URLSearchParams) {
    return query.get('session');
  }
  return query?.session || null;
}

/**
 * Validate session token format
 * 
 * @param {string} token - Session token to validate
 * @returns {boolean} True if token format is valid
 */
export function isValidSessionToken(token) {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Session tokens should be at least 32 characters (UUID v4 without dashes is 32 chars)
  return token.length >= 32;
}
