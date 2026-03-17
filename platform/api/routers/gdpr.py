"""GDPR compliance endpoints: data export, consent management, soft deletion."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/gdpr", tags=["GDPR"])


class ConsentUpdateRequest(BaseModel):
    consent: dict[str, bool] = Field(..., examples=[{"analytics": True, "marketing": False}])


class ConsentResponse(BaseModel):
    user_id: str = Field(..., examples=["usr_abc123def456"])
    consent: dict[str, bool] = Field(..., examples=[{"analytics": True, "marketing": False}])
    updated_at: str | None = Field(default=None, examples=["2026-03-17T10:22:33+00:00"])


class ConsentUpdateResponse(ConsentResponse):
    message: str = Field(..., examples=["Consent updated"])


class GDPRDeleteResponse(BaseModel):
    message: str = Field(..., examples=["Account anonymized (soft deleted)"])
    user_id: str
    deleted_at: str
    anonymized: bool


@router.get(
    "/consent",
    response_model=ConsentResponse,
    summary="Get GDPR consent preferences",
    description="Return current authenticated user's consent flags.",
    responses={401: {"description": "Unauthorized"}},
)
def get_consent(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["id"],
        "consent": _parse_consent(user.get("consent")),
        "updated_at": user.get("updated_at"),
    }


@router.post(
    "/consent",
    response_model=ConsentUpdateResponse,
    summary="Update GDPR consent preferences",
    description="Persist consent flags for the authenticated user.",
    responses={401: {"description": "Unauthorized"}},
)
def update_consent(req: ConsentUpdateRequest, user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    serialized = _serialize_consent(req.consent)

    with get_db() as db:
        db.execute(
            "UPDATE users SET consent = ?, updated_at = ? WHERE id = ?",
            (serialized, now, user["id"]),
        )

    return {
        "message": "Consent updated",
        "user_id": user["id"],
        "consent": req.consent,
        "updated_at": now,
    }


@router.get(
    "/export",
    response_model=dict[str, Any],
    summary="Export personal data bundle",
    description="Generate GDPR export payload containing user profile and related datasets.",
    responses={401: {"description": "Unauthorized"}},
)
def export_my_data(user: dict = Depends(get_current_user)):
    user_id = user["id"]

    with get_db() as db:
        export_data: dict[str, Any] = {
            "user": _public_user_row(user),
            "consent": _parse_consent(user.get("consent")),
            "exported_at": datetime.now(timezone.utc).isoformat(),
            "datasets": {
                "community_posts": _safe_query_all(db, "SELECT * FROM community_posts WHERE author_id = ?", (user_id,)),
                "community_comments": _safe_query_all(db, "SELECT * FROM community_comments WHERE author_id = ?", (user_id,)),
                "community_votes": _safe_query_all(db, "SELECT * FROM community_votes WHERE user_id = ?", (user_id,)),
                "follows": _safe_query_all(
                    db,
                    "SELECT * FROM follows WHERE follower_id = ? OR following_id = ?",
                    (user_id, user_id),
                ),
                "direct_messages": _safe_query_all(
                    db,
                    "SELECT * FROM direct_messages WHERE sender_id = ? OR recipient_id = ?",
                    (user_id, user_id),
                ),
                "orders": _safe_query_all(
                    db,
                    "SELECT * FROM orders WHERE customer_id = ? OR maker_id = ?",
                    (user_id, user_id),
                ),
                "makers": _safe_query_all(db, "SELECT * FROM makers WHERE owner_id = ?", (user_id,)),
                "nodes": _safe_query_all(db, "SELECT * FROM nodes WHERE owner_id = ?", (user_id,)),
                "posts": _safe_query_all(db, "SELECT * FROM posts WHERE author_id = ?", (user_id,)),
                "replies": _safe_query_all(db, "SELECT * FROM replies WHERE author_id = ?", (user_id,)),
                "messages": _safe_query_all(
                    db,
                    "SELECT * FROM messages WHERE from_user = ? OR to_user = ?",
                    (user_id, user_id),
                ),
            },
        }

    return export_data


@router.delete(
    "/delete",
    response_model=GDPRDeleteResponse,
    summary="Anonymize account (soft delete)",
    description="Anonymize personally identifiable fields and disable account while retaining referential integrity.",
    responses={400: {"description": "Already anonymized"}, 401: {"description": "Unauthorized"}},
)
def soft_delete_account(user: dict = Depends(get_current_user)):
    if user.get("anonymized"):
        raise HTTPException(status_code=400, detail="Account already anonymized")

    user_id = user["id"]
    now = datetime.now(timezone.utc).isoformat()
    anon_email = f"deleted+{user_id}@anonymized.local"
    anon_username = f"deleted_{user_id}"

    with get_db() as db:
        db.execute(
            """
            UPDATE users
            SET email = ?,
                username = ?,
                hashed_password = ?,
                is_active = 0,
                anonymized = 1,
                deleted_at = ?,
                updated_at = ?
            WHERE id = ?
            """,
            (anon_email, anon_username, "__anonymized__", now, now, user_id),
        )

    return {
        "message": "Account anonymized (soft deleted)",
        "user_id": user_id,
        "deleted_at": now,
        "anonymized": True,
    }


def _safe_query_all(db, query: str, params: tuple[Any, ...]) -> list[dict[str, Any]]:
    try:
        rows = db.execute(query, params).fetchall()
    except Exception:
        return []
    return [dict(r) for r in rows]


def _serialize_consent(consent: dict[str, bool]) -> str:
    import json

    return json.dumps(consent, ensure_ascii=False, separators=(",", ":"))


def _parse_consent(raw: Any) -> dict[str, bool]:
    import json

    if not raw:
        return {}
    if isinstance(raw, dict):
        return {str(k): bool(v) for k, v in raw.items()}
    try:
        parsed = json.loads(raw)
    except Exception:
        return {}
    if not isinstance(parsed, dict):
        return {}
    return {str(k): bool(v) for k, v in parsed.items()}


def _public_user_row(user: dict) -> dict[str, Any]:
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "username": user.get("username"),
        "role": user.get("role"),
        "is_active": bool(user.get("is_active")),
        "anonymized": bool(user.get("anonymized")),
        "deleted_at": user.get("deleted_at"),
        "created_at": user.get("created_at"),
        "updated_at": user.get("updated_at"),
    }
