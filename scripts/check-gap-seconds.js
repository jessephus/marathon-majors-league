import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function checkGapSeconds() {
    const results = await sql`
        SELECT 
            a.name,
            rr.finish_time,
            rr.finish_time_ms,
            rr.placement,
            rr.time_gap_seconds,
            rr.breakdown
        FROM race_results rr
        JOIN athletes a ON a.id = rr.athlete_id
        WHERE rr.game_id = 'default'
          AND (a.name LIKE '%Kipruto%' OR a.name LIKE '%Munyao%')
        ORDER BY rr.placement
    `;
    
    console.log('Gap seconds for top finishers:\n');
    results.forEach(r => {
        console.log(`${r.name}:`);
        console.log(`  finish_time: ${r.finish_time}`);
        console.log(`  finish_time_ms: ${r.finish_time_ms}`);
        console.log(`  placement: ${r.placement}`);
        console.log(`  time_gap_seconds: ${r.time_gap_seconds}`);
        console.log(`  breakdown.time_gap.gap_seconds: ${r.breakdown?.time_gap?.gap_seconds}`);
        console.log();
    });
}

checkGapSeconds().catch(console.error);
