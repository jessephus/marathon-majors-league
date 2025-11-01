import { getRaceResults, saveRaceResults, hasCommissionerAccess } from './db';
import { scoreRace } from './scoring-engine';
import { neon } from '@neondatabase/serverless';
import { generateETag, setCacheHeaders, checkETag, send304 } from './lib/cache-utils.js';

const sql = neon(process.env.DATABASE_URL);

async function ensureResultsScored(gameId) {
  // Check if any recorded results are missing points or use legacy version
  const [status] = await sql`
    SELECT 
      COUNT(*) FILTER (WHERE finish_time IS NOT NULL) AS finished_count,
      COUNT(*) FILTER (WHERE finish_time IS NOT NULL AND total_points IS NOT NULL) AS scored_count,
      COUNT(*) FILTER (WHERE finish_time IS NOT NULL AND (total_points IS NULL OR points_version IS DISTINCT FROM 2)) AS needs_update
    FROM race_results
    WHERE game_id = ${gameId}
  `;

  if (!status) {
    return false;
  }

  const finishedCount = parseInt(status.finished_count ?? '0', 10);
  const needsUpdate = parseInt(status.needs_update ?? '0', 10);

  if (finishedCount === 0 || needsUpdate === 0) {
    return false;
  }

  const [activeRace] = await sql`
    SELECT id FROM races WHERE is_active = true LIMIT 1
  `;

  if (!activeRace) {
    return false;
  }

  try {
    await scoreRace(gameId, activeRace.id, 2);
    return true;
  } catch (error) {
    console.error('Auto-scoring on GET /api/results failed:', error);
    return false;
  }
}


export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
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
      // Quick check for existence only (used by salary-cap-draft to check if locked)
      if (req.query.checkOnly === 'true') {
        const [count] = await sql`
          SELECT COUNT(*) as count
          FROM race_results
          WHERE game_id = ${gameId} AND finish_time IS NOT NULL
        `;
        const hasResults = parseInt(count?.count || '0') > 0;
        return res.status(200).json({ hasResults });
      }
      
      // Get all race results with scoring data - no authentication required for viewing
      async function fetchResults() {
        return sql`
          SELECT 
            rr.athlete_id,
            rr.finish_time,
            rr.finish_time_ms,
            rr.split_5k,
            rr.split_10k,
            rr.split_half,
            rr.split_30k,
            rr.split_35k,
            rr.split_40k,
            rr.placement,
            rr.placement_points,
            rr.time_gap_seconds,
            rr.time_gap_points,
            rr.performance_bonus_points,
            rr.record_bonus_points,
            rr.total_points,
            rr.points_version,
            rr.breakdown,
            rr.record_type,
            rr.record_status,
            rr.updated_at,
            a.name AS athlete_name,
            a.country,
            a.gender,
            a.personal_best AS personal_best,
            a.headshot_url AS headshot_url
          FROM race_results rr
          LEFT JOIN athletes a ON rr.athlete_id = a.id
          WHERE rr.game_id = ${gameId}
          ORDER BY a.gender NULLS LAST, rr.placement NULLS LAST, rr.finish_time ASC
        `;
      }

      let results = await fetchResults();

      const rescored = await ensureResultsScored(gameId);
      if (rescored) {
        results = await fetchResults();
      }
      
      // Transform to legacy format for compatibility
      const legacyResults = {};
      results.forEach(r => {
        legacyResults[r.athlete_id] = r.finish_time;
      });
      
      // Generate ETag for caching
      const responseData = {
        results: legacyResults,
        scored: results
      };
      const etag = generateETag(responseData);
      
      // Set caching headers
      res.setHeader('ETag', `"${etag}"`);
      setCacheHeaders(res, {
        maxAge: 10,
        sMaxAge: 30,
        staleWhileRevalidate: 60,
      });
      
      // Check if client has current version
      if (checkETag(req, etag)) {
        return send304(res);
      }
      
      res.status(200).json(responseData);

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
    } else if (req.method === 'DELETE') {
      // Clear all results for this game - requires commissioner access
      if (!sessionToken) {
        return res.status(401).json({ 
          error: 'Unauthorized',
          message: 'Session token required to delete results'
        });
      }

      const hasAccess = await hasCommissionerAccess(gameId, sessionToken);
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only commissioners can delete race results'
        });
      }

      // Delete all results for this game
      await sql`
        DELETE FROM race_results
        WHERE game_id = ${gameId}
      `;

      res.status(200).json({ 
        message: 'All results cleared successfully'
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Results error:', error);
    res.status(500).json({ error: error.message });
  }
}
