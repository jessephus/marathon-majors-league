import { initializeDatabase, seedAthletes, getAllAthletes, seedNYMarathon2025 } from './db.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const DATABASE_URL = process.env.DATABASE_URL;
    
    if (!DATABASE_URL) {
      return res.status(500).json({ 
        error: 'DATABASE_URL not configured',
        details: 'Please add Neon Postgres integration to your Vercel project'
      });
    }
    
    const sql = neon(DATABASE_URL);
    
    // Test database connection
    const connectionTest = await initializeDatabase();
    
    // Check if athletes table exists
    let tableExists = true;
    try {
      await sql`SELECT 1 FROM athletes LIMIT 1`;
    } catch (error) {
      if (error.message.includes('does not exist')) {
        tableExists = false;
      } else {
        throw error;
      }
    }
    
    // If table exists, check for World Athletics columns and add them if missing
    if (tableExists) {
      console.log('Checking for World Athletics columns...');
      try {
        // Try to select the new columns
        await sql`SELECT world_athletics_id, overall_rank, age, sponsor, season_best FROM athletes LIMIT 1`;
        console.log('All extended columns already exist');
      } catch (error) {
        if (error.message.includes('does not exist') || error.message.includes('column')) {
          console.log('Adding missing columns...');
          try {
            // Add the World Athletics columns if missing
            await sql`ALTER TABLE athletes ADD COLUMN IF NOT EXISTS world_athletics_id VARCHAR(50)`;
            await sql`ALTER TABLE athletes ADD COLUMN IF NOT EXISTS world_athletics_profile_url TEXT`;
            await sql`ALTER TABLE athletes ADD COLUMN IF NOT EXISTS marathon_rank INTEGER`;
            await sql`ALTER TABLE athletes ADD COLUMN IF NOT EXISTS road_running_rank INTEGER`;
            
            // Add new extended columns
            await sql`ALTER TABLE athletes ADD COLUMN IF NOT EXISTS overall_rank INTEGER`;
            await sql`ALTER TABLE athletes ADD COLUMN IF NOT EXISTS age INTEGER`;
            await sql`ALTER TABLE athletes ADD COLUMN IF NOT EXISTS date_of_birth DATE`;
            await sql`ALTER TABLE athletes ADD COLUMN IF NOT EXISTS sponsor VARCHAR(255)`;
            await sql`ALTER TABLE athletes ADD COLUMN IF NOT EXISTS season_best VARCHAR(10)`;
            
            // Add indexes
            await sql`CREATE INDEX IF NOT EXISTS idx_athletes_wa_id ON athletes(world_athletics_id)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_athletes_marathon_rank ON athletes(marathon_rank)`;
            await sql`CREATE INDEX IF NOT EXISTS idx_athletes_overall_rank ON athletes(overall_rank)`;
            
            console.log('Extended columns added successfully');
          } catch (alterError) {
            console.error('Error adding columns:', alterError);
            // Don't fail - table still works without these columns
          }
        } else {
          throw error;
        }
      }
    }
    
    // If table doesn't exist, create schema
    if (!tableExists) {
      console.log('Creating database schema...');
      
      try {
        // Read and execute schema.sql
        const schemaPath = join(process.cwd(), 'schema.sql');
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
              // Use sql.query() for raw SQL strings
              await sql.query(statement);
            } catch (error) {
              // Ignore "already exists" errors
              if (!error.message.includes('already exists')) {
                console.error(`Schema execution error on statement ${i + 1}:`, error.message);
                throw error;
              }
            }
          }
        }
        
        console.log('Database schema created successfully');
      } catch (schemaError) {
        console.error('Schema creation error:', schemaError);
        return res.status(500).json({ 
          error: 'Failed to create database schema',
          details: schemaError.message,
          stack: schemaError.stack
        });
      }
    }
    
    // Check if athletes table is populated
    const athletes = await getAllAthletes();
    const athletesCount = athletes.men.length + athletes.women.length;
    
    let message = 'Neon Postgres database is ready';
    let needsSeeding = false;
    
    if (athletesCount === 0) {
      message = 'Database connected but athletes table is empty';
      needsSeeding = true;
    }
    
    // If POST request or athletes table is empty, seed the data
    if (req.method === 'POST' || needsSeeding) {
      try {
        // Load athletes.json from the project root
        const athletesPath = join(process.cwd(), 'athletes.json');
        const athletesData = JSON.parse(readFileSync(athletesPath, 'utf-8'));
        
        // Seed athletes into database
        await seedAthletes(athletesData);
        
        // Seed the 2025 NY Marathon race
        await seedNYMarathon2025();
        
        message = 'Database initialized, athletes seeded, and NY Marathon 2025 race created successfully';
      } catch (seedError) {
        console.error('Seeding error:', seedError);
        // Continue - database is connected even if seeding fails
        message = 'Database connected but seeding failed: ' + seedError.message;
      }
    }
    
    res.status(200).json({
      message,
      status: 'initialized',
      database: 'Neon Postgres',
      connectionTime: connectionTest.current_time,
      athletesCount: athletesCount,
      schemaExists: tableExists
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Make sure DATABASE_URL environment variable is set'
    });
  }
}
