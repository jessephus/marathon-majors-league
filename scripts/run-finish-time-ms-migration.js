#!/usr/bin/env node

/**
 * Migration Runner: Add finish_time_ms Column
 * 
 * Adds a BIGINT column to store finish times in milliseconds for precise sorting.
 * This is critical for breaking ties when runners finish within milliseconds.
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('🚀 Starting Migration 008: Add finish_time_ms Column');
  console.log('━'.repeat(60));
  
  try {
    console.log('📊 Adding finish_time_ms column...\n');
    
    // Add the column
    await sql`
      ALTER TABLE race_results
      ADD COLUMN IF NOT EXISTS finish_time_ms BIGINT
    `;
    
    console.log('✅ Column added successfully!');
    
    // Add index
    console.log('📊 Creating index for performance...\n');
    await sql`
      CREATE INDEX IF NOT EXISTS idx_results_finish_time_ms 
      ON race_results(game_id, finish_time_ms)
    `;
    
    console.log('✅ Index created successfully!');
    console.log('━'.repeat(60));
    console.log('\n📋 Migration completed!');
    console.log('\n⚠️  Next step:');
    console.log('   Trigger scoring engine to populate finish_time_ms from finish_time');
    console.log('   The scoring engine will auto-convert "2:08:09.03" → 7,689,030 ms');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

runMigration();
