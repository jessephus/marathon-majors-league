/**
 * Integration Tests for GameStateManager
 * 
 * Tests event-driven updates, TTL expiration behavior, and state consistency.
 * 
 */

import { 
  GameStateManager, 
  resetStateManager,
} from '../.test-build/state-manager.js';

// Mock storage adapter
class TestStorageAdapter {
  constructor() {
    this.sessions = new Map();
  }
  
  saveSession(session) {
    this.sessions.set('session', session);
  }
  
  loadSession() {
    return this.sessions.get('session') || null;
  }
  
  clearSession() {
    this.sessions.delete('session');
  }
  
  saveCommissionerSession(session) {
    this.sessions.set('commissioner', session);
  }
  
  loadCommissionerSession() {
    return this.sessions.get('commissioner') || null;
  }
  
  clearCommissionerSession() {
    this.sessions.delete('commissioner');
  }
  
  saveGameId(gameId) {
    this.sessions.set('gameId', gameId);
  }
  
  loadGameId() {
    return this.sessions.get('gameId') || null;
  }
}

// Mock fetch
global.fetch = async (url, options) => {
  const mockData = {
    players: ['player1', 'player2'],
    draftComplete: true,
    resultsFinalized: false,
    rosterLockTime: null,
    rankings: {},
    teams: {},
    results: {},
  };
  
  if (options?.method === 'POST') {
    return {
      ok: true,
      json: async () => ({ success: true, ...JSON.parse(options.body || '{}') }),
    };
  }
  
  return {
    ok: true,
    json: async () => mockData,
  };
};

// ============================================================================
// Integration Tests
// ============================================================================

