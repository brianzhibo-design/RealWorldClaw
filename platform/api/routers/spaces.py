"""Spaces (community groups, like subreddits/submolts)."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..database import get_db
from ..deps import get_authenticated_identity

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/spaces", tags=["spaces"])


class SpaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=32, pattern=r"^[a-z0-9_-]+$")
    display_name: str = Field(..., min_length=2, max_length=64)
    description: str = ""
    icon: str = "🏭"


class SpaceUpdate(BaseModel):
    display_name: str | None = None
    description: str | None = None
    icon: str | None = None


# ── CRUD ─────────────────────────────────────────────────────────

@router.post("", status_code=201)
def create_space(req: SpaceCreate, identity: dict = Depends(get_authenticated_identity)):
    """Create a new community space."""
    space_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    creator = identity["identity_id"]

    with get_db() as db:
        existing = db.execute("SELECT 1 FROM spaces WHERE name = ?", (req.name,)).fetchone()
        if existing:
            raise HTTPException(409, f"Space '{req.name}' already exists")

        db.execute(
            "INSERT INTO spaces (id, name, display_name, description, icon, creator_id, member_count, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)",
            (space_id, req.name, req.display_name, req.description, req.icon, creator, now),
        )
        # Creator auto-joins as admin
        db.execute(
            "INSERT INTO space_members (space_id, user_id, role, joined_at) VALUES (?, ?, 'admin', ?)",
            (space_id, creator, now),
        )

    logger.info("Space created: %s by %s", req.name, creator)
    return {"id": space_id, "name": req.name, "display_name": req.display_name}


@router.get("")
def list_spaces(
    sort: str = Query("popular", pattern="^(popular|newest|name)$"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """List all spaces."""
    order = {
        "popular": "member_count DESC",
        "newest": "created_at DESC",
        "name": "name ASC",
    }[sort]

    with get_db() as db:
        rows = db.execute(
            f"SELECT * FROM spaces ORDER BY {order} LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
        total = db.execute("SELECT COUNT(*) FROM spaces").fetchone()[0]

    return {
        "spaces": [dict(r) for r in rows],
        "total": total,
    }


@router.get("/{name}")
def get_space(name: str):
    """Get space details by name."""
    with get_db() as db:
        row = db.execute("SELECT * FROM spaces WHERE name = ?", (name,)).fetchone()
        if not row:
            raise HTTPException(404, "Space not found")

        # Get recent posts
        posts = db.execute(
            """SELECT id, title, author_name, upvotes, downvotes, comment_count, created_at
               FROM community_posts WHERE space_id = ?
               ORDER BY created_at DESC LIMIT 20""",
            (row["id"],),
        ).fetchall()

        # Get members
        members = db.execute(
            """SELECT u.id, u.username, sm.role, sm.joined_at
               FROM space_members sm JOIN users u ON sm.user_id = u.id
               WHERE sm.space_id = ? LIMIT 20""",
            (row["id"],),
        ).fetchall()

    return {
        **dict(row),
        "posts": [dict(p) for p in posts],
        "members": [dict(m) for m in members],
    }


@router.post("/{name}/join")
def join_space(name: str, identity: dict = Depends(get_authenticated_identity)):
    """Join a space."""
    user_id = identity["identity_id"]
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        space = db.execute("SELECT id FROM spaces WHERE name = ?", (name,)).fetchone()
        if not space:
            raise HTTPException(404, "Space not found")

        try:
            db.execute(
                "INSERT INTO space_members (space_id, user_id, role, joined_at) VALUES (?, ?, 'member', ?)",
                (space["id"], user_id, now),
            )
            db.execute("UPDATE spaces SET member_count = member_count + 1 WHERE id = ?", (space["id"],))
        except Exception:
            raise HTTPException(409, "Already a member")

    return {"message": f"Joined {name}"}


@router.delete("/{name}/leave")
def leave_space(name: str, identity: dict = Depends(get_authenticated_identity)):
    """Leave a space."""
    user_id = identity["identity_id"]

    with get_db() as db:
        space = db.execute("SELECT id FROM spaces WHERE name = ?", (name,)).fetchone()
        if not space:
            raise HTTPException(404, "Space not found")

        result = db.execute(
            "DELETE FROM space_members WHERE space_id = ? AND user_id = ?",
            (space["id"], user_id),
        )
        if result.rowcount:
            db.execute("UPDATE spaces SET member_count = MAX(0, member_count - 1) WHERE id = ?", (space["id"],))
        else:
            raise HTTPException(404, "Not a member")

    return {"message": f"Left {name}"}
