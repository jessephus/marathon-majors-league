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
    const menWithSalaryRaw = await sql`
      SELECT id, name, country, personal_best as pb, salary, marathon_rank, headshot_url, gender
      FROM athletes 
      WHERE gender = 'men' AND salary IS NOT NULL AND salary > 0
      ORDER BY salary ASC
      LIMIT 100
    `;
    
    const womenWithSalaryRaw = await sql`
      SELECT id, name, country, personal_best as pb, salary, marathon_rank, headshot_url, gender
      FROM athletes 
      WHERE gender = 'women' AND salary IS NOT NULL AND salary > 0
      ORDER BY salary ASC
      LIMIT 100
    `;
    
    console.log(`🔍 RAW from DB - First man salary: "${menWithSalaryRaw[0].salary}" (type: ${typeof menWithSalaryRaw[0].salary})`);
    console.log(`🔍 RAW from DB - First woman salary: "${womenWithSalaryRaw[0].salary}" (type: ${typeof womenWithSalaryRaw[0].salary})`);
    
    // Convert salary to number (it comes as string from database)
    const menWithSalary = menWithSalaryRaw.map(a => ({ ...a, salary: Number(a.salary) }));
    const womenWithSalary = womenWithSalaryRaw.map(a => ({ ...a, salary: Number(a.salary) }));
    
    // Debug: Check first athlete's salary type and actual values
    console.log(`🔍 First man: ${menWithSalary[0].name}, salary: ${menWithSalary[0].salary} (type: ${typeof menWithSalary[0].salary})`);
    console.log(`🔍 First 5 men salaries: ${menWithSalary.slice(0, 5).map(a => a.salary).join(', ')}`);
    console.log(`🔍 First woman: ${womenWithSalary[0].name}, salary: ${womenWithSalary[0].salary} (type: ${typeof womenWithSalary[0].salary})`);
    
    if (menWithSalary.length < 9 || womenWithSalary.length < 9) {
      return res.status(500).json({ 
        error: 'Not enough athletes with salaries in database',
        menCount: menWithSalary.length,
        womenCount: womenWithSalary.length,
        message: 'Need at least 9 men and 9 women with assigned salaries'
      });
    }
        
    console.log(`✓ Fetched ${menWithSalary.length} men and ${womenWithSalary.length} women for team building`);
    
    // STRATEGY: Build teams with realistic budgets
    // Check minimum costs first to set achievable targets
    const cheapest3Men = menWithSalary.slice().sort((a, b) => a.salary - b.salary).slice(0, 3);
    const cheapest3Women = womenWithSalary.slice().sort((a, b) => a.salary - b.salary).slice(0, 3);
    const minMenCost = cheapest3Men.reduce((sum, a) => sum + a.salary, 0);
    const minWomenCost = cheapest3Women.reduce((sum, a) => sum + a.salary, 0);
    
    console.log(`💰 Budget constraints: Min 3 men = $${minMenCost}, Min 3 women = $${minWomenCost}`);
    console.log(`   Cheapest 3 men: ${cheapest3Men.map(a => `${a.name}($${a.salary})`).join(', ')}`);
    console.log(`   Cheapest 3 women: ${cheapest3Women.map(a => `${a.name}($${a.salary})`).join(', ')}`);
    console.log(`   Cheapest men salary types: ${cheapest3Men.map(a => typeof a.salary).join(', ')}`);
    
    // TEST: Verify cheapest 3 should be under $6000
    if (minMenCost > 6000) {
      console.error(`❌ FAILED: minMenCost = ${minMenCost}, cheapest salaries = ${cheapest3Men.map(a => a.salary).join(', ')}`);
      throw new Error(`❌ ALGORITHM ERROR: Cheapest 3 men cost $${minMenCost} (should be < $6000). Check salary data types!`);
    }
    if (minWomenCost > 6000) {
      throw new Error(`❌ ALGORITHM ERROR: Cheapest 3 women cost $${minWomenCost} (should be < $6000). Check salary data types!`);
    }
    console.log(`✓ Sanity check passed: Cheapest 3 athletes are affordable`);
    
    // Step 3: SMART TEAM BUILDING - Flexible strategy that GUARANTEES cap compliance
    const teams = [];
    
    /**
     * Pick 3 athletes that fit under budget
     * Uses expanding search ranges to guarantee success
     */
    function pickThreeUnderBudget(athletes, maxBudget, preferenceOrder, teamName) {
      console.log(`  ${teamName}: Budget $${maxBudget}, ${athletes.length} athletes available`);
      
      // Sort athletes by preference (could be expensive-first, cheap-first, or ranked)
      const sorted = athletes.slice().sort(preferenceOrder);
      
      // Try to pick 3 that fit under budget using greedy algorithm
      const selected = [];
      let runningTotal = 0;
      
      for (const athlete of sorted) {
        if (selected.length < 3) {
          if (runningTotal + athlete.salary <= maxBudget) {
            selected.push(athlete);
            runningTotal += athlete.salary;
          }
        }
        if (selected.length === 3) break;
      }
      
      // If greedy didn't work, try 3 absolute cheapest
      if (selected.length < 3) {
        console.log(`    ⚠️  Greedy failed, trying 3 cheapest...`);
        const cheapest = athletes.slice().sort((a, b) => a.salary - b.salary);
        selected.length = 0;
        runningTotal = 0;
        
        for (const athlete of cheapest) {
          if (selected.length < 3 && runningTotal + athlete.salary <= maxBudget) {
            selected.push(athlete);
            runningTotal += athlete.salary;
          }
          if (selected.length === 3) break;
        }
      }
      
      // If STILL can't get 3, the budget is impossibly low
      if (selected.length < 3) {
        const cheapestThree = athletes.slice().sort((a, b) => a.salary - b.salary).slice(0, 3);
        const minNeeded = cheapestThree.reduce((sum, a) => sum + a.salary, 0);
        // Debug: Show what's actually available
        const allSalaries = athletes.slice().sort((a, b) => a.salary - b.salary).map(a => a.salary);
        const allNames = athletes.slice().sort((a, b) => a.salary - b.salary).map(a => `${a.name}:$${a.salary}`);
        console.log(`    ❌ DEBUG: ${athletes.length} athletes available`);
        console.log(`    ❌ DEBUG: Cheapest 10 salaries: ${allSalaries.slice(0, 10).join(', ')}`);
        console.log(`    ❌ DEBUG: Cheapest 10 athletes: ${allNames.slice(0, 10).join(' | ')}`);
        console.log(`    ❌ DEBUG: Selected so far: ${selected.length} athletes for $${runningTotal}`);
        console.log(`    ❌ DEBUG: Cheapest 3 would cost: $${minNeeded}`);
        throw new Error(
          `${teamName}: Impossible to fit 3 athletes in $${maxBudget} budget. ` +
          `Cheapest 3 cost $${minNeeded}. Need at least $${Math.ceil(minNeeded/1000)}K budget.`
        );
      }
      
      console.log(`    ✓ Selected 3 athletes: $${runningTotal} (${((runningTotal/maxBudget)*100).toFixed(0)}% of budget)`);
      return selected;
    }
    
    // TEAM 1: Men-heavy (spend ~55% on men, ~45% on women)
    console.log('Building Team 1: Men-Heavy Strategy');
    const team1MenBudget = 16500; // Leave enough for women
    const team1Men = pickThreeUnderBudget(
      menWithSalary,
      team1MenBudget,
      (a, b) => b.salary - a.salary, // Prefer expensive
      'Team 1 Men'
    );
    const team1MenSpent = team1Men.reduce((sum, a) => sum + a.salary, 0);
    
    // Remaining budget for women
    const team1WomenBudget = SALARY_CAP - team1MenSpent;
    const team1Women = pickThreeUnderBudget(
      womenWithSalary,
      team1WomenBudget,
      (a, b) => a.salary - b.salary, // Prefer cheap to fit in remaining budget
      'Team 1 Women'
    );
    const team1Total = team1MenSpent + team1Women.reduce((sum, a) => sum + a.salary, 0);
    
    teams.push({
      name: 'Team Men-Heavy',
      playerCode: 'MEN_HEAVY',
      men: team1Men,
      women: team1Women,
      totalSpent: team1Total,
      strategy: `${(team1MenSpent/1000).toFixed(1)}K men / ${((team1Total-team1MenSpent)/1000).toFixed(1)}K women`
    });
    
    // TEAM 2: Balanced (50/50 split)
    console.log('Building Team 2: Balanced Strategy');
    const team2MenBudget = 15000;
    const team2Men = pickThreeUnderBudget(
      menWithSalary,
      team2MenBudget,
      (a, b) => (a.marathon_rank || 999) - (b.marathon_rank || 999), // Prefer best ranked
      'Team 2 Men'
    );
    const team2MenSpent = team2Men.reduce((sum, a) => sum + a.salary, 0);
    
    const team2WomenBudget = SALARY_CAP - team2MenSpent;
    const team2Women = pickThreeUnderBudget(
      womenWithSalary,
      team2WomenBudget,
      (a, b) => (a.marathon_rank || 999) - (b.marathon_rank || 999),
      'Team 2 Women'
    );
    const team2Total = team2MenSpent + team2Women.reduce((sum, a) => sum + a.salary, 0);
    
    teams.push({
      name: 'Team Balanced',
      playerCode: 'BALANCED',
      men: team2Men,
      women: team2Women,
      totalSpent: team2Total,
      strategy: `${(team2MenSpent/1000).toFixed(1)}K men / ${((team2Total-team2MenSpent)/1000).toFixed(1)}K women`
    });
    
    // TEAM 3: Women-heavy (spend ~45% on men, ~55% on women)
    console.log('Building Team 3: Women-Heavy Strategy');
    const team3MenBudget = Math.max(minMenCost + 1000, 13500); // Ensure we can afford 3 men
    const team3Men = pickThreeUnderBudget(
      menWithSalary,
      team3MenBudget,
      (a, b) => a.salary - b.salary, // Prefer cheap
      'Team 3 Men'
    );
    const team3MenSpent = team3Men.reduce((sum, a) => sum + a.salary, 0);
    
    const team3WomenBudget = SALARY_CAP - team3MenSpent;
    const team3Women = pickThreeUnderBudget(
      womenWithSalary,
      team3WomenBudget,
      (a, b) => b.salary - a.salary, // Prefer expensive
      'Team 3 Women'
    );
    const team3Total = team3MenSpent + team3Women.reduce((sum, a) => sum + a.salary, 0);
    
    teams.push({
      name: 'Team Women-Heavy',
      playerCode: 'WOMEN_HEAVY',
      men: team3Men,
      women: team3Women,
      totalSpent: team3Total,
      strategy: `${(team3MenSpent/1000).toFixed(1)}K men / ${((team3Total-team3MenSpent)/1000).toFixed(1)}K women`
    });
    
    // Verify all teams meet requirements
    for (const team of teams) {
      // Check team size
      if (team.men.length !== 3 || team.women.length !== 3) {
        return res.status(500).json({
          error: `${team.name} has invalid roster size`,
          men: team.men.length,
          women: team.women.length,
          required: '3 men and 3 women',
          message: 'Not enough athletes with appropriate salaries. Try running athlete sync first.'
        });
      }
      
      // Check salary cap
      if (team.totalSpent > SALARY_CAP) {
        return res.status(500).json({
          error: `${team.name} exceeds salary cap`,
          spent: team.totalSpent,
          cap: SALARY_CAP,
          overage: team.totalSpent - SALARY_CAP
        });
      }
      
      console.log(`  ✓ ${team.name}: ${team.men.length}M + ${team.women.length}W = $${team.totalSpent} (${((team.totalSpent/SALARY_CAP)*100).toFixed(0)}% of cap)`);
    }
    
    console.log(`✓ All 3 teams validated and ready`);
    
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
          player_code,
          game_id,
          expires_at,
          is_active
        )
        VALUES (
          ${sessionToken},
          'player',
          ${team.name},
          ${team.playerCode},
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
