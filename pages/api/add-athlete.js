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
      const {
        name,
        country,
        gender,
        personalBest,
        headshotUrl,
        worldAthleticsId,
        marathonRank,
        age,
        sponsor,
        seasonBest,
        confirmForNYC
      } = req.body;

      // Validate required fields
      if (!name || !country || !gender || !personalBest) {
        return res.status(400).json({
          error: 'Missing required fields',
          details: 'name, country, gender, and personalBest are required'
        });
      }

      // Validate gender
      if (gender !== 'men' && gender !== 'women') {
        return res.status(400).json({
          error: 'Invalid gender',
          details: 'gender must be "men" or "women"'
        });
      }

      // Insert new athlete
      const result = await sql`
        INSERT INTO athletes (
          name,
          country,
          gender,
          personal_best,
          headshot_url,
          world_athletics_id,
          marathon_rank,
          age,
          sponsor,
          season_best
        )
        VALUES (
          ${name},
          ${country},
          ${gender},
          ${personalBest},
          ${headshotUrl || null},
          ${worldAthleticsId || null},
          ${marathonRank || null},
          ${age || null},
          ${sponsor || null},
          ${seasonBest || null}
        )
        RETURNING id, name, country, gender, personal_best as pb
      `;

      if (result.length === 0) {
        throw new Error('Failed to insert athlete');
      }

      const newAthlete = result[0];
      console.log(`Added new athlete ${newAthlete.id}: ${newAthlete.name}`);

      // If confirmForNYC is true, add to athlete_races for the active race
      if (confirmForNYC) {
        const activeRaces = await sql`
          SELECT id FROM races WHERE is_active = true LIMIT 1
        `;

        if (activeRaces.length > 0) {
          await sql`
            INSERT INTO athlete_races (athlete_id, race_id)
            VALUES (${newAthlete.id}, ${activeRaces[0].id})
            ON CONFLICT (athlete_id, race_id) DO NOTHING
          `;
          console.log(`Confirmed athlete ${newAthlete.id} for NYC Marathon`);
        }
      }

      res.status(201).json({
        message: 'Athlete added successfully',
        athlete: newAthlete
      });
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Add athlete error:', error);
    res.status(500).json({ error: error.message });
  }
}
