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
      // Get all race results
      const result = await sql`
        SELECT * FROM race_results WHERE game_id = ${gameId}
      `;

      const results = {};
      result.rows.forEach(row => {
        results[row.athlete_id] = row.finish_time;
      });

      res.status(200).json(results);

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save race results
      const { results } = req.body;

      if (!results || typeof results !== 'object') {
        return res.status(400).json({ error: 'Results data is required' });
      }

      // Upsert each result
      for (const [athleteId, finishTime] of Object.entries(results)) {
        await sql`
          INSERT INTO race_results (game_id, athlete_id, finish_time)
          VALUES (${gameId}, ${parseInt(athleteId)}, ${finishTime})
          ON CONFLICT (game_id, athlete_id) 
          DO UPDATE SET 
            finish_time = ${finishTime},
            updated_at = CURRENT_TIMESTAMP
        `;
      }

      res.status(200).json({ message: 'Results saved successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: error.message });
  }
}
