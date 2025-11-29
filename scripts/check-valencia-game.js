#!/usr/bin/env node
/**
 * Diagnostic script to check valencia-25 game in database
 * 
 * Usage: node scripts/check-valencia-game.js
 * 
 * This script checks:
 * 1. If valencia-25 game exists in games table
 * 2. If game has active_race_id set
 * 3. If the race exists in races table
 * 4. Tests the JOIN query used by getGameState()
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║  Valencia-25 Game Database Diagnostic                ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  
  try {
    // Step 1: Check if game exists
    console.log('📋 Step 1: Checking if valencia-25 game exists...\n');
    const games = await sql`
      SELECT game_id, active_race_id, roster_lock_time, draft_complete, results_finalized
      FROM games 
      WHERE game_id = 'valencia-25'
    `;
    
    if (games.length === 0) {
      console.log('❌ Game NOT FOUND in database!\n');
      console.log('📄 All games in database:');
      const allGames = await sql`SELECT game_id FROM games ORDER BY created_at DESC`;
      if (allGames.length === 0) {
        console.log('  (No games found)');
      } else {
        allGames.forEach(g => console.log(`  - ${g.game_id}`));
      }
      console.log('\n💡 Solution: Create valencia-25 game or update existing game.');
      return;
    }
    
    console.log('✅ Game exists!');
    console.log('   game_id:', games[0].game_id);
    console.log('   active_race_id:', games[0].active_race_id || '(NULL)');
    console.log('   roster_lock_time:', games[0].roster_lock_time || '(NULL)');
    console.log('   draft_complete:', games[0].draft_complete);
    console.log('   results_finalized:', games[0].results_finalized);
    console.log('');
    
    // Step 2: Check if active_race_id is set
    if (!games[0].active_race_id) {
      console.log('❌ active_race_id is NULL!\n');
      console.log('📄 All races in database:');
      const allRaces = await sql`
        SELECT id, name, date, location, is_active
        FROM races 
        ORDER BY date DESC
      `;
      if (allRaces.length === 0) {
        console.log('  (No races found)');
      } else {
        allRaces.forEach(r => {
          console.log(`  - [ID ${r.id}] ${r.name} (${r.date}) - ${r.is_active ? 'Active' : 'Inactive'}`);
        });
      }
      console.log('\n💡 Solution: Set active_race_id on valencia-25 game to a valid race ID.');
      return;
    }
    
    // Step 3: Check if race exists
    console.log('📋 Step 2: Checking if race exists...\n');
    const races = await sql`
      SELECT id, name, date, location, lock_time, is_active
      FROM races
      WHERE id = ${games[0].active_race_id}
    `;
    
    if (races.length === 0) {
      console.log(`❌ Race ID ${games[0].active_race_id} NOT FOUND in races table!\n`);
      console.log('📄 All races in database:');
      const allRaces = await sql`
        SELECT id, name, date, location, is_active
        FROM races 
        ORDER BY date DESC
      `;
      if (allRaces.length === 0) {
        console.log('  (No races found)');
      } else {
        allRaces.forEach(r => {
          console.log(`  - [ID ${r.id}] ${r.name} (${r.date}) - ${r.is_active ? 'Active' : 'Inactive'}`);
        });
      }
      console.log('\n💡 Solution: Create a race or update active_race_id to a valid race ID.');
      return;
    }
    
    console.log('✅ Race exists!');
    console.log('   id:', races[0].id);
    console.log('   name:', races[0].name);
    console.log('   date:', races[0].date);
    console.log('   location:', races[0].location);
    console.log('   lock_time:', races[0].lock_time || '(NULL)');
    console.log('   is_active:', races[0].is_active);
    console.log('');
    
    // Step 4: Test JOIN query (matches getGameState)
    console.log('📋 Step 3: Testing JOIN query (from getGameState)...\n');
    const joined = await sql`
      SELECT 
        g.game_id,
        g.active_race_id,
        g.roster_lock_time as game_roster_lock_time,
        r.name as race_name,
        r.date as race_date,
        r.location as race_location,
        r.lock_time as race_lock_time
      FROM games g
      LEFT JOIN races r ON g.active_race_id = r.id
      WHERE g.game_id = 'valencia-25'
    `;
    
    if (joined.length === 0) {
      console.log('❌ JOIN query returned no results!');
      return;
    }
    
    console.log('✅ JOIN query successful!');
    console.log('   game_id:', joined[0].game_id);
    console.log('   active_race_id:', joined[0].active_race_id);
    console.log('   game_roster_lock_time:', joined[0].game_roster_lock_time || '(NULL)');
    console.log('   race_name:', joined[0].race_name || '(NULL)');
    console.log('   race_date:', joined[0].race_date || '(NULL)');
    console.log('   race_location:', joined[0].race_location || '(NULL)');
    console.log('   race_lock_time:', joined[0].race_lock_time || '(NULL)');
    console.log('');
    
    // Step 5: Determine effective roster_lock_time
    const effectiveLockTime = joined[0].race_lock_time || joined[0].game_roster_lock_time;
    console.log('📋 Step 4: Effective roster_lock_time...\n');
    if (effectiveLockTime) {
      console.log('✅ Effective roster_lock_time:', effectiveLockTime);
      console.log('   Source:', joined[0].race_lock_time ? 'race.lock_time' : 'game.roster_lock_time');
    } else {
      console.log('⚠️  No roster_lock_time set (neither race nor game has lock time)');
      console.log('   This is OK if the race hasn\'t started yet.');
    }
    console.log('');
    
    // Summary
    console.log('╔═══════════════════════════════════════════════════════╗');
    console.log('║  Summary                                              ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    console.log('✅ valencia-25 game exists');
    console.log('✅ active_race_id is set:', games[0].active_race_id);
    console.log('✅ Race exists:', races[0].name);
    console.log('✅ JOIN query works');
    console.log('');
    console.log('🎯 Expected API Response:');
    console.log(JSON.stringify({
      draftComplete: games[0].draft_complete,
      resultsFinalized: games[0].results_finalized,
      rosterLockTime: effectiveLockTime,
      activeRaceId: games[0].active_race_id,
      activeRace: {
        id: races[0].id,
        name: races[0].name,
        date: races[0].date,
        location: races[0].location,
        roster_lock_time: races[0].lock_time
      }
    }, null, 2));
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
  }
}

main();
