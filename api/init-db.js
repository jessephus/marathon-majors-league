import { initializeDatabase, seedAthletes, getAllAthletes } from './db.js';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Test database connection
    const connectionTest = await initializeDatabase();
    
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
      athletesCount: athletesCount
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Make sure DATABASE_URL environment variable is set'
    });
  }
}
