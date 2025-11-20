/**
 * Test Context System
 * 
 * Provides a context object that tracks all resources created during a test
 * and ensures they are cleaned up, even if the test fails.
 * 
 * This replaces pattern-matching cleanup with explicit resource tracking.
 * 
 * Usage:
 * 
 * import { TestContext } from './test-context.js';
 * 
 * describe('My Test Suite', () => {
 *   let testCtx;
 * 
 *   beforeEach(() => {
 *     testCtx = new TestContext('my-test');
 *   });
 * 
 *   afterEach(async () => {
 *     await testCtx.cleanup();
 *   });
 * 
 *   it('should do something', async () => {
 *     // Create resources - they are tracked automatically
 *     const gameId = await testCtx.createGame({ players: [] });
 *     const sessionId = await testCtx.createSession('player', 'Test User');
 *     
 *     // ... test code ...
 *     
 *     // Cleanup happens automatically in afterEach
 *   });
 * });
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

/**
 * TestContext - Tracks all resources created during a test
 */
export class TestContext {
  constructor(testName) {
    this.testName = testName;
    this.timestamp = Date.now();
    this.randomId = crypto.randomBytes(4).toString('hex');
    
    // Track all created resources by ID
    this.createdResources = {
      games: [],           // game_id values
      sessions: [],        // session IDs (integer primary keys)
      athletes: [],        // athlete IDs  
      races: [],           // race IDs
      athleteRaces: [],    // athlete_races IDs
      salaryCapTeams: [],  // salary_cap_teams IDs
      draftTeams: [],      // draft_teams IDs (deprecated)
      playerRankings: [],  // player_rankings IDs (deprecated)
      raceResults: [],     // race_results IDs
      athleteProgression: [], // athlete_progression IDs
      athleteRaceResults: []  // athlete_race_results IDs
    };
    
    // Lazy-load database connection
    this._sql = null;
  }
  
