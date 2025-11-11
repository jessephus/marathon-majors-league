/**
 * API Client
 * 
 * Centralized API communication layer with:
 * - Unified error handling
 * - Exponential backoff retry for transient network errors
 * - Caching strategy with stale-while-revalidate
 * - Consistent cache-control headers
 * 
 * This replaces scattered fetch() calls throughout app.js and salary-cap-draft.js
 * during the migration.
 */

const API_BASE = typeof window !== 'undefined' 
  ? (window.location.origin === 'null' ? '' : window.location.origin)
  : '';

/**
 * Cache configuration per endpoint type
 */
interface CacheConfig {
  maxAge: number; // Browser cache duration in seconds
  sMaxAge: number; // CDN cache duration in seconds
  staleWhileRevalidate: number; // Stale-while-revalidate duration
}

const CACHE_CONFIGS: Record<string, CacheConfig> = {
  athletes: { maxAge: 3600, sMaxAge: 7200, staleWhileRevalidate: 86400 }, // 1h/2h/24h - athletes change infrequently
  gameState: { maxAge: 30, sMaxAge: 60, staleWhileRevalidate: 300 }, // 30s/60s/5m - game state changes moderately
  results: { maxAge: 15, sMaxAge: 30, staleWhileRevalidate: 120 }, // 15s/30s/2m - results update frequently during race
  default: { maxAge: 60, sMaxAge: 120, staleWhileRevalidate: 300 }, // 1m/2m/5m - default for other endpoints
};

/**
 * Exponential backoff configuration
 */
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 300,
  maxDelayMs: 5000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Request Timeout, Too Many Requests, Server Errors
};

/**
 * Check if an error is transient and should be retried
 */
function isTransientError(error: any, statusCode?: number): boolean {
  // Network errors (no status code)
  if (!statusCode && (error.name === 'TypeError' || error.message?.includes('fetch failed'))) {
    return true;
  }
  
  // Specific HTTP status codes that warrant retry
  if (statusCode && RETRY_CONFIG.retryableStatusCodes.includes(statusCode)) {
    return true;
  }
  
  return false;
}

/**
 * Sleep helper for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getRetryDelay(attempt: number): number {
  const exponentialDelay = Math.min(
    RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt),
    RETRY_CONFIG.maxDelayMs
  );
  
  // Add jitter (±25% randomization) to prevent thundering herd
  const jitter = exponentialDelay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Enhanced API request with retry logic and error handling
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryAttempt = 0
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });

    if (!response.ok) {
      // Check if we should retry
      if (isTransientError(null, response.status) && retryAttempt < RETRY_CONFIG.maxRetries) {
        const delay = getRetryDelay(retryAttempt);
        console.warn(`API request failed (${response.status}), retrying in ${delay}ms (attempt ${retryAttempt + 1}/${RETRY_CONFIG.maxRetries})`);
        await sleep(delay);
        return apiRequest<T>(endpoint, options, retryAttempt + 1);
      }

      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    return response.json();
  } catch (error: any) {
    // Handle network errors with retry
    if (isTransientError(error) && retryAttempt < RETRY_CONFIG.maxRetries) {
      const delay = getRetryDelay(retryAttempt);
      console.warn(`Network error, retrying in ${delay}ms (attempt ${retryAttempt + 1}/${RETRY_CONFIG.maxRetries}):`, error.message);
      await sleep(delay);
      return apiRequest<T>(endpoint, options, retryAttempt + 1);
    }
    
    // Final error - throw with context
    throw new Error(`API request failed: ${error.message}`);
  }
}

/**
 * Cache utilities for server-side cache header management
 * These should be used in API route handlers
 */
export const cacheUtils = {
  /**
   * Get cache configuration for a specific endpoint type
   */
  getCacheConfig(type: 'athletes' | 'gameState' | 'results' | 'default'): CacheConfig {
    return CACHE_CONFIGS[type] || CACHE_CONFIGS.default;
  },

  /**
   * Generate Cache-Control header string
   */
  getCacheControlHeader(config: CacheConfig): string {
    return `public, max-age=${config.maxAge}, s-maxage=${config.sMaxAge}, stale-while-revalidate=${config.staleWhileRevalidate}`;
  },

  /**
   * Set cache headers on a Next.js API response
   * Usage in API routes: cacheUtils.setCacheHeaders(res, 'athletes')
   */
  setCacheHeaders(res: any, type: 'athletes' | 'gameState' | 'results' | 'default' = 'default'): void {
    const config = this.getCacheConfig(type);
    res.setHeader('Cache-Control', this.getCacheControlHeader(config));
    res.setHeader('CDN-Cache-Control', `max-age=${config.sMaxAge}`);
    res.setHeader('Vary', 'Accept-Encoding');
  },
};

