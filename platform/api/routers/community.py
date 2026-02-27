"""Community API for posts and comments."""

from __future__ import annotations
import logging
import os
logger = logging.getLogger(__name__)

import html
import json
import re
import time
import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query

from jose import JWTError

from ..api_keys import find_agent_by_api_key
from ..database import get_db, _safe_add_column
from ..deps import get_authenticated_identity
from ..notifications import send_notification
from ..security import decode_token
from ..services.evolution import grant_agent_xp
from ..models.community import (
    CommentCreateRequest,
    CommentResponse,
    PostCreateRequest,
    PostDetailResponse,
    PostListResponse,
    PostResponse,
    PostSortType,
    PostType,
    VoteRequest,
    VoteResponse,
    ReportPostRequest,
    BestAnswerRequest,
    PostTemplateType,
)

# Lightweight HTML sanitizer (no extra dependency)
_TAG_RE = re.compile(r"<[^>]{0,500}>")  # bounded to prevent ReDoS

# Simple in-memory rate limiter for community actions
_community_rate: dict[str, list[float]] = defaultdict(list)

def _rate_check(key: str, max_calls: int, window: int) -> bool:
    if os.environ.get("TESTING"):
        return True
    """Return True if request is allowed, False if rate-limited."""
    now = time.monotonic()
    bucket = _community_rate[key]
    _community_rate[key] = [t for t in bucket if now - t < window]
    if len(_community_rate[key]) >= max_calls:
        return False
    _community_rate[key].append(now)
    return True

def _sanitize(text: str) -> str:
    """Strip all HTML tags and escape remaining entities."""
    return html.escape(_TAG_RE.sub("", text))


def _get_optional_identity(authorization: str | None) -> dict | None:
    """Best-effort auth parse for endpoints that are public but can use identity-aware filters."""
    if not authorization or not authorization.startswith("Bearer "):
        return None

    token = authorization.removeprefix("Bearer ")

    try:
        payload = decode_token(token)
        if payload.get("type") == "access":
            user_id = payload.get("sub")
            if user_id:
                with get_db() as db:
                    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
                if row and row["is_active"]:
                    result = dict(row)
                    result["identity_type"] = "user"
                    result["identity_id"] = row["id"]
                    return result
    except JWTError:
        pass

    with get_db() as db:
        row = find_agent_by_api_key(db, token)
    if row:
        result = dict(row)
        result["identity_type"] = "agent"
        result["identity_id"] = row["id"]
        return result

    return None


def _resolve_author_type(author_id: str, db) -> str:
    """Determine author_type from email: 'agent' if @agents.rwc.dev, else 'human'."""
    if not db or not author_id:
        return "human"
    try:
        row = db.execute("SELECT email FROM users WHERE id = ?", (author_id,)).fetchone()
        if row and row["email"] and "@agents.rwc.dev" in row["email"]:
            return "agent"
    except Exception:
        pass
    return "human"


def _build_comment_tree(comments: list[dict], db=None) -> list[CommentResponse]:
    """Build nested comment structure from flat list."""
    comment_map = {}
    root_comments = []
    
    # Create CommentResponse objects with author names
    for row in comments:
        # Resolve author name
        author_name = None
        if db and row.get("author_id"):
            try:
                user_row = db.execute("SELECT username FROM users WHERE id = ?", (row["author_id"],)).fetchone()
                if user_row:
                    author_name = user_row["username"]
            except Exception:
                pass
        
        author_type = _resolve_author_type(row["author_id"], db) if db else row.get("author_type", "human")
        
        comment = CommentResponse(
            id=row["id"],
            post_id=row["post_id"],
            content=row["content"],
            author_id=row["author_id"],
            author_type=author_type,
            parent_id=row.get("parent_id"),
            author_name=author_name,
            replies=[],
            is_best_answer=bool(row.get("is_best_answer", 0)),
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )
        comment_map[row["id"]] = comment
        
        # Add to root if no parent, otherwise add to parent's replies
        if row.get("parent_id") is None:
            root_comments.append(comment)
        else:
            parent = comment_map.get(row["parent_id"])
            if parent:
                parent.replies.append(comment)
    
    return root_comments

router = APIRouter(prefix="/community", tags=["community"])


@router.get("/map/regions")
async def get_community_map_regions():
    """Return community post counts grouped by country_code."""
    with get_db() as db:
        _safe_add_column(db, "community_posts", "country_code TEXT")

        rows = db.execute(
            """
            SELECT country_code, COUNT(*) AS post_count
            FROM community_posts
            WHERE country_code IS NOT NULL
            GROUP BY country_code
            ORDER BY post_count DESC
            """
        ).fetchall()

    return [
        {"country_code": row["country_code"], "post_count": row["post_count"]}
        for row in rows
    ]


