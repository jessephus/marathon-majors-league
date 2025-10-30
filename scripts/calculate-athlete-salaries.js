/**
 * Calculate Athlete Salaries for Salary Cap Draft System
 * 
 * This script calculates fair contract prices for each athlete based on:
 * - Personal best time (normalized against world record)
 * - World Athletics marathon ranking
 * - Road running ranking
 * - Overall ranking
 * - Season best performance
 * - Debut status (for athletes without personal best)
 * 
 * Target: $30,000 total cap for 6 athletes = $5,000 average
 * Elite athletes should be 2-3x average ($10k-$15k)
 * Lower-tier athletes should be 0.3-0.7x average ($1.5k-$3.5k)
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// World record references for normalization
const WORLD_RECORDS = {
  men: convertTimeToSeconds('2:00:35'),    // Kelvin Kiptum
  women: convertTimeToSeconds('2:09:56')   // Tigst Assefa
};

// Salary configuration
const SALARY_CONFIG = {
  totalCap: 30000,
  teamSize: 6,
  averageSalary: 5000,
  minSalary: 1000,
  maxSalary: 15000
};

/**
 * Convert time string (H:MM:SS) to seconds
 */
function convertTimeToSeconds(timeString) {
  if (!timeString || timeString === 'N/A') return null;
  
  const parts = timeString.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
  } else if (parts.length === 2) {
    return parseInt(parts[0]) * 60 + parseInt(parts[1]);
  }
  return null;
}

/**
 * Calculate athlete salary based on multiple factors
 */
