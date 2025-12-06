import { neon } from '@neondatabase/serverless';

/**
 * Validate Roster Athletes API
 * 
 * Checks if specific athletes are confirmed for the active race.
 * Returns array of athlete IDs that are NOT confirmed.
 * 
 * POST - Validate specific athletes in a roster
 * Body: { athleteIds: number[], gameId: string }
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { athleteIds, gameId = 'default' } = req.body;

    if (!athleteIds || !Array.isArray(athleteIds)) {
      return res.status(400).json({ error: 'athleteIds array is required' });
    }

    if (athleteIds.length === 0) {
      return res.status(200).json({ invalidAthleteIds: [] });
    }

    // 1. Get the active race for this game
    const gameState = await sql`
      SELECT active_race_id
      FROM games
      WHERE game_id = ${gameId}
    `;

    if (gameState.length === 0 || !gameState[0].active_race_id) {
      // No active race - all athletes are considered invalid (no confirmation possible)
      return res.status(200).json({
        invalidAthleteIds: athleteIds.map(id => String(id))
      });
    }

    const activeRaceId = gameState[0].active_race_id;

    // 2. Get confirmed athletes for the active race
    const confirmedAthletes = await sql`
      SELECT athlete_id
      FROM athlete_races
      WHERE race_id = ${activeRaceId}
    `;

    const confirmedAthleteIds = new Set(
      confirmedAthletes.map(c => c.athlete_id)
    );

    // 3. Find athletes that are NOT confirmed
    const invalidAthleteIds = athleteIds.filter(id => 
      !confirmedAthleteIds.has(id)
    );

    // 4. Return validation result
    return res.status(200).json({
      invalidAthleteIds: invalidAthleteIds.map(id => String(id)),
      totalChecked: athleteIds.length,
      invalidCount: invalidAthleteIds.length,
      activeRaceId: activeRaceId
    });

  } catch (error) {
    console.error('Error validating roster athletes:', error);
    return res.status(500).json({ 
      error: 'Failed to validate roster',
      details: error.message 
    });
  }
}
