/**
 * Shared State Provider
 * 
 * Provides global state management for the new Next.js page structure.
 * This replaces the legacy global `gameState`, `anonymousSession`, and 
 * `commissionerSession` objects from app.js during the migration.
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// Type definitions matching legacy state structures
export interface Athlete {
  id: number;
  name: string;
  country: string;
  gender: string;
  pb: string; // API returns "pb" not "personal_best"
  headshotUrl?: string; // camelCase to match API
  worldAthleticsId?: string; // camelCase to match API
  salary?: number;
  // Extended fields (all camelCase to match API)
  marathonRank?: number;
  roadRunningRank?: number;
  overallRank?: number;
  age?: number;
  dateOfBirth?: string;
  sponsor?: string;
  seasonBest?: string;
}

export interface PlayerRanking {
  gender: string;
  athleteId: number;
  rankOrder: number;
}

export interface TeamRoster {
  playerCode: string;
  athletes: Athlete[];
}

export interface AthleteResult {
  athleteId: number;
  finishTime?: string;
  split5k?: string;
  split10k?: string;
  splitHalf?: string;
  split30k?: string;
  split35k?: string;
  split40k?: string;
  isFinal?: boolean;
}

export interface GameState {
  gameId: string; // Current game identifier
  athletes: {
    men: Athlete[];
    women: Athlete[];
  };
  players: string[];
  currentPlayer: string | null;
  rankings: Record<string, PlayerRanking[]>;
  teams: Record<string, TeamRoster>;
  results: Record<string, AthleteResult>;
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

interface AppState {
  gameState: GameState;
  sessionState: SessionState;
  commissionerState: CommissionerState;
}

interface AppContextValue extends AppState {
  setGameState: (state: Partial<GameState>) => void;
  setSessionState: (state: Partial<SessionState>) => void;
  setCommissionerState: (state: Partial<CommissionerState>) => void;
  resetState: () => void;
}

// Default stub data (matches PROCESS_SSR_STRATEGY.md)
const DEFAULT_STATE: AppState = {
  gameState: {
    gameId: typeof window !== 'undefined' 
      ? localStorage.getItem('current_game_id') || 'default'
      : 'default',
    athletes: { men: [], women: [] },
    players: [],
    currentPlayer: null,
    rankings: {},
    teams: {},
    results: {},
    draftComplete: false,
    resultsFinalized: false,
    rosterLockTime: null,
  },
  sessionState: {
    token: null,
    teamName: null,
    playerCode: null,
    ownerName: null,
    expiresAt: null,
  },
  commissionerState: {
    isCommissioner: false,
    loginTime: null,
    expiresAt: null,
  },
};

// Create context
const AppStateContext = createContext<AppContextValue | undefined>(undefined);

// Provider component
export function AppStateProvider({ 
  children, 
  initialState = DEFAULT_STATE 
}: { 
  children: ReactNode; 
  initialState?: AppState;
}) {
  const [state, setState] = useState<AppState>(() => {
    // Initialize state with localStorage data if available
    if (typeof window !== 'undefined') {
      const savedCommissionerState = localStorage.getItem('commissioner_state');
      if (savedCommissionerState) {
        try {
          const parsed = JSON.parse(savedCommissionerState);
          // Check if commissioner session is still valid
          if (parsed.expiresAt && new Date(parsed.expiresAt) > new Date()) {
            return {
              ...initialState,
              commissionerState: parsed,
            };
          } else {
            // Expired, remove from storage
            localStorage.removeItem('commissioner_state');
          }
        } catch (e) {
          console.error('Failed to parse commissioner state:', e);
          localStorage.removeItem('commissioner_state');
        }
      }
    }
    return initialState;
  });

  const setGameState = useCallback((updates: Partial<GameState>) => {
    setState((prev) => ({
      ...prev,
      gameState: { ...prev.gameState, ...updates },
    }));

    // Sync gameId changes to localStorage
    if (typeof window !== 'undefined' && 'gameId' in updates && updates.gameId) {
      localStorage.setItem('current_game_id', updates.gameId);
    }

    // Emit state change events
    if (typeof window !== 'undefined') {
      // Emit resultsUpdated event if results or resultsFinalized changed
      if ('results' in updates || 'resultsFinalized' in updates) {
        window.dispatchEvent(new CustomEvent('resultsUpdated', { 
          detail: { 
            results: updates.results,
            finalized: updates.resultsFinalized 
          } 
        }));
      }

      // Emit athleteUpdated event if athletes changed
      if ('athletes' in updates) {
        window.dispatchEvent(new CustomEvent('athleteUpdated', { 
          detail: { athletes: updates.athletes } 
        }));
      }
    }
  }, []);

  const setSessionState = useCallback((updates: Partial<SessionState>) => {
    setState((prev) => ({
      ...prev,
      sessionState: { ...prev.sessionState, ...updates },
    }));
  }, []);

  const setCommissionerState = useCallback((updates: Partial<CommissionerState>) => {
    setState((prev) => {
      const newCommissionerState = { ...prev.commissionerState, ...updates };
      
      // Persist to localStorage
      if (typeof window !== 'undefined') {
        if (newCommissionerState.isCommissioner) {
          localStorage.setItem('commissioner_state', JSON.stringify(newCommissionerState));
        } else {
          localStorage.removeItem('commissioner_state');
        }
      }
      
      return {
        ...prev,
        commissionerState: newCommissionerState,
      };
    });
  }, []);

  const resetState = useCallback(() => {
    setState(DEFAULT_STATE);
  }, []);

  const value: AppContextValue = {
    ...state,
    setGameState,
    setSessionState,
    setCommissionerState,
    resetState,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// Custom hook to use the app state
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

// Convenience hooks for specific state slices
export function useGameState() {
  const { gameState, setGameState } = useAppState();
  return { gameState, setGameState };
}

export function useSessionState() {
  const { sessionState, setSessionState } = useAppState();
  return { sessionState, setSessionState };
}

export function useCommissionerState() {
  const { commissionerState, setCommissionerState } = useAppState();
  return { commissionerState, setCommissionerState };
}
