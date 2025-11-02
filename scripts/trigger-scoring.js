#!/usr/bin/env node

/**
 * Trigger Scoring Engine to Re-score All Results
 * 
 * This will populate the finish_time_ms column from finish_time values
 * and recalculate all scores with proper sub-second precision.
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function triggerScoring() {
  console.log('🎯 Triggering scoring engine to re-score all results...');
  console.log('━'.repeat(60));
  
  try {
    // Get active race
    const [activeRace] = await sql`
      SELECT id, name FROM races WHERE is_active = true LIMIT 1
    `;
    
    if (!activeRace) {
      console.error('❌ No active race found');
      process.exit(1);
    }
    
    console.log(`📍 Active race: ${activeRace.name} (ID: ${activeRace.id})`);
    
    // Get all games with results
    const games = await sql`
      SELECT DISTINCT game_id
      FROM race_results
      WHERE finish_time IS NOT NULL
    `;
    
    console.log(`📊 Found ${games.length} game(s) with results\n`);
    
    // Import scoring function
    const { scoreRace } = await import('../pages/api/scoring-engine.js');
    
    // Re-score each game
    for (const game of games) {
      console.log(`⚙️  Scoring game: ${game.game_id}...`);
      await scoreRace(game.game_id, activeRace.id, 2);
      console.log(`   ✅ Game scored successfully`);
      
      // Verify what was actually stored
      const verify = await sql`
        SELECT athlete_id, finish_time, finish_time_ms, pg_typeof(finish_time_ms)::text as type
        FROM race_results
        WHERE game_id = ${game.game_id} AND finish_time IS NOT NULL
        ORDER BY finish_time LIMIT 3
      `;
      console.log(`   📊 Verification (first 3):`);
      verify.forEach(r => {
        console.log(`      • Athlete ${r.athlete_id}: time="${r.finish_time}" → ms=${r.finish_time_ms} (${r.type})`);
      });
    }
    
    console.log('\n━'.repeat(60));
    console.log('✅ All games re-scored successfully!');
    console.log('\n📋 Results:');
    console.log('   • finish_time_ms populated from finish_time');
    console.log('   • Placements recalculated with sub-second precision');
    console.log('   • Points updated for all athletes');
    
  } catch (error) {
    console.error('❌ Scoring failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

triggerScoring();
