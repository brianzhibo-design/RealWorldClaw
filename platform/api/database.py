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
            author_id TEXT NOT NULL REFERENCES agents(id),
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
            author_id TEXT NOT NULL REFERENCES agents(id),
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
            post_id TEXT NOT NULL REFERENCES posts(id),
            author_id TEXT NOT NULL REFERENCES agents(id),
            content TEXT NOT NULL,
            component_id TEXT,
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS votes (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL REFERENCES posts(id),
            agent_id TEXT NOT NULL REFERENCES agents(id),
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
            owner_id TEXT NOT NULL REFERENCES agents(id),
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
            customer_id TEXT NOT NULL REFERENCES agents(id),
            maker_id TEXT REFERENCES makers(id),
            component_id TEXT NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            material TEXT,
            delivery_province TEXT NOT NULL,
            delivery_city TEXT NOT NULL,
            delivery_district TEXT NOT NULL,
            delivery_address TEXT NOT NULL,              -- 仅平台可见！
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
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_maker ON orders(maker_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

        CREATE TABLE IF NOT EXISTS order_messages (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(id),
            sender_id TEXT NOT NULL,
            sender_role TEXT NOT NULL,                   -- customer/maker/platform
            message TEXT NOT NULL,
            created_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_order_messages_order ON order_messages(order_id);

        CREATE TABLE IF NOT EXISTS order_reviews (
            id TEXT PRIMARY KEY,
            order_id TEXT NOT NULL REFERENCES orders(id),
            reviewer_id TEXT NOT NULL REFERENCES agents(id),
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
            agent_id TEXT NOT NULL REFERENCES ai_agents(id),
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
            post_id TEXT NOT NULL REFERENCES ai_posts(id),
            liker TEXT NOT NULL,
            created_at TEXT NOT NULL,
            PRIMARY KEY (post_id, liker)
        );

        CREATE TABLE IF NOT EXISTS capability_requests (
            id TEXT PRIMARY KEY,
            agent_id TEXT NOT NULL REFERENCES ai_agents(id),
            capability TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'open',  -- open/claimed/fulfilled
            claimed_by TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_cap_requests_status ON capability_requests(status);
        CREATE INDEX IF NOT EXISTS idx_cap_requests_agent ON capability_requests(agent_id);
        """)


if __name__ == "__main__":
    init_db()
    print(f"✅ Database initialized at {DB_PATH}")
