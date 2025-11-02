import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function fixMunyaoTime() {
    // First find Munyao
    console.log('Finding Munyao...');
    const athletes = await sql`
        SELECT id, name FROM athletes WHERE name ILIKE '%munyao%'
    `;
    
    if (athletes.length === 0) {
        console.log('No athlete found matching "munyao"');
        return;
    }
    
    console.log('Found athletes:', athletes);
    const athleteId = athletes[0].id;
    
    // Update the finish_time to include decimal
    console.log(`\nUpdating finish_time for athlete ${athleteId}...`);
    await sql`
        UPDATE race_results
        SET finish_time = '02:08:09.03'
        WHERE game_id = 'default'
          AND athlete_id = ${athleteId}
    `;
    
    console.log('✅ Updated finish_time to 02:08:09.03');
    
    // Verify
    const [result] = await sql`
        SELECT finish_time, finish_time_ms, placement, time_gap_seconds
        FROM race_results
        WHERE game_id = 'default' AND athlete_id = ${athleteId}
    `;
    
    console.log('\nCurrent data:', result);
}

fixMunyaoTime().catch(console.error);
