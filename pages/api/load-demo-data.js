/**
 * Load Demo Data API
 * 
 * POST /api/load-demo-data - Creates fake game data for testing
 * 
 * This endpoint creates a COMPLETE game following DFS (Daily Fantasy Sports) rules:
 * - Creates 25 teams (each with 3M + 3W = 6 athletes)
 * - Athletes CAN appear on multiple teams (DFS-style)
 * - Each team must stay under $30K salary cap
 * - Creates proper salary_cap_teams entries
 * - Generates realistic race results with splits and scoring
 * - Test sessions for each team that work with the actual UI
 */

import { neon } from '@neondatabase/serverless';
import { randomBytes } from 'crypto';

const sql = neon(process.env.DATABASE_URL);

const DEMO_GAME_ID = 'demo-game';
const SALARY_CAP = 30000;
const NUM_TEAMS = 25; // Create 25 DFS-style teams
const NYC_MARATHON_RACE_ID = 1; // NYC Marathon 2025

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
    
    // Step 2: Get athletes CONFIRMED for NYC Marathon with salaries for team building
    const menWithSalaryRaw = await sql`
      SELECT DISTINCT a.id, a.name, a.country, a.personal_best as pb, a.salary, a.marathon_rank, a.headshot_url, a.gender
      FROM athletes a
      INNER JOIN athlete_races ar ON a.id = ar.athlete_id
      WHERE a.gender = 'men' 
        AND a.salary IS NOT NULL 
        AND a.salary > 0
        AND ar.race_id = ${NYC_MARATHON_RACE_ID}
      ORDER BY a.salary ASC
      LIMIT 100
    `;
    
    const womenWithSalaryRaw = await sql`
      SELECT DISTINCT a.id, a.name, a.country, a.personal_best as pb, a.salary, a.marathon_rank, a.headshot_url, a.gender
      FROM athletes a
      INNER JOIN athlete_races ar ON a.id = ar.athlete_id
      WHERE a.gender = 'women' 
        AND a.salary IS NOT NULL 
        AND a.salary > 0
        AND ar.race_id = ${NYC_MARATHON_RACE_ID}
      ORDER BY a.salary ASC
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
    
    // Step 3: BUILD 25 DFS-STYLE TEAMS with varied strategies
    const teams = [];
    
    /**
     * Pick 3 athletes that fit under budget
     * Uses expanding search ranges to guarantee success
     */
    function pickThreeUnderBudget(athletes, maxBudget, preferenceOrder, teamName) {
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
        throw new Error(
          `${teamName}: Impossible to fit 3 athletes in $${maxBudget} budget. ` +
          `Cheapest 3 cost $${minNeeded}.`
        );
      }
      
      return selected;
    }
    
    // Define 25 varied team strategies (DFS-style - athletes can repeat across teams)
    const teamStrategies = [
      { name: 'Ultra Premium Men', code: 'ULTRA_M', menBudget: 18000, menPref: (a,b) => b.salary - a.salary },
      { name: 'Ultra Premium Women', code: 'ULTRA_W', menBudget: 12000, womenPref: (a,b) => b.salary - a.salary },
      { name: 'Men Heavy Value', code: 'MEN_VAL', menBudget: 16500, menPref: (a,b) => b.salary - a.salary },
      { name: 'Women Heavy Value', code: 'WOM_VAL', menBudget: 13500, womenPref: (a,b) => b.salary - a.salary },
      { name: 'Balanced Elite', code: 'BAL_ELT', menBudget: 15000, menPref: (a,b) => (a.marathon_rank||999) - (b.marathon_rank||999) },
      { name: 'Balanced Budget', code: 'BAL_BUD', menBudget: 15000, menPref: (a,b) => a.salary - b.salary },
      { name: 'Men Rank Focused', code: 'MEN_RNK', menBudget: 16000, menPref: (a,b) => (a.marathon_rank||999) - (b.marathon_rank||999) },
      { name: 'Women Rank Focused', code: 'WOM_RNK', menBudget: 14000, womenPref: (a,b) => (a.marathon_rank||999) - (b.marathon_rank||999) },
      { name: 'Value Hunter', code: 'VALUE', menBudget: 14500, menPref: (a,b) => a.salary - b.salary, womenPref: (a,b) => a.salary - b.salary },
      { name: 'Top Heavy', code: 'TOP_HVY', menBudget: 17000, menPref: (a,b) => b.salary - a.salary },
      { name: 'Sleeper Squad', code: 'SLEEPER', menBudget: 13000, menPref: (a,b) => a.salary - b.salary },
      { name: 'Contrarian Pick', code: 'CONTRA', menBudget: 14000, menPref: (a,b) => Math.random() - 0.5 },
      { name: 'Safe Balanced', code: 'SAFE', menBudget: 15000, menPref: (a,b) => (a.marathon_rank||999) - (b.marathon_rank||999) },
      { name: 'Men Elite', code: 'M_ELITE', menBudget: 17500, menPref: (a,b) => (a.marathon_rank||999) - (b.marathon_rank||999) },
      { name: 'Women Elite', code: 'W_ELITE', menBudget: 12500, womenPref: (a,b) => (a.marathon_rank||999) - (b.marathon_rank||999) },
      { name: 'Mid-Range Mix', code: 'MIDMIX', menBudget: 15000, menPref: (a,b) => Math.abs(a.salary - 5000) - Math.abs(b.salary - 5000) },
      { name: 'Budget Beaters', code: 'BUDGET', menBudget: 13500, menPref: (a,b) => a.salary - b.salary },
      { name: 'Star & Scrubs M', code: 'STAR_M', menBudget: 17000, menPref: (a,b) => b.salary - a.salary },
      { name: 'Star & Scrubs W', code: 'STAR_W', menBudget: 13000, womenPref: (a,b) => b.salary - a.salary },
      { name: 'All-Around', code: 'ALLARND', menBudget: 15000, menPref: (a,b) => (a.marathon_rank||999) - (b.marathon_rank||999) },
      { name: 'Upside Play', code: 'UPSIDE', menBudget: 16000, menPref: (a,b) => b.salary - a.salary },
      { name: 'GPP Chalk', code: 'CHALK', menBudget: 15500, menPref: (a,b) => (a.marathon_rank||999) - (b.marathon_rank||999) },
      { name: 'GPP Leverage', code: 'LEVER', menBudget: 14500, menPref: (a,b) => Math.random() - 0.5 },
      { name: 'Cash Game Safe', code: 'CASH', menBudget: 15000, menPref: (a,b) => (a.marathon_rank||999) - (b.marathon_rank||999) },
      { name: 'Variance Play', code: 'VARIANCE', menBudget: 16500, menPref: (a,b) => Math.random() - 0.5 }
    ];
    
    console.log(`\n🎲 Building ${NUM_TEAMS} DFS-style teams (athletes can repeat across teams)...`);
    
    for (let i = 0; i < NUM_TEAMS; i++) {
      const strategy = teamStrategies[i];
      console.log(`\nTeam ${i+1}/${NUM_TEAMS}: ${strategy.name}`);
      
      // Pick men with their strategy
      const menBudget = strategy.menBudget;
      const men = pickThreeUnderBudget(
        menWithSalary,
        menBudget,
        strategy.menPref || ((a,b) => b.salary - a.salary),
        `${strategy.name} Men`
      );
      const menSpent = men.reduce((sum, a) => sum + a.salary, 0);
      
      // Remaining budget for women
      const womenBudget = SALARY_CAP - menSpent;
      const women = pickThreeUnderBudget(
        womenWithSalary,
        womenBudget,
        strategy.womenPref || ((a,b) => a.salary - b.salary),
        `${strategy.name} Women`
      );
      const womenSpent = women.reduce((sum, a) => sum + a.salary, 0);
      const totalSpent = menSpent + womenSpent;
      
      teams.push({
        name: strategy.name,
        playerCode: strategy.code,
        men,
        women,
        totalSpent,
        strategy: `${(menSpent/1000).toFixed(1)}K men / ${(womenSpent/1000).toFixed(1)}K women`
      });
      
      console.log(`  ✓ ${strategy.name}: $${totalSpent} total (${men.map(a => a.name).join(', ')} + ${women.map(a => a.name).join(', ')})`);
    }
    
    console.log(`\n✓ All ${NUM_TEAMS} teams built successfully`);
    
    // Verify all teams meet requirements
    for (const team of teams) {
      // Check team size
      if (team.men.length !== 3 || team.women.length !== 3) {
        return res.status(500).json({
          error: `${team.name} has invalid roster size`,
          men: team.men.length,
          women: team.women.length,
          required: '3 men and 3 women',
          message: 'Not enough athletes with appropriate salaries.'
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
    }
    
    console.log(`\n✓ All ${NUM_TEAMS} teams validated successfully`);
    
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
    
    // Step 7: Create REALISTIC race results for ALL NYC Marathon confirmed athletes
    let allNYCMen = [];
    let allNYCWomen = [];
    
    if (includeResults) {
      console.log('🏃 Creating realistic race results for ALL NYC Marathon confirmed athletes...');
      
      // Get ALL athletes confirmed for NYC Marathon (not just those on teams)
      const allNYCMenRaw = await sql`
        SELECT DISTINCT a.id, a.name, a.country, a.gender, a.marathon_rank
        FROM athletes a
        INNER JOIN athlete_races ar ON a.id = ar.athlete_id
        WHERE a.gender = 'men' 
          AND ar.race_id = ${NYC_MARATHON_RACE_ID}
        ORDER BY a.marathon_rank NULLS LAST
      `;
      
      const allNYCWomenRaw = await sql`
        SELECT DISTINCT a.id, a.name, a.country, a.gender, a.marathon_rank
        FROM athletes a
        INNER JOIN athlete_races ar ON a.id = ar.athlete_id
        WHERE a.gender = 'women' 
          AND ar.race_id = ${NYC_MARATHON_RACE_ID}
        ORDER BY a.marathon_rank NULLS LAST
      `;
      
      allNYCMen = allNYCMenRaw.map(a => ({ ...a, marathon_rank: a.marathon_rank || 999 }));
      allNYCWomen = allNYCWomenRaw.map(a => ({ ...a, marathon_rank: a.marathon_rank || 999 }));
      
      console.log(`  Found ${allNYCMen.length} men and ${allNYCWomen.length} women confirmed for NYC Marathon`);
      
      // Identify athletes on rosters for DNF/DNS assignment
      const athletesOnTeams = new Set();
      teams.forEach(team => {
        [...team.men, ...team.women].forEach(athlete => {
          athletesOnTeams.add(athlete.id);
        });
      });
      
      const rostered = Array.from(athletesOnTeams);
      
      // Select 2 different rostered athletes for DNF/DNS (for testing)
      const shuffled = rostered.sort(() => 0.5 - Math.random());
      const dnfAthlete = shuffled[0];
      const dnsAthlete = shuffled[1]; // Ensures different athlete
      
      console.log(`  Assigning DNF to athlete ID ${dnfAthlete} and DNS to athlete ID ${dnsAthlete}`);
      
      // Generate results for MEN
      for (let i = 0; i < allNYCMen.length; i++) {
        const athlete = allNYCMen[i];
        const placement = i + 1;
        
        // Check if this athlete should DNF or DNS
        if (athlete.id === dnfAthlete) {
          await sql`
            INSERT INTO race_results (
              game_id, athlete_id, finish_time, split_half, placement, is_final
            )
            VALUES (
              ${DEMO_GAME_ID}, ${athlete.id}, 'DNF', 
              '1:02:30', NULL, true
            )
          `;
          console.log(`  🚫 DNF: ${athlete.name}`);
          continue;
        }
        
        if (athlete.id === dnsAthlete) {
          await sql`
            INSERT INTO race_results (
              game_id, athlete_id, finish_time, placement, is_final
            )
            VALUES (
              ${DEMO_GAME_ID}, ${athlete.id}, 'DNS', NULL, true
            )
          `;
          console.log(`  🚫 DNS: ${athlete.name}`);
          continue;
        }
        
        // Base time for men: 2:05:00
        const baseSeconds = 2 * 3600 + 5 * 60;
        
        // Add time based on placement rank (faster progression for top athletes)
        let placementPenalty;
        if (i < 10) {
          placementPenalty = i * 5;  // Top 10: 5 seconds per place
        } else if (i < 20) {
          placementPenalty = 50 + (i - 10) * 10;  // 11-20: 10 seconds per place
        } else {
          placementPenalty = 150 + (i - 20) * 20;  // 21+: 20 seconds per place
        }
        
        // Add some randomness (±30 seconds)
        const randomVariation = Math.floor(Math.random() * 60) - 30;
        
        const totalSeconds = baseSeconds + placementPenalty + randomVariation;
        
        // Convert to HH:MM:SS
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const finishTime = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        // Generate realistic splits
        const split5kSeconds = Math.floor(totalSeconds * 0.118);
        const split10kSeconds = Math.floor(totalSeconds * 0.237);
        const splitHalfSeconds = Math.floor(totalSeconds * 0.502);
        const split30kSeconds = Math.floor(totalSeconds * 0.711);
        const split35kSeconds = Math.floor(totalSeconds * 0.829);
        const split40kSeconds = Math.floor(totalSeconds * 0.948);
        
        const formatSplit = (secs) => {
          const h = Math.floor(secs / 3600);
          const m = Math.floor((secs % 3600) / 60);
          const s = secs % 60;
          return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };
        
        await sql`
          INSERT INTO race_results (
            game_id, athlete_id, finish_time,
            split_5k, split_10k, split_half, split_30k, split_35k, split_40k,
            placement, is_final
          )
          VALUES (
            ${DEMO_GAME_ID}, ${athlete.id}, ${finishTime},
            ${formatSplit(split5kSeconds)}, ${formatSplit(split10kSeconds)},
            ${formatSplit(splitHalfSeconds)}, ${formatSplit(split30kSeconds)},
            ${formatSplit(split35kSeconds)}, ${formatSplit(split40kSeconds)},
            ${placement}, true
          )
        `;
      }
      
      console.log(`  ✓ Generated results for ${allNYCMen.length} men`);
      
      // Generate results for WOMEN
      for (let i = 0; i < allNYCWomen.length; i++) {
        const athlete = allNYCWomen[i];
        const placement = i + 1;
        
        // Check if this athlete should DNF or DNS
        if (athlete.id === dnfAthlete) {
          await sql`
            INSERT INTO race_results (
              game_id, athlete_id, finish_time, split_half, placement, is_final
            )
            VALUES (
              ${DEMO_GAME_ID}, ${athlete.id}, 'DNF', 
              '1:10:00', NULL, true
            )
          `;
          console.log(`  🚫 DNF: ${athlete.name}`);
          continue;
        }
        
        if (athlete.id === dnsAthlete) {
          await sql`
            INSERT INTO race_results (
              game_id, athlete_id, finish_time, placement, is_final
            )
            VALUES (
              ${DEMO_GAME_ID}, ${athlete.id}, 'DNS', NULL, true
            )
          `;
          console.log(`  🚫 DNS: ${athlete.name}`);
          continue;
        }
        
        // Base time for women: 2:20:00
        const baseSeconds = 2 * 3600 + 20 * 60;
        
        // Add time based on placement rank
        let placementPenalty;
        if (i < 10) {
          placementPenalty = i * 5;
        } else if (i < 20) {
          placementPenalty = 50 + (i - 10) * 10;
        } else {
          placementPenalty = 150 + (i - 20) * 20;
        }
        
        const randomVariation = Math.floor(Math.random() * 60) - 30;
        const totalSeconds = baseSeconds + placementPenalty + randomVariation;
        
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const finishTime = `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        const split5kSeconds = Math.floor(totalSeconds * 0.118);
        const split10kSeconds = Math.floor(totalSeconds * 0.237);
        const splitHalfSeconds = Math.floor(totalSeconds * 0.502);
        const split30kSeconds = Math.floor(totalSeconds * 0.711);
        const split35kSeconds = Math.floor(totalSeconds * 0.829);
        const split40kSeconds = Math.floor(totalSeconds * 0.948);
        
        const formatSplit = (secs) => {
          const h = Math.floor(secs / 3600);
          const m = Math.floor((secs % 3600) / 60);
          const s = secs % 60;
          return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        };
        
        await sql`
          INSERT INTO race_results (
            game_id, athlete_id, finish_time,
            split_5k, split_10k, split_half, split_30k, split_35k, split_40k,
            placement, is_final
          )
          VALUES (
            ${DEMO_GAME_ID}, ${athlete.id}, ${finishTime},
            ${formatSplit(split5kSeconds)}, ${formatSplit(split10kSeconds)},
            ${formatSplit(splitHalfSeconds)}, ${formatSplit(split30kSeconds)},
            ${formatSplit(split35kSeconds)}, ${formatSplit(split40kSeconds)},
            ${placement}, true
          )
        `;
      }
      
      console.log(`  ✓ Generated results for ${allNYCWomen.length} women`);
      console.log(`  ✓ Total results: ${allNYCMen.length + allNYCWomen.length} (includes 1 DNF, 1 DNS)`);
      
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
    const totalResultsCount = includeResults ? (allNYCMen.length + allNYCWomen.length) : 0;
    
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
        resultsCount: totalResultsCount,
        menResults: includeResults ? allNYCMen.length : 0,
        womenResults: includeResults ? allNYCWomen.length : 0
      },
      instructions: [
        '✅ Demo game created with ID: demo-game',
        `✅ ${teams.length} teams created, each with 3 men + 3 women`,
        `✅ All teams comply with $${SALARY_CAP/1000}K salary cap`,
        includeResults ? `✅ Race results created for ALL ${totalResultsCount} NYC Marathon athletes (${allNYCMen.length} men, ${allNYCWomen.length} women)` : '⏳ No race results yet',
        includeResults ? '✅ Includes 1 DNF and 1 DNS for testing' : '',
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
    console.log(`   Results: ${summary.stats.resultsCount} (${summary.stats.menResults} men, ${summary.stats.womenResults} women)`);
    
    return res.status(200).json(summary);
    
  } catch (error) {
    console.error('Error creating demo data:', error);
    return res.status(500).json({ 
      error: 'Failed to create demo data',
      details: error.message 
    });
  }
}
