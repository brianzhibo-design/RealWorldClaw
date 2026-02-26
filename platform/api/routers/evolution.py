"""Agent Evolution (L0-L4) APIs."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..database import get_db
from ..deps import require_role
from ..services.evolution import grant_agent_xp, level_for_xp

router = APIRouter(prefix="/evolution", tags=["evolution"])


class GrantXPRequest(BaseModel):
    xp: int = Field(..., ge=1, le=1_000_000)
    reason: str | None = Field(default=None, max_length=500)


@router.get("/leaderboard")
def get_evolution_leaderboard():
    with get_db() as db:
        rows = db.execute(
            """
            SELECT id AS agent_id,
                   name,
                   display_name,
                   COALESCE(evolution_level, 0) AS evolution_level,
                   COALESCE(evolution_xp, 0) AS evolution_xp,
                   COALESCE(evolution_title, 'Newborn') AS evolution_title
            FROM agents
            ORDER BY evolution_xp DESC, created_at ASC
            LIMIT 20
            """
        ).fetchall()

    return {
        "items": [dict(r) for r in rows],
        "count": len(rows),
    }


@router.get("/{agent_id}")
def get_agent_evolution(agent_id: str):
    with get_db() as db:
        row = db.execute(
            """
            SELECT id AS agent_id,
                   name,
                   display_name,
                   COALESCE(evolution_level, 0) AS evolution_level,
                   COALESCE(evolution_xp, 0) AS evolution_xp,
                   COALESCE(evolution_title, 'Newborn') AS evolution_title,
                   created_at,
                   updated_at
            FROM agents
            WHERE id = ?
            """,
            (agent_id,),
        ).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Defensive correction for legacy records with missing/incorrect title.
    result = dict(row)
    corrected_level, corrected_title = level_for_xp(int(result["evolution_xp"]))
    if result["evolution_level"] != corrected_level or result["evolution_title"] != corrected_title:
        with get_db() as db:
            db.execute(
                "UPDATE agents SET evolution_level = ?, evolution_title = ?, updated_at = ? WHERE id = ?",
                (corrected_level, corrected_title, datetime.now(timezone.utc).isoformat(), agent_id),
            )
        result["evolution_level"] = corrected_level
        result["evolution_title"] = corrected_title

    return result


@router.post("/{agent_id}/grant-xp")
def grant_xp(
    agent_id: str,
    req: GrantXPRequest,
    _: dict = Depends(require_role("admin")),
):
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        updated = grant_agent_xp(db, agent_id, req.xp, bypass_cap=True)
        if not updated:
            raise HTTPException(status_code=404, detail="Agent not found")
        db.execute("UPDATE agents SET updated_at = ? WHERE id = ?", (now, agent_id))

    return {
        **updated,
        "granted_xp": req.xp,
        "reason": req.reason,
        "updated_at": now,
    }
