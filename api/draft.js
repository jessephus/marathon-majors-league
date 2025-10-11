import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';

  try {
    if (req.method === 'GET') {
      // Get draft results
      const result = await sql`
        SELECT * FROM draft_results WHERE game_id = ${gameId}
      `;

      const teams = {};
      result.rows.forEach(row => {
        teams[row.player_code] = {
          men: row.men_team,
          women: row.women_team
        };
      });

      res.status(200).json(teams);

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save draft results
      const { teams } = req.body;

      if (!teams || typeof teams !== 'object') {
        return res.status(400).json({ error: 'Teams data is required' });
      }

      // Delete existing draft results for this game
      await sql`DELETE FROM draft_results WHERE game_id = ${gameId}`;

      // Insert new draft results
      for (const [playerCode, team] of Object.entries(teams)) {
        await sql`
          INSERT INTO draft_results (game_id, player_code, men_team, women_team)
          VALUES (
            ${gameId}, 
            ${playerCode}, 
            ${JSON.stringify(team.men)}, 
            ${JSON.stringify(team.women)}
          )
        `;
      }

      // Mark draft as complete in game state
      await sql`
        UPDATE game_state 
        SET draft_complete = true, updated_at = CURRENT_TIMESTAMP
        WHERE game_id = ${gameId}
      `;

      res.status(200).json({ message: 'Draft results saved successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Draft error:', error);
    res.status(500).json({ error: error.message });
  }
}
