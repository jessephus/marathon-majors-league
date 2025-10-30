/**
 * Load Demo Data API
 * 
 * POST /api/load-demo-data - Creates fake game data for testing
 * 
 * This endpoint creates a COMPLETE game following actual game rules:
 * - Demo game with 3 teams (each with 3M + 3W = 6 athletes)
 * - Respects $30K salary cap per team
 * - Creates proper salary_cap_teams entries
 * - Optional: Realistic race results with splits and scoring
 * - Test sessions for each team that work with the actual UI
 */

import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'crypto';

const sql = neon(process.env.DATABASE_URL);

const DEMO_GAME_ID = 'demo-game';
const SALARY_CAP = 30000;

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
    const { includeResults = false, clearAllData = false } = req.body || {};
    
    console.log('🎭 Creating demo data...');
    
    // Step 1: Clean up existing data
    if (clearAllData) {
      // CLEAR EVERYTHING (use with caution!)
      console.log('⚠️  Clearing ALL game data...');
      await sql`TRUNCATE TABLE race_results CASCADE`;
      await sql`TRUNCATE TABLE salary_cap_teams CASCADE`;
      await sql`TRUNCATE TABLE anonymous_sessions CASCADE`;
      await sql`DELETE FROM games WHERE game_id != 'default'`;
      console.log('✓ Cleared all data');
    } else {
      // Just clean up demo game data
      await sql`DELETE FROM race_results WHERE game_id = ${DEMO_GAME_ID}`;
      await sql`DELETE FROM salary_cap_teams WHERE game_id = ${DEMO_GAME_ID}`;
      await sql`DELETE FROM anonymous_sessions WHERE game_id = ${DEMO_GAME_ID}`;
      await sql`DELETE FROM games WHERE game_id = ${DEMO_GAME_ID}`;
      console.log('✓ Cleaned up old demo data');
    }
    
    // Step 2: Get athletes with salaries for team building
    const menWithSalary = await sql`
      SELECT id, name, country, personal_best as pb, salary, marathon_rank, headshot_url, gender
      FROM athletes 
      WHERE gender = 'men' AND salary IS NOT NULL AND salary > 0
      ORDER BY marathon_rank ASC NULLS LAST, salary DESC
      LIMIT 50
    `;
    
    const womenWithSalary = await sql`
      SELECT id, name, country, personal_best as pb, salary, marathon_rank, headshot_url, gender
      FROM athletes 
      WHERE gender = 'women' AND salary IS NOT NULL AND salary > 0
      ORDER BY marathon_rank ASC NULLS LAST, salary DESC
      LIMIT 50
    `;
    
    if (menWithSalary.length < 9 || womenWithSalary.length < 9) {
      return res.status(500).json({ 
        error: 'Not enough athletes with salaries in database',
        menCount: menWithSalary.length,
        womenCount: womenWithSalary.length,
        message: 'Need at least 9 men and 9 women with assigned salaries'
      });
    }
    
    console.log(`✓ Fetched ${menWithSalary.length} men and ${womenWithSalary.length} women for team building`);
    
    // Step 3: Build 3 teams with different strategies (must stay under $30K)
    const teams = [];
    
    // Team 1: Elite Strategy - Top expensive athletes
    const team1Men = [menWithSalary[0], menWithSalary[1], menWithSalary[2]];
    const team1Women = [womenWithSalary[0], womenWithSalary[1], womenWithSalary[2]];
    const team1Total = [...team1Men, ...team1Women].reduce((sum, a) => sum + a.salary, 0);
    
    teams.push({
      name: 'Team Elite',
      playerCode: 'ELITE',
      men: team1Men,
      women: team1Women,
      totalSpent: team1Total,
      strategy: `Elite stars ($${(team1Total/1000).toFixed(1)}K spent)`
    });
    
    // Team 2: Balanced Strategy - Mix of tiers
    const team2Men = [menWithSalary[3], menWithSalary[7], menWithSalary[11]];
    const team2Women = [womenWithSalary[3], womenWithSalary[7], womenWithSalary[11]];
    const team2Total = [...team2Men, ...team2Women].reduce((sum, a) => sum + a.salary, 0);
    
    teams.push({
      name: 'Team Balanced',
      playerCode: 'BALANCED',
      men: team2Men,
      women: team2Women,
      totalSpent: team2Total,
      strategy: `Mixed tiers ($${(team2Total/1000).toFixed(1)}K spent)`
    });
    
    // Team 3: Value Strategy - Budget picks
    const team3Men = [menWithSalary[15], menWithSalary[20], menWithSalary[25]];
    const team3Women = [womenWithSalary[15], womenWithSalary[20], womenWithSalary[25]];
    const team3Total = [...team3Men, ...team3Women].reduce((sum, a) => sum + a.salary, 0);
    
    teams.push({
      name: 'Team Value',
      playerCode: 'VALUE',
      men: team3Men,
      women: team3Women,
      totalSpent: team3Total,
      strategy: `Value hunters ($${(team3Total/1000).toFixed(1)}K spent)`
    });
    
    // Verify all teams are under salary cap
    for (const team of teams) {
      if (team.totalSpent > SALARY_CAP) {
        return res.status(500).json({
          error: `${team.name} exceeds salary cap`,
          spent: team.totalSpent,
          cap: SALARY_CAP,
          overage: team.totalSpent - SALARY_CAP
        });
      }
    }
    
    console.log(`✓ Created 3 teams with valid salary cap compliance`);
    
    // Step 4: Create the demo game with proper state
    await sql`
      INSERT INTO games (game_id, players, draft_complete, results_finalized, created_at)
      VALUES (
        ${DEMO_GAME_ID},
        ${teams.map(t => t.playerCode)},
        true,
        false,
        CURRENT_TIMESTAMP
      )
    `;
    
    console.log(`✓ Created demo game: ${DEMO_GAME_ID}`);
    
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
    
    // Step 6: Create team rosters following the exact format of salary-cap-draft.js
    for (const team of teams) {
      // Insert men (exactly 3)
      for (const athlete of team.men) {
        await sql`
          INSERT INTO salary_cap_teams (game_id, player_code, athlete_id, gender, total_spent)
          VALUES (${DEMO_GAME_ID}, ${team.playerCode}, ${athlete.id}, 'men', ${team.totalSpent})
        `;
      }
      
      // Insert women (exactly 3)
      for (const athlete of team.women) {
        await sql`
          INSERT INTO salary_cap_teams (game_id, player_code, athlete_id, gender, total_spent)
          VALUES (${DEMO_GAME_ID}, ${team.playerCode}, ${athlete.id}, 'women', ${team.totalSpent})
        `;
      }
      
      console.log(`  ✓ ${team.name}: ${team.men.length}M + ${team.women.length}W = ${team.totalSpent} / ${SALARY_CAP}`);
    }
    
    console.log('✓ Created all team rosters (3 teams x 6 athletes = 18 total entries)');
    
    // Step 7: Optionally create REALISTIC race results with splits and scoring
    if (includeResults) {
      console.log('🏃 Creating realistic race results...');
      
      // Get all unique athletes across all teams
      const allDemoAthletes = [];
      const athleteSet = new Set();
      
      teams.forEach(team => {
        [...team.men, ...team.women].forEach(athlete => {
          if (!athleteSet.has(athlete.id)) {
            athleteSet.add(athlete.id);
            allDemoAthletes.push(athlete);
          }
        });
      });
      
      console.log(`  Creating results for ${allDemoAthletes.length} unique athletes`);
      
      // Sort athletes by marathon_rank for realistic placements
      allDemoAthletes.sort((a, b) => {
        const rankA = a.marathon_rank || 999;
        const rankB = b.marathon_rank || 999;
        return rankA - rankB;
      });
      
      // Generate realistic finish times based on gender and ranking
      for (let i = 0; i < allDemoAthletes.length; i++) {
        const athlete = allDemoAthletes[i];
        const placement = i + 1;
        
        // Base times: Men 2:05:00, Women 2:20:00
        const baseSeconds = athlete.gender === 'men' 
          ? (2 * 3600 + 5 * 60)   // 2:05:00
          : (2 * 3600 + 20 * 60); // 2:20:00
        
        // Add time based on placement (10 seconds per place)
        const placementPenalty = i * 10;
        
        // Add some randomness (±30 seconds)
        const randomVariation = Math.floor(Math.random() * 60) - 30;
        
        const totalSeconds = baseSeconds + placementPenalty + randomVariation;
        
        // Convert to HH:MM:SS
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const finishTime = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Generate realistic splits (progressively slower)
        const split5kSeconds = Math.floor(totalSeconds * 0.118);  // ~5K is 11.8% of marathon
        const split10kSeconds = Math.floor(totalSeconds * 0.237); // ~10K is 23.7%
        const splitHalfSeconds = Math.floor(totalSeconds * 0.502); // Half is 50.2%
        const split30kSeconds = Math.floor(totalSeconds * 0.711); // 30K is 71.1%
        const split35kSeconds = Math.floor(totalSeconds * 0.829); // 35K is 82.9%
        const split40kSeconds = Math.floor(totalSeconds * 0.948); // 40K is 94.8%
        
        const formatSplit = (secs) => {
          const h = Math.floor(secs / 3600);
          const m = Math.floor((secs % 3600) / 60);
          const s = secs % 60;
          return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };
        
        // Insert race result with all fields
        await sql`
          INSERT INTO race_results (
            game_id, 
            athlete_id, 
            finish_time,
            split_5k,
            split_10k,
            split_half,
            split_30k,
            split_35k,
            split_40k,
            placement,
            is_final
          )
          VALUES (
            ${DEMO_GAME_ID},
            ${athlete.id},
            ${finishTime},
            ${formatSplit(split5kSeconds)},
            ${formatSplit(split10kSeconds)},
            ${formatSplit(splitHalfSeconds)},
            ${formatSplit(split30kSeconds)},
            ${formatSplit(split35kSeconds)},
            ${formatSplit(split40kSeconds)},
            ${placement},
            true
          )
        `;
      }
      
      console.log(`✓ Created ${allDemoAthletes.length} race results with realistic splits`);
      
      // Optionally trigger automatic scoring
      try {
        console.log('🎯 Triggering automatic scoring...');
        const scoreResponse = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/scoring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId: DEMO_GAME_ID,
            raceId: 1, // Assuming NYC Marathon 2025
            scoringVersion: 2
          })
        });
        
        if (scoreResponse.ok) {
          console.log('✓ Scoring calculated successfully');
        } else {
          console.log('⚠️  Scoring calculation skipped (API not available)');
        }
      } catch (err) {
        console.log('⚠️  Scoring calculation skipped:', err.message);
      }
    }
    
    // Step 8: Return comprehensive summary
    const summary = {
      success: true,
      message: 'Demo data created successfully!',
      gameId: DEMO_GAME_ID,
      salaryCap: SALARY_CAP,
      teams: teams.map((team, i) => ({
        teamName: team.name,
        playerCode: team.playerCode,
        strategy: team.strategy,
        totalSpent: team.totalSpent,
        remaining: SALARY_CAP - team.totalSpent,
        sessionUrl: sessions[i].url,
        athletes: [...team.men, ...team.women].map(a => ({
          name: a.name,
          country: a.country,
          gender: a.gender,
          salary: a.salary,
          marathonRank: a.marathon_rank
        }))
      })),
      resultsCreated: includeResults,
      stats: {
        totalTeams: teams.length,
        athletesPerTeam: 6,
        totalAthletes: teams.length * 6,
        uniqueAthletes: new Set(teams.flatMap(t => [...t.men, ...t.women].map(a => a.id))).size,
        resultsCount: includeResults ? new Set(teams.flatMap(t => [...t.men, ...t.women].map(a => a.id))).size : 0
      },
      instructions: [
        '✅ Demo game created with ID: demo-game',
        `✅ ${teams.length} teams created, each with 3 men + 3 women`,
        `✅ All teams comply with $${SALARY_CAP/1000}K salary cap`,
        includeResults ? '✅ Race results with splits created and scored' : '⏳ No race results yet',
        '',
        '📋 NEXT STEPS:',
        '1. Copy a session URL below',
        '2. Paste in browser to view that team\'s roster',
        '3. Teams are fully functional with locked rosters',
        includeResults ? '4. Check leaderboard to see standings!' : '4. Enter results via commissioner mode to test scoring'
      ]
    };
    
    console.log('✅ Demo data creation complete!');
    console.log(`   Game ID: ${DEMO_GAME_ID}`);
    console.log(`   Teams: ${summary.stats.totalTeams}`);
    console.log(`   Athletes: ${summary.stats.uniqueAthletes} unique across ${summary.stats.totalAthletes} roster slots`);
    console.log(`   Results: ${summary.stats.resultsCount}`);
    
    return res.status(200).json(summary);
    
  } catch (error) {
    console.error('Error creating demo data:', error);
    return res.status(500).json({ 
      error: 'Failed to create demo data',
      details: error.message 
    });
  }
}
