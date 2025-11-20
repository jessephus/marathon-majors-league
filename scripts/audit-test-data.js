#!/usr/bin/env node

/**
 * Database Test Data Audit Script
 * 
 * Audits the database to identify test data that needs cleanup.
 * Does NOT delete anything - only generates a report.
 * 
 * Usage:
 *   node scripts/audit-test-data.js
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);

/**
 * Audit test data across all database tables
 */
async function auditTestData() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       Database Test Data Audit - READ ONLY                ║');
  console.log('║                                                            ║');
  console.log('║  This script identifies test data but does NOT delete it  ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const auditResults = {
    timestamp: new Date().toISOString(),
    tables: {},
    summary: {
      totalTestRecords: 0,
      tablesWithTestData: 0,
      recommendations: []
    }
  };

  try {
    // 1. Audit games table
    console.log('📊 Auditing games table...');
    const testGames = await sql`
      SELECT game_id, created_at, draft_complete, results_finalized, 
             array_length(players, 1) as player_count
      FROM games 
      WHERE game_id LIKE '%test%' 
         OR game_id LIKE '%e2e%' 
         OR game_id LIKE '%integration%'
      ORDER BY created_at DESC
    `;
    
    auditResults.tables.games = {
      totalTestRecords: testGames.length,
      patterns: {
        'test-%': testGames.filter(g => g.game_id.startsWith('test-')).length,
        'e2e-%': testGames.filter(g => g.game_id.startsWith('e2e-')).length,
        'integration-%': testGames.filter(g => g.game_id.startsWith('integration-')).length,
        'contains "test"': testGames.filter(g => g.game_id.includes('test') && !g.game_id.startsWith('test-')).length,
      },
      sampleRecords: testGames.slice(0, 10).map(g => ({
        game_id: g.game_id,
        created_at: g.created_at,
        player_count: g.player_count
      }))
    };
    console.log(`   Found ${testGames.length} test games`);

    // 2. Audit anonymous_sessions table
    console.log('📊 Auditing anonymous_sessions table...');
    const testSessions = await sql`
      SELECT id, session_token, session_type, display_name, game_id, 
             created_at, is_active, expires_at
      FROM anonymous_sessions 
      WHERE display_name LIKE '%Test%' 
         OR display_name LIKE '%test%'
         OR game_id LIKE '%test%'
         OR game_id LIKE '%e2e%'
         OR game_id LIKE '%integration%'
      ORDER BY created_at DESC
    `;
    
    auditResults.tables.anonymous_sessions = {
      totalTestRecords: testSessions.length,
      patterns: {
        'Test Team%': testSessions.filter(s => s.display_name?.startsWith('Test Team')).length,
        'Test%': testSessions.filter(s => s.display_name?.startsWith('Test') && !s.display_name?.startsWith('Test Team')).length,
        'test game_id': testSessions.filter(s => s.game_id?.includes('test')).length,
        'active': testSessions.filter(s => s.is_active).length,
        'inactive': testSessions.filter(s => !s.is_active).length,
      },
      sampleRecords: testSessions.slice(0, 10).map(s => ({
        display_name: s.display_name,
        game_id: s.game_id,
        session_type: s.session_type,
        is_active: s.is_active,
        created_at: s.created_at
      }))
    };
    console.log(`   Found ${testSessions.length} test sessions`);

    // 3. Audit salary_cap_teams table
    console.log('📊 Auditing salary_cap_teams table...');
    const testSalaryCapTeams = await sql`
      SELECT game_id, player_code, COUNT(*) as athlete_count, 
             MIN(submitted_at) as first_submission,
             BOOL_OR(is_complete) as is_complete
      FROM salary_cap_teams 
      WHERE game_id LIKE '%test%' 
         OR game_id LIKE '%e2e%' 
         OR game_id LIKE '%integration%'
         OR player_code LIKE '%Test%'
         OR player_code LIKE '%test%'
      GROUP BY game_id, player_code
      ORDER BY first_submission DESC
    `;
    
    auditResults.tables.salary_cap_teams = {
      totalTestRecords: testSalaryCapTeams.reduce((sum, t) => sum + parseInt(t.athlete_count), 0),
      uniqueTeams: testSalaryCapTeams.length,
      patterns: {
        'test game_id': testSalaryCapTeams.filter(t => t.game_id.includes('test')).length,
        'Test player_code': testSalaryCapTeams.filter(t => t.player_code?.includes('Test')).length,
      },
      sampleRecords: testSalaryCapTeams.slice(0, 10).map(t => ({
        game_id: t.game_id,
        player_code: t.player_code,
        athlete_count: parseInt(t.athlete_count),
        is_complete: t.is_complete
      }))
    };
    console.log(`   Found ${auditResults.tables.salary_cap_teams.totalTestRecords} test salary cap team entries`);

    // 4. Audit draft_teams table (DEPRECATED)
    console.log('📊 Auditing draft_teams table (DEPRECATED)...');
    const testDraftTeams = await sql`
      SELECT game_id, player_code, COUNT(*) as athlete_count,
             MIN(drafted_at) as first_draft
      FROM draft_teams 
      WHERE game_id LIKE '%test%' 
         OR game_id LIKE '%e2e%' 
         OR game_id LIKE '%integration%'
         OR player_code LIKE '%Test%'
         OR player_code LIKE '%test%'
      GROUP BY game_id, player_code
      ORDER BY first_draft DESC
    `;
    
    auditResults.tables.draft_teams = {
      totalTestRecords: testDraftTeams.reduce((sum, t) => sum + parseInt(t.athlete_count), 0),
      uniqueTeams: testDraftTeams.length,
      patterns: {
        'test game_id': testDraftTeams.filter(t => t.game_id.includes('test')).length,
        'Test player_code': testDraftTeams.filter(t => t.player_code?.includes('Test')).length,
      },
      sampleRecords: testDraftTeams.slice(0, 10).map(t => ({
        game_id: t.game_id,
        player_code: t.player_code,
        athlete_count: parseInt(t.athlete_count)
      }))
    };
    console.log(`   Found ${auditResults.tables.draft_teams.totalTestRecords} test draft team entries (DEPRECATED)`);

    // 5. Audit player_rankings table (DEPRECATED)
    console.log('📊 Auditing player_rankings table (DEPRECATED)...');
    const testRankings = await sql`
      SELECT game_id, player_code, COUNT(*) as ranking_count,
             MIN(submitted_at) as first_submission
      FROM player_rankings 
      WHERE game_id LIKE '%test%' 
         OR game_id LIKE '%e2e%' 
         OR game_id LIKE '%integration%'
         OR player_code LIKE '%Test%'
         OR player_code LIKE '%test%'
      GROUP BY game_id, player_code
      ORDER BY first_submission DESC
    `;
    
    auditResults.tables.player_rankings = {
      totalTestRecords: testRankings.reduce((sum, t) => sum + parseInt(t.ranking_count), 0),
      uniquePlayers: testRankings.length,
      patterns: {
        'test game_id': testRankings.filter(t => t.game_id.includes('test')).length,
        'Test player_code': testRankings.filter(t => t.player_code?.includes('Test')).length,
      },
      sampleRecords: testRankings.slice(0, 10).map(t => ({
        game_id: t.game_id,
        player_code: t.player_code,
        ranking_count: parseInt(t.ranking_count)
      }))
    };
    console.log(`   Found ${auditResults.tables.player_rankings.totalTestRecords} test ranking entries (DEPRECATED)`);

    // 6. Audit race_results table
    console.log('📊 Auditing race_results table...');
    const testResults = await sql`
      SELECT game_id, COUNT(*) as result_count,
             COUNT(CASE WHEN is_final THEN 1 END) as final_results,
             MIN(updated_at) as first_update
      FROM race_results 
      WHERE game_id LIKE '%test%' 
         OR game_id LIKE '%e2e%' 
         OR game_id LIKE '%integration%'
      GROUP BY game_id
      ORDER BY first_update DESC
    `;
    
    auditResults.tables.race_results = {
      totalTestRecords: testResults.reduce((sum, t) => sum + parseInt(t.result_count), 0),
      uniqueGames: testResults.length,
      patterns: {
        'test game_id': testResults.filter(t => t.game_id.includes('test')).length,
        'final results': testResults.reduce((sum, t) => sum + parseInt(t.final_results), 0),
      },
      sampleRecords: testResults.slice(0, 10).map(t => ({
        game_id: t.game_id,
        result_count: parseInt(t.result_count),
        final_results: parseInt(t.final_results)
      }))
    };
    console.log(`   Found ${auditResults.tables.race_results.totalTestRecords} test race result entries`);

    // 7. Audit athlete_progression table
    console.log('📊 Auditing athlete_progression table...');
    const testProgression = await sql`
      SELECT a.name as athlete_name, ap.discipline, ap.season, ap.mark
      FROM athlete_progression ap
      JOIN athletes a ON a.id = ap.athlete_id
      WHERE a.name LIKE '%Test%' 
         OR a.name LIKE '%test%'
      ORDER BY ap.created_at DESC
      LIMIT 50
    `;
    
    auditResults.tables.athlete_progression = {
      totalTestRecords: testProgression.length,
      patterns: {
        'Test athlete names': testProgression.length,
      },
      sampleRecords: testProgression.slice(0, 10).map(p => ({
        athlete_name: p.athlete_name,
        discipline: p.discipline,
        season: p.season
      }))
    };
    console.log(`   Found ${testProgression.length} test athlete progression entries`);

    // 8. Audit athlete_race_results table
    console.log('📊 Auditing athlete_race_results table...');
    const testAthleteRaceResults = await sql`
      SELECT a.name as athlete_name, arr.year, arr.competition_name, arr.position
      FROM athlete_race_results arr
      JOIN athletes a ON a.id = arr.athlete_id
      WHERE a.name LIKE '%Test%' 
         OR a.name LIKE '%test%'
         OR arr.competition_name LIKE '%Test%'
         OR arr.competition_name LIKE '%test%'
      ORDER BY arr.created_at DESC
      LIMIT 50
    `;
    
    auditResults.tables.athlete_race_results = {
      totalTestRecords: testAthleteRaceResults.length,
      patterns: {
        'Test athlete names': testAthleteRaceResults.filter(r => r.athlete_name?.includes('Test')).length,
        'Test competition names': testAthleteRaceResults.filter(r => r.competition_name?.includes('Test')).length,
      },
      sampleRecords: testAthleteRaceResults.slice(0, 10).map(r => ({
        athlete_name: r.athlete_name,
        competition_name: r.competition_name,
        year: r.year
      }))
    };
    console.log(`   Found ${testAthleteRaceResults.length} test athlete race result entries`);

    // 9. Audit athletes table (test athletes)
    console.log('📊 Auditing athletes table...');
    const testAthletes = await sql`
      SELECT id, name, country, gender, created_at
      FROM athletes 
      WHERE name LIKE '%Test%' 
         OR name LIKE '%test%'
      ORDER BY created_at DESC
    `;
    
    auditResults.tables.athletes = {
      totalTestRecords: testAthletes.length,
      patterns: {
        'Test in name': testAthletes.length,
      },
      sampleRecords: testAthletes.slice(0, 10).map(a => ({
        id: a.id,
        name: a.name,
        country: a.country,
        gender: a.gender
      }))
    };
    console.log(`   Found ${testAthletes.length} test athlete records`);

    // 10. Audit races table
    console.log('📊 Auditing races table...');
    const testRaces = await sql`
      SELECT id, name, date, location, is_active, created_at
      FROM races 
      WHERE name LIKE '%Test%' 
         OR name LIKE '%test%'
         OR location LIKE '%Test%'
         OR location LIKE '%test%'
      ORDER BY created_at DESC
    `;
    
    auditResults.tables.races = {
      totalTestRecords: testRaces.length,
      patterns: {
        'Test in name/location': testRaces.length,
      },
      sampleRecords: testRaces.slice(0, 10).map(r => ({
        id: r.id,
        name: r.name,
        location: r.location,
        is_active: r.is_active
      }))
    };
    console.log(`   Found ${testRaces.length} test race records`);

    // 11. Audit athlete_races table
    console.log('📊 Auditing athlete_races table...');
    const testAthleteRaces = await sql`
      SELECT ar.id, a.name as athlete_name, r.name as race_name, ar.bib_number
      FROM athlete_races ar
      JOIN athletes a ON a.id = ar.athlete_id
      JOIN races r ON r.id = ar.race_id
      WHERE a.name LIKE '%Test%' 
         OR a.name LIKE '%test%'
         OR r.name LIKE '%Test%'
         OR r.name LIKE '%test%'
      ORDER BY ar.confirmed_at DESC
      LIMIT 50
    `;
    
    auditResults.tables.athlete_races = {
      totalTestRecords: testAthleteRaces.length,
      patterns: {
        'Test athletes or races': testAthleteRaces.length,
      },
      sampleRecords: testAthleteRaces.slice(0, 10).map(ar => ({
        athlete_name: ar.athlete_name,
        race_name: ar.race_name,
        bib_number: ar.bib_number
      }))
    };
    console.log(`   Found ${testAthleteRaces.length} test athlete-race associations`);

    // Calculate summary
    auditResults.summary.totalTestRecords = Object.values(auditResults.tables)
      .reduce((sum, table) => sum + table.totalTestRecords, 0);
    
    auditResults.summary.tablesWithTestData = Object.values(auditResults.tables)
      .filter(table => table.totalTestRecords > 0).length;

    // Generate recommendations
    console.log('\n' + '='.repeat(64));
    console.log('📋 AUDIT SUMMARY');
    console.log('='.repeat(64));
    console.log(`Total test records found: ${auditResults.summary.totalTestRecords}`);
    console.log(`Tables with test data: ${auditResults.summary.tablesWithTestData} / ${Object.keys(auditResults.tables).length}`);
    console.log('');

    // Print table breakdown
    for (const [tableName, tableData] of Object.entries(auditResults.tables)) {
      if (tableData.totalTestRecords > 0) {
        console.log(`  • ${tableName}: ${tableData.totalTestRecords} records`);
      }
    }

    // Generate recommendations
    console.log('\n' + '='.repeat(64));
    console.log('💡 RECOMMENDATIONS');
    console.log('='.repeat(64));

    if (auditResults.tables.games.totalTestRecords > 0) {
      auditResults.summary.recommendations.push({
        table: 'games',
        action: 'Delete test games using existing cleanup script',
        records: auditResults.tables.games.totalTestRecords,
        command: 'node scripts/cleanup-test-data.js'
      });
      console.log(`✓ games: ${auditResults.tables.games.totalTestRecords} records`);
      console.log(`  → Already handled by scripts/cleanup-test-data.js`);
    }

    if (auditResults.tables.anonymous_sessions.totalTestRecords > 0) {
      auditResults.summary.recommendations.push({
        table: 'anonymous_sessions',
        action: 'Delete test sessions',
        records: auditResults.tables.anonymous_sessions.totalTestRecords,
        command: 'node scripts/cleanup-test-data.js'
      });
      console.log(`✓ anonymous_sessions: ${auditResults.tables.anonymous_sessions.totalTestRecords} records`);
      console.log(`  → Already handled by scripts/cleanup-test-data.js`);
    }

    if (auditResults.tables.salary_cap_teams.totalTestRecords > 0) {
      auditResults.summary.recommendations.push({
        table: 'salary_cap_teams',
        action: 'Delete test salary cap teams',
        records: auditResults.tables.salary_cap_teams.totalTestRecords,
        command: 'node scripts/cleanup-test-data.js'
      });
      console.log(`✓ salary_cap_teams: ${auditResults.tables.salary_cap_teams.totalTestRecords} records`);
      console.log(`  → Already handled by scripts/cleanup-test-data.js`);
    }

    if (auditResults.tables.athlete_progression.totalTestRecords > 0) {
      auditResults.summary.recommendations.push({
        table: 'athlete_progression',
        action: 'Add cleanup for test athlete progression data',
        records: auditResults.tables.athlete_progression.totalTestRecords,
        status: 'MISSING FROM CLEANUP SCRIPT'
      });
      console.log(`✗ athlete_progression: ${auditResults.tables.athlete_progression.totalTestRecords} records`);
      console.log(`  → NOT handled by cleanup script - NEEDS TO BE ADDED`);
    }

    if (auditResults.tables.athlete_race_results.totalTestRecords > 0) {
      auditResults.summary.recommendations.push({
        table: 'athlete_race_results',
        action: 'Add cleanup for test athlete race results',
        records: auditResults.tables.athlete_race_results.totalTestRecords,
        status: 'MISSING FROM CLEANUP SCRIPT'
      });
      console.log(`✗ athlete_race_results: ${auditResults.tables.athlete_race_results.totalTestRecords} records`);
      console.log(`  → NOT handled by cleanup script - NEEDS TO BE ADDED`);
    }

    if (auditResults.tables.athletes.totalTestRecords > 0) {
      auditResults.summary.recommendations.push({
        table: 'athletes',
        action: 'Add cleanup for test athletes',
        records: auditResults.tables.athletes.totalTestRecords,
        status: 'MISSING FROM CLEANUP SCRIPT'
      });
      console.log(`✗ athletes: ${auditResults.tables.athletes.totalTestRecords} records`);
      console.log(`  → NOT handled by cleanup script - NEEDS TO BE ADDED`);
    }

    if (auditResults.tables.races.totalTestRecords > 0) {
      auditResults.summary.recommendations.push({
        table: 'races',
        action: 'Add cleanup for test races',
        records: auditResults.tables.races.totalTestRecords,
        status: 'MISSING FROM CLEANUP SCRIPT'
      });
      console.log(`✗ races: ${auditResults.tables.races.totalTestRecords} records`);
      console.log(`  → NOT handled by cleanup script - NEEDS TO BE ADDED`);
    }

    if (auditResults.tables.athlete_races.totalTestRecords > 0) {
      auditResults.summary.recommendations.push({
        table: 'athlete_races',
        action: 'Add cleanup for test athlete-race associations',
        records: auditResults.tables.athlete_races.totalTestRecords,
        status: 'MISSING FROM CLEANUP SCRIPT'
      });
      console.log(`✗ athlete_races: ${auditResults.tables.athlete_races.totalTestRecords} records`);
      console.log(`  → NOT handled by cleanup script - NEEDS TO BE ADDED`);
    }

    // Save audit report to file
    const reportPath = './TEST_DATA_AUDIT_REPORT.json';
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
    
    console.log('\n' + '='.repeat(64));
    console.log(`✅ Audit complete! Report saved to: ${reportPath}`);
    console.log('='.repeat(64));
    console.log('');
    console.log('⚠️  This audit did NOT delete any data.');
    console.log('    Review the report and recommendations before proceeding with cleanup.');
    console.log('');

    return auditResults;

  } catch (error) {
    console.error('\n❌ Audit failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run audit if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  auditTestData()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export { auditTestData };
