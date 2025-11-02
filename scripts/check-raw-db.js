// Check raw database values for debugging
import { query } from '../pages/api/db.js';

async function checkRawValues() {
  console.log('Checking raw database values:\n');
  
  const result = await query(`
    SELECT 
      athlete_id,
      finish_time,
      finish_time_ms,
      pg_typeof(finish_time_ms)::text as ms_type,
      (finish_time_ms IS NULL) as ms_is_null,
      LENGTH(finish_time) as time_length
    FROM race_results
    WHERE game_id = 'default'
      AND finish_time IS NOT NULL
      AND athlete_id IN (
        SELECT athlete_id 
        FROM athletes 
        WHERE name LIKE '%Kipruto%' OR name LIKE '%Munyao%'
      )
    ORDER BY finish_time
  `);
  
  console.log('Raw database values:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  console.log('\nNote: ms_type should be "bigint", ms_is_null should be false if value exists');
}

checkRawValues().catch(console.error);
