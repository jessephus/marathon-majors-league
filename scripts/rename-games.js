import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function renameGames() {
  console.log('🎮 Starting game renaming process...\n');

  try {
    // Step 1: Check current state
    console.log('📊 Current game state:');
    const currentGames = await sql`
      SELECT game_id, 
             array_length(players, 1) as player_count,
             draft_complete,
             results_finalized,
             created_at
      FROM games 
      WHERE game_id IN ('default', 'demo-game')
      ORDER BY game_id
    `;
    
    console.table(currentGames);

    if (currentGames.length === 0) {
      console.log('❌ No games found with IDs "default" or "demo-game"');
      return;
    }

    const hasDefault = currentGames.some(g => g.game_id === 'default');
    const hasDemoGame = currentGames.some(g => g.game_id === 'demo-game');

    console.log('\n🔄 Executing rename operations...\n');

    // Step 2: Rename "default" to "NY2025"
    if (hasDefault) {
      console.log('1️⃣ Renaming "default" → "NY2025"');
      
      // Update games table
      await sql`
        UPDATE games 
        SET game_id = 'NY2025'
        WHERE game_id = 'default'
      `;
      console.log('   ✅ Updated games table');

      // Update related tables
      await sql`
        UPDATE player_rankings 
        SET game_id = 'NY2025'
        WHERE game_id = 'default'
      `;
      console.log('   ✅ Updated player_rankings table');

      await sql`
        UPDATE draft_teams 
        SET game_id = 'NY2025'
        WHERE game_id = 'default'
      `;
      console.log('   ✅ Updated draft_teams table');

      await sql`
        UPDATE race_results 
        SET game_id = 'NY2025'
        WHERE game_id = 'default'
      `;
      console.log('   ✅ Updated race_results table');

      await sql`
        UPDATE league_standings 
        SET game_id = 'NY2025'
        WHERE game_id = 'default'
      `;
      console.log('   ✅ Updated league_standings table');

      await sql`
        UPDATE user_games 
        SET game_id = 'NY2025'
        WHERE game_id = 'default'
      `;
      console.log('   ✅ Updated user_games table');

      console.log('   🎉 "default" successfully renamed to "NY2025"\n');
    } else {
      console.log('⚠️  No "default" game found, skipping rename\n');
    }

    // Step 3: Rename "demo-game" to "default"
    if (hasDemoGame) {
      console.log('2️⃣ Renaming "demo-game" → "default"');
      
      // Update games table
      await sql`
        UPDATE games 
        SET game_id = 'default'
        WHERE game_id = 'demo-game'
      `;
      console.log('   ✅ Updated games table');

      // Update related tables
      await sql`
        UPDATE player_rankings 
        SET game_id = 'default'
        WHERE game_id = 'demo-game'
      `;
      console.log('   ✅ Updated player_rankings table');

      await sql`
        UPDATE draft_teams 
        SET game_id = 'default'
        WHERE game_id = 'demo-game'
      `;
      console.log('   ✅ Updated draft_teams table');

      await sql`
        UPDATE race_results 
        SET game_id = 'default'
        WHERE game_id = 'demo-game'
      `;
      console.log('   ✅ Updated race_results table');

      await sql`
        UPDATE league_standings 
        SET game_id = 'default'
        WHERE game_id = 'demo-game'
      `;
      console.log('   ✅ Updated league_standings table');

      await sql`
        UPDATE user_games 
        SET game_id = 'default'
        WHERE game_id = 'demo-game'
      `;
      console.log('   ✅ Updated user_games table');

      console.log('   🎉 "demo-game" successfully renamed to "default"\n');
    } else {
      console.log('⚠️  No "demo-game" found, skipping rename\n');
    }

    // Step 4: Verify final state
    console.log('✨ Final game state:');
    const finalGames = await sql`
      SELECT game_id, 
             array_length(players, 1) as player_count,
             draft_complete,
             results_finalized,
             created_at
      FROM games 
      WHERE game_id IN ('default', 'NY2025')
      ORDER BY game_id
    `;
    
    console.table(finalGames);

    console.log('\n✅ Game renaming complete!');
    console.log('📝 Summary:');
    console.log('   • "default" → "NY2025" (memorialized NY 2025 Marathon)');
    console.log('   • "demo-game" → "default" (new default game)');

  } catch (error) {
    console.error('❌ Error during game renaming:', error);
    throw error;
  }
}

// Run the script
renameGames()
  .then(() => {
    console.log('\n🎊 Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
