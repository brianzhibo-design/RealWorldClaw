"""Admin API key lifecycle routes."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..api_keys import create_api_key, list_api_keys, revoke_api_key, rotate_api_key
from ..database import get_db
from ..deps import require_role

router = APIRouter(prefix="/api-keys", tags=["api-keys"])


class CreateApiKeyRequest(BaseModel):
    description: str = Field(default="", max_length=255)
    expires_in_days: int = Field(default=90, ge=1, le=3650)


class RotateApiKeyRequest(BaseModel):
    expires_in_days: int = Field(default=90, ge=1, le=3650)


@router.post("")
def create_api_key_endpoint(
    payload: CreateApiKeyRequest,
    _admin: dict = Depends(require_role("admin")),
):
    with get_db() as db:
        created = create_api_key(
            db,
            description=payload.description,
            expires_in_days=payload.expires_in_days,
        )
    return created


@router.get("")
def list_api_keys_endpoint(_admin: dict = Depends(require_role("admin"))):
    with get_db() as db:
        items = list_api_keys(db)
    return {"items": items}


@router.delete("/{key_id}")
def revoke_api_key_endpoint(key_id: str, _admin: dict = Depends(require_role("admin"))):
    with get_db() as db:
        ok = revoke_api_key(db, key_id)
    if not ok:
        raise HTTPException(status_code=404, detail="API key not found")
    return {"ok": True, "key_id": key_id}


@router.post("/{key_id}/rotate")
def rotate_api_key_endpoint(
    key_id: str,
    payload: RotateApiKeyRequest,
    _admin: dict = Depends(require_role("admin")),
):
    with get_db() as db:
        rotated = rotate_api_key(db, key_id=key_id, expires_in_days=payload.expires_in_days)
    if not rotated:
        raise HTTPException(status_code=404, detail="Active API key not found")
    return rotated
