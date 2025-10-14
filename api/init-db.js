import { initializeDatabase, seedAthletes, getAllAthletes } from './db.js';
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
    
    // If table doesn't exist, create schema
    if (!tableExists) {
      console.log('Creating database schema...');
      
      try {
        // Read and execute schema.sql
        const schemaPath = join(process.cwd(), 'schema.sql');
        const schemaSQL = readFileSync(schemaPath, 'utf-8');
        
        // Execute the schema SQL - split into individual statements
        const statements = schemaSQL
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await sql(statement);
            } catch (error) {
              // Ignore "already exists" errors
              if (!error.message.includes('already exists')) {
                console.error('Schema execution error:', error.message);
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
          details: schemaError.message 
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
        
        message = 'Database initialized and athletes seeded successfully';
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
