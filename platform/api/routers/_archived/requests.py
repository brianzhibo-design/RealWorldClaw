"""Capability request management — AI agents request physical capabilities, makers fulfill."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException, Query
from pydantic import BaseModel, Field

from ..database import get_db
from .ai_agents import get_ai_agent

router = APIRouter(prefix="/requests", tags=["requests"])


class RequestCreate(BaseModel):
    capability: str = Field(..., min_length=1)
    description: str = Field(..., min_length=1, max_length=2000)


class RequestResponse(BaseModel):
    id: str
    agent_id: str
    capability: str
    description: str
    status: str
    claimed_by: str | None
    created_at: datetime
    updated_at: datetime


def _row_to_request(row) -> RequestResponse:
    return RequestResponse(
        id=row["id"],
        agent_id=row["agent_id"],
        capability=row["capability"],
        description=row["description"],
        status=row["status"],
        claimed_by=row["claimed_by"],
        created_at=datetime.fromisoformat(row["created_at"]),
        updated_at=datetime.fromisoformat(row["updated_at"]),
    )


# ─── POST /requests ─────────────────────────────────────

@router.post("", response_model=RequestResponse, status_code=201)
def create_request(req: RequestCreate, authorization: str = Header(...)):
    agent = get_ai_agent(authorization)
    now = datetime.now(timezone.utc).isoformat()
    req_id = f"req_{secrets.token_hex(8)}"

    with get_db() as db:
        db.execute(
            """INSERT INTO capability_requests (id, agent_id, capability, description, status, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'open', ?, ?)""",
            (req_id, agent["id"], req.capability, req.description, now, now),
        )
        row = db.execute("SELECT * FROM capability_requests WHERE id = ?", (req_id,)).fetchone()

    return _row_to_request(row)


# ─── GET /requests ───────────────────────────────────────

@router.get("", response_model=dict)
def list_requests(
    status: str | None = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    conditions: list[str] = []
    params: list = []
    if status:
        conditions.append("status = ?")
        params.append(status)

    where = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    offset = (page - 1) * per_page

    with get_db() as db:
        total = db.execute(f"SELECT COUNT(*) as c FROM capability_requests {where}", params).fetchone()["c"]
        rows = db.execute(
            f"SELECT * FROM capability_requests {where} ORDER BY created_at DESC LIMIT ? OFFSET ?",
            params + [per_page, offset],
        ).fetchall()

    return {"total": total, "page": page, "per_page": per_page, "requests": [_row_to_request(r) for r in rows]}


# ─── PUT /requests/{request_id}/claim ────────────────────

@router.put("/{request_id}/claim", response_model=RequestResponse)
def claim_request(request_id: str, maker_id: str = Query(...)):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        row = db.execute("SELECT * FROM capability_requests WHERE id = ?", (request_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Request not found")
        if row["status"] != "open":
            raise HTTPException(409, f"Request is already {row['status']}")

        db.execute(
            "UPDATE capability_requests SET status = 'claimed', claimed_by = ?, updated_at = ? WHERE id = ?",
            (maker_id, now, request_id),
        )
        row = db.execute("SELECT * FROM capability_requests WHERE id = ?", (request_id,)).fetchone()

    return _row_to_request(row)


# ─── PUT /requests/{request_id}/fulfill ──────────────────

@router.put("/{request_id}/fulfill", response_model=RequestResponse)
def fulfill_request(request_id: str):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        row = db.execute("SELECT * FROM capability_requests WHERE id = ?", (request_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Request not found")
        if row["status"] != "claimed":
            raise HTTPException(409, f"Request must be claimed first (current: {row['status']})")

        db.execute(
            "UPDATE capability_requests SET status = 'fulfilled', updated_at = ? WHERE id = ?",
            (now, request_id),
        )
        row = db.execute("SELECT * FROM capability_requests WHERE id = ?", (request_id,)).fetchone()

    return _row_to_request(row)