async function runIntegrationTests() {
  console.log('🧪 Starting GameStateManager Integration Tests...\n');
  
  let passCount = 0;
  let failCount = 0;
  
  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passCount++;
    } else {
      console.log(`  ❌ ${message}`);
      failCount++;
    }
  }
  
  // Test 1: Event-Driven State Updates with Multiple Subscribers
  console.log('📡 Test 1: Event-Driven State Updates with Multiple Subscribers');
  {
    resetStateManager();
    const adapter = new TestStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    const updates = [];
    
    // Subscribe multiple listeners
    manager.on('gameState:updated', (data) => {
      updates.push({ type: 'listener1', data });
    });
    
    manager.on('gameState:updated', (data) => {
      updates.push({ type: 'listener2', data });
    });
    
    // Update state
    manager.updateGameState({ draftComplete: true });
    
    assert(updates.length === 2, 'Both listeners received update');
    assert(updates[0].data.newState.draftComplete === true, 'Listener 1 received correct data');
    assert(updates[1].data.newState.draftComplete === true, 'Listener 2 received correct data');
  }
  console.log('');
  
  // Test 2: TTL Expiration Behavior - Results Cache
  console.log('⏱️  Test 2: TTL Expiration Behavior - Results Cache');
  {
    resetStateManager();
    const adapter = new TestStorageAdapter();
    const manager = new GameStateManager({ 
      storageAdapter: adapter, 
      debug: false,
      resultsCacheTTL: 100, // 100ms for testing
    });
    
    let fetchCount = 0;
    
    // Override fetch to count calls
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      if (url.includes('/api/results')) {
        fetchCount++;
      }
      return originalFetch(url, options);
    };
    
    // First call - should fetch
    await manager.updateResults('test-game', { athleteId: 1 });
    assert(fetchCount === 1, 'First call fetched from API');
    
    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Second call after expiry - should fetch again
    await manager.updateResults('test-game', { athleteId: 2 });
    assert(fetchCount === 2, 'Second call after expiry fetched again');
    
    // Restore fetch
    global.fetch = originalFetch;
  }
  console.log('');
  
  // Test 3: TTL Expiration Behavior - Game State Cache
  console.log('⏱️  Test 3: TTL Expiration Behavior - Game State Cache');
  {
    resetStateManager();
    const adapter = new TestStorageAdapter();
    const manager = new GameStateManager({ 
      storageAdapter: adapter, 
      debug: false,
      gameStateCacheTTL: 100, // 100ms for testing
    });
    
    let loadCount = 0;
    
    // Override fetch to count calls
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      if (url.includes('/api/game-state')) {
        loadCount++;
      }
      return originalFetch(url, options);
    };
    
    // First load - should fetch
    await manager.loadGameState('test-game');
    assert(loadCount === 1, 'First load fetched from API');
    
    // Second load immediately - should use cache
    await manager.loadGameState('test-game');
    assert(loadCount === 1, 'Second load used cache (no new fetch)');
    
    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Third load after expiry - should fetch again
    await manager.loadGameState('test-game');
    assert(loadCount === 2, 'Third load after expiry fetched again');
    
    // Restore fetch
    global.fetch = originalFetch;
  }
  console.log('');
  
  // Test 4: State Consistency Across Events
  console.log('🔄 Test 4: State Consistency Across Events');
  {
    resetStateManager();
    const adapter = new TestStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    const stateSnapshots = [];
    
    manager.on('gameState:updated', () => {
      stateSnapshots.push(manager.getGameState());
    });
    
    // Make multiple updates
    manager.updateGameState({ draftComplete: true });
    manager.updateGameState({ players: ['p1', 'p2'] });
    manager.updateGameState({ resultsFinalized: true });
    
    assert(stateSnapshots.length === 3, 'Three state snapshots captured');
    assert(stateSnapshots[0].draftComplete === true, 'First update preserved');
    assert(stateSnapshots[1].players.length === 2, 'Second update preserved');
    assert(stateSnapshots[2].resultsFinalized === true, 'Third update preserved');
    
    // All updates should be cumulative
    const finalState = manager.getGameState();
    assert(finalState.draftComplete === true, 'Final state has all updates (1)');
    assert(finalState.players.length === 2, 'Final state has all updates (2)');
    assert(finalState.resultsFinalized === true, 'Final state has all updates (3)');
  }
  console.log('');
  
  // Test 5: Session Persistence Across Reloads
  console.log('💾 Test 5: Session Persistence Across Reloads');
  {
    resetStateManager();
    const adapter = new TestStorageAdapter();
    
    // First manager instance
    const manager1 = new GameStateManager({ storageAdapter: adapter, debug: false });
    manager1.updateSession({
      token: 'persistent-token',
      teamName: 'Test Team',
      playerCode: 'PLAYER1',
    });
    
    // Simulate page reload by creating new manager with same adapter
    resetStateManager();
    const manager2 = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    const session = manager2.getSessionState();
    assert(session.token === 'persistent-token', 'Session persisted across reload');
    assert(session.teamName === 'Test Team', 'Team name persisted');
    assert(session.playerCode === 'PLAYER1', 'Player code persisted');
  }
  console.log('');
  
  // Test 6: Commissioner Session Expiry
  console.log('⏰ Test 6: Commissioner Session Expiry');
  {
    resetStateManager();
    const adapter = new TestStorageAdapter();
    
    // Save expired session directly to storage
    const expiredSession = {
      isCommissioner: true,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
    };
    adapter.saveCommissionerSession(expiredSession);
    
    // Create manager - should not load expired session
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    const commissioner = manager.getCommissionerState();
    assert(commissioner.isCommissioner === false, 'Expired commissioner session not loaded');
    assert(adapter.loadCommissionerSession() === null, 'Expired session cleared from storage');
  }
  console.log('');
  
  // Test 7: Cache Invalidation on Update
  console.log('🗑️  Test 7: Cache Invalidation on Update');
  {
    resetStateManager();
    const adapter = new TestStorageAdapter();
    const manager = new GameStateManager({ 
      storageAdapter: adapter, 
      debug: false,
      gameStateCacheTTL: 10000, // 10 seconds - long enough for test
    });
    
    let loadCount = 0;
    
    // Override fetch
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      if (url.includes('/api/game-state')) {
        loadCount++;
      }
      return originalFetch(url, options);
    };
    
    // Load and cache
    await manager.loadGameState('test-game');
    assert(loadCount === 1, 'Initial load fetched from API');
    
    // Update state - should invalidate cache
    manager.updateGameState({ draftComplete: true });
    
    // Load again - should fetch because cache was invalidated
    await manager.loadGameState('test-game');
    assert(loadCount === 2, 'Load after update fetched fresh data (cache invalidated)');
    
    // Restore fetch
    global.fetch = originalFetch;
  }
  console.log('');
  
  // Test 8: Event Ordering
  console.log('📋 Test 8: Event Ordering');
  {
    resetStateManager();
    const adapter = new TestStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    const eventOrder = [];
    
    manager.on('session:updated', () => eventOrder.push('session'));
    manager.on('commissioner:login', () => eventOrder.push('commissioner'));
    manager.on('gameState:updated', () => eventOrder.push('gameState'));
    
    // Trigger events in specific order
    manager.updateSession({ token: 'test' });
    manager.updateCommissionerSession({ isCommissioner: true });
    manager.updateGameState({ draftComplete: true });
    
    assert(eventOrder.length === 3, 'All three events fired');
    assert(eventOrder[0] === 'session', 'Session event fired first');
    assert(eventOrder[1] === 'commissioner', 'Commissioner event fired second');
    assert(eventOrder[2] === 'gameState', 'GameState event fired third');
  }
  console.log('');
  
  // Test 9: Multiple Game State Loads with Different IDs
  console.log('🎮 Test 9: Multiple Game State Loads with Different IDs');
  {
    resetStateManager();
    const adapter = new TestStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    // Load game 1
    await manager.loadGameState('game1');
    const state1 = manager.getGameState();
    
    // Load game 2 - cache should not be used (different game ID)
    await manager.loadGameState('game2');
    const state2 = manager.getGameState();
    
    // Both should have loaded successfully
    assert(state1.players !== undefined, 'Game 1 loaded');
    assert(state2.players !== undefined, 'Game 2 loaded');
  }
  console.log('');
  
  // Test 10: Concurrent Event Listeners
  console.log('🔀 Test 10: Concurrent Event Listeners');
  {
    resetStateManager();
    const adapter = new TestStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    let listener1Order = -1;
    let listener2Order = -1;
    let listener3Order = -1;
    let callOrder = 0;
    
    manager.on('gameState:updated', () => { listener1Order = callOrder++; });
    manager.on('gameState:updated', () => { listener2Order = callOrder++; });
    manager.on('gameState:updated', () => { listener3Order = callOrder++; });
    
    manager.updateGameState({ draftComplete: true });
    
    assert(listener1Order === 0, 'First listener called first');
    assert(listener2Order === 1, 'Second listener called second');
    assert(listener3Order === 2, 'Third listener called third');
  }
  console.log('');
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📊 Integration Test Results: ${passCount} passed, ${failCount} failed`);
  console.log('═══════════════════════════════════════════════════════════');
  
  if (failCount > 0) {
    process.exit(1);
  }
}

// Run tests
runIntegrationTests().catch(error => {
  console.error('❌ Integration test suite failed:', error);
  process.exit(1);
});
