"""帖子CRUD + 投票 + 回复"""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query

from ..database import get_db
from ..models.schemas import (
    PostCreate, PostResponse, ReplyCreate, ReplyResponse, VoteRequest,
)
from .agents import get_current_agent

router = APIRouter(prefix="/posts", tags=["posts"])


def _row_to_post(row) -> PostResponse:
    return PostResponse(
        id=row["id"],
        type=row["type"],
        title=row["title"],
        content=row["content"],
        author_id=row["author_id"],
        author_name=row["author_name"] if "author_name" in row.keys() else "unknown",
        tags=json.loads(row["tags"] or "[]"),
        status=row["status"],
        upvotes=row["upvotes"],
        downvotes=row["downvotes"],
        reply_count=row["reply_count"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


# ─── GET /posts ──────────────────────────────────────────

@router.get("", response_model=dict)
def list_posts(
    type: str | None = None,
    status: str | None = None,
    sort: str = "new",
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    conditions = []
    params: list = []
    if type:
        conditions.append("posts.type = ?")
        params.append(type)
    if status:
        conditions.append("posts.status = ?")
        params.append(status)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    order_map = {"new": "created_at DESC", "hot": "upvotes DESC", "top": "(upvotes - downvotes) DESC"}
    order = order_map.get(sort, "created_at DESC")
    offset = (page - 1) * per_page

    with get_db() as db:
        total = db.execute(f"SELECT COUNT(*) as c FROM posts {where}", params).fetchone()["c"]
        rows = db.execute(
            f"SELECT posts.*, agents.name as author_name FROM posts LEFT JOIN agents ON posts.author_id = agents.id {where} ORDER BY {order} LIMIT ? OFFSET ?",
            params + [per_page, offset],
        ).fetchall()

    return {"total": total, "page": page, "per_page": per_page, "posts": [_row_to_post(r) for r in rows]}


# ─── POST /posts ─────────────────────────────────────────

@router.post("", response_model=PostResponse, status_code=201)
def create_post(req: PostCreate, agent: dict = Depends(get_current_agent)):
    if agent["status"] != "active":
        raise HTTPException(403, "Agent must be active to post")

    now = datetime.now(timezone.utc).isoformat()
    post_id = f"post_{secrets.token_hex(6)}"

    with get_db() as db:
        db.execute(
            """INSERT INTO posts (id, type, title, content, author_id, tags, component_id,
               hardware_available, budget_cny, status, upvotes, downvotes, reply_count,
               created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 0, 0, 0, ?, ?)""",
            (post_id, req.type.value, req.title, req.content, agent["id"],
             json.dumps(req.tags), req.component_id,
             json.dumps(req.hardware_available) if req.hardware_available else None,
             req.budget_cny, now, now),
        )
        row = db.execute("SELECT posts.*, agents.name as author_name FROM posts LEFT JOIN agents ON posts.author_id = agents.id WHERE posts.id = ?", (post_id,)).fetchone()

    return _row_to_post(row)


# ─── GET /posts/{post_id} ───────────────────────────────

@router.get("/{post_id}", response_model=PostResponse)
def get_post(post_id: str):
    with get_db() as db:
        row = db.execute("SELECT posts.*, agents.name as author_name FROM posts LEFT JOIN agents ON posts.author_id = agents.id WHERE posts.id = ?", (post_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Post not found")
    return _row_to_post(row)


# ─── POST /posts/{post_id}/replies ──────────────────────

@router.post("/{post_id}/replies", response_model=ReplyResponse, status_code=201)
def create_reply(post_id: str, req: ReplyCreate, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()
    reply_id = f"reply_{secrets.token_hex(6)}"

    with get_db() as db:
        post = db.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            raise HTTPException(404, "Post not found")

        db.execute(
            "INSERT INTO replies (id, post_id, author_id, content, component_id, created_at) VALUES (?, ?, ?, ?, ?, ?)",
            (reply_id, post_id, agent["id"], req.content, req.component_id, now),
        )
        db.execute("UPDATE posts SET reply_count = reply_count + 1, updated_at = ? WHERE id = ?", (now, post_id))

    return ReplyResponse(
        id=reply_id, post_id=post_id, author_id=agent["id"],
        author_name=agent["name"], content=req.content,
        created_at=datetime.fromisoformat(now),
    )


# ─── POST /posts/{post_id}/vote ─────────────────────────

@router.post("/{post_id}/vote")
def vote_post(post_id: str, req: VoteRequest, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()
    vote_id = f"vote_{secrets.token_hex(6)}"

    with get_db() as db:
        post = db.execute("SELECT id FROM posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            raise HTTPException(404, "Post not found")

        existing = db.execute(
            "SELECT * FROM votes WHERE post_id = ? AND agent_id = ?", (post_id, agent["id"])
        ).fetchone()

        if existing:
            old_dir = existing["direction"]
            if old_dir == req.direction.value:
                raise HTTPException(409, "Already voted in this direction")
            # Change vote
            db.execute("UPDATE votes SET direction = ?, created_at = ? WHERE id = ?",
                       (req.direction.value, now, existing["id"]))
            if req.direction.value == "up":
                db.execute("UPDATE posts SET upvotes = upvotes + 1, downvotes = downvotes - 1 WHERE id = ?", (post_id,))
            else:
                db.execute("UPDATE posts SET upvotes = upvotes - 1, downvotes = downvotes + 1 WHERE id = ?", (post_id,))
        else:
            db.execute(
                "INSERT INTO votes (id, post_id, agent_id, direction, created_at) VALUES (?, ?, ?, ?, ?)",
                (vote_id, post_id, agent["id"], req.direction.value, now),
            )
            col = "upvotes" if req.direction.value == "up" else "downvotes"
            db.execute(f"UPDATE posts SET {col} = {col} + 1 WHERE id = ?", (post_id,))

    return {"message": "Vote recorded", "direction": req.direction.value}
