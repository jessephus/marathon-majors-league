/**
 * Scoring API - Handles score calculation and recalculation
 */

import { scoreRace } from './scoring-engine';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function ensureResultsScored(gameId) {
  const [status] = await sql`
    SELECT 
      COUNT(*) FILTER (WHERE finish_time IS NOT NULL) AS finished_count,
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

  await scoreRace(gameId, activeRace.id, 2);
  return true;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const gameId = req.query.gameId || 'default';
  const action = req.query.action || 'calculate';

  try {
    if (req.method === 'GET') {
      await ensureResultsScored(gameId).catch(err => {
        console.error('Auto-scoring on GET /api/scoring failed:', err);
      });

      // Get current scoring version and results
      const results = await sql`
        SELECT 
          rr.athlete_id,
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
          a.name as athlete_name,
          a.gender
        FROM race_results rr
        JOIN athletes a ON rr.athlete_id = a.id
        WHERE rr.game_id = ${gameId}
        ORDER BY rr.total_points DESC, rr.placement ASC
      `;

      res.status(200).json({
        gameId,
        resultsCount: results.length,
        results: results
      });

    } else if (req.method === 'POST') {
      // Calculate or recalculate scores
      
      if (action === 'calculate' || action === 'recalculate') {
        const { raceId, rulesVersion } = req.body;
        
        // Get active race if not specified
        let targetRaceId = raceId;
        if (!targetRaceId) {
          const [activeRace] = await sql`
            SELECT id FROM races WHERE is_active = true LIMIT 1
          `;
          if (!activeRace) {
            return res.status(400).json({ error: 'No active race found' });
          }
          targetRaceId = activeRace.id;
        }
        
        // Run scoring algorithm
        const version = rulesVersion || 2;
        const result = await scoreRace(gameId, targetRaceId, version);
        
        res.status(200).json(result);
        
      } else if (action === 'confirm-record') {
        // Confirm a provisional record
        const { resultId, recordType } = req.body;
        
        if (!resultId || !recordType) {
          return res.status(400).json({ 
            error: 'resultId and recordType are required' 
          });
        }
        
        // Get current result
        const [result] = await sql`
          SELECT * FROM race_results WHERE id = ${resultId}
        `;
        
        if (!result) {
          return res.status(404).json({ error: 'Result not found' });
        }
        
        if (result.record_status !== 'provisional') {
          return res.status(400).json({ 
            error: 'Can only confirm provisional records' 
          });
        }
        
        // Get scoring rules to determine points
        const [rulesData] = await sql`
          SELECT rules FROM scoring_rules WHERE version = ${result.points_version}
        `;
        const rules = rulesData.rules;
        
        // Calculate points to add
        const recordConfig = recordType === 'WORLD' 
          ? rules.record_bonuses.WorldRecord 
          : rules.record_bonuses.CourseRecord;
        
        const pointsToAdd = recordConfig.points;
        
        // Update result
        await sql`
          UPDATE race_results
          SET 
            record_status = 'confirmed',
            record_bonus_points = record_bonus_points + ${pointsToAdd},
            total_points = total_points + ${pointsToAdd},
            record_confirmed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${resultId}
        `;
        
        // Log in audit table
        await sql`
          INSERT INTO records_audit 
            (race_result_id, game_id, athlete_id, record_type, status_before, status_after, points_delta, changed_by)
          VALUES 
            (${resultId}, ${gameId}, ${result.athlete_id}, ${recordType}, 'provisional', 'confirmed', ${pointsToAdd}, 'api')
        `;
        
        res.status(200).json({
          message: 'Record confirmed successfully',
          resultId,
          pointsAdded: pointsToAdd
        });
        
      } else if (action === 'reject-record') {
        // Reject a provisional record
        const { resultId, recordType } = req.body;
        
        if (!resultId || !recordType) {
          return res.status(400).json({ 
            error: 'resultId and recordType are required' 
          });
        }
        
        // Get current result
        const [result] = await sql`
          SELECT * FROM race_results WHERE id = ${resultId}
        `;
        
        if (!result) {
          return res.status(404).json({ error: 'Result not found' });
        }
        
        if (result.record_status !== 'provisional') {
          return res.status(400).json({ 
            error: 'Can only reject provisional records' 
          });
        }
        
        // If points were awarded provisionally, subtract them
        const pointsToSubtract = result.record_bonus_points;
        
        // Update result
        await sql`
          UPDATE race_results
          SET 
            record_status = 'rejected',
            record_bonus_points = 0,
            total_points = total_points - ${pointsToSubtract},
            record_type = 'NONE',
            is_world_record = false,
            is_course_record = false,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${resultId}
        `;
        
        // Log in audit table
        await sql`
          INSERT INTO records_audit 
            (race_result_id, game_id, athlete_id, record_type, status_before, status_after, points_delta, changed_by)
          VALUES 
            (${resultId}, ${gameId}, ${result.athlete_id}, ${recordType}, 'provisional', 'rejected', ${-pointsToSubtract}, 'api')
        `;
        
        res.status(200).json({
          message: 'Record rejected successfully',
          resultId,
          pointsRemoved: pointsToSubtract
        });
        
      } else {
        res.status(400).json({ 
          error: 'Invalid action. Use: calculate, recalculate, confirm-record, or reject-record' 
        });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Scoring error:', error);
    res.status(500).json({ error: error.message });
  }
}
