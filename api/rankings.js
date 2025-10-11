import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';
  const playerCode = req.query.playerCode;

  try {
    if (req.method === 'GET') {
      // Get rankings for a player or all players
      if (playerCode) {
        const result = await sql`
          SELECT * FROM player_rankings 
          WHERE game_id = ${gameId} AND player_code = ${playerCode}
        `;
        
        if (result.rows.length > 0) {
          res.status(200).json({
            men: result.rows[0].men_rankings,
            women: result.rows[0].women_rankings
          });
        } else {
          res.status(404).json({ error: 'Rankings not found' });
        }
      } else {
        const result = await sql`
          SELECT * FROM player_rankings WHERE game_id = ${gameId}
        `;
        
        const rankings = {};
        result.rows.forEach(row => {
          rankings[row.player_code] = {
            men: row.men_rankings,
            women: row.women_rankings
          };
        });
        
        res.status(200).json(rankings);
      }

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save or update rankings
      const { playerCode: bodyPlayerCode, men, women } = req.body;
      const code = bodyPlayerCode || playerCode;

      if (!code) {
        return res.status(400).json({ error: 'Player code is required' });
      }

      await sql`
        INSERT INTO player_rankings (game_id, player_code, men_rankings, women_rankings)
        VALUES (${gameId}, ${code}, ${JSON.stringify(men)}, ${JSON.stringify(women)})
        ON CONFLICT (game_id, player_code) 
        DO UPDATE SET 
          men_rankings = ${JSON.stringify(men)},
          women_rankings = ${JSON.stringify(women)},
          submitted_at = CURRENT_TIMESTAMP
      `;

      res.status(200).json({ message: 'Rankings saved successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Rankings error:', error);
    res.status(500).json({ error: error.message });
  }
}