def _row_to_post_response(row: dict, db=None) -> PostResponse:
    """Convert database row to PostResponse."""
    images = None
    if row["images"]:
        try:
            images = json.loads(row["images"])
        except json.JSONDecodeError:
            images = None

    # Handle optional columns for compatibility with old schema
    keys = row.keys() if hasattr(row, 'keys') else row
    upvotes = row["upvotes"] if "upvotes" in keys else 0
    downvotes = row["downvotes"] if "downvotes" in keys else 0

    # Resolve author name and type from email
    author_name = None
    author_type = _resolve_author_type(row["author_id"], db) if db else row.get("author_type", "human")
    if db and row.get("author_id"):
        try:
            user_row = db.execute("SELECT username FROM users WHERE id = ?", (row["author_id"],)).fetchone()
            if user_row:
                author_name = user_row["username"]
        except Exception as e:
            logger.exception("Unexpected error in _row_to_post_response: %s", e)

    tags: list[str] = []
    if db:
        try:
            tag_rows = db.execute(
                """
                SELECT t.name FROM tags t
                JOIN post_tags pt ON pt.tag_id = t.id
                WHERE pt.post_id = ?
                ORDER BY t.name ASC
                """,
                (row["id"],),
            ).fetchall()
            tags = [tr["name"] for tr in tag_rows]
        except Exception:
            tags = []

    template_type = row["template_type"] if "template_type" in keys else None

    return PostResponse(
        id=row["id"],
        title=row["title"],
        content=row["content"],
        post_type=PostType(row["post_type"]),
        author_id=row["author_id"],
        author_type=author_type,
        author_name=author_name,
        file_id=row["file_id"],
        images=images,
        tags=tags,
        template_type=PostTemplateType(template_type) if template_type else None,
        is_resolved=bool(row["is_resolved"]) if "is_resolved" in keys else False,
        is_pinned=bool(row["is_pinned"]) if "is_pinned" in keys else False,
        is_locked=bool(row["is_locked"]) if "is_locked" in keys else False,
        best_answer_comment_id=row["best_answer_comment_id"] if "best_answer_comment_id" in keys else None,
        best_comment_id=row["best_comment_id"] if "best_comment_id" in keys else None,
        resolved_at=row["resolved_at"] if "resolved_at" in keys else None,
        comment_count=row["comment_count"],
        likes_count=row["likes_count"],
        upvotes=upvotes,
        downvotes=downvotes,
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.post("/posts", response_model=PostResponse)
async def create_post(
    post: PostCreateRequest,
    identity: dict = Depends(get_authenticated_identity)
):
    """Create a new community post."""
    # Rate limit check
    if not _rate_check(f"post:{identity['identity_id']}", max_calls=10, window=3600):
        raise HTTPException(429, "Too many posts. Try again later.")
    
    # Sanitize user input
    post.title = _sanitize(post.title)
    post.content = _sanitize(post.content)

    # Validate file_id if provided
    if post.file_id:
        with get_db() as db:
            file_row = db.execute(
                "SELECT id FROM files WHERE id = ?", 
                (post.file_id,)
            ).fetchone()
            if not file_row:
                raise HTTPException(status_code=400, detail="File not found")
    
    post_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    
    images_json = json.dumps(post.images) if post.images else None
    
    with get_db() as db:
        _ensure_community_schema(db)

        db.execute("""
            INSERT INTO community_posts (
                id, title, content, post_type, author_id, author_type,
                file_id, images, template_type,
                comment_count, likes_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        """, (
            post_id,
            post.title,
            post.content,
            post.post_type.value,
            identity["identity_id"],
            identity["identity_type"],
            post.file_id,
            images_json,
            post.template_type.value if post.template_type else None,
            now,
            now
        ))

        for raw_tag in post.tags:
            tag_name = raw_tag.strip()
            if not tag_name:
                continue
            tag_row = db.execute("SELECT id FROM tags WHERE LOWER(name)=LOWER(?)", (tag_name,)).fetchone()
            if tag_row:
                db.execute(
                    """
                    INSERT INTO post_tags (post_id, tag_id)
                    VALUES (?, ?)
                    ON CONFLICT(post_id, tag_id) DO NOTHING
                    """,
                    (post_id, tag_row["id"]),
                )

        if identity.get("identity_type") == "agent":
            grant_agent_xp(db, identity["identity_id"], 10)

        # Fetch + map created post before db context exits
        row = db.execute("""
            SELECT * FROM community_posts WHERE id = ?
        """, (post_id,)).fetchone()
        response = _row_to_post_response(dict(row), db)

    logger.info("Post created: id=%s by=%s type=%s", post_id, identity["identity_id"], post.post_type)
    return response


@router.get("/posts", response_model=PostListResponse)
async def get_posts(
    type: PostType = Query(None, description="Filter by post type"),
    author_id: str | None = Query(None, description="Filter by author id"),
    tag: str | None = Query(None, description="Filter by tag name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Posts per page"),
    sort: PostSortType = Query(PostSortType.newest, description="Sort order"),
    authorization: str | None = Header(default=None),
):
    """Get list of community posts with pagination and filtering."""
    
    # Build query conditions
    conditions = []
    params = []
    
    if type:
        conditions.append("post_type = ?")
        params.append(type.value)

    if author_id:
        conditions.append("author_id = ?")
        params.append(author_id)

    if sort == PostSortType.following:
        identity = _get_optional_identity(authorization)
        if not identity:
            raise HTTPException(status_code=401, detail="Authentication required for following feed")

        with get_db() as db:
            follow_rows = db.execute(
                "SELECT following_id FROM follows WHERE follower_id = ?",
                (identity["identity_id"],),
            ).fetchall()

        following_ids = [row["following_id"] for row in follow_rows]
        if not following_ids:
            return PostListResponse(posts=[], total=0, page=page, limit=limit, has_next=False)

        placeholders = ",".join(["?" for _ in following_ids])
        conditions.append(f"author_id IN ({placeholders})")
        params.extend(following_ids)

    joins = ""
    if tag:
        joins += " JOIN post_tags pt ON pt.post_id = community_posts.id JOIN tags t ON t.id = pt.tag_id "
        conditions.append("LOWER(t.name) = LOWER(?)")
        params.append(tag)

    where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

    # Build sort clause
    if sort == PostSortType.newest:
        order_clause = "ORDER BY created_at DESC"
    elif sort == PostSortType.popular:
        order_clause = "ORDER BY likes_count DESC, comment_count DESC, created_at DESC"
    elif sort == PostSortType.hot:
        # Hot sort: score divided by age decay (simplified for SQLite)
        order_clause = "ORDER BY CAST((upvotes - downvotes) AS REAL) / ((julianday('now') - julianday(created_at)) * 24 + 2) DESC"
    elif sort == PostSortType.best:
        # Best sort: highest net score, then newest
        order_clause = "ORDER BY (upvotes - downvotes) DESC, created_at DESC"
    else:
        order_clause = "ORDER BY created_at DESC"
    
    offset = (page - 1) * limit
    
    with get_db() as db:
        _ensure_community_schema(db)

        # Get total count
        count_query = f"SELECT COUNT(DISTINCT community_posts.id) FROM community_posts {joins} {where_clause}"
        total = db.execute(count_query, params).fetchone()[0]

        # Get posts
        posts_query = f"""
            SELECT DISTINCT community_posts.* FROM community_posts
            {joins}
            {where_clause}
            {order_clause}
            LIMIT ? OFFSET ?
        """
        rows = db.execute(posts_query, params + [limit, offset]).fetchall()
        posts = [_row_to_post_response(dict(row), db) for row in rows]
    
    has_next = offset + len(posts) < total
    
    return PostListResponse(
        posts=posts,
        total=total,
        page=page,
        limit=limit,
        has_next=has_next
    )


def _table_exists(db, table_name: str) -> bool:
    if _is_postgres_connection(db):
        try:
            row = db.execute(
                """
                SELECT 1
                FROM information_schema.tables
                WHERE table_schema = current_schema()
                  AND table_name = ?
                LIMIT 1
                """,
                (table_name,),
            ).fetchone()
            return bool(row)
        except Exception:
            return False

    try:
        row = db.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name = ?",
            (table_name,),
        ).fetchone()
        return bool(row)
    except Exception:
        return False


