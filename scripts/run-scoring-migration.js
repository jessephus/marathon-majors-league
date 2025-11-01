#!/usr/bin/env node

/**
 * Run the points scoring migration
 */

import { readFileSync } from 'fs';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('🚀 Running Points Scoring System Migration (002)...\n');
  
  try {
    // Read the migration file
    const migrationSQL = readFileSync('./migrations/002_points_scoring_system.sql', 'utf8');
    
    // Split by statement (simple approach - split on semicolons outside of quotes)
    // For complex migrations, we'll execute the whole thing at once
    console.log('📝 Executing migration SQL...');
    
    // Execute the migration (neon supports multi-statement queries)
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying migration...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('scoring_rules', 'league_standings', 'records_audit', 'race_records')
      ORDER BY table_name
    `;
    
    console.log('✅ Tables created:');
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Check scoring rules
    const rules = await sql`SELECT version, description FROM scoring_rules ORDER BY version`;
    console.log('\n✅ Scoring rules loaded:');
    rules.forEach(r => console.log(`   - Version ${r.version}: ${r.description}`));
    
    // Check race records
    const records = await sql`SELECT COUNT(*) as count FROM race_records`;
    console.log(`\n✅ Race records seeded: ${records[0].count} records\n`);
    
    console.log('🎉 Migration complete! You can now use the points-based scoring system.\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

runMigration();
