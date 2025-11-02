// Run migration 006: Add missing split columns
require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function runMigration() {
  console.log('🔧 Running migration 006: Adding missing split columns...\n');

  try {
    // Add the missing columns
    console.log('Adding split_15k, split_20k, split_25k columns...');
    
    await sql`
      ALTER TABLE race_results 
      ADD COLUMN IF NOT EXISTS split_15k VARCHAR(10),
      ADD COLUMN IF NOT EXISTS split_20k VARCHAR(10),
      ADD COLUMN IF NOT EXISTS split_25k VARCHAR(10)
    `;
    
    console.log('✅ Columns added successfully!\n');

    // Verify the columns exist
    console.log('Verifying columns...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'race_results' 
        AND column_name LIKE 'split_%'
      ORDER BY column_name
    `;

    console.log('\n📊 Current split columns in race_results:');
    columns.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });

    console.log('\n✅ Migration 006 completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
