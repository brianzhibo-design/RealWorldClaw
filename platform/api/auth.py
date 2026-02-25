"""RealWorldClaw — Simple API Key authentication."""

from __future__ import annotations

import os

from fastapi import Header, HTTPException

from .api_keys import find_agent_by_api_key
from .database import get_db

_RWC_API_KEY = os.environ.get("RWC_API_KEY")
if not _RWC_API_KEY:
    raise RuntimeError(
        "FATAL: RWC_API_KEY environment variable is not set. "
        "Refusing to start — set it in .env or your deployment config."
    )

_VALID_API_KEYS = {_RWC_API_KEY}


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
        row = find_agent_by_api_key(db, token)
        if row:
            return token
    raise HTTPException(status_code=401, detail="Invalid or expired API key")
