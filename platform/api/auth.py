"""RealWorldClaw — Simple API Key authentication."""

from __future__ import annotations

from fastapi import Header, HTTPException

from .database import get_db

# Hardcoded test key for MVP development
_VALID_API_KEYS = {"rwc-test-key-2026"}


def require_auth(authorization: str = Header(...)) -> str:
    """Dependency that validates Bearer token against known API keys or database.

    Returns the validated key string on success.
    Raises 401 if missing/invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    token = authorization.removeprefix("Bearer ")
    # Check hardcoded keys first
    if token in _VALID_API_KEYS:
        return token
    # Then check database for agent API keys
    with get_db() as db:
        row = db.execute("SELECT id FROM agents WHERE api_key = ?", (token,)).fetchone()
        if row:
            return token
    raise HTTPException(status_code=401, detail="Invalid or expired API key")
