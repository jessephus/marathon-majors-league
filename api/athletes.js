import { getAllAthletes, seedAthletes } from './db.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const DATABASE_URL = process.env.DATABASE_URL;
      
      if (!DATABASE_URL) {
        return res.status(500).json({ 
          error: 'DATABASE_URL not configured',
          details: 'Please add Neon Postgres integration to your Vercel project'
        });
      }
      
      const sql = neon(DATABASE_URL);
      
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
        console.log('Athletes table does not exist, creating schema...');
        
        try {
          // Read and execute schema.sql
          const schemaPath = join(process.cwd(), 'schema.sql');
          const schemaSQL = readFileSync(schemaPath, 'utf-8');
          
          // Execute the schema SQL - split into individual statements
          // Remove comments first, then split by semicolons that end statements
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
                console.log(`Executing statement ${i + 1}/${statements.length}...`);
                // Use sql.query() for raw SQL strings
                await sql.query(statement);
              } catch (error) {
                // Ignore "already exists" errors
                if (!error.message.includes('already exists')) {
                  console.error(`Schema execution error on statement ${i + 1}:`, error.message);
                  console.error('Failed statement:', statement.substring(0, 100) + '...');
                  throw error;
                }
              }
            }
          }
          
          console.log('Database schema created successfully');
        } catch (schemaError) {
          console.error('Schema creation error:', schemaError);
          return res.status(500).json({ 
            error: 'Database schema does not exist and auto-creation failed',
            details: schemaError.message,
            stack: schemaError.stack
          });
        }
      }
      
      // Check if confirmedOnly parameter is set (defaults to true for game pages)
      const confirmedOnly = req.query.confirmedOnly !== 'false';
      
      // Get all athletes from database
      let athletes = await getAllAthletes(confirmedOnly);
      
      // If database is empty, auto-seed it
      if ((!athletes.men || athletes.men.length === 0) && (!athletes.women || athletes.women.length === 0)) {
        console.log('Athletes table is empty, auto-seeding from athletes.json');
        
        try {
          // Load athletes.json from the project root
          const athletesPath = join(process.cwd(), 'athletes.json');
          const athletesData = JSON.parse(readFileSync(athletesPath, 'utf-8'));
          
          // Seed athletes into database
          await seedAthletes(athletesData);
          
          // Get athletes again after seeding
          athletes = await getAllAthletes(confirmedOnly);
          console.log('Auto-seeding successful');
        } catch (seedError) {
          console.error('Auto-seeding failed:', seedError);
          // Return error so frontend can fall back to static JSON
          return res.status(500).json({ 
            error: 'Database empty and auto-seeding failed',
            details: seedError.message 
          });
        }
      }
      
      res.status(200).json(athletes);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Athletes error:', error);
    res.status(500).json({ error: error.message });
  }
}
