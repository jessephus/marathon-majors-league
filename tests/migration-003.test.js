// Migration 003 Test - User Account System Schema Verification
// Tests that all tables, columns, indexes, and functions were created correctly

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testTableExists(tableName) {
  const result = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    ) as exists
  `;
  return result[0].exists;
}

async function testColumnExists(tableName, columnName) {
  const result = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
      AND column_name = ${columnName}
    ) as exists
  `;
  return result[0].exists;
}

async function testIndexExists(indexName) {
  const result = await sql`
    SELECT EXISTS (
      SELECT FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname = ${indexName}
    ) as exists
  `;
  return result[0].exists;
}

async function testFunctionExists(functionName) {
  const result = await sql`
    SELECT EXISTS (
      SELECT FROM pg_proc 
      WHERE proname = ${functionName}
    ) as exists
  `;
  return result[0].exists;
}

async function testConstraintExists(tableName, constraintName) {
  const result = await sql`
    SELECT EXISTS (
      SELECT FROM information_schema.table_constraints
      WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND constraint_name = ${constraintName}
    ) as exists
  `;
  return result[0].exists;
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║   Migration 003: User Account System - Schema Tests       ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝\n', 'cyan');

  let passedTests = 0;
  let failedTests = 0;
  const failures = [];

  // Helper to run a test
  async function test(description, testFn) {
    try {
      const result = await testFn();
      if (result) {
        log(`✅ ${description}`, 'green');
        passedTests++;
      } else {
        log(`❌ ${description}`, 'red');
        failedTests++;
        failures.push(description);
      }
    } catch (error) {
      log(`❌ ${description} - Error: ${error.message}`, 'red');
      failedTests++;
      failures.push(`${description} (Error)`);
    }
  }

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('🗄️  Table Creation Tests', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  await test('users table exists', () => testTableExists('users'));
  await test('one_time_passwords table exists', () => testTableExists('one_time_passwords'));
  await test('magic_links table exists', () => testTableExists('magic_links'));
  await test('user_profiles table exists', () => testTableExists('user_profiles'));
  await test('totp_backup_codes table exists', () => testTableExists('totp_backup_codes'));
  await test('user_games table exists', () => testTableExists('user_games'));
  await test('invite_codes table exists', () => testTableExists('invite_codes'));
  await test('invite_code_usage table exists', () => testTableExists('invite_code_usage'));
  await test('user_sessions table exists', () => testTableExists('user_sessions'));
  await test('audit_log table exists', () => testTableExists('audit_log'));

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('📋 Users Table Column Tests', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  await test('users.email column exists', () => testColumnExists('users', 'email'));
  await test('users.phone_number column exists', () => testColumnExists('users', 'phone_number'));
  await test('users.display_name column exists', () => testColumnExists('users', 'display_name'));
  await test('users.totp_secret column exists', () => testColumnExists('users', 'totp_secret'));
  await test('users.totp_enabled column exists', () => testColumnExists('users', 'totp_enabled'));
  await test('users.totp_verified_at column exists', () => testColumnExists('users', 'totp_verified_at'));
  await test('users.is_active column exists', () => testColumnExists('users', 'is_active'));
  await test('users.is_admin column exists', () => testColumnExists('users', 'is_admin'));
  await test('users.is_staff column exists', () => testColumnExists('users', 'is_staff'));
  await test('users.email_verified column exists', () => testColumnExists('users', 'email_verified'));
  await test('users.phone_verified column exists', () => testColumnExists('users', 'phone_verified'));
  await test('users.deleted_at column exists', () => testColumnExists('users', 'deleted_at'));

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('🔐 Authentication Table Column Tests', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  // OTP columns
  await test('one_time_passwords.otp_code column exists', () => testColumnExists('one_time_passwords', 'otp_code'));
  await test('one_time_passwords.delivery_method column exists', () => testColumnExists('one_time_passwords', 'delivery_method'));
  await test('one_time_passwords.expires_at column exists', () => testColumnExists('one_time_passwords', 'expires_at'));
  await test('one_time_passwords.used column exists', () => testColumnExists('one_time_passwords', 'used'));
  await test('one_time_passwords.attempts column exists', () => testColumnExists('one_time_passwords', 'attempts'));

  // Magic link columns
  await test('magic_links.token column exists', () => testColumnExists('magic_links', 'token'));
  await test('magic_links.purpose column exists', () => testColumnExists('magic_links', 'purpose'));
  await test('magic_links.expires_at column exists', () => testColumnExists('magic_links', 'expires_at'));
  await test('magic_links.metadata column exists', () => testColumnExists('magic_links', 'metadata'));

  // Session columns
  await test('user_sessions.session_token column exists', () => testColumnExists('user_sessions', 'session_token'));
  await test('user_sessions.revoked column exists', () => testColumnExists('user_sessions', 'revoked'));
  await test('user_sessions.last_activity column exists', () => testColumnExists('user_sessions', 'last_activity'));

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('🎮 User Games Table Column Tests', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  await test('user_games.role column exists', () => testColumnExists('user_games', 'role'));
  await test('user_games.player_code column exists', () => testColumnExists('user_games', 'player_code'));
  await test('user_games.team_name column exists', () => testColumnExists('user_games', 'team_name'));
  await test('user_games.team_sponsor column exists', () => testColumnExists('user_games', 'team_sponsor'));
  await test('user_games.owner_name column exists', () => testColumnExists('user_games', 'owner_name'));
  await test('user_games.status column exists', () => testColumnExists('user_games', 'status'));
  await test('user_games.invited_by column exists', () => testColumnExists('user_games', 'invited_by'));

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('🔗 Games Table Enhancement Tests', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  await test('games.commissioner_user_id column exists', () => testColumnExists('games', 'commissioner_user_id'));
  await test('games.requires_user_accounts column exists', () => testColumnExists('games', 'requires_user_accounts'));

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('📊 Index Creation Tests', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  await test('idx_users_email index exists', () => testIndexExists('idx_users_email'));
  await test('idx_users_phone index exists', () => testIndexExists('idx_users_phone'));
  await test('idx_otp_user_id index exists', () => testIndexExists('idx_otp_user_id'));
  await test('idx_magic_links_token index exists', () => testIndexExists('idx_magic_links_token'));
  await test('idx_user_sessions_token index exists', () => testIndexExists('idx_user_sessions_token'));
  await test('idx_user_games_user_id index exists', () => testIndexExists('idx_user_games_user_id'));
  await test('idx_invite_codes_code index exists', () => testIndexExists('idx_invite_codes_code'));
  await test('idx_audit_log_user_id index exists', () => testIndexExists('idx_audit_log_user_id'));

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('⚙️  Function Creation Tests', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  await test('soft_delete_user function exists', () => testFunctionExists('soft_delete_user'));
  await test('cleanup_expired_auth_tokens function exists', () => testFunctionExists('cleanup_expired_auth_tokens'));
  await test('user_has_valid_auth function exists', () => testFunctionExists('user_has_valid_auth'));

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('🔒 Data Integrity Tests', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  // Test admin user was created
  await test('Admin user account created', async () => {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM users 
        WHERE email = 'admin@marathon-majors-league.com'
        AND is_admin = TRUE
      ) as exists
    `;
    return result[0].exists;
  });

  // Test admin profile was created
  await test('Admin user profile created', async () => {
    const result = await sql`
      SELECT EXISTS (
        SELECT FROM user_profiles up
        JOIN users u ON up.user_id = u.id
        WHERE u.email = 'admin@marathon-majors-league.com'
      ) as exists
    `;
    return result[0].exists;
  });

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('✨ Functional Tests', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  // Test cleanup function execution
  await test('cleanup_expired_auth_tokens function executes', async () => {
    try {
      await sql`SELECT cleanup_expired_auth_tokens()`;
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  });

  // Test user_has_valid_auth function execution
  await test('user_has_valid_auth function executes', async () => {
    try {
      const result = await sql`
        SELECT user_has_valid_auth(
          (SELECT id FROM users WHERE email = 'admin@marathon-majors-league.com' LIMIT 1)
        ) as has_auth
      `;
      return result[0].has_auth !== null;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  });

  // Test creating a test user
  await test('Can create new user', async () => {
    try {
      await sql`
        INSERT INTO users (email, display_name, is_active, email_verified)
        VALUES ('test-migration@example.com', 'Test User', TRUE, TRUE)
        ON CONFLICT (email) DO NOTHING
      `;
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM users WHERE email = 'test-migration@example.com'
        ) as exists
      `;
      return result[0].exists;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  });

  // Test email constraint
  await test('Email constraint prevents duplicates', async () => {
    try {
      await sql`
        INSERT INTO users (email, display_name)
        VALUES ('test-migration@example.com', 'Duplicate User')
      `;
      return false; // Should have thrown error
    } catch (error) {
      return error.message.includes('duplicate key') || error.message.includes('unique');
    }
  });

  // Test TOTP enabled flag
  await test('Can enable TOTP for user', async () => {
    try {
      await sql`
        UPDATE users
        SET totp_enabled = TRUE,
            totp_secret = 'test-secret-base32',
            totp_verified_at = CURRENT_TIMESTAMP
        WHERE email = 'test-migration@example.com'
      `;
      const result = await sql`
        SELECT totp_enabled FROM users 
        WHERE email = 'test-migration@example.com'
      `;
      return result[0].totp_enabled === true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  });

  // Cleanup test data
  try {
    await sql`DELETE FROM users WHERE email = 'test-migration@example.com'`;
  } catch (error) {
    // Ignore cleanup errors
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue');
  log('📊 Test Summary', 'blue');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  const totalTests = passedTests + failedTests;
  const passRate = totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : 0;

  log(`Total Tests: ${totalTests}`);
  log(`Passed: ${passedTests} ✅`, 'green');
  log(`Failed: ${failedTests} ❌`, failedTests > 0 ? 'red' : 'reset');
  log(`Pass Rate: ${passRate}%`, passRate >= 90 ? 'green' : 'yellow');

  if (failures.length > 0) {
    log('\n❌ Failed Tests:', 'red');
    failures.forEach(failure => log(`   - ${failure}`, 'red'));
  }

  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'blue');

  if (failedTests === 0) {
    log('🎉 All migration tests passed! Migration 003 schema is correct. ✨\n', 'green');
    process.exit(0);
  } else {
    log('⚠️  Some migration tests failed. Review the schema and re-run migration.\n', 'yellow');
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error running migration tests:', error);
  process.exit(1);
});
