"""AI Agent registration, discovery, and profile management."""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException, Query

from ..database import get_db
from ..models.agent import (
    AIAgentRegister,
    AIAgentRegisterResponse,
    AIAgentResponse,
    CapabilitiesUpdate,
    WishlistUpdate,
)

router = APIRouter(prefix="/ai-agents", tags=["ai-agents"])


def _row_to_agent(row) -> AIAgentResponse:
    return AIAgentResponse(
        id=row["id"],
        name=row["name"],
        emoji=row["emoji"],
        description=row["description"],
        provider=row["provider"],
        capabilities=json.loads(row["capabilities"]),
        wishlist=json.loads(row["wishlist"]),
        owner_id=row["owner_id"],
        is_active=bool(row["is_active"]),
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def get_ai_agent(authorization: str = Header(...)) -> dict:
    """Authenticate AI agent via Bearer token."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header")
    api_key = authorization[7:]
    with get_db() as db:
        row = db.execute("SELECT * FROM ai_agents WHERE api_key = ? AND is_active = 1", (api_key,)).fetchone()
    if not row:
        raise HTTPException(401, "Invalid API key")
    return dict(row)


# ─── POST /ai-agents/register ────────────────────────────

@router.post("/register", response_model=AIAgentRegisterResponse, status_code=201)
def register_agent(req: AIAgentRegister):
    now = datetime.now(timezone.utc).isoformat()
    agent_id = f"ai_{secrets.token_hex(8)}"
    api_key = f"rwc_ai_{secrets.token_hex(24)}"

    with get_db() as db:
        db.execute(
            """INSERT INTO ai_agents (id, name, emoji, description, provider,
               capabilities, wishlist, owner_id, api_key, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)""",
            (agent_id, req.name, req.emoji, req.description, req.provider,
             json.dumps(req.capabilities), json.dumps(req.wishlist),
             req.owner_id, api_key, now, now),
        )
        row = db.execute("SELECT * FROM ai_agents WHERE id = ?", (agent_id,)).fetchone()

    return AIAgentRegisterResponse(agent=_row_to_agent(row), api_key=api_key)


# ─── GET /ai-agents ──────────────────────────────────────

@router.get("", response_model=dict)
def list_agents(
    provider: str | None = None,
    capability: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    conditions = ["is_active = 1"]
    params: list = []
    if provider:
        conditions.append("provider = ?")
        params.append(provider)

    where = f"WHERE {' AND '.join(conditions)}"
    offset = (page - 1) * per_page

    with get_db() as db:
        # Capability filter is done in Python since it's JSON
        if capability:
            rows = db.execute(f"SELECT * FROM ai_agents {where} ORDER BY created_at DESC", params).fetchall()
            filtered = [r for r in rows if capability in json.loads(r["capabilities"])]
            total = len(filtered)
            page_rows = filtered[offset:offset + per_page]
            agents = [_row_to_agent(r) for r in page_rows]
        else:
            total = db.execute(f"SELECT COUNT(*) as c FROM ai_agents {where}", params).fetchone()["c"]
            rows = db.execute(
                f"SELECT * FROM ai_agents {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
                params + [per_page, offset],
            ).fetchall()
            agents = [_row_to_agent(r) for r in rows]

    return {"total": total, "page": page, "per_page": per_page, "agents": agents}


# ─── GET /ai-agents/{agent_id} ───────────────────────────

@router.get("/{agent_id}", response_model=AIAgentResponse)
def get_agent(agent_id: str):
    with get_db() as db:
        row = db.execute("SELECT * FROM ai_agents WHERE id = ?", (agent_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Agent not found")
    return _row_to_agent(row)


# ─── PUT /ai-agents/{agent_id}/capabilities ──────────────

@router.put("/{agent_id}/capabilities", response_model=AIAgentResponse)
def update_capabilities(agent_id: str, req: CapabilitiesUpdate, authorization: str = Header(...)):
    agent = get_ai_agent(authorization)
    if agent["id"] != agent_id:
        raise HTTPException(403, "Can only update your own capabilities")
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        db.execute(
            "UPDATE ai_agents SET capabilities = ?, updated_at = ? WHERE id = ?",
            (json.dumps(req.capabilities), now, agent_id),
        )
        row = db.execute("SELECT * FROM ai_agents WHERE id = ?", (agent_id,)).fetchone()
    return _row_to_agent(row)


# ─── PUT /ai-agents/{agent_id}/wishlist ──────────────────

@router.put("/{agent_id}/wishlist", response_model=AIAgentResponse)
def update_wishlist(agent_id: str, req: WishlistUpdate, authorization: str = Header(...)):
    agent = get_ai_agent(authorization)
    if agent["id"] != agent_id:
        raise HTTPException(403, "Can only update your own wishlist")
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        db.execute(
            "UPDATE ai_agents SET wishlist = ?, updated_at = ? WHERE id = ?",
            (json.dumps(req.wishlist), now, agent_id),
        )
        row = db.execute("SELECT * FROM ai_agents WHERE id = ?", (agent_id,)).fetchone()
    return _row_to_agent(row)
