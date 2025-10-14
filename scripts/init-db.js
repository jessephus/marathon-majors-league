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
    console.log('ℹ️  DATABASE_URL environment variable is not set');
    console.log('ℹ️  This is expected during build - database will be initialized at runtime');
    console.log('✅ Skipping build-time initialization');
    return;
  }

  console.log('✅ DATABASE_URL found, proceeding with initialization...');

  try {
    const sql = neon(DATABASE_URL);
    
    // Check if athletes table exists
    let tableExists = true;
    try {
      await sql`SELECT 1 FROM athletes LIMIT 1`;
      console.log('✅ Athletes table exists');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        tableExists = false;
        console.log('ℹ️  Athletes table does not exist');
      } else {
        throw error;
      }
    }
    
    // If table doesn't exist, create schema
    if (!tableExists) {
      console.log('📋 Creating database schema...');
      
      // Read and execute schema.sql
      const schemaPath = join(__dirname, '..', 'schema.sql');
      const schemaSQL = readFileSync(schemaPath, 'utf-8');
      
      // Execute the schema SQL - split into individual statements
      // Remove comments first, then split by semicolons
      const cleanedSQL = schemaSQL
        .split('\n')
        .filter(line => !line.trim().startsWith('--'))
        .join('\n');
      
      const statements = cleanedSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
      
      console.log(`Executing ${statements.length} SQL statements...`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];
        if (statement.trim()) {
          try {
            await sql(statement);
          } catch (error) {
            // Ignore "already exists" errors
            if (!error.message.includes('already exists')) {
              console.error(`Schema execution error on statement ${i + 1}:`, error.message);
              throw error;
            }
          }
        }
      }
      
      console.log('✅ Database schema created successfully');
    }
    
    // Check if athletes table has data
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
