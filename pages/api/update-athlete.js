import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    if (req.method === 'PUT') {
      const { athleteId, worldAthleticsId, headshotUrl } = req.body;

      if (!athleteId) {
        return res.status(400).json({ error: 'athleteId is required' });
      }

      // Determine which fields to update
      const updateWaId = worldAthleticsId !== undefined;
      const updateHeadshot = headshotUrl !== undefined;
      
      if (!updateWaId && !updateHeadshot) {
        return res.status(400).json({ error: 'No fields to update provided' });
      }

      // Prepare values
      const waId = updateWaId 
        ? (worldAthleticsId && worldAthleticsId.trim() !== '' ? worldAthleticsId.trim() : null)
        : undefined;
      
      const hsUrl = updateHeadshot
        ? (headshotUrl && headshotUrl.trim() !== '' ? headshotUrl.trim() : null)
        : undefined;

      // Execute appropriate update query
      let result;
      
      if (updateWaId && updateHeadshot) {
        // Update both fields
        result = await sql`
          UPDATE athletes
          SET 
            world_athletics_id = ${waId},
            headshot_url = ${hsUrl},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${athleteId}
          RETURNING id, name, world_athletics_id, headshot_url
        `;
      } else if (updateWaId) {
        // Update only World Athletics ID
        result = await sql`
          UPDATE athletes
          SET 
            world_athletics_id = ${waId},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${athleteId}
          RETURNING id, name, world_athletics_id, headshot_url
        `;
      } else {
        // Update only headshot URL
        result = await sql`
          UPDATE athletes
          SET 
            headshot_url = ${hsUrl},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${athleteId}
          RETURNING id, name, world_athletics_id, headshot_url
        `;
      }

      if (result.length === 0) {
        return res.status(404).json({ error: 'Athlete not found' });
      }

      const updateDetails = [];
      if (updateWaId) updateDetails.push(`WA_ID = ${waId || 'NULL'}`);
      if (updateHeadshot) updateDetails.push(`Headshot = ${hsUrl || 'NULL'}`);
      
      console.log(`Updated athlete ${result[0].id} (${result[0].name}): ${updateDetails.join(', ')}`);

      res.status(200).json({
        message: 'Athlete updated successfully',
        athlete: {
          id: result[0].id,
          name: result[0].name,
          worldAthleticsId: result[0].world_athletics_id,
          headshotUrl: result[0].headshot_url
        }
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Update athlete error:', error);
    res.status(500).json({ error: error.message });
  }
}