def _is_postgres_connection(db) -> bool:
    """Detect PostgreSQL wrapper connections returned by get_db()."""
    raw_conn = getattr(db, "_conn", None)
    if raw_conn is None:
        return False
    return raw_conn.__class__.__module__.startswith("psycopg2")


def _extract_column_name(column_def: str) -> str:
    """Extract column name from a column definition fragment."""
    return column_def.strip().split()[0].strip('"`[]')


def _safe_add_column(db, table: str, column_def: str) -> None:
    """Best-effort ADD COLUMN for both SQLite and PostgreSQL."""
    column_name = _extract_column_name(column_def)
    if _column_exists(db, table, column_name):
        return

    try:
        db.execute(f"ALTER TABLE {table} ADD COLUMN {column_def}")
    except Exception as e:
        if _is_postgres_connection(db):
            try:
                db.rollback()
            except Exception:
                pass
        # Re-check after rollback for race/partial migration cases.
        if _column_exists(db, table, column_name):
            return
        logger.warning("Failed to add column %s.%s: %s", table, column_name, e)


def _column_exists(db, table_name: str, column_name: str) -> bool:
    """Check column existence — PG uses information_schema, SQLite uses PRAGMA."""
    if _is_postgres_connection(db):
        try:
            row = db.execute(
                """
                SELECT 1
                FROM information_schema.columns
                WHERE table_schema = current_schema()
                  AND table_name = ?
                  AND column_name = ?
                LIMIT 1
                """,
                (table_name, column_name),
            ).fetchone()
            return bool(row)
        except Exception:
            return False

    try:
        rows = db.execute(f"PRAGMA table_info({table_name})").fetchall()
        for row in rows:
            try:
                if hasattr(row, "keys") and "name" in row.keys():
                    if row["name"] == column_name:
                        return True
            except Exception:
                continue
    except Exception:
        pass
    return False


