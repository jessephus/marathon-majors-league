/**
 * API Client
 * 
 * Centralized API communication layer with:
 * - Unified error handling
 * - Exponential backoff retry for transient network errors
 * - Caching strategy with stale-while-revalidate
 * - Consistent cache-control headers
 * - Server-side rendering (SSR) support
 * 
 * This replaces scattered fetch() calls throughout app.js and salary-cap-draft.js
 * during the migration.
 * 
 * USAGE:
 * - Client-side: apiClient.athletes.list() - uses window.location.origin
 * - Server-side (SSR): Provide baseUrl in context:
 *   const client = createServerApiClient(baseUrl);
 *   const data = await client.athletes.list();
 */

/**
 * Get API base URL
 * - Client-side: window.location.origin
 * - Server-side: Provided via parameter (from VERCEL_URL or localhost)
 */
function getApiBase(serverBaseUrl?: string): string {
  // Server-side: use provided baseUrl
  if (serverBaseUrl) {
    return serverBaseUrl;
  }
  
  // Client-side: use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin === 'null' ? '' : window.location.origin;
  }
  
  // Fallback (shouldn't happen if used correctly)
  return '';
}

const DEFAULT_API_BASE = getApiBase();

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
  scoring: { maxAge: 15, sMaxAge: 30, staleWhileRevalidate: 120 }, // 15s/30s/2m - scoring updates with results
  standings: { maxAge: 30, sMaxAge: 60, staleWhileRevalidate: 300 }, // 30s/60s/5m - standings update with results
  default: { maxAge: 60, sMaxAge: 120, staleWhileRevalidate: 300 }, // 1m/2m/5m - default for other endpoints
};

type CacheType = keyof typeof CACHE_CONFIGS;

interface CachedResponse<T = any> {
  data: T;
  expiry: number;
  etag?: string;
  createdAt: number;
}

const CACHE_STORAGE_KEY = '__api_cache_v1__';
const responseCache = new Map<string, CachedResponse<any>>();
let cacheInitialized = false;

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function ensureCacheLoaded(): void {
  if (!isBrowser() || cacheInitialized) {
    return;
  }

  cacheInitialized = true;

  try {
    const stored = window.sessionStorage.getItem(CACHE_STORAGE_KEY);
    if (stored) {
      const parsed: Record<string, CachedResponse<any>> = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]) => {
        if (value && typeof value === 'object') {
          responseCache.set(key, value);
        }
      });
      // Cache hydrated silently
    }
  } catch (error) {
    console.warn('[API Cache] Failed to hydrate cache from sessionStorage:', error);
  }
}

function persistCache(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    const serializable: Record<string, CachedResponse<any>> = {};
    responseCache.forEach((value, key) => {
      serializable[key] = value;
    });
    window.sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    // Storage quota exceeded or sessionStorage unavailable shouldn't break requests
    console.warn('[API Cache] Failed to persist cache to sessionStorage:', error);
  }
}

/**
 * Clear all cached responses (both in-memory and sessionStorage)
 * Call this after mutations (create/update/delete) to ensure fresh data is fetched
 */
export function clearCache(): void {
  if (!isBrowser()) {
    return;
  }

  try {
    // Clear in-memory cache
    responseCache.clear();
    
    // Clear sessionStorage persistence
    window.sessionStorage.removeItem(CACHE_STORAGE_KEY);
    
    console.log('[API Cache] Cache cleared - next requests will fetch fresh data');
  } catch (error) {
    console.warn('[API Cache] Failed to clear cache:', error);
  }
}

function getCacheType(url: string): CacheType {
  if (url.includes('/api/athletes')) return 'athletes';
  if (url.includes('/api/results')) return 'results';
  if (url.includes('/api/game-state')) return 'gameState';
  if (url.includes('/api/scoring')) return 'scoring';
  if (url.includes('/api/standings')) return 'standings';
  return 'default';
}

