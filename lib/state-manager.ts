/**
 * GameStateManager - Centralized State Management
 * 
 * Replaces scattered global state mutations with a unified state layer.
 * Implements pub/sub pattern, versioning, persistence, and TTL caching.
 * 
 * References: 
 * - Issue #89 (State Phase 3)
 * - docs/PROCESS_MONOLITH_AUDIT.md (126+ global mutations)
 */

import { gameStateApi, resultsApi } from './api-client';

// Types
export interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
  pb: string;
  headshotUrl?: string;
  worldAthleticsId?: string;
  salary?: number;
  marathonRank?: number;
  roadRunningRank?: number;
  overallRank?: number;
  age?: number;
  dateOfBirth?: string;
  sponsor?: string;
  seasonBest?: string;
}

export interface GameState {
  activeRaceId?: number | null; // Per-game active race (from games.active_race_id)
  athletes: {
    men: Athlete[];
    women: Athlete[];
  };
  players: string[];
  currentPlayer: string | null;
  rankings: Record<string, any>;
  teams: Record<string, any>;
  results: Record<string, any>;
  draftComplete: boolean;
  resultsFinalized: boolean;
  rosterLockTime: string | null;
}

export interface SessionState {
  token: string | null;
  teamName: string | null;
  playerCode: string | null;
  ownerName: string | null;
  expiresAt: string | null;
}

export interface CommissionerState {
  isCommissioner: boolean;
  loginTime: string | null;
  expiresAt: string | null;
}

// Cache entry with TTL
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  gameId: string;
}

// State version for migration support
interface StateVersion {
  version: number;
  gameState: GameState;
  sessionState: SessionState;
  commissionerState: CommissionerState;
}

// Event system types
export type StateEventType = 
  | 'gameState:updated'
  | 'gameState:loaded'
  | 'session:created'
  | 'session:updated'
  | 'session:cleared'
  | 'commissioner:login'
  | 'commissioner:logout'
  | 'results:updated'
  | 'results:invalidated'
  | 'roster:locked'
  | 'cache:expired';

export type StateEventListener = (data?: any) => void;

// Default TTL values (milliseconds)
const DEFAULT_RESULTS_CACHE_TTL = 30000; // 30 seconds
const DEFAULT_GAME_STATE_CACHE_TTL = 60000; // 60 seconds

// State version for migrations
const CURRENT_STATE_VERSION = 1;

/**
 * GameStateManager - Centralized state management with caching, pub/sub, and persistence
 */
export class GameStateManager {
  private gameState: GameState;
  private sessionState: SessionState;
  private commissionerState: CommissionerState;
  
  // Caches with TTL
  private resultsCache: CacheEntry<any> | null = null;
  private gameStateCache: CacheEntry<GameState> | null = null;
  
  // TTL configuration
  private resultsCacheTTL: number;
  private gameStateCacheTTL: number;
  
  // Event listeners
  private listeners: Map<StateEventType, Set<StateEventListener>> = new Map();
  
  // Storage adapter
  private storageAdapter: StorageAdapter;
  
  // Debug mode
  private debug: boolean;
  
  constructor(options: {
    debug?: boolean;
    resultsCacheTTL?: number;
    gameStateCacheTTL?: number;
    storageAdapter?: StorageAdapter;
  } = {}) {
    // Initialize state with defaults
    this.gameState = this.getDefaultGameState();
    this.sessionState = this.getDefaultSessionState();
    this.commissionerState = this.getDefaultCommissionerState();
    
    // Configuration
    this.debug = options.debug ?? this.isDevEnvironment();
    this.resultsCacheTTL = options.resultsCacheTTL ?? DEFAULT_RESULTS_CACHE_TTL;
    this.gameStateCacheTTL = options.gameStateCacheTTL ?? DEFAULT_GAME_STATE_CACHE_TTL;
    this.storageAdapter = options.storageAdapter ?? new LocalStorageAdapter();
    
    // Initialize from storage
    this.initializeFromStorage();
  }
  
  // ============================================================================
  // Core State Methods
  // ============================================================================
  
  /**
   * Load game state from API with caching
   */
  async loadGameState(gameId: string, forceRefresh = false): Promise<GameState> {
    const now = Date.now();
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.gameStateCache && 
        this.gameStateCache.gameId === gameId &&
        (now - this.gameStateCache.timestamp) < this.gameStateCacheTTL) {
      this.devLog('📦 Using cached game state');
      return this.gameStateCache.data;
    }
    
