import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function checkMutualExclusivity() {
    console.log('🔍 Checking Mutual Exclusivity Rule\n');
    console.log('━'.repeat(80));
    
    // Athletes who previously had all 3 bonuses (#8, #9, #10)
    const results = await sql`
        SELECT 
            a.name,
            rr.finish_time,
            rr.split_half,
            rr.performance_bonus_points,
            rr.breakdown
        FROM race_results rr
        JOIN athletes a ON a.id = rr.athlete_id
        WHERE rr.game_id = 'default'
          AND a.name IN ('Sondre Nordstad MOEN', 'Tuemay Weldlibanos TSEGAY', 'Joe Klecker')
        ORDER BY rr.finish_time_ms
    `;
    
    console.log('Athletes who previously had Negative Split + Even Pace + Fast Finish:\n');
    
    results.forEach(r => {
        console.log(`${r.name}:`);
        console.log(`  Finish: ${r.finish_time}`);
        console.log(`  Half: ${r.split_half}`);
        console.log(`  Performance Bonus Points: ${r.performance_bonus_points}`);
        console.log(`  Bonuses:`);
        
        if (r.breakdown?.performance_bonuses) {
            r.breakdown.performance_bonuses.forEach(b => {
                console.log(`    - ${b.type}: +${b.points} pts`);
            });
            
            const hasNegativeSplit = r.breakdown.performance_bonuses.some(b => b.type === 'NEGATIVE_SPLIT');
            const hasEvenPace = r.breakdown.performance_bonuses.some(b => b.type === 'EVEN_PACE');
            const hasFastFinish = r.breakdown.performance_bonuses.some(b => b.type === 'FAST_FINISH_KICK');
            
            if (hasNegativeSplit && hasEvenPace) {
                console.log(`  ❌ ERROR: Has BOTH Negative Split and Even Pace!`);
            } else if (hasNegativeSplit || hasEvenPace) {
                console.log(`  ✅ CORRECT: Has only ONE pacing bonus (${hasNegativeSplit ? 'Negative Split' : 'Even Pace'})`);
            }
            
            if (hasFastFinish) {
                console.log(`  ✅ CORRECT: Fast Finish Kick can stack`);
            }
        }
        
        console.log();
    });
}

checkMutualExclusivity().catch(console.error);
