import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function checkMunyaoTime() {
    const [result] = await sql`
        SELECT 
            a.name,
            rr.finish_time,
            LENGTH(rr.finish_time) as time_length,
            rr.finish_time_ms,
            rr.time_gap_seconds,
            rr.placement
        FROM race_results rr
        JOIN athletes a ON a.id = rr.athlete_id
        WHERE rr.game_id = 'default'
          AND a.name LIKE '%Munyao%'
    `;
    
    console.log('Munyao\'s current data:');
    console.log(JSON.stringify(result, null, 2));
}

checkMunyaoTime().catch(console.error);
