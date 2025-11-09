/**
 * Test Utilities
 * 
 * Provides helper functions for test cleanup and data management
 * to prevent test data pollution in the database.
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config(); // Fallback to .env

// Lazy-load database connection
let _sql = null;
function getSql() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required for test cleanup. Make sure .env.local or .env file exists with DATABASE_URL.');
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

/**
 * Generate a unique test ID with timestamp
 */
export function generateTestId(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Clean up test data for a specific game
 * 
 * @param {string} gameId - The game ID to clean up
 * @returns {Promise<Object>} - Counts of deleted records
 */
export async function cleanupTestGame(gameId) {
  console.log(`🧹 Cleaning up test data for game: ${gameId}`);
  
  try {
    // Delete in correct order to respect foreign key constraints
    const results = {
      race_results: 0,
      salary_cap_teams: 0,
      draft_teams: 0,
      player_rankings: 0,
      anonymous_sessions: 0,
      games: 0,
    };

    // 1. Delete race results
    const raceResults = await getSql()`
      DELETE FROM race_results 
      WHERE game_id = ${gameId}
      RETURNING id
    `;
    results.race_results = raceResults.length;

    // 2. Delete salary cap teams
    const salaryCapTeams = await getSql()`
      DELETE FROM salary_cap_teams 
      WHERE game_id = ${gameId}
      RETURNING id
    `;
    results.salary_cap_teams = salaryCapTeams.length;

    // 3. Delete draft teams
    const draftTeams = await getSql()`
      DELETE FROM draft_teams 
      WHERE game_id = ${gameId}
      RETURNING id
    `;
    results.draft_teams = draftTeams.length;

    // 4. Delete player rankings
    const playerRankings = await getSql()`
      DELETE FROM player_rankings 
      WHERE game_id = ${gameId}
      RETURNING id
    `;
    results.player_rankings = playerRankings.length;

    // 5. Delete anonymous sessions
    const sessions = await getSql()`
      DELETE FROM anonymous_sessions 
      WHERE game_id = ${gameId}
      RETURNING id
    `;
    results.anonymous_sessions = sessions.length;

    // 6. Delete game record
    const games = await getSql()`
      DELETE FROM games 
      WHERE game_id = ${gameId}
      RETURNING id
    `;
    results.games = games.length;

    console.log(`✅ Cleanup complete:`, results);
    return results;
  } catch (error) {
    console.error(`❌ Error cleaning up game ${gameId}:`, error.message);
    throw error;
  }
}

/**
 * Clean up all test games matching a pattern
 * 
 * @param {string} pattern - SQL LIKE pattern (e.g., 'test-%', 'e2e-%')
 * @returns {Promise<number>} - Number of games cleaned up
 */
export async function cleanupTestGames(pattern = 'test-%') {
  console.log(`🧹 Cleaning up all test games matching pattern: ${pattern}`);
  
  try {
    // Find all matching games
    const games = await getSql()`
      SELECT game_id FROM games 
      WHERE game_id LIKE ${pattern}
    `;

    console.log(`   Found ${games.length} test games to clean up`);

    // Clean up each game
    for (const game of games) {
      await cleanupTestGame(game.game_id);
    }

    return games.length;
  } catch (error) {
    console.error(`❌ Error cleaning up test games:`, error.message);
    throw error;
  }
}

/**
 * Create a test game with cleanup tracking
 * 
 * @param {string} gameId - The game ID to create
 * @param {Object} gameData - Game data
 * @returns {Promise<Object>} - Created game data
 */
export async function createTestGame(gameId, gameData = {}) {
  const defaultData = {
    players: [],
    draft_complete: false,
    results_finalized: false,
    ...gameData,
  };

  const result = await getSql()`
    INSERT INTO games (game_id, players, draft_complete, results_finalized)
    VALUES (
      ${gameId}, 
      ${defaultData.players}, 
      ${defaultData.draft_complete}, 
      ${defaultData.results_finalized}
    )
    RETURNING *
  `;

  return result[0];
}

/**
 * Wrapper for test functions that automatically cleans up
 * 
 * Usage:
 * await withCleanup('test-game-123', async (gameId) => {
 *   // Your test code here
 *   // Game will be cleaned up automatically after
 * });
 * 
 * @param {string} gameId - The game ID
 * @param {Function} testFn - Async test function that receives gameId
 * @returns {Promise<any>} - Test function result
 */
export async function withCleanup(gameId, testFn) {
  try {
    // Run the test
    return await testFn(gameId);
  } finally {
    // Always cleanup, even if test fails
    try {
      await cleanupTestGame(gameId);
    } catch (cleanupError) {
      console.error('⚠️  Warning: Cleanup failed:', cleanupError.message);
    }
  }
}

/**
 * Clean up test sessions that match a pattern
 * 
 * @param {string} namePattern - SQL LIKE pattern for display_name
 * @returns {Promise<number>} - Number of sessions deleted
 */
export async function cleanupTestSessions(namePattern = 'Test Team%') {
  console.log(`🧹 Cleaning up test sessions matching: ${namePattern}`);
  
  try {
    const sessions = await getSql()`
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

/**
 * Hook to run after all tests complete
 * Cleans up any remaining test data
 * 
 * Call this in your test runner's teardown
 */
export async function globalTestCleanup() {
  console.log('\n🧹 Running global test cleanup...');
  
  try {
    // Clean up common test patterns
    await cleanupTestGames('test-%');
    await cleanupTestGames('e2e-%');
    await cleanupTestGames('integration-%');
    await cleanupTestSessions('Test Team%');
    await cleanupTestSessions('Test%');
    
    console.log('✅ Global cleanup complete\n');
  } catch (error) {
    console.error('❌ Global cleanup failed:', error.message);
  }
}

/**
 * Check if a game exists
 */
export async function gameExists(gameId) {
  const result = await getSql()`
    SELECT game_id FROM games WHERE game_id = ${gameId}
  `;
  return result.length > 0;
}

/**
 * Get test data counts for a game
 */
export async function getTestDataCounts(gameId) {
  const [
    games,
    sessions,
    rankings,
    draftTeams,
    salaryCapTeams,
    results,
  ] = await Promise.all([
    sql`SELECT COUNT(*) as count FROM games WHERE game_id = ${gameId}`,
    sql`SELECT COUNT(*) as count FROM anonymous_sessions WHERE game_id = ${gameId}`,
    sql`SELECT COUNT(*) as count FROM player_rankings WHERE game_id = ${gameId}`,
    sql`SELECT COUNT(*) as count FROM draft_teams WHERE game_id = ${gameId}`,
    sql`SELECT COUNT(*) as count FROM salary_cap_teams WHERE game_id = ${gameId}`,
    sql`SELECT COUNT(*) as count FROM race_results WHERE game_id = ${gameId}`,
  ]);

  return {
    games: parseInt(games[0].count),
    sessions: parseInt(sessions[0].count),
    rankings: parseInt(rankings[0].count),
    draftTeams: parseInt(draftTeams[0].count),
    salaryCapTeams: parseInt(salaryCapTeams[0].count),
    results: parseInt(results[0].count),
  };
}
