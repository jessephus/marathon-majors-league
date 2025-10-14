import { getAllAthletes, seedAthletes } from './db.js';
import { readFileSync } from 'fs';
import { join } from 'path';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // Get all athletes from database
      let athletes = await getAllAthletes();
      
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
          athletes = await getAllAthletes();
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