    // Fetch fresh data
    this.devLog('🌐 Fetching fresh game state from API');
    try {
      const data = await gameStateApi.load(gameId) as any;
      
      // Update state
      this.gameState = {
        ...this.gameState,
        players: data.players || [],
        draftComplete: data.draftComplete || false,
        resultsFinalized: data.resultsFinalized || false,
        rosterLockTime: data.rosterLockTime || null,
        rankings: data.rankings || {},
        teams: data.teams || {},
        results: data.results || {},
      };
      
      // Update cache
      this.gameStateCache = {
        data: this.gameState,
        timestamp: now,
        gameId,
      };
      
      // Emit event
      this.emit('gameState:loaded', { gameId, state: this.gameState });
      
      return this.gameState;
    } catch (error) {
      console.error('Error loading game state:', error);
      throw error;
    }
  }
  
  /**
   * Update game state (partial update supported)
   */
  updateGameState(updates: Partial<GameState>): void {
    const oldState = { ...this.gameState };
    this.gameState = { ...this.gameState, ...updates };
    
    // Invalidate cache on updates
    this.gameStateCache = null;
    
    this.devLog('🔄 Game state updated:', updates);
    this.emit('gameState:updated', { updates, oldState, newState: this.gameState });
  }
  
  /**
   * Update race results with cache invalidation
   */
  async updateResults(gameId: string, payload: any): Promise<void> {
    try {
      const data = await resultsApi.update(gameId, payload) as any;
      
      // Update local state
      this.gameState.results = data.results || {};
      
      // Invalidate caches
      this.invalidateResultsCache();
      
      this.devLog('✅ Results updated successfully');
      this.emit('results:updated', { gameId, results: data.results });
    } catch (error) {
      console.error('Error updating results:', error);
      throw error;
    }
  }
  
  /**
   * Set roster lock time
   */
  async setRosterLock(time: string | null): Promise<void> {
    this.gameState.rosterLockTime = time;
    
    this.devLog(`🔒 Roster lock time set to: ${time}`);
    this.emit('roster:locked', { time });
  }
  
  /**
   * Invalidate results cache manually
   */
  invalidateResultsCache(): void {
    this.resultsCache = null;
    this.devLog('🗑️ Results cache invalidated');
    this.emit('results:invalidated', {});
  }
  
  /**
   * Invalidate game state cache manually
   */
  invalidateGameStateCache(): void {
    this.gameStateCache = null;
    this.devLog('🗑️ Game state cache invalidated');
    this.emit('cache:expired', { cache: 'gameState' });
  }
  
  // ============================================================================
  // Session Management
  // ============================================================================
  
  /**
   * Update session state
   */
  updateSession(updates: Partial<SessionState>): void {
    this.sessionState = { ...this.sessionState, ...updates };
    
    // Persist to storage
    this.storageAdapter.saveSession(this.sessionState);
    
    this.devLog('👤 Session updated:', updates);
    this.emit('session:updated', { session: this.sessionState });
  }
  
  /**
   * Clear session
   */
  clearSession(): void {
    this.sessionState = this.getDefaultSessionState();
    this.storageAdapter.clearSession();
    
    this.devLog('🚪 Session cleared');
    this.emit('session:cleared', {});
  }
  
  /**
   * Update commissioner session
   */
  updateCommissionerSession(updates: Partial<CommissionerState>): void {
    this.commissionerState = { ...this.commissionerState, ...updates };
    
    // Persist to storage
    this.storageAdapter.saveCommissionerSession(this.commissionerState);
    
    this.devLog('👑 Commissioner session updated:', updates);
    
    if (updates.isCommissioner) {
      this.emit('commissioner:login', { session: this.commissionerState });
    } else if (this.commissionerState.isCommissioner === false) {
      this.emit('commissioner:logout', {});
    }
  }
  
  /**
   * Clear commissioner session
   */
  clearCommissionerSession(): void {
    this.commissionerState = this.getDefaultCommissionerState();
    this.storageAdapter.clearCommissionerSession();
    
    this.devLog('👑 Commissioner session cleared');
    this.emit('commissioner:logout', {});
  }
  
  // ============================================================================
  // Getters
  // ============================================================================
  
  getGameState(): GameState {
    return { ...this.gameState };
  }
  
  getSessionState(): SessionState {
    return { ...this.sessionState };
  }
  
  getCommissionerState(): CommissionerState {
    return { ...this.commissionerState };
  }
  
  // ============================================================================
  // Pub/Sub Event System
  // ============================================================================
  
  /**
   * Subscribe to state events
   */
  on(eventType: StateEventType, listener: StateEventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }
  
  /**
   * Emit state event
   */
  private emit(eventType: StateEventType, data?: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }
  
  // ============================================================================
  // State Versioning & Migration
  // ============================================================================
  
  /**
   * Export current state with version
   */
  exportState(): StateVersion {
    return {
      version: CURRENT_STATE_VERSION,
      gameState: this.gameState,
      sessionState: this.sessionState,
      commissionerState: this.commissionerState,
    };
  }
  
  /**
   * Import and migrate state from previous version
   */
  importState(versionedState: StateVersion): void {
    if (versionedState.version < CURRENT_STATE_VERSION) {
      this.devLog(`🔄 Migrating state from v${versionedState.version} to v${CURRENT_STATE_VERSION}`);
      const migratedState = this.migrateState(versionedState);
      this.gameState = migratedState.gameState;
      this.sessionState = migratedState.sessionState;
      this.commissionerState = migratedState.commissionerState;
    } else {
      this.gameState = versionedState.gameState;
      this.sessionState = versionedState.sessionState;
      this.commissionerState = versionedState.commissionerState;
    }
  }
  
  /**
   * Migrate state from older versions
   */
  private migrateState(oldState: StateVersion): StateVersion {
    let state = { ...oldState };
    
    // Migration logic for future versions
    // Example: if (state.version === 1) { ... upgrade to v2 ... }
    
    state.version = CURRENT_STATE_VERSION;
    return state;
  }
  
  // ============================================================================
  // Private Helpers
  // ============================================================================
  
  private initializeFromStorage(): void {
    // Load session from storage
    const storedSession = this.storageAdapter.loadSession();
    if (storedSession) {
      this.sessionState = storedSession;
      this.devLog('📦 Loaded session from storage');
    }
    
    // Load commissioner session from storage
    const storedCommissioner = this.storageAdapter.loadCommissionerSession();
    if (storedCommissioner) {
      // Check if session is expired
      if (storedCommissioner.expiresAt) {
        const expiresAt = new Date(storedCommissioner.expiresAt);
        if (expiresAt > new Date()) {
          this.commissionerState = storedCommissioner;
          this.devLog('📦 Loaded commissioner session from storage');
        } else {
          this.devLog('⏰ Commissioner session expired, clearing');
          this.storageAdapter.clearCommissionerSession();
        }
      }
    }
  }
  
  private getDefaultGameState(): GameState {
    return {
      athletes: { men: [], women: [] },
      players: [],
      currentPlayer: null,
      rankings: {},
      teams: {},
      results: {},
      draftComplete: false,
      resultsFinalized: false,
      rosterLockTime: null,
    };
  }
  
  private getDefaultSessionState(): SessionState {
    return {
      token: null,
      teamName: null,
      playerCode: null,
      ownerName: null,
      expiresAt: null,
    };
  }
  
  private getDefaultCommissionerState(): CommissionerState {
    return {
      isCommissioner: false,
      loginTime: null,
      expiresAt: null,
    };
  }
  
  private isDevEnvironment(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1';
  }
  
  /**
   * Development-only logging
   */
  private devLog(...args: any[]): void {
    if (this.debug) {
      console.log('[StateManager]', ...args);
    }
  }
}