// Athlete API
export const athleteApi = {
  /**
   * Fetch all athletes
   * @param confirmedOnly - If true, only return athletes confirmed for active race (default: false for admin)
   */
  async list(params?: { confirmedOnly?: boolean }) {
    const confirmedOnly = params?.confirmedOnly ?? false;
    return apiRequest<{ men: any[]; women: any[] }>(`/api/athletes?confirmedOnly=${confirmedOnly}`);
  },

  /**
   * Add a new athlete (commissioner only)
   */
  async add(athleteData: any) {
    return apiRequest('/api/add-athlete', {
      method: 'POST',
      body: JSON.stringify(athleteData),
    });
  },

  /**
   * Update athlete data (commissioner only)
   */
  async update(athleteId: number, updates: any) {
    return apiRequest('/api/update-athlete', {
      method: 'POST',
      body: JSON.stringify({ athleteId, ...updates }),
    });
  },

  /**
   * Toggle athlete race confirmation
   */
  async toggleConfirmation(athleteId: number, raceId?: number) {
    return apiRequest('/api/toggle-athlete-confirmation', {
      method: 'POST',
      body: JSON.stringify({ athleteId, raceId }),
    });
  },

  /**
   * Sync athlete data from World Athletics
   */
  async sync(athleteId: number) {
    return apiRequest(`/api/athletes/${athleteId}/sync`, {
      method: 'POST',
    });
  },
};

// Game State API
export const gameStateApi = {
  /**
   * Load game state
   */
  async load(gameId: string = 'default') {
    return apiRequest(`/api/game-state?gameId=${gameId}`);
  },

  /**
   * Save game state
   */
  async save(gameId: string = 'default', state: any) {
    return apiRequest(`/api/game-state?gameId=${gameId}`, {
      method: 'POST',
      body: JSON.stringify(state),
    });
  },
};

// Session API
export const sessionApi = {
  /**
   * Create a new team session
   */
  async create(teamName: string, ownerName?: string, gameId: string = 'default') {
    const response = await apiRequest<{
      message: string;
      session: {
        token: string;
        expiresAt: string;
        sessionType: string;
        displayName: string | null;
        gameId: string | null;
      };
      uniqueUrl: string;
      instructions: string;
    }>('/api/session/create', {
      method: 'POST',
      body: JSON.stringify({ 
        displayName: teamName,
        sessionType: 'player',
        gameId 
      }),
    });
    
    // Transform API response to match SessionState interface
    return {
      token: response.session.token,
      teamName: response.session.displayName || teamName,
      playerCode: null, // Generated later when joining game
      ownerName: ownerName || null,
      expiresAt: response.session.expiresAt,
    };
  },

  /**
   * Verify session token
   */
  async verify(token: string) {
    return apiRequest<{
      valid: boolean;
      session?: {
        id: string;
        type: string;
        gameId: string | null;
        playerCode: string | null;
        displayName: string | null;
        expiresAt: string;
        daysUntilExpiry: number;
      };
      warning?: string | null;
    }>(`/api/session/verify?token=${encodeURIComponent(token)}`, {
      method: 'GET',
    });
  },
};

// Rankings API
export const rankingsApi = {
  /**
   * Submit player rankings
   */
  async submit(gameId: string, playerCode: string, rankings: any) {
    return apiRequest('/api/rankings', {
      method: 'POST',
      body: JSON.stringify({ gameId, playerCode, rankings }),
    });
  },

  /**
   * Get player rankings
   */
  async get(gameId: string, playerCode: string) {
    return apiRequest(`/api/rankings?gameId=${gameId}&playerCode=${playerCode}`);
  },
};

// Salary Cap Draft API
export const salaryCapDraftApi = {
  /**
   * Submit salary cap team roster
   */
  async submitTeam(gameId: string, playerCode: string, team: any) {
    return apiRequest('/api/salary-cap-draft', {
      method: 'POST',
      body: JSON.stringify({ gameId, playerCode, team }),
    });
  },

  /**
   * Get team roster (for specific player or all teams if playerCode omitted)
   */
  async getTeam(gameId: string, playerCode?: string) {
    const params = playerCode 
      ? `?gameId=${gameId}&playerCode=${playerCode}`
      : `?gameId=${gameId}`;
    return apiRequest(`/api/salary-cap-draft${params}`);
  },
};

