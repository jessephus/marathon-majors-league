#!/usr/bin/env node

/**
 * Run the roster lock time migration
 * Adds roster_lock_time field to games table and sets it for the default game
 */

import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment variables from .env.local
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('🚀 Running Roster Lock Time Migration (005)...\n');
  
  try {
    // Read the migration file
    const migrationSQL = readFileSync('./migrations/005_roster_lock_time.sql', 'utf8');
    
    console.log('📝 Executing migration SQL...');
    
    // Execute the migration
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify the column was added
    console.log('🔍 Verifying migration...');
    
    const columns = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'games' AND column_name = 'roster_lock_time'
    `;
    
    if (columns.length > 0) {
      console.log('✅ Column added:');
      columns.forEach(c => console.log(`   - ${c.column_name} (${c.data_type})`));
    } else {
      throw new Error('Column roster_lock_time was not added to games table');
    }
    
    // Check if default game has roster lock time set
    const defaultGame = await sql`
      SELECT game_id, roster_lock_time 
      FROM games 
      WHERE game_id = 'default'
    `;
    
    if (defaultGame.length > 0) {
      console.log('\n✅ Default game roster lock time:');
      console.log(`   - Game ID: ${defaultGame[0].game_id}`);
      if (defaultGame[0].roster_lock_time) {
        const lockTime = new Date(defaultGame[0].roster_lock_time);
        console.log(`   - Lock Time: ${lockTime.toLocaleString('en-US', { 
          timeZone: 'America/New_York',
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          timeZoneName: 'short'
        })}`);
      } else {
        console.log(`   - Lock Time: Not set`);
      }
    } else {
      console.log('\n⚠️  Default game does not exist yet. Lock time will be set when game is created.');
    }
    
    console.log('\n🎉 Migration complete! Rosters will lock at 8:35am EST on November 2, 2025.\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
