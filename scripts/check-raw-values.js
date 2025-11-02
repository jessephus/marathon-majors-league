import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function checkRawValues() {
  console.log('Checking raw database values before any processing:\n');
  
  const result = await sql`
    SELECT 
      athlete_id,
      finish_time,
      finish_time_ms,
      pg_typeof(finish_time_ms) as ms_type,
      finish_time_ms IS NULL as ms_is_null,
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
  `;
  
  console.log('Raw database values:');
  console.log(JSON.stringify(result, null, 2));
}

checkRawValues().catch(console.error);
