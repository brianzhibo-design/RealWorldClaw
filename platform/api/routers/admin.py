"""RealWorldClaw — Admin monitoring endpoints."""

from __future__ import annotations

import json
from typing import Optional
from datetime import datetime, timedelta, timezone
from pathlib import Path

from fastapi import APIRouter, Depends, Query

from ..database import get_db
from ..deps import require_role
from ..logging_config import get_logger

router = APIRouter(prefix="/admin", tags=["admin"])

LOG_DIR = Path(__file__).parent.parent.parent / "logs"


@router.get("/stats")
def admin_stats(user: dict = Depends(require_role("admin"))):
    """System statistics for the monitoring dashboard."""
    with get_db() as db:
        total_users = db.execute("SELECT COUNT(*) as c FROM users").fetchone()["c"]
        total_orders = db.execute("SELECT COUNT(*) as c FROM orders").fetchone()["c"]
        active_makers = db.execute(
            "SELECT COUNT(*) as c FROM makers WHERE availability = 'open'"
        ).fetchone()["c"]

        # 24h request count from audit log (approximate)
        since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
        audit_24h = db.execute(
            "SELECT COUNT(*) as c FROM audit_log WHERE timestamp > ?", (since,)
        ).fetchone()["c"]

    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "active_makers": active_makers,
        "audit_events_24h": audit_24h,
    }


@router.get("/audit-log")
def admin_audit_log(
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    action: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    user: dict = Depends(require_role("admin")),
):
    """Query audit log entries."""
    query = "SELECT * FROM audit_log WHERE 1=1"
    params: list = []
    if action:
        query += " AND action = ?"
        params.append(action)
    if user_id:
        query += " AND user_id = ?"
        params.append(user_id)
    query += " ORDER BY timestamp DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    with get_db() as db:
        rows = db.execute(query, params).fetchall()
    return {"items": [dict(r) for r in rows], "limit": limit, "offset": offset}


@router.get("/errors")
def admin_errors(
    limit: int = Query(50, ge=1, le=200),
    user: dict = Depends(require_role("admin")),
):
    """Recent errors from the error log file."""
    error_log = LOG_DIR / "error.log"
    if not error_log.exists():
        return {"errors": [], "count": 0}

    lines = error_log.read_text(encoding="utf-8").strip().splitlines()
    # Take last N lines
    recent = lines[-limit:]
    errors = []
    for line in reversed(recent):
        try:
            errors.append(json.loads(line))
        except json.JSONDecodeError:
            errors.append({"raw": line})

    return {"errors": errors, "count": len(errors)}
