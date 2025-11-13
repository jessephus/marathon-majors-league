/**
 * useStateManager Hook
 * 
 * React hook for interacting with the GameStateManager singleton.
 * Provides event subscription and state updates.
 */

import { useEffect, useRef, useCallback } from 'react';
import { GameStateManager, StateEventType, StateEventListener } from './state-manager';

// Singleton instance
let stateManagerInstance: GameStateManager | null = null;

/**
 * Get or create the GameStateManager singleton
 */
export function getStateManager(): GameStateManager {
  if (!stateManagerInstance) {
    stateManagerInstance = new GameStateManager({
      debug: process.env.NODE_ENV === 'development',
    });
  }
  return stateManagerInstance;
}

/**
 * Hook for subscribing to state manager events
 */
export function useStateManagerEvent(
  eventType: StateEventType,
  listener: StateEventListener
) {
  const stateManager = getStateManager();
  const listenerRef = useRef(listener);

  // Update listener ref when it changes
  useEffect(() => {
    listenerRef.current = listener;
  }, [listener]);

  useEffect(() => {
    // Create stable listener that calls current listener ref
    const stableListener: StateEventListener = (data) => {
      listenerRef.current(data);
    };

    // Subscribe to event
    const unsubscribe = stateManager.on(eventType, stableListener);

    // Cleanup on unmount
    return unsubscribe;
  }, [eventType, stateManager]);
}

/**
 * Hook for invalidating results cache
 */
export function useResultsCache() {
  const stateManager = getStateManager();

  const invalidate = useCallback(() => {
    stateManager.invalidateResultsCache();
  }, [stateManager]);

  return { invalidate };
}

/**
 * Hook for updating results
 */
export function useResultsUpdate() {
  const stateManager = getStateManager();

  const updateResults = useCallback(
    async (gameId: string, payload: any) => {
      return stateManager.updateResults(gameId, payload);
    },
    [stateManager]
  );

  return { updateResults };
}

export default useStateManagerEvent;