// ============================================================================
// Storage Adapter
// ============================================================================

/**
 * Storage adapter interface - abstracts localStorage, sessionStorage, or other storage
 */
export interface StorageAdapter {
  saveSession(session: SessionState): void;
  loadSession(): SessionState | null;
  clearSession(): void;
  saveCommissionerSession(session: CommissionerState): void;
  loadCommissionerSession(): CommissionerState | null;
  clearCommissionerSession(): void;
  saveGameId(gameId: string): void;
  loadGameId(): string | null;
}

/**
 * LocalStorage implementation of StorageAdapter
 * Replaces direct localStorage access with controlled adapter
 */
export class LocalStorageAdapter implements StorageAdapter {
  private readonly TEAM_SESSION_KEY = 'marathon_fantasy_team';
  private readonly COMMISSIONER_SESSION_KEY = 'marathon_fantasy_commissioner';
  private readonly GAME_ID_KEY = 'current_game_id';
  
  saveSession(session: SessionState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.TEAM_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session to localStorage:', error);
    }
  }
  
  loadSession(): SessionState | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(this.TEAM_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load session from localStorage:', error);
      return null;
    }
  }
  
  clearSession(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.TEAM_SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session from localStorage:', error);
    }
  }
  
  saveCommissionerSession(session: CommissionerState): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.COMMISSIONER_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save commissioner session to localStorage:', error);
    }
  }
  
  loadCommissionerSession(): CommissionerState | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = localStorage.getItem(this.COMMISSIONER_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load commissioner session from localStorage:', error);
      return null;
    }
  }
  
  clearCommissionerSession(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(this.COMMISSIONER_SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear commissioner session from localStorage:', error);
    }
  }
  
  saveGameId(gameId: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.GAME_ID_KEY, gameId);
    } catch (error) {
      console.error('Failed to save game ID to localStorage:', error);
    }
  }
  
  loadGameId(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(this.GAME_ID_KEY);
    } catch (error) {
      console.error('Failed to load game ID from localStorage:', error);
      return null;
    }
  }
}

/**
 * Singleton instance for use across the app
 */
let globalStateManager: GameStateManager | null = null;

/**
 * Get or create the global state manager instance
 */
export function getStateManager(options?: {
  debug?: boolean;
  resultsCacheTTL?: number;
  gameStateCacheTTL?: number;
  storageAdapter?: StorageAdapter;
}): GameStateManager {
  if (!globalStateManager) {
    globalStateManager = new GameStateManager(options);
  }
  return globalStateManager;
}

/**
 * Reset the global state manager (useful for testing)
 */
export function resetStateManager(): void {
  globalStateManager = null;
}
