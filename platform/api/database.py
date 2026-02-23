"""RealWorldClaw — SQLite数据库（MVP版）"""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "data" / "realworldclaw.db"


def get_connection() -> sqlite3.Connection:
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


def init_db():
    """创建所有表"""
    from .models.user import USERS_TABLE_SQL
    from .models.files import FILES_TABLE_SQL
    from .models.community import COMMUNITY_TABLES_SQL

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
            hardware_inventory TEXT,  -- JSON array
            location_city TEXT,
            location_country TEXT,
            claim_token TEXT,
            claim_expires_at TEXT,
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
        """)
        
        # Add files and community tables
        db.executescript(FILES_TABLE_SQL)
        db.executescript(COMMUNITY_TABLES_SQL)
        
        # Migrate community_posts: add upvotes/downvotes if missing
        try:
            db.execute("ALTER TABLE community_posts ADD COLUMN upvotes INTEGER NOT NULL DEFAULT 0")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE community_posts ADD COLUMN downvotes INTEGER NOT NULL DEFAULT 0")
        except Exception:
            pass
        
        # Add new columns to existing orders table if they don't exist
        # OAuth columns
        try:
            db.execute("ALTER TABLE users ADD COLUMN oauth_provider TEXT")
        except Exception:
            pass
        try:
            db.execute("ALTER TABLE users ADD COLUMN oauth_id TEXT")
        except Exception:
            pass

        try:
            db.execute("ALTER TABLE orders ADD COLUMN file_id TEXT")
        except Exception:
            pass  # Column already exists
        try:
            db.execute("ALTER TABLE orders ADD COLUMN color TEXT")
        except Exception:
            pass  # Column already exists
        try:
            db.execute("ALTER TABLE orders ADD COLUMN auto_match INTEGER NOT NULL DEFAULT 0")
        except Exception:
            pass  # Column already exists


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
        ]:
            try:
                db.execute(idx_sql)
            except Exception:
                pass


if __name__ == "__main__":
    init_db()
    print(f"✅ Database initialized at {DB_PATH}")
