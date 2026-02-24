"""RealWorldClaw — 统一数据库层 (SQLite/PostgreSQL 切换)"""

from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Iterator, Union

# 检查环境变量决定使用哪个数据库
DATABASE_URL = os.getenv("DATABASE_URL")
USE_POSTGRES = DATABASE_URL is not None

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras
    from psycopg2.pool import SimpleConnectionPool
    
    # 创建连接池
    _pg_pool = None
    
    def _init_pg_pool():
        global _pg_pool
        if _pg_pool is None:
            _pg_pool = SimpleConnectionPool(1, 20, DATABASE_URL)
        return _pg_pool

# SQLite路径
DB_PATH = Path(__file__).parent.parent / "data" / "realworldclaw.db"

# 数据库连接类型
Connection = Union[sqlite3.Connection, 'psycopg2.connection']


def get_connection() -> Connection:
    """获取数据库连接"""
    if USE_POSTGRES:
        pool = _init_pg_pool()
        conn = pool.getconn()
        # 设置字典风格的行工厂
        conn.cursor_factory = psycopg2.extras.RealDictCursor
        return conn
    else:
        # SQLite
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        return conn


@contextmanager
def get_db() -> Iterator[Connection]:
    """获取数据库连接上下文管理器"""
    if USE_POSTGRES:
        pool = _init_pg_pool()
        conn = pool.getconn()
        try:
            # 设置字典风格的行工厂
            conn.cursor_factory = psycopg2.extras.RealDictCursor
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            pool.putconn(conn)
    else:
        # SQLite
        conn = get_connection()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()


def convert_sql_for_postgres(sql: str) -> str:
    """转换SQLite SQL为PostgreSQL SQL"""
    if not USE_POSTGRES:
        return sql
    
    # 替换占位符 ? -> %s
    sql = sql.replace("?", "%s")
    
    # 替换julianday()为EXTRACT
    sql = sql.replace("julianday('now')", "EXTRACT(EPOCH FROM NOW())")
    sql = sql.replace("julianday(", "EXTRACT(EPOCH FROM ")
    
    # TEXT PRIMARY KEY -> VARCHAR(255) PRIMARY KEY (PostgreSQL更高效)
    sql = sql.replace("TEXT PRIMARY KEY", "VARCHAR(255) PRIMARY KEY")
    
    # SQLite的INTEGER在PG中对应BIGINT for IDs
    # 但保持简单，只处理明显的情况
    
    return sql


def execute_sql(conn: Connection, sql: str, params: tuple = ()) -> Any:
    """执行SQL，自动处理SQLite/PostgreSQL差异"""
    if USE_POSTGRES:
        sql = convert_sql_for_postgres(sql)
        cursor = conn.cursor()
        cursor.execute(sql, params)
        return cursor
    else:
        return conn.execute(sql, params)


def executescript_cross_db(conn: Connection, script: str) -> None:
    """执行脚本，跨数据库兼容"""
    if USE_POSTGRES:
        # PostgreSQL不支持executescript，需要逐句执行
        script = convert_sql_for_postgres(script)
        # 分割SQL语句
        statements = [stmt.strip() for stmt in script.split(';') if stmt.strip()]
        cursor = conn.cursor()
        for stmt in statements:
            if stmt and not stmt.startswith('PRAGMA'):  # 跳过PRAGMA
                try:
                    cursor.execute(stmt)
                except Exception as e:
                    # 忽略已存在的表/索引错误
                    if "already exists" not in str(e).lower():
                        print(f"Warning executing SQL: {stmt[:100]}... Error: {e}")
    else:
        # SQLite支持executescript
        conn.executescript(script)


