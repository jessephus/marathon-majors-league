import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}
const sql = neon(DATABASE_URL);

const MIGRATION_PATH = path.resolve('migrations/003_user_account_system.sql');
const migrationSQL = fs.readFileSync(MIGRATION_PATH, 'utf8');

// Split on semicolon followed by newline (not inside $$...$$)
function splitSQLStatements(sqlText) {
  // Remove comments
  const lines = sqlText.split('\n').filter(line => !line.trim().startsWith('--'));
  const text = lines.join('\n');
  // Split on semicolon at end of line, but not inside $$...$$
  const statements = [];
  let buffer = '';
  let inDollarQuote = false;
  for (const line of text.split('\n')) {
    if (line.includes('$$')) inDollarQuote = !inDollarQuote;
    buffer += line + '\n';
    if (!inDollarQuote && line.trim().endsWith(';')) {
      statements.push(buffer.trim());
      buffer = '';
    }
  }
  if (buffer.trim()) statements.push(buffer.trim());
  return statements.filter(s => s.length > 0);
}

async function runMigration() {
  const statements = splitSQLStatements(migrationSQL);
  let success = 0, fail = 0;
  for (const stmt of statements) {
    try {
      await sql(stmt);
      console.log(`✅ Executed: ${stmt.split('\n')[0].slice(0, 80)}...`);
      success++;
    } catch (err) {
      console.error(`❌ Error: ${stmt.split('\n')[0].slice(0, 80)}...`);
      console.error(err.message);
      fail++;
    }
  }
  console.log(`\nMigration complete: ${success} succeeded, ${fail} failed.`);
}

runMigration();
