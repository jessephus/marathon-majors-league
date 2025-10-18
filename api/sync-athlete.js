import { neon } from '@neondatabase/serverless';
import https from 'https';

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9'
      }
    }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        console.log(`Redirecting to: ${redirectUrl}`);
        return fetchHtml(redirectUrl).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch profile: HTTP ${response.statusCode}`));
        return;
      }

      let data = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        resolve(data);
      });
    });

    request.on('error', (error) => {
      console.error('HTTPS request error:', error);
      reject(error);
    });

    request.setTimeout(15000, () => {
      request.destroy();
      reject(new Error('Request timeout after 15 seconds'));
    });
  });
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

      console.log(`Manual sync requested for athlete ${athleteData.id} (${athleteData.name}) with WA_ID: ${waId}`);

      // Fetch athlete profile from World Athletics
      const profileUrl = `https://worldathletics.org/athletes/_/${waId}`;
      console.log(`Fetching profile from: ${profileUrl}`);
      
      try {
        const html = await fetchHtml(profileUrl);
        console.log(`Successfully fetched HTML (length: ${html.length} bytes)`);

        // Extract data from __NEXT_DATA__ JSON embedded in the page (same as Python script)
        const enrichedData = {};
        
        const jsonMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
        
        if (!jsonMatch) {
          console.log('No __NEXT_DATA__ found, trying fallback regex extraction');
          // Fallback to regex patterns if JSON not found
          return extractDataViaRegex(html, enrichedData);
        }

        try {
          const nextData = JSON.parse(jsonMatch[1]);
          const competitor = nextData?.props?.pageProps?.competitor;

          if (!competitor) {
            console.log('No competitor data in __NEXT_DATA__, trying fallback');
            return extractDataViaRegex(html, enrichedData);
          }

          console.log('Successfully parsed __NEXT_DATA__');

          // Extract World Rankings
          const worldRankings = competitor.worldRankings?.current || [];
          for (const ranking of worldRankings) {
            const eventGroup = (ranking.eventGroup || '').toLowerCase();
            const place = ranking.place;

            if (place) {
              if (eventGroup.includes('marathon')) {
                enrichedData.marathon_rank = place;
                console.log(`  ✓ Marathon rank: #${place}`);
              } else if (eventGroup.includes('road running')) {
                enrichedData.road_running_rank = place;
                console.log(`  ✓ Road Running rank: #${place}`);
              } else if (eventGroup.includes('overall')) {
                enrichedData.overall_rank = place;
                console.log(`  ✓ Overall rank: #${place}`);
              }
            }
          }

          // Extract Personal Best
          const personalBests = competitor.personalBests?.results || [];
          for (const pb of personalBests) {
            if (pb.discipline === 'Marathon') {
              enrichedData.personal_best = pb.mark;
              console.log(`  ✓ Personal best: ${pb.mark}`);
              break;
            }
          }

          // Extract Season Best
          const seasonBests = competitor.seasonsBests?.results || [];
          for (const sb of seasonBests) {
            if (sb.discipline === 'Marathon') {
              enrichedData.season_best = sb.mark;
              console.log(`  ✓ Season best: ${sb.mark}`);
              break;
            }
          }

          // Extract basic info
          const basicInfo = competitor.basicData || {};
          if (basicInfo.birthDate) {
            enrichedData.date_of_birth = basicInfo.birthDate;
            
            // Calculate age
            const birthDate = new Date(basicInfo.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            enrichedData.age = age;
            console.log(`  ✓ Age: ${age}`);
          }

        } catch (parseError) {
          console.error('Error parsing __NEXT_DATA__:', parseError);
          // Fall through to regex extraction below
        }

        console.log('Enriched data extracted:', enrichedData);

        // Update athlete in database using individual SQL queries
        let updatedAthlete = athleteData;

        if (enrichedData.personal_best) {
          await sql`UPDATE athletes SET personal_best = ${enrichedData.personal_best}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        if (enrichedData.age !== undefined) {
          await sql`UPDATE athletes SET age = ${enrichedData.age}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        if (enrichedData.date_of_birth) {
          await sql`UPDATE athletes SET date_of_birth = ${enrichedData.date_of_birth}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        if (enrichedData.marathon_rank !== undefined) {
          await sql`UPDATE athletes SET marathon_rank = ${enrichedData.marathon_rank}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        if (enrichedData.road_running_rank !== undefined) {
          await sql`UPDATE athletes SET road_running_rank = ${enrichedData.road_running_rank}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }
        if (enrichedData.season_best) {
          await sql`UPDATE athletes SET season_best = ${enrichedData.season_best}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;
        }

        // Always update profile URL
        await sql`UPDATE athletes SET world_athletics_profile_url = ${profileUrl}, updated_at = CURRENT_TIMESTAMP WHERE id = ${athleteId}`;

        // Fetch the updated athlete data
        const result = await sql`
          SELECT 
            id, 
            name, 
            personal_best,
            marathon_rank,
            road_running_rank,
            age,
            date_of_birth,
            season_best,
            updated_at
          FROM athletes
          WHERE id = ${athleteId}
        `;
        updatedAthlete = result[0];

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


      } catch (fetchError) {
        console.error('Profile fetch error:', fetchError);
        console.error('Error stack:', fetchError.stack);
        return res.status(500).json({ 
          error: 'Failed to fetch athlete profile from World Athletics',
          details: fetchError.message,
          url: profileUrl
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
