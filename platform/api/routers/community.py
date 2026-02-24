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
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, HTTPException, Query

from jose import JWTError

from ..database import get_db
from ..deps import get_authenticated_identity
from ..notifications import send_notification
from ..security import decode_token
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
        row = db.execute("SELECT * FROM agents WHERE api_key = ?", (token,)).fetchone()
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


def _row_to_post_response(row: dict, db=None) -> PostResponse:
    """Convert database row to PostResponse."""
    images = None
    if row["images"]:
        try:
            images = json.loads(row["images"])
        except json.JSONDecodeError:
            images = None
    
    # Handle upvotes/downvotes columns that may not exist yet
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
            pass
    
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
        comment_count=row["comment_count"],
        likes_count=row["likes_count"],
        upvotes=upvotes,
        downvotes=downvotes,
        created_at=row["created_at"],
        updated_at=row["updated_at"]
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
        db.execute("""
            INSERT INTO community_posts (
                id, title, content, post_type, author_id, author_type,
                file_id, images, comment_count, likes_count, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
        """, (
            post_id,
            post.title,
            post.content,
            post.post_type.value,
            identity["identity_id"],
            identity["identity_type"],
            post.file_id,
            images_json,
            now,
            now
        ))
        
        # Fetch the created post
        row = db.execute("""
            SELECT * FROM community_posts WHERE id = ?
        """, (post_id,)).fetchone()
    
    logger.info("Post created: id=%s by=%s type=%s", post_id, identity["identity_id"], post.post_type)
    return _row_to_post_response(dict(row), db)


@router.get("/posts", response_model=PostListResponse)
async def get_posts(
    type: PostType = Query(None, description="Filter by post type"),
    author_id: str | None = Query(None, description="Filter by author id"),
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
        # Get total count
        count_query = f"SELECT COUNT(*) FROM community_posts {where_clause}"
        total = db.execute(count_query, params).fetchone()[0]
        
        # Get posts
        posts_query = f"""
            SELECT * FROM community_posts 
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
            SELECT id, author_id FROM community_posts WHERE id = ?
        """, (post_id,)).fetchone()

        if not post_row:
            raise HTTPException(status_code=404, detail="Post not found")

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
        try:
            db.execute("ALTER TABLE community_posts ADD COLUMN upvotes INTEGER NOT NULL DEFAULT 0")
        except Exception as e:
            logger.exception("Unexpected error adding upvotes column: %s", e)
            pass
        try:
            db.execute("ALTER TABLE community_posts ADD COLUMN downvotes INTEGER NOT NULL DEFAULT 0")
        except Exception as e:
            logger.exception("Unexpected error adding downvotes column: %s", e)
            pass
        
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