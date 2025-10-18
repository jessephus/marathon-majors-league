import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'POST') {
      const { athleteId, worldAthleticsId } = req.body;

      if (!athleteId) {
        return res.status(400).json({ error: 'athleteId is required' });
      }

      // Get athlete details
      const athlete = await sql`
        SELECT id, name, world_athletics_id, gender
        FROM athletes
        WHERE id = ${athleteId}
      `;

      if (athlete.length === 0) {
        return res.status(404).json({ error: 'Athlete not found' });
      }

      const athleteData = athlete[0];
      const waId = worldAthleticsId || athleteData.world_athletics_id;

      if (!waId) {
        return res.status(400).json({ 
          error: 'Cannot sync athlete without World Athletics ID',
          details: 'Please add a World Athletics ID first'
        });
      }

      console.log(`Manual sync requested for athlete ${athleteData.id} (${athleteData.name}) with WA_ID: ${waId}`);

      // Fetch athlete profile from World Athletics
      const profileUrl = `https://worldathletics.org/athletes/_/${waId}`;
      
      try {
        const response = await fetch(profileUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.status}`);
        }

        const html = await response.text();

        // Extract data from profile page using regex (same logic as Python script)
        const enrichedData = {};

        // Personal Best
        const pbMatch = html.match(/Personal Best.*?(\d{1}:\d{2}:\d{2})/s);
        if (pbMatch) enrichedData.personal_best = pbMatch[1];

        // Age
        const ageMatch = html.match(/(\d{2})\s+yrs/i);
        if (ageMatch) enrichedData.age = parseInt(ageMatch[1]);

        // Date of Birth
        const dobMatch = html.match(/(\d{1,2}\s+\w+\s+\d{4})/);
        if (dobMatch) {
          // Convert to ISO date format
          enrichedData.date_of_birth = new Date(dobMatch[1]).toISOString().split('T')[0];
        }

        // Marathon Rank
        const marathonRankMatch = html.match(/#(\d+)\s+(?:Man'?s|Woman'?s)\s+marathon/i);
        if (marathonRankMatch) enrichedData.marathon_rank = parseInt(marathonRankMatch[1]);

        // Road Running Rank
        const roadRankMatch = html.match(/#(\d+)\s+(?:Man'?s|Woman'?s)\s+road\s+running/i);
        if (roadRankMatch) enrichedData.road_running_rank = parseInt(roadRankMatch[1]);

        // Season Best
        const sbMatch = html.match(/Season Best.*?(\d{1}:\d{2}:\d{2})/s);
        if (sbMatch) enrichedData.season_best = sbMatch[1];

        // Update athlete in database
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        if (enrichedData.personal_best) {
          updateFields.push(`personal_best = $${paramIndex++}`);
          updateValues.push(enrichedData.personal_best);
        }
        if (enrichedData.age) {
          updateFields.push(`age = $${paramIndex++}`);
          updateValues.push(enrichedData.age);
        }
        if (enrichedData.date_of_birth) {
          updateFields.push(`date_of_birth = $${paramIndex++}`);
          updateValues.push(enrichedData.date_of_birth);
        }
        if (enrichedData.marathon_rank) {
          updateFields.push(`marathon_rank = $${paramIndex++}`);
          updateValues.push(enrichedData.marathon_rank);
        }
        if (enrichedData.road_running_rank) {
          updateFields.push(`road_running_rank = $${paramIndex++}`);
          updateValues.push(enrichedData.road_running_rank);
        }
        if (enrichedData.season_best) {
          updateFields.push(`season_best = $${paramIndex++}`);
          updateValues.push(enrichedData.season_best);
        }

        // Always update these fields
        updateFields.push(`world_athletics_profile_url = $${paramIndex++}`);
        updateValues.push(profileUrl);
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

        if (updateFields.length > 1) { // More than just updated_at
          // Build and execute update query
          const updateQuery = `
            UPDATE athletes 
            SET ${updateFields.join(', ')}
            WHERE id = $${paramIndex}
            RETURNING *
          `;
          updateValues.push(athleteId);

          const result = await sql(updateQuery, updateValues);
          const updatedAthlete = result[0];

          console.log(`Successfully synced athlete ${athleteData.name}:`, enrichedData);

          res.status(200).json({
            message: 'Athlete synced successfully',
            athlete: {
              id: updatedAthlete.id,
              name: updatedAthlete.name,
              pb: updatedAthlete.personal_best,
              marathonRank: updatedAthlete.marathon_rank,
              roadRunningRank: updatedAthlete.road_running_rank,
              age: updatedAthlete.age,
              dateOfBirth: updatedAthlete.date_of_birth,
              seasonBest: updatedAthlete.season_best,
              updatedAt: updatedAthlete.updated_at
            },
            enrichedFields: Object.keys(enrichedData)
          });
        } else {
          return res.status(200).json({
            message: 'No new data found to update',
            athlete: athleteData
          });
        }

      } catch (fetchError) {
        console.error('Profile fetch error:', fetchError);
        return res.status(500).json({ 
          error: 'Failed to fetch athlete profile from World Athletics',
          details: fetchError.message
        });
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Sync athlete error:', error);
    res.status(500).json({ error: error.message });
  }
}
