import { neon } from '@neondatabase/serverless';
import { DEFAULT_GAME_ID } from '../../../config/constants';

const SALARY_CAP = 30000;

/**
 * Verify anonymous session and get session details
 */
async function verifySessionToken(sql, sessionToken) {
  try {
    const result = await sql`
      SELECT * FROM verify_anonymous_session(${sessionToken})
    `;
    
    if (!result || result.length === 0 || !result[0].is_valid) {
      return null;
    }
    
    return {
      teamName: result[0].display_name || result[0].player_code,
      displayName: result[0].display_name,
      playerCode: result[0].player_code,
      gameId: result[0].game_id
    };
  } catch (error) {
    console.error('Session verification error:', error);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const gameId = req.query.gameId || DEFAULT_GAME_ID;
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  const sql = neon(DATABASE_URL);

  try {
    console.log('[Partial-save] Request body:', JSON.stringify(req.body, null, 2));
    
    const { roster } = req.body;

    if (!roster || !Array.isArray(roster)) {
      console.error('[Partial-save] Invalid roster:', { roster, isArray: Array.isArray(roster) });
      return res.status(400).json({ error: 'Invalid roster data' });
    }

    // Get user from session token - REQUIRED
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Session token is required to save roster'
      });
    }

    const user = await verifySessionToken(sql, sessionToken);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Session expired or invalid',
        message: 'Your session has expired. Please create a new team to get a fresh session.',
        sessionExpired: true
      });
    }

    const playerCode = user.playerCode || user.displayName || 'anonymous';

    // Ensure table exists with is_complete column
    await sql`
      CREATE TABLE IF NOT EXISTS salary_cap_teams (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(255) NOT NULL,
        player_code VARCHAR(255) NOT NULL,
        athlete_id INTEGER NOT NULL REFERENCES athletes(id),
        gender VARCHAR(10) NOT NULL,
        total_spent INTEGER NOT NULL,
        is_complete BOOLEAN DEFAULT FALSE,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Check if this team has already been submitted as complete
    const existingTeam = await sql`
      SELECT DISTINCT is_complete
      FROM salary_cap_teams
      WHERE game_id = ${gameId} AND player_code = ${playerCode}
      LIMIT 1
    `;

    // If team has already been submitted as complete, don't auto-save
    if (existingTeam.length > 0 && existingTeam[0].is_complete) {
      return res.status(200).json({ 
        message: 'Team already submitted - auto-save disabled',
        autoSaveEnabled: false
      });
    }

    // Extract athletes from roster
    const men = roster
      .filter(slot => slot.slotId.startsWith('M') && slot.athleteId !== null)
      .map(slot => ({ id: slot.athleteId, salary: slot.salary }));
    
    const women = roster
      .filter(slot => slot.slotId.startsWith('W') && slot.athleteId !== null)
      .map(slot => ({ id: slot.athleteId, salary: slot.salary }));

    // Calculate total spent
    const totalSpent = roster.reduce((sum, slot) => sum + (slot.salary || 0), 0);

    // Validate budget (only if all slots are filled)
    if (men.length === 3 && women.length === 3 && totalSpent > SALARY_CAP) {
      return res.status(400).json({ 
        error: `Total salary ($${totalSpent}) exceeds cap ($${SALARY_CAP})`,
        totalSpent,
        salaryCap: SALARY_CAP
      });
    }

    // Delete existing partial team for this player
    await sql`
      DELETE FROM salary_cap_teams 
      WHERE game_id = ${gameId} 
        AND player_code = ${playerCode}
        AND is_complete = FALSE
    `;

    // Insert new partial team (only selected athletes)
    const allAthletes = [...men, ...women];
    
    for (const athlete of men) {
      await sql`
        INSERT INTO salary_cap_teams (game_id, player_code, athlete_id, gender, total_spent, is_complete)
        VALUES (${gameId}, ${playerCode}, ${athlete.id}, 'men', ${totalSpent}, FALSE)
      `;
    }

    for (const athlete of women) {
      await sql`
        INSERT INTO salary_cap_teams (game_id, player_code, athlete_id, gender, total_spent, is_complete)
        VALUES (${gameId}, ${playerCode}, ${athlete.id}, 'women', ${totalSpent}, FALSE)
      `;
    }

    res.status(200).json({ 
      message: 'Partial roster auto-saved',
      playerCode,
      athleteCount: allAthletes.length,
      totalSpent,
      autoSaveEnabled: true
    });

  } catch (error) {
    console.error('Partial save error:', error);
    res.status(500).json({ error: error.message });
  }
}
