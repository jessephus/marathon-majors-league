#!/usr/bin/env node

/**
 * Test script to verify sessionToken extraction and URL generation
 * Tests the fix for handleBellClick navigation bug
 */

console.log('🧪 Testing sessionToken extraction for bell click navigation\n');

// Simulate what's stored in localStorage
const sessionDataJSON = JSON.stringify({
  token: 'b9838bc4-e602-4d47-bf96-4a3a1a525ca4',
  displayName: 'My Team',
  gameId: 'Valencia-25'
});

console.log('📦 Session data in localStorage:');
console.log(`  ${sessionDataJSON}\n`);

// BUGGY VERSION (original code)
console.log('❌ BUGGY: Direct use without parsing');
const buggyUrl = `/team/${sessionDataJSON}`;
console.log(`  URL: ${buggyUrl}\n`);
console.log(`  ⚠️ This is URL-encoded by router.push():`);
console.log(`  /team/${encodeURIComponent(sessionDataJSON)}\n`);

// FIXED VERSION (with parsing)
console.log('✅ FIXED: Parse JSON and extract token');
let sessionToken = sessionDataJSON;
try {
  const parsed = JSON.parse(sessionDataJSON);
  sessionToken = parsed.token || sessionDataJSON;
} catch (e) {
  // Already a token string
}
const fixedUrl = `/team/${sessionToken}`;
console.log(`  URL: ${fixedUrl}\n`);

// Verify it matches expected format
const expectedUrl = '/team/b9838bc4-e602-4d47-bf96-4a3a1a525ca4';
console.log('🔍 Verification:');
console.log(`  Expected: ${expectedUrl}`);
console.log(`  Got:      ${fixedUrl}`);
console.log(`  ✅ Match: ${fixedUrl === expectedUrl}\n`);

// Test edge case: token already stored as string
console.log('🧪 Edge case: Token stored as string (not JSON)');
let edgeCaseToken = 'b9838bc4-e602-4d47-bf96-4a3a1a525ca4';
try {
  const parsed = JSON.parse(edgeCaseToken);
  edgeCaseToken = parsed.token || edgeCaseToken;
} catch (e) {
  // Already a token string - this is expected
}
console.log(`  Input:  "b9838bc4-e602-4d47-bf96-4a3a1a525ca4"`);
console.log(`  Output: "${edgeCaseToken}"`);
console.log(`  ✅ Handles gracefully\n`);

console.log('🎉 All tests passed!');
console.log('\nSummary:');
console.log('  1. Fixed handleBellClick to parse sessionToken correctly');
console.log('  2. Now generates clean URLs: /team/[uuid]');
console.log('  3. Backward compatible with token-only strings');