def _ensure_community_schema(db) -> None:
    """Ensure legacy DBs have the minimal community schema for post/search endpoints."""
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS community_posts (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            post_type TEXT NOT NULL,
            author_id TEXT NOT NULL,
            author_type TEXT NOT NULL DEFAULT 'user',
            file_id TEXT,
            images TEXT,
            template_type TEXT,
            comment_count INTEGER NOT NULL DEFAULT 0,
            likes_count INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS community_comments (
            id TEXT PRIMARY KEY,
            post_id TEXT NOT NULL,
            content TEXT NOT NULL,
            author_id TEXT NOT NULL,
            author_type TEXT NOT NULL DEFAULT 'user',
            parent_id TEXT DEFAULT NULL,
            is_best_answer INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            category TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
        """
    )
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS post_tags (
            post_id TEXT NOT NULL,
            tag_id TEXT NOT NULL,
            PRIMARY KEY (post_id, tag_id)
        )
        """
    )

    _safe_add_column(db, "community_posts", "author_type TEXT NOT NULL DEFAULT 'user'")
    _safe_add_column(db, "community_posts", "template_type TEXT")
    _safe_add_column(db, "community_posts", "is_resolved INTEGER NOT NULL DEFAULT 0")
    _safe_add_column(db, "community_posts", "best_answer_comment_id TEXT")
    _safe_add_column(db, "community_posts", "best_comment_id TEXT")
    _safe_add_column(db, "community_posts", "resolved_at TEXT")
    _safe_add_column(db, "community_posts", "is_pinned INTEGER NOT NULL DEFAULT 0")
    _safe_add_column(db, "community_posts", "is_locked INTEGER NOT NULL DEFAULT 0")

    _safe_add_column(db, "community_comments", "parent_id TEXT DEFAULT NULL")
    _safe_add_column(db, "community_comments", "is_best_answer INTEGER NOT NULL DEFAULT 0")


@router.get("/search")
async def search_community(
    q: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
):
    """Unified community search for posts, agents and nodes."""
    offset = (page - 1) * limit
    search_term = f"%{q}%"

    with get_db() as db:
        try:
            _ensure_community_schema(db)
        except Exception as e:
            if not _is_postgres_connection(db):
                raise
            try:
                db.rollback()
            except Exception:
                pass
            logger.warning("Schema ensure failed once in search_community, retrying after rollback: %s", e)
            _ensure_community_schema(db)

        has_post_tags = _table_exists(db, "post_tags") and _table_exists(db, "tags")

        if has_post_tags:
            post_rows = db.execute(
                """
                WITH post_relevance AS (
                    SELECT
                        cp.id AS post_id,
                        MAX(CASE WHEN LOWER(cp.title) LIKE LOWER(?) THEN 3 ELSE 0 END)
                        + MAX(CASE WHEN LOWER(cp.content) LIKE LOWER(?) THEN 1 ELSE 0 END)
                        + COALESCE(MAX(CASE WHEN LOWER(t.name) LIKE LOWER(?) THEN 2 ELSE 0 END), 0)
                        AS relevance
                    FROM community_posts cp
                    LEFT JOIN post_tags pt ON pt.post_id = cp.id
                    LEFT JOIN tags t ON t.id = pt.tag_id
                    GROUP BY cp.id
                )
                SELECT cp.*, pr.relevance
                FROM post_relevance pr
                JOIN community_posts cp ON cp.id = pr.post_id
                WHERE pr.relevance > 0
                ORDER BY pr.relevance DESC, cp.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (search_term, search_term, search_term, limit, offset),
            ).fetchall()
            post_total = db.execute(
                """
                SELECT COUNT(DISTINCT cp.id) AS c
                FROM community_posts cp
                LEFT JOIN post_tags pt ON pt.post_id = cp.id
                LEFT JOIN tags t ON t.id = pt.tag_id
                WHERE LOWER(cp.title) LIKE LOWER(?)
                   OR LOWER(cp.content) LIKE LOWER(?)
                   OR LOWER(t.name) LIKE LOWER(?)
                """,
                (search_term, search_term, search_term),
            ).fetchone()["c"]
        else:
            post_rows = db.execute(
                """
                WITH post_relevance AS (
                    SELECT
                        cp.id AS post_id,
                        MAX(CASE WHEN LOWER(cp.title) LIKE LOWER(?) THEN 3 ELSE 0 END)
                        + MAX(CASE WHEN LOWER(cp.content) LIKE LOWER(?) THEN 1 ELSE 0 END)
                        AS relevance
                    FROM community_posts cp
                    GROUP BY cp.id
                )
                SELECT cp.*, pr.relevance
                FROM post_relevance pr
                JOIN community_posts cp ON cp.id = pr.post_id
                WHERE pr.relevance > 0
                ORDER BY pr.relevance DESC, cp.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (search_term, search_term, limit, offset),
            ).fetchall()
            post_total = db.execute(
                """
                SELECT COUNT(*) AS c
                FROM community_posts cp
                WHERE LOWER(cp.title) LIKE LOWER(?)
                   OR LOWER(cp.content) LIKE LOWER(?)
                """,
                (search_term, search_term),
            ).fetchone()["c"]

        posts = [_row_to_post_response(dict(row), db).model_dump() for row in post_rows]

        agents: list[dict] = []
        agent_total = 0
        if _table_exists(db, "agents"):
            has_display_name = _column_exists(db, "agents", "display_name")
            has_bio = _column_exists(db, "agents", "bio")
            has_avatar_url = _column_exists(db, "agents", "avatar_url")
            has_status = _column_exists(db, "agents", "status")
            has_tier = _column_exists(db, "agents", "tier")
            has_created_at = _column_exists(db, "agents", "created_at")

            display_name_col = "display_name" if has_display_name else "name AS display_name"
            bio_col = "bio" if has_bio else "description AS bio"
            bio_search_expr = "COALESCE(bio, '')" if has_bio else "COALESCE(description, '')"
            avatar_col = "avatar_url" if has_avatar_url else "NULL AS avatar_url"
            status_col = "status" if has_status else "'active' AS status"
            tier_col = "tier" if has_tier else "'newcomer' AS tier"
            created_col = "created_at" if has_created_at else "datetime('now') AS created_at"
            order_col = "created_at DESC" if has_created_at else "name ASC"

            agent_rows = db.execute(
                f"""
                SELECT id, name, {display_name_col}, {bio_col}, description, {avatar_col}, {status_col}, {tier_col}, {created_col}
                FROM agents
                WHERE LOWER(name) LIKE LOWER(?)
                   OR LOWER({bio_search_expr}) LIKE LOWER(?)
                ORDER BY {order_col}
                LIMIT ? OFFSET ?
                """,
                (search_term, search_term, limit, offset),
            ).fetchall()
            agents = [dict(row) for row in agent_rows]

            agent_total = db.execute(
                f"""
                SELECT COUNT(*) AS c
                FROM agents
                WHERE LOWER(name) LIKE LOWER(?)
                   OR LOWER({bio_search_expr}) LIKE LOWER(?)
                """,
                (search_term, search_term),
            ).fetchone()["c"]

        nodes: list[dict] = []
        node_total = 0
        if _table_exists(db, "nodes"):
            has_node_description = _column_exists(db, "nodes", "description")
            has_node_created_at = _column_exists(db, "nodes", "created_at")

            node_description_col = "description" if has_node_description else "'' AS description"
            node_description_search = "COALESCE(description, '')" if has_node_description else "''"
            node_created_col = "created_at" if has_node_created_at else "datetime('now') AS created_at"
            node_order_col = "created_at DESC" if has_node_created_at else "name ASC"

            node_rows = db.execute(
                f"""
                SELECT id, owner_id, name, {node_description_col}, node_type, status, {node_created_col}
                FROM nodes
                WHERE LOWER(name) LIKE LOWER(?)
                   OR LOWER({node_description_search}) LIKE LOWER(?)
                ORDER BY {node_order_col}
                LIMIT ? OFFSET ?
                """,
                (search_term, search_term, limit, offset),
            ).fetchall()
            nodes = [dict(row) for row in node_rows]

            node_total = db.execute(
                f"""
                SELECT COUNT(*) AS c
                FROM nodes
                WHERE LOWER(name) LIKE LOWER(?)
                   OR LOWER({node_description_search}) LIKE LOWER(?)
                """,
                (search_term, search_term),
            ).fetchone()["c"]

    return {
        "posts": posts,
        "agents": agents,
        "nodes": nodes,
        "total": int(post_total) + int(agent_total) + int(node_total),
    }


@router.get("/feed", response_model=PostListResponse)
async def get_personalized_feed(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Posts per page"),
    identity: dict = Depends(get_authenticated_identity),
):
    """Personalized feed for authenticated users."""
    offset = (page - 1) * limit
    now = datetime.now(timezone.utc)
    recent_cutoff = (now - timedelta(hours=24)).isoformat()

    with get_db() as db:
        follow_ids: list[str] = []
        if _table_exists(db, "follows"):
            try:
                follow_rows = db.execute(
                    "SELECT following_id FROM follows WHERE follower_id = ?",
                    (identity["identity_id"],),
                ).fetchall()
                follow_ids = [r["following_id"] for r in follow_rows]
            except Exception:
                follow_ids = []

        score_expr = """
            (
                (CASE WHEN created_at >= ? THEN 1.5 ELSE 1.0 END)
                * (CASE WHEN comment_count > 0 THEN 1.2 ELSE 1.0 END)
                {follow_weight}
            )
        """

        if follow_ids:
            placeholders = ",".join(["?" for _ in follow_ids])
            follow_weight = f"* (CASE WHEN author_id IN ({placeholders}) THEN 2.0 ELSE 1.0 END)"
            score_sql = score_expr.format(follow_weight=follow_weight)
            score_params = [recent_cutoff, *follow_ids]
        else:
            score_sql = score_expr.format(follow_weight="")
            score_params = [recent_cutoff]

        count_row = db.execute("SELECT COUNT(*) AS cnt FROM community_posts").fetchone()
        total = int(count_row["cnt"] if count_row else 0)

        query = f"""
            SELECT *, {score_sql} AS ranking_score
            FROM community_posts
            ORDER BY ranking_score DESC, comment_count DESC, created_at DESC
            LIMIT ? OFFSET ?
        """
        rows = db.execute(query, score_params + [limit, offset]).fetchall()
        posts = [_row_to_post_response(dict(row), db) for row in rows]

    has_next = offset + len(posts) < total
    return PostListResponse(posts=posts, total=total, page=page, limit=limit, has_next=has_next)


@router.get("/posts/{post_id}", response_model=PostDetailResponse)
async def get_post_detail(post_id: str):
    """Get detailed information about a specific post."""
    
    with get_db() as db:
        row = db.execute("""
            SELECT * FROM community_posts WHERE id = ?
        """, (post_id,)).fetchone()
    
        if not row:
            raise HTTPException(status_code=404, detail="Post not found")
    
        return _row_to_post_response(dict(row), db)


@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(
    post_id: str,
    comment: CommentCreateRequest,
    identity: dict = Depends(get_authenticated_identity)
):
    """Add a comment to a post."""
    # Rate limit check
    if not _rate_check(f"comment:{identity['identity_id']}", max_calls=30, window=3600):
        raise HTTPException(429, "Too many comments. Try again later.")
    
    comment.content = _sanitize(comment.content)

    # Verify post exists
    with get_db() as db:
        post_row = db.execute("""
            SELECT id, author_id, is_locked FROM community_posts WHERE id = ?
        """, (post_id,)).fetchone()

        if not post_row:
            raise HTTPException(status_code=404, detail="Post not found")
        if bool(post_row["is_locked"]):
            raise HTTPException(status_code=403, detail="Post is locked")

        parent_row = None
        if comment.parent_id:
            parent_row = db.execute(
                "SELECT id, author_id FROM community_comments WHERE id = ? AND post_id = ?",
                (comment.parent_id, post_id),
            ).fetchone()
            if not parent_row:
                raise HTTPException(status_code=404, detail="Parent comment not found")

        # Create comment
        comment_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()

        db.execute("""
            INSERT INTO community_comments (
                id, post_id, content, author_id, author_type, parent_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            comment_id,
            post_id,
            comment.content,
            identity["identity_id"],
            identity["identity_type"],
            comment.parent_id,
            now,
            now
        ))

        # Update comment count on post
        db.execute("""
            UPDATE community_posts
            SET comment_count = comment_count + 1, updated_at = ?
            WHERE id = ?
        """, (now, post_id))

        if identity.get("identity_type") == "agent":
            grant_agent_xp(db, identity["identity_id"], 5)

        # Get the created comment
        comment_row = db.execute("""
            SELECT * FROM community_comments WHERE id = ?
        """, (comment_id,)).fetchone()

        comment_author_type = _resolve_author_type(comment_row["author_id"], db)

        # Notification targets
        commenter_id = identity["identity_id"]
        post_author = None
        reply_author = None
        if post_row["author_id"] != commenter_id:
            post_author = db.execute(
                "SELECT email FROM users WHERE id = ?",
                (post_row["author_id"],),
            ).fetchone()

        if parent_row and parent_row["author_id"] != commenter_id and parent_row["author_id"] != post_row["author_id"]:
            reply_author = db.execute(
                "SELECT email FROM users WHERE id = ?",
                (parent_row["author_id"],),
            ).fetchone()

    if post_author:
        await send_notification(
            post_author["email"],
            "New comment on your post",
            f"{identity.get('username') or identity['identity_id']} commented on your post.",
            notification_type="comment",
        )

    if reply_author:
        await send_notification(
            reply_author["email"],
            "New reply to your comment",
            f"{identity.get('username') or identity['identity_id']} replied to your comment.",
            notification_type="reply",
        )

    logger.info("Comment created: post=%s by=%s", post_id, identity["identity_id"])

    return CommentResponse(
        id=comment_row["id"],
        post_id=comment_row["post_id"],
        content=comment_row["content"],
        author_id=comment_row["author_id"],
        author_type=comment_author_type,
        is_best_answer=bool(comment_row["is_best_answer"]) if "is_best_answer" in comment_row.keys() else False,
        created_at=comment_row["created_at"],
        updated_at=comment_row["updated_at"]
    )


@router.get("/posts/{post_id}/comments", response_model=list[CommentResponse])
async def get_post_comments(
    post_id: str,
    limit: int = Query(200, ge=1, le=500, description="Comments per request"),
    offset: int = Query(0, ge=0, description="Comments offset")
):
    """Get comments for a specific post with nested structure."""
    
    # Verify post exists
    with get_db() as db:
        post_row = db.execute("""
            SELECT id FROM community_posts WHERE id = ?
        """, (post_id,)).fetchone()
        
        if not post_row:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Get ALL comments for this post to build tree properly
        # (We need all to establish parent-child relationships)
        rows = db.execute("""
            SELECT * FROM community_comments 
            WHERE post_id = ?
            ORDER BY created_at ASC
        """, (post_id,)).fetchall()
        
        comments = [dict(row) for row in rows]
        
        # Build nested structure
        nested_comments = _build_comment_tree(comments, db)
    
    return nested_comments


@router.post("/posts/{post_id}/resolve")
async def resolve_post(post_id: str, identity: dict = Depends(get_authenticated_identity)):
    with get_db() as db:
        post_row = db.execute("SELECT id, author_id FROM community_posts WHERE id = ?", (post_id,)).fetchone()
        if not post_row:
            raise HTTPException(status_code=404, detail="Post not found")
        if post_row["author_id"] != identity["identity_id"]:
            raise HTTPException(status_code=403, detail="Only post author can resolve")
        db.execute("UPDATE community_posts SET is_resolved = 1, updated_at = ? WHERE id = ?", (datetime.now(timezone.utc).isoformat(), post_id))
    return {"ok": True, "post_id": post_id, "is_resolved": True}


def _set_post_best_answer(post_id: str, comment_id: str, identity: dict) -> dict:
    with get_db() as db:
        post_row = db.execute("SELECT id, author_id FROM community_posts WHERE id = ?", (post_id,)).fetchone()
        if not post_row:
            raise HTTPException(status_code=404, detail="Post not found")
        if post_row["author_id"] != identity["identity_id"]:
            raise HTTPException(status_code=403, detail="Only post author can mark best answer")

        comment_row = db.execute(
            "SELECT id FROM community_comments WHERE id = ? AND post_id = ?",
            (comment_id, post_id),
        ).fetchone()
        if not comment_row:
            raise HTTPException(status_code=404, detail="Comment not found")

        now = datetime.now(timezone.utc).isoformat()
        db.execute("UPDATE community_comments SET is_best_answer = 0 WHERE post_id = ?", (post_id,))
        db.execute("UPDATE community_comments SET is_best_answer = 1, updated_at = ? WHERE id = ?", (now, comment_id))
        db.execute(
            """
            UPDATE community_posts
            SET best_answer_comment_id = ?, best_comment_id = ?, resolved_at = ?, updated_at = ?
            WHERE id = ?
            """,
            (comment_id, comment_id, now, now, post_id),
        )

    return {"ok": True, "post_id": post_id, "comment_id": comment_id, "is_best_answer": True}


@router.post("/posts/{post_id}/best-answer")
async def set_post_best_answer(
    post_id: str,
    body: BestAnswerRequest,
    identity: dict = Depends(get_authenticated_identity),
):
    return _set_post_best_answer(post_id, body.comment_id, identity)


@router.post("/comments/{comment_id}/best-answer")
async def mark_best_answer(comment_id: str, identity: dict = Depends(get_authenticated_identity)):
    with get_db() as db:
        comment_row = db.execute("SELECT id, post_id FROM community_comments WHERE id = ?", (comment_id,)).fetchone()
        if not comment_row:
            raise HTTPException(status_code=404, detail="Comment not found")
    return _set_post_best_answer(comment_row["post_id"], comment_id, identity)


@router.post("/posts/{post_id}/report")
async def report_post(post_id: str, body: ReportPostRequest, identity: dict = Depends(get_authenticated_identity)):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        post_row = db.execute("SELECT id FROM community_posts WHERE id = ?", (post_id,)).fetchone()
        if not post_row:
            raise HTTPException(status_code=404, detail="Post not found")
        db.execute(
            "INSERT OR REPLACE INTO community_reports (id, post_id, reporter_id, reason, created_at) VALUES (?, ?, ?, ?, ?)",
            (f"report-{post_id}-{identity['identity_id']}", post_id, identity["identity_id"], _sanitize(body.reason), now),
        )
    return {"ok": True, "post_id": post_id}


def _require_admin(identity: dict) -> None:
    if identity.get("identity_type") != "user" or identity.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin required")


@router.post("/posts/{post_id}/pin")
async def pin_post(post_id: str, identity: dict = Depends(get_authenticated_identity)):
    _require_admin(identity)
    with get_db() as db:
        row = db.execute("SELECT id FROM community_posts WHERE id = ?", (post_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Post not found")
        db.execute("UPDATE community_posts SET is_pinned = 1, updated_at = ? WHERE id = ?", (datetime.now(timezone.utc).isoformat(), post_id))
    return {"ok": True, "post_id": post_id, "is_pinned": True}


@router.post("/posts/{post_id}/lock")
async def lock_post(post_id: str, identity: dict = Depends(get_authenticated_identity)):
    _require_admin(identity)
    with get_db() as db:
        row = db.execute("SELECT id FROM community_posts WHERE id = ?", (post_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Post not found")
        db.execute("UPDATE community_posts SET is_locked = 1, updated_at = ? WHERE id = ?", (datetime.now(timezone.utc).isoformat(), post_id))
    return {"ok": True, "post_id": post_id, "is_locked": True}


@router.post("/posts/{post_id}/vote", response_model=VoteResponse)
async def vote_post(
    post_id: str,
    vote: VoteRequest,
    identity: dict = Depends(get_authenticated_identity)
):
    """Vote on a community post. Toggle: same direction again removes the vote."""
    
    user_id = identity["identity_id"]
    direction = vote.vote_type
    now = datetime.now(timezone.utc).isoformat()
    
    with get_db() as db:
        # Ensure community_votes table and columns exist
        db.execute("""
            CREATE TABLE IF NOT EXISTS community_votes (
                id TEXT PRIMARY KEY,
                post_id TEXT NOT NULL,
                user_id TEXT NOT NULL,
                direction TEXT NOT NULL,
                created_at TEXT NOT NULL,
                UNIQUE(post_id, user_id)
            )
        """)
        # Ensure upvotes/downvotes columns exist on community_posts
        _safe_add_column(db, "community_posts", "upvotes INTEGER NOT NULL DEFAULT 0")
        _safe_add_column(db, "community_posts", "downvotes INTEGER NOT NULL DEFAULT 0")
        
        # Check post exists
        post_row = db.execute(
            "SELECT id FROM community_posts WHERE id = ?", (post_id,)
        ).fetchone()
        if not post_row:
            raise HTTPException(status_code=404, detail="Post not found")
        
        # Check existing vote
        existing = db.execute(
            "SELECT id, direction FROM community_votes WHERE post_id = ? AND user_id = ?",
            (post_id, user_id)
        ).fetchone()
        
        if existing:
            old_dir = existing["direction"]
            if old_dir == direction:
                # Same direction → remove vote
                db.execute("DELETE FROM community_votes WHERE id = ?", (existing["id"],))
                col = "upvotes" if direction == "up" else "downvotes"
                db.execute(f"UPDATE community_posts SET {col} = MAX(0, {col} - 1) WHERE id = ?", (post_id,))
                user_vote = None
            else:
                # Different direction → switch
                db.execute(
                    "UPDATE community_votes SET direction = ?, created_at = ? WHERE id = ?",
                    (direction, now, existing["id"])
                )
                if direction == "up":
                    db.execute("UPDATE community_posts SET upvotes = upvotes + 1, downvotes = MAX(0, downvotes - 1) WHERE id = ?", (post_id,))
                else:
                    db.execute("UPDATE community_posts SET downvotes = downvotes + 1, upvotes = MAX(0, upvotes - 1) WHERE id = ?", (post_id,))
                user_vote = direction
        else:
            # New vote
            vote_id = str(uuid.uuid4())
            db.execute(
                "INSERT INTO community_votes (id, post_id, user_id, direction, created_at) VALUES (?, ?, ?, ?, ?)",
                (vote_id, post_id, user_id, direction, now)
            )
            col = "upvotes" if direction == "up" else "downvotes"
            db.execute(f"UPDATE community_posts SET {col} = {col} + 1 WHERE id = ?", (post_id,))
            user_vote = direction
        
        # Get updated counts
        row = db.execute(
            "SELECT upvotes, downvotes FROM community_posts WHERE id = ?", (post_id,)
        ).fetchone()
    
    logger.info("Vote on post: post=%s by=%s direction=%s", post_id, identity["identity_id"], direction)
    
    return VoteResponse(
        upvotes=row["upvotes"],
        downvotes=row["downvotes"],
        user_vote=user_vote
    )
