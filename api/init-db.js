import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Initialize database tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS game_state (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(50) UNIQUE NOT NULL,
        players TEXT[] DEFAULT '{}',
        draft_complete BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS player_rankings (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(50) NOT NULL,
        player_code VARCHAR(50) NOT NULL,
        men_rankings JSONB,
        women_rankings JSONB,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, player_code)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS draft_results (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(50) NOT NULL,
        player_code VARCHAR(50) NOT NULL,
        men_team JSONB,
        women_team JSONB,
        drafted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, player_code)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS race_results (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(50) NOT NULL,
        athlete_id INTEGER NOT NULL,
        finish_time VARCHAR(20),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(game_id, athlete_id)
      )
    `;

    res.status(200).json({ 
      message: 'Database initialized successfully',
      tables: ['game_state', 'player_rankings', 'draft_results', 'race_results']
    });
  } catch (error) {
    console.error('Database initialization error:', error);
    res.status(500).json({ error: error.message });
  }
}
