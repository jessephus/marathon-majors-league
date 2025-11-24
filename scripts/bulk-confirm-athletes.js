#!/usr/bin/env node

/**
 * Bulk Athlete Confirmation Tool for Commissioners
 * 
 * This script allows commissioners to bulk confirm athletes for a race by:
 * 1. Parsing a CSV or JSON file with athlete names
 * 2. Matching names to existing athletes in the database
 * 3. Creating new athletes and enriching with World Athletics data if not found
 * 4. Confirming all athletes for the specified race
 * 
 * Usage:
 *   node scripts/bulk-confirm-athletes.js --file athletes.csv --race-id 1
 *   node scripts/bulk-confirm-athletes.js --file athletes.json --race-id 1
 *   node scripts/bulk-confirm-athletes.js --dry-run --file athletes.csv --race-id 1
 * 
 * File Formats:
 * 
 * CSV format (with header):
 *   name,gender,country
 *   Eliud Kipchoge,men,KEN
 *   Sifan Hassan,women,NED
 * 
 * JSON format:
 *   [
 *     { "name": "Eliud Kipchoge", "gender": "men", "country": "KEN" },
 *     { "name": "Sifan Hassan", "gender": "women", "country": "NED" }
 *   ]
 * 
 * Required Environment Variables:
 *   DATABASE_URL - Neon Postgres connection string
 * 
 * Options:
 *   --file, -f      Path to CSV or JSON file (required)
 *   --race-id, -r   Race ID to confirm athletes for (required)
 *   --dry-run       Show what would happen without making changes
 *   --create-new    Create new athletes if not found (default: true)
 *   --no-enrich     Skip World Athletics enrichment for new athletes
 *   --help, -h      Show this help message
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const WA_GRAPHQL_URL = 'https://graphql-prod-4746.prod.aws.worldathletics.org/graphql';
const WA_GRAPHQL_HEADERS = {
  'Content-Type': 'application/json',
  'x-api-key': 'da2-fcprvsdozzce5dx2baifenjwpu',
  'x-amz-user-agent': 'aws-amplify/3.0.2'
};

// Constants
const NAME_SIMILARITY_THRESHOLD = 0.7; // 70% similarity required for match
const DEFAULT_PERSONAL_BEST = '2:30:00'; // Default PB for athletes without data
const WA_API_DELAY_MS = 1000; // Delay between WA API requests (rate limiting)

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  file: null,
  raceId: null,
  dryRun: false,
  createNew: true,
  enrich: true,
  help: false
};

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  switch (arg) {
    case '--file':
    case '-f':
      if (i + 1 >= args.length) {
        console.error('Error: --file requires a value');
        process.exit(1);
      }
      options.file = args[++i];
      break;
    case '--race-id':
    case '-r':
      if (i + 1 >= args.length) {
        console.error('Error: --race-id requires a value');
        process.exit(1);
      }
      options.raceId = parseInt(args[++i], 10);
      break;
    case '--dry-run':
      options.dryRun = true;
      break;
    case '--create-new':
      options.createNew = true;
      break;
    case '--no-enrich':
      options.enrich = false;
      break;
    case '--help':
    case '-h':
      options.help = true;
      break;
  }
}

// Show help
if (options.help || !options.file || !options.raceId) {
  console.log(`
Bulk Athlete Confirmation Tool for Commissioners

Usage:
  node scripts/bulk-confirm-athletes.js --file athletes.csv --race-id 1
  node scripts/bulk-confirm-athletes.js --file athletes.json --race-id 1

Options:
  --file, -f      Path to CSV or JSON file (required)
  --race-id, -r   Race ID to confirm athletes for (required)
  --dry-run       Show what would happen without making changes
  --create-new    Create new athletes if not found (default: true)
  --no-enrich     Skip World Athletics enrichment for new athletes
  --help, -h      Show this help message

File Formats:

CSV format (with header):
  name,gender,country
  Eliud Kipchoge,men,KEN
  Sifan Hassan,women,NED

JSON format:
  [
    { "name": "Eliud Kipchoge", "gender": "men", "country": "KEN" },
    { "name": "Sifan Hassan", "gender": "women", "country": "NED" }
  ]

Environment Variables:
  DATABASE_URL - Neon Postgres connection string (required)
  `);
  process.exit(options.help ? 0 : 1);
}

// Validate environment
if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL environment variable not set');
  console.error('   Create a .env file with: DATABASE_URL=postgresql://...');
  process.exit(1);
}

/**
 * Normalize athlete name for matching
 */
