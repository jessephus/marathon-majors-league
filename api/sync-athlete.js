import { neon } from '@neondatabase/serverless';

// Helper to fetch HTML from World Athletics
async function fetchProfile(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch profile: HTTP ${response.status}`);
  }
  
  return await response.text();
}

// Extract athlete data from World Athletics __NEXT_DATA__ JSON
function extractAthleteData(html) {
  const enriched = {};
  
  // Find __NEXT_DATA__ JSON
  const jsonMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
  if (!jsonMatch) {
    console.log('No __NEXT_DATA__ found');
    return null;
  }
  
  try {
    const nextData = JSON.parse(jsonMatch[1]);
    const competitor = nextData?.props?.pageProps?.competitor;
    
    if (!competitor) {
      console.log('No competitor data found');
      return null;
    }
    
    // Extract World Rankings
    const worldRankings = competitor.worldRankings?.current || [];
    for (const ranking of worldRankings) {
      const eventGroup = (ranking.eventGroup || '').toLowerCase();
      const place = ranking.place;
      
      if (place) {
        if (eventGroup.includes('marathon')) {
          enriched.marathon_rank = place;
          console.log(`  ✓ Marathon rank: #${place}`);
        } else if (eventGroup.includes('road running')) {
          enriched.road_running_rank = place;
        } else if (eventGroup.includes('overall')) {
          enriched.overall_rank = place;
          console.log(`  ✓ Overall rank: #${place}`);
        }
      }
    }
    
    // Extract Personal Best
    const personalBests = competitor.personalBests?.results || [];
    for (const pb of personalBests) {
      if (pb.discipline === 'Marathon') {
        enriched.personal_best = pb.mark;
        console.log(`  ✓ Personal best: ${pb.mark}`);
        break;
      }
    }
    
    // Extract Season Best
    const seasonBests = competitor.seasonsBests?.results || [];
    for (const sb of seasonBests) {
      if (sb.discipline === 'Marathon') {
        enriched.season_best = sb.mark;
        break;
      }
    }
    
    // Extract basic info
    const basicData = competitor.basicData || {};
    if (basicData.birthDate) {
      enriched.date_of_birth = basicData.birthDate;
      
      // Calculate age
      const birthDate = new Date(basicData.birthDate);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      enriched.age = age;
      console.log(`  ✓ Age: ${age}`);
    }
    
    return enriched;
    
  } catch (error) {
    console.error('Error parsing __NEXT_DATA__:', error);
    return null;
  }
}

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

      console.log(`Syncing athlete ${athleteData.id} (${athleteData.name}) with WA_ID: ${waId}`);

      // Fetch profile from World Athletics
      const profileUrl = `https://worldathletics.org/athletes/_/${waId}`;
      console.log(`Fetching profile from: ${profileUrl}`);
      
      try {
        const html = await fetchProfile(profileUrl);
        console.log(`Successfully fetched HTML (length: ${html.length} bytes)`);

        // Extract data from __NEXT_DATA__ JSON
        const enriched = extractAthleteData(html);
        
        if (!enriched) {
          return res.status(500).json({ 
            error: 'Failed to extract athlete data from profile'
          });
        }

        console.log('Enriched data extracted:', enriched);

        // Update athlete in database
        if (enriched.personal_best) {
          await sql`UPDATE athletes SET personal_best = ${enriched.personal_best}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        if (enriched.age !== undefined) {
          await sql`UPDATE athletes SET age = ${enriched.age}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        if (enriched.date_of_birth) {
          await sql`UPDATE athletes SET date_of_birth = ${enriched.date_of_birth}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        if (enriched.marathon_rank !== undefined) {
          await sql`UPDATE athletes SET marathon_rank = ${enriched.marathon_rank}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        if (enriched.road_running_rank !== undefined) {
          await sql`UPDATE athletes SET road_running_rank = ${enriched.road_running_rank}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        if (enriched.season_best) {
          await sql`UPDATE athletes SET season_best = ${enriched.season_best}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        
        // Always update profile URL
        await sql`UPDATE athletes SET world_athletics_profile_url = ${profileUrl}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;

        // Fetch updated athlete data
        const result = await sql`
          SELECT 
            id, name, personal_best, marathon_rank, road_running_rank,
            age, date_of_birth, season_best, updated_at
          FROM athletes
          WHERE id = ${athleteId}
        `;
        
        const updatedAthlete = result[0];

        console.log(`Successfully synced ${athleteData.name}`);

        return res.status(200).json({
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
          }
        });

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
