import { neon } from '@neondatabase/serverless';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'POST') {
      const { athleteId, worldAthleticsId } = req.body;

      if (!athleteId) {
        return res.status(400).json({ error: 'athleteId is required' });
      }

      // Get athlete details
      const athlete = await sql`
        SELECT id, name, world_athletics_id, gender
        FROM athletes
        WHERE id = ${athleteId}
      `;

      if (athlete.length === 0) {
        return res.status(404).json({ error: 'Athlete not found' });
      }

      const athleteData = athlete[0];
      const waId = worldAthleticsId || athleteData.world_athletics_id;

      if (!waId) {
        return res.status(400).json({ 
          error: 'Cannot sync athlete without World Athletics ID',
          details: 'Please add a World Athletics ID first'
        });
      }

      console.log(`Manual sync requested for athlete ${athleteData.id} (${athleteData.name}) with WA_ID: ${waId}`);

      // Call Python script to sync the athlete
      const scriptPath = path.join(__dirname, '..', 'scripts', 'sync_athletes_from_rankings.py');
      const command = `python3 "${scriptPath}" --athlete-id "${waId}"`;
      
      console.log(`Executing: ${command}`);
      
      try {
        const { stdout, stderr } = await execAsync(command, {
          env: { ...process.env },
          timeout: 30000 // 30 second timeout
        });

        console.log('Python script output:', stdout);
        if (stderr) {
          console.error('Python script stderr:', stderr);
        }

        // Fetch the updated athlete data from database
        const result = await sql`
          SELECT 
            id, 
            name, 
            personal_best,
            marathon_rank,
            road_running_rank,
            age,
            date_of_birth,
            season_best,
            updated_at
          FROM athletes
          WHERE id = ${athleteId}
        `;
        
        const updatedAthlete = result[0];

        console.log(`Successfully synced athlete ${athleteData.name} via Python script`);

        res.status(200).json({
          message: 'Athlete synced successfully',
          athlete: {
            id: updatedAthlete.id,
            name: updatedAthlete.name,
            pb: updatedAthlete.personal_best,
            marathonRank: updatedAthlete.marathon_rank,
            roadRunningRank: updatedAthlete.road_running_rank,
            age: updatedAthlete.age,
            dateOfBirth: updatedAthlete.date_of_birth,
            seasonBest: updatedAthlete.season_best,
            updatedAt: updatedAthlete.updated_at
          }
        });

      } catch (execError) {
        console.error('Python script execution error:', execError);
        console.error('Error stack:', execError.stack);
        return res.status(500).json({ 
          error: 'Failed to sync athlete',
          details: execError.message,
          stderr: execError.stderr
        });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Sync athlete error:', error);
    res.status(500).json({ error: error.message });
  }
}
