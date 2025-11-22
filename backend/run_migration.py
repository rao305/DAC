#!/usr/bin/env python3
"""
Run the collaboration schema migration.

This script applies the collaboration schema to your existing database.
"""

import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Database connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/syntra")

async def run_migration():
    """Run the collaboration schema migration"""
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    # Read migration file
    migration_path = "migrations/001_collaboration_schema.sql"
    
    try:
        with open(migration_path, 'r') as f:
            migration_sql = f.read()
        
        print(f"📜 Running migration: {migration_path}")
        print("=" * 60)
        
        # Execute migration
        async with engine.begin() as conn:
            # Split on semicolon and execute each statement
            statements = migration_sql.split(';')
            
            for i, statement in enumerate(statements):
                statement = statement.strip()
                if not statement:
                    continue
                
                print(f"Executing statement {i+1}/{len(statements)}")
                await conn.execute(statement)
        
        print("=" * 60)
        print("✅ Migration completed successfully!")
        print("\nCreated tables:")
        print("  - conversations")
        print("  - collab_runs") 
        print("  - collab_steps")
        print("  - collab_messages")
        print("\nCreated enums:")
        print("  - message_role")
        print("  - message_content_type")
        print("  - collab_mode")
        print("  - collab_status")
        print("  - collab_role")
        print("\nCreated views:")
        print("  - latest_agent_outputs")
        print("  - collab_run_summary")
        print("\nCreated functions:")
        print("  - get_recent_agent_outputs()")
        print("  - get_conversation_history()")
        
    except FileNotFoundError:
        print(f"❌ Migration file not found: {migration_path}")
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())