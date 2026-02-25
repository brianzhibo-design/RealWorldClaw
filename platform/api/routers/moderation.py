"""Moderation APIs: report and resolve abusive content."""

from __future__ import annotations

import secrets
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..database import get_db
from ..deps import get_current_user, require_role

router = APIRouter(prefix="/moderation", tags=["moderation"])


class ReportCreateRequest(BaseModel):
    target_type: Literal["post", "comment", "agent"]
    target_id: str = Field(..., min_length=1)
    reason: str = Field(..., min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)


class ReportResolveRequest(BaseModel):
    action: Literal["dismiss", "warn", "remove", "ban"]
    notes: str | None = Field(default=None, max_length=2000)


@router.post("/report", status_code=201)
def create_report(req: ReportCreateRequest, user: dict = Depends(get_current_user)):
    report_id = f"rep_{secrets.token_hex(8)}"
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        db.execute(
            """
            INSERT INTO reports (
                id, reporter_id, target_type, target_id, reason, description,
                status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)
            """,
            (
                report_id,
                user["id"],
                req.target_type,
                req.target_id,
                req.reason,
                req.description,
                now,
            ),
        )

    return {
        "id": report_id,
        "status": "pending",
        "created_at": now,
    }


@router.get("/reports")
def list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=200),
    user: dict = Depends(require_role("admin")),
):
    offset = (page - 1) * per_page
    with get_db() as db:
        rows = db.execute(
            """
            SELECT * FROM reports
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (per_page, offset),
        ).fetchall()
        total = db.execute("SELECT COUNT(*) AS c FROM reports").fetchone()["c"]

    return {
        "items": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.post("/reports/{report_id}/resolve")
def resolve_report(
    report_id: str,
    req: ReportResolveRequest,
    admin_user: dict = Depends(require_role("admin")),
):
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        row = db.execute("SELECT * FROM reports WHERE id = ?", (report_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Report not found")
        if row["status"] != "pending":
            raise HTTPException(status_code=409, detail="Report already resolved")

        db.execute(
            """
            UPDATE reports
            SET status = 'resolved',
                resolved_by = ?,
                resolution_action = ?,
                resolution_notes = ?,
                resolved_at = ?
            WHERE id = ?
            """,
            (admin_user["id"], req.action, req.notes, now, report_id),
        )

    return {
        "id": report_id,
        "status": "resolved",
        "resolution_action": req.action,
        "resolved_at": now,
    }