  /**
   * Get database connection
   */
  get sql() {
    if (!this._sql) {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL environment variable is required');
      }
      this._sql = neon(process.env.DATABASE_URL);
    }
    return this._sql;
  }
  
  /**
   * Generate a unique ID for this test context
   */
  generateId(prefix = '') {
    const parts = [
      prefix || this.testName,
      this.timestamp,
      this.randomId
    ].filter(Boolean);
    return parts.join('-');
  }
  
  /**
   * Create a game and track it for cleanup
   */
  async createGame(gameData = {}) {
    const gameId = this.generateId('test-game');
    
    const defaultData = {
      game_id: gameId,
      players: gameData.players || [],
      draft_complete: gameData.draft_complete || false,
      results_finalized: gameData.results_finalized || false,
      roster_lock_time: gameData.roster_lock_time || null,
      commissioner_password: gameData.commissioner_password || 'kipchoge'
    };
    
    await this.sql`
      INSERT INTO games (
        game_id, players, draft_complete, results_finalized, 
        roster_lock_time, commissioner_password
      )
      VALUES (
        ${defaultData.game_id},
        ${defaultData.players},
        ${defaultData.draft_complete},
        ${defaultData.results_finalized},
        ${defaultData.roster_lock_time},
        ${defaultData.commissioner_password}
      )
    `;
    
    this.createdResources.games.push(gameId);
    return gameId;
  }
  
  /**
   * Create an anonymous session and track it for cleanup
   */
  async createSession(sessionType, displayName, gameId = null) {
    const result = await this.sql`
      SELECT * FROM create_anonymous_session(
        ${sessionType}::VARCHAR,
        ${displayName}::VARCHAR,
        ${gameId}::VARCHAR,
        NULL, -- player_code
        NULL, -- ip_address
        NULL, -- user_agent
        90    -- expiry_days
      )
    `;
    
    if (!result || result.length === 0) {
      throw new Error('Failed to create anonymous session');
    }
    
    // Get the session ID from the token
    const token = result[0].session_token;
    const sessionData = await this.sql`
      SELECT id FROM anonymous_sessions WHERE session_token = ${token}
    `;
    
    if (sessionData && sessionData.length > 0) {
      this.createdResources.sessions.push(sessionData[0].id);
    }
    
    return {
      sessionToken: token,
      expiresAt: result[0].expires_at
    };
  }
  
  /**
   * Create an athlete and track it for cleanup
   */
  async createAthlete(athleteData) {
    const defaultData = {
      name: athleteData.name || `Test Athlete ${this.randomId}`,
      country: athleteData.country || 'TST',
      gender: athleteData.gender || 'men',
      personal_best: athleteData.personal_best || '2:05:00',
      salary: athleteData.salary || 5000
    };
    
    const result = await this.sql`
      INSERT INTO athletes (name, country, gender, personal_best, salary)
      VALUES (
        ${defaultData.name},
        ${defaultData.country},
        ${defaultData.gender},
        ${defaultData.personal_best},
        ${defaultData.salary}
      )
      RETURNING id
    `;
    
    const athleteId = result[0].id;
    this.createdResources.athletes.push(athleteId);
    return athleteId;
  }
  
  /**
   * Create a race and track it for cleanup
   */
  async createRace(raceData) {
    const defaultData = {
      name: raceData.name || `Test Race ${this.randomId}`,
      date: raceData.date || new Date().toISOString().split('T')[0],
      location: raceData.location || 'Test City',
      is_active: raceData.is_active !== undefined ? raceData.is_active : true
    };
    
    const result = await this.sql`
      INSERT INTO races (name, date, location, is_active)
      VALUES (
        ${defaultData.name},
        ${defaultData.date},
        ${defaultData.location},
        ${defaultData.is_active}
      )
      RETURNING id
    `;
    
    const raceId = result[0].id;
    this.createdResources.races.push(raceId);
    return raceId;
  }
  
  /**
   * Track an athlete-race association for cleanup
   */
  async createAthleteRace(athleteId, raceId, bibNumber = null) {
    const result = await this.sql`
      INSERT INTO athlete_races (athlete_id, race_id, bib_number)
      VALUES (${athleteId}, ${raceId}, ${bibNumber})
      RETURNING id
    `;
    
    const arId = result[0].id;
    this.createdResources.athleteRaces.push(arId);
    return arId;
  }
  
  /**
   * Track a salary cap team entry for cleanup
   */
  async createSalaryCapTeam(gameId, playerCode, athleteId, gender, totalSpent, isComplete = false) {
    const result = await this.sql`
      INSERT INTO salary_cap_teams (
        game_id, player_code, athlete_id, gender, total_spent, is_complete
      )
      VALUES (
        ${gameId}, ${playerCode}, ${athleteId}, ${gender}, ${totalSpent}, ${isComplete}
      )
      RETURNING id
    `;
    
    const teamId = result[0].id;
    this.createdResources.salaryCapTeams.push(teamId);
    return teamId;
  }
  
  /**
   * Track a race result for cleanup
   */
  async createRaceResult(gameId, athleteId, finishTime, isFinal = false) {
    const result = await this.sql`
      INSERT INTO race_results (game_id, athlete_id, finish_time, is_final)
      VALUES (${gameId}, ${athleteId}, ${finishTime}, ${isFinal})
      RETURNING id
    `;
    
    const resultId = result[0].id;
    this.createdResources.raceResults.push(resultId);
    return resultId;
  }
  
  /**
   * Manually track a resource for cleanup
   * Use this if you create a resource through the API rather than directly
   */
  trackResource(resourceType, resourceId) {
    if (!this.createdResources[resourceType]) {
      throw new Error(`Unknown resource type: ${resourceType}`);
    }
    this.createdResources[resourceType].push(resourceId);
  }
  
  /**
   * Cleanup all tracked resources
   * Called in afterEach() or finally blocks
   */
  async cleanup() {
    const errors = [];
    
    console.log(`\n🧹 Cleaning up resources for test: ${this.testName}`);
    
    try {
      // Delete in reverse order of foreign key dependencies
      
      // 1. Race results (references games and athletes)
      if (this.createdResources.raceResults.length > 0) {
        console.log(`   Deleting ${this.createdResources.raceResults.length} race results...`);
        for (const id of this.createdResources.raceResults) {
          try {
            await this.sql`DELETE FROM race_results WHERE id = ${id}`;
          } catch (error) {
            errors.push(`race_results[${id}]: ${error.message}`);
          }
        }
      }
      
      // 2. Salary cap teams (references games and athletes)
      if (this.createdResources.salaryCapTeams.length > 0) {
        console.log(`   Deleting ${this.createdResources.salaryCapTeams.length} salary cap teams...`);
        for (const id of this.createdResources.salaryCapTeams) {
          try {
            await this.sql`DELETE FROM salary_cap_teams WHERE id = ${id}`;
          } catch (error) {
            errors.push(`salary_cap_teams[${id}]: ${error.message}`);
          }
        }
      }
      
      // 3. Draft teams (deprecated, references games and athletes)
      if (this.createdResources.draftTeams.length > 0) {
        console.log(`   Deleting ${this.createdResources.draftTeams.length} draft teams...`);
        for (const id of this.createdResources.draftTeams) {
          try {
            await this.sql`DELETE FROM draft_teams WHERE id = ${id}`;
          } catch (error) {
            errors.push(`draft_teams[${id}]: ${error.message}`);
          }
        }
      }
      
      // 4. Player rankings (deprecated, references games and athletes)
      if (this.createdResources.playerRankings.length > 0) {
        console.log(`   Deleting ${this.createdResources.playerRankings.length} player rankings...`);
        for (const id of this.createdResources.playerRankings) {
          try {
            await this.sql`DELETE FROM player_rankings WHERE id = ${id}`;
          } catch (error) {
            errors.push(`player_rankings[${id}]: ${error.message}`);
          }
        }
      }
      
      // 5. Anonymous sessions (references games)
      if (this.createdResources.sessions.length > 0) {
        console.log(`   Deleting ${this.createdResources.sessions.length} anonymous sessions...`);
        for (const id of this.createdResources.sessions) {
          try {
            await this.sql`DELETE FROM anonymous_sessions WHERE id = ${id}`;
          } catch (error) {
            errors.push(`anonymous_sessions[${id}]: ${error.message}`);
          }
        }
      }
      
      // 6. Games
      if (this.createdResources.games.length > 0) {
        console.log(`   Deleting ${this.createdResources.games.length} games...`);
        for (const gameId of this.createdResources.games) {
          try {
            await this.sql`DELETE FROM games WHERE game_id = ${gameId}`;
          } catch (error) {
            errors.push(`games[${gameId}]: ${error.message}`);
          }
        }
      }
      
      // 7. Athlete progression (references athletes)
      if (this.createdResources.athleteProgression.length > 0) {
        console.log(`   Deleting ${this.createdResources.athleteProgression.length} athlete progression records...`);
        for (const id of this.createdResources.athleteProgression) {
          try {
            await this.sql`DELETE FROM athlete_progression WHERE id = ${id}`;
          } catch (error) {
            errors.push(`athlete_progression[${id}]: ${error.message}`);
          }
        }
      }
      
      // 8. Athlete race results (references athletes)
      if (this.createdResources.athleteRaceResults.length > 0) {
        console.log(`   Deleting ${this.createdResources.athleteRaceResults.length} athlete race results...`);
        for (const id of this.createdResources.athleteRaceResults) {
          try {
            await this.sql`DELETE FROM athlete_race_results WHERE id = ${id}`;
          } catch (error) {
            errors.push(`athlete_race_results[${id}]: ${error.message}`);
          }
        }
      }
      
      // 9. Athlete-race associations (references athletes and races)
      if (this.createdResources.athleteRaces.length > 0) {
        console.log(`   Deleting ${this.createdResources.athleteRaces.length} athlete-race associations...`);
        for (const id of this.createdResources.athleteRaces) {
          try {
            await this.sql`DELETE FROM athlete_races WHERE id = ${id}`;
          } catch (error) {
            errors.push(`athlete_races[${id}]: ${error.message}`);
          }
        }
      }
      
      // 10. Races
      if (this.createdResources.races.length > 0) {
        console.log(`   Deleting ${this.createdResources.races.length} races...`);
        for (const id of this.createdResources.races) {
          try {
            await this.sql`DELETE FROM races WHERE id = ${id}`;
          } catch (error) {
            errors.push(`races[${id}]: ${error.message}`);
          }
        }
      }
      
      // 11. Athletes (should be last)
      if (this.createdResources.athletes.length > 0) {
        console.log(`   Deleting ${this.createdResources.athletes.length} athletes...`);
        for (const id of this.createdResources.athletes) {
          try {
            await this.sql`DELETE FROM athletes WHERE id = ${id}`;
          } catch (error) {
            errors.push(`athletes[${id}]: ${error.message}`);
          }
        }
      }
      
      if (errors.length === 0) {
        console.log(`✅ Successfully cleaned up all resources for ${this.testName}\n`);
      } else {
        console.warn(`⚠️  Cleanup completed with ${errors.length} errors:`);
        errors.forEach(err => console.warn(`   - ${err}`));
        console.log('');
      }
      
    } catch (error) {
      console.error(`❌ Fatal error during cleanup for ${this.testName}:`, error.message);
      throw error;
    }
  }
  
  /**
   * Get a summary of tracked resources
   */
  getSummary() {
    const summary = {};
    for (const [type, resources] of Object.entries(this.createdResources)) {
      if (resources.length > 0) {
        summary[type] = resources.length;
      }
    }
    return summary;
  }
}

/**
 * Helper function to run a test with automatic cleanup
 * 
 * Usage:
 * await withTestContext('my-test', async (ctx) => {
 *   const gameId = await ctx.createGame({ players: [] });
 *   // ... test code ...
 *   // Cleanup happens automatically
 * });
 */
export async function withTestContext(testName, testFn) {
  const ctx = new TestContext(testName);
  try {
    return await testFn(ctx);
  } finally {
    await ctx.cleanup();
  }
}
