import { neon } from '@neondatabase/serverless';

const SALARY_CAP = 30000;
const TEAM_SIZE = 6;

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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  const sql = neon(DATABASE_URL);

  try {
    if (req.method === 'GET') {
      // Get salary cap draft teams for a game
      const teams = await sql`
        SELECT DISTINCT ON (player_code) 
          player_code,
          total_spent,
          submitted_at
        FROM salary_cap_teams
        WHERE game_id = ${gameId}
        ORDER BY player_code, submitted_at DESC
      `;

      // Get team details for each player
      const teamDetails = {};
      for (const team of teams) {
        const athletes = await sql`
          SELECT 
            a.id, a.name, a.country, a.gender, a.personal_best as pb,
            a.salary, a.marathon_rank, a.headshot_url,
            sct.gender as team_gender
          FROM salary_cap_teams sct
          JOIN athletes a ON a.id = sct.athlete_id
          WHERE sct.game_id = ${gameId} 
            AND sct.player_code = ${team.player_code}
          ORDER BY sct.id
        `;

        teamDetails[team.player_code] = {
          men: athletes.filter(a => a.team_gender === 'men'),
          women: athletes.filter(a => a.team_gender === 'women'),
          totalSpent: team.total_spent,
          submittedAt: team.submitted_at
        };
      }

      res.status(200).json(teamDetails);

    } else if (req.method === 'POST') {
      // Submit salary cap team
      const { team, totalSpent, teamName } = req.body;

      if (!team || !team.men || !team.women) {
        return res.status(400).json({ error: 'Invalid team data' });
      }

      // Validate team composition
      if (team.men.length !== 3 || team.women.length !== 3) {
        return res.status(400).json({ 
          error: 'Team must have exactly 3 men and 3 women' 
        });
      }

      // Validate salary cap
      let calculatedTotal = 0;
      const allAthletes = [...team.men, ...team.women];
      
      for (const athlete of allAthletes) {
        const dbAthlete = await sql`
          SELECT id, salary FROM athletes WHERE id = ${athlete.id}
        `;
        
        if (!dbAthlete || dbAthlete.length === 0) {
          return res.status(400).json({ 
            error: `Invalid athlete ID: ${athlete.id}` 
          });
        }
        
        calculatedTotal += dbAthlete[0].salary || 5000;
      }

      if (calculatedTotal > SALARY_CAP) {
        return res.status(400).json({ 
          error: `Total salary ($${calculatedTotal}) exceeds cap ($${SALARY_CAP})`,
          calculatedTotal,
          salaryCap: SALARY_CAP
        });
      }

      // Get user from session token - REQUIRED
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      
      if (!sessionToken) {
        return res.status(401).json({ 
          error: 'Authentication required',
          message: 'Session token is required to submit a team'
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

      const playerCode = user.teamName || user.displayName || teamName || 'anonymous';

      // Create table if it doesn't exist
      await sql`
        CREATE TABLE IF NOT EXISTS salary_cap_teams (
          id SERIAL PRIMARY KEY,
          game_id VARCHAR(255) NOT NULL,
          player_code VARCHAR(255) NOT NULL,
          athlete_id INTEGER NOT NULL REFERENCES athletes(id),
          gender VARCHAR(10) NOT NULL,
          total_spent INTEGER NOT NULL,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Delete existing team for this player
      await sql`
        DELETE FROM salary_cap_teams 
        WHERE game_id = ${gameId} AND player_code = ${playerCode}
      `;

      // Insert new team
      for (const athlete of team.men) {
        await sql`
          INSERT INTO salary_cap_teams (game_id, player_code, athlete_id, gender, total_spent)
          VALUES (${gameId}, ${playerCode}, ${athlete.id}, 'men', ${calculatedTotal})
        `;
      }

      for (const athlete of team.women) {
        await sql`
          INSERT INTO salary_cap_teams (game_id, player_code, athlete_id, gender, total_spent)
          VALUES (${gameId}, ${playerCode}, ${athlete.id}, 'women', ${calculatedTotal})
        `;
      }

      // Update game state to mark salary cap draft as complete
      await sql`
        UPDATE games
        SET draft_complete = TRUE
        WHERE game_id = ${gameId}
      `;

      res.status(200).json({ 
        message: 'Team submitted successfully',
        playerCode,
        totalSpent: calculatedTotal,
        salaryCap: SALARY_CAP,
        remaining: SALARY_CAP - calculatedTotal
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Salary cap draft error:', error);
    res.status(500).json({ error: error.message });
  }
}