interface CacheContext<T = any> {
  type: CacheType;
  config: CacheConfig;
  key: string;
  entry?: CachedResponse<T>;
}

function createCacheKey(endpoint: string, method: string): string {
  return `${method}:${endpoint}`;
}

function updateCache<T>(context: CacheContext<T>, payload: CachedResponse<T>): void {
  responseCache.set(context.key, payload);
  persistCache();
  // Cache stored silently
}

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
 * Track cache access in performance monitor (browser-side only)
 */
function trackCacheAccess(cacheType: string, isHit: boolean): void {
  if (typeof window !== 'undefined' && (window as any).__performanceMonitor) {
    (window as any).__performanceMonitor.trackCacheAccess(cacheType, isHit);
  }
}

function normalizeETag(value: string | null): string | undefined {
  if (!value) {
    return undefined;
  }

  return value
    .replace(/^W\//, '')
    .replace(/^"+|"+$/g, '')
    .trim();
}

function formatETagForStorage(rawHeader: string | null, normalized?: string): string | undefined {
  if (rawHeader && rawHeader.trim()) {
    return rawHeader.trim();
  }

  if (normalized && normalized.trim()) {
    return `"${normalized.trim()}"`;
  }

  return undefined;
}

/**
 * Enhanced API request with retry logic, error handling, and cache tracking
 * @param endpoint - API endpoint path (e.g., '/api/athletes')
 * @param options - Fetch options
 * @param retryAttempt - Current retry attempt number (internal)
 * @param baseUrl - Optional base URL for server-side requests
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryAttempt = 0,
  baseUrl?: string
): Promise<T> {
  const apiBase = baseUrl || DEFAULT_API_BASE;
  const url = `${apiBase}${endpoint}`;
  
  const method = (options.method || 'GET').toUpperCase();

  let cacheContext: CacheContext<T> | null = null;
  let usedClientCache = false;

  if (isBrowser() && !baseUrl && method === 'GET') {
    ensureCacheLoaded();
    const cacheType = getCacheType(endpoint);
    const cacheConfig = CACHE_CONFIGS[cacheType] || CACHE_CONFIGS.default;
    const cacheKey = createCacheKey(endpoint, method);
    const cacheEntry = responseCache.get(cacheKey) as CachedResponse<T> | undefined;

    cacheContext = {
      type: cacheType,
      config: cacheConfig,
      key: cacheKey,
      entry: cacheEntry,
    };

    if (cacheEntry && Date.now() < cacheEntry.expiry) {
      usedClientCache = true;
      trackCacheAccess(cacheType, true);
      // Served from client cache - no logging needed
      return cacheEntry.data;
    } else if (cacheEntry) {
      // Cache expired, will revalidate - no logging needed
    }
  }
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  if (cacheContext?.entry?.etag) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'If-None-Match': cacheContext.entry.etag,
    };
  }

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });

    if (cacheContext && response.status === 304 && cacheContext.entry) {
      const renewedEntry: CachedResponse<T> = {
        ...cacheContext.entry,
        expiry: Date.now() + cacheContext.config.maxAge * 1000,
      };
      updateCache(cacheContext, renewedEntry);
      trackCacheAccess(cacheContext.type, true);
      // 304 Not Modified - cache revalidated successfully
      return renewedEntry.data;
    }

    // Track cache performance based on X-Cache-Status header
    const cacheStatus = response?.headers?.get('X-Cache-Status');
    const cacheType = response?.headers?.get('X-Cache-Type');
    
    if (cacheStatus && cacheType) {
      const isHit = cacheStatus === 'HIT';
      trackCacheAccess(cacheType, isHit);
      // Cache tracking handled silently
    }

    if (!response.ok) {
      // Check if we should retry
      if (isTransientError(null, response.status) && retryAttempt < RETRY_CONFIG.maxRetries) {
        const delay = getRetryDelay(retryAttempt);
        console.warn(`API request failed (${response.status}), retrying in ${delay}ms (attempt ${retryAttempt + 1}/${RETRY_CONFIG.maxRetries})`);
        await sleep(delay);
        return apiRequest<T>(endpoint, options, retryAttempt + 1, baseUrl);
      }

      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `API error: ${response.statusText}`);
    }

    const data: T = await response.json();

    if (cacheContext && !usedClientCache) {
      const responseEtagRaw = response?.headers?.get('ETag');
      const normalizedEtag = normalizeETag(responseEtagRaw);

      const cacheEntry: CachedResponse<T> = {
        data,
        createdAt: Date.now(),
        expiry: Date.now() + cacheContext.config.maxAge * 1000,
        etag: formatETagForStorage(responseEtagRaw, normalizedEtag),
      };

      updateCache(cacheContext, cacheEntry);
    }

    return data;
  } catch (error: any) {
    // Handle network errors with retry
    if (isTransientError(error) && retryAttempt < RETRY_CONFIG.maxRetries) {
      const delay = getRetryDelay(retryAttempt);
      console.warn(`Network error, retrying in ${delay}ms (attempt ${retryAttempt + 1}/${RETRY_CONFIG.maxRetries}):`, error.message);
      await sleep(delay);
      return apiRequest<T>(endpoint, options, retryAttempt + 1, baseUrl);
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

  /**
   * Clear all cached responses
   * Usage: Call after operations that modify data (POST, PUT, DELETE)
   */
  clearCache(): void {
    if (!isBrowser()) {
      return;
    }

    responseCache.clear();
    
    try {
      window.sessionStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (error) {
      console.warn('[API Cache] Failed to clear sessionStorage:', error);
    }
  },

  /**
   * Clear cache entries matching a pattern
   * @param pattern - String to match in cache keys (e.g., '/api/salary-cap-draft')
   */
  clearCacheByPattern(pattern: string): void {
    if (!isBrowser()) {
      return;
    }

    const keysToDelete: string[] = [];
    
    responseCache.forEach((_, key) => {
      if (key.includes(pattern)) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => responseCache.delete(key));

    // Update sessionStorage
    try {
      const serializable: Record<string, CachedResponse<any>> = {};
      responseCache.forEach((value, key) => {
        serializable[key] = value;
      });
      window.sessionStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      console.warn('[API Cache] Failed to update sessionStorage after pattern clear:', error);
    }
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
   * Fetch a single athlete profile with optional related data
   */
  async details(
    athleteId: number,
    options?: {
      progression?: boolean;
      results?: boolean;
      include?: string[];
      discipline?: string | null;
      year?: number | null;
    }
  ) {
    const params = new URLSearchParams({ id: String(athleteId) });

    if (options?.include?.length) {
      params.set('include', options.include.join(','));
    }

    if (options?.progression) {
      params.set('progression', 'true');
    }

    if (options?.results) {
      params.set('results', 'true');
    }

    if (options?.discipline) {
      params.set('discipline', options.discipline);
    }

    if (typeof options?.year === 'number') {
      params.set('year', String(options.year));
    }

    return apiRequest(`/api/athletes?${params.toString()}`);
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

// Rankings API - REMOVED (deprecated snake draft system)
// This API was part of the legacy snake draft system and has been removed.
// Use salaryCapDraftApi for modern salary cap draft functionality.

// Salary Cap Draft API
export const salaryCapDraftApi = {
  /**
   * Submit salary cap team roster (marks as complete)
   */
  async submitTeam(gameId: string, playerCode: string, team: any) {
    return apiRequest('/api/salary-cap-draft', {
      method: 'POST',
      body: JSON.stringify({ gameId, playerCode, team }),
    });
  },

  /**
   * Auto-save partial roster (marks as incomplete)
   */
  async partialSave(gameId: string, roster: any, sessionToken: string) {
    return apiRequest(`/api/teams/partial-save?gameId=${gameId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ roster }),
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
    lock_time?: string;
    logo_url?: string;
    background_image_url?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
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
    lock_time: string;
    logo_url: string;
    background_image_url: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  }>) {
    return apiRequest<any>(`/api/races?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(raceData),
    });
  },

  /**
   * Delete a race
   */
  async delete(id: number) {
    return apiRequest<{ success: boolean; message?: string; race?: any }>(
      `/api/races?id=${id}`,
      { method: 'DELETE' }
    );
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

/**
 * Race News API - Manage curated news items for races
 */
export const raceNewsApi = {
  /**
   * Get news items for a race
   */
  async list(params: { raceId: number; includeHidden?: boolean }) {
    const queryString = new URLSearchParams({
      raceId: String(params.raceId),
      ...(params.includeHidden ? { includeHidden: 'true' } : {}),
    });
    return apiRequest<Array<{
      id: number;
      raceId: number;
      headline: string;
      description?: string;
      articleUrl?: string;
      imageUrl?: string;
      publishedDate?: string;
      displayOrder: number;
      isVisible: boolean;
      createdAt: string;
      updatedAt: string;
    }>>(`/api/race-news?${queryString}`);
  },

  /**
   * Get a specific news item
   */
  async get(id: number) {
    return apiRequest<any>(`/api/race-news?id=${id}`);
  },

  /**
   * Create a new news item
   */
  async create(newsData: {
    raceId: number;
    headline: string;
    description?: string;
    articleUrl?: string;
    imageUrl?: string;
    publishedDate?: string;
    displayOrder?: number;
    isVisible?: boolean;
  }) {
    return apiRequest<any>('/api/race-news', {
      method: 'POST',
      body: JSON.stringify(newsData),
    });
  },

  /**
   * Update an existing news item
   */
  async update(id: number, updates: Partial<{
    headline: string;
    description: string;
    articleUrl: string;
    imageUrl: string;
    publishedDate: string;
    displayOrder: number;
    isVisible: boolean;
  }>) {
    return apiRequest<any>(`/api/race-news?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  /**
   * Delete a news item
   */
  async delete(id: number) {
    return apiRequest<{ success: boolean; message?: string; news?: any }>(
      `/api/race-news?id=${id}`,
      { method: 'DELETE' }
    );
  },
};

/**
 * Standings API - Fantasy league standings
 */
export const standingsApi = {
  /**
   * Fetch fantasy league standings
   */
  async fetch(gameId: string = 'default') {
    return apiRequest<{
      standings: Array<{
        rank: number;
        teamName: string;
        playerCode: string;
        totalPoints: number;
        athletes: any[];
      }>;
      lastUpdated: number;
    }>(`/api/standings?gameId=${gameId}`);
  },
};

// Type definitions for server API responses
interface SessionVerifyResponse {
  valid: boolean;
  session?: {
    id: number;
    type: string;
    gameId: string;
    playerCode: string;
    displayName: string;
    expiresAt: string;
    daysUntilExpiry: number;
  };
  warning?: string | null;
}

interface AthletesResponse {
  men: any[];
  women: any[];
}

interface GameStateResponse {
  rosterLockTime?: string | null;
  resultsFinalized?: boolean;
  draftComplete?: boolean;
  [key: string]: any;
}

interface RosterResponse {
  [playerCode: string]: {
    hasSubmittedRoster: boolean;
    men: any[];
    women: any[];
    [key: string]: any;
  };
}

/**
 * Create a server-side API client with explicit baseUrl
 * Use this in getServerSideProps for SSR data fetching
 * 
 * @param baseUrl - Full base URL (e.g., 'https://marathonmajorsfantasy.com' or 'http://localhost:3000')
 * @example
 * ```typescript
 * export async function getServerSideProps(context) {
 *   const protocol = process.env.VERCEL_ENV === 'production' ? 'https' : 'http';
 *   const baseUrl = process.env.VERCEL_URL 
 *     ? `${protocol}://${process.env.VERCEL_URL}` 
 *     : 'http://localhost:3000';
 *   
 *   const serverApi = createServerApiClient(baseUrl);
 *   const athletes = await serverApi.athletes.list({ confirmedOnly: true });
 *   const gameState = await serverApi.gameState.load('default');
 *   
 *   return { props: { athletes, gameState } };
 * }
 * ```
 */
export function createServerApiClient(baseUrl: string) {
  // Helper to make requests with injected baseUrl
  const makeRequest = <T>(endpoint: string, options?: RequestInit) => 
    apiRequest<T>(endpoint, options, 0, baseUrl);
  
  return {
    athletes: {
      list: (params?: { confirmedOnly?: boolean }) => {
        const confirmedOnly = params?.confirmedOnly ?? false;
        return makeRequest<AthletesResponse>(`/api/athletes?confirmedOnly=${confirmedOnly}`);
      },
      add: (athleteData: any) =>
        makeRequest('/api/add-athlete', {
          method: 'POST',
          body: JSON.stringify(athleteData),
        }),
      update: (athleteId: number, updates: any) =>
        makeRequest('/api/update-athlete', {
          method: 'POST',
          body: JSON.stringify({ athleteId, ...updates }),
        }),
      toggleConfirmation: (athleteId: number, raceId?: number) =>
        makeRequest('/api/toggle-athlete-confirmation', {
          method: 'POST',
          body: JSON.stringify({ athleteId, raceId }),
        }),
      sync: (athleteId: number) =>
        makeRequest(`/api/athletes/${athleteId}/sync`, { method: 'POST' }),
    },
    gameState: {
      load: (gameId: string = 'default') =>
        makeRequest<GameStateResponse>(`/api/game-state?gameId=${gameId}`),
      save: (gameId: string, data: any) =>
        makeRequest('/api/game-state', {
          method: 'POST',
          body: JSON.stringify({ gameId, ...data }),
        }),
    },
    session: {
      verify: (token: string) =>
        makeRequest<SessionVerifyResponse>(`/api/session/verify?token=${token}`),
      delete: (sessionToken: string) =>
        makeRequest('/api/session/delete', {
          method: 'POST',
          body: JSON.stringify({ sessionToken }),
        }),
      hardDelete: (sessionToken: string) =>
        makeRequest('/api/session/hard-delete', {
          method: 'POST',
          body: JSON.stringify({ sessionToken }),
        }),
    },
    salaryCapDraft: {
      get: (gameId: string, sessionToken: string) =>
        makeRequest<RosterResponse>(`/api/salary-cap-draft?gameId=${gameId}`, {
          headers: { 'Authorization': `Bearer ${sessionToken}` },
        }),
      submit: (gameId: string, team: any, sessionToken: string) =>
        makeRequest('/api/salary-cap-draft', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${sessionToken}` },
          body: JSON.stringify({ gameId, team }),
        }),
    },
    results: {
      get: (gameId: string = 'default') =>
        makeRequest(`/api/results?gameId=${gameId}`),
      save: (gameId: string, results: any) =>
        makeRequest('/api/results', {
          method: 'POST',
          body: JSON.stringify({ gameId, results }),
        }),
    },
    standings: {
      get: (gameId: string = 'default') =>
        makeRequest(`/api/standings?gameId=${gameId}`),
    },
  };
}

// Export unified API client
export const apiClient = {
  athletes: athleteApi,
  gameState: gameStateApi,
  session: sessionApi,
  // rankings: REMOVED - deprecated snake draft system (use salaryCapDraft instead)
  salaryCapDraft: salaryCapDraftApi,
  results: resultsApi,
  standings: standingsApi,
  commissioner: commissionerApi,
  races: racesApi,
  athleteRaces: athleteRacesApi,
  raceNews: raceNewsApi,
};

export default apiClient;
