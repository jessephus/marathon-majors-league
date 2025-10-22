import { neon, neonConfig } from '@neondatabase/serverless';
import fs from 'fs';

// Enable full results to get all output
neonConfig.fetchOptions = {
  cache: 'no-store',
};

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment');
  process.exit(1);
}

console.log('🚀 Running Migration 003: User Account System\n');

const sql = neon(DATABASE_URL);

async function runMigration() {
  try {
    // Read the migration file
    const migrationContent = fs.readFileSync('./migrations/003_user_account_system.sql', 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('🔧 Executing migration via batch SQL...\n');
    
    // Remove comments and split by statement delimiters
    // This regex-based approach is better at handling complex SQL
    const cleanSQL = migrationContent
      .replace(/--[^\n]*/g, '') // Remove single-line comments
      .trim();
    
    // Split by semicolon but be careful about semicolons inside functions
    const statements = [];
    let buffer = '';
    let dollarQuoteDepth = 0;
    
    for (let i = 0; i < cleanSQL.length; i++) {
      const char = cleanSQL[i];
      const next = cleanSQL[i + 1];
      
      // Track $$ delimiters
      if (char === '$' && next === '$') {
        dollarQuoteDepth = dollarQuoteDepth === 0 ? 1 : 0;
        buffer += char;
        continue;
      }
      
      buffer += char;
      
      // Split on semicolon only if we're not inside a function
      if (char === ';' && dollarQuoteDepth === 0) {
        const stmt = buffer.trim();
        if (stmt.length > 0) {
          statements.push(stmt);
        }
        buffer = '';
      }
    }
    
    // Add any remaining content
    if (buffer.trim().length > 0) {
      statements.push(buffer.trim());
    }
    
    console.log(`📊 Parsed ${statements.length} SQL statements\n`);
    
    let executed = 0;
    let skipped = 0;
    const errors = [];
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await sql.unsafe(statement);
        executed++;
        
        if ((executed + skipped) % 10 === 0) {
          console.log(`✓ Progress: ${executed + skipped}/${statements.length} statements...`);
        }
      } catch (error) {
        const errMsg = error.message.toLowerCase();
        // Skip benign errors
        if (errMsg.includes('already exists') || 
            errMsg.includes('does not exist') ||
            errMsg.includes('duplicate')) {
          skipped++;
        } else {
          console.error(`\n⚠️  Error on statement ${i + 1}:`);
          console.error(`   ${error.message}`);
          errors.push({
            index: i + 1,
            error: error.message,
            statement: statement.substring(0, 150)
          });
          
          // For critical errors, stop
          if (errMsg.includes('syntax error') || errMsg.includes('relation') && errMsg.includes('does not exist')) {
            console.error('\n❌ Critical error encountered, stopping migration');
            throw error;
          }
        }
      }
    }
    
    console.log(`\n✅ Migration execution completed!`);
    console.log(`   Executed: ${executed} statements`);
    console.log(`   Skipped:  ${skipped} statements`);
    console.log(`   Errors:   ${errors.length} non-critical errors\n`);
    
    // Verify results
    console.log('🔍 Verifying migration results...\n');
    
    // Check tables
    const expectedTables = [
      'users', 'one_time_passwords', 'magic_links', 'user_profiles',
      'totp_backup_codes', 'user_games', 'invite_codes', 'invite_code_usage',
      'user_sessions', 'audit_log'
    ];
    
    const tableResults = await Promise.all(
      expectedTables.map(async (table) => {
        const result = await sql`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = ${table}
          ) as exists
        `;
        return { table, exists: result[0].exists };
      })
    );
    
    let tablesCreated = 0;
    tableResults.forEach(({ table, exists }) => {
      if (exists) {
        console.log(`   ✅ Table '${table}' exists`);
        tablesCreated++;
      } else {
        console.log(`   ❌ Table '${table}' NOT found`);
      }
    });
    
    // Check functions
    console.log('\n🔧 Verifying functions...\n');
    const expectedFunctions = ['cleanup_expired_auth_tokens', 'user_has_valid_auth', 'soft_delete_user'];
    
    const functionResults = await Promise.all(
      expectedFunctions.map(async (func) => {
        const result = await sql`
          SELECT EXISTS (SELECT FROM pg_proc WHERE proname = ${func}) as exists
        `;
        return { func, exists: result[0].exists };
      })
    );
    
    let functionsCreated = 0;
    functionResults.forEach(({ func, exists }) => {
      if (exists) {
        console.log(`   ✅ Function '${func}' exists`);
        functionsCreated++;
      } else {
        console.log(`   ❌ Function '${func}' NOT found`);
      }
    });
    
    // Check admin user
    const adminUsers = await sql`
      SELECT * FROM users WHERE email = 'admin@marathon-majors-league.com'
    `;
    
    console.log('\n👤 Admin user status:\n');
    if (adminUsers.length > 0) {
      const admin = adminUsers[0];
      console.log(`   ✅ Admin user created`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   👤 Name: ${admin.display_name || '(not set)'}`);
      console.log(`   🔐 Admin: ${admin.is_admin}`);
      console.log(`   🆔 ID: ${admin.id}`);
    } else {
      console.log(`   ⚠️  Admin user not found`);
    }
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Tables created:     ${tablesCreated}/${expectedTables.length}`);
    console.log(`Functions created:  ${functionsCreated}/${expectedFunctions.length}`);
    console.log(`Admin user:         ${adminUsers.length > 0 ? 'Created ✅' : 'Not found ❌'}`);
    console.log(`SQL statements:     ${executed} executed, ${skipped} skipped`);
    console.log('='.repeat(70));
    
    if (tablesCreated === expectedTables.length && 
        functionsCreated === expectedFunctions.length && 
        adminUsers.length > 0) {
      console.log('\n🎉 Migration 003 completed successfully! ✨\n');
      console.log('Next steps:');
      console.log('1. Update admin credentials:');
      console.log(`   UPDATE users SET email = 'your-email@example.com' WHERE id = ${adminUsers[0].id};`);
      console.log('2. Generate invite codes for initial users');
      console.log('3. Run tests: node tests/migration-003.test.js\n');
    } else {
      console.log('\n⚠️  Migration completed with warnings.\n');
      if (errors.length > 0) {
        console.log('Errors encountered:');
        errors.slice(0, 5).forEach(({ index, error, statement }) => {
          console.log(`\n${index}. ${error}`);
          console.log(`   Statement: ${statement}...`);
        });
        if (errors.length > 5) {
          console.log(`\n... and ${errors.length - 5} more errors`);
        }
      }
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed with critical error:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

runMigration();
