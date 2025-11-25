/**
 * Test Salary Calculation (Standalone Version)
 * Works with athletes.json to test pricing algorithm without database
 * 
 * NORMALIZATION: Salaries are normalized per gender so that both men 
 * and women have an average salary centered around $5,000. This ensures
 * fair team building with balanced spending across genders.
 */

import { readFileSync } from 'fs';
import { join } from 'path';

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
  const { gender, pb, worldAthletics } = athlete;
  const personal_best = pb;
  const marathon_rank = worldAthletics?.marathonRank || null;
  const road_running_rank = worldAthletics?.roadRunningRank || null;
  const overall_rank = worldAthletics?.overallRank || null;
  const season_best = athlete.seasonBest || null;
  
  let score = 0;
  let factors = [];
  
  // Factor 1: Personal Best Performance (40% weight)
  const pbSeconds = convertTimeToSeconds(personal_best);
  const worldRecord = WORLD_RECORDS[gender];
  
  if (pbSeconds && worldRecord) {
    const percentOff = ((pbSeconds - worldRecord) / worldRecord) * 100;
    
    let pbScore;
    if (percentOff <= 3) {
      pbScore = 100;
    } else if (percentOff <= 6) {
      pbScore = 70 - ((percentOff - 3) * 10);
    } else if (percentOff <= 10) {
      pbScore = 40 - ((percentOff - 6) * 5);
    } else {
      pbScore = Math.max(0, 20 - ((percentOff - 10) * 2));
    }
    
    score += pbScore * 0.4;
    factors.push({ name: 'Personal Best', value: pbScore, weight: 0.4 });
  } else {
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
  const sbSeconds = convertTimeToSeconds(season_best);
  if (pbSeconds && sbSeconds) {
    const sbDiff = sbSeconds - pbSeconds;
    let sbScore;
    if (sbDiff <= 0) {
      sbScore = 100;
    } else if (sbDiff <= 60) {
      sbScore = 80 - (sbDiff * 0.33);
    } else if (sbDiff <= 180) {
      sbScore = Math.max(0, 60 - ((sbDiff - 60) * 0.5));
    } else {
      sbScore = 0;
    }
    
    score += sbScore * 0.05;
    factors.push({ name: 'Season Form', value: sbScore, weight: 0.05 });
  } else {
    factors.push({ name: 'Season Form', value: 0, weight: 0 });
  }
  
  // Handle debut athletes
  const hasPB = pbSeconds !== null;
  if (!hasPB && marathon_rank) {
    const totalRankingWeight = factors.reduce((sum, f) => {
      if (f.name !== 'Personal Best') {
        return sum + (f.value * f.weight);
      }
      return sum;
    }, 0);
    score = totalRankingWeight * 1.5;
  }
  
  // Convert score to salary with exponential curve
  // Use a balanced curve that creates good separation
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  // Power curve creates good separation between tiers
  // Use 1.2 exponent for moderate separation
  const salary = SALARY_CONFIG.minSalary + 
    (SALARY_CONFIG.maxSalary - SALARY_CONFIG.minSalary) * 
    Math.pow(normalizedScore / 100, 1.2);
  
  return {
    salary: Math.round(salary / 100) * 100,
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
 * Test salary calculation
 */
function testSalaryCalculation() {
  console.log('🔄 Testing salary calculation with gender normalization...\n');
  
  // Load athletes.json
  const athletesPath = join(process.cwd(), 'public', 'athletes.json');
  let athletesData;
  try {
    athletesData = JSON.parse(readFileSync(athletesPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Could not load athletes.json:', error.message);
    console.log('   This test requires public/athletes.json file.');
    console.log('   Run the database calculation script instead: node scripts/calculate-athlete-salaries.js');
    process.exit(1);
  }
  
  // Phase 1: Calculate raw salaries for all athletes
  const rawUpdates = {
    men: [],
    women: []
  };
  
  for (const gender of ['men', 'women']) {
    for (const athlete of athletesData[gender]) {
      const { salary: rawSalary, score } = calculateSalary({ ...athlete, gender });
      
      rawUpdates[gender].push({
        id: athlete.id,
        name: athlete.name,
        gender,
        rawSalary,
        score,
        pb: athlete.pb,
        rank: athlete.worldAthletics?.marathonRank
      });
    }
  }
  
  // Display pre-normalization statistics
  console.log('📊 PRE-NORMALIZATION STATISTICS\n');
  console.log('='.repeat(70));
  
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
  
  // Display post-normalization statistics
  console.log('📈 POST-NORMALIZATION SALARY STATISTICS\n');
  console.log('='.repeat(70));
  
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
    
    // Show top 10
    const top10 = updates
      .filter(u => u.gender === gender)
      .sort((a, b) => b.salary - a.salary)
      .slice(0, 10);
    
    console.log(`\n  Top 10 Most Expensive ${gender}:`);
    top10.forEach((u, i) => {
      const rank = u.rank ? `#${u.rank}` : 'N/A';
      console.log(`    ${(i + 1).toString().padStart(2)}. ${u.name.padEnd(28)} $${u.salary.toString().padStart(6)} (${u.pb}, Rank: ${rank})`);
    });
    
    // Show bottom 10
    const bottom10 = updates
      .filter(u => u.gender === gender)
      .sort((a, b) => a.salary - b.salary)
      .slice(0, 10);
    
    console.log(`\n  10 Least Expensive ${gender}:`);
    bottom10.forEach((u, i) => {
      const rank = u.rank ? `#${u.rank}` : 'N/A';
      console.log(`    ${(i + 1).toString().padStart(2)}. ${u.name.padEnd(28)} $${u.salary.toString().padStart(6)} (${u.pb}, Rank: ${rank})`);
    });
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('\n💡 SALARY CAP VALIDATION');
  console.log(`  Total cap per team: $${SALARY_CONFIG.totalCap.toLocaleString()}`);
  console.log(`  Team size: ${SALARY_CONFIG.teamSize} athletes (3 men + 3 women)`);
  console.log(`  Target average: $${SALARY_CONFIG.averageSalary.toLocaleString()} per athlete`);
  
  // Test sample teams
  console.log('\n📋 Sample Team Configurations:');
  const menSorted = updates.filter(u => u.gender === 'men').sort((a, b) => b.salary - a.salary);
  const womenSorted = updates.filter(u => u.gender === 'women').sort((a, b) => b.salary - a.salary);
  
  // Elite team
  const eliteTeam = [
    ...menSorted.slice(0, 3),
    ...womenSorted.slice(0, 3)
  ];
  const eliteTotal = eliteTeam.reduce((sum, a) => sum + a.salary, 0);
  console.log(`\n  1. Elite Team (Top 3 each):`);
  console.log(`     Total: $${eliteTotal.toLocaleString()}`);
  if (eliteTotal > SALARY_CONFIG.totalCap) {
    console.log(`     ⚠️  Over cap by $${(eliteTotal - SALARY_CONFIG.totalCap).toLocaleString()} - GOOD! Forces strategy.`);
  }
  eliteTeam.forEach(a => console.log(`       - ${a.name.padEnd(25)} $${a.salary.toLocaleString()}`));
  
  // Balanced team
  const balancedMen = [menSorted[0], menSorted[10], menSorted[30]];
  const balancedWomen = [womenSorted[0], womenSorted[10], womenSorted[20]];
  const balancedTeam = [...balancedMen, ...balancedWomen].filter(Boolean);
  const balancedTotal = balancedTeam.reduce((sum, a) => sum + a.salary, 0);
  console.log(`\n  2. Balanced Team (Mix of elite and value picks):`);
  console.log(`     Total: $${balancedTotal.toLocaleString()}`);
  if (balancedTotal <= SALARY_CONFIG.totalCap) {
    console.log(`     ✅ Under cap by $${(SALARY_CONFIG.totalCap - balancedTotal).toLocaleString()}`);
  }
  balancedTeam.forEach(a => console.log(`       - ${a.name.padEnd(25)} $${a.salary.toLocaleString()}`));
  
  // Value team
  const valueMen = [menSorted[5], menSorted[20], menSorted[40]];
  const valueWomen = [womenSorted[5], womenSorted[15], womenSorted[25]];
  const valueTeam = [...valueMen, ...valueWomen].filter(Boolean);
  const valueTotal = valueTeam.reduce((sum, a) => sum + a.salary, 0);
  console.log(`\n  3. Value Team (Good but not top-tier):`);
  console.log(`     Total: $${valueTotal.toLocaleString()}`);
  console.log(`     Room left: $${(SALARY_CONFIG.totalCap - valueTotal).toLocaleString()}`);
  valueTeam.forEach(a => console.log(`       - ${a.name.padEnd(25)} $${a.salary.toLocaleString()}`));
  
  // Budget team
  const budgetTeam = [
    ...menSorted.slice(-3),
    ...womenSorted.slice(-3)
  ];
  const budgetTotal = budgetTeam.reduce((sum, a) => sum + a.salary, 0);
  console.log(`\n  4. Budget Team (Bottom 3 each):`);
  console.log(`     Total: $${budgetTotal.toLocaleString()}`);
  console.log(`     Room left: $${(SALARY_CONFIG.totalCap - budgetTotal).toLocaleString()}`);
  budgetTeam.forEach(a => console.log(`       - ${a.name.padEnd(25)} $${a.salary.toLocaleString()}`));
  
  console.log('\n' + '='.repeat(70));
  console.log('\n✅ Salary calculation test complete!\n');
  
  // Check if pricing forces strategic decisions
  console.log('🎯 STRATEGIC BALANCE CHECK:');
  const canAffordAllElite = eliteTotal <= SALARY_CONFIG.totalCap;
  if (canAffordAllElite) {
    console.log('  ❌ WARNING: Can afford all elite athletes - pricing may be too low!');
  } else {
    console.log('  ✅ Cannot afford all elite athletes - forces strategic choices');
  }
  
  // Check gender balance
  console.log('\n📊 GENDER BALANCE CHECK:');
  const menAvg = stats.men.total / stats.men.count;
  const womenAvg = stats.women.total / stats.women.count;
  console.log(`  Men average: $${Math.round(menAvg).toLocaleString()} (target: $${SALARY_CONFIG.averageSalary.toLocaleString()})`);
  console.log(`  Women average: $${Math.round(womenAvg).toLocaleString()} (target: $${SALARY_CONFIG.averageSalary.toLocaleString()})`);
  
  const menDiff = Math.abs(menAvg - SALARY_CONFIG.averageSalary);
  const womenDiff = Math.abs(womenAvg - SALARY_CONFIG.averageSalary);
  
  if (menDiff < 500 && womenDiff < 500) {
    console.log('  ✅ Both genders are close to target average - good balance!');
  } else {
    if (menDiff >= 500) console.log(`  ⚠️  Men average is $${Math.round(menDiff)} off target`);
    if (womenDiff >= 500) console.log(`  ⚠️  Women average is $${Math.round(womenDiff)} off target`);
  }
  
  console.log('');
}

// Run test
testSalaryCalculation();
