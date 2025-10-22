import { neon } from '@neondatabase/serverless';
import fs from 'fs';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }

  const sql = neon(DATABASE_URL);

  try {
    // Read migration file
    const migrationSQL = fs.readFileSync('./migrations/003_user_account_system.sql', 'utf8');
    
    // Split into individual statements (simple approach - split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    const results = {
      total: statements.length,
      executed: 0,
      failed: 0,
      errors: []
    };
    
    // Execute each statement
    for (const statement of statements) {
      try {
        await sql.unsafe(statement + ';');
        results.executed++;
      } catch (error) {
        // Ignore "already exists" errors
        if (!error.message.toLowerCase().includes('already exists')) {
          results.failed++;
          results.errors.push({
            statement: statement.substring(0, 100),
            error: error.message
          });
        } else {
          results.executed++;
        }
      }
    }
    
    // Verify tables
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'users', 'one_time_passwords', 'magic_links', 'user_profiles',
        'totp_backup_codes', 'user_games', 'invite_codes', 'invite_code_usage',
        'user_sessions', 'audit_log'
      )
      ORDER BY table_name
    `;
    
    res.status(200).json({
      message: 'Migration 003 executed',
      results,
      tablesCreated: tables.map(t => t.table_name)
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ error: error.message });
  }
}
