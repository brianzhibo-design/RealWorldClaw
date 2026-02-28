"""RealWorldClaw — Database layer (SQLite locally, PostgreSQL in production)"""

from __future__ import annotations

import os
import logging
import sqlite3

logger = logging.getLogger(__name__)
from contextlib import contextmanager
from pathlib import Path

DATABASE_URL = os.environ.get("DATABASE_URL")
USE_POSTGRES = DATABASE_URL is not None and DATABASE_URL.startswith("postgres")

DB_PATH = Path(__file__).parent.parent / "data" / "realworldclaw.db"

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras

    class PgRowWrapper:
        """Make psycopg2 rows behave like sqlite3.Row (dict-like access)."""
        def __init__(self, cursor, row):
            self._data = {desc[0]: val for desc, val in zip(cursor.description, row)}
        def __getitem__(self, key):
            if isinstance(key, int):
                return list(self._data.values())[key]
            return self._data[key]
        def keys(self):
            return self._data.keys()
        def get(self, key, default=None):
            return self._data.get(key, default)
        def __contains__(self, key):
            return key in self._data
        def __iter__(self):
            return iter(self._data.values())

    class PgCursorWrapper:
        """Wraps psycopg2 cursor to translate SQLite ? placeholders to %s."""
        def __init__(self, cursor, conn):
            self._cursor = cursor
            self._conn = conn
            self.rowcount = 0
            self.description = None
            self.lastrowid = None

        def execute(self, sql, params=None):
            sql = self._translate_sql(sql)
            if params:
                self._cursor.execute(sql, params)
            else:
                self._cursor.execute(sql)
            self.rowcount = self._cursor.rowcount
            self.description = self._cursor.description
            return self

        def executemany(self, sql, params_list):
            sql = self._translate_sql(sql)
            self._cursor.executemany(sql, params_list)
            self.rowcount = self._cursor.rowcount
            return self

        def fetchone(self):
            row = self._cursor.fetchone()
            if row is None:
                return None
            if self._cursor.description:
                return PgRowWrapper(self._cursor, row)
            return row

        def fetchall(self):
            rows = self._cursor.fetchall()
            if self._cursor.description:
                return [PgRowWrapper(self._cursor, r) for r in rows]
            return rows

        def _translate_sql(self, sql):
            """Translate SQLite SQL to PostgreSQL."""
            # Skip PRAGMA
            if sql.strip().upper().startswith("PRAGMA"):
                return "SELECT 1"
            # ? → %s
            sql = sql.replace("?", "%s")
            # julianday → EXTRACT(EPOCH FROM ...)  (simplified)
            sql = sql.replace("julianday('now')", "EXTRACT(EPOCH FROM NOW())/86400")
            sql = sql.replace("julianday(created_at)", "EXTRACT(EPOCH FROM created_at::timestamp)/86400")
            # INTEGER NOT NULL DEFAULT 0 for booleans
            # BEGIN IMMEDIATE → BEGIN
            sql = sql.replace("BEGIN IMMEDIATE", "BEGIN")
            return sql

    class PgConnectionWrapper:
        """Make psycopg2 connection look like sqlite3.Connection."""
        def __init__(self, conn):
            self._conn = conn

        def execute(self, sql, params=None):
            cur = PgCursorWrapper(self._conn.cursor(), self._conn)
            return cur.execute(sql, params)

        def cursor(self):
            return PgCursorWrapper(self._conn.cursor(), self._conn)

        def commit(self):
            self._conn.commit()

        def rollback(self):
            self._conn.rollback()

        def executescript(self, sql):
            """Execute multiple SQL statements (PG doesn't have executescript)."""
            for stmt in sql.split(";"):
                stmt = stmt.strip()
                if stmt:
                    try:
                        self.execute(stmt)
                    except Exception as exc:
                        logger.debug("PG init: %s", exc)

        def close(self):
            self._conn.close()


def get_connection():
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        return PgConnectionWrapper(conn)
    else:
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn


@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def _safe_add_column(db, table: str, column_def: str):
    """Add a column in a cross-database safe way (SQLite/PostgreSQL)."""
    if USE_POSTGRES:
        db.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {column_def}")
        return

    try:
        db.execute(f"ALTER TABLE {table} ADD COLUMN {column_def}")
    except Exception as exc:
        logger.debug("PG init: %s", exc)


