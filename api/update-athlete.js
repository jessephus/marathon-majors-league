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
      const { athleteId, worldAthleticsId } = req.body;

      if (!athleteId) {
        return res.status(400).json({ error: 'athleteId is required' });
      }

      // Allow setting to null/empty to remove the ID
      const waId = worldAthleticsId && worldAthleticsId.trim() !== '' 
        ? worldAthleticsId.trim() 
        : null;

      // Update the athlete's World Athletics ID
      const result = await sql`
        UPDATE athletes
        SET 
          world_athletics_id = ${waId},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${athleteId}
        RETURNING id, name, world_athletics_id
      `;

      if (result.length === 0) {
        return res.status(404).json({ error: 'Athlete not found' });
      }

      console.log(`Updated athlete ${result[0].id} (${result[0].name}): WA_ID = ${waId || 'NULL'}`);

      res.status(200).json({
        message: 'World Athletics ID updated successfully',
        athlete: {
          id: result[0].id,
          name: result[0].name,
          worldAthleticsId: result[0].world_athletics_id
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
