#!/usr/bin/env python3
"""
Initialize database schema with new progression tables.

This script reads schema.sql and executes it against the database
specified in the DATABASE_URL environment variable.
"""

import os
import sys
import psycopg2
from pathlib import Path

def load_env_file():
    """Load environment variables from .env file"""
    env_path = Path(__file__).parent.parent / '.env'
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip('"').strip("'")
                    os.environ[key] = value

def init_schema():
    """Initialize database schema"""
    # Load environment variables
    load_env_file()
    
    # Get database URL
    db_url = os.environ.get('DATABASE_URL')
    if not db_url:
        print("❌ Error: DATABASE_URL not found in environment")
        print("Please add DATABASE_URL to your .env file or set it as an environment variable")
        return False
    
    # Read schema.sql
    schema_path = Path(__file__).parent.parent / 'schema.sql'
    if not schema_path.exists():
        print(f"❌ Error: schema.sql not found at {schema_path}")
        return False
    
    print(f"📖 Reading schema from: {schema_path}")
    with open(schema_path) as f:
        schema_sql = f.read()
    
    # Connect to database
    print("🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(db_url)
        conn.set_session(autocommit=True)  # Use autocommit mode to avoid transaction issues
        cur = conn.cursor()
        
        # Split schema into individual statements
        # Remove comments and split by semicolons
        statements = []
        for line in schema_sql.split('\n'):
            if not line.strip().startswith('--'):
                statements.append(line)
        
        full_sql = '\n'.join(statements)
        individual_statements = [s.strip() for s in full_sql.split(';') if s.strip()]
        
        print(f"📝 Executing {len(individual_statements)} SQL statements...")
        
        # Execute each statement
        for i, statement in enumerate(individual_statements, 1):
            if statement.strip():
                try:
                    cur.execute(statement)
                    print(f"  ✓ Statement {i}/{len(individual_statements)}")
                except psycopg2.Error as e:
                    # Ignore "already exists" errors
                    if 'already exists' in str(e):
                        print(f"  ⚠️  Statement {i}/{len(individual_statements)} - Already exists (skipped)")
                    else:
                        print(f"  ❌ Statement {i}/{len(individual_statements)} - Error: {e}")
                        # Don't raise - continue with other statements
        print("\n✅ Database schema initialized successfully!")
        
        # Check which tables exist
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tables = [row[0] for row in cur.fetchall()]
        
        print(f"\n📊 Tables in database ({len(tables)}):")
        for table in tables:
            cur.execute(f"SELECT COUNT(*) FROM {table}")
            count = cur.fetchone()[0]
            print(f"  - {table}: {count} records")
        
        cur.close()
        conn.close()
        return True
        
    except psycopg2.Error as e:
        print(f"\n❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        return False

if __name__ == '__main__':
    success = init_schema()
    sys.exit(0 if success else 1)
