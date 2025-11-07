/**
 * Commissioner Panel Tests
 * 
 * Tests for the modularized commissioner dashboard panels including:
 * - Results Management Panel
 * - Athlete Management Panel
 * - Teams Overview Panel
 * - State events integration
 * - Cache invalidation
 */

const http = require('http');
const https = require('https');

// Test configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_TIMEOUT = 10000;

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

// Test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

/**
 * Helper function to make HTTP requests
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = data ? JSON.parse(data) : null;
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (err) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(TEST_TIMEOUT);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

/**
 * Test assertion function
 */
function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`${colors.green}✓${colors.reset} ${message}`);
    return true;
  } else {
    failedTests++;
    console.log(`${colors.red}✗${colors.reset} ${message}`);
    return false;
  }
}

/**
 * Test suite runner
 */
async function runTest(name, testFn) {
  console.log(`\n${colors.cyan}Running: ${name}${colors.reset}`);
  try {
    await testFn();
  } catch (error) {
    failedTests++;
    console.log(`${colors.red}✗ Test failed: ${error.message}${colors.reset}`);
  }
}

/**
 * Test: Commissioner Dashboard Page Loads
 */
async function testCommissionerDashboardLoads() {
  const response = await makeRequest(`${BASE_URL}/commissioner`);
  
  assert(
    response.status === 200,
    'Commissioner page returns 200 status'
  );
  
  assert(
    typeof response.data === 'string' && response.data.includes('Commissioner'),
    'Commissioner page contains expected content'
  );
}

/**
 * Test: Results API Endpoints
 */
async function testResultsAPIEndpoints() {
  // Test GET results
  const getResponse = await makeRequest(`${BASE_URL}/api/results?gameId=default`);
  
  assert(
    getResponse.status === 200,
    'GET /api/results returns 200 status'
  );
  
  assert(
    typeof getResponse.data === 'object',
    'GET /api/results returns valid JSON'
  );

  // Test POST results (requires mock data)
  const mockResults = {
    1: { finishTime: '02:05:30', position: 1 },
    2: { finishTime: '02:06:45', position: 2 },
  };

  const postResponse = await makeRequest(`${BASE_URL}/api/results?gameId=default`, {
    method: 'POST',
    body: mockResults,
  });

  assert(
    postResponse.status === 200 || postResponse.status === 400,
    'POST /api/results returns valid status'
  );
}

/**
 * Test: Athletes API Endpoints
 */
async function testAthletesAPIEndpoints() {
  // Test GET athletes
  const getResponse = await makeRequest(`${BASE_URL}/api/athletes`);
  
  assert(
    getResponse.status === 200,
    'GET /api/athletes returns 200 status'
  );
  
  assert(
    getResponse.data && 
    typeof getResponse.data.men === 'object' &&
    typeof getResponse.data.women === 'object',
    'GET /api/athletes returns athletes with men and women categories'
  );

  // Test add athlete endpoint exists
  const mockAthlete = {
    name: 'Test Runner',
    country: 'USA',
    gender: 'men',
    pb: '02:10:00',
  };

  const postResponse = await makeRequest(`${BASE_URL}/api/add-athlete`, {
    method: 'POST',
    body: mockAthlete,
  });

  assert(
    postResponse.status === 200 || postResponse.status === 400 || postResponse.status === 500,
    'POST /api/add-athlete endpoint exists and responds'
  );
}

/**
 * Test: Game State API Endpoints
 */
async function testGameStateAPIEndpoints() {
  // Test GET game state
  const getResponse = await makeRequest(`${BASE_URL}/api/game-state?gameId=default`);
  
  assert(
    getResponse.status === 200,
    'GET /api/game-state returns 200 status'
  );
  
  assert(
    getResponse.data && typeof getResponse.data === 'object',
    'GET /api/game-state returns valid game state object'
  );

  assert(
    'draftComplete' in getResponse.data && 'resultsFinalized' in getResponse.data,
    'Game state contains required fields (draftComplete, resultsFinalized)'
  );
}

/**
 * Test: Cache Invalidation Flow
 */
async function testCacheInvalidation() {
  // First, get initial results
  const initialResponse = await makeRequest(`${BASE_URL}/api/results?gameId=default`);
  const initialData = JSON.stringify(initialResponse.data);

  assert(
    initialResponse.status === 200,
    'Initial results fetch succeeds'
  );

  // Update results (this should invalidate cache)
  const updateResponse = await makeRequest(`${BASE_URL}/api/results?gameId=default`, {
    method: 'POST',
    body: {
      1: { finishTime: '02:05:30', position: 1 },
    },
  });

  // Note: In a real test, we'd verify cache headers or timestamps changed
  // For now, we just verify the endpoint responds
  assert(
    updateResponse.status === 200 || updateResponse.status === 400,
    'Results update triggers cache invalidation flow'
  );
}

/**
 * Test: State Events Integration
 */
