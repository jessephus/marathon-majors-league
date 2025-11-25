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

      // Build dynamic update query based on provided fields
      const updates = [];
      const values = { athleteId };
      
      if (worldAthleticsId !== undefined) {
        // Allow setting to null/empty to remove the ID
        const waId = worldAthleticsId && worldAthleticsId.trim() !== '' 
          ? worldAthleticsId.trim() 
          : null;
        updates.push('world_athletics_id');
        values.waId = waId;
      }
      
      if (headshotUrl !== undefined) {
        // Allow setting to null/empty to remove the URL
        const url = headshotUrl && headshotUrl.trim() !== '' 
          ? headshotUrl.trim() 
          : null;
        updates.push('headshot_url');
        values.headshotUrl = url;
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update provided' });
      }

      // Build the UPDATE query dynamically
      let query = 'UPDATE athletes SET ';
      const setClauses = [];
      
      if (values.waId !== undefined) {
        setClauses.push(`world_athletics_id = ${values.waId === null ? 'NULL' : `'${values.waId}'`}`);
      }
      if (values.headshotUrl !== undefined) {
        setClauses.push(`headshot_url = ${values.headshotUrl === null ? 'NULL' : `'${values.headshotUrl}'`}`);
      }
      
      setClauses.push('updated_at = CURRENT_TIMESTAMP');
      query += setClauses.join(', ');
      query += ` WHERE id = ${values.athleteId} RETURNING id, name, world_athletics_id, headshot_url`;

      const result = await sql([query]);

      if (result.length === 0) {
        return res.status(404).json({ error: 'Athlete not found' });
      }

      const updateDetails = [];
      if (values.waId !== undefined) updateDetails.push(`WA_ID = ${values.waId || 'NULL'}`);
      if (values.headshotUrl !== undefined) updateDetails.push(`Headshot = ${values.headshotUrl || 'NULL'}`);
      
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
