/**
 * Audit Zero Pollution Test
 * 
 * This test runs the audit script and FAILS if any test data pollution is detected.
 * It should be run AFTER all other tests to ensure proper cleanup.
 * 
 * Purpose: Detect test data leaks that could pollute the database
 * 
 * Run with: node tests/audit-zero-pollution.test.js
 * Run after all tests: npm test && node tests/audit-zero-pollution.test.js
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

console.log('🔍 Running Zero Pollution Audit...');

describe('Database Test Data Pollution Audit', () => {
  
  it('should have ZERO test records in games table', async () => {
    const testGames = await sql`
      SELECT game_id FROM games 
      WHERE game_id != 'default'
        AND game_id NOT IN ('production', 'live', 'prod')
        AND (
          game_id LIKE '%test%' 
          OR game_id LIKE '%e2e%' 
          OR game_id LIKE '%integration%'
        )
    `;
    
    if (testGames.length > 0) {
      console.error('❌ Found test games:', testGames.map(g => g.game_id));
    }
    
    assert.strictEqual(testGames.length, 0, `Found ${testGames.length} test game(s) - cleanup failed!`);
    console.log('✅ games table: 0 test records');
  });
  
  it('should have ZERO test records in anonymous_sessions table', async () => {
    const testSessions = await sql`
      SELECT id, player_code FROM anonymous_sessions
      WHERE player_code != '311'
        AND (
          player_code LIKE '%test%'
          OR player_code LIKE '%e2e%'
          OR display_name LIKE '%test%'
          OR display_name LIKE '%e2e%'
        )
    `;
    
    if (testSessions.length > 0) {
      console.error('❌ Found test sessions:', testSessions.map(s => s.player_code));
    }
    
    assert.strictEqual(testSessions.length, 0, `Found ${testSessions.length} test session(s) - cleanup failed!`);
    console.log('✅ anonymous_sessions table: 0 test records');
  });
  
  it('should have ZERO test records in salary_cap_teams table', async () => {
    const testTeams = await sql`
      SELECT game_id, player_code FROM salary_cap_teams
      WHERE game_id != 'default'
        AND player_code != '311'
        AND (
          game_id LIKE '%test%'
          OR game_id LIKE '%e2e%'
          OR game_id LIKE '%integration%'
          OR player_code LIKE '%test%'
          OR player_code LIKE '%e2e%'
        )
    `;
    
    if (testTeams.length > 0) {
      console.error('❌ Found test salary cap teams:', testTeams.map(t => `${t.game_id}/${t.player_code}`));
    }
    
    assert.strictEqual(testTeams.length, 0, `Found ${testTeams.length} test salary cap team(s) - cleanup failed!`);
    console.log('✅ salary_cap_teams table: 0 test records');
  });
  
  it('should have ZERO test records in draft_teams table (DEPRECATED)', async () => {
    const testDraftTeams = await sql`
      SELECT game_id, player_code FROM draft_teams
      WHERE game_id != 'default'
        AND player_code != '311'
        AND (
          game_id LIKE '%test%'
          OR game_id LIKE '%e2e%'
          OR player_code LIKE '%test%'
          OR player_code LIKE '%e2e%'
        )
    `;
    
    if (testDraftTeams.length > 0) {
      console.error('❌ Found test draft teams:', testDraftTeams.map(t => `${t.game_id}/${t.player_code}`));
    }
    
    assert.strictEqual(testDraftTeams.length, 0, `Found ${testDraftTeams.length} test draft team(s) - cleanup failed!`);
    console.log('✅ draft_teams table: 0 test records');
  });
  
  it('should have ZERO test records in player_rankings table (DEPRECATED)', async () => {
    const testRankings = await sql`
      SELECT game_id, player_code FROM player_rankings
      WHERE game_id != 'default'
        AND player_code != '311'
        AND (
          game_id LIKE '%test%'
          OR game_id LIKE '%e2e%'
          OR player_code LIKE '%test%'
          OR player_code LIKE '%e2e%'
        )
    `;
    
    if (testRankings.length > 0) {
      console.error('❌ Found test rankings:', testRankings.map(r => `${r.game_id}/${r.player_code}`));
    }
    
    assert.strictEqual(testRankings.length, 0, `Found ${testRankings.length} test ranking(s) - cleanup failed!`);
    console.log('✅ player_rankings table: 0 test records');
  });
  
  it('should have ZERO test records in race_results table', async () => {
    const testResults = await sql`
      SELECT game_id FROM race_results
      WHERE game_id != 'default'
        AND (
          game_id LIKE '%test%'
          OR game_id LIKE '%e2e%'
          OR game_id LIKE '%integration%'
        )
    `;
    
    if (testResults.length > 0) {
      console.error('❌ Found test race results for games:', [...new Set(testResults.map(r => r.game_id))]);
    }
    
    assert.strictEqual(testResults.length, 0, `Found ${testResults.length} test race result(s) - cleanup failed!`);
    console.log('✅ race_results table: 0 test records');
  });
  
  it('should generate summary report', async () => {
    // Count all test records across all tables
    const allCounts = await Promise.all([
      sql`SELECT COUNT(*) as count FROM games WHERE game_id != 'default' AND game_id NOT IN ('production', 'live', 'prod') AND (game_id LIKE '%test%' OR game_id LIKE '%e2e%' OR game_id LIKE '%integration%')`,
      sql`SELECT COUNT(*) as count FROM anonymous_sessions WHERE player_code != '311' AND (player_code LIKE '%test%' OR player_code LIKE '%e2e%' OR display_name LIKE '%test%' OR display_name LIKE '%e2e%')`,
      sql`SELECT COUNT(*) as count FROM salary_cap_teams WHERE game_id != 'default' AND player_code != '311' AND (game_id LIKE '%test%' OR game_id LIKE '%e2e%' OR game_id LIKE '%integration%' OR player_code LIKE '%test%' OR player_code LIKE '%e2e%')`,
      sql`SELECT COUNT(*) as count FROM draft_teams WHERE game_id != 'default' AND player_code != '311' AND (game_id LIKE '%test%' OR game_id LIKE '%e2e%' OR player_code LIKE '%test%' OR player_code LIKE '%e2e%')`,
      sql`SELECT COUNT(*) as count FROM player_rankings WHERE game_id != 'default' AND player_code != '311' AND (game_id LIKE '%test%' OR game_id LIKE '%e2e%' OR player_code LIKE '%test%' OR player_code LIKE '%e2e%')`,
      sql`SELECT COUNT(*) as count FROM race_results WHERE game_id != 'default' AND (game_id LIKE '%test%' OR game_id LIKE '%e2e%' OR game_id LIKE '%integration%')`,
    ]);
    
    const totalTestRecords = allCounts.reduce((sum, result) => sum + parseInt(result[0].count), 0);
    
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ZERO POLLUTION AUDIT SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total test records found: ${totalTestRecords}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (totalTestRecords === 0) {
      console.log('✅ PASS: Database is clean - no test data pollution detected');
    } else {
      console.log('❌ FAIL: Test data pollution detected!');
      console.log('   → Review cleanup logic in failed tests');
      console.log('   → Ensure after() hooks are properly configured');
      console.log('   → Check that all created resources are tracked');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    assert.strictEqual(totalTestRecords, 0, 'Database pollution detected - tests are leaving behind data!');
  });
});

console.log('\n✨ Zero Pollution Audit complete!\n');
