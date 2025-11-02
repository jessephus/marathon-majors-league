import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function auditPerformanceBonuses() {
    console.log('🔍 Auditing Performance Bonuses\n');
    console.log('━'.repeat(80));
    
    // Get all results with split data
    const results = await sql`
        SELECT 
            a.name,
            a.gender,
            rr.finish_time,
            rr.split_half,
            rr.split_40k,
            rr.finish_time_ms,
            rr.performance_bonus_points,
            rr.breakdown,
            rr.placement
        FROM race_results rr
        JOIN athletes a ON a.id = rr.athlete_id
        WHERE rr.game_id = 'default'
          AND rr.finish_time IS NOT NULL
        ORDER BY rr.finish_time_ms
        LIMIT 10
    `;
    
    console.log(`\nTop 10 Finishers - Split Time Analysis:\n`);
    
    results.forEach((r, i) => {
        console.log(`${i + 1}. ${r.name} (${r.gender})`);
        console.log(`   Finish: ${r.finish_time}`);
        console.log(`   Half: ${r.split_half || 'N/A'}`);
        console.log(`   40K: ${r.split_40k || 'N/A'}`);
        console.log(`   Performance Bonus Points: ${r.performance_bonus_points || 0}`);
        
        if (r.breakdown?.performance_bonuses) {
            console.log(`   Bonuses in breakdown:`, r.breakdown.performance_bonuses);
        } else {
            console.log(`   ⚠️  No performance_bonuses in breakdown`);
        }
        
        // Calculate if they should have negative split
        if (r.split_half && r.finish_time) {
            const halfTimeMs = timeToMs(r.split_half);
            const finishTimeMs = r.finish_time_ms;
            const secondHalfMs = finishTimeMs - halfTimeMs;
            
            console.log(`   First half: ${r.split_half} (${halfTimeMs}ms)`);
            console.log(`   Second half: ${msToTime(secondHalfMs)} (${secondHalfMs}ms)`);
            
            if (secondHalfMs < halfTimeMs) {
                console.log(`   ✅ SHOULD HAVE NEGATIVE SPLIT (+2 pts) - second half faster!`);
            } else {
                console.log(`   ❌ No negative split - second half slower`);
            }
        }
        
        console.log();
    });
}

function timeToMs(timeStr) {
    if (!timeStr) return 0;
    const parts = timeStr.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const seconds = parseFloat(parts[2]);
    return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
}

function msToTime(ms) {
    const totalSeconds = ms / 1000;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

auditPerformanceBonuses().catch(console.error);
