const fs = require('fs');
const { neon } = require('@neondatabase/serverless');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

// Read the migration file
const migration = fs.readFileSync('migrations/014_add_active_race_to_games.sql', 'utf8');

// Execute the migration
(async () => {
  try {
    console.log('Running migration 014_add_active_race_to_games.sql...');
    
    // Split and execute each statement separately
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s.length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (stmt) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        await sql.query(stmt);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    // Verify the column was added
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'games' AND column_name = 'active_race_id'
    `;
    
    if (result.length > 0) {
      console.log('✅ Verified: active_race_id column exists in games table');
      console.log('   Column type:', result[0].data_type);
    }
    
    // Check if any games were backfilled
    const games = await sql`SELECT game_id, active_race_id FROM games LIMIT 5`;
    console.log('\n📊 Sample games after migration:');
    games.forEach(g => console.log(`   - ${g.game_id}: active_race_id = ${g.active_race_id}`));
    
    // Check the active races
    const races = await sql`SELECT id, name, is_active FROM races WHERE is_active = true`;
    console.log('\n📍 Active races:');
    races.forEach(r => console.log(`   - Race ${r.id}: ${r.name}`));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
})();
