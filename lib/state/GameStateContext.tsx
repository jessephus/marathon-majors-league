/**
 * Game State Context - Centralized state management with caching
 */

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { gameAPI } from '../api/client';

interface GameStateContextValue {
  gameId: string;
  setGameId: (id: string) => void;
  athletes: { men: any[]; women: any[] } | null;
  gameState: any | null;
  teams: any | null;
  results: any | null;
  standings: any | null;
  isLoading: boolean;
  error: any;
  refetch: () => void;
}

const GameStateContext = createContext<GameStateContextValue | null>(null);

/**
 * Custom hook to use game state
 */
export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
}

/**
 * Memoized athlete maps for quick lookups
 */
export function useAthleteMap() {
  const { athletes } = useGameState();
  
  return useMemo(() => {
    if (!athletes) return { byId: new Map(), byGender: { men: new Map(), women: new Map() } };
    
    const byId = new Map();
    const byGender = { men: new Map(), women: new Map() };
    
    athletes.men.forEach(athlete => {
      byId.set(athlete.id, athlete);
      byGender.men.set(athlete.id, athlete);
    });
    
    athletes.women.forEach(athlete => {
      byId.set(athlete.id, athlete);
      byGender.women.set(athlete.id, athlete);
    });
    
    return { byId, byGender };
  }, [athletes]);
}

/**
 * Provider component that manages global game state
 */
export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [gameId, setGameId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('current_game_id') || 'default';
    }
    return 'default';
  });
  
  // Update API client when gameId changes
  useEffect(() => {
    gameAPI.setGameId(gameId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('current_game_id', gameId);
    }
  }, [gameId]);
  
  // Fetch athletes with SWR (cached, revalidated in background)
  const { data: athletes, error: athletesError } = useSWR(
    'athletes',
    () => gameAPI.getAthletes(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );
  
  // Fetch game state with SWR
  const { data: gameState, error: gameStateError, mutate: mutateGameState } = useSWR(
    ['game-state', gameId],
    () => gameAPI.getGameState(),
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000, // 5 seconds
    }
  );
  
  // Fetch teams if draft is complete
  const { data: teams, error: teamsError } = useSWR(
    gameState?.draftComplete ? ['teams', gameId] : null,
    () => gameAPI.getTeams(),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000, // 30 seconds
    }
  );
  
  // Fetch results with more frequent updates
  const { data: results, error: resultsError } = useSWR(
    ['results', gameId],
    () => gameAPI.getResults(),
    {
      refreshInterval: 30000, // Poll every 30 seconds during race
      revalidateOnFocus: true,
    }
  );
  
  // Fetch standings (precomputed server-side)
  const { data: standings, error: standingsError } = useSWR(
    ['standings', gameId],
    () => gameAPI.getStandings(),
    {
      refreshInterval: 60000, // Poll every minute
      revalidateOnFocus: true,
      dedupingInterval: 10000, // 10 seconds
    }
  );
  
  const isLoading = !athletes && !athletesError;
  const error = athletesError || gameStateError || teamsError || resultsError || standingsError;
  
  const refetch = () => {
    mutateGameState();
  };
  
  const value: GameStateContextValue = {
    gameId,
    setGameId,
    athletes: athletes || null,
    gameState: gameState || null,
    teams: teams || null,
    results: results || null,
    standings: standings || null,
    isLoading,
    error,
    refetch,
  };
  
  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}