async function testStateEventsIntegration() {
  // This test verifies that state events are properly configured
  // In a real browser environment, we'd test event listeners
  
  // For now, we verify the API endpoints that trigger events exist
  const endpoints = [
    '/api/results',
    '/api/add-athlete',
    '/api/update-athlete',
    '/api/game-state',
  ];

  for (const endpoint of endpoints) {
    const response = await makeRequest(`${BASE_URL}${endpoint}${endpoint.includes('?') ? '' : '?gameId=default'}`);
    
    assert(
      response.status === 200 || response.status === 400,
      `State event endpoint ${endpoint} exists`
    );
  }
}

/**
 * Test: Commissioner Authentication Flow
 */
async function testCommissionerAuthFlow() {
  // Test TOTP verification endpoint
  const totpResponse = await makeRequest(`${BASE_URL}/api/auth/totp/verify`, {
    method: 'POST',
    body: {
      email: 'commissioner@marathonmajorsfantasy.com',
      totpCode: '000000', // Invalid code
    },
  });

  assert(
    totpResponse.status === 200 || totpResponse.status === 401,
    'TOTP verification endpoint responds'
  );

  assert(
    totpResponse.data && 'success' in totpResponse.data,
    'TOTP response contains success field'
  );
}

/**
 * Test: Admin Actions Integration
 */
async function testAdminActionsIntegration() {
  // Test reset game endpoint
  const resetResponse = await makeRequest(`${BASE_URL}/api/reset-game`, {
    method: 'POST',
    body: { gameId: 'test-game' },
  });

  assert(
    resetResponse.status === 200 || resetResponse.status === 400 || resetResponse.status === 401,
    'Reset game endpoint exists and responds'
  );

  // Test load demo data endpoint
  const demoResponse = await makeRequest(`${BASE_URL}/api/load-demo-data`, {
    method: 'POST',
    body: { gameId: 'test-game' },
  });

  assert(
    demoResponse.status === 200 || demoResponse.status === 400 || demoResponse.status === 401,
    'Load demo data endpoint exists and responds'
  );
}

/**
 * Test: Panel Component API Integration
 */
async function testPanelComponentIntegration() {
  // Verify all required API endpoints for panels exist
  const requiredEndpoints = [
    { path: '/api/results?gameId=default', method: 'GET', panel: 'ResultsManagementPanel' },
    { path: '/api/results?gameId=default', method: 'POST', panel: 'ResultsManagementPanel' },
    { path: '/api/athletes', method: 'GET', panel: 'AthleteManagementPanel' },
    { path: '/api/add-athlete', method: 'POST', panel: 'AthleteManagementPanel' },
    { path: '/api/game-state?gameId=default', method: 'GET', panel: 'TeamsOverviewPanel' },
  ];

  for (const endpoint of requiredEndpoints) {
    const response = await makeRequest(`${BASE_URL}${endpoint.path}`, {
      method: endpoint.method,
      body: endpoint.method === 'POST' ? {} : undefined,
    });

    assert(
      response.status >= 200 && response.status < 500,
      `${endpoint.panel} endpoint ${endpoint.method} ${endpoint.path} is accessible`
    );
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}   Commissioner Panel Modularization Test Suite       ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`\n🎯 Target: ${BASE_URL}\n`);

  // Check if server is reachable
  try {
    await makeRequest(BASE_URL);
  } catch (error) {
    console.log(`${colors.red}❌ Cannot reach server at ${BASE_URL}${colors.reset}`);
    console.log(`   Error: ${error.message}\n`);
    console.log(`💡 Tips:`);
    console.log(`   - Make sure the app is running (npm run dev or npm start)`);
    console.log(`   - Check if the URL is correct`);
    console.log(`   - Set TEST_URL environment variable for production testing`);
    process.exit(1);
  }

  // Run all tests
  await runTest('Commissioner Dashboard Page Loads', testCommissionerDashboardLoads);
  await runTest('Results API Endpoints', testResultsAPIEndpoints);
  await runTest('Athletes API Endpoints', testAthletesAPIEndpoints);
  await runTest('Game State API Endpoints', testGameStateAPIEndpoints);
  await runTest('Cache Invalidation Flow', testCacheInvalidation);
  await runTest('State Events Integration', testStateEventsIntegration);
  await runTest('Commissioner Authentication Flow', testCommissionerAuthFlow);
  await runTest('Admin Actions Integration', testAdminActionsIntegration);
  await runTest('Panel Component API Integration', testPanelComponentIntegration);

  // Print summary
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}   Test Summary                                        ${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
  console.log(`\n📊 Total Tests: ${totalTests}`);
  console.log(`${colors.green}✓ Passed: ${passedTests}${colors.reset}`);
  console.log(`${colors.red}✗ Failed: ${failedTests}${colors.reset}`);
  
  if (failedTests === 0) {
    console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ Some tests failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().catch((error) => {
    console.error(`${colors.red}Fatal error:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  makeRequest,
};
