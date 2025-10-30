/**
 * Load Demo Data API
 * 
 * POST /api/load-demo-data - Creates fake game data for testing
 * 
 * This endpoint creates:
 * - A demo game with 3 teams
 * - Fake team rosters with athletes
 * - Fake race results (optional)
 * - Test sessions for each team
 */

import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'crypto';

const sql = neon(process.env.DATABASE_URL);

const DEMO_GAME_ID = 'demo-game';

export default async function handler(req, res) {
  // Set CORS headers
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
    const { includeResults = false } = req.body || {};
    
    console.log('🎭 Creating demo data...');
    
    // Step 1: Clean up any existing demo data
    await sql`DELETE FROM race_results WHERE game_id = ${DEMO_GAME_ID}`;
    await sql`DELETE FROM salary_cap_teams WHERE game_id = ${DEMO_GAME_ID}`;
    await sql`DELETE FROM anonymous_sessions WHERE game_id = ${DEMO_GAME_ID}`;
    await sql`DELETE FROM games WHERE game_id = ${DEMO_GAME_ID}`;
    
    console.log('✓ Cleaned up old demo data');
    
    // Step 2: Get some athletes for teams
    const topMen = await sql`
      SELECT id, name, country, personal_best as pb, salary, marathon_rank, headshot_url
      FROM athletes 
      WHERE gender = 'men' AND salary IS NOT NULL
      ORDER BY salary DESC 
      LIMIT 10
    `;
    
    const topWomen = await sql`
      SELECT id, name, country, personal_best as pb, salary, marathon_rank, headshot_url
      FROM athletes 
      WHERE gender = 'women' AND salary IS NOT NULL
      ORDER BY salary DESC 
      LIMIT 10
    `;
    
    console.log('✓ Fetched athletes for demo teams');
    
    // Step 3: Create demo teams with different spending strategies
    const teams = [
      {
        name: 'Team Elite',
        men: [topMen[0], topMen[1], topMen[2]], // Top 3 expensive men
        women: [topWomen[0], topWomen[1], topWomen[2]], // Top 3 expensive women
        strategy: 'All stars'
      },
      {
        name: 'Team Balanced',
        men: [topMen[1], topMen[3], topMen[5]], // Mix of expensive and mid-tier
        women: [topWomen[1], topWomen[3], topWomen[5]],
        strategy: 'Balanced approach'
      },
      {
        name: 'Team Value',
        men: [topMen[4], topMen[6], topMen[8]], // More value picks
        women: [topWomen[4], topWomen[6], topWomen[8]],
        strategy: 'Value hunters'
      }
    ];
    
    // Step 4: Create the game
    await sql`
      INSERT INTO games (game_id, players, draft_complete, results_finalized, created_at)
      VALUES (
        ${DEMO_GAME_ID},
        ${['Team Elite', 'Team Balanced', 'Team Value']},
        true,
        false,
        CURRENT_TIMESTAMP
      )
    `;
    
    console.log('✓ Created demo game');
    
    // Step 5: Create anonymous sessions for each team
    const sessions = [];
    
    for (const team of teams) {
      const sessionToken = randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days
      
      await sql`
        INSERT INTO anonymous_sessions (
          session_token,
          session_type,
          display_name,
          game_id,
          expires_at,
          is_active
        )
        VALUES (
          ${sessionToken},
          'player',
          ${team.name},
          ${DEMO_GAME_ID},
          ${expiresAt},
          true
        )
      `;
      
      sessions.push({
        teamName: team.name,
        token: sessionToken,
        url: `${req.headers.origin || 'http://localhost:3000'}?session=${sessionToken}`
      });
    }
    
    console.log('✓ Created demo sessions');
    
    // Step 6: Create team rosters
    for (const team of teams) {
      const allAthletes = [...team.men, ...team.women];
      const totalSpent = allAthletes.reduce((sum, a) => sum + (a.salary || 5000), 0);
      
      // Insert men
      for (const athlete of team.men) {
        await sql`
          INSERT INTO salary_cap_teams (game_id, player_code, athlete_id, gender, total_spent)
          VALUES (${DEMO_GAME_ID}, ${team.name}, ${athlete.id}, 'men', ${totalSpent})
        `;
      }
      
      // Insert women
      for (const athlete of team.women) {
        await sql`
          INSERT INTO salary_cap_teams (game_id, player_code, athlete_id, gender, total_spent)
          VALUES (${DEMO_GAME_ID}, ${team.name}, ${athlete.id}, 'women', ${totalSpent})
        `;
      }
    }
    
    console.log('✓ Created demo team rosters');
    
    // Step 7: Optionally add fake race results
    if (includeResults) {
      const allDemoAthletes = new Set();
      teams.forEach(team => {
        [...team.men, ...team.women].forEach(a => allDemoAthletes.add(a.id));
      });
      
      for (const athleteId of allDemoAthletes) {
        // Generate fake finish time (2:05:00 to 2:15:00 range)
        const baseSeconds = 2 * 3600 + 5 * 60; // 2:05:00
        const randomSeconds = Math.floor(Math.random() * 10 * 60); // 0-10 minutes
        const totalSeconds = baseSeconds + randomSeconds;
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const finishTime = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        await sql`
          INSERT INTO race_results (game_id, athlete_id, finish_time, is_final)
          VALUES (${DEMO_GAME_ID}, ${athleteId}, ${finishTime}, true)
        `;
      }
      
      console.log('✓ Created demo race results');
    }
    
    // Step 8: Return summary
    return res.status(200).json({
      success: true,
      message: 'Demo data created successfully!',
      gameId: DEMO_GAME_ID,
      teams: teams.map((team, i) => ({
        teamName: team.name,
        strategy: team.strategy,
        sessionUrl: sessions[i].url,
        athletes: [...team.men, ...team.women].map(a => ({
          name: a.name,
          country: a.country,
          salary: a.salary
        }))
      })),
      resultsCreated: includeResults,
      instructions: [
        '1. Copy one of the session URLs below',
        '2. Paste it in your browser to view that team',
        '3. Each team has a different roster strategy',
        includeResults ? '4. Race results have been added - check the leaderboard!' : '4. No race results yet - results can be added via commissioner mode'
      ],
      sessions: sessions
    });
    
  } catch (error) {
    console.error('Error creating demo data:', error);
    return res.status(500).json({ 
      error: 'Failed to create demo data',
      details: error.message 
    });
  }
}
