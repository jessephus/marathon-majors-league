import { readFileSync, writeFileSync } from 'fs';
import { setTimeout as sleep } from 'timers/promises';

/**
 * Fetch athlete rankings from their World Athletics profile page
 * This script uses the athlete IDs we already have to fetch detailed ranking data
 */

const DELAY_MS = 2000; // 2 seconds between requests
const TIMEOUT_MS = 15000; // 15 second timeout

async function fetchAthleteRankings(athleteId, profileUrl, name) {
    console.log(`\nFetching rankings for ${name} (ID: ${athleteId})...`);
    
    const controller = new AbortController();
    const timeoutId = global.setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    try {
        const response = await fetch(profileUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': `Mozilla/5.0 (Node/${Date.now()})`,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'close',
                'Cache-Control': 'no-cache'
            }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.log(`  ❌ HTTP ${response.status} - ${response.statusText}`);
            return null;
        }
        
        const html = await response.text();
        
        // The World Athletics page embeds JSON data in window.__NEXT_DATA__
        // This contains the worldRankings object with current rankings
        // Use a more permissive regex to capture the entire JSON object
        const jsonMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
        
        if (!jsonMatch) {
            console.log(`  ⚠️  No __NEXT_DATA__ script tag found in page`);
            return null;
        }
        
        try {
            const nextData = JSON.parse(jsonMatch[1]);
            
            //The data is in props.apolloState (Apollo Client cache)
            const apolloState = nextData?.props?.apolloState;
            
            if (!apolloState) {
                console.log(`  ⚠️  No apolloState found`);
                return null;
            }
            
            // Debug: show what keys exist
            const apolloKeys = Object.keys(apolloState);
            console.log(`  🔍 apolloState keys:`, apolloKeys);
            
            // Check if it's nested in the ROOT_QUERY
            const rootQuery = apolloState.ROOT_QUERY || apolloState['ROOT_QUERY'];
            if (rootQuery) {
                console.log(`  🔍 ROOT_QUERY keys:`, Object.keys(rootQuery).slice(0, 10));
            }
            
            // Try the competitor data from pageProps
            const competitor = nextData?.props?.pageProps?.competitor;
            if (competitor) {
                console.log(`  ✓ Found competitor data in pageProps`);
                const worldRankings = competitor.worldRankings;
                if (!worldRankings || !worldRankings.current) {
                    console.log(`  ⚠️  No worldRankings.current in competitor`);
                    return null;
                }
                
                const currentRankings = worldRankings.current;
                console.log(`  📊 Found ${currentRankings.length} current rankings`);
                
                // Debug: show all available ranking types
                console.log(`  🔍 Available rankings:`, currentRankings.map(r => r.eventGroup).join(', '));
                
                const rankings = {};
                
                // Look for marathon, road running, and overall rankings
                for (const ranking of currentRankings) {
                    if (ranking.eventGroup && ranking.eventGroup.includes('Marathon')) {
                        rankings.marathonRank = ranking.place;
                        console.log(`  ✓ Marathon rank: #${rankings.marathonRank}`);
                    } else if (ranking.eventGroup && ranking.eventGroup.includes('Road Running')) {
                        rankings.roadRunningRank = ranking.place;
                        console.log(`  ✓ Road Running rank: #${rankings.roadRunningRank}`);
                    } else if (ranking.eventGroup && ranking.eventGroup.includes('Overall')) {
                        // We can also store overall ranking if we want
                        rankings.overallRank = ranking.place;
                        console.log(`  ✓ Overall rank: #${rankings.overallRank}`);
                    }
                }
                
                // If no rankings found, return null
                if (!rankings.marathonRank) {
                    console.log(`  ⚠️  No marathon ranking found for ${name}`);
                    return null;
                }
                
                return rankings;
            } else {
                console.log(`  ⚠️  No competitor data found in pageProps`);
                return null;
            }
            
        } catch (e) {
            console.log(`  ❌ Failed to parse JSON: ${e.message}`);
            return null;
        }
        
    } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.log(`  ⏱️  Timeout after ${TIMEOUT_MS}ms`);
        } else {
            console.log(`  ❌ Error: ${error.message}`);
        }
        return null;
    }
}

async function main() {
    console.log('='.repeat(70));
    console.log('World Athletics Rankings Fetcher');
    console.log('='.repeat(70));
    
    // Load current athletes data
    const athletesPath = './athletes.json';
    const athletesData = JSON.parse(readFileSync(athletesPath, 'utf-8'));
    
    // Create backup
    const backupPath = `./athletes.json.backup-${Date.now()}`;
    writeFileSync(backupPath, JSON.stringify(athletesData, null, 2));
    console.log(`\n✓ Backup created: ${backupPath}\n`);
    
    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;
    
    // Process both men and women
    for (const gender of ['men', 'women']) {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`Processing ${gender.toUpperCase()}`);
        console.log('='.repeat(70));
        
        for (const athlete of athletesData[gender]) {
            // Skip if no World Athletics data
            if (!athlete.worldAthletics?.id || !athlete.worldAthletics?.profileUrl) {
                console.log(`\n⏭️  Skipping ${athlete.name} - No World Athletics data`);
                skipCount++;
                continue;
            }
            
            // Skip if already has ranking data
            if (athlete.worldAthletics.marathonRank || athlete.worldAthletics.roadRunningRank) {
                console.log(`\n⏭️  Skipping ${athlete.name} - Already has rankings`);
                skipCount++;
                continue;
            }
            
            // Fetch rankings
            const rankings = await fetchAthleteRankings(
                athlete.worldAthletics.id,
                athlete.worldAthletics.profileUrl,
                athlete.name
            );
            
            if (rankings) {
                // Add rankings to athlete data
                if (rankings.marathonRank) {
                    athlete.worldAthletics.marathonRank = rankings.marathonRank;
                }
                if (rankings.roadRunningRank) {
                    athlete.worldAthletics.roadRunningRank = rankings.roadRunningRank;
                }
                successCount++;
            } else {
                failCount++;
            }
            
            // Delay between requests
            await sleep(DELAY_MS);
        }
    }
    
    // Save updated data
    writeFileSync(athletesPath, JSON.stringify(athletesData, null, 2));
    
    console.log('\n' + '='.repeat(70));
    console.log('SUMMARY');
    console.log('='.repeat(70));
    console.log(`✓ Successfully enriched: ${successCount} athletes`);
    console.log(`⏭️  Skipped: ${skipCount} athletes`);
    console.log(`❌ Failed: ${failCount} athletes`);
    console.log('\n✓ athletes.json updated with ranking data');
    console.log(`✓ Backup saved to: ${backupPath}\n`);
}

main().catch(console.error);
