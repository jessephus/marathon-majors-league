import { neon } from '@neondatabase/serverless';

/**
 * Validate Team Roster API
 * 
 * Checks if a team's roster contains athletes who are no longer confirmed for the active race.
 * Returns list of invalid athletes (those not in athlete_races for the current race).
 * 
 * GET - Check roster validity for a session
 * Query params: sessionToken (required), gameId (optional, defaults to 'default')
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const { sessionToken, gameId = 'default' } = req.query;

    if (!sessionToken) {
      return res.status(400).json({ error: 'sessionToken is required' });
    }

    // 1. Get the session to verify it exists and is active
    const session = await sql`
      SELECT id, player_code, display_name, game_id, is_active
      FROM anonymous_sessions
      WHERE session_token = ${sessionToken}
      AND game_id = ${gameId}
      AND is_active = true
    `;

    if (session.length === 0) {
      return res.status(404).json({ 
        error: 'Session not found or inactive',
        valid: true,
        invalidAthletes: []
      });
    }

    const sessionId = session[0].id;

    // 2. Get the active race for this game
    const gameState = await sql`
      SELECT active_race_id
      FROM games
      WHERE game_id = ${gameId}
    `;

    if (gameState.length === 0 || !gameState[0].active_race_id) {
      // No active race, so no confirmations to check
      return res.status(200).json({
        valid: true,
        invalidAthletes: [],
        message: 'No active race configured'
      });
    }

    const activeRaceId = gameState[0].active_race_id;

    // 3. Get the team's roster from salary_cap_teams
  const roster = await sql`
    SELECT 
      sct.athlete_id,
      a.name as athlete_name,
      a.country,
      a.gender,
      a.personal_best,
      a.salary
    FROM salary_cap_teams sct
    JOIN athletes a ON sct.athlete_id = a.id
    WHERE sct.session_id = ${sessionId}
    AND sct.game_id = ${gameId}
  `;    if (roster.length === 0) {
      // No roster yet
      return res.status(200).json({
        valid: true,
        invalidAthletes: [],
        message: 'No roster found'
      });
    }

    // 4. Get confirmed athletes for the active race
    const confirmedAthletes = await sql`
      SELECT athlete_id
      FROM athlete_races
      WHERE race_id = ${activeRaceId}
    `;

    const confirmedAthleteIds = new Set(confirmedAthletes.map(c => c.athlete_id));

    // 5. Find athletes on roster who are NOT confirmed
    const invalidAthletes = roster.filter(athlete => 
      !confirmedAthleteIds.has(athlete.athlete_id)
    );

    // 6. Return validation result
    return res.status(200).json({
      valid: invalidAthletes.length === 0,
      invalidAthletes: invalidAthletes.map(a => ({
        id: a.athlete_id,
        name: a.athlete_name,
        country: a.country,
        gender: a.gender,
        personalBest: a.personal_best,
        salary: a.salary
      })),
      totalRosterSize: roster.length,
      invalidCount: invalidAthletes.length,
      activeRaceId: activeRaceId
    });

  } catch (error) {
    console.error('Error validating team roster:', error);
    return res.status(500).json({ 
      error: 'Failed to validate team roster',
      details: error.message 
    });
  }
}
