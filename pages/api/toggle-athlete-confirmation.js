import { neon } from '@neondatabase/serverless';

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
      const { athleteId, confirmed } = req.body;

      if (!athleteId) {
        return res.status(400).json({ error: 'athleteId is required' });
      }

      if (typeof confirmed !== 'boolean') {
        return res.status(400).json({ error: 'confirmed must be a boolean' });
      }

      // Get the active race
      const activeRaces = await sql`
        SELECT id, name FROM races WHERE is_active = true LIMIT 1
      `;

      if (activeRaces.length === 0) {
        return res.status(404).json({
          error: 'No active race found',
          details: 'Please create an active race first'
        });
      }

      const race = activeRaces[0];

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
          ? 'Athlete confirmed for NYC Marathon'
          : 'Athlete unconfirmed from NYC Marathon',
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
