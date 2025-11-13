/**
 * Unit Tests for GameStateManager
 * 
 * Tests state management, caching, pub/sub, and persistence.
 * 
 */

import { 
  GameStateManager, 
  LocalStorageAdapter,
  resetStateManager,
} from '../lib/state-manager.ts';

// Mock localStorage for Node.js environment
class MockStorage {
  constructor() {
    this.store = new Map();
  }
  
  getItem(key) {
    return this.store.get(key) || null;
  }
  
  setItem(key, value) {
    this.store.set(key, value);
  }
  
  removeItem(key) {
    this.store.delete(key);
  }
  
  clear() {
    this.store.clear();
  }
}

// Mock storage adapter for testing
class MockStorageAdapter {
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

// Mock fetch for API calls
global.fetch = async (url, options) => {
  const mockData = {
    '/api/game-state?gameId=test-game': {
      players: ['player1', 'player2'],
      draftComplete: true,
      resultsFinalized: false,
      rosterLockTime: '2025-11-05T12:00:00Z',
      rankings: {},
      teams: {},
      results: {},
    },
    '/api/results?gameId=test-game': {
      results: {
        athlete1: { finishTime: '2:05:00', isFinal: true },
      },
    },
  };
  
  const key = url.toString();
  const data = mockData[key];
  
  if (options?.method === 'POST') {
    return {
      ok: true,
      json: async () => ({ success: true, ...JSON.parse(options.body || '{}') }),
    };
  }
  
  return {
    ok: true,
    json: async () => data || {},
  };
};

// ============================================================================
// Test Suite
// ============================================================================

async function runTests() {
  console.log('🧪 Starting GameStateManager tests...\n');
  
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
  
  function assertEquals(actual, expected, message) {
    const isEqual = JSON.stringify(actual) === JSON.stringify(expected);
    assert(isEqual, `${message} (expected: ${JSON.stringify(expected)}, got: ${JSON.stringify(actual)})`);
  }
  
  // Test 1: Initialization
  console.log('📦 Test 1: Initialization');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    const gameState = manager.getGameState();
    assert(gameState.players.length === 0, 'Initial game state has empty players');
    assert(gameState.draftComplete === false, 'Initial draft is not complete');
    
    const sessionState = manager.getSessionState();
    assert(sessionState.token === null, 'Initial session token is null');
  }
  console.log('');
  
  // Test 2: Game State Updates
  console.log('🔄 Test 2: Game State Updates');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    manager.updateGameState({ draftComplete: true, players: ['player1', 'player2'] });
    
