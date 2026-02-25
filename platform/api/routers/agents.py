"""Agent注册 / 认领 / 查询"""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile

from ..api_keys import find_agent_by_api_key, hash_api_key
from ..database import get_db
from ..models.schemas import (
    AgentRegisterRequest,
    AgentRegisterResponse,
    AgentResponse,
    AgentUpdateRequest,
)

router = APIRouter(prefix="/agents", tags=["agents"])

VERSION = "0.1.0"
AVATAR_UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "avatars"


def _tier_for_rep(rep: int) -> str:
    if rep >= 2000:
        return "legend"
    if rep >= 500:
        return "core"
    if rep >= 100:
        return "trusted"
    if rep >= 20:
        return "contributor"
    return "newcomer"


def _row_to_agent(row) -> AgentResponse:
    capabilities_tags_raw = row["capabilities_tags"] if "capabilities_tags" in row.keys() else None
    try:
        capabilities_tags = json.loads(capabilities_tags_raw) if capabilities_tags_raw else []
    except Exception:
        capabilities_tags = []

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
        bio=row["bio"] if "bio" in row.keys() else None,
        capabilities_tags=capabilities_tags,
        verification_badge=row["verification_badge"] if "verification_badge" in row.keys() and row["verification_badge"] else "none",
        total_jobs_completed=row["total_jobs_completed"] if "total_jobs_completed" in row.keys() and row["total_jobs_completed"] is not None else 0,
        success_rate=float(row["success_rate"]) if "success_rate" in row.keys() and row["success_rate"] is not None else 0.0,
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


def get_current_agent(authorization: str = Header(...)):
    """简易鉴权：从 Bearer token 查找 agent"""
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Invalid authorization header")
    api_key = authorization[7:]
    with get_db() as db:
        row = find_agent_by_api_key(db, api_key)
    if not row:
        raise HTTPException(401, "Invalid API key")
    return dict(row)


# ─── GET /agents ──────────────────────────────────────────

@router.get("")
def list_agents(limit: int = 20, offset: int = 0):
    with get_db() as db:
        rows = db.execute(
            "SELECT * FROM agents ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset)
        ).fetchall()
        total = db.execute("SELECT COUNT(*) FROM agents").fetchone()[0]
    return {"agents": [_row_to_agent(r) for r in rows], "total": total}


# ─── POST /agents/register ───────────────────────────────

@router.post("/register", response_model=AgentRegisterResponse, status_code=201)
def register_agent(req: AgentRegisterRequest):
    now = datetime.now(timezone.utc).isoformat()
    agent_id = f"ag_{secrets.token_hex(4)}"
    api_key = f"rwc_sk_live_{secrets.token_hex(16)}"
    api_key_hash = hash_api_key(api_key)
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
             api_key_hash, req.callback_url, claim_token, claim_expires, now, now),
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

@router.post("/{agent_id}/avatar")
async def upload_agent_avatar(
    agent_id: str,
    avatar: UploadFile = File(...),
    agent: dict = Depends(get_current_agent),
):
    if agent["id"] != agent_id:
        raise HTTPException(403, "Forbidden")

    if not avatar.content_type or not avatar.content_type.startswith("image/"):
        raise HTTPException(400, "Avatar must be an image")

    suffix = Path(avatar.filename or "avatar.png").suffix.lower() or ".png"
    if suffix not in {".png", ".jpg", ".jpeg", ".gif", ".webp"}:
        suffix = ".png"

    AVATAR_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    avatar_name = f"{agent_id}_{secrets.token_hex(8)}{suffix}"
    avatar_path = AVATAR_UPLOAD_DIR / avatar_name

    content = await avatar.read()
    if not content:
        raise HTTPException(400, "Empty avatar file")

    avatar_path.write_bytes(content)
    avatar_url = f"/uploads/avatars/{avatar_name}"
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        db.execute(
            "UPDATE agents SET avatar_url = ?, updated_at = ? WHERE id = ?",
            (avatar_url, now, agent_id),
        )

    return {"agent_id": agent_id, "avatar_url": avatar_url, "updated_at": now}


@router.post("/{agent_id}/rotate-key")
def rotate_agent_key(agent_id: str, agent: dict = Depends(get_current_agent)):
    if agent["id"] != agent_id:
        raise HTTPException(403, "Forbidden")

    now = datetime.now(timezone.utc).isoformat()
    new_api_key = f"rwc_sk_live_{secrets.token_hex(16)}"
    new_api_key_hash = hash_api_key(new_api_key)

    with get_db() as db:
        db.execute(
            "UPDATE agents SET api_key = ?, updated_at = ? WHERE id = ?",
            (new_api_key_hash, now, agent_id),
        )

    return {"agent_id": agent_id, "api_key": new_api_key, "rotated_at": now}


@router.get("/{agent_id}", response_model=AgentResponse)
def get_agent(agent_id: str):
    with get_db() as db:
        row = db.execute("SELECT * FROM agents WHERE id = ?", (agent_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Agent not found")
    return _row_to_agent(row)
