/**
 * Migration: Add Salary Values to Athletes Table
 * 
 * This script:
 * 1. Adds the salary column if it doesn't exist
 * 2. Calculates and assigns salary values to all athletes
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  console.log('💡 Tip: Run `vercel env pull` to get environment variables');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// World record references
// Note: Ruth Chepngetich's 2:09:56 removed due to PED ban
// Using Tigst Assefa's 2:11:53 as women's reference
const WORLD_RECORDS = {
  men: convertTimeToSeconds('2:00:35'),
  women: convertTimeToSeconds('2:11:53')
};

const SALARY_CONFIG = {
  minSalary: 1500,
  maxSalary: 14000
};

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

function calculateSalary(athlete) {
  const { gender, personal_best, marathon_rank, road_running_rank, overall_rank, season_best } = athlete;
  
  let score = 0;
  
  // Factor 1: Personal Best (40% weight)
  const pbSeconds = convertTimeToSeconds(personal_best);
  const worldRecord = WORLD_RECORDS[gender];
  
  if (pbSeconds && worldRecord) {
    const percentOff = ((pbSeconds - worldRecord) / worldRecord) * 100;
    let pbScore;
    if (percentOff <= 3) pbScore = 100;
    else if (percentOff <= 6) pbScore = 70 - ((percentOff - 3) * 10);
    else if (percentOff <= 10) pbScore = 40 - ((percentOff - 6) * 5);
    else pbScore = Math.max(0, 20 - ((percentOff - 10) * 2));
    score += pbScore * 0.4;
  }
  
  // Factor 2: Marathon Ranking (30% weight)
  if (marathon_rank) {
    let rankScore;
    if (marathon_rank <= 10) rankScore = 100;
    else if (marathon_rank <= 25) rankScore = 90 - ((marathon_rank - 10) * 2);
    else if (marathon_rank <= 50) rankScore = 60 - ((marathon_rank - 25) * 1.2);
    else if (marathon_rank <= 100) rankScore = 30 - ((marathon_rank - 50) * 0.4);
    else rankScore = Math.max(0, 10 - ((marathon_rank - 100) * 0.05));
    score += rankScore * 0.3;
  }
  
  // Factor 3: Road Running Ranking (15% weight)
  if (road_running_rank) {
    let rrScore;
    if (road_running_rank <= 10) rrScore = 100;
    else if (road_running_rank <= 50) rrScore = 80 - ((road_running_rank - 10) * 1.5);
    else if (road_running_rank <= 100) rrScore = 40 - ((road_running_rank - 50) * 0.6);
    else rrScore = Math.max(0, 10 - ((road_running_rank - 100) * 0.05));
    score += rrScore * 0.15;
  }
  
  // Factor 4: Overall Ranking (10% weight)
  if (overall_rank) {
    let overallScore;
    if (overall_rank <= 100) overallScore = 100 - overall_rank * 0.8;
    else if (overall_rank <= 500) overallScore = Math.max(0, 20 - ((overall_rank - 100) * 0.04));
    else overallScore = 0;
    score += overallScore * 0.1;
  }
  
  // Factor 5: Season Best (5% weight)
  const sbSeconds = convertTimeToSeconds(season_best);
  if (pbSeconds && sbSeconds) {
    const sbDiff = sbSeconds - pbSeconds;
    let sbScore;
    if (sbDiff <= 0) sbScore = 100;
    else if (sbDiff <= 60) sbScore = 80 - (sbDiff * 0.33);
    else if (sbDiff <= 180) sbScore = Math.max(0, 60 - ((sbDiff - 60) * 0.5));
    else sbScore = 0;
    score += sbScore * 0.05;
  }
  
  // Handle debut athletes
  if (!pbSeconds && marathon_rank) {
    score *= 1.5;
  }
  
  // Convert to salary
  const normalizedScore = Math.max(0, Math.min(100, score));
  const salary = SALARY_CONFIG.minSalary + 
    (SALARY_CONFIG.maxSalary - SALARY_CONFIG.minSalary) * 
    Math.pow(normalizedScore / 100, 1.2);
  
  return Math.round(salary / 100) * 100;
}

async function migrateSalaries() {
  console.log('🔄 Starting salary migration...\n');
  
  try {
    // Check if salary column exists
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'athletes' AND column_name = 'salary'
    `;
    
    if (columns.length === 0) {
      console.log('📝 Adding salary column to athletes table...');
      await sql`
        ALTER TABLE athletes 
        ADD COLUMN salary INTEGER DEFAULT 5000
      `;
      console.log('✅ Salary column added\n');
    } else {
      console.log('✅ Salary column already exists\n');
    }
    
    // Get all athletes
    const athletes = await sql`
      SELECT id, name, gender, personal_best, season_best,
             marathon_rank, road_running_rank, overall_rank
      FROM athletes
      ORDER BY gender, marathon_rank NULLS LAST
    `;
    
    console.log(`📊 Processing ${athletes.length} athletes...\n`);
    
    let updated = 0;
    for (const athlete of athletes) {
      const salary = calculateSalary(athlete);
      
      await sql`
        UPDATE athletes
        SET salary = ${salary}
        WHERE id = ${athlete.id}
      `;
      
      updated++;
      if (updated % 10 === 0) {
        console.log(`  Processed ${updated}/${athletes.length} athletes...`);
      }
    }
    
    console.log(`\n✅ Updated ${updated} athletes with salary values\n`);
    
    // Show some statistics
    const stats = await sql`
      SELECT 
        gender,
        COUNT(*) as count,
        MIN(salary) as min_salary,
        MAX(salary) as max_salary,
        ROUND(AVG(salary)) as avg_salary
      FROM athletes
      GROUP BY gender
    `;
    
    console.log('📈 Salary Statistics:');
    console.log('='.repeat(60));
    stats.forEach(stat => {
      console.log(`\n${stat.gender.toUpperCase()}:`);
      console.log(`  Count: ${stat.count}`);
      console.log(`  Range: $${stat.min_salary.toLocaleString()} - $${stat.max_salary.toLocaleString()}`);
      console.log(`  Average: $${stat.avg_salary.toLocaleString()}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Migration completed successfully!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateSalaries();
