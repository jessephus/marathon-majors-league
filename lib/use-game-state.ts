/**
 * React Hooks for GameStateManager
 * 
 * Provides React hooks that consume the centralized GameStateManager.
 * Replaces direct global variable access in React components.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  GameStateManager, 
  getStateManager,
  GameState,
  SessionState,
  CommissionerState,
  StateEventType,
} from './state-manager';

/**
 * Hook to access the global GameStateManager instance
 */
export function useStateManager(): GameStateManager {
  return getStateManager();
}

/**
 * Hook to subscribe to game state with automatic re-rendering
 */
export function useGameState() {
  const manager = useStateManager();
  const [gameState, setGameState] = useState<GameState>(manager.getGameState());
  
  useEffect(() => {
    // Subscribe to updates
    const unsubscribeUpdated = manager.on('gameState:updated', () => {
      setGameState(manager.getGameState());
    });
    
    const unsubscribeLoaded = manager.on('gameState:loaded', () => {
      setGameState(manager.getGameState());
    });
    
    // Cleanup subscriptions
    return () => {
      unsubscribeUpdated();
      unsubscribeLoaded();
    };
  }, [manager]);
  
  // Return state and update function
  const updateGameState = useCallback((updates: Partial<GameState>) => {
    manager.updateGameState(updates);
  }, [manager]);
  
  return { 
    gameState, 
    updateGameState,
    loadGameState: (gameId: string, forceRefresh?: boolean) => 
      manager.loadGameState(gameId, forceRefresh),
    invalidateCache: () => manager.invalidateGameStateCache(),
  };
}

/**
 * Hook to subscribe to session state with automatic re-rendering
 */
export function useSession() {
  const manager = useStateManager();
  const [sessionState, setSessionState] = useState<SessionState>(manager.getSessionState());
  
  useEffect(() => {
    // Subscribe to updates
    const unsubscribeUpdated = manager.on('session:updated', () => {
      setSessionState(manager.getSessionState());
    });
    
    const unsubscribeCleared = manager.on('session:cleared', () => {
      setSessionState(manager.getSessionState());
    });
    
    // Cleanup subscriptions
    return () => {
      unsubscribeUpdated();
      unsubscribeCleared();
    };
  }, [manager]);
  
  const updateSession = useCallback((updates: Partial<SessionState>) => {
    manager.updateSession(updates);
  }, [manager]);
  
  const clearSession = useCallback(() => {
    manager.clearSession();
  }, [manager]);
  
  return {
    sessionState,
    updateSession,
    clearSession,
  };
}

/**
 * Hook to subscribe to commissioner state with automatic re-rendering
 */
export function useCommissioner() {
  const manager = useStateManager();
  const [commissionerState, setCommissionerState] = useState<CommissionerState>(
    manager.getCommissionerState()
  );
  
  useEffect(() => {
    // Subscribe to updates
    const unsubscribeLogin = manager.on('commissioner:login', () => {
      setCommissionerState(manager.getCommissionerState());
    });
    
    const unsubscribeLogout = manager.on('commissioner:logout', () => {
      setCommissionerState(manager.getCommissionerState());
    });
    
    // Cleanup subscriptions
    return () => {
      unsubscribeLogin();
      unsubscribeLogout();
    };
  }, [manager]);
  
  const updateCommissioner = useCallback((updates: Partial<CommissionerState>) => {
    manager.updateCommissionerSession(updates);
  }, [manager]);
  
  const clearCommissioner = useCallback(() => {
    manager.clearCommissionerSession();
  }, [manager]);
  
  return {
    commissionerState,
    updateCommissioner,
    clearCommissioner,
    isCommissioner: commissionerState.isCommissioner,
  };
}

/**
 * Hook to manage results with cache invalidation
 */
export function useResults() {
  const manager = useStateManager();
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  
  useEffect(() => {
    // Subscribe to result updates
    const unsubscribe = manager.on('results:updated', () => {
      setLastUpdate(Date.now());
    });
    
    return unsubscribe;
  }, [manager]);
  
  const updateResults = useCallback(async (gameId: string, payload: any) => {
    await manager.updateResults(gameId, payload);
  }, [manager]);
  
  const invalidateCache = useCallback(() => {
    manager.invalidateResultsCache();
  }, [manager]);
  
  return {
    updateResults,
    invalidateCache,
    lastUpdate,
  };
}

/**
 * Hook to manage roster lock time
 */
export function useRosterLock() {
  const { gameState } = useGameState();
  const manager = useStateManager();
  
  const setRosterLock = useCallback(async (time: string | null) => {
    await manager.setRosterLock(time);
  }, [manager]);
  
  const isLocked = useCallback(() => {
    if (!gameState.rosterLockTime) return false;
    return new Date(gameState.rosterLockTime) <= new Date();
  }, [gameState.rosterLockTime]);
  
  return {
    rosterLockTime: gameState.rosterLockTime,
    setRosterLock,
    isLocked: isLocked(),
  };
}

/**
 * Hook to subscribe to specific state events
 */
export function useStateEvent(
  eventType: StateEventType,
  handler: (data?: any) => void
): void {
  const manager = useStateManager();
  
  useEffect(() => {
    const unsubscribe = manager.on(eventType, handler);
    return unsubscribe;
  }, [manager, eventType, handler]);
}

/**
 * Hook to export/import state (for debugging or migration)
 */
export function useStateSnapshot() {
  const manager = useStateManager();
  
  const exportState = useCallback(() => {
    return manager.exportState();
  }, [manager]);
  
  const importState = useCallback((state: any) => {
    manager.importState(state);
  }, [manager]);
  
  return {
    exportState,
    importState,
  };
}
