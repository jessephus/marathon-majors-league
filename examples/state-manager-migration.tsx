/**
 * Example Migration: Using GameStateManager
 * 
 * This file demonstrates how to migrate a legacy component that directly
 * accesses global state to use the new centralized GameStateManager.
 */

// ============================================================================
// BEFORE: Legacy approach with direct global state access
// ============================================================================

/*
// public/app.js (legacy monolith, now removed)

// Global state variables
let gameState = {
  athletes: { men: [], women: [] },
  players: [],
  draftComplete: false,
  results: {},
};

let anonymousSession = {
  token: null,
  teamName: null,
  playerCode: null,
};

// Direct state mutations scattered throughout code
function handleDraftComplete() {
  gameState.draftComplete = true;  // 🔴 Direct mutation
  saveGameState();  // Manual persistence
}

// Direct localStorage access
function saveSession(session) {
  localStorage.setItem('marathon_fantasy_team', JSON.stringify(session));  // 🔴 Direct access
}

// Manual cache management
let resultsCache = null;
let resultsCacheTime = 0;
const CACHE_TTL = 30000;

async function fetchResults() {
  const now = Date.now();
  if (resultsCache && (now - resultsCacheTime) < CACHE_TTL) {
    return resultsCache;  // Use cache
  }
  
  const response = await fetch('/api/results');
  resultsCache = await response.json();
  resultsCacheTime = now;
  return resultsCache;
}
*/

// ============================================================================
// AFTER: Using GameStateManager (TypeScript/React)
// ============================================================================

import React, { useEffect } from 'react';
import { useGameState, useSession, useCommissioner, useStateEvent } from '@/lib/use-game-state';

/**
 * Example 1: Basic Component with State Access
 */
export function TeamStatusComponent() {
  const { gameState, updateGameState } = useGameState();
  const { sessionState } = useSession();
  
  const handleDraftComplete = () => {
    // ✅ Centralized state update
    updateGameState({ draftComplete: true });
    // No need for manual persistence - handled automatically
  };
  
  return (
    <div>
      <h2>Team: {sessionState.teamName || 'Not logged in'}</h2>
      <p>Draft Status: {gameState.draftComplete ? 'Complete' : 'In Progress'}</p>
      <p>Players: {gameState.players.length}</p>
      
      {!gameState.draftComplete && (
        <button onClick={handleDraftComplete}>
          Complete Draft
        </button>
      )}
    </div>
  );
}

/**
 * Example 2: Component with API Data Loading
 */
export function LeaderboardComponent() {
  const { gameState, loadGameState } = useGameState();
  const [loading, setLoading] = React.useState(true);
  
  useEffect(() => {
    // ✅ Load with built-in caching (60s TTL)
    const loadData = async () => {
      try {
        await loadGameState('default');
      } catch (error) {
        console.error('Failed to load game state:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Leaderboard</h2>
      <ul>
        {gameState.players.map(player => (
          <li key={player}>{player}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Example 3: Component with Event Subscription
 */
export function LiveResultsComponent() {
  const { gameState } = useGameState();
  const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
  
  // ✅ Subscribe to result updates
  useStateEvent('results:updated', () => {
    setLastUpdate(new Date());
    console.log('Results updated! Component will re-render automatically.');
  });
  
  return (
    <div>
      <h2>Live Results</h2>
      {lastUpdate && (
        <p>Last updated: {lastUpdate.toLocaleTimeString()}</p>
      )}
      
      <div>
        {Object.entries(gameState.results).map(([athleteId, result]) => (
          <div key={athleteId}>
            Athlete {athleteId}: {result.finishTime || 'In progress'}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Example 4: Commissioner Component with Session Management
 */
export function CommissionerPanel() {
  const { gameState, updateGameState } = useGameState();
  const { sessionState, updateSession, clearSession } = useSession();
  
  const handleLogin = async (teamName: string) => {
    // ✅ Session automatically persisted to localStorage
    updateSession({
      token: 'generated-token',
      teamName,
      playerCode: 'COMM1',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });
  };
  
  const handleLogout = () => {
    // ✅ Session automatically cleared from localStorage
    clearSession();
  };
  
  const handleResetDraft = () => {
    updateGameState({
      draftComplete: false,
      teams: {},
      results: {},
    });
  };
  
  if (!sessionState.token) {
    return (
      <div>
        <h2>Commissioner Login</h2>
        <button onClick={() => handleLogin('Commissioner')}>
          Login
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <h2>Commissioner Panel</h2>
      <p>Logged in as: {sessionState.teamName}</p>
      
      <button onClick={handleResetDraft}>Reset Draft</button>
      <button onClick={handleLogout}>Logout</button>
      
      <div>
        <h3>Game Status</h3>
        <p>Draft Complete: {gameState.draftComplete ? 'Yes' : 'No'}</p>
        <p>Players: {gameState.players.length}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Migration Checklist
// ============================================================================

/*
✅ Step 1: Replace direct global variable access
   - Before: gameState.draftComplete = true
   - After:  updateGameState({ draftComplete: true })

✅ Step 2: Replace direct localStorage access
   - Before: localStorage.setItem('marathon_fantasy_team', ...)
   - After:  updateSession({ ... })

✅ Step 3: Use built-in caching instead of manual cache management
   - Before: Manual cache with TTL checks
   - After:  loadGameState('game-id') // Auto-cached with 60s TTL

✅ Step 4: Subscribe to events instead of manual updates
   - Before: Manual window.dispatchEvent() or callbacks
   - After:  useStateEvent('results:updated', handler)

✅ Step 5: Use React hooks for automatic re-rendering
   - Before: Manual DOM updates or setState calls
   - After:  const { gameState } = useGameState() // Auto re-renders

✅ Step 6: Remove manual persistence calls
   - Before: saveGameState() after every update
   - After:  Automatic persistence via StorageAdapter

✅ Step 7: Test with new test suite
   - Run: npm run test:state
   - Run: npm run test:state:integration
*/

// ============================================================================
// Common Patterns
// ============================================================================

/**
 * Pattern 1: Loading data on component mount
 */
export function DataLoadingPattern() {
  const { gameState, loadGameState } = useGameState();
  
  useEffect(() => {
    loadGameState('default', /* forceRefresh */ false);
  }, []);
  
  return <div>{gameState.players.length} players</div>;
}

/**
 * Pattern 2: Invalidating cache on user action
 */
export function CacheInvalidationPattern() {
  const { invalidateCache } = useGameState();
  
  const handleRefresh = async () => {
    invalidateCache(); // Clear cache
    // Next loadGameState() call will fetch fresh data
  };
  
  return <button onClick={handleRefresh}>Refresh</button>;
}

/**
 * Pattern 3: Conditional rendering based on session
 */
export function ConditionalRenderPattern() {
  const { sessionState } = useSession();
  
  if (!sessionState.token) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {sessionState.teamName}!</div>;
}

/**
 * Pattern 4: Multiple state sources
 */
export function MultiStatePattern() {
  const { gameState } = useGameState();
  const { sessionState } = useSession();
  const { isCommissioner } = useCommissioner();
  
  return (
    <div>
      <p>Team: {sessionState.teamName}</p>
      <p>Players: {gameState.players.length}</p>
      {isCommissioner && <p>Commissioner Mode Active</p>}
    </div>
  );
}
