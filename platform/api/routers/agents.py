"""Agent注册 / 认领 / 查询"""

from __future__ import annotations

import json
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Header, HTTPException

from ..database import get_db
from ..models.schemas import (
    AgentRegisterRequest,
    AgentRegisterResponse,
    AgentResponse,
    AgentUpdateRequest,
)

router = APIRouter(prefix="/agents", tags=["agents"])

VERSION = "0.1.0"


def _tier_for_rep(rep: int) -> str:
    if rep >= 2000: return "legend"
    if rep >= 500:  return "core"
    if rep >= 100:  return "trusted"
    if rep >= 20:   return "contributor"
    return "newcomer"


def _row_to_agent(row) -> AgentResponse:
    return AgentResponse(
        id=row["id"],
        name=row["name"],
        display_name=row["display_name"],
        description=row["description"],
        type=row["type"],
        status=row["status"],
        reputation=row["reputation"],
        tier=row["tier"],
        callback_url=row["callback_url"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def get_current_agent(authorization: str = Header(...)):
    """简易鉴权：从 Bearer token 查找 agent"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header")
    api_key = authorization[7:]
    with get_db() as db:
        row = db.execute("SELECT * FROM agents WHERE api_key = ?", (api_key,)).fetchone()
    if not row:
        raise HTTPException(401, "Invalid API key")
    return dict(row)


# ─── POST /agents/register ───────────────────────────────

@router.post("/register", response_model=AgentRegisterResponse, status_code=201)
def register_agent(req: AgentRegisterRequest):
    now = datetime.now(timezone.utc).isoformat()
    agent_id = f"ag_{secrets.token_hex(4)}"
    api_key = f"rwc_sk_live_{secrets.token_hex(16)}"
    claim_token = secrets.token_hex(12)
    claim_expires = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    with get_db() as db:
        existing = db.execute("SELECT id FROM agents WHERE name = ?", (req.name,)).fetchone()
        if existing:
            raise HTTPException(409, detail={"code": "NAME_TAKEN", "message": f"Name '{req.name}' is already taken"})

        db.execute(
            """INSERT INTO agents (id, name, display_name, description, type, status,
               reputation, tier, api_key, callback_url, claim_token, claim_expires_at,
               created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, 'pending_claim', 0, 'newcomer', ?, ?, ?, ?, ?, ?)""",
            (agent_id, req.name, req.display_name, req.description, req.type.value,
             api_key, req.callback_url, claim_token, claim_expires, now, now),
        )

    agent = AgentResponse(
        id=agent_id, name=req.name, display_name=req.display_name,
        description=req.description, type=req.type,
        status="pending_claim", reputation=0, tier="newcomer",
        callback_url=req.callback_url,
        created_at=datetime.fromisoformat(now),
        updated_at=datetime.fromisoformat(now),
    )
    return AgentRegisterResponse(
        agent=agent,
        api_key=api_key,
        claim_url=f"https://realworldclaw.com/claim/{agent_id}?token={claim_token}",
        claim_expires_at=datetime.fromisoformat(claim_expires),
    )


# ─── POST /agents/claim ─────────────────────────────────

@router.post("/claim")
def claim_agent(claim_token: str, human_email: str):
    with get_db() as db:
        row = db.execute("SELECT * FROM agents WHERE claim_token = ?", (claim_token,)).fetchone()
        if not row:
            raise HTTPException(400, "Invalid claim token")
        if row["status"] != "pending_claim":
            raise HTTPException(409, {"code": "ALREADY_CLAIMED", "message": "Agent already claimed"})
        if row["claim_expires_at"] and datetime.fromisoformat(row["claim_expires_at"]) < datetime.now(timezone.utc):
            raise HTTPException(400, {"code": "CLAIM_EXPIRED", "message": "Claim link expired"})

        now = datetime.now(timezone.utc).isoformat()
        db.execute(
            "UPDATE agents SET status = 'active', claim_token = NULL, updated_at = ? WHERE id = ?",
            (now, row["id"]),
        )
    return {"agent_id": row["id"], "status": "active", "message": "Agent已激活，可以开始使用了！"}


# ─── GET /agents/me ──────────────────────────────────────

@router.get("/me", response_model=AgentResponse)
def get_me(agent: dict = Depends(get_current_agent)):
    return _row_to_agent(agent)


# ─── PATCH /agents/me ────────────────────────────────────

@router.patch("/me", response_model=AgentResponse)
def update_me(req: AgentUpdateRequest, agent: dict = Depends(get_current_agent)):
    now = datetime.now(timezone.utc).isoformat()
    updates = []
    params = []
    for field in ["display_name", "description", "callback_url", "location_city", "location_country"]:
        val = getattr(req, field, None)
        if val is not None:
            updates.append(f"{field} = ?")
            params.append(val)
    if req.hardware_inventory is not None:
        updates.append("hardware_inventory = ?")
        params.append(json.dumps(req.hardware_inventory))

    if not updates:
        raise HTTPException(422, "No fields to update")

    updates.append("updated_at = ?")
    params.append(now)
    params.append(agent["id"])

    with get_db() as db:
        db.execute(f"UPDATE agents SET {', '.join(updates)} WHERE id = ?", params)
        # W6: 自动根据reputation更新tier
        row = db.execute("SELECT * FROM agents WHERE id = ?", (agent["id"],)).fetchone()
        new_tier = _tier_for_rep(row["reputation"])
        if new_tier != row["tier"]:
            db.execute("UPDATE agents SET tier = ? WHERE id = ?", (new_tier, row["id"]))
            row = db.execute("SELECT * FROM agents WHERE id = ?", (agent["id"],)).fetchone()

    return _row_to_agent(row)


# ─── GET /agents/{agent_id} ─────────────────────────────

@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str):
    with get_db() as db:
        row = db.execute("SELECT * FROM agents WHERE id = ?", (agent_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Agent not found")
    return _row_to_agent(row)
