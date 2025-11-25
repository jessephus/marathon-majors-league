#!/usr/bin/env node

/**
 * Test World Athletics API connectivity
 * This script tests the WA GraphQL endpoint to diagnose fetch failures
 */

const WA_GRAPHQL_URL = 'https://graphql-prod-4746.prod.aws.worldathletics.org/graphql';
const WA_GRAPHQL_HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': 'da2-fcprvsdozzce5dx2baifenjwpu'
};

async function testWAApi() {
  console.log('🔍 Testing World Athletics API connectivity...\n');
  console.log(`📍 Endpoint: ${WA_GRAPHQL_URL}`);
  console.log(`🔑 API Key: ${WA_GRAPHQL_HEADERS['x-api-key'].substring(0, 10)}...`);
  console.log('');

  const query = `
    query SearchCompetitors($query: String!) {
      searchCompetitors(query: $query, gender: "m") {
        aaAthleteId
        givenName
        familyName
        birthDate
        country
        disciplines
      }
    }
  `;

  const testName = 'Eliud Kipchoge';

  console.log(`🧪 Testing search for: ${testName}\n`);

  try {
    console.log('📤 Sending fetch request...');
    const response = await fetch(WA_GRAPHQL_URL, {
      method: 'POST',
      headers: WA_GRAPHQL_HEADERS,
      body: JSON.stringify({
        query,
        variables: { query: testName }
      })
    });

    console.log(`✅ Fetch successful!`);
    console.log(`📥 Response status: ${response.status} ${response.statusText}`);
    console.log(`📋 Response headers:`, Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const text = await response.text();
      console.error(`\n❌ HTTP Error ${response.status}:`);
      console.error(text);
      return;
    }

    const data = await response.json();
    console.log('\n📦 Response data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.data?.searchCompetitors) {
      console.log(`\n✅ Found ${data.data.searchCompetitors.length} athletes`);
      if (data.data.searchCompetitors.length > 0) {
        const first = data.data.searchCompetitors[0];
        console.log(`   First result: ${first.givenName} ${first.familyName} (${first.country})`);
      }
    } else {
      console.log('\n⚠️  No results found or unexpected response structure');
    }

  } catch (error) {
    console.error('\n❌ FETCH FAILED:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error cause:', error.cause);
    console.error('\nFull error object:');
    console.error(error);

    // Check for common issues
    console.log('\n🔍 Diagnostic checks:');
    console.log('- Node.js version:', process.version);
    console.log('- Platform:', process.platform);
    console.log('- Architecture:', process.arch);
    
    if (error.cause) {
      console.log('\n⚠️  Underlying cause:', error.cause);
    }
  }
}

// Run the test
testWAApi().catch(console.error);
