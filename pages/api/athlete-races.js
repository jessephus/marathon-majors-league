import { neon } from '@neondatabase/serverless';

/**
 * Athlete-Races API
 * 
 * Manages the athlete_races junction table for race confirmations.
 * 
 * GET    - List confirmed athletes for a race
 * POST   - Confirm an athlete for a race
 * DELETE - Remove athlete confirmation from a race
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'GET') {
      // Get confirmed athletes for a race
      const { raceId } = req.query;

      if (!raceId) {
        return res.status(400).json({ error: 'raceId is required' });
      }

      const confirmations = await sql`
        SELECT 
          ar.id,
          ar.athlete_id,
          ar.race_id,
          ar.bib_number,
          ar.confirmed_at,
          a.name as athlete_name,
          a.country as athlete_country
        FROM athlete_races ar
        JOIN athletes a ON ar.athlete_id = a.id
        WHERE ar.race_id = ${raceId}
        ORDER BY a.name
      `;

      return res.status(200).json(confirmations);

    } else if (req.method === 'POST') {
      // Confirm an athlete for a race
      const { athleteId, raceId, bibNumber } = req.body;

      if (!athleteId || !raceId) {
        return res.status(400).json({ error: 'athleteId and raceId are required' });
      }

      // Check if athlete exists
      const athlete = await sql`
        SELECT id, name FROM athletes WHERE id = ${athleteId}
      `;

      if (athlete.length === 0) {
        return res.status(404).json({ error: 'Athlete not found' });
      }

      // Check if race exists
      const race = await sql`
        SELECT id, name FROM races WHERE id = ${raceId}
      `;

      if (race.length === 0) {
        return res.status(404).json({ error: 'Race not found' });
      }

      // Insert or update confirmation
      const result = await sql`
        INSERT INTO athlete_races (athlete_id, race_id, bib_number)
        VALUES (${athleteId}, ${raceId}, ${bibNumber || null})
        ON CONFLICT (athlete_id, race_id) 
        DO UPDATE SET bib_number = ${bibNumber || null}
        RETURNING *
      `;

      console.log(`Confirmed athlete ${athlete[0].name} for ${race[0].name}`);

      return res.status(200).json({
        success: true,
        message: `Athlete ${athlete[0].name} confirmed for ${race[0].name}`,
        confirmation: result[0]
      });

    } else if (req.method === 'DELETE') {
      // Remove athlete confirmation from a race
      const { athleteId, raceId } = req.query;

      if (!athleteId || !raceId) {
        return res.status(400).json({ error: 'athleteId and raceId are required' });
      }

      // Get athlete and race names for logging
      const athlete = await sql`
        SELECT name FROM athletes WHERE id = ${athleteId}
      `;

      const race = await sql`
        SELECT name FROM races WHERE id = ${raceId}
      `;

      // Delete confirmation
      const result = await sql`
        DELETE FROM athlete_races
        WHERE athlete_id = ${athleteId} AND race_id = ${raceId}
        RETURNING *
      `;

      if (result.length === 0) {
        return res.status(404).json({ 
          error: 'Confirmation not found',
          details: 'This athlete was not confirmed for this race'
        });
      }

      const athleteName = athlete.length > 0 ? athlete[0].name : 'Unknown athlete';
      const raceName = race.length > 0 ? race[0].name : 'Unknown race';

      console.log(`Removed confirmation for ${athleteName} from ${raceName}`);

      return res.status(200).json({
        success: true,
        message: `Removed ${athleteName} from ${raceName}`
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Athlete-Races API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}
