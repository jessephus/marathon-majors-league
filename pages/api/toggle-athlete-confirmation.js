import { neon } from '@neondatabase/serverless';
import { getActiveRaceForGame } from './db.js';

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
      const { athleteId, confirmed, gameId = 'default' } = req.body;

      if (!athleteId) {
        return res.status(400).json({ error: 'athleteId is required' });
      }

      if (typeof confirmed !== 'boolean') {
        return res.status(400).json({ error: 'confirmed must be a boolean' });
      }

      // Get the active race for this specific game
      const race = await getActiveRaceForGame(gameId);

      if (!race) {
        return res.status(404).json({
          error: 'No active race found for this game',
          details: 'Please set an active race for this game first'
        });
      }

      if (confirmed) {
        // Add athlete to the race
        await sql`
          INSERT INTO athlete_races (athlete_id, race_id)
          VALUES (${athleteId}, ${race.id})
          ON CONFLICT (athlete_id, race_id) DO NOTHING
        `;
        console.log(`Confirmed athlete ${athleteId} for ${race.name}`);
      } else {
        // Remove athlete from the race
        await sql`
          DELETE FROM athlete_races
          WHERE athlete_id = ${athleteId} AND race_id = ${race.id}
        `;
        console.log(`Unconfirmed athlete ${athleteId} from ${race.name}`);
      }

      // Get updated athlete info
      const athleteResult = await sql`
        SELECT id, name FROM athletes WHERE id = ${athleteId}
      `;

      if (athleteResult.length === 0) {
        return res.status(404).json({ error: 'Athlete not found' });
      }

      res.status(200).json({
        message: confirmed
          ? `Athlete confirmed for ${race.name}`
          : `Athlete removed from ${race.name}`,
        athlete: {
          id: athleteResult[0].id,
          name: athleteResult[0].name,
          nycConfirmed: confirmed
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Toggle confirmation error:', error);
    res.status(500).json({ error: error.message });
  }
}