function normalizeName(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize whitespace
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two names (0-1, higher is better)
 */
function nameSimilarity(name1, name2) {
  const norm1 = normalizeName(name1);
  const norm2 = normalizeName(name2);
  
  // Exact match
  if (norm1 === norm2) return 1.0;
  
  // Calculate Levenshtein similarity
  const maxLen = Math.max(norm1.length, norm2.length);
  const distance = levenshteinDistance(norm1, norm2);
  return 1 - (distance / maxLen);
}

/**
 * Parse CSV file
 */
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header and one data row');
  }

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIdx = header.indexOf('name');
  const genderIdx = header.indexOf('gender');
  const countryIdx = header.indexOf('country');

  if (nameIdx === -1 || genderIdx === -1) {
    throw new Error('CSV must have "name" and "gender" columns');
  }

  const athletes = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',').map(c => c.trim());
    const athlete = {
      name: cols[nameIdx],
      gender: cols[genderIdx],
      country: countryIdx !== -1 ? cols[countryIdx] : null
    };

    if (athlete.name && athlete.gender) {
      athletes.push(athlete);
    }
  }

  return athletes;
}

/**
 * Parse JSON file
 */
function parseJSON(content) {
  const data = JSON.parse(content);
  if (!Array.isArray(data)) {
    throw new Error('JSON must be an array of athlete objects');
  }

  const athletes = [];
  for (const item of data) {
    if (item.name && item.gender) {
      athletes.push({
        name: item.name,
        gender: item.gender,
        country: item.country || null
      });
    }
  }

  return athletes;
}

/**
 * Load athletes from file
 */
function loadAthletesFromFile(filePath) {
  const content = readFileSync(resolve(filePath), 'utf-8');
  const ext = filePath.toLowerCase().split('.').pop();

  if (ext === 'csv') {
    return parseCSV(content);
  } else if (ext === 'json') {
    return parseJSON(content);
  } else {
    throw new Error(`Unsupported file format: ${ext}. Use .csv or .json`);
  }
}

/**
 * Search World Athletics for athlete by name
 */
async function searchWorldAthletics(name, gender) {
  const query = `
    query SearchCompetitors($query: String!) {
      searchCompetitors(query: $query, gender: "${gender === 'women' ? 'f' : 'm'}") {
        aaAthleteId
        givenName
        familyName
        birthDate
        country
        disciplines
      }
    }
  `;

  try {
    const response = await fetch(WA_GRAPHQL_URL, {
      method: 'POST',
      headers: WA_GRAPHQL_HEADERS,
      body: JSON.stringify({
        query,
        variables: { query: name }
      })
    });

    if (!response.ok) {
      console.error(`    ⚠️  WA search failed: HTTP ${response.status}`);
      return null;
    }

    const data = await response.json();
    const results = data.data?.searchCompetitors || [];

    if (results.length === 0) {
      return null;
    }

    // Find best match by name similarity
    let bestMatch = null;
    let bestScore = 0;

    for (const athlete of results) {
      const fullName = `${athlete.givenName} ${athlete.familyName}`;
      const score = nameSimilarity(name, fullName);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = athlete;
      }
    }

    // Only return if similarity is high enough
    if (bestScore > NAME_SIMILARITY_THRESHOLD) {
      return {
        worldAthleticsId: bestMatch.aaAthleteId,
        name: `${bestMatch.givenName} ${bestMatch.familyName}`,
        country: bestMatch.country,
        dateOfBirth: bestMatch.birthDate,
        similarity: bestScore
      };
    }

    return null;
  } catch (error) {
    console.error(`    ⚠️  WA search error: ${error.message}`);
    return null;
  }
}

/**
 * Enrich athlete with World Athletics profile data
 */
