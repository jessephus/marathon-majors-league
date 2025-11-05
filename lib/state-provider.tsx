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
  const [state, setState] = useState<AppState>(initialState);

  const setGameState = useCallback((updates: Partial<GameState>) => {
    setState((prev) => ({
      ...prev,
      gameState: { ...prev.gameState, ...updates },
    }));
  }, []);

  const setSessionState = useCallback((updates: Partial<SessionState>) => {
    setState((prev) => ({
      ...prev,
      sessionState: { ...prev.sessionState, ...updates },
    }));
  }, []);

  const setCommissionerState = useCallback((updates: Partial<CommissionerState>) => {
    setState((prev) => ({
      ...prev,
      commissionerState: { ...prev.commissionerState, ...updates },
    }));
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
