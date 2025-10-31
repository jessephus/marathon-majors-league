/**
 * API Client with caching and optimizations
 * Uses fetch with intelligent caching strategies
 */

const API_BASE = typeof window !== 'undefined' 
  ? (window.location.origin === 'null' ? '' : window.location.origin)
  : '';

// In-memory cache for frequently accessed data
const memoryCache = new Map<string, { data: any; timestamp: number; etag?: string }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface FetchOptions extends RequestInit {
  skipCache?: boolean;
  cacheKey?: string;
}

/**
 * Enhanced fetch with automatic caching and ETag support
 */
export async function cachedFetch<T = any>(
  url: string, 
  options: FetchOptions = {}
): Promise<T> {
  const { skipCache = false, cacheKey, ...fetchOptions } = options;
  const key = cacheKey || url;
  
  // Check memory cache first
  if (!skipCache && memoryCache.has(key)) {
    const cached = memoryCache.get(key)!;
    const age = Date.now() - cached.timestamp;
    
    if (age < CACHE_DURATION) {
      // Cache hit - return immediately
      return cached.data;
    }
    
    // Stale cache - use ETag for conditional request
    if (cached.etag) {
      // Merge with existing headers if present
      fetchOptions.headers = {
        ...(fetchOptions.headers || {}),
        'If-None-Match': cached.etag,
      };
    }
  }
  
  const response = await fetch(url, fetchOptions);
  
  // 304 Not Modified - return cached data
  if (response.status === 304 && memoryCache.has(key)) {
    const cached = memoryCache.get(key)!;
    cached.timestamp = Date.now(); // Refresh timestamp
    return cached.data;
  }
  
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }
  
  const data = await response.json();
  const etag = response.headers.get('ETag') || undefined;
  
  // Store in cache
  if (!skipCache) {
    memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      etag,
    });
  }
  
  return data;
}

/**
 * Clear cache for a specific key or all keys
 */
export function clearCache(key?: string) {
  if (key) {
    memoryCache.delete(key);
  } else {
    memoryCache.clear();
  }
}

/**
 * Game-specific API methods with built-in caching
 */
export class GameAPI {
  constructor(private gameId: string = 'default') {}
  
  setGameId(gameId: string) {
    this.gameId = gameId;
  }
  
  async getAthletes() {
    return cachedFetch<{ men: any[]; women: any[] }>(
      `${API_BASE}/api/athletes`,
      { cacheKey: 'athletes' }
    );
  }
  
  async getGameState() {
    return cachedFetch(
      `${API_BASE}/api/game-state?gameId=${this.gameId}`,
      { cacheKey: `game-state-${this.gameId}` }
    );
  }
  
  async saveGameState(data: any) {
    clearCache(`game-state-${this.gameId}`);
    return fetch(`${API_BASE}/api/game-state?gameId=${this.gameId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  }
  
  async getRankings(playerCode: string) {
    return cachedFetch(
      `${API_BASE}/api/rankings?gameId=${this.gameId}&playerCode=${playerCode}`,
      { cacheKey: `rankings-${this.gameId}-${playerCode}` }
    );
  }
  
  async saveRankings(playerCode: string, data: any) {
    clearCache(`rankings-${this.gameId}-${playerCode}`);
    return fetch(`${API_BASE}/api/rankings?gameId=${this.gameId}&playerCode=${playerCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then(r => r.json());
  }
  
  async getTeams() {
    return cachedFetch(
      `${API_BASE}/api/draft?gameId=${this.gameId}`,
      { cacheKey: `teams-${this.gameId}` }
    );
  }
  
  async executeDraft() {
    clearCache(`teams-${this.gameId}`);
    clearCache(`game-state-${this.gameId}`);
    return fetch(`${API_BASE}/api/draft?gameId=${this.gameId}`, {
      method: 'POST',
    }).then(r => r.json());
  }
  
  async getResults() {
    return cachedFetch(
      `${API_BASE}/api/results?gameId=${this.gameId}`,
      { cacheKey: `results-${this.gameId}`, skipCache: true } // Always fresh for results
    );
  }
  
  async saveResults(results: any) {
    clearCache(`results-${this.gameId}`);
    clearCache(`standings-${this.gameId}`);
    return fetch(`${API_BASE}/api/results?gameId=${this.gameId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(results),
    }).then(r => r.json());
  }
  
  async getStandings() {
    // Standings can be cached briefly since they're computed from results
    return cachedFetch(
      `${API_BASE}/api/standings?gameId=${this.gameId}`,
      { cacheKey: `standings-${this.gameId}` }
    );
  }
}

// Singleton instance
export const gameAPI = new GameAPI();
