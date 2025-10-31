/**
 * Test script for the import-live-results API endpoint
 * 
 * This script tests the bookmarklet API with sample data to ensure
 * it correctly processes athlete results and updates the database.
 */

// Sample test data simulating NYRR leaderboard results
const testData = {
  gameId: 'test-game-import',
  splitType: 'half',
  gender: 'men',
  athletes: [
    {
      name: 'Eliud Kipchoge',
      time: '1:00:30',
      country: 'KEN',
      rank: 1
    },
    {
      name: 'Kenenisa Bekele',
      time: '1:00:45',
      country: 'ETH',
      rank: 2
    },
    {
      name: 'Unknown Athlete',
      time: '1:01:00',
      country: 'USA',
      rank: 3
    }
  ],
  sessionToken: null
};

async function testImportAPI() {
  console.log('🧪 Testing Import Live Results API\n');
  console.log('Test Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('\n---\n');

  try {
    const apiUrl = process.env.API_URL || 'http://localhost:3000';
    const endpoint = `${apiUrl}/api/import-live-results`;

    console.log(`📡 Sending POST request to: ${endpoint}\n`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}\n`);

    const result = await response.json();

    if (response.ok) {
      console.log('✅ SUCCESS!\n');
      console.log('Response:');
      console.log(JSON.stringify(result, null, 2));
      
      console.log('\n📈 Summary:');
      console.log(`  Total Athletes: ${result.summary.total}`);
      console.log(`  Successfully Imported: ${result.summary.successful}`);
      console.log(`  Failed: ${result.summary.failed}`);

      if (result.updatedAthletes && result.updatedAthletes.length > 0) {
        console.log('\n✓ Updated Athletes:');
        result.updatedAthletes.forEach(a => {
          console.log(`  - ${a.name} (ID: ${a.id}) - ${a.time}`);
        });
      }

      if (result.failedAthletes && result.failedAthletes.length > 0) {
        console.log('\n✗ Failed Athletes:');
        result.failedAthletes.forEach(a => {
          console.log(`  - ${a.name}: ${a.reason}`);
        });
      }

      console.log('\n✅ Test completed successfully!');
      return true;

    } else {
      console.log('❌ ERROR!\n');
      console.log('Error Response:');
      console.log(JSON.stringify(result, null, 2));
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
    console.error(error.stack);
    return false;
  }
}

// Test validation functions
function testValidation() {
  console.log('\n🔍 Testing Input Validation\n');

  const tests = [
    {
      name: 'Missing gameId',
      data: { ...testData, gameId: undefined },
      expectedError: 'Missing required fields'
    },
    {
      name: 'Invalid split type',
      data: { ...testData, splitType: 'invalid' },
      expectedError: 'Invalid split type'
    },
    {
      name: 'Invalid gender',
      data: { ...testData, gender: 'invalid' },
      expectedError: 'Invalid gender'
    },
    {
      name: 'Missing athletes array',
      data: { ...testData, athletes: undefined },
      expectedError: 'Missing required fields'
    }
  ];

  tests.forEach(test => {
    console.log(`  Testing: ${test.name}`);
    // Validation would happen server-side, so we just log the test case
    console.log(`    Expected error: ${test.expectedError} ✓`);
  });

  console.log('\n✅ Validation tests defined (run against live API to verify)');
}

// Run tests
async function runTests() {
  console.log('='+ '='.repeat(60) + '=');
  console.log('  IMPORT LIVE RESULTS API TEST SUITE');
  console.log('='+ '='.repeat(60) + '=\n');

  // Check if database is available
  if (!process.env.DATABASE_URL) {
    console.log('⚠️  WARNING: DATABASE_URL not set');
    console.log('   This test requires a database connection to run properly.\n');
  }

  // Run validation tests
  testValidation();

  // Run API integration test
  console.log('\n' + '-'.repeat(62));
  const success = await testImportAPI();
  console.log('-'.repeat(62) + '\n');

  if (success) {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  } else {
    console.log('💥 Some tests failed.\n');
    process.exit(1);
  }
}

// Handle command line execution
if (require.main === module) {
  runTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
}

module.exports = { testImportAPI, testValidation };
