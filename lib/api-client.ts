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
   */
  async list() {
    return apiRequest<{ men: any[]; women: any[] }>('/api/athletes');
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
    return apiRequest<{
      token: string;
      teamName: string;
      playerCode: string;
      ownerName: string | null;
      expiresAt: string;
    }>('/api/session/create', {
      method: 'POST',
      body: JSON.stringify({ teamName, ownerName, gameId }),
    });
  },

  /**
   * Verify session token
   */
  async verify(token: string) {
    return apiRequest<{
      valid: boolean;
      session?: {
        token: string;
        teamName: string;
        playerCode: string;
        ownerName: string | null;
        expiresAt: string;
      };
    }>('/api/session/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
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
   * Get team roster
   */
  async getTeam(gameId: string, playerCode: string) {
    return apiRequest(`/api/salary-cap-draft?gameId=${gameId}&playerCode=${playerCode}`);
  },
};

// Results API
export const resultsApi = {
  /**
   * Fetch race results
   */
  async fetch(gameId: string = 'default') {
    return apiRequest(`/api/results?gameId=${gameId}`);
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
  async verifyTOTP(code: string) {
    return apiRequest<{ valid: boolean; token?: string }>('/api/auth/totp/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
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
};

export default apiClient;
