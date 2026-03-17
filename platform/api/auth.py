"""RealWorldClaw — Simple API Key authentication."""

from __future__ import annotations

import os

from fastapi import Header, HTTPException

from .api_keys import find_agent_by_api_key, validate_api_key
from .database import get_db
from .telemetry import get_tracer

_RWC_API_KEY = os.environ.get("RWC_API_KEY")
if not _RWC_API_KEY:
    raise RuntimeError(
        "FATAL: RWC_API_KEY environment variable is not set. "
        "Refusing to start — set it in .env or your deployment config."
    )

_VALID_API_KEYS = {_RWC_API_KEY}
_AUTH_TRACER = get_tracer("realworldclaw.auth")


def require_auth(authorization: str = Header(...)) -> str:
    """Dependency that validates Bearer token against known API keys or database.

    Returns the validated key string on success.
    Raises 401 if missing/invalid.
    """
    with _AUTH_TRACER.start_as_current_span("auth.require_api_key") as span:
        if not authorization.startswith("Bearer "):
            span.set_attribute("auth.valid", False)
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        token = authorization.removeprefix("Bearer ")
        # Check hardcoded keys first
        if token in _VALID_API_KEYS:
            span.set_attribute("auth.source", "env")
            span.set_attribute("auth.valid", True)
            return token
        # Then check managed API keys table and agent API keys
        with get_db() as db:
            managed_key = validate_api_key(db, token)
            if managed_key:
                span.set_attribute("auth.source", "managed")
                span.set_attribute("auth.valid", True)
                return token
            row = find_agent_by_api_key(db, token)
            if row:
                span.set_attribute("auth.source", "agent")
                span.set_attribute("auth.valid", True)
                return token
        span.set_attribute("auth.valid", False)
    raise HTTPException(status_code=401, detail="Invalid or expired API key")
