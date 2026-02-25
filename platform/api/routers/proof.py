"""Proof-of-Physical APIs: submit and verify manufacturing evidence chain."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from ..database import get_db
from ..deps import get_authenticated_identity

router = APIRouter(prefix="/proof", tags=["proof"])


class ProofSubmitRequest(BaseModel):
    node_id: str = Field(..., min_length=1)
    order_id: str | None = None
    proof_type: Literal["photo", "video", "log", "sensor"]
    description: str | None = Field(default=None, max_length=2000)
    evidence_url: str = Field(..., min_length=1, max_length=4000)


class ProofVerifyRequest(BaseModel):
    verified: bool
    notes: str | None = Field(default=None, max_length=2000)


@router.post("/submit", status_code=201)
def submit_proof(req: ProofSubmitRequest, identity: dict = Depends(get_authenticated_identity)):
    proof_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    with get_db() as db:
        node_row = db.execute("SELECT id FROM nodes WHERE id = ?", (req.node_id,)).fetchone()
        if not node_row:
            raise HTTPException(status_code=404, detail="Node not found")

        if req.order_id:
            order_row = db.execute("SELECT id FROM orders WHERE id = ?", (req.order_id,)).fetchone()
            if not order_row:
                raise HTTPException(status_code=404, detail="Order not found")

        db.execute(
            """
            INSERT INTO manufacturing_proofs (
                id, node_id, submitter_id, order_id, proof_type, description,
                evidence_url, verification_status, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            """,
            (
                proof_id,
                req.node_id,
                identity["identity_id"],
                req.order_id,
                req.proof_type,
                req.description,
                req.evidence_url,
                now,
            ),
        )

    return {
        "id": proof_id,
        "node_id": req.node_id,
        "order_id": req.order_id,
        "proof_type": req.proof_type,
        "description": req.description,
        "evidence_url": req.evidence_url,
        "verification_status": "pending",
        "created_at": now,
    }


@router.get("/node/{node_id}")
def list_node_proofs(
    node_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    offset = (page - 1) * per_page

    with get_db() as db:
        total = db.execute(
            "SELECT COUNT(*) AS c FROM manufacturing_proofs WHERE node_id = ?",
            (node_id,),
        ).fetchone()["c"]

        rows = db.execute(
            """
            SELECT * FROM manufacturing_proofs
            WHERE node_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
            """,
            (node_id, per_page, offset),
        ).fetchall()

    return {
        "items": [dict(r) for r in rows],
        "total": total,
        "page": page,
        "per_page": per_page,
    }


@router.get("/verify/{proof_id}")
def get_proof_detail(proof_id: str):
    with get_db() as db:
        row = db.execute("SELECT * FROM manufacturing_proofs WHERE id = ?", (proof_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Proof not found")
        return dict(row)


@router.post("/{proof_id}/verify")
def verify_proof(
    proof_id: str,
    req: ProofVerifyRequest,
    identity: dict = Depends(get_authenticated_identity),
):
    now = datetime.now(timezone.utc).isoformat()
    status: Literal["verified", "rejected"] = "verified" if req.verified else "rejected"

    with get_db() as db:
        row = db.execute("SELECT id FROM manufacturing_proofs WHERE id = ?", (proof_id,)).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Proof not found")

        db.execute(
            """
            UPDATE manufacturing_proofs
            SET verification_status = ?,
                verified_by = ?,
                verification_notes = ?,
                verified_at = ?
            WHERE id = ?
            """,
            (status, identity["identity_id"], req.notes, now, proof_id),
        )

        updated = db.execute("SELECT * FROM manufacturing_proofs WHERE id = ?", (proof_id,)).fetchone()

    return dict(updated)
