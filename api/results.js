import { getRaceResults, saveRaceResults } from './db.js';

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
      const results = await getRaceResults(gameId);
      res.status(200).json(results);

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Save race results
      const { results } = req.body;

      if (!results || typeof results !== 'object') {
        return res.status(400).json({ error: 'Results data is required' });
      }

      // Save results
      await saveRaceResults(gameId, results);

      res.status(200).json({ message: 'Results saved successfully' });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: error.message });
  }
}
