"""RealWorldClaw — Audit log query endpoints (admin only)."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, Query

from ..database import get_db
from ..deps import require_role

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("/logs")
def get_audit_logs(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    action: Optional[str] = Query(None, description="Filter by action (e.g. POST /api/v1/...)"),
    method: Optional[str] = Query(None, description="Filter by HTTP method"),
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=200, description="Items per page"),
    _user: dict = Depends(require_role("admin")),
):
    """Query audit logs with filtering and pagination. Requires admin role."""
    conditions = []
    params = []

    if user_id:
        conditions.append("(user_id = ? OR agent_id = ?)")
        params.extend([user_id, user_id])
    if action:
        conditions.append("action LIKE ?")
        params.append(f"%{action}%")
    if method:
        conditions.append("method = ?")
        params.append(method.upper())
    if date:
        conditions.append("timestamp LIKE ?")
        params.append(f"{date}%")

    where = ""
    if conditions:
        where = "WHERE " + " AND ".join(conditions)

    offset = (page - 1) * page_size

    with get_db() as db:
        total = db.execute(
            f"SELECT COUNT(*) as c FROM audit_log {where}", params
        ).fetchone()["c"]

        rows = db.execute(
            f"SELECT * FROM audit_log {where} ORDER BY timestamp DESC LIMIT ? OFFSET ?",
            params + [page_size, offset],
        ).fetchall()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "logs": [dict(r) for r in rows],
    }
