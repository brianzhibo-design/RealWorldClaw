"""RealWorldClaw — Simple API Key authentication."""

from __future__ import annotations

from fastapi import Header, HTTPException

# Hardcoded test key for MVP development
_VALID_API_KEYS = {"rwc-test-key-2026"}


def require_auth(authorization: str = Header(...)) -> str:
    """Dependency that validates Bearer token against known API keys.

    Returns the validated key string on success.
    Raises 401 if missing/invalid.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    token = authorization.removeprefix("Bearer ")
    if token not in _VALID_API_KEYS:
        raise HTTPException(status_code=401, detail="Invalid or expired API key")
    return token
