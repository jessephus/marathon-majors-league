#!/usr/bin/env node

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkFinishTime() {
  const result = await sql`
    SELECT 
      a.name,
      rr.finish_time,
      length(rr.finish_time) as time_length,
      rr.finish_time_ms
    FROM race_results rr
    JOIN athletes a ON rr.athlete_id = a.id
    WHERE rr.game_id = 'default'
      AND a.name LIKE '%MUNYAO%'
  `;
  
  console.log('Alexander MUNYAO finish time details:');
  console.log(JSON.stringify(result[0], null, 2));
  
  // Test the conversion function
  const { timeStringToMs } = await import('../pages/api/scoring-engine.js');
  const testTime = result[0].finish_time;
  const converted = timeStringToMs(testTime);
  console.log(`\nManual conversion test:`);
  console.log(`Input: "${testTime}"`);
  console.log(`Output: ${converted} ms`);
}

checkFinishTime();
