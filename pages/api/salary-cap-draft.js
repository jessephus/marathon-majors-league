import { neon } from '@neondatabase/serverless';
import { DEFAULT_GAME_ID } from '../../config/constants';

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

  const gameId = req.query.gameId || DEFAULT_GAME_ID;
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  const sql = neon(DATABASE_URL);

  try {
    if (req.method === 'GET') {
      // OPTIMIZED: Get all teams with their athletes in a single query
      // Using DISTINCT ON to avoid duplicates from salary_cap_teams rows
      // Only return complete rosters for display (not auto-saved partial rosters)
      const allTeamsData = await sql`
        SELECT DISTINCT
          asess.player_code,
          asess.display_name,
          asess.session_token,
          asess.is_active,
          asess.created_at,
          sct.athlete_id,
          a.name as athlete_name,
          a.country,
          a.gender,
          a.personal_best as pb,
          a.salary,
          a.marathon_rank,
          a.headshot_url,
          sct.gender as team_gender,
          sct.total_spent,
          sct.submitted_at,
          sct.is_complete
        FROM anonymous_sessions asess
        LEFT JOIN salary_cap_teams sct 
          ON sct.game_id = asess.game_id 
          AND sct.player_code = asess.player_code
        LEFT JOIN athletes a 
          ON a.id = sct.athlete_id
        WHERE asess.game_id = ${gameId}
          AND asess.session_type = 'player'
        ORDER BY asess.player_code, sct.athlete_id
      `;

      // Transform flat result set into nested team structure
      const teamDetails = {};
      
      for (const row of allTeamsData) {
        const playerCode = row.player_code;
        
        // Initialize team entry if not exists
        if (!teamDetails[playerCode]) {
          teamDetails[playerCode] = {
            men: [],
            women: [],
            totalSpent: row.total_spent || 0,
            submittedAt: row.submitted_at || null,
            displayName: row.display_name || null,
            sessionToken: row.session_token || null,
            hasSubmittedRoster: false,
            isActive: row.is_active !== false,  // Include active status
            isComplete: row.is_complete || false  // Track if roster is complete
          };
        }
        
        // Add athlete to team if they have one (deduplicate by athlete_id)
        if (row.athlete_id) {
          const athlete = {
            id: row.athlete_id,
            name: row.athlete_name,
            country: row.country,
            gender: row.gender,
            pb: row.pb,
            salary: row.salary,
            marathon_rank: row.marathon_rank,
            headshotUrl: row.headshot_url
          };
          
          if (row.team_gender === 'men') {
            // Check if athlete already exists in array (deduplicate)
            if (!teamDetails[playerCode].men.find(a => a.id === athlete.id)) {
              teamDetails[playerCode].men.push(athlete);
            }
          } else if (row.team_gender === 'women') {
            // Check if athlete already exists in array (deduplicate)
            if (!teamDetails[playerCode].women.find(a => a.id === athlete.id)) {
              teamDetails[playerCode].women.push(athlete);
            }
          }
          
          teamDetails[playerCode].hasSubmittedRoster = row.is_complete || false;
          
          // Update isComplete flag if we see any complete entry
          if (row.is_complete) {
            teamDetails[playerCode].isComplete = true;
          }
        }
      }

      res.status(200).json(teamDetails);

    } else if (req.method === 'POST') {
      // Submit salary cap team
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(req.body);
        } catch (error) {
          console.error('Salary cap draft body parse error:', error);
          return res.status(400).json({ error: 'Invalid JSON payload' });
        }
      }
      const { team, totalSpent, teamName } = body;

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
          is_complete BOOLEAN DEFAULT FALSE,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Delete ALL existing team entries for this player (both partial and complete)
      await sql`
        DELETE FROM salary_cap_teams 
        WHERE game_id = ${gameId} AND player_code = ${playerCode}
      `;

      // Insert new team with is_complete=TRUE
      for (const athlete of team.men) {
        await sql`
          INSERT INTO salary_cap_teams (game_id, player_code, athlete_id, gender, total_spent, is_complete)
          VALUES (${gameId}, ${playerCode}, ${athlete.id}, 'men', ${calculatedTotal}, TRUE)
        `;
      }

      for (const athlete of team.women) {
        await sql`
          INSERT INTO salary_cap_teams (game_id, player_code, athlete_id, gender, total_spent, is_complete)
          VALUES (${gameId}, ${playerCode}, ${athlete.id}, 'women', ${calculatedTotal}, TRUE)
        `;
      }

      // Update game state to mark salary cap draft as complete
      // AND add player to players array if not already present
      await sql`
        UPDATE games
        SET 
          draft_complete = TRUE,
          players = CASE 
            WHEN ${playerCode} = ANY(players) THEN players
            ELSE array_append(players, ${playerCode})
          END
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