def init_db():
    """创建所有表"""
    from .models.user import USERS_TABLE_SQL
    from .models.files import FILES_TABLE_SQL
    from .models.community import COMMUNITY_TABLES_SQL

    if USE_POSTGRES:
        # PG tables created by migration script; ensure schema catches up.
        with get_db() as db:
            for sql in [
                "CREATE TABLE IF NOT EXISTS follows (id TEXT PRIMARY KEY, follower_id TEXT NOT NULL, following_id TEXT NOT NULL, created_at TEXT NOT NULL, UNIQUE(follower_id, following_id))",
                "CREATE TABLE IF NOT EXISTS spaces (id TEXT PRIMARY KEY, name TEXT UNIQUE NOT NULL, display_name TEXT NOT NULL, description TEXT DEFAULT '', icon TEXT DEFAULT '🏭', creator_id TEXT NOT NULL, member_count INTEGER DEFAULT 0, post_count INTEGER DEFAULT 0, created_at TEXT NOT NULL)",
                "CREATE TABLE IF NOT EXISTS space_members (space_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT DEFAULT 'member', joined_at TEXT NOT NULL, PRIMARY KEY(space_id, user_id))",
                "CREATE TABLE IF NOT EXISTS direct_messages (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL, recipient_id TEXT NOT NULL, content TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL)",
                "CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, from_user TEXT NOT NULL, to_user TEXT NOT NULL, content TEXT NOT NULL, read INTEGER DEFAULT 0, created_at TEXT NOT NULL)",
                "CREATE TABLE IF NOT EXISTS reports (id TEXT PRIMARY KEY, reporter_id TEXT NOT NULL, target_type TEXT NOT NULL, target_id TEXT NOT NULL, reason TEXT NOT NULL, description TEXT, status TEXT DEFAULT 'pending', resolved_by TEXT, resolution_action TEXT, resolution_notes TEXT, created_at TEXT NOT NULL, resolved_at TEXT)",
                "CREATE TABLE IF NOT EXISTS manufacturing_proofs (id TEXT PRIMARY KEY, node_id TEXT NOT NULL, submitter_id TEXT NOT NULL, order_id TEXT, proof_type TEXT NOT NULL, description TEXT, evidence_url TEXT NOT NULL, verification_status TEXT DEFAULT 'pending', verified_by TEXT, verification_notes TEXT, created_at TEXT NOT NULL, verified_at TEXT)",
                "CREATE INDEX IF NOT EXISTS idx_dm_sender_recipient ON direct_messages(sender_id, recipient_id)",
                "CREATE INDEX IF NOT EXISTS idx_dm_created_at ON direct_messages(created_at)",
                "CREATE INDEX IF NOT EXISTS idx_dm_recipient_read ON direct_messages(recipient_id, read, created_at)",
                "CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(sender_id, recipient_id, created_at)",
                """CREATE TABLE IF NOT EXISTS agents (
                    id TEXT PRIMARY KEY,
                    name TEXT UNIQUE NOT NULL,
                    display_name TEXT,
                    description TEXT NOT NULL,
                    type TEXT NOT NULL DEFAULT 'openclaw',
                    status TEXT NOT NULL DEFAULT 'pending_claim',
                    reputation INTEGER NOT NULL DEFAULT 0,
                    tier TEXT NOT NULL DEFAULT 'newcomer',
                    api_key TEXT UNIQUE NOT NULL,
                    callback_url TEXT,
                    avatar_url TEXT,
                    hardware_inventory TEXT,
                    bio TEXT,
                    capabilities_tags TEXT,
                    verification_badge TEXT NOT NULL DEFAULT 'none',
                    total_jobs_completed INTEGER NOT NULL DEFAULT 0,
                    success_rate REAL NOT NULL DEFAULT 0,
                    evolution_level INTEGER DEFAULT 0,
                    evolution_xp INTEGER DEFAULT 0,
                    evolution_title TEXT DEFAULT 'Newborn',
                    location_city TEXT,
                    location_country TEXT,
                    claim_token TEXT,
                    claim_expires_at TEXT,
                    verification_code TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )""",
                "CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)",
                "CREATE INDEX IF NOT EXISTS idx_agents_name ON agents(name)",
            ]:
                try:
                    db.execute(sql)
                except Exception as exc:
                    logger.debug("PG init: %s", exc)

            # Ensure ALL columns exist on production PostgreSQL.
            for table, column_def in [
                ("community_posts", "template_type TEXT"),
                ("community_posts", "upvotes INTEGER NOT NULL DEFAULT 0"),
                ("community_posts", "downvotes INTEGER NOT NULL DEFAULT 0"),
                ("community_posts", "best_answer_comment_id TEXT"),
                ("community_posts", "best_comment_id TEXT"),
                ("community_posts", "country_code TEXT"),
                ("community_posts", "is_resolved INTEGER NOT NULL DEFAULT 0"),
                ("community_posts", "is_pinned INTEGER NOT NULL DEFAULT 0"),
                ("community_posts", "is_locked INTEGER NOT NULL DEFAULT 0"),
                ("community_posts", "resolved_at TEXT"),
                ("community_posts", "space_id TEXT DEFAULT NULL"),
                ("community_comments", "is_best_answer INTEGER NOT NULL DEFAULT 0"),
                ("community_comments", "parent_id TEXT DEFAULT NULL"),
                ("nodes", "country_code TEXT"),
                ("users", "oauth_provider TEXT"),
                ("users", "oauth_id TEXT"),
                ("agents", "avatar_url TEXT"),
                ("agents", "evolution_level INTEGER DEFAULT 0"),
                ("agents", "evolution_xp INTEGER DEFAULT 0"),
                ("agents", "evolution_title TEXT DEFAULT 'Newborn'"),
                ("agents", "location_city TEXT"),
                ("agents", "location_country TEXT"),
                ("agents", "claim_token TEXT"),
                ("agents", "claim_expires_at TEXT"),
                ("agents", "verification_code TEXT"),
                ("agents", "hardware_inventory TEXT"),
                ("agents", "bio TEXT"),
                ("agents", "capabilities_tags TEXT"),
                ("agents", "type TEXT NOT NULL DEFAULT 'openclaw'"),
                ("agents", "status TEXT NOT NULL DEFAULT 'pending_claim'"),
                ("agents", "reputation INTEGER NOT NULL DEFAULT 0"),
                ("agents", "tier TEXT NOT NULL DEFAULT 'newcomer'"),
                ("agents", "verification_badge TEXT NOT NULL DEFAULT 'none'"),
                ("agents", "total_jobs_completed INTEGER NOT NULL DEFAULT 0"),
                ("agents", "success_rate REAL NOT NULL DEFAULT 0"),
            ]:
                try:
                    _safe_add_column(db, table, column_def)
                except Exception as exc:
                    logger.debug("PG init: %s", exc)
        return

    with get_db() as db:
        db.executescript(USERS_TABLE_SQL)
        db.executescript("""
        CREATE TABLE IF NOT EXISTS agents (
            id TEXT PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            display_name TEXT,
            description TEXT NOT NULL,
            type TEXT NOT NULL DEFAULT 'openclaw',
            status TEXT NOT NULL DEFAULT 'pending_claim',
            reputation INTEGER NOT NULL DEFAULT 0,
            tier TEXT NOT NULL DEFAULT 'newcomer',
            api_key TEXT UNIQUE NOT NULL,
            callback_url TEXT,
            avatar_url TEXT,
            hardware_inventory TEXT,  -- JSON array
            bio TEXT,
            capabilities_tags TEXT,  -- JSON array
            verification_badge TEXT NOT NULL DEFAULT 'none',
            total_jobs_completed INTEGER NOT NULL DEFAULT 0,
            success_rate REAL NOT NULL DEFAULT 0,
            evolution_level INTEGER DEFAULT 0,
            evolution_xp INTEGER DEFAULT 0,
            evolution_title TEXT DEFAULT 'Newborn',
            location_city TEXT,
            location_country TEXT,
            claim_token TEXT,
            claim_expires_at TEXT,
            verification_code TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS components (
            id TEXT PRIMARY KEY,
            display_name TEXT NOT NULL,
            description TEXT NOT NULL,
            version TEXT NOT NULL DEFAULT '0.1.0',
            author_id TEXT NOT NULL,
            tags TEXT,          -- JSON array
            capabilities TEXT,  -- JSON array
            compute TEXT,
            material TEXT,
            estimated_cost_cny REAL,
            estimated_print_time TEXT,
            estimated_filament_g REAL,
            manifest_json TEXT,
            status TEXT NOT NULL DEFAULT 'unverified',
            downloads INTEGER NOT NULL DEFAULT 0,
            rating REAL NOT NULL DEFAULT 0.0,
            review_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS posts (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL DEFAULT 'discussion',
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id TEXT NOT NULL,
            tags TEXT,          -- JSON array
            component_id TEXT,
            hardware_available TEXT,  -- JSON array
            budget_cny REAL,
            status TEXT NOT NULL DEFAULT 'open',
            upvotes INTEGER NOT NULL DEFAULT 0,
            downvotes INTEGER NOT NULL DEFAULT 0,
            reply_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS replies (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL,
            author_id TEXT NOT NULL,
            content TEXT NOT NULL,
            component_id TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS votes (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL,
            agent_id TEXT NOT NULL,
            direction TEXT NOT NULL,  -- 'up' or 'down'
            created_at TEXT NOT NULL,
            UNIQUE(post_id, agent_id)
        );

        CREATE INDEX IF NOT EXISTS idx_components_tags ON components(tags);
        CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
        CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
        CREATE INDEX IF NOT EXISTS idx_replies_post_id ON replies(post_id);

        -- ═══ Maker Network ═══

        CREATE TABLE IF NOT EXISTS makers (
            id TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL,  -- user or agent ID (unified auth)
            maker_type TEXT NOT NULL DEFAULT 'maker',  -- 'maker' | 'builder'
            printer_model TEXT NOT NULL,
            printer_brand TEXT NOT NULL,
            build_volume_x REAL NOT NULL,
            build_volume_y REAL NOT NULL,
            build_volume_z REAL NOT NULL,
            materials TEXT NOT NULL DEFAULT '[]',       -- JSON array
            capabilities TEXT NOT NULL DEFAULT '["printing"]',  -- JSON array: printing/assembly/testing
            location_province TEXT NOT NULL,
            location_city TEXT NOT NULL,
            location_district TEXT NOT NULL,
            availability TEXT NOT NULL DEFAULT 'offline', -- open/busy/offline
            pricing_per_hour_cny REAL NOT NULL,
            description TEXT,
            rating REAL NOT NULL DEFAULT 0.0,
            total_orders INTEGER NOT NULL DEFAULT 0,
            success_rate REAL NOT NULL DEFAULT 0.0,
            verified INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_makers_owner ON makers(owner_id);
        CREATE INDEX IF NOT EXISTS idx_makers_availability ON makers(availability);
        CREATE INDEX IF NOT EXISTS idx_makers_location ON makers(location_province, location_city);
        CREATE INDEX IF NOT EXISTS idx_makers_type ON makers(maker_type);

        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            order_number TEXT UNIQUE NOT NULL,
            order_type TEXT NOT NULL DEFAULT 'print_only',  -- 'print_only' | 'full_build'
            customer_id TEXT NOT NULL,
            maker_id TEXT,
            component_id TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            material TEXT,
            delivery_province TEXT NOT NULL,
            delivery_city TEXT NOT NULL,
            delivery_district TEXT NOT NULL,
            delivery_address TEXT NOT NULL,              -- Platform-only visible!
            urgency TEXT NOT NULL DEFAULT 'normal',
            status TEXT NOT NULL DEFAULT 'pending',
            notes TEXT,
            price_total_cny REAL,
            platform_fee_cny REAL,
            maker_income_cny REAL,
            shipping_tracking TEXT,
            shipping_carrier TEXT,
            estimated_completion TEXT,
            actual_completion TEXT,
            -- New enhanced matching fields
            file_id TEXT,
            color TEXT,
            auto_match INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_maker ON orders(maker_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

        CREATE TABLE IF NOT EXISTS order_messages (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            sender_id TEXT NOT NULL,
            sender_role TEXT NOT NULL,                   -- customer/maker/platform
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_order_messages_order ON order_messages(order_id);

        CREATE TABLE IF NOT EXISTS order_reviews (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL,
            reviewer_id TEXT NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            created_at TEXT NOT NULL,
            UNIQUE(order_id, reviewer_id)
        );

        CREATE INDEX IF NOT EXISTS idx_order_reviews_order ON order_reviews(order_id);

        -- ═══ AI Agent Social Platform ═══

        CREATE TABLE IF NOT EXISTS ai_agents (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            emoji TEXT NOT NULL,
            description TEXT NOT NULL,
            provider TEXT NOT NULL,
            capabilities TEXT NOT NULL DEFAULT '[]',  -- JSON array
            wishlist TEXT NOT NULL DEFAULT '[]',       -- JSON array
            owner_id TEXT NOT NULL,
            api_key TEXT UNIQUE NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_ai_agents_provider ON ai_agents(provider);
        CREATE INDEX IF NOT EXISTS idx_ai_agents_api_key ON ai_agents(api_key);

        CREATE TABLE IF NOT EXISTS ai_posts (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            content TEXT NOT NULL,
            post_type TEXT NOT NULL DEFAULT 'update',
            tags TEXT NOT NULL DEFAULT '[]',           -- JSON array
            likes INTEGER NOT NULL DEFAULT 0,
            comments_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_ai_posts_agent ON ai_posts(agent_id);
        CREATE INDEX IF NOT EXISTS idx_ai_posts_type ON ai_posts(post_type);

        CREATE TABLE IF NOT EXISTS ai_post_likes (
            post_id TEXT NOT NULL,
            liker TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY (post_id, liker)
        );

        CREATE TABLE IF NOT EXISTS capability_requests (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL,
            capability TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',  -- open/claimed/fulfilled
            claimed_by TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_cap_requests_status ON capability_requests(status);
        CREATE INDEX IF NOT EXISTS idx_cap_requests_agent ON capability_requests(agent_id);

        -- ═══ Hardware Device Integration ═══

        CREATE TABLE IF NOT EXISTS devices (
            id TEXT PRIMARY KEY,
            device_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            capabilities TEXT NOT NULL DEFAULT '[]',    -- JSON array
            device_token TEXT UNIQUE NOT NULL,
            owner_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'online',      -- online/offline/error
            last_seen_at TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
        CREATE INDEX IF NOT EXISTS idx_devices_token ON devices(device_token);
        CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices(owner_id);

        CREATE TABLE IF NOT EXISTS telemetry (
            id TEXT PRIMARY KEY,
            device_id TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            sensor_type TEXT NOT NULL,
            value REAL NOT NULL,
            unit TEXT NOT NULL,
            received_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_telemetry_device ON telemetry(device_id);
        CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry(received_at);
        CREATE INDEX IF NOT EXISTS idx_telemetry_sensor ON telemetry(sensor_type);

        CREATE TABLE IF NOT EXISTS device_commands (
            id TEXT PRIMARY KEY,
            device_id TEXT NOT NULL,
            command TEXT NOT NULL,
            parameters TEXT NOT NULL DEFAULT '{}',      -- JSON
            requester_agent_id TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',     -- pending/sent/acked/failed
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_device_commands_device ON device_commands(device_id);
        CREATE INDEX IF NOT EXISTS idx_device_commands_status ON device_commands(status);

        -- ═══ Manufacturing Nodes World Map ═══

        CREATE TABLE IF NOT EXISTS nodes (
            id TEXT PRIMARY KEY,
            owner_id TEXT NOT NULL,  -- user or agent ID (unified auth)
            name TEXT NOT NULL,
            node_type TEXT NOT NULL,                     -- 3d_printer/cnc_mill/laser_cutter/etc
            latitude REAL NOT NULL,                      -- Precise location (private)
            longitude REAL NOT NULL,                     -- Precise location (private)
            fuzzy_latitude REAL NOT NULL,                -- Fuzzy location (public)
            fuzzy_longitude REAL NOT NULL,               -- Fuzzy location (public)
            capabilities TEXT NOT NULL DEFAULT '[]',     -- JSON array of capabilities
            materials TEXT NOT NULL DEFAULT '[]',        -- JSON array of supported materials
            build_volume_x REAL,                         -- Build volume in mm
            build_volume_y REAL,                         -- Build volume in mm
            build_volume_z REAL,                         -- Build volume in mm
            description TEXT,
            status TEXT NOT NULL DEFAULT 'offline',      -- online/offline/busy/maintenance
            current_job_id TEXT,                         -- Current job being processed
            queue_length INTEGER NOT NULL DEFAULT 0,     -- Number of jobs in queue
            last_heartbeat TEXT,                         -- Last heartbeat timestamp
            total_jobs INTEGER NOT NULL DEFAULT 0,       -- Total jobs completed
            success_rate REAL NOT NULL DEFAULT 0.0,      -- Success rate (0.0-1.0)
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            UNIQUE(owner_id, name)
        );

        CREATE INDEX IF NOT EXISTS idx_nodes_owner ON nodes(owner_id);
        CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
        CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);
        CREATE INDEX IF NOT EXISTS idx_nodes_location ON nodes(fuzzy_latitude, fuzzy_longitude);
        CREATE INDEX IF NOT EXISTS idx_nodes_heartbeat ON nodes(last_heartbeat);

        CREATE TABLE IF NOT EXISTS manufacturing_proofs (
            id TEXT PRIMARY KEY,
            node_id TEXT NOT NULL,
            submitter_id TEXT NOT NULL,
            order_id TEXT,
            proof_type TEXT NOT NULL,
            description TEXT,
            evidence_url TEXT NOT NULL,
            verification_status TEXT DEFAULT 'pending',
            verified_by TEXT,
            verification_notes TEXT,
            created_at TEXT NOT NULL,
            verified_at TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_manufacturing_proofs_node ON manufacturing_proofs(node_id, created_at);
        CREATE INDEX IF NOT EXISTS idx_manufacturing_proofs_status ON manufacturing_proofs(verification_status);
        """)
        
        # Add files and community tables
        db.executescript(FILES_TABLE_SQL)
        db.executescript(COMMUNITY_TABLES_SQL)
        
        # Migrate community_posts: add upvotes/downvotes if missing
        _safe_add_column(db, "community_posts", "upvotes INTEGER NOT NULL DEFAULT 0")
        _safe_add_column(db, "community_posts", "downvotes INTEGER NOT NULL DEFAULT 0")
        
        # Add parent_id to community_comments for nested comments
        _safe_add_column(db, "community_comments", "parent_id TEXT DEFAULT NULL")

        # Community governance + template + tags
        for table, column_def in [
            ("community_posts", "template_type TEXT"),
            ("community_posts", "is_resolved INTEGER NOT NULL DEFAULT 0"),
            ("community_posts", "best_answer_comment_id TEXT"),
            ("community_posts", "best_comment_id TEXT"),
            ("community_posts", "resolved_at TEXT"),
            ("community_posts", "is_pinned INTEGER NOT NULL DEFAULT 0"),
            ("community_posts", "is_locked INTEGER NOT NULL DEFAULT 0"),
            ("community_comments", "is_best_answer INTEGER NOT NULL DEFAULT 0"),
        ]:
            _safe_add_column(db, table, column_def)
        
        # Add new columns to existing orders table if they don't exist
        # OAuth columns
        _safe_add_column(db, "users", "oauth_provider TEXT")
        _safe_add_column(db, "users", "oauth_id TEXT")
        _safe_add_column(db, "agents", "avatar_url TEXT")

        for table, column_def in [
            ("agents", "bio TEXT"),
            ("agents", "capabilities_tags TEXT"),
            ("agents", "verification_badge TEXT NOT NULL DEFAULT 'none'"),
            ("agents", "total_jobs_completed INTEGER NOT NULL DEFAULT 0"),
            ("agents", "success_rate REAL NOT NULL DEFAULT 0"),
            ("agents", "evolution_level INTEGER DEFAULT 0"),
            ("agents", "evolution_xp INTEGER DEFAULT 0"),
            ("agents", "evolution_title TEXT DEFAULT 'Newborn'"),
            ("orders", "file_id TEXT"),
            ("orders", "color TEXT"),
            ("orders", "auto_match INTEGER NOT NULL DEFAULT 0"),
            ("nodes", "country_code TEXT"),
            ("nodes", "region_code TEXT"),
            ("nodes", "verification_level INTEGER DEFAULT 0"),
            ("nodes", "verification_score REAL DEFAULT 0"),
            ("community_posts", "country_code TEXT"),
        ]:
            _safe_add_column(db, table, column_def)

        # Backfill country_code for existing nodes using bounding boxes
        try:
            from api.routers.nodes import _infer_country_code
            rows = db.execute("SELECT id, latitude, longitude FROM nodes WHERE country_code IS NULL AND latitude IS NOT NULL").fetchall()
            for row in rows:
                code = _infer_country_code(row["latitude"], row["longitude"])
                if code:
                    db.execute("UPDATE nodes SET country_code = ? WHERE id = ?", (code, row["id"]))
            if rows:
                db.commit()
        except Exception as exc:
            logger.debug("PG init: %s", exc)  # Non-critical, will be filled on next registration

        # Enable foreign keys and add protective indexes
        db.execute("PRAGMA foreign_keys = ON")

        # Additional indexes for common queries
        for idx_sql in [
            "CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id)",
            "CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type)",
            "CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id)",
            "CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id)",
            "CREATE INDEX IF NOT EXISTS idx_orders_maker ON orders(maker_id)",
            "CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status)",
            "CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id)",
            "CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)",
            "CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status)",
            "CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)",
            "CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)",
        ]:
            try:
                db.execute(idx_sql)
            except Exception as exc:
                logger.debug("PG init: %s", exc)

        # ── Follows table ─────────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS follows (
                id TEXT PRIMARY KEY,
                follower_id TEXT NOT NULL,
                following_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(follower_id, following_id)
            )
        """)

        # ── Direct messages ───────────────────────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS direct_messages (
                id TEXT PRIMARY KEY,
                sender_id TEXT NOT NULL,
                recipient_id TEXT NOT NULL,
                content TEXT NOT NULL,
                read INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)
        db.execute("CREATE INDEX IF NOT EXISTS idx_dm_sender_recipient ON direct_messages(sender_id, recipient_id)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_dm_created_at ON direct_messages(created_at)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_dm_recipient_read ON direct_messages(recipient_id, read, created_at)")
        db.execute("CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(sender_id, recipient_id, created_at)")

        db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                from_user TEXT NOT NULL,
                to_user TEXT NOT NULL,
                content TEXT NOT NULL,
                read INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)

        db.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                reporter_id TEXT NOT NULL,
                target_type TEXT NOT NULL,
                target_id TEXT NOT NULL,
                reason TEXT NOT NULL,
                description TEXT,
                status TEXT DEFAULT 'pending',
                resolved_by TEXT,
                resolution_action TEXT,
                resolution_notes TEXT,
                created_at TEXT NOT NULL,
                resolved_at TEXT
            )
        """)

        # ── Spaces (submolt-like communities) ─────────────────────
        db.execute("""
            CREATE TABLE IF NOT EXISTS spaces (
                id TEXT PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                description TEXT DEFAULT '',
                icon TEXT DEFAULT '🏭',
                creator_id TEXT NOT NULL,
                member_count INTEGER DEFAULT 0,
                post_count INTEGER DEFAULT 0,
                created_at TEXT NOT NULL
            )
        """)
        db.execute("""
            CREATE TABLE IF NOT EXISTS space_members (
                space_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                role TEXT DEFAULT 'member',
                joined_at TEXT NOT NULL,
                PRIMARY KEY(space_id, user_id)
            )
        """)

        # Add space_id to community_posts if not exists
        _safe_add_column(db, "community_posts", "space_id TEXT DEFAULT NULL")

        # Seed default tags
        default_tags = {
            "craft": ["3D Printing", "CNC", "Laser Cut", "Injection Molding"],
            "material": ["PLA", "ABS", "PETG", "Resin", "Metal", "Wood"],
            "equipment": ["FDM", "SLA", "SLS"],
            "scene": ["Robotics", "IoT", "Wearable", "Home", "Industrial"],
        }
        for category, names in default_tags.items():
            for name in names:
                try:
                    db.execute(
                        "INSERT INTO tags (id, name, category, created_at) VALUES (?, ?, ?, datetime('now'))",
                        (f"tag-{category}-{name.lower().replace(' ', '-').replace('/', '-')}", name, category),
                    )
                except Exception as exc:
                    logger.debug("PG init: %s", exc)


if __name__ == "__main__":
    init_db()
    print(f"✅ Database initialized at {DB_PATH}")
