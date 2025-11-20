/**
 * API Client Coverage Tests
 * 
 * Tests specifically designed to improve api-client.ts code coverage
 * by exercising all API methods and utility functions.
 * 
 * Run with: tsx tests/api-client-coverage.test.js
 */

// Mock fetch before importing api-client
globalThis.fetch = async (url, options) => {
  // Return a mock response
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: {
      get: (name) => {
        if (name === 'ETag') return '"test-etag"';
        if (name === 'X-Cache-Status') return 'MISS';
        if (name === 'X-Cache-Type') return 'athletes';
        return null;
      },
    },
    json: async () => ({ 
      data: 'test', 
      men: [], 
      women: [],
      session: {
        token: 'test-token',
        expiresAt: '2025-12-31',
        sessionType: 'player',
        displayName: 'Test Team',
        gameId: 'default',
      },
      standings: [],
      lastUpdated: Date.now(),
      success: true,
      valid: true,
    }),
  };
};

// Mock window for browser-specific code
globalThis.window = {
  location: { origin: 'http://localhost:3000' },
  sessionStorage: {
    _data: {},
    getItem(key) { return this._data[key] || null; },
    setItem(key, value) { this._data[key] = value; },
    removeItem(key) { delete this._data[key]; },
  },
};

// Mock performance for tracking
globalThis.performance = {
  now: () => Date.now(),
};

// Import after mocks are set up
import {
  athleteApi,
  gameStateApi,
  sessionApi,
  salaryCapDraftApi,
  resultsApi,
  commissionerApi,
  racesApi,
  athleteRacesApi,
  standingsApi,
  cacheUtils,
  createServerApiClient,
} from '../lib/api-client.ts';

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    testsPassed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    testsFailed++;
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
  }
}

console.log('🧪 API Client Coverage Tests\n');

// Test Cache Utils
console.log('Cache Utils:');

test('cacheUtils.getCacheConfig - athletes', () => {
  const config = cacheUtils.getCacheConfig('athletes');
  if (config.maxAge !== 3600) throw new Error('Athletes maxAge should be 3600');
});

test('cacheUtils.getCacheConfig - gameState', () => {
  const config = cacheUtils.getCacheConfig('gameState');
  if (config.maxAge !== 30) throw new Error('GameState maxAge should be 30');
});

test('cacheUtils.getCacheConfig - results', () => {
  const config = cacheUtils.getCacheConfig('results');
  if (config.maxAge !== 15) throw new Error('Results maxAge should be 15');
});

test('cacheUtils.getCacheConfig - default', () => {
  const config = cacheUtils.getCacheConfig('default');
  if (config.maxAge !== 60) throw new Error('Default maxAge should be 60');
});

test('cacheUtils.getCacheControlHeader', () => {
  const config = { maxAge: 60, sMaxAge: 120, staleWhileRevalidate: 300 };
  const header = cacheUtils.getCacheControlHeader(config);
  if (!header.includes('max-age=60')) throw new Error('Should include max-age');
  if (!header.includes('s-maxage=120')) throw new Error('Should include s-maxage');
  if (!header.includes('stale-while-revalidate=300')) throw new Error('Should include SWR');
});

// Test Athlete API
console.log('\nAthlete API:');

await testAsync('athleteApi.list()', async () => {
  await athleteApi.list();
});

await testAsync('athleteApi.list({ confirmedOnly: true })', async () => {
  await athleteApi.list({ confirmedOnly: true });
});

await testAsync('athleteApi.details(1)', async () => {
  await athleteApi.details(1);
});

await testAsync('athleteApi.details with options', async () => {
  await athleteApi.details(1, {
    progression: true,
    results: true,
    include: ['stats', 'progression'],
    discipline: 'marathon',
    year: 2024,
  });
});

await testAsync('athleteApi.add', async () => {
  await athleteApi.add({ name: 'Test Athlete' });
});

await testAsync('athleteApi.update', async () => {
  await athleteApi.update(1, { name: 'Updated Name' });
});

await testAsync('athleteApi.toggleConfirmation', async () => {
  await athleteApi.toggleConfirmation(1, 1);
});

await testAsync('athleteApi.sync', async () => {
  await athleteApi.sync(1);
});

// Test Game State API
console.log('\nGame State API:');

await testAsync('gameStateApi.load', async () => {
  await gameStateApi.load('test-game');
});

await testAsync('gameStateApi.save', async () => {
  await gameStateApi.save('test-game', { draftComplete: true });
});

// Test Session API
console.log('\nSession API:');

await testAsync('sessionApi.create', async () => {
  await sessionApi.create('Test Team', 'Owner', 'default');
});

await testAsync('sessionApi.verify', async () => {
  await sessionApi.verify('test-token');
});

// Test Salary Cap Draft API
console.log('\nSalary Cap Draft API:');

await testAsync('salaryCapDraftApi.submitTeam', async () => {
  await salaryCapDraftApi.submitTeam('test-game', 'P123', { men: [], women: [] });
});

await testAsync('salaryCapDraftApi.partialSave', async () => {
  await salaryCapDraftApi.partialSave('test-game', { men: [], women: [] }, 'token-123');
});

await testAsync('salaryCapDraftApi.getTeam', async () => {
  await salaryCapDraftApi.getTeam('test-game', 'P123');
});

await testAsync('salaryCapDraftApi.getTeam without playerCode', async () => {
  await salaryCapDraftApi.getTeam('test-game');
});

// Test Results API
console.log('\nResults API:');

await testAsync('resultsApi.fetch', async () => {
  await resultsApi.fetch('test-game');
});

await testAsync('resultsApi.fetch with skipDNS', async () => {
  await resultsApi.fetch('test-game', { skipDNS: true });
});

await testAsync('resultsApi.update', async () => {
  await resultsApi.update('test-game', { men: [], women: [] });
});

await testAsync('resultsApi.getScoring', async () => {
  await resultsApi.getScoring('test-game');
});

// Test Commissioner API
console.log('\nCommissioner API:');

await testAsync('commissionerApi.verifyTOTP', async () => {
  await commissionerApi.verifyTOTP('123456');
});

await testAsync('commissionerApi.verifyTOTP with email', async () => {
  await commissionerApi.verifyTOTP('123456', 'test@example.com');
});

await testAsync('commissionerApi.resetGame', async () => {
  await commissionerApi.resetGame('test-game');
});

await testAsync('commissionerApi.loadDemoData', async () => {
  await commissionerApi.loadDemoData('test-game');
});

await testAsync('commissionerApi.logout', async () => {
  await commissionerApi.logout();
});

// Test Races API
console.log('\nRaces API:');

await testAsync('racesApi.list', async () => {
  await racesApi.list();
});

await testAsync('racesApi.list with filters', async () => {
  await racesApi.list({ id: 1, active: true, includeAthletes: true });
});

await testAsync('racesApi.create', async () => {
  await racesApi.create({
    name: 'Test Marathon',
    date: '2025-11-20',
    location: 'Test City',
    distance: '42.195km',
    event_type: 'marathon',
  });
});

await testAsync('racesApi.update', async () => {
  await racesApi.update(1, {
    name: 'Updated Marathon',
    is_active: true,
  });
});

// Test Athlete Races API
console.log('\nAthlete Races API:');

await testAsync('athleteRacesApi.list', async () => {
  await athleteRacesApi.list({ raceId: 1 });
});

await testAsync('athleteRacesApi.confirm', async () => {
  await athleteRacesApi.confirm(1, 1, '123');
});

await testAsync('athleteRacesApi.unconfirm', async () => {
  await athleteRacesApi.unconfirm(1, 1);
});

// Test Standings API
console.log('\nStandings API:');

await testAsync('standingsApi.fetch', async () => {
  await standingsApi.fetch('test-game');
});

// Test Server API Client
console.log('\nServer API Client:');

test('createServerApiClient', () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  if (!serverApi) throw new Error('Should create server API client');
  if (!serverApi.athletes) throw new Error('Should have athletes API');
  if (!serverApi.gameState) throw new Error('Should have gameState API');
  if (!serverApi.session) throw new Error('Should have session API');
  if (!serverApi.salaryCapDraft) throw new Error('Should have salaryCapDraft API');
  if (!serverApi.results) throw new Error('Should have results API');
  if (!serverApi.standings) throw new Error('Should have standings API');
});

await testAsync('serverApi.athletes.list', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.athletes.list();
});

await testAsync('serverApi.athletes.list with confirmedOnly', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.athletes.list({ confirmedOnly: true });
});

await testAsync('serverApi.athletes.add', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.athletes.add({ name: 'Test' });
});

await testAsync('serverApi.athletes.update', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.athletes.update(1, { name: 'Updated' });
});

await testAsync('serverApi.athletes.toggleConfirmation', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.athletes.toggleConfirmation(1, 1);
});

await testAsync('serverApi.athletes.sync', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.athletes.sync(1);
});

await testAsync('serverApi.gameState.load', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.gameState.load('test-game');
});

await testAsync('serverApi.gameState.save', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.gameState.save('test-game', { data: 'test' });
});

await testAsync('serverApi.session.verify', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.session.verify('test-token');
});

await testAsync('serverApi.salaryCapDraft.get', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.salaryCapDraft.get('test-game', 'token-123');
});

await testAsync('serverApi.salaryCapDraft.submit', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.salaryCapDraft.submit('test-game', { men: [], women: [] }, 'token-123');
});

await testAsync('serverApi.results.get', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.results.get('test-game');
});

await testAsync('serverApi.results.save', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.results.save('test-game', { men: [], women: [] });
});

await testAsync('serverApi.standings.get', async () => {
  const serverApi = createServerApiClient('http://localhost:3000');
  await serverApi.standings.get('test-game');
});

// Summary
console.log('\n' + '='.repeat(50));
console.log(`Tests: ${testsPassed} passed, ${testsFailed} failed`);

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('✅ All API Client Coverage Tests Passed!');
  process.exit(0);
}
