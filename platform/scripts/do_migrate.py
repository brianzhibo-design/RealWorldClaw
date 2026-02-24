#!/usr/bin/env python3
"""Direct SQLite→PostgreSQL migration. Run on Fly.io machine."""
import os
import sqlite3
import sys

DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("❌ DATABASE_URL not set")
    sys.exit(1)

import psycopg2
import psycopg2.extras

SQLITE_PATH = "/app/data/realworldclaw.db"

# Tables to migrate (order matters for FK)
TABLES = [
    "users", "agents", "makers", "nodes", "components", "files",
    "orders", "order_messages", "order_reviews",
    "community_posts", "community_comments", "community_votes",
    "spaces", "space_members", "follows", "audit_log",
]

def get_sqlite_data(path, table):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(f"SELECT * FROM {table}").fetchall()
        if rows:
            cols = rows[0].keys()
            return cols, [tuple(r) for r in rows]
        return [], []
    except Exception as e:
        print(f"  Skip {table}: {e}")
        return [], []
    finally:
        conn.close()

def create_pg_table(pg, table, sqlite_path):
    """Create PG table matching SQLite schema."""
    conn = sqlite3.connect(sqlite_path)
    schema = conn.execute(f"PRAGMA table_info({table})").fetchall()
    conn.close()
    
    if not schema:
        return False
    
    cols = []
    for _, name, typ, notnull, default, pk in schema:
        pg_type = "TEXT"
        if typ.upper() in ("INTEGER", "INT"):
            pg_type = "INTEGER"
        elif typ.upper() in ("REAL", "FLOAT", "DOUBLE"):
            pg_type = "REAL"
        elif typ.upper() == "BOOLEAN":
            pg_type = "BOOLEAN"
        
        col_def = f'"{name}" {pg_type}'
        if pk:
            col_def += " PRIMARY KEY"
        if notnull and not pk:
            if default is not None:
                col_def += f" NOT NULL DEFAULT {default}"
            else:
                col_def += " NOT NULL"
        elif default is not None and not pk:
            col_def += f" DEFAULT {default}"
        cols.append(col_def)
    
    create_sql = f'CREATE TABLE IF NOT EXISTS "{table}" ({", ".join(cols)})'
    try:
        with pg.cursor() as cur:
            cur.execute(create_sql)
        pg.commit()
        return True
    except Exception as e:
        pg.rollback()
        print(f"  Create {table} failed: {e}")
        return False

def migrate():
    pg = psycopg2.connect(DATABASE_URL)
    
    for table in TABLES:
        cols, rows = get_sqlite_data(SQLITE_PATH, table)
        if not cols:
            print(f"  {table}: empty or missing, skip")
            continue
        
        # Create table
        if not create_pg_table(pg, table, SQLITE_PATH):
            continue
        
        # Insert data
        placeholders = ", ".join(["%s"] * len(cols))
        col_names = ", ".join(f'"{c}"' for c in cols)
        insert_sql = f'INSERT INTO "{table}" ({col_names}) VALUES ({placeholders}) ON CONFLICT DO NOTHING'
        
        try:
            with pg.cursor() as cur:
                psycopg2.extras.execute_batch(cur, insert_sql, rows)
            pg.commit()
            print(f"  ✅ {table}: {len(rows)} rows")
        except Exception as e:
            pg.rollback()
            print(f"  ❌ {table}: {e}")
    
    # Verify
    print("\n=== Verification ===")
    with pg.cursor() as cur:
        for table in TABLES:
            try:
                cur.execute(f'SELECT COUNT(*) FROM "{table}"')
                count = cur.fetchone()[0]
                print(f"  {table}: {count}")
            except Exception:
                pg.rollback()
    
    pg.close()
    print("\n✅ Migration complete!")

if __name__ == "__main__":
    migrate()
