#!/usr/bin/env node

/**
 * Database Cleanup Script
 * Removes all test data from the database
 * 
 * Usage:
 *   node scripts/cleanup-test-data.js
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function cleanupTestGame(gameId) {
  console.log(`🧹 Cleaning up test data for game: ${gameId}`);
  
  try {
    const results = {};

    // Delete in order of foreign key dependencies
    const raceResults = await sql`DELETE FROM race_results WHERE game_id = ${gameId} RETURNING id`;
    results.race_results = raceResults.length;

    const salaryCapTeams = await sql`DELETE FROM salary_cap_teams WHERE game_id = ${gameId} RETURNING id`;
    results.salary_cap_teams = salaryCapTeams.length;

    const draftTeams = await sql`DELETE FROM draft_teams WHERE game_id = ${gameId} RETURNING id`;
    results.draft_teams = draftTeams.length;

    const playerRankings = await sql`DELETE FROM player_rankings WHERE game_id = ${gameId} RETURNING id`;
    results.player_rankings = playerRankings.length;

    const anonymousSessions = await sql`DELETE FROM anonymous_sessions WHERE game_id = ${gameId} RETURNING id`;
    results.anonymous_sessions = anonymousSessions.length;

    const games = await sql`DELETE FROM games WHERE game_id = ${gameId} RETURNING id`;
    results.games = games.length;

    console.log(`✅ Cleanup complete:`, results);
    return results;
  } catch (error) {
    console.error(`❌ Error cleaning up game ${gameId}:`, error.message);
    throw error;
  }
}

async function cleanupTestGames(pattern) {
  console.log(`🧹 Cleaning up all test games matching pattern: ${pattern}`);
  
  try {
    const games = await sql`
      SELECT game_id FROM games 
      WHERE game_id LIKE ${pattern}
    `;

    console.log(`   Found ${games.length} test games to clean up`);

    for (const game of games) {
      await cleanupTestGame(game.game_id);
    }

    return games.length;
  } catch (error) {
    console.error(`❌ Error cleaning up test games:`, error.message);
    throw error;
  }
}

async function cleanupTestSessions(namePattern) {
  console.log(`🧹 Cleaning up test sessions matching: ${namePattern}`);
  
  try {
    const sessions = await sql`
      DELETE FROM anonymous_sessions 
      WHERE display_name LIKE ${namePattern}
      RETURNING id
    `;

    console.log(`✅ Deleted ${sessions.length} test sessions`);
    return sessions.length;
  } catch (error) {
    console.error(`❌ Error cleaning up test sessions:`, error.message);
    throw error;
  }
}

async function gameExists(gameId) {
  const result = await sql`
    SELECT game_id FROM games WHERE game_id = ${gameId}
  `;
  return result.length > 0;
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         Database Test Data Cleanup Script                 ║');
  console.log('║                                                            ║');
  console.log('║  ⚠️  WARNING: This will permanently delete test data!      ║');
  console.log('║                                                            ║');
  console.log('║  PROTECTED GAMES (never deleted):                          ║');
  console.log('║    - default                                               ║');
  console.log('║    - production                                            ║');
  console.log('║    - live                                                  ║');
  console.log('║    - Any game without test/e2e/integration prefix          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // CRITICAL: Protected game IDs that should NEVER be cleaned up
    const PROTECTED_GAMES = ['default', 'production', 'live', 'prod'];
    
    // Verify no protected games will be deleted
    console.log('🛡️  Verifying protected games are safe...');
    for (const gameId of PROTECTED_GAMES) {
      const exists = await gameExists(gameId);
      if (exists) {
        console.log(`   ✅ Protected game "${gameId}" will NOT be deleted`);
      }
    }
    console.log('');
    // Clean up common test patterns
    await cleanupTestGames('test-%');
    await cleanupTestGames('e2e-%');
    await cleanupTestGames('integration-%');
    await cleanupTestGames('salarycap-test-%');
    
    // Clean up literal test gameIds (edge cases from older tests)
    // ⚠️ CRITICAL: Never include 'default' or production game IDs here!
    console.log('\n🧹 Cleaning up literal test game IDs...');
    const literalTestGames = ['test-game', 'test', 'test-1', 'test-2', 'test-3'];
    
    let cleanedCount = 0;
    for (const gameId of literalTestGames) {
      const exists = await gameExists(gameId);
      if (exists) {
        console.log(`   Found literal test game: ${gameId}`);
        await cleanupTestGame(gameId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount === 0) {
      console.log('   No literal test games found');
    }
    
    // Clean up test sessions
    console.log('');
    await cleanupTestSessions('Test Team%');
    await cleanupTestSessions('Test%');
    
    // Clean up any test games with roster locks
    console.log('\n🧹 Cleaning up test games with roster locks...');
    const testGamesWithLocks = await sql`
      SELECT game_id FROM games 
      WHERE roster_lock_time IS NOT NULL 
      AND (
        game_id LIKE 'test-%' 
        OR game_id LIKE 'e2e-%' 
        OR game_id LIKE 'integration-%'
        OR game_id LIKE 'salarycap-test-%'
      )
    `;
    
    console.log(`   Found ${testGamesWithLocks.length} test games with roster locks`);
    
    for (const game of testGamesWithLocks) {
      await cleanupTestGame(game.game_id);
    }
    
    console.log('\n✅ Database cleanup complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

main();
