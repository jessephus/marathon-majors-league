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
 * TWO-PHASE IMPORT WORKFLOW:
 * ─────────────────────────────────────────────────────────────────────────────
 * Phase 1: This script creates athlete database entries from CSV/JSON data
 *   - Attempts World Athletics enrichment (headshots, verified data, rankings)
 *   - If enrichment fails (athlete not found or low similarity match < 70%):
 *     → Creates BAREBONES database entry with CSV data only (name, country, gender)
 *     → Entry uses default values: PB = 2:30:00, no WA ID, no rankings
 *     → ⚠️ Commissioner must enrich these entries in Phase 2
 * 
 * Phase 2: Post-import enrichment (for athletes missing World Athletics IDs)
 *   - Option A (Manual): Use inline WA ID editor in athlete management panel
 *   - Option B (Batch):  Run: python scripts/enrich-missing-wa-ids.py
 * 
 * ℹ️  The script will clearly log when enrichment fails and an athlete is created
 *     with barebones data. Check the console output for ⚠️ warnings.
 * ─────────────────────────────────────────────────────────────────────────────
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
import * as cheerio from 'cheerio';

// Load environment variables
dotenv.config();

// Configuration
const DATABASE_URL = process.env.DATABASE_URL;
const WA_BASE_URL = 'https://worldathletics.org';
const WA_SEARCH_URL = 'https://worldathletics.org/athletes/search';
const WA_HEADSHOT_URL_TEMPLATE = 'https://media.aws.iaaf.org/athletes/{id}.jpg';

// Constants
const NAME_SIMILARITY_THRESHOLD = 0.7; // 70% similarity required for match
const DEFAULT_PERSONAL_BEST = '2:30:00'; // Default PB for athletes without data
const WA_REQUEST_DELAY_MS = 2000; // Delay between WA requests (rate limiting - 2 seconds like Python script)
const WA_PROFILE_DELAY_MS = 3000; // Delay between profile fetches (3 seconds like Python script)
const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout for HTTP requests
const IMAGE_TEST_TIMEOUT_MS = 5000; // 5 second timeout for image accessibility tests

/**
 * Helper function to get next command-line argument with validation
 */
function getNextArg(args, i, argName) {
  if (i + 1 >= args.length) {
    console.error(`Error: ${argName} requires a value`);
    process.exit(1);
  }
  return args[i + 1];
}

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
      options.file = getNextArg(args, i, '--file');
      i++;
      break;
    case '--race-id':
    case '-r':
      const raceIdStr = getNextArg(args, i, '--race-id');
      options.raceId = parseInt(raceIdStr, 10);
      if (isNaN(options.raceId)) {
        console.error(`Error: --race-id must be a valid integer, got: ${raceIdStr}`);
        process.exit(1);
      }
      i++;
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
 * Normalize World Athletics ID by removing leading zeros
 * (matches normalize_wa_id from Python sync script)
 */
function normalizeWaId(waId) {
  if (!waId) return waId;
  const normalized = String(waId).replace(/^0+/, '');
  return normalized || '0'; // Keep '0' if the ID is all zeros
}

/**
 * Test if an image URL is accessible
 * (matches test_image_accessible from Python sync script)
 */
async function testImageAccessible(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), IMAGE_TEST_TIMEOUT_MS);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    // If HEAD fails, try GET with streaming
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), IMAGE_TEST_TIMEOUT_MS);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return response.ok;
    } catch (err) {
      return false;
    }
  }
}

/**
 * Get placeholder image URL based on gender
 * (matches get_placeholder_url from Python sync script)
 */
function getPlaceholderUrl(gender) {
  const genderLower = (gender || 'men').toLowerCase();
  if (genderLower.includes('women') || genderLower.includes('woman')) {
    return '/images/woman-runner.png';
  }
  return '/images/man-runner.png';
}

/**
 * Delay execution for rate limiting
 */
async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Search World Athletics for athlete by name using HTML scraping
 * (replaces broken GraphQL searchWorldAthletes function)
 */