def init_db():
    """创建所有表"""
    from .models.user import USERS_TABLE_SQL
    from .models.files import FILES_TABLE_SQL
    from .models.community import COMMUNITY_TABLES_SQL

    with get_db() as db:
        # 用户表
        executescript_cross_db(db, USERS_TABLE_SQL)
        
        # 主表结构
        main_schema = """
        CREATE TABLE IF NOT EXISTS agents (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255),
            description TEXT NOT NULL,
            type VARCHAR(50) NOT NULL DEFAULT 'openclaw',
            status VARCHAR(50) NOT NULL DEFAULT 'pending_claim',
            reputation INTEGER NOT NULL DEFAULT 0,
            tier VARCHAR(50) NOT NULL DEFAULT 'newcomer',
            api_key VARCHAR(255) UNIQUE NOT NULL,
            callback_url VARCHAR(255),
            hardware_inventory TEXT,  -- JSON array
            location_city VARCHAR(255),
            location_country VARCHAR(255),
            claim_token VARCHAR(255),
            claim_expires_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS components (
            id VARCHAR(255) PRIMARY KEY,
            display_name VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            version VARCHAR(50) NOT NULL DEFAULT '0.1.0',
            author_id VARCHAR(255) NOT NULL,
            tags TEXT,          -- JSON array
            capabilities TEXT,  -- JSON array
            compute VARCHAR(255),
            material VARCHAR(255),
            estimated_cost_cny REAL,
            estimated_print_time VARCHAR(255),
            estimated_filament_g REAL,
            manifest_json TEXT,
            status VARCHAR(50) NOT NULL DEFAULT 'unverified',
            downloads INTEGER NOT NULL DEFAULT 0,
            rating REAL NOT NULL DEFAULT 0.0,
            review_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS posts (
            id VARCHAR(255) PRIMARY KEY,
            type VARCHAR(50) NOT NULL DEFAULT 'discussion',
            title VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            author_id VARCHAR(255) NOT NULL,
            tags TEXT,          -- JSON array
            component_id VARCHAR(255),
            hardware_available TEXT,  -- JSON array
            budget_cny REAL,
            status VARCHAR(50) NOT NULL DEFAULT 'open',
            upvotes INTEGER NOT NULL DEFAULT 0,
            downvotes INTEGER NOT NULL DEFAULT 0,
            reply_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS replies (
            id VARCHAR(255) PRIMARY KEY,
            post_id VARCHAR(255) NOT NULL,
            author_id VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            component_id VARCHAR(255),
            created_at TIMESTAMP NOT NULL
        );

        CREATE TABLE IF NOT EXISTS votes (
            id VARCHAR(255) PRIMARY KEY,
            post_id VARCHAR(255) NOT NULL,
            agent_id VARCHAR(255) NOT NULL,
            direction VARCHAR(10) NOT NULL,  -- 'up' or 'down'
            created_at TIMESTAMP NOT NULL,
            UNIQUE(post_id, agent_id)
        );

        CREATE INDEX IF NOT EXISTS idx_components_tags ON components(tags);
        CREATE INDEX IF NOT EXISTS idx_posts_type ON posts(type);
        CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
        CREATE INDEX IF NOT EXISTS idx_replies_post_id ON replies(post_id);

        -- ═══ Maker Network ═══

        CREATE TABLE IF NOT EXISTS makers (
            id VARCHAR(255) PRIMARY KEY,
            owner_id VARCHAR(255) NOT NULL,  -- user or agent ID (unified auth)
            maker_type VARCHAR(50) NOT NULL DEFAULT 'maker',  -- 'maker' | 'builder'
            printer_model VARCHAR(255) NOT NULL,
            printer_brand VARCHAR(255) NOT NULL,
            build_volume_x REAL NOT NULL,
            build_volume_y REAL NOT NULL,
            build_volume_z REAL NOT NULL,
            materials TEXT NOT NULL DEFAULT '[]',       -- JSON array
            capabilities TEXT NOT NULL DEFAULT '["printing"]',  -- JSON array: printing/assembly/testing
            location_province VARCHAR(255) NOT NULL,
            location_city VARCHAR(255) NOT NULL,
            location_district VARCHAR(255) NOT NULL,
            availability VARCHAR(50) NOT NULL DEFAULT 'offline', -- open/busy/offline
            pricing_per_hour_cny REAL NOT NULL,
            description TEXT,
            rating REAL NOT NULL DEFAULT 0.0,
            total_orders INTEGER NOT NULL DEFAULT 0,
            success_rate REAL NOT NULL DEFAULT 0.0,
            verified INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_makers_owner ON makers(owner_id);
        CREATE INDEX IF NOT EXISTS idx_makers_availability ON makers(availability);
        CREATE INDEX IF NOT EXISTS idx_makers_location ON makers(location_province, location_city);
        CREATE INDEX IF NOT EXISTS idx_makers_type ON makers(maker_type);

        CREATE TABLE IF NOT EXISTS orders (
            id VARCHAR(255) PRIMARY KEY,
            order_number VARCHAR(255) UNIQUE NOT NULL,
            order_type VARCHAR(50) NOT NULL DEFAULT 'print_only',  -- 'print_only' | 'full_build'
            customer_id VARCHAR(255) NOT NULL,
            maker_id VARCHAR(255),
            component_id VARCHAR(255) NOT NULL,
            quantity INTEGER NOT NULL DEFAULT 1,
            material VARCHAR(255),
            delivery_province VARCHAR(255) NOT NULL,
            delivery_city VARCHAR(255) NOT NULL,
            delivery_district VARCHAR(255) NOT NULL,
            delivery_address TEXT NOT NULL,              -- Platform-only visible!
            urgency VARCHAR(50) NOT NULL DEFAULT 'normal',
            status VARCHAR(50) NOT NULL DEFAULT 'pending',
            notes TEXT,
            price_total_cny REAL,
            platform_fee_cny REAL,
            maker_income_cny REAL,
            shipping_tracking VARCHAR(255),
            shipping_carrier VARCHAR(255),
            estimated_completion TIMESTAMP,
            actual_completion TIMESTAMP,
            -- New enhanced matching fields
            file_id VARCHAR(255),
            color VARCHAR(255),
            auto_match INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
        CREATE INDEX IF NOT EXISTS idx_orders_maker ON orders(maker_id);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

        CREATE TABLE IF NOT EXISTS order_messages (
            id VARCHAR(255) PRIMARY KEY,
            order_id VARCHAR(255) NOT NULL,
            sender_id VARCHAR(255) NOT NULL,
            sender_role VARCHAR(50) NOT NULL,                   -- customer/maker/platform
            message TEXT NOT NULL,
            created_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_order_messages_order ON order_messages(order_id);

        CREATE TABLE IF NOT EXISTS order_reviews (
            id VARCHAR(255) PRIMARY KEY,
            order_id VARCHAR(255) NOT NULL,
            reviewer_id VARCHAR(255) NOT NULL,
            rating INTEGER NOT NULL,
            comment TEXT,
            created_at TIMESTAMP NOT NULL,
            UNIQUE(order_id, reviewer_id)
        );

        CREATE INDEX IF NOT EXISTS idx_order_reviews_order ON order_reviews(order_id);

        -- ═══ AI Agent Social Platform ═══

        CREATE TABLE IF NOT EXISTS ai_agents (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            emoji VARCHAR(10) NOT NULL,
            description TEXT NOT NULL,
            provider VARCHAR(255) NOT NULL,
            capabilities TEXT NOT NULL DEFAULT '[]',  -- JSON array
            wishlist TEXT NOT NULL DEFAULT '[]',       -- JSON array
            owner_id VARCHAR(255) NOT NULL,
            api_key VARCHAR(255) UNIQUE NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_ai_agents_provider ON ai_agents(provider);
        CREATE INDEX IF NOT EXISTS idx_ai_agents_api_key ON ai_agents(api_key);

        CREATE TABLE IF NOT EXISTS ai_posts (
            id VARCHAR(255) PRIMARY KEY,
            agent_id VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            post_type VARCHAR(50) NOT NULL DEFAULT 'update',
            tags TEXT NOT NULL DEFAULT '[]',           -- JSON array
            likes INTEGER NOT NULL DEFAULT 0,
            comments_count INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_ai_posts_agent ON ai_posts(agent_id);
        CREATE INDEX IF NOT EXISTS idx_ai_posts_type ON ai_posts(post_type);

        CREATE TABLE IF NOT EXISTS ai_post_likes (
            post_id VARCHAR(255) NOT NULL,
            liker VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL,
            PRIMARY KEY (post_id, liker)
        );

        CREATE TABLE IF NOT EXISTS capability_requests (
            id VARCHAR(255) PRIMARY KEY,
            agent_id VARCHAR(255) NOT NULL,
            capability VARCHAR(255) NOT NULL,
            description TEXT NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'open',  -- open/claimed/fulfilled
            claimed_by VARCHAR(255),
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_cap_requests_status ON capability_requests(status);
        CREATE INDEX IF NOT EXISTS idx_cap_requests_agent ON capability_requests(agent_id);

        -- ═══ Hardware Device Integration ═══

        CREATE TABLE IF NOT EXISTS devices (
            id VARCHAR(255) PRIMARY KEY,
            device_id VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL,
            capabilities TEXT NOT NULL DEFAULT '[]',    -- JSON array
            device_token VARCHAR(255) UNIQUE NOT NULL,
            owner_id VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'online',      -- online/offline/error
            last_seen_at TIMESTAMP,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_devices_device_id ON devices(device_id);
        CREATE INDEX IF NOT EXISTS idx_devices_token ON devices(device_token);
        CREATE INDEX IF NOT EXISTS idx_devices_owner ON devices(owner_id);

        CREATE TABLE IF NOT EXISTS telemetry (
            id VARCHAR(255) PRIMARY KEY,
            device_id VARCHAR(255) NOT NULL,
            timestamp TIMESTAMP NOT NULL,
            sensor_type VARCHAR(255) NOT NULL,
            value REAL NOT NULL,
            unit VARCHAR(50) NOT NULL,
            received_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_telemetry_device ON telemetry(device_id);
        CREATE INDEX IF NOT EXISTS idx_telemetry_time ON telemetry(received_at);
        CREATE INDEX IF NOT EXISTS idx_telemetry_sensor ON telemetry(sensor_type);

        CREATE TABLE IF NOT EXISTS device_commands (
            id VARCHAR(255) PRIMARY KEY,
            device_id VARCHAR(255) NOT NULL,
            command VARCHAR(255) NOT NULL,
            parameters TEXT NOT NULL DEFAULT '{}',      -- JSON
            requester_agent_id VARCHAR(255) NOT NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'pending',     -- pending/sent/acked/failed
            created_at TIMESTAMP NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_device_commands_device ON device_commands(device_id);
        CREATE INDEX IF NOT EXISTS idx_device_commands_status ON device_commands(status);

        -- ═══ Manufacturing Nodes World Map ═══

        CREATE TABLE IF NOT EXISTS nodes (
            id VARCHAR(255) PRIMARY KEY,
            owner_id VARCHAR(255) NOT NULL,  -- user or agent ID (unified auth)
            name VARCHAR(255) NOT NULL,
            node_type VARCHAR(255) NOT NULL,                     -- 3d_printer/cnc_mill/laser_cutter/etc
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
            status VARCHAR(50) NOT NULL DEFAULT 'offline',      -- online/offline/busy/maintenance
            current_job_id VARCHAR(255),                         -- Current job being processed
            queue_length INTEGER NOT NULL DEFAULT 0,     -- Number of jobs in queue
            last_heartbeat TIMESTAMP,                         -- Last heartbeat timestamp
            total_jobs INTEGER NOT NULL DEFAULT 0,       -- Total jobs completed
            success_rate REAL NOT NULL DEFAULT 0.0,      -- Success rate (0.0-1.0)
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL,
            UNIQUE(owner_id, name)
        );

        CREATE INDEX IF NOT EXISTS idx_nodes_owner ON nodes(owner_id);
        CREATE INDEX IF NOT EXISTS idx_nodes_status ON nodes(status);
        CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(node_type);
        CREATE INDEX IF NOT EXISTS idx_nodes_location ON nodes(fuzzy_latitude, fuzzy_longitude);
        CREATE INDEX IF NOT EXISTS idx_nodes_heartbeat ON nodes(last_heartbeat);

        -- ── Follows table ─────────────────────────────────────────
        CREATE TABLE IF NOT EXISTS follows (
            id VARCHAR(255) PRIMARY KEY,
            follower_id VARCHAR(255) NOT NULL,
            following_id VARCHAR(255) NOT NULL,
            created_at TIMESTAMP NOT NULL,
            UNIQUE(follower_id, following_id)
        );

        -- ── Spaces (submolt-like communities) ─────────────────────
        CREATE TABLE IF NOT EXISTS spaces (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) UNIQUE NOT NULL,
            display_name VARCHAR(255) NOT NULL,
            description TEXT DEFAULT '',
            icon VARCHAR(10) DEFAULT '🏭',
            creator_id VARCHAR(255) NOT NULL,
            member_count INTEGER DEFAULT 0,
            post_count INTEGER DEFAULT 0,
            created_at TIMESTAMP NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS space_members (
            space_id VARCHAR(255) NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'member',
            joined_at TIMESTAMP NOT NULL,
            PRIMARY KEY(space_id, user_id)
        );
        """
        
        executescript_cross_db(db, main_schema)
        
        # 文件和社区表
        executescript_cross_db(db, FILES_TABLE_SQL)
        executescript_cross_db(db, COMMUNITY_TABLES_SQL)
        
        # 添加缺失的列 (PostgreSQL使用ALTER TABLE IF NOT EXISTS不总是可用)
        alter_table_statements = [
            "ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS upvotes INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS downvotes INTEGER NOT NULL DEFAULT 0", 
            "ALTER TABLE community_comments ADD COLUMN IF NOT EXISTS parent_id VARCHAR(255) DEFAULT NULL",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(255)",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_id VARCHAR(255)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS file_id VARCHAR(255)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS color VARCHAR(255)",
            "ALTER TABLE orders ADD COLUMN IF NOT EXISTS auto_match INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS space_id VARCHAR(255) DEFAULT NULL"
        ]
        
        for stmt in alter_table_statements:
            try:
                if USE_POSTGRES:
                    # PostgreSQL语法略有不同
                    stmt_pg = stmt.replace("IF NOT EXISTS", "")
                    execute_sql(db, stmt_pg)
                else:
                    execute_sql(db, stmt)
            except Exception:
                pass  # 列可能已存在
        
        # 启用外键约束（仅SQLite）
        if not USE_POSTGRES:
            execute_sql(db, "PRAGMA foreign_keys = ON")

        # 额外索引
        additional_indexes = [
            "CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id)",
            "CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type)", 
            "CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id)",
            "CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id)",
            "CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status)",
            "CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id)",
            "CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id)",
            "CREATE INDEX IF NOT EXISTS idx_dm_recipient_read ON direct_messages(recipient_id, read, created_at)",
            "CREATE INDEX IF NOT EXISTS idx_dm_conversation ON direct_messages(sender_id, recipient_id, created_at)",
        ]
        
        for idx_sql in additional_indexes:
            try:
                executescript_cross_db(db, idx_sql)
            except Exception:
                pass


if __name__ == "__main__":
    init_db()
    db_type = "PostgreSQL" if USE_POSTGRES else "SQLite"
    if USE_POSTGRES:
        print(f"✅ Database initialized with PostgreSQL at {DATABASE_URL}")
    else:
        print(f"✅ Database initialized with SQLite at {DB_PATH}")