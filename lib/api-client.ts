/**
 * API Client
 * 
 * Centralized API communication layer for the new Next.js page structure.
 * This replaces scattered fetch() calls throughout app.js and salary-cap-draft.js
 * during the migration.
 */

const API_BASE = typeof window !== 'undefined' 
  ? (window.location.origin === 'null' ? '' : window.location.origin)
  : '';

// Helper function for making API requests
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.statusText}`);
  }

  return response.json();
}

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
