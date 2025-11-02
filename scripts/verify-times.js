#!/usr/bin/env node

/**
 * Verify finish_time_ms values for the top finishers
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function verifyTimes() {
  console.log('🔍 Checking finish_time_ms values for top finishers...\n');
  
  try {
    const results = await sql`
      SELECT 
        a.name,
        rr.finish_time,
        rr.finish_time_ms,
        rr.placement,
        rr.total_points
      FROM race_results rr
      JOIN athletes a ON rr.athlete_id = a.id
      WHERE rr.game_id = 'default'
        AND rr.finish_time IS NOT NULL
      ORDER BY rr.finish_time_ms ASC NULLS LAST
      LIMIT 5
    `;
    
    console.log('Top 5 finishers (sorted by finish_time_ms):');
    console.log('━'.repeat(80));
    results.forEach((r, i) => {
      console.log(`${i + 1}. ${r.name}`);
      console.log(`   finish_time: ${r.finish_time}`);
      console.log(`   finish_time_ms: ${r.finish_time_ms}`);
      console.log(`   placement: ${r.placement}`);
      console.log(`   total_points: ${r.total_points}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyTimes();