async function enrichAthleteProfile(athleteId, gender) {
  const query = `
    query GetCompetitor($id: Int!) {
      getSingleCompetitor(id: $id) {
        basicData {
          firstName
          lastName
          birthDate
        }
        personalBests {
          results {
            discipline
            mark
            venue
            date
          }
        }
        seasonBests {
          results {
            discipline
            mark
            venue
            date
          }
        }
        worldRankings {
          current {
            eventGroup
            place
          }
        }
      }
    }
  `;

  try {
    const response = await fetch(WA_GRAPHQL_URL, {
      method: 'POST',
      headers: WA_GRAPHQL_HEADERS,
      body: JSON.stringify({
        query,
        variables: { id: parseInt(athleteId, 10) }
      })
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const competitor = data.data?.getSingleCompetitor;

    if (!competitor) {
      return null;
    }

    const enriched = {};

    // Extract personal best for marathon
    const marathonPB = competitor.personalBests?.results?.find(
      pb => pb.discipline?.toLowerCase().includes('marathon')
    );
    if (marathonPB) {
      enriched.personalBest = marathonPB.mark;
    }

    // Extract season best for marathon
    const marathonSB = competitor.seasonBests?.results?.find(
      sb => sb.discipline?.toLowerCase().includes('marathon')
    );
    if (marathonSB) {
      enriched.seasonBest = marathonSB.mark;
    }

    // Extract rankings
    const rankings = competitor.worldRankings?.current || [];
    for (const ranking of rankings) {
      const eventGroup = ranking.eventGroup?.toLowerCase() || '';
      if (eventGroup.includes('marathon')) {
        enriched.marathonRank = ranking.place;
      } else if (eventGroup.includes('road running')) {
        enriched.roadRunningRank = ranking.place;
      } else if (eventGroup.includes('overall')) {
        enriched.overallRank = ranking.place;
      }
    }

    // Calculate age from birth date
    if (competitor.basicData?.birthDate) {
      const birthDate = new Date(competitor.basicData.birthDate);
      const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      enriched.age = age;
      enriched.dateOfBirth = competitor.basicData.birthDate;
    }

    return enriched;
  } catch (error) {
    console.error(`    ⚠️  Profile enrichment error: ${error.message}`);
    return null;
  }
}

/**
 * Match athletes to database
 */
async function matchAthletes(sql, inputAthletes) {
  console.log('\n🔍 Matching athletes to database...\n');

  // Fetch all athletes from database
  const dbAthletes = await sql`
    SELECT id, name, gender, country, world_athletics_id, personal_best
    FROM athletes
  `;

  const results = {
    matched: [],
    notFound: [],
    ambiguous: []
  };

  for (const input of inputAthletes) {
    console.log(`  Checking: ${input.name} (${input.gender})`);

    // Filter by gender first
    const candidates = dbAthletes.filter(db => db.gender === input.gender);

    // Find matches by similarity
    const matches = [];
    for (const candidate of candidates) {
      const score = nameSimilarity(input.name, candidate.name);
      if (score > NAME_SIMILARITY_THRESHOLD) {
        matches.push({ athlete: candidate, score });
      }
    }

    if (matches.length === 0) {
      console.log(`    ❌ Not found`);
      results.notFound.push(input);
    } else if (matches.length === 1) {
      const match = matches[0];
      console.log(`    ✅ Matched to: ${match.athlete.name} (${(match.score * 100).toFixed(1)}% similar)`);
      results.matched.push({
        input,
        athlete: match.athlete,
        similarity: match.score
      });
    } else {
      // Sort by score and take best match if it's significantly better
      matches.sort((a, b) => b.score - a.score);
      const bestMatch = matches[0];
      const secondBest = matches[1];

      if (bestMatch.score - secondBest.score > 0.1) {
        // Best match is clearly better
        console.log(`    ✅ Matched to: ${bestMatch.athlete.name} (${(bestMatch.score * 100).toFixed(1)}% similar)`);
        results.matched.push({
          input,
          athlete: bestMatch.athlete,
          similarity: bestMatch.score
        });
      } else {
        // Ambiguous - multiple similar matches
        console.log(`    ⚠️  Ambiguous: multiple matches found`);
        matches.forEach(m => {
          console.log(`        - ${m.athlete.name} (${(m.score * 100).toFixed(1)}%)`);
        });
        results.ambiguous.push({
          input,
          matches: matches.map(m => ({ athlete: m.athlete, similarity: m.score }))
        });
      }
    }
  }

  return results;
}

/**
 * Create new athlete in database
 */
async function createAthlete(sql, input, enrichData) {
  const athleteData = {
    name: input.name,
    gender: input.gender,
    country: input.country || enrichData?.country || 'UNK',
    personalBest: enrichData?.personalBest || DEFAULT_PERSONAL_BEST,
    // Note: World Athletics still uses iaaf.org for media assets (legacy domain)
    headshotUrl: enrichData?.worldAthleticsId 
      ? `https://media.aws.iaaf.org/athletes/${enrichData.worldAthleticsId}.jpg`
      : null,
    worldAthleticsId: enrichData?.worldAthleticsId || null,
    marathonRank: enrichData?.marathonRank || null,
    roadRunningRank: enrichData?.roadRunningRank || null,
    overallRank: enrichData?.overallRank || null,
    age: enrichData?.age || null,
    dateOfBirth: enrichData?.dateOfBirth || null,
    seasonBest: enrichData?.seasonBest || null
  };

  const result = await sql`
    INSERT INTO athletes (
      name, country, gender, personal_best, headshot_url,
      world_athletics_id, marathon_rank, road_running_rank,
      overall_rank, age, date_of_birth, season_best
    )
    VALUES (
      ${athleteData.name}, ${athleteData.country}, ${athleteData.gender},
      ${athleteData.personalBest}, ${athleteData.headshotUrl},
      ${athleteData.worldAthleticsId}, ${athleteData.marathonRank},
      ${athleteData.roadRunningRank}, ${athleteData.overallRank},
      ${athleteData.age}, ${athleteData.dateOfBirth}, ${athleteData.seasonBest}
    )
    RETURNING id, name, country, gender
  `;

  return result[0];
}

/**
 * Confirm athletes for race
 */
async function confirmAthletesForRace(sql, athleteIds, raceId) {
  console.log(`\n✅ Confirming ${athleteIds.length} athletes for race ID ${raceId}...\n`);

  const results = {
    confirmed: [],
    alreadyConfirmed: [],
    errors: []
  };

  for (const athleteId of athleteIds) {
    try {
      const result = await sql`
        INSERT INTO athlete_races (athlete_id, race_id)
        VALUES (${athleteId}, ${raceId})
        ON CONFLICT (athlete_id, race_id) DO NOTHING
        RETURNING *
      `;

      if (result.length > 0) {
        results.confirmed.push(athleteId);
      } else {
        results.alreadyConfirmed.push(athleteId);
      }
    } catch (error) {
      results.errors.push({ athleteId, error: error.message });
    }
  }

  return results;
}

/**
 * Main execution
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   Bulk Athlete Confirmation Tool                            ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Initialize database connection
    const sql = neon(DATABASE_URL);

    // Verify race exists
    const race = await sql`
      SELECT id, name, date FROM races WHERE id = ${options.raceId}
    `;

    if (race.length === 0) {
      throw new Error(`Race with ID ${options.raceId} not found`);
    }

    console.log(`📍 Target Race: ${race[0].name} (${race[0].date})`);
    console.log(`📂 Input File: ${options.file}`);
    console.log('');

    // Load athletes from file
    console.log('📖 Loading athletes from file...\n');
    const inputAthletes = loadAthletesFromFile(options.file);
    console.log(`   Found ${inputAthletes.length} athletes in file\n`);

    // Match athletes to database
    const matchResults = await matchAthletes(sql, inputAthletes);

    console.log('\n' + '═'.repeat(64));
    console.log('📊 MATCHING SUMMARY');
    console.log('═'.repeat(64));
    console.log(`   ✅ Matched:    ${matchResults.matched.length}`);
    console.log(`   ❌ Not Found:  ${matchResults.notFound.length}`);
    console.log(`   ⚠️  Ambiguous:  ${matchResults.ambiguous.length}`);
    console.log('');

    // Handle not found athletes
    const createdAthletes = [];
    if (matchResults.notFound.length > 0 && options.createNew) {
      console.log('═'.repeat(64));
      console.log('🆕 CREATING NEW ATHLETES');
      console.log('═'.repeat(64));
      console.log('');

      for (const input of matchResults.notFound) {
        console.log(`  Creating: ${input.name} (${input.gender}, ${input.country || 'unknown country'})`);

        let enrichData = null;

        // Try to find and enrich from World Athletics
        if (options.enrich) {
          console.log(`    🔍 Searching World Athletics...`);
          const waSearch = await searchWorldAthletics(input.name, input.gender);

          if (waSearch) {
            console.log(`    ✅ Found on WA: ${waSearch.name} (${(waSearch.similarity * 100).toFixed(1)}% match)`);
            console.log(`       ID: ${waSearch.worldAthleticsId}, Country: ${waSearch.country}`);

            // Enrich with profile data
            console.log(`    📊 Fetching profile data...`);
            const profileData = await enrichAthleteProfile(waSearch.worldAthleticsId, input.gender);

            if (profileData) {
              enrichData = { ...waSearch, ...profileData };
              console.log(`    ✅ Enriched with PB: ${profileData.personalBest || 'N/A'}, Rank: ${profileData.marathonRank || 'N/A'}`);
            }

            // Small delay to be polite to WA API
            await new Promise(resolve => setTimeout(resolve, WA_API_DELAY_MS));
          } else {
            console.log(`    ⚠️  Not found on World Athletics`);
          }
        }

        if (!options.dryRun) {
          const newAthlete = await createAthlete(sql, input, enrichData);
          console.log(`    ✅ Created athlete ID ${newAthlete.id}`);
          createdAthletes.push(newAthlete);
        } else {
          console.log(`    🔍 Would create athlete: ${input.name}`);
        }

        console.log('');
      }
    }

    // Handle ambiguous matches
    if (matchResults.ambiguous.length > 0) {
      console.log('═'.repeat(64));
      console.log('⚠️  AMBIGUOUS MATCHES');
      console.log('═'.repeat(64));
      console.log('The following athletes have multiple possible matches.');
      console.log('Please manually verify or update the input file with more specific names.\n');

      for (const amb of matchResults.ambiguous) {
        console.log(`  ${amb.input.name}:`);
        amb.matches.forEach(m => {
          console.log(`    - ${m.athlete.name} (${m.athlete.country}) - ${(m.similarity * 100).toFixed(1)}% match`);
        });
        console.log('');
      }
    }

    // Collect all athlete IDs to confirm
    const athleteIdsToConfirm = [
      ...matchResults.matched.map(m => m.athlete.id),
      ...createdAthletes.map(a => a.id)
    ];

    if (athleteIdsToConfirm.length === 0) {
      console.log('❌ No athletes to confirm. Please check the input file and try again.\n');
      process.exit(1);
    }

    // Confirm athletes for race
    if (!options.dryRun) {
      const confirmResults = await confirmAthletesForRace(sql, athleteIdsToConfirm, options.raceId);

      console.log('═'.repeat(64));
      console.log('✅ CONFIRMATION SUMMARY');
      console.log('═'.repeat(64));
      console.log(`   ✅ Newly Confirmed: ${confirmResults.confirmed.length}`);
      console.log(`   ℹ️  Already Confirmed: ${confirmResults.alreadyConfirmed.length}`);
      console.log(`   ❌ Errors: ${confirmResults.errors.length}`);
      console.log('');

      if (confirmResults.errors.length > 0) {
        console.log('Errors:');
        confirmResults.errors.forEach(e => {
          console.log(`  - Athlete ID ${e.athleteId}: ${e.error}`);
        });
        console.log('');
      }
    } else {
      console.log('═'.repeat(64));
      console.log('🔍 DRY RUN - WHAT WOULD BE CONFIRMED');
      console.log('═'.repeat(64));
      console.log(`   Would confirm ${athleteIdsToConfirm.length} athletes for race ID ${options.raceId}`);
      console.log('');
    }

    // Final summary
    console.log('═'.repeat(64));
    console.log('🎉 FINAL SUMMARY');
    console.log('═'.repeat(64));
    console.log(`   Total Athletes Processed: ${inputAthletes.length}`);
    console.log(`   Successfully Matched: ${matchResults.matched.length}`);
    console.log(`   Newly Created: ${createdAthletes.length}`);
    console.log(`   Ambiguous Matches: ${matchResults.ambiguous.length}`);
    console.log(`   Failed to Process: ${matchResults.notFound.length - createdAthletes.length}`);
    console.log('');

    if (options.dryRun) {
      console.log('🔍 This was a DRY RUN. Run without --dry-run to apply changes.\n');
    } else {
      console.log('✅ Bulk confirmation complete!\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Run the script
main();
