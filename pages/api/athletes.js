import { getAllAthletes, getAthleteProfile, getGameState } from './db';
import { neon } from '@neondatabase/serverless';
import { generateETag, checkETag, send304 } from './lib/cache-utils.js';
import { DEFAULT_GAME_ID } from '../../config/constants';

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
      const confirmedOnly = req.query.confirmedOnly === 'true';
      
      // Get race ID from query params - can be explicit raceId or derived from gameId
      let raceId = req.query.raceId ? parseInt(req.query.raceId, 10) : null;
      const gameId = req.query.gameId || DEFAULT_GAME_ID;
      
      // If gameId is provided, get the active race for that game
      if (gameId && !raceId) {
        const gameState = await getGameState(gameId);
        if (gameState?.active_race_id) {
          raceId = gameState.active_race_id;
        }
      }
      
      // Check if requesting a specific athlete by ID
      const athleteId = req.query.id ? parseInt(req.query.id, 10) : null;
      
      // Check if requesting multiple athletes by IDs (comma-separated)
      const athleteIds = req.query.ids ? req.query.ids.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id)) : null;
      
      // If requesting multiple specific athletes, fetch them
      if (athleteIds && athleteIds.length > 0) {
        try {
          const athletes = await sql`
            SELECT 
              id, 
              name, 
              country, 
              gender, 
              personal_best as pb, 
              headshot_url as "headshotUrl",
              world_athletics_id as "worldAthleticsId",
              world_athletics_profile_url as "worldAthleticsProfileUrl",
              marathon_rank as "marathonRank",
              road_running_rank as "roadRunningRank",
              overall_rank as "overallRank",
              age,
              date_of_birth as "dateOfBirth",
              sponsor,
              salary,
              season_best as "seasonBest"
            FROM athletes 
            WHERE id = ANY(${athleteIds}::int[])
            ORDER BY gender DESC, marathon_rank ASC NULLS LAST, personal_best ASC NULLS LAST
          `;
          
          return res.status(200).json(athletes);
        } catch (error) {
          console.error('Error fetching athletes by IDs:', error);
          return res.status(500).json({ error: 'Failed to fetch athletes', details: error.message });
        }
      }
      
      // If requesting specific athlete, return profile with optional progression/results
      if (athleteId) {
        const includeProgression = req.query.include?.includes('progression') || req.query.progression === 'true';
        const includeResults = req.query.include?.includes('results') || req.query.results === 'true';
        const discipline = req.query.discipline || null;
        const year = req.query.year ? parseInt(req.query.year, 10) : null;
        
        const profile = await getAthleteProfile(athleteId, {
          includeProgression,
          includeResults,
          discipline,
          year
        });
        
        if (!profile) {
          return res.status(404).json({ error: 'Athlete not found' });
        }
        
        return res.status(200).json(profile);
      }
      
      // Otherwise, get all athletes from database
      // Pass raceId for confirmation filtering
      const athletes = await getAllAthletes(confirmedOnly, raceId);
      
      // Set cache headers for athlete data (stale-while-revalidate strategy)
      // Athletes change infrequently, so long cache with stale-while-revalidate
      // Cache busting: Client can add ?_t=timestamp to force fresh data after updates
      const etag = generateETag(athletes);
      res.setHeader('ETag', `"${etag}"`);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=7200, stale-while-revalidate=86400');
      res.setHeader('CDN-Cache-Control', 'max-age=7200');
      res.setHeader('Vary', 'Accept-Encoding');
      
      // Check if client has current version (also sets X-Cache-Status header)
      if (checkETag(req, etag, 'athletes', res)) {
        return send304(res);
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
