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
      // Get game state
      const gameResult = await sql`
        SELECT * FROM game_state WHERE game_id = ${gameId}
      `;

      const rankingsResult = await sql`
        SELECT * FROM player_rankings WHERE game_id = ${gameId}
      `;

      const draftResult = await sql`
        SELECT * FROM draft_results WHERE game_id = ${gameId}
      `;

      const resultsResult = await sql`
        SELECT * FROM race_results WHERE game_id = ${gameId}
      `;

      const gameState = gameResult.rows[0] || { 
        game_id: gameId, 
        players: [], 
        draft_complete: false 
      };

      const rankings = {};
      rankingsResult.rows.forEach(row => {
        rankings[row.player_code] = {
          men: row.men_rankings,
          women: row.women_rankings
        };
      });

      const teams = {};
      draftResult.rows.forEach(row => {
        teams[row.player_code] = {
          men: row.men_team,
          women: row.women_team
        };
      });

      const results = {};
      resultsResult.rows.forEach(row => {
        results[row.athlete_id] = row.finish_time;
      });

      res.status(200).json({
        players: gameState.players,
        draftComplete: gameState.draft_complete,
        rankings,
        teams,
        results
      });

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Update game state
      const { players, draftComplete } = req.body;

      // Upsert game state
      if (players) {
        await sql`
          INSERT INTO game_state (game_id, players, draft_complete)
          VALUES (${gameId}, ${players}, ${draftComplete || false})
          ON CONFLICT (game_id) 
          DO UPDATE SET 
            players = ${players},
            draft_complete = ${draftComplete || false},
            updated_at = CURRENT_TIMESTAMP
        `;
      }

      res.status(200).json({ message: 'Game state updated successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Game state error:', error);
    res.status(500).json({ error: error.message });
  }
}
