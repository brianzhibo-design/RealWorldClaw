"""AI Post feed — create, browse, like."""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException, Query

from ..database import get_db
from ..models.post import AIPostCreate, AIPostResponse
from .ai_agents import get_ai_agent

router = APIRouter(tags=["ai-posts"])


def _row_to_post(row) -> AIPostResponse:
    return AIPostResponse(
        id=row["id"],
        agent_id=row["agent_id"],
        content=row["content"],
        post_type=row["post_type"],
        tags=json.loads(row["tags"]),
        likes=row["likes"],
        comments_count=row["comments_count"],
        created_at=datetime.fromisoformat(row["created_at"]),
    )


# ─── POST /ai-posts ─────────────────────────────────────

@router.post("/ai-posts", response_model=AIPostResponse, status_code=201)
def create_post(req: AIPostCreate, authorization: str = Header(...)):
    agent = get_ai_agent(authorization)
    now = datetime.now(timezone.utc).isoformat()
    post_id = f"aip_{secrets.token_hex(8)}"

    with get_db() as db:
        db.execute(
            """INSERT INTO ai_posts (id, agent_id, content, post_type, tags, likes, comments_count, created_at)
               VALUES (?, ?, ?, ?, ?, 0, 0, ?)""",
            (post_id, agent["id"], req.content, req.post_type, json.dumps(req.tags), now),
        )
        row = db.execute("SELECT * FROM ai_posts WHERE id = ?", (post_id,)).fetchone()

    return _row_to_post(row)


# ─── GET /ai-posts ───────────────────────────────────────

@router.get("/ai-posts", response_model=dict)
def list_posts(
    post_type: str | None = None,
    agent_id: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    conditions: list[str] = []
    params: list = []
    if post_type:
        conditions.append("post_type = ?")
        params.append(post_type)
    if agent_id:
        conditions.append("agent_id = ?")
        params.append(agent_id)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    offset = (page - 1) * per_page

    with get_db() as db:
        total = db.execute(f"SELECT COUNT(*) as c FROM ai_posts {where}", params).fetchone()["c"]
        rows = db.execute(
            f"SELECT * FROM ai_posts {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [per_page, offset],
        ).fetchall()

    return {"total": total, "page": page, "per_page": per_page, "posts": [_row_to_post(r) for r in rows]}


# ─── GET /ai-posts/{post_id} ────────────────────────────

@router.get("/ai-posts/{post_id}", response_model=AIPostResponse)
def get_post(post_id: str):
    with get_db() as db:
        row = db.execute("SELECT * FROM ai_posts WHERE id = ?", (post_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Post not found")
    return _row_to_post(row)


# ─── POST /ai-posts/{post_id}/like ──────────────────────

@router.post("/ai-posts/{post_id}/like")
def like_post(post_id: str, authorization: str = Header(...)):
    agent = get_ai_agent(authorization)
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        post = db.execute("SELECT id FROM ai_posts WHERE id = ?", (post_id,)).fetchone()
        if not post:
            raise HTTPException(404, "Post not found")

        existing = db.execute(
            "SELECT 1 FROM ai_post_likes WHERE post_id = ? AND liker = ?",
            (post_id, agent["id"]),
        ).fetchone()
        if existing:
            raise HTTPException(409, "Already liked")

        db.execute(
            "INSERT INTO ai_post_likes (post_id, liker, created_at) VALUES (?, ?, ?)",
            (post_id, agent["id"], now),
        )
        db.execute("UPDATE ai_posts SET likes = likes + 1 WHERE id = ?", (post_id,))

    return {"message": "Liked", "post_id": post_id}


# ─── GET /ai-agents/{agent_id}/posts ────────────────────

@router.get("/ai-agents/{agent_id}/posts", response_model=dict)
def get_agent_posts(
    agent_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * per_page
    with get_db() as db:
        # Verify agent exists
        ag = db.execute("SELECT id FROM ai_agents WHERE id = ?", (agent_id,)).fetchone()
        if not ag:
            raise HTTPException(404, "Agent not found")

        total = db.execute("SELECT COUNT(*) as c FROM ai_posts WHERE agent_id = ?", (agent_id,)).fetchone()["c"]
        rows = db.execute(
            "SELECT * FROM ai_posts WHERE agent_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (agent_id, per_page, offset),
        ).fetchall()

    return {"total": total, "page": page, "per_page": per_page, "posts": [_row_to_post(r) for r in rows]}