async function searchWorldAthletics(name, gender) {
  console.log(`    🔍 Searching World Athletics for: ${name} (${gender})`);
  
  try {
    // Construct search URL
    const searchUrl = `${WA_SEARCH_URL}?q=${encodeURIComponent(name)}`;
    
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    const response = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MMFL-Bulk-Confirm/1.0)'
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.error(`    ⚠️  WA search failed: HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Parse search results from HTML
    // World Athletics search page structure: athlete cards with data attributes
    const results = [];
    
    $('[data-athlete-id]').each((i, elem) => {
      const $elem = $(elem);
      const athleteId = $elem.attr('data-athlete-id');
      const athleteName = $elem.find('.athlete-name').text().trim() || 
                          $elem.find('h3').text().trim() ||
                          $elem.text().trim();
      const athleteCountry = $elem.find('.athlete-country').text().trim() || 
                            $elem.attr('data-country') || '';
      
      if (athleteId && athleteName) {
        results.push({
          worldAthleticsId: normalizeWaId(athleteId),
          name: athleteName,
          country: athleteCountry,
          element: $elem.html()
        });
      }
    });
    
    // If no structured results found, try alternative parsing
    if (results.length === 0) {
      // Look for athlete links in search results
      $('a[href*="/athletes/"]').each((i, elem) => {
        const $elem = $(elem);
        const href = $elem.attr('href');
        const athleteName = $elem.text().trim();
        
        // Extract athlete ID from URL pattern: /athletes/{country}/{name}-{id}
        const match = href.match(/\/athletes\/[^\/]+\/[^-]+-(\d+)/);
        if (match && athleteName) {
          const athleteId = match[1];
          const countryMatch = href.match(/\/athletes\/([A-Z]{3})\//i);
          const athleteCountry = countryMatch ? countryMatch[1].toUpperCase() : '';
          
          results.push({
            worldAthleticsId: normalizeWaId(athleteId),
            name: athleteName,
            country: athleteCountry,
            profileUrl: `${WA_BASE_URL}${href}`
          });
        }
      });
    }

    if (results.length === 0) {
      console.log(`    ⚠️  No results found on World Athletics for: ${name}`);
      console.log(`    💡 Athlete will be created with barebones data (CSV info only)`);
      return null;
    }

    // Find best match by name similarity
    let bestMatch = null;
    let bestScore = 0;

    for (const athlete of results) {
      const score = nameSimilarity(name, athlete.name);
      
      if (score > bestScore) {
        bestScore = score;
        bestMatch = athlete;
      }
    }

    // Only return if similarity is high enough
    if (bestScore > NAME_SIMILARITY_THRESHOLD) {
      console.log(`    ✓ Found match: ${bestMatch.name} (ID: ${bestMatch.worldAthleticsId}, similarity: ${(bestScore * 100).toFixed(1)}%)`);
      
      // Add delay for rate limiting (like Python script)
      await delay(WA_REQUEST_DELAY_MS);
      
      return {
        worldAthleticsId: bestMatch.worldAthleticsId,
        name: bestMatch.name,
        country: bestMatch.country || 'UNK',
        profileUrl: bestMatch.profileUrl,
        similarity: bestScore
      };
    }

    // Similarity below threshold - no confident match
    console.log(`    ⚠️  Best match similarity too low: ${(bestScore * 100).toFixed(1)}% < ${(NAME_SIMILARITY_THRESHOLD * 100).toFixed(0)}% threshold`);
    console.log(`    💡 Athlete will be created with barebones data (CSV info only)`);

    console.log(`    ⚠️  No match above threshold (${(NAME_SIMILARITY_THRESHOLD * 100)}%)`);
    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`    ❌ WA search timeout after ${REQUEST_TIMEOUT_MS}ms`);
    } else {
      console.error(`    ❌ WA search error: ${error.message}`);
    }
    return null;
  }
}

/**
 * Enrich athlete with World Athletics profile data using HTML scraping
 * (replaces broken GraphQL enrichAthleteProfile function)
 */
async function enrichAthleteProfile(athleteId, gender, profileUrl) {
  console.log(`    📄 Fetching profile for athlete ID: ${athleteId}`);
  
  try {
    const normalizedId = normalizeWaId(athleteId);
    
    // Construct profile URL if not provided
    let url = profileUrl;
    if (!url) {
      // We don't have enough info to construct URL without country and name
      // This will be handled when we have search results
      console.log(`    ⚠️  No profile URL provided, cannot fetch profile`);
      return null;
    }
    
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MMFL-Bulk-Confirm/1.0)'
      }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      console.error(`    ⚠️  Profile fetch failed: HTTP ${response.status}`);
      return null;
    }

    const html = await response.text();
    
    // First try to extract data from __NEXT_DATA__ JSON (like Python script)
    const jsonMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/);
    
    if (jsonMatch) {
      try {
        const nextData = JSON.parse(jsonMatch[1]);
        const competitor = nextData?.props?.pageProps?.competitor;
        
        if (competitor) {
          const enriched = {
            world_athletics_id: normalizedId,
            profile_url: url
          };
          
          // Test if World Athletics headshot is accessible
          const waHeadshotUrl = WA_HEADSHOT_URL_TEMPLATE.replace('{id}', normalizedId);
          const isHeadshotAccessible = await testImageAccessible(waHeadshotUrl);
          
          if (isHeadshotAccessible) {
            enriched.headshot_url = waHeadshotUrl;
            console.log(`    ✓ Headshot URL verified`);
          } else {
            enriched.headshot_url = getPlaceholderUrl(gender);
            console.log(`    ⚠️  WA headshot unavailable - using placeholder`);
          }
          
          // Extract world rankings
          const worldRankings = competitor.worldRankings?.current || [];
          for (const ranking of worldRankings) {
            const eventGroup = (ranking.eventGroup || '').toLowerCase();
            const place = ranking.place;
            
            if (place) {
              if (eventGroup.includes('marathon')) {
                enriched.marathon_rank = place;
                console.log(`    ✓ Marathon rank: #${place}`);
              } else if (eventGroup.includes('road running')) {
                enriched.road_running_rank = place;
                console.log(`    ✓ Road Running rank: #${place}`);
              } else if (eventGroup.includes('overall')) {
                enriched.overall_rank = place;
                console.log(`    ✓ Overall rank: #${place}`);
              }
            }
          }
          
          // Extract personal bests
          const personalBests = competitor.personalBests?.results || [];
          for (const pb of personalBests) {
            if (pb.discipline === 'Marathon') {
              enriched.personal_best = pb.mark;
              console.log(`    ✓ Personal best: ${pb.mark}`);
              break;
            }
          }
          
          // Extract season best
          const seasonBests = competitor.seasonBests?.results || [];
          for (const sb of seasonBests) {
            if (sb.discipline === 'Marathon') {
              enriched.season_best = sb.mark;
              console.log(`    ✓ Season best: ${sb.mark}`);
              break;
            }
          }
          
          // Extract basic info
          const basicData = competitor.basicData || {};
          if (basicData.birthDate) {
            const birthDateStr = basicData.birthDate;
            try {
              // Try parsing ISO format first (YYYY-MM-DD)
              let birthDate = new Date(birthDateStr);
              
              // Calculate age
              if (!isNaN(birthDate.getTime())) {
                const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
                enriched.age = age;
                enriched.date_of_birth = birthDate.toISOString().split('T')[0];
                console.log(`    ✓ Age: ${age}`);
              }
            } catch (err) {
              console.log(`    ⚠️  Could not parse birth date: ${birthDateStr}`);
            }
          }
          
          // Add delay for rate limiting (like Python script - longer for profiles)
          await delay(WA_PROFILE_DELAY_MS);
          
          return enriched;
        }
      } catch (jsonError) {
        console.log(`    ⚠️  Failed to parse __NEXT_DATA__ JSON, trying fallback...`);
        // Fall through to HTML fallback
      }
    }
    
    // Fallback: parse HTML directly (like fetch_profile_fallback in Python script)
    const $ = cheerio.load(html);
    const enriched = {
      world_athletics_id: normalizedId
    };
    
    // Test headshot
    const waHeadshotUrl = WA_HEADSHOT_URL_TEMPLATE.replace('{id}', normalizedId);
    const isHeadshotAccessible = await testImageAccessible(waHeadshotUrl);
    
    if (isHeadshotAccessible) {
      enriched.headshot_url = waHeadshotUrl;
      console.log(`    ✓ Headshot URL verified (fallback)`);
    } else {
      enriched.headshot_url = getPlaceholderUrl(gender);
      console.log(`    ⚠️  WA headshot unavailable - using placeholder (fallback)`);
    }
    
    // Try to extract rankings from HTML text
    const htmlText = $.text();
    const marathonRankMatch = htmlText.match(/#(\d+)\s+(?:Man's|Woman's)\s+marathon/i);
    if (marathonRankMatch) {
      enriched.marathon_rank = parseInt(marathonRankMatch[1], 10);
      console.log(`    ✓ Marathon rank (fallback): #${marathonRankMatch[1]}`);
    }
    
    const roadRankMatch = htmlText.match(/#(\d+)\s+(?:Man's|Woman's)\s+road\s+running/i);
    if (roadRankMatch) {
      enriched.road_running_rank = parseInt(roadRankMatch[1], 10);
      console.log(`    ✓ Road Running rank (fallback): #${roadRankMatch[1]}`);
    }
    
    // Add delay for rate limiting
    await delay(WA_PROFILE_DELAY_MS);
    
    return enriched;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`    ❌ Profile fetch timeout after ${REQUEST_TIMEOUT_MS}ms`);
    } else {
      console.error(`    ❌ Profile fetch error: ${error.message}`);
    }
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
      ? WA_HEADSHOT_URL_TEMPLATE.replace('{id}', enrichData.worldAthleticsId)
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

            // Small delay for rate limiting between profile fetches
            await delay(WA_PROFILE_DELAY_MS);
          } else {
            console.log(`    ⚠️  Not found on World Athletics`);
            console.log(`    💡 Creating barebones entry - enrich later via:`);
            console.log(`       1. UI: Inline WA ID editor in athlete management panel`);
            console.log(`       2. Script: python scripts/enrich-missing-wa-ids.py`);
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