    const gameState = manager.getGameState();
    assert(gameState.draftComplete === true, 'Draft complete flag updated');
    assertEquals(gameState.players, ['player1', 'player2'], 'Players array updated');
  }
  console.log('');
  
  // Test 3: Session Management
  console.log('👤 Test 3: Session Management');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    const sessionData = {
      token: 'test-token-123',
      teamName: 'Test Team',
      playerCode: 'PLAYER1',
      ownerName: 'John Doe',
      expiresAt: '2025-12-31T23:59:59Z',
    };
    
    manager.updateSession(sessionData);
    
    const session = manager.getSessionState();
    assertEquals(session.token, 'test-token-123', 'Session token saved');
    assertEquals(session.teamName, 'Test Team', 'Team name saved');
    
    // Check persistence
    const stored = adapter.loadSession();
    assert(stored !== null, 'Session persisted to storage');
    assertEquals(stored?.token, 'test-token-123', 'Stored session token matches');
  }
  console.log('');
  
  // Test 4: Session Clearing
  console.log('🚪 Test 4: Session Clearing');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    manager.updateSession({ token: 'test-token', teamName: 'Team' });
    manager.clearSession();
    
    const session = manager.getSessionState();
    assert(session.token === null, 'Session token cleared');
    assert(adapter.loadSession() === null, 'Session removed from storage');
  }
  console.log('');
  
  // Test 5: Commissioner Session
  console.log('👑 Test 5: Commissioner Session');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    const now = new Date().toISOString();
    manager.updateCommissionerSession({
      isCommissioner: true,
      loginTime: now,
      expiresAt: '2025-12-31T23:59:59Z',
    });
    
    const commissioner = manager.getCommissionerState();
    assert(commissioner.isCommissioner === true, 'Commissioner flag set');
    assertEquals(commissioner.loginTime, now, 'Login time saved');
    
    // Check persistence
    const stored = adapter.loadCommissionerSession();
    assert(stored !== null, 'Commissioner session persisted');
    assert(stored?.isCommissioner === true, 'Commissioner flag persisted');
  }
  console.log('');
  
  // Test 6: Pub/Sub Events
  console.log('📡 Test 6: Pub/Sub Events');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    let eventFired = false;
    let eventData = null;
    
    const unsubscribe = manager.on('gameState:updated', (data) => {
      eventFired = true;
      eventData = data;
    });
    
    manager.updateGameState({ draftComplete: true });
    
    assert(eventFired === true, 'Event fired on state update');
    assert(eventData.newState.draftComplete === true, 'Event data includes new state');
    
    // Test unsubscribe
    eventFired = false;
    unsubscribe();
    manager.updateGameState({ players: ['test'] });
    assert(eventFired === false, 'Event not fired after unsubscribe');
  }
  console.log('');
  
  // Test 7: Multiple Event Listeners
  console.log('🎧 Test 7: Multiple Event Listeners');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    let listener1Called = false;
    let listener2Called = false;
    
    manager.on('session:updated', () => { listener1Called = true; });
    manager.on('session:updated', () => { listener2Called = true; });
    
    manager.updateSession({ token: 'test' });
    
    assert(listener1Called === true, 'First listener called');
    assert(listener2Called === true, 'Second listener called');
  }
  console.log('');
  
  // Test 8: Cache TTL - Game State
  console.log('⏱️  Test 8: Cache TTL - Game State');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ 
      storageAdapter: adapter, 
      debug: false,
      gameStateCacheTTL: 100, // 100ms for testing
    });
    
    // First load - should fetch from API
    await manager.loadGameState('test-game');
    const state1 = manager.getGameState();
    assert(state1.draftComplete === true, 'First load fetched from API');
    
    // Second load immediately - should use cache
    const state2 = manager.getGameState();
    assertEquals(state2.draftComplete, true, 'Second load used cache');
    
    // Wait for cache to expire
    await new Promise(resolve => setTimeout(resolve, 150));
    
    // Third load after expiry - should fetch again
    await manager.loadGameState('test-game');
    const state3 = manager.getGameState();
    assert(state3.players.length === 2, 'Load after cache expiry fetched fresh data');
  }
  console.log('');
  
  // Test 9: Cache Invalidation
  console.log('🗑️  Test 9: Cache Invalidation');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    let cacheExpiredEventFired = false;
    manager.on('cache:expired', () => { cacheExpiredEventFired = true; });
    
    await manager.loadGameState('test-game');
    manager.invalidateGameStateCache();
    
    assert(cacheExpiredEventFired === true, 'Cache expired event fired');
  }
  console.log('');
  
  // Test 10: Results Update
  console.log('🏃 Test 10: Results Update');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    let resultsUpdatedEventFired = false;
    manager.on('results:updated', () => { resultsUpdatedEventFired = true; });
    
    await manager.updateResults('test-game', { athleteId: 1, finishTime: '2:05:00' });
    
    assert(resultsUpdatedEventFired === true, 'Results updated event fired');
  }
  console.log('');
  
  // Test 11: Roster Lock
  console.log('🔒 Test 11: Roster Lock');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    let rosterLockedEventFired = false;
    manager.on('roster:locked', (data) => {
      rosterLockedEventFired = true;
    });
    
    const lockTime = '2025-11-05T12:00:00Z';
    await manager.setRosterLock(lockTime);
    
    const gameState = manager.getGameState();
    assertEquals(gameState.rosterLockTime, lockTime, 'Roster lock time set');
    assert(rosterLockedEventFired === true, 'Roster locked event fired');
  }
  console.log('');
  
  // Test 12: State Versioning
  console.log('📦 Test 12: State Versioning');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    manager.updateGameState({ draftComplete: true, players: ['p1'] });
    manager.updateSession({ token: 'test-token' });
    
    const exported = manager.exportState();
    assert(exported.version === 1, 'Exported state has version 1');
    assert(exported.gameState.draftComplete === true, 'Exported game state is correct');
    assert(exported.sessionState.token === 'test-token', 'Exported session is correct');
    
    // Import into new manager
    resetStateManager();
    const manager2 = new GameStateManager({ storageAdapter: adapter, debug: false });
    manager2.importState(exported);
    
    const imported = manager2.getGameState();
    assert(imported.draftComplete === true, 'Imported state is correct');
  }
  console.log('');
  
  // Test 13: Force Refresh
  console.log('🔄 Test 13: Force Refresh');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ 
      storageAdapter: adapter, 
      debug: false,
      gameStateCacheTTL: 10000, // 10 seconds
    });
    
    await manager.loadGameState('test-game');
    const state1 = manager.getGameState();
    
    // Force refresh should bypass cache
    await manager.loadGameState('test-game', true);
    const state2 = manager.getGameState();
    
    // Both should have the same data (but from different fetches)
    assertEquals(state1.players, state2.players, 'Force refresh fetched same data');
  }
  console.log('');
  
  // Test 14: Results Cache Invalidation
  console.log('🗑️  Test 14: Results Cache Invalidation');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    let invalidatedEventFired = false;
    manager.on('results:invalidated', () => { invalidatedEventFired = true; });
    
    manager.invalidateResultsCache();
    
    assert(invalidatedEventFired === true, 'Results cache invalidated event fired');
  }
  console.log('');
  
  // Test 15: Commissioner Logout Event
  console.log('🚪 Test 15: Commissioner Logout Event');
  {
    resetStateManager();
    const adapter = new MockStorageAdapter();
    const manager = new GameStateManager({ storageAdapter: adapter, debug: false });
    
    let logoutEventFired = false;
    manager.on('commissioner:logout', () => { logoutEventFired = true; });
    
    manager.updateCommissionerSession({ isCommissioner: true });
    manager.clearCommissionerSession();
    
    assert(logoutEventFired === true, 'Commissioner logout event fired');
  }
  console.log('');
  
  // Summary
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📊 Test Results: ${passCount} passed, ${failCount} failed`);
  console.log('═══════════════════════════════════════════════════════════');
  
  if (failCount > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
