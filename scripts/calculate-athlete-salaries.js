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
 * 
 * NORMALIZATION: Salaries are normalized per gender so that both men 
 * and women have an average salary centered around $5,000. This ensures
 * fair team building with balanced spending across genders.
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

// Check for dry-run flag
const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

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
  minSalary: 1500,
  maxSalary: 14000
};

// Excluded athletes (due to suspensions, etc.)
const EXCLUDED_ATHLETE_IDS = [
  '14766298'  // Ruth Chepngetich - PED suspension
];

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
  
  // Convert score (0-100) to salary ($1.5k-$14k)
  // Use power curve to create separation between tiers
  const normalizedScore = Math.max(0, Math.min(100, score));
  const salary = SALARY_CONFIG.minSalary + 
    (SALARY_CONFIG.maxSalary - SALARY_CONFIG.minSalary) * 
    Math.pow(normalizedScore / 100, 1.2); // Moderate exponential curve
  
  return {
    salary: Math.round(salary / 100) * 100, // Round to nearest $100
    score: normalizedScore,
    factors
  };
}

/**
 * Normalize salaries within a group to have the target average salary
 * while preserving relative ordering and respecting min/max bounds.
 * 
 * This uses a scaling approach that:
 * 1. Shifts salaries so the current average matches the target average
 * 2. Preserves relative ordering of athletes
 * 3. Clamps final values to min/max salary bounds
 * 4. Re-rounds to nearest $100
 */
function normalizeSalaries(athletes, targetAverage = SALARY_CONFIG.averageSalary) {
  if (athletes.length === 0) return athletes;
  
  // Calculate current average
  const currentTotal = athletes.reduce((sum, a) => sum + a.rawSalary, 0);
  const currentAverage = currentTotal / athletes.length;
  
  if (currentAverage === 0) return athletes;
  
  // Calculate scale factor to achieve target average
  const scaleFactor = targetAverage / currentAverage;
  
  // Apply scaling and clamp to bounds
  return athletes.map(athlete => {
    const scaledSalary = athlete.rawSalary * scaleFactor;
    
    // Clamp to min/max bounds
    const clampedSalary = Math.max(
      SALARY_CONFIG.minSalary,
      Math.min(SALARY_CONFIG.maxSalary, scaledSalary)
    );
    
    // Round to nearest $100
    const finalSalary = Math.round(clampedSalary / 100) * 100;
    
    return {
      ...athlete,
      salary: finalSalary
    };
  });
}

/**
 * Main function to update all athlete salaries
 */
async function updateAthleteSalaries() {
  if (isDryRun) {
    console.log('🧪 DRY RUN MODE - No database changes will be made\n');
  }
  console.log('🔄 Calculating athlete salaries...\n');
  
  try {
    // Get all athletes (excluding suspended/banned athletes)
    const athletes = await sql`
      SELECT id, name, gender, personal_best, season_best, 
             marathon_rank, road_running_rank, overall_rank, world_athletics_id
      FROM athletes
      WHERE world_athletics_id != ALL(${EXCLUDED_ATHLETE_IDS})
      ORDER BY gender, marathon_rank NULLS LAST
    `;
    
    console.log(`📊 Found ${athletes.length} athletes`);
    console.log(`   (Excluding ${EXCLUDED_ATHLETE_IDS.length} suspended athlete(s))\n`);
    
    // Phase 1: Calculate raw salaries for all athletes
    const rawUpdates = {
      men: [],
      women: []
    };
    
    for (const athlete of athletes) {
      const { salary: rawSalary, score, factors } = calculateSalary(athlete);
      
      rawUpdates[athlete.gender].push({
        id: athlete.id,
        name: athlete.name,
        gender: athlete.gender,
        rawSalary,
        score
      });
    }
    
    // Display pre-normalization statistics
    console.log('📊 PRE-NORMALIZATION STATISTICS\n');
    console.log('=' .repeat(60));
    
    for (const gender of ['men', 'women']) {
      const genderAthletes = rawUpdates[gender];
      if (genderAthletes.length === 0) continue;
      
      const total = genderAthletes.reduce((sum, a) => sum + a.rawSalary, 0);
      const avg = total / genderAthletes.length;
      const sorted = genderAthletes.map(a => a.rawSalary).sort((a, b) => b - a);
      const median = sorted[Math.floor(sorted.length / 2)];
      const min = Math.min(...sorted);
      const max = Math.max(...sorted);
      
      console.log(`\n${gender.toUpperCase()} (Raw, before normalization):`);
      console.log(`  Count: ${genderAthletes.length}`);
      console.log(`  Average: $${Math.round(avg).toLocaleString()}`);
      console.log(`  Median: $${median.toLocaleString()}`);
      console.log(`  Range: $${min.toLocaleString()} - $${max.toLocaleString()}`);
    }
    
    // Phase 2: Normalize salaries per gender to target $5,000 average
    console.log('\n\n🔧 APPLYING GENDER NORMALIZATION...');
    console.log(`   Target average per gender: $${SALARY_CONFIG.averageSalary.toLocaleString()}\n`);
    
    const normalizedMen = normalizeSalaries(rawUpdates.men);
    const normalizedWomen = normalizeSalaries(rawUpdates.women);
    const updates = [...normalizedMen, ...normalizedWomen];
    
    // Calculate final statistics
    const stats = {
      men: { total: 0, count: 0, min: Infinity, max: -Infinity, salaries: [] },
      women: { total: 0, count: 0, min: Infinity, max: -Infinity, salaries: [] }
    };
    
    for (const update of updates) {
      const genderStats = stats[update.gender];
      genderStats.total += update.salary;
      genderStats.count++;
      genderStats.min = Math.min(genderStats.min, update.salary);
      genderStats.max = Math.max(genderStats.max, update.salary);
      genderStats.salaries.push(update.salary);
    }
    
    // Update database
    if (isDryRun) {
      console.log('🧪 DRY RUN: Skipping database updates...\n');
    } else {
      console.log('💾 Updating database...\n');
      
      for (const update of updates) {
        await sql`
          UPDATE athletes
          SET salary = ${update.salary}
          WHERE id = ${update.id}
        `;
      }
      
      console.log('✅ All salaries updated!\n');
    }
    
    // Display post-normalization statistics
    console.log('📈 POST-NORMALIZATION SALARY STATISTICS\n');
    console.log('=' .repeat(60));
    
    for (const gender of ['men', 'women']) {
      const genderStats = stats[gender];
      if (genderStats.count === 0) continue;
      
      const avg = genderStats.total / genderStats.count;
      const sorted = [...genderStats.salaries].sort((a, b) => b - a);
      const median = sorted[Math.floor(sorted.length / 2)];
      
      console.log(`\n${gender.toUpperCase()}:`);
      console.log(`  Count: ${genderStats.count}`);
      console.log(`  Average: $${Math.round(avg).toLocaleString()} (target: $${SALARY_CONFIG.averageSalary.toLocaleString()})`);
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
    
    if (isDryRun) {
      console.log('\n🧪 Dry run complete! No changes were made to the database.');
      console.log('   To apply these changes, run: node scripts/calculate-athlete-salaries.js\n');
    } else {
      console.log('\n✅ Salary calculation complete!\n');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run the script
updateAthleteSalaries();
