import { neon } from '@neondatabase/serverless';
import { hasCommissionerAccess } from './db';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gameId, splitType, gender, athletes, sessionToken } = req.body;

    // Validate required fields
    if (!gameId || !splitType || !gender || !athletes || !Array.isArray(athletes)) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['gameId', 'splitType', 'gender', 'athletes (array)']
      });
    }

    // Verify commissioner access
    if (sessionToken) {
      const hasAccess = await hasCommissionerAccess(gameId, sessionToken);
      if (!hasAccess) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: 'Only commissioners can import race results'
        });
      }
    }

    // Validate split type
    const validSplits = ['5k', '10k', 'half', '30k', '35k', '40k', 'finish'];
    if (!validSplits.includes(splitType.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid split type',
        validSplits
      });
    }

    // Validate gender
    if (!['men', 'women'].includes(gender.toLowerCase())) {
      return res.status(400).json({ 
        error: 'Invalid gender',
        validGender: ['men', 'women']
      });
    }

    // Map split type to column name
    const splitColumnMap = {
      '5k': 'split_5k',
      '10k': 'split_10k',
      'half': 'split_half',
      '30k': 'split_30k',
      '35k': 'split_35k',
      '40k': 'split_40k',
      'finish': 'finish_time'
    };

    const splitColumn = splitColumnMap[splitType.toLowerCase()];
    let successCount = 0;
    let failedAthletes = [];
    let updatedAthletes = [];

    // Process each athlete
    for (const athleteData of athletes) {
      const { name, time, country, rank } = athleteData;

      if (!name || !time) {
        failedAthletes.push({ name: name || 'Unknown', reason: 'Missing name or time' });
        continue;
      }

      try {
        // Find athlete by name and gender (case-insensitive)
        // Try exact match first
        let athlete = await sql`
          SELECT id, name FROM athletes 
          WHERE LOWER(name) = LOWER(${name}) 
          AND gender = ${gender.toLowerCase()}
          LIMIT 1
        `;

        // If no exact match, try partial match
        if (athlete.length === 0) {
          const nameParts = name.split(' ');
          const lastName = nameParts[nameParts.length - 1];
          
          athlete = await sql`
            SELECT id, name FROM athletes 
            WHERE LOWER(name) LIKE LOWER(${'%' + lastName + '%'})
            AND gender = ${gender.toLowerCase()}
            LIMIT 1
          `;
        }

        if (athlete.length === 0) {
          failedAthletes.push({ 
            name, 
            reason: 'Athlete not found in database',
            suggestion: 'Check spelling or add athlete first'
          });
          continue;
        }

        const athleteId = athlete[0].id;
        const athleteName = athlete[0].name;

        // Helper function to execute upsert query for a specific split column
        const upsertResult = async (columnName, includeePlacement) => {
          const columns = includeePlacement 
            ? `game_id, athlete_id, ${columnName}, placement, updated_at`
            : `game_id, athlete_id, ${columnName}, updated_at`;
          
          const values = includeePlacement
            ? [gameId, athleteId, time, parseInt(rank), 'NOW()']
            : [gameId, athleteId, time, 'NOW()'];
          
          const updateSet = includeePlacement
            ? `${columnName} = EXCLUDED.${columnName}, placement = EXCLUDED.placement, updated_at = EXCLUDED.updated_at`
            : `${columnName} = EXCLUDED.${columnName}, updated_at = EXCLUDED.updated_at`;
          
          // Build and execute the query
          if (includeePlacement) {
            const placementValue = parseInt(rank);
            await sql`INSERT INTO race_results (game_id, athlete_id, ${sql.unsafe(columnName)}, placement, updated_at) 
                      VALUES (${gameId}, ${athleteId}, ${time}, ${placementValue}, NOW()) 
                      ON CONFLICT (game_id, athlete_id) 
                      DO UPDATE SET ${sql.unsafe(columnName)} = EXCLUDED.${sql.unsafe(columnName)}, 
                                    placement = EXCLUDED.placement, 
                                    updated_at = EXCLUDED.updated_at`;
          } else {
            await sql`INSERT INTO race_results (game_id, athlete_id, ${sql.unsafe(columnName)}, updated_at) 
                      VALUES (${gameId}, ${athleteId}, ${time}, NOW()) 
                      ON CONFLICT (game_id, athlete_id) 
                      DO UPDATE SET ${sql.unsafe(columnName)} = EXCLUDED.${sql.unsafe(columnName)}, 
                                    updated_at = EXCLUDED.updated_at`;
          }
        };

        // Insert or update race result
        const includesPlacement = splitType.toLowerCase() === 'finish' && rank;
        await upsertResult(splitColumn, includesPlacement);

        successCount++;
        updatedAthletes.push({
          id: athleteId,
          name: athleteName,
          time,
          split: splitType
        });

      } catch (error) {
        console.error(`Error processing athlete ${name}:`, error);
        failedAthletes.push({ 
          name, 
          reason: `Database error: ${error.message}` 
        });
      }
    }

    // Return summary
    res.status(200).json({
      message: 'Import completed',
      summary: {
        total: athletes.length,
        successful: successCount,
        failed: failedAthletes.length
      },
      updatedAthletes,
      failedAthletes,
      splitType,
      gender
    });

  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
