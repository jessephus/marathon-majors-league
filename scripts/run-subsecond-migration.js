#!/usr/bin/env node

/**
 * Migration Runner: Add Sub-Second Precision to Race Times
 * 
 * This migration expands time columns from VARCHAR(10) to VARCHAR(13)
 * to support decimal seconds (e.g., "2:05:30.03" for close finishes).
 * 
 * Run this script to apply the migration to your database.
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('🚀 Starting Migration 007: Add Sub-Second Precision to Race Times');
  console.log('━'.repeat(60));
  
  try {
    // Read the migration file
    const migrationPath = join(__dirname, '..', 'migrations', '007_add_subsecond_precision.sql');
    const migrationSQL = await readFile(migrationPath, 'utf-8');
    
    console.log('📄 Migration file loaded successfully');
    console.log('📊 Executing SQL commands...\n');
    
    // Execute each ALTER TABLE command separately
    const commands = [
      sql`ALTER TABLE race_results ALTER COLUMN finish_time TYPE VARCHAR(13)`,
      sql`ALTER TABLE race_results ALTER COLUMN split_5k TYPE VARCHAR(13)`,
      sql`ALTER TABLE race_results ALTER COLUMN split_10k TYPE VARCHAR(13)`,
      sql`ALTER TABLE race_results ALTER COLUMN split_15k TYPE VARCHAR(13)`,
      sql`ALTER TABLE race_results ALTER COLUMN split_20k TYPE VARCHAR(13)`,
      sql`ALTER TABLE race_results ALTER COLUMN split_25k TYPE VARCHAR(13)`,
      sql`ALTER TABLE race_results ALTER COLUMN split_half TYPE VARCHAR(13)`,
      sql`ALTER TABLE race_results ALTER COLUMN split_30k TYPE VARCHAR(13)`,
      sql`ALTER TABLE race_results ALTER COLUMN split_35k TYPE VARCHAR(13)`,
      sql`ALTER TABLE race_results ALTER COLUMN split_40k TYPE VARCHAR(13)`
    ];
    
    // Execute all commands
    for (const command of commands) {
      await command;
    }
    
    console.log('✅ Migration completed successfully!');
    console.log('━'.repeat(60));
    console.log('\n📋 Changes applied:');
    console.log('   • finish_time: VARCHAR(10) → VARCHAR(13)');
    console.log('   • All split columns: VARCHAR(10) → VARCHAR(13)');
    console.log('\n🎯 New format support:');
    console.log('   • Whole seconds: "2:05:30" (still valid)');
    console.log('   • Hundredths: "2:05:30.12"');
    console.log('   • Milliseconds: "2:05:30.123"');
    console.log('\n⚠️  Next steps:');
    console.log('   1. Update frontend validation to accept decimals');
    console.log('   2. Test with close finishes (e.g., 0.03s difference)');
    console.log('   3. Verify time parsing handles decimal values');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nError details:', error);
    process.exit(1);
  }
}

runMigration();
