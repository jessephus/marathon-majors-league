# State Management Documentation

## Overview

The `GameStateManager` is a centralized state management system that replaces the scattered global state mutations found throughout the legacy `app.js` monolith. It provides a unified interface for managing game state, session state, and commissioner state with built-in caching, event-driven updates, and persistent storage.

**Status:** Implemented (Issue #89 - State Phase 3)  
**Related:** [PROCESS_MONOLITH_AUDIT.md](PROCESS_MONOLITH_AUDIT.md) - Documents 126+ global state mutations being replaced

## Key Features

### 1. Centralized State Management
- Single source of truth for all application state
- Replaces direct access to global `gameState`, `anonymousSession`, and `commissionerSession`
- Type-safe state updates with TypeScript support

### 2. Pub/Sub Event System
- Subscribe to state changes with event listeners
- Automatic re-rendering in React components via hooks
- Event types: `gameState:updated`, `session:updated`, `results:updated`, `roster:locked`, etc.

### 3. TTL-Based Caching
- **Results cache**: 30-second TTL for live race results
- **Game state cache**: 60-second TTL for game configuration
- Automatic cache invalidation on updates
- Manual cache control methods

### 4. localStorage Abstraction
- Controlled adapter pattern for persistent storage
- Replaces direct `localStorage` access
- Easily swappable for testing or alternative storage backends

### 5. State Versioning
- Migration support for legacy state shapes
- Version tracking for backward compatibility
- Export/import functionality for debugging

### 6. Debugging Support
- Development-only logging (`devLog` equivalent)
- State snapshot export for debugging
- Event tracking and monitoring

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              GameStateManager (Singleton)                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │ GameState    │  │SessionState  │  │Commissioner  │ │
│  │              │  │              │  │State         │ │
│  │ - athletes   │  │ - token      │  │ - isComm.    │ │
│  │ - players    │  │ - teamName   │  │ - loginTime  │ │
│  │ - teams      │  │ - playerCode │  │ - expiresAt  │ │
│  │ - results    │  │ - expiresAt  │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Caching Layer (TTL)                  │  │
│  │  - resultsCache (30s TTL)                        │  │
│  │  - gameStateCache (60s TTL)                      │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │            Pub/Sub Event System                   │  │
│  │  - Event listeners (Set<Listener>)               │  │
│  │  - Event emitter                                 │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Storage Adapter (localStorage)            │  │
│  │  - saveSession()                                 │  │
│  │  - loadSession()                                 │  │
│  │  - clearSession()                                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
        ┌─────────────────────────────────────┐
        │      React Hooks (useGameState)      │
        │  - Automatic component re-rendering  │
        │  - Subscribe to state changes        │
        └─────────────────────────────────────┘
```

## Usage

### Basic Setup

```typescript
import { getStateManager } from '@/lib/state-manager';

// Get the global singleton instance
const stateManager = getStateManager({
  debug: true, // Enable development logging
  resultsCacheTTL: 30000, // 30 seconds
  gameStateCacheTTL: 60000, // 60 seconds
});
```

### React Hooks (Recommended)

```tsx
import { useGameState, useSession, useCommissioner } from '@/lib/use-game-state';

function MyComponent() {
  // Access game state with automatic re-rendering
  const { gameState, updateGameState, loadGameState } = useGameState();
  
  // Access session state
  const { sessionState, updateSession, clearSession } = useSession();
  
  // Access commissioner state
  const { commissionerState, isCommissioner } = useCommissioner();
  
  // Load game state from API
  useEffect(() => {
    loadGameState('default');
  }, []);
  
  return (
    <div>
      <p>Players: {gameState.players.length}</p>
      <p>Session: {sessionState.teamName || 'Not logged in'}</p>
    </div>
  );
}
```

### Core Methods

#### Game State Management

```typescript
// Load game state from API (with caching)
await stateManager.loadGameState('game-id', forceRefresh = false);

// Update game state (partial updates)
stateManager.updateGameState({
  draftComplete: true,
  players: ['player1', 'player2'],
});

// Get current state
const gameState = stateManager.getGameState();
```

#### Results Management

```typescript
// Update race results
await stateManager.updateResults('game-id', {
  athleteId: 123,
  finishTime: '2:05:00',
  isFinal: true,
});

// Invalidate results cache (forces next fetch)
stateManager.invalidateResultsCache();
```

#### Session Management

```typescript
// Update session
stateManager.updateSession({
  token: 'session-token',
  teamName: 'My Team',
  playerCode: 'PLAYER1',
});

// Clear session
stateManager.clearSession();

// Get current session
const session = stateManager.getSessionState();
```

#### Roster Lock

```typescript
// Set roster lock time
await stateManager.setRosterLock('2025-11-05T12:00:00Z');

// Remove roster lock
await stateManager.setRosterLock(null);
```

### Event Subscription

```typescript
// Subscribe to state changes
const unsubscribe = stateManager.on('gameState:updated', (data) => {
  console.log('Game state updated:', data.newState);
});

// Unsubscribe when done
unsubscribe();

// Available events:
// - 'gameState:updated'
// - 'gameState:loaded'
// - 'session:created'
// - 'session:updated'
// - 'session:cleared'
// - 'commissioner:login'
// - 'commissioner:logout'
// - 'results:updated'
// - 'results:invalidated'
// - 'roster:locked'
// - 'cache:expired'
```

### Custom Storage Adapter

```typescript
import { StorageAdapter } from '@/lib/state-manager';

class CustomStorageAdapter implements StorageAdapter {
  saveSession(session) {
    // Custom implementation
  }
  
  loadSession() {
    // Custom implementation
  }
  
  // ... implement other methods
}

const stateManager = getStateManager({
  storageAdapter: new CustomStorageAdapter(),
});
```

## Migration Guide

### Migrating from Legacy Global State

**Before (app.js):**
```javascript
// Direct global variable access
gameState.draftComplete = true;
gameState.players.push('newPlayer');

// Direct localStorage access
localStorage.setItem('marathon_fantasy_team', JSON.stringify(session));

// No cache management
const response = await fetch('/api/results');
```

**After (with GameStateManager):**
```typescript
// Centralized state updates
stateManager.updateGameState({
  draftComplete: true,
  players: [...gameState.players, 'newPlayer'],
});

// Abstracted storage
stateManager.updateSession(session);

// Built-in caching with TTL
await stateManager.loadGameState('game-id'); // Uses cache
```

### Migrating a React Component

**Before (with useAppState from state-provider.tsx):**
```tsx
import { useAppState } from '@/lib/state-provider';

function MyComponent() {
  const { gameState, setGameState } = useAppState();
  
  const handleUpdate = () => {
    setGameState({ draftComplete: true });
  };
  
  return <button onClick={handleUpdate}>Complete Draft</button>;
}
```

**After (with useGameState hook):**
```tsx
import { useGameState } from '@/lib/use-game-state';

function MyComponent() {
  const { gameState, updateGameState } = useGameState();
  
  const handleUpdate = () => {
    updateGameState({ draftComplete: true });
  };
  
  return <button onClick={handleUpdate}>Complete Draft</button>;
}
```

### Event-Driven Updates

**Before (manual re-fetch):**
```javascript
// Commissioner updates results
await fetch('/api/results', { method: 'POST', body: ... });

// Manually refresh in another component
window.location.reload(); // Or manual fetch
```

**After (event-driven):**
```tsx
// Component automatically updates on results change
function Leaderboard() {
  const { gameState } = useGameState();
  const { lastUpdate } = useResults();
  
  useStateEvent('results:updated', () => {
    console.log('Results updated, component will re-render');
  });
  
  return <div>Last update: {lastUpdate}</div>;
}
```

## Testing

### Unit Tests

```bash
# Compile TypeScript
npx tsc lib/state-manager.ts --outDir .test-build --module esnext

# Run tests
npm run test:state
```

### Integration Tests

```bash
npm run test:state:integration
```

### Test Coverage

**Unit Tests (34 tests):**
- ✅ State initialization
- ✅ Game state updates
- ✅ Session management
- ✅ Commissioner session
- ✅ Pub/sub events
- ✅ Multiple event listeners
- ✅ Cache TTL expiration
- ✅ Cache invalidation
- ✅ Results updates
- ✅ Roster lock
- ✅ State versioning
- ✅ Force refresh
- ✅ Commissioner logout

**Integration Tests (31 tests):**
- ✅ Event-driven state updates with multiple subscribers
- ✅ TTL expiration behavior (results cache)
- ✅ TTL expiration behavior (game state cache)
- ✅ State consistency across events
- ✅ Session persistence across reloads
- ✅ Commissioner session expiry
- ✅ Cache invalidation on update
- ✅ Event ordering
- ✅ Multiple game state loads
- ✅ Concurrent event listeners

## Performance Considerations

### Caching Strategy

1. **Results Cache (30s TTL)**
   - Live race results change frequently
   - Short TTL ensures freshness
   - Reduces server load during live events

2. **Game State Cache (60s TTL)**
   - Game configuration changes infrequently
   - Longer TTL reduces unnecessary fetches
   - Invalidated on any game state update

### Event Listener Optimization

- Event listeners are stored in a `Set` for efficient add/remove
- Listeners are called synchronously in order
- Error in one listener doesn't affect others
- Always unsubscribe when component unmounts

### Storage Adapter Performance

- localStorage operations are synchronous
- Consider implementing async storage for large datasets
- MockStorageAdapter available for testing (no I/O)

## Debugging

### Enable Debug Logging

```typescript
const stateManager = getStateManager({ debug: true });

// Logs all state changes, cache hits/misses, events
```

### Export State Snapshot

```typescript
const snapshot = stateManager.exportState();
console.log('Current state:', JSON.stringify(snapshot, null, 2));
```

### Monitor Events

```typescript
// Log all events
const events = [
  'gameState:updated',
  'session:updated',
  'results:updated',
];

events.forEach(eventType => {
  stateManager.on(eventType, (data) => {
    console.log(`[Event] ${eventType}:`, data);
  });
});
```

## Future Enhancements

### Planned Features

1. **Redux DevTools Integration**
   - Time-travel debugging
   - Action replay
   - State diff visualization

2. **Optimistic Updates**
   - Update UI before API response
   - Rollback on failure
   - Better perceived performance

3. **Offline Support**
   - Queue updates when offline
   - Sync when connection restored
   - Conflict resolution

4. **State Hydration from SSR**
   - Server-side rendered state
   - Seamless client-side takeover
   - Reduced initial load time

5. **Middleware Support**
   - Logging middleware
   - Analytics middleware
   - Custom validation

## Related Documentation

- [CORE_ARCHITECTURE.md](CORE_ARCHITECTURE.md) - System architecture
- [PROCESS_MONOLITH_AUDIT.md](PROCESS_MONOLITH_AUDIT.md) - Legacy state analysis
- [CORE_DEVELOPMENT.md](CORE_DEVELOPMENT.md) - Development standards
- [Issue #89](https://github.com/jessephus/marathon-majors-league/issues/89) - State Phase 3

## Support

For questions or issues:
- Check existing tests for usage examples
- Review migration guide above
- Open an issue on GitHub
- Contact: @jessephus
