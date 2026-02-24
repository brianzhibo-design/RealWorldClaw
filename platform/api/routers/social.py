"""Social features: follows + karma calculation."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import get_db
from ..deps import get_authenticated_identity

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/social", tags=["social"])


# ── Follow / Unfollow ───────────────────────────────────────────

@router.post("/follow/{user_id}")
def follow_user(user_id: str, identity: dict = Depends(get_authenticated_identity)):
    """Follow a user or agent."""
    follower_id = identity["identity_id"]
    if follower_id == user_id:
        raise HTTPException(400, "Cannot follow yourself")

    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        # Check target exists
        target = db.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
        if not target:
            # Maybe it's an agent
            target = db.execute("SELECT id FROM agents WHERE id = ?", (user_id,)).fetchone()
        if not target:
            raise HTTPException(404, "User not found")

        try:
            db.execute(
                "INSERT INTO follows (id, follower_id, following_id, created_at) VALUES (?, ?, ?, ?)",
                (str(uuid.uuid4()), follower_id, user_id, now),
            )
        except Exception:
            raise HTTPException(409, "Already following")

    logger.info("Follow: %s → %s", follower_id, user_id)
    return {"message": "Followed", "following_id": user_id}


@router.delete("/follow/{user_id}")
def unfollow_user(user_id: str, identity: dict = Depends(get_authenticated_identity)):
    """Unfollow a user or agent."""
    follower_id = identity["identity_id"]
    with get_db() as db:
        result = db.execute(
            "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
            (follower_id, user_id),
        )
        if result.rowcount == 0:
            raise HTTPException(404, "Not following this user")

    logger.info("Unfollow: %s → %s", follower_id, user_id)
    return {"message": "Unfollowed"}


@router.get("/followers/{user_id}")
def get_followers(user_id: str, limit: int = Query(20, le=100), offset: int = Query(0)):
    """Get a user's followers."""
    with get_db() as db:
        rows = db.execute(
            """SELECT u.id, u.username, u.avatar_url, f.created_at as followed_at
               FROM follows f JOIN users u ON f.follower_id = u.id
               WHERE f.following_id = ? ORDER BY f.created_at DESC LIMIT ? OFFSET ?""",
            (user_id, limit, offset),
        ).fetchall()
        count = db.execute(
            "SELECT COUNT(*) FROM follows WHERE following_id = ?", (user_id,)
        ).fetchone()[0]

    return {
        "followers": [dict(r) for r in rows],
        "total": count,
    }


@router.get("/following/{user_id}")
def get_following(user_id: str, limit: int = Query(20, le=100), offset: int = Query(0)):
    """Get who a user follows."""
    with get_db() as db:
        rows = db.execute(
            """SELECT u.id, u.username, u.avatar_url, f.created_at as followed_at
               FROM follows f JOIN users u ON f.following_id = u.id
               WHERE f.follower_id = ? ORDER BY f.created_at DESC LIMIT ? OFFSET ?""",
            (user_id, limit, offset),
        ).fetchall()
        count = db.execute(
            "SELECT COUNT(*) FROM follows WHERE follower_id = ?", (user_id,)
        ).fetchone()[0]

    return {
        "following": [dict(r) for r in rows],
        "total": count,
    }


@router.get("/is-following/{user_id}")
def is_following(user_id: str, identity: dict = Depends(get_authenticated_identity)):
    """Check if current user follows a user."""
    follower_id = identity["identity_id"]
    with get_db() as db:
        row = db.execute(
            "SELECT 1 FROM follows WHERE follower_id = ? AND following_id = ?",
            (follower_id, user_id),
        ).fetchone()
    return {"is_following": row is not None}


# ── Karma ────────────────────────────────────────────────────────

@router.get("/karma/{user_id}")
def get_karma(user_id: str):
    """Calculate karma for a user based on their activity."""
    with get_db() as db:
        # Post karma: upvotes - downvotes on their posts
        post_karma = db.execute(
            "SELECT COALESCE(SUM(upvotes - downvotes), 0) FROM community_posts WHERE author_id = ?",
            (user_id,),
        ).fetchone()[0]

        # Comment count bonus
        comment_count = db.execute(
            "SELECT COUNT(*) FROM community_comments WHERE author_id = ?",
            (user_id,),
        ).fetchone()[0]

        # Order completion bonus
        completed_orders = db.execute(
            "SELECT COUNT(*) FROM orders WHERE (customer_id = ? OR maker_id = ?) AND status = 'completed'",
            (user_id, user_id),
        ).fetchone()[0]

        # Follower bonus
        follower_count = db.execute(
            "SELECT COUNT(*) FROM follows WHERE following_id = ?",
            (user_id,),
        ).fetchone()[0]

        # Karma formula
        karma = post_karma + (comment_count * 2) + (completed_orders * 50) + (follower_count * 5)

        # Update cached reputation
        db.execute("UPDATE users SET reputation = ? WHERE id = ?", (karma, user_id))

    return {
        "user_id": user_id,
        "karma": karma,
        "breakdown": {
            "post_karma": post_karma,
            "comment_bonus": comment_count * 2,
            "order_bonus": completed_orders * 50,
            "follower_bonus": follower_count * 5,
        },
    }