function calculateSalary(athlete) {
  const { gender, personal_best, marathon_rank, road_running_rank, overall_rank, season_best } = athlete;
  
  let score = 0;
  let factors = [];
  
  // Factor 1: Personal Best Performance (40% weight)
  // Athletes closer to world record get higher scores
  const pbSeconds = convertTimeToSeconds(personal_best);
  const worldRecord = WORLD_RECORDS[gender];
  
  if (pbSeconds && worldRecord) {
    // Calculate percentage off world record
    const percentOff = ((pbSeconds - worldRecord) / worldRecord) * 100;
    
    // Elite athletes (within 3% of WR) -> high score
    // Good athletes (3-6% off WR) -> medium score
    // Decent athletes (6-10% off WR) -> low score
    let pbScore;
    if (percentOff <= 3) {
      pbScore = 100; // Elite
    } else if (percentOff <= 6) {
      pbScore = 70 - ((percentOff - 3) * 10); // 70-40
    } else if (percentOff <= 10) {
      pbScore = 40 - ((percentOff - 6) * 5); // 40-20
    } else {
      pbScore = Math.max(0, 20 - ((percentOff - 10) * 2)); // 20-0
    }
    
    score += pbScore * 0.4;
    factors.push({ name: 'Personal Best', value: pbScore, weight: 0.4 });
  } else {
    // No PB - will rely on rankings
    factors.push({ name: 'Personal Best', value: 0, weight: 0 });
  }
  
  // Factor 2: Marathon World Ranking (30% weight)
  if (marathon_rank) {
    let rankScore;
    if (marathon_rank <= 10) {
      rankScore = 100;
    } else if (marathon_rank <= 25) {
      rankScore = 90 - ((marathon_rank - 10) * 2);
    } else if (marathon_rank <= 50) {
      rankScore = 60 - ((marathon_rank - 25) * 1.2);
    } else if (marathon_rank <= 100) {
      rankScore = 30 - ((marathon_rank - 50) * 0.4);
    } else {
      rankScore = Math.max(0, 10 - ((marathon_rank - 100) * 0.05));
    }
    
    score += rankScore * 0.3;
    factors.push({ name: 'Marathon Rank', value: rankScore, weight: 0.3 });
  } else {
    factors.push({ name: 'Marathon Rank', value: 0, weight: 0 });
  }
  
  // Factor 3: Road Running Ranking (15% weight)
  if (road_running_rank) {
    let rrScore;
    if (road_running_rank <= 10) {
      rrScore = 100;
    } else if (road_running_rank <= 50) {
      rrScore = 80 - ((road_running_rank - 10) * 1.5);
    } else if (road_running_rank <= 100) {
      rrScore = 40 - ((road_running_rank - 50) * 0.6);
    } else {
      rrScore = Math.max(0, 10 - ((road_running_rank - 100) * 0.05));
    }
    
    score += rrScore * 0.15;
    factors.push({ name: 'Road Running Rank', value: rrScore, weight: 0.15 });
  } else {
    factors.push({ name: 'Road Running Rank', value: 0, weight: 0 });
  }
  
  // Factor 4: Overall World Ranking (10% weight)
  if (overall_rank) {
    let overallScore;
    if (overall_rank <= 100) {
      overallScore = 100 - overall_rank * 0.8;
    } else if (overall_rank <= 500) {
      overallScore = Math.max(0, 20 - ((overall_rank - 100) * 0.04));
    } else {
      overallScore = 0;
    }
    
    score += overallScore * 0.1;
    factors.push({ name: 'Overall Rank', value: overallScore, weight: 0.1 });
  } else {
    factors.push({ name: 'Overall Rank', value: 0, weight: 0 });
  }
  
  // Factor 5: Season Best vs Personal Best (5% weight)
  // Reward athletes who are performing at or near their PB this season
  const sbSeconds = convertTimeToSeconds(season_best);
  if (pbSeconds && sbSeconds) {
    const sbDiff = sbSeconds - pbSeconds;
    let sbScore;
    if (sbDiff <= 0) {
      // Season best equals or beats PB - bonus!
      sbScore = 100;
    } else if (sbDiff <= 60) {
      // Within 1 minute - still strong
      sbScore = 80 - (sbDiff * 0.33);
    } else if (sbDiff <= 180) {
      // Within 3 minutes - decent form
      sbScore = Math.max(0, 60 - ((sbDiff - 60) * 0.5));
    } else {
      sbScore = 0;
    }
    
    score += sbScore * 0.05;
    factors.push({ name: 'Season Form', value: sbScore, weight: 0.05 });
  } else {
    factors.push({ name: 'Season Form', value: 0, weight: 0 });
  }
  
  // Handle debut athletes (no PB, only rankings)
  // Redistribute weight from PB to rankings
  const hasPB = pbSeconds !== null;
  if (!hasPB) {
    // Reweight: Marathon rank (60%), RR rank (25%), Overall (15%)
    const totalRankingWeight = factors.reduce((sum, f) => {
      if (f.name !== 'Personal Best') {
        return sum + (f.value * f.weight);
      }
      return sum;
    }, 0);
    
    // Boost the score to compensate for missing PB
    if (marathon_rank) {
      score = totalRankingWeight * 1.5; // Amplify ranking importance
    }
  }
  
  // Convert score (0-100) to salary ($1k-$15k)
  // Use exponential curve to create bigger gaps between elite and average
  const normalizedScore = Math.max(0, Math.min(100, score));
  const salary = SALARY_CONFIG.minSalary + 
    (SALARY_CONFIG.maxSalary - SALARY_CONFIG.minSalary) * 
    Math.pow(normalizedScore / 100, 1.5); // Exponential curve
  
  return {
    salary: Math.round(salary / 100) * 100, // Round to nearest $100
    score: normalizedScore,
    factors
  };
}

/**
 * Main function to update all athlete salaries
 */
async function updateAthleteSalaries() {
  console.log('🔄 Calculating athlete salaries...\n');
  
  try {
    // Get all athletes
    const athletes = await sql`
      SELECT id, name, gender, personal_best, season_best, 
             marathon_rank, road_running_rank, overall_rank
      FROM athletes
      ORDER BY gender, marathon_rank NULLS LAST
    `;
    
    console.log(`📊 Found ${athletes.length} athletes\n`);
    
    // Calculate salaries
    const updates = [];
    const stats = {
      men: { total: 0, count: 0, min: Infinity, max: -Infinity, salaries: [] },
      women: { total: 0, count: 0, min: Infinity, max: -Infinity, salaries: [] }
    };
    
    for (const athlete of athletes) {
      const { salary, score, factors } = calculateSalary(athlete);
      
      updates.push({
        id: athlete.id,
        name: athlete.name,
        gender: athlete.gender,
        salary,
        score
      });
      
      // Track stats
      const genderStats = stats[athlete.gender];
      genderStats.total += salary;
      genderStats.count++;
      genderStats.min = Math.min(genderStats.min, salary);
      genderStats.max = Math.max(genderStats.max, salary);
      genderStats.salaries.push(salary);
    }
    
    // Update database
    console.log('💾 Updating database...\n');
    
    for (const update of updates) {
      await sql`
        UPDATE athletes
        SET salary = ${update.salary}
        WHERE id = ${update.id}
      `;
    }
    
    console.log('✅ All salaries updated!\n');
    
    // Display statistics
    console.log('📈 SALARY STATISTICS\n');
    console.log('=' .repeat(60));
    
    for (const gender of ['men', 'women']) {
      const genderStats = stats[gender];
      const avg = genderStats.total / genderStats.count;
      const sorted = genderStats.salaries.sort((a, b) => b - a);
      const median = sorted[Math.floor(sorted.length / 2)];
      
      console.log(`\n${gender.toUpperCase()}:`);
      console.log(`  Count: ${genderStats.count}`);
      console.log(`  Average: $${Math.round(avg).toLocaleString()}`);
      console.log(`  Median: $${median.toLocaleString()}`);
      console.log(`  Range: $${genderStats.min.toLocaleString()} - $${genderStats.max.toLocaleString()}`);
      
      // Show top 10 and bottom 10
      const top10 = updates
        .filter(u => u.gender === gender)
        .sort((a, b) => b.salary - a.salary)
        .slice(0, 10);
      
      console.log(`\n  Top 10 Most Expensive ${gender}:`);
      top10.forEach((u, i) => {
        console.log(`    ${i + 1}. ${u.name.padEnd(30)} $${u.salary.toLocaleString()}`);
      });
      
      const bottom10 = updates
        .filter(u => u.gender === gender)
        .sort((a, b) => a.salary - b.salary)
        .slice(0, 10);
      
      console.log(`\n  10 Least Expensive ${gender}:`);
      bottom10.forEach((u, i) => {
        console.log(`    ${i + 1}. ${u.name.padEnd(30)} $${u.salary.toLocaleString()}`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('\n💡 SALARY CAP VALIDATION');
    console.log(`  Total cap per team: $${SALARY_CONFIG.totalCap.toLocaleString()}`);
    console.log(`  Team size: ${SALARY_CONFIG.teamSize} athletes (3 men + 3 women)`);
    console.log(`  Target average: $${SALARY_CONFIG.averageSalary.toLocaleString()} per athlete`);
    
    // Test a few sample teams
    console.log('\n📋 Sample Balanced Teams:');
    const menSorted = updates.filter(u => u.gender === 'men').sort((a, b) => b.salary - a.salary);
    const womenSorted = updates.filter(u => u.gender === 'women').sort((a, b) => b.salary - a.salary);
    
    // Elite team (top athletes)
    const eliteTeam = [
      ...menSorted.slice(0, 3),
      ...womenSorted.slice(0, 3)
    ];
    const eliteTotal = eliteTeam.reduce((sum, a) => sum + a.salary, 0);
    console.log(`\n  Elite Team (Top 3 each): $${eliteTotal.toLocaleString()}`);
    if (eliteTotal > SALARY_CONFIG.totalCap) {
      console.log(`    ⚠️  Over cap by $${(eliteTotal - SALARY_CONFIG.totalCap).toLocaleString()}`);
    }
    
    // Balanced team (mix of ranks)
    const balancedTeam = [
      menSorted[0], menSorted[10], menSorted[30],
      womenSorted[0], womenSorted[10], womenSorted[30]
    ].filter(Boolean);
    const balancedTotal = balancedTeam.reduce((sum, a) => sum + a.salary, 0);
    console.log(`\n  Balanced Team (ranks 1, 11, 31): $${balancedTotal.toLocaleString()}`);
    
    // Budget team (lower tier)
    const budgetTeam = [
      ...menSorted.slice(-3),
      ...womenSorted.slice(-3)
    ];
    const budgetTotal = budgetTeam.reduce((sum, a) => sum + a.salary, 0);
    console.log(`\n  Budget Team (Bottom 3 each): $${budgetTotal.toLocaleString()}`);
    
    console.log('\n✅ Salary calculation complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
updateAthleteSalaries();