// Results API
export const resultsApi = {
  /**
   * Fetch race results
   * @param gameId - Game identifier
   * @param options - Optional fetch options
   * @param options.skipDNS - Skip fetching DNS athletes for better performance (default: false)
   */
  async fetch(gameId: string = 'default', options?: { skipDNS?: boolean }) {
    const params = new URLSearchParams({ gameId });
    if (options?.skipDNS) {
      params.append('skipDNS', 'true');
    }
    return apiRequest(`/api/results?${params.toString()}`);
  },

  /**
   * Update race results (commissioner only)
   */
  async update(gameId: string, results: any) {
    return apiRequest(`/api/results?gameId=${gameId}`, {
      method: 'POST',
      body: JSON.stringify(results),
    });
  },

  /**
   * Fetch scoring details
   */
  async getScoring(gameId: string = 'default') {
    return apiRequest(`/api/scoring?gameId=${gameId}`);
  },
};

// Commissioner API
export const commissionerApi = {
  /**
   * Verify TOTP code
   */
  async verifyTOTP(code: string, email?: string) {
    return apiRequest<{ 
      success: boolean; 
      message?: string;
      user?: { id: number; email: string };
    }>('/api/auth/totp/verify', {
      method: 'POST',
      body: JSON.stringify({ 
        email: email || 'commissioner@marathonmajorsfantasy.com', // Legacy default email
        totpCode: code 
      }),
    });
  },

  /**
   * Reset game state
   */
  async resetGame(gameId: string = 'default') {
    return apiRequest('/api/reset-game', {
      method: 'POST',
      body: JSON.stringify({ gameId }),
    });
  },

  /**
   * Load demo data
   */
  async loadDemoData(gameId: string = 'default') {
    return apiRequest('/api/load-demo-data', {
      method: 'POST',
      body: JSON.stringify({ gameId }),
    });
  },

  /**
   * Logout commissioner and clear session cookie
   */
  async logout() {
    return apiRequest<{ success: boolean; message?: string }>('/api/auth/totp/logout', {
      method: 'POST',
    });
  },
};

/**
 * Races API - Marathon event management
 */
export const racesApi = {
  /**
   * Get all races or filter by criteria
   */
  async list(params?: { id?: number; active?: boolean; includeAthletes?: boolean }) {
    const queryString = params ? `?${new URLSearchParams(
      Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = String(value);
        }
        return acc;
      }, {} as Record<string, string>)
    )}` : '';
    return apiRequest<any[]>(`/api/races${queryString}`, {
      method: 'GET',
    });
  },

  /**
   * Create a new race
   */
  async create(raceData: {
    name: string;
    date: string;
    location: string;
    distance?: string;
    event_type?: string;
    world_athletics_event_id?: string;
    description?: string;
  }) {
    return apiRequest<any>('/api/races', {
      method: 'POST',
      body: JSON.stringify(raceData),
    });
  },

  /**
   * Update an existing race
   */
  async update(id: number, raceData: Partial<{
    name: string;
    date: string;
    location: string;
    distance: string;
    event_type: string;
    world_athletics_event_id: string;
    description: string;
    is_active: boolean;
  }>) {
    return apiRequest<any>('/api/races', {
      method: 'PUT',
      body: JSON.stringify({ id, ...raceData }),
    });
  },
};

/**
 * Athlete-Races API - Manage athlete race confirmations
 */
export const athleteRacesApi = {
  /**
   * Get confirmed athletes for a race
   */
  async list(params: { raceId: number }) {
    return apiRequest<Array<{ id: number; athlete_id: number; race_id: number; bib_number?: string; confirmed_at: string }>>(
      `/api/athlete-races?raceId=${params.raceId}`,
      { method: 'GET' }
    );
  },

  /**
   * Confirm an athlete for a race
   */
  async confirm(athleteId: number, raceId: number, bibNumber?: string) {
    return apiRequest<{ success: boolean; message?: string }>('/api/athlete-races', {
      method: 'POST',
      body: JSON.stringify({ athleteId, raceId, bibNumber }),
    });
  },

  /**
   * Remove athlete confirmation from a race
   */
  async unconfirm(athleteId: number, raceId: number) {
    return apiRequest<{ success: boolean; message?: string }>(
      `/api/athlete-races?athleteId=${athleteId}&raceId=${raceId}`,
      { method: 'DELETE' }
    );
  },
};

// Export unified API client
export const apiClient = {
  athletes: athleteApi,
  gameState: gameStateApi,
  session: sessionApi,
  rankings: rankingsApi,
  salaryCapDraft: salaryCapDraftApi,
  results: resultsApi,
  commissioner: commissionerApi,
  races: racesApi,
  athleteRaces: athleteRacesApi,
};

export default apiClient;
