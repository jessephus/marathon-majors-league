#!/usr/bin/env node

/**
 * Post-deployment script to initialize the database
 * This runs after Vercel deployment to ensure the database is seeded
 */

import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeDatabase() {
  console.log('🔄 Initializing database...');
  
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('ℹ️  Database initialization skipped (this is normal for local builds)');
    return;
  }

  try {
    const sql = neon(DATABASE_URL);
    
    // Check if athletes table exists and has data
    const athletes = await sql`
      SELECT COUNT(*) as count FROM athletes
    `;
    
    const count = parseInt(athletes[0].count);
    
    if (count > 0) {
      console.log(`✅ Database already initialized with ${count} athletes`);
      return;
    }
    
    console.log('📦 Database is empty, seeding athletes...');
    
    // Load athletes data
    const athletesPath = join(__dirname, '..', 'athletes.json');
    const athletesData = JSON.parse(readFileSync(athletesPath, 'utf-8'));
    
    // Seed men athletes
    for (const athlete of athletesData.men) {
      await sql`
        INSERT INTO athletes (id, name, country, gender, personal_best, headshot_url)
        VALUES (${athlete.id}, ${athlete.name}, ${athlete.country}, 'men', ${athlete.pb}, ${athlete.headshotUrl})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          country = EXCLUDED.country,
          personal_best = EXCLUDED.personal_best,
          headshot_url = EXCLUDED.headshot_url,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
    
    // Seed women athletes
    for (const athlete of athletesData.women) {
      await sql`
        INSERT INTO athletes (id, name, country, gender, personal_best, headshot_url)
        VALUES (${athlete.id}, ${athlete.name}, ${athlete.country}, 'women', ${athlete.pb}, ${athlete.headshotUrl})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          country = EXCLUDED.country,
          personal_best = EXCLUDED.personal_best,
          headshot_url = EXCLUDED.headshot_url,
          updated_at = CURRENT_TIMESTAMP
      `;
    }
    
    console.log(`✅ Successfully seeded ${athletesData.men.length + athletesData.women.length} athletes`);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('ℹ️  This is not critical - the app will auto-seed on first use');
  }
}

// Run initialization
initializeDatabase()
  .then(() => {
    console.log('✅ Database initialization complete');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Initialization script failed:', error);
    process.exit(0); // Exit with 0 to not fail the build
  });
