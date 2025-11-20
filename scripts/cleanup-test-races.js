#!/usr/bin/env node

/**
 * Cleanup Test Races Utility
 * 
 * This script removes test races created during test runs that weren't cleaned up.
 * It pattern-matches race names to identify and delete test data.
 * 
 * Usage:
 *   node scripts/cleanup-test-races.js
 * 
 * Test Race Patterns:
 *   - "Visual Test Marathon 2025" - Created in visual fields tests
 *   - "Race News Test Race" - Created in news management tests
 *   - "Athlete Confirmation Test Race" - Created in athlete confirmation tests
 *   - Any race name containing "Test" (case-insensitive)
 */

import { neon } from '@neondatabase/serverless';

// Load DATABASE_URL from environment
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable not set');
  console.error('');
  console.error('Run this first:');
  console.error('  vercel env pull');
  console.error('  source .env.local');
  console.error('  node scripts/cleanup-test-races.js');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

/**
 * Test race name patterns to match
 */
const TEST_PATTERNS = [
  'Visual Test Marathon 2025',
  'Race News Test Race',
  'Athlete Confirmation Test Race',
  'Test Marathon 2025', // From basic CRUD tests
];

/**
 * Main cleanup function
 */
async function cleanupTestRaces() {
  console.log('🧹 Starting test race cleanup...\n');

  try {
    // Query all races with "Test" in the name
    const testRaces = await sql`
      SELECT id, name, created_at
      FROM races
      WHERE name LIKE '%Test%'
      ORDER BY created_at DESC
    `;

    if (testRaces.length === 0) {
      console.log('✅ No test races found. Database is clean!\n');
      return;
    }

    console.log(`Found ${testRaces.length} test race(s):\n`);
    testRaces.forEach(race => {
      console.log(`  [${race.id}] ${race.name} (${new Date(race.created_at).toISOString()})`);
    });
    console.log('');

    // Delete each test race
    // CASCADE will automatically delete:
    //   - athlete_races (athlete confirmations)
    //   - race_news (news items)
    let deletedCount = 0;
    let failedCount = 0;

    for (const race of testRaces) {
      try {
        await sql`
          DELETE FROM races
          WHERE id = ${race.id}
        `;
        console.log(`✅ Deleted: [${race.id}] ${race.name}`);
        deletedCount++;
      } catch (error) {
        console.error(`❌ Failed to delete [${race.id}] ${race.name}: ${error.message}`);
        failedCount++;
      }
    }

    console.log('');
    console.log(`📊 Cleanup Summary:`);
    console.log(`   Deleted: ${deletedCount} race(s)`);
    if (failedCount > 0) {
      console.log(`   Failed:  ${failedCount} race(s)`);
    }
    console.log('');

    if (deletedCount > 0) {
      console.log('✅ Test race cleanup completed successfully\n');
    }

  } catch (error) {
    console.error('❌ ERROR during cleanup:', error);
    console.error('');
    process.exit(1);
  }
}

/**
 * Verify cleanup was successful
 */
async function verifyCleanup() {
  const remainingTestRaces = await sql`
    SELECT COUNT(*) as count
    FROM races
    WHERE name LIKE '%Test%'
  `;

  const count = parseInt(remainingTestRaces[0].count);
  
  if (count === 0) {
    console.log('✅ Verification passed: No test races remaining\n');
    return true;
  } else {
    console.warn(`⚠️  Warning: ${count} test race(s) still exist in database\n`);
    return false;
  }
}

// Run cleanup
cleanupTestRaces()
  .then(() => verifyCleanup())
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
