import { getRaceResults, saveRaceResults, hasCommissionerAccess } from './db';
import { scoreRace } from './scoring-engine';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';
  
  // Get session token from query parameter or Authorization header
  const sessionToken = req.query.session 
    || req.headers.authorization?.replace('Bearer ', '')
    || null;

  try {
    if (req.method === 'GET') {
      // Get all race results with scoring data - no authentication required for viewing
      const results = await sql`
        SELECT 
          rr.athlete_id,
          rr.finish_time,
          rr.split_5k,
          rr.split_10k,
          rr.split_half,
          rr.split_30k,
          rr.split_35k,
          rr.split_40k,
          rr.placement,
          rr.total_points,
          rr.breakdown,
          rr.record_type,
          rr.record_status
        FROM race_results rr
        WHERE rr.game_id = ${gameId}
      `;
      
      // Transform to legacy format for compatibility
      const legacyResults = {};
      results.forEach(r => {
        legacyResults[r.athlete_id] = r.finish_time;
      });
      
      res.status(200).json({
        results: legacyResults,
        scored: results
      });

    } else if (req.method === 'POST' || req.method === 'PUT') {
      // Verify commissioner access for results entry
      if (sessionToken) {
        const hasAccess = await hasCommissionerAccess(gameId, sessionToken);
        if (!hasAccess) {
          return res.status(403).json({ 
            error: 'Forbidden',
            message: 'Only commissioners can enter race results'
          });
        }
      }
      
      // Save race results
      const body = req.body || {};
      const autoScore = body.autoScore ?? body.autoscore ?? body.auto_score;
      const usingFallbackPayload = body.results === undefined;
      let resultsPayload = body.results ?? body;

      if (!resultsPayload || typeof resultsPayload !== 'object' || Array.isArray(resultsPayload)) {
        return res.status(400).json({ error: 'Results data is required' });
      }

      if (usingFallbackPayload) {
        const { autoScore: legacyAutoScore, autoscore, auto_score, ...rest } = resultsPayload;
        resultsPayload = rest;
      }

      if (Object.keys(resultsPayload).length === 0) {
        return res.status(400).json({ error: 'Results data is required' });
      }

      // Save results
      await saveRaceResults(gameId, resultsPayload);
      
      // Automatically trigger scoring if requested (default: true)
      let scoringResult = null;
      if (autoScore !== false) {
        try {
          // Get active race
          const [activeRace] = await sql`
            SELECT id FROM races WHERE is_active = true LIMIT 1
          `;
          
          if (activeRace) {
            scoringResult = await scoreRace(gameId, activeRace.id, 2);
          }
        } catch (scoringError) {
          console.error('Auto-scoring failed:', scoringError);
          // Don't fail the request if scoring fails
        }
      }

      res.status(200).json({ 
        message: 'Results saved successfully',
        scoring: scoringResult ? 'completed' : 'skipped',
        scoringDetails: scoringResult
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: error.message });
  }
}
