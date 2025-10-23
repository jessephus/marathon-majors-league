#!/usr/bin/env node

/**
 * Test Runner
 * Runs all test suites for the Fantasy Marathon application
 * 
 * Usage:
 *   npm test                    # Run all tests against localhost:3000
 *   TEST_URL=https://marathonmajorsfantasy.com npm test    # Run against production
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const TEST_URL = process.env.TEST_URL || 'http://localhost:3000';

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║      Fantasy Marathon - Post-Migration Test Suite         ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`🎯 Target: ${TEST_URL}\n`);

const tests = [
  {
    name: 'API Endpoints',
    file: 'tests/api-endpoints.test.js',
    description: 'Tests all API endpoints for proper responses'
  },
  {
    name: 'Database Connection',
    file: 'tests/database.test.js',
    description: 'Verifies database connectivity and data integrity'
  },
  {
    name: 'Frontend Integration',
    file: 'tests/frontend-integration.test.js',
    description: 'Tests frontend asset serving and structure'
  },
  {
    name: 'Complete Game Flow',
    file: 'tests/game-flow.test.js',
    description: 'End-to-end test of entire game workflow'
  }
];

async function runTest(test) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📝 ${test.name}`);
  console.log(`   ${test.description}`);
  console.log('='.repeat(60));
  
  try {
    const { stdout, stderr } = await execAsync(`node ${test.file}`, {
      env: { ...process.env, TEST_URL }
    });
    
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    
    return { success: true, name: test.name };
  } catch (error) {
    console.error(`\n❌ ${test.name} FAILED:`);
    console.error(error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    
    return { success: false, name: test.name, error: error.message };
  }
}

async function runAllTests() {
  const startTime = Date.now();
  const results = [];
  
  // Run tests sequentially to avoid overwhelming the server
  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);
    
    // Small delay between test suites
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} test suites`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ${failed > 0 ? '❌' : ''}`);
  console.log(`Duration: ${duration}s`);
  console.log('='.repeat(60));
  
  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    console.log('   Make sure your app is running at:', TEST_URL);
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed! Your Next.js migration is working correctly! ✨\n');
    process.exit(0);
  }
}

// Check if server is reachable before running tests
async function checkServer() {
  console.log('🔍 Checking if server is reachable...');
  
  try {
    const response = await fetch(TEST_URL);
    if (response.status === 200 || response.status === 304) {
      console.log('✅ Server is reachable\n');
      return true;
    } else {
      console.log(`⚠️  Server returned status ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.error('❌ Cannot reach server at', TEST_URL);
    console.error('   Error:', error.message);
    console.error('\n💡 Tips:');
    console.error('   - Make sure the app is running (npm run dev or npm start)');
    console.error('   - Check if the URL is correct');
    console.error('   - Set TEST_URL environment variable for production testing\n');
    process.exit(1);
  }
}

// Run tests
checkServer().then(reachable => {
  if (reachable) {
    runAllTests();
  }
});
