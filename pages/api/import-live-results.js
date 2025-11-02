import { neon } from '@neondatabase/serverless';

// Initialize Neon SQL client
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { gameId, splitType, gender, athletes } = req.body;

    // Validate required fields
    if (!gameId || !splitType || !gender || !athletes || !Array.isArray(athletes)) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['gameId', 'splitType', 'gender', 'athletes (array)']
      });
    }

    console.log(`📥 Importing ${athletes.length} ${gender} athletes for ${gameId}, split: ${splitType}`);

    // Validate splitType
    const validSplits = ['5k', '10k', '15k', '20k', 'half', '25k', '30k', '35k', '40k', 'finish'];
    if (!validSplits.includes(splitType)) {
      return res.status(400).json({
        error: 'Invalid split type',
        validSplits
      });
    }

    // Map split type to database column
    const splitColumnMap = {
      '5k': 'split_5k',
      '10k': 'split_10k',
      '15k': 'split_15k',
      '20k': 'split_20k',
      'half': 'split_half',
      '25k': 'split_25k',
      '30k': 'split_30k',
      '35k': 'split_35k',
      '40k': 'split_40k',
      'finish': 'finish_time'
    };

    const columnName = splitColumnMap[splitType];

    let successful = 0;
    let failed = 0;
    const errors = [];
    const matches = [];

    // Process each athlete
    for (const athlete of athletes) {
      try {
        const { name, time } = athlete;

        if (!name || !time) {
          failed++;
          errors.push({ name: name || 'unknown', error: 'Missing name or time' });
          continue;
        }

        console.log(`🔍 Matching "${name}" with time ${time}...`);
        console.log(`   Gender filter: "${gender}"`);

        // Try exact match first
        let matchedAthlete = await sql`
          SELECT id, name, gender 
          FROM athletes 
          WHERE LOWER(name) = LOWER(${name}) AND gender = ${gender}
        `;
        
        console.log(`   Exact match query returned ${matchedAthlete.length} results`);

        // If no exact match, try fuzzy match (partial name match)
        if (matchedAthlete.length === 0) {
          console.log(`   No exact match, trying fuzzy match...`);
          
          // Split the scraped name into parts
          const nameParts = name.trim().split(/\s+/);
          
          // Try matching on last name (usually last part)
          const lastName = nameParts[nameParts.length - 1];
          
          matchedAthlete = await sql`
            SELECT id, name, gender 
            FROM athletes 
            WHERE LOWER(name) LIKE LOWER(${'%' + lastName + '%'}) AND gender = ${gender}
            LIMIT 1
          `;
        }

        if (matchedAthlete.length === 0) {
          failed++;
          errors.push({ name, error: 'No matching athlete found in database' });
          console.log(`   ❌ No match found for "${name}"`);
          continue;
        }

        const dbAthlete = matchedAthlete[0];
        console.log(`   ✅ Matched to database: ${dbAthlete.name} (ID: ${dbAthlete.id})`);

        // Check if race_results entry exists for this athlete in this game
        const existingResult = await sql`
          SELECT id FROM race_results 
          WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}
        `;

        if (existingResult.length > 0) {
          // Update existing result - construct dynamic SQL
          if (columnName === 'finish_time') {
            await sql`UPDATE race_results SET finish_time = ${time}, updated_at = CURRENT_TIMESTAMP WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}`;
          } else if (columnName === 'split_5k') {
            await sql`UPDATE race_results SET split_5k = ${time}, updated_at = CURRENT_TIMESTAMP WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}`;
          } else if (columnName === 'split_10k') {
            await sql`UPDATE race_results SET split_10k = ${time}, updated_at = CURRENT_TIMESTAMP WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}`;
          } else if (columnName === 'split_15k') {
            await sql`UPDATE race_results SET split_15k = ${time}, updated_at = CURRENT_TIMESTAMP WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}`;
          } else if (columnName === 'split_20k') {
            await sql`UPDATE race_results SET split_20k = ${time}, updated_at = CURRENT_TIMESTAMP WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}`;
          } else if (columnName === 'split_half') {
            await sql`UPDATE race_results SET split_half = ${time}, updated_at = CURRENT_TIMESTAMP WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}`;
          } else if (columnName === 'split_25k') {
            await sql`UPDATE race_results SET split_25k = ${time}, updated_at = CURRENT_TIMESTAMP WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}`;
          } else if (columnName === 'split_30k') {
            await sql`UPDATE race_results SET split_30k = ${time}, updated_at = CURRENT_TIMESTAMP WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}`;
          } else if (columnName === 'split_35k') {
            await sql`UPDATE race_results SET split_35k = ${time}, updated_at = CURRENT_TIMESTAMP WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}`;
          } else if (columnName === 'split_40k') {
            await sql`UPDATE race_results SET split_40k = ${time}, updated_at = CURRENT_TIMESTAMP WHERE game_id = ${gameId} AND athlete_id = ${dbAthlete.id}`;
          }
          console.log(`   📝 Updated existing result`);
        } else {
          // Insert new result - construct dynamic SQL
          if (columnName === 'finish_time') {
            await sql`INSERT INTO race_results (game_id, athlete_id, finish_time, updated_at) VALUES (${gameId}, ${dbAthlete.id}, ${time}, CURRENT_TIMESTAMP)`;
          } else if (columnName === 'split_5k') {
            await sql`INSERT INTO race_results (game_id, athlete_id, split_5k, updated_at) VALUES (${gameId}, ${dbAthlete.id}, ${time}, CURRENT_TIMESTAMP)`;
          } else if (columnName === 'split_10k') {
            await sql`INSERT INTO race_results (game_id, athlete_id, split_10k, updated_at) VALUES (${gameId}, ${dbAthlete.id}, ${time}, CURRENT_TIMESTAMP)`;
          } else if (columnName === 'split_15k') {
            await sql`INSERT INTO race_results (game_id, athlete_id, split_15k, updated_at) VALUES (${gameId}, ${dbAthlete.id}, ${time}, CURRENT_TIMESTAMP)`;
          } else if (columnName === 'split_20k') {
            await sql`INSERT INTO race_results (game_id, athlete_id, split_20k, updated_at) VALUES (${gameId}, ${dbAthlete.id}, ${time}, CURRENT_TIMESTAMP)`;
          } else if (columnName === 'split_half') {
            await sql`INSERT INTO race_results (game_id, athlete_id, split_half, updated_at) VALUES (${gameId}, ${dbAthlete.id}, ${time}, CURRENT_TIMESTAMP)`;
          } else if (columnName === 'split_25k') {
            await sql`INSERT INTO race_results (game_id, athlete_id, split_25k, updated_at) VALUES (${gameId}, ${dbAthlete.id}, ${time}, CURRENT_TIMESTAMP)`;
          } else if (columnName === 'split_30k') {
            await sql`INSERT INTO race_results (game_id, athlete_id, split_30k, updated_at) VALUES (${gameId}, ${dbAthlete.id}, ${time}, CURRENT_TIMESTAMP)`;
          } else if (columnName === 'split_35k') {
            await sql`INSERT INTO race_results (game_id, athlete_id, split_35k, updated_at) VALUES (${gameId}, ${dbAthlete.id}, ${time}, CURRENT_TIMESTAMP)`;
          } else if (columnName === 'split_40k') {
            await sql`INSERT INTO race_results (game_id, athlete_id, split_40k, updated_at) VALUES (${gameId}, ${dbAthlete.id}, ${time}, CURRENT_TIMESTAMP)`;
          }
          console.log(`   ➕ Created new result`);
        }

        successful++;
        matches.push({
          scrapedName: name,
          matchedName: dbAthlete.name,
          athleteId: dbAthlete.id,
          time,
          split: splitType
        });

      } catch (error) {
        console.error(`   ❌ Error processing ${athlete.name}:`, error);
        failed++;
        errors.push({ name: athlete.name, error: error.message });
      }
    }

    console.log(`✅ Import complete: ${successful} successful, ${failed} failed`);

    return res.status(200).json({
      success: true,
      summary: {
        total: athletes.length,
        successful,
        failed
      },
      matches,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Import error:', error);
    return res.status(500).json({
      error: 'Failed to import results',
      message: error.message
    });
  }
}
