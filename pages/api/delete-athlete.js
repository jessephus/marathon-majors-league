import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow DELETE method
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { athleteId } = req.body;

    // Validate athleteId
    if (!athleteId || typeof athleteId !== 'number') {
      return res.status(400).json({ 
        error: 'Invalid request - athleteId (number) is required' 
      });
    }

    // Get athlete info before deleting (for response)
    const athlete = await sql`
      SELECT id, name, country, gender
      FROM athletes
      WHERE id = ${athleteId}
    `;

    if (!athlete || athlete.length === 0) {
      return res.status(404).json({ 
        error: `Athlete with ID ${athleteId} not found` 
      });
    }

    // Delete the athlete (CASCADE will handle related records)
    await sql`
      DELETE FROM athletes
      WHERE id = ${athleteId}
    `;

    // Return success with deleted athlete info
    res.status(200).json({
      success: true,
      message: `Successfully deleted athlete: ${athlete[0].name}`,
      athlete: athlete[0]
    });
  } catch (error) {
    console.error('Error deleting athlete:', error);
    res.status(500).json({ 
      error: 'Failed to delete athlete',
      details: error.message 
    });
  }
}
