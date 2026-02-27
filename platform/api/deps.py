"""FastAPI dependencies for authentication & RBAC."""

from __future__ import annotations

from typing import Callable

from fastapi import Depends, Header, HTTPException
from jose import JWTError

from .api_keys import find_agent_by_api_key
from .database import get_db
from .security import decode_token


def get_current_user(authorization: str = Header(...)) -> dict:
    """Extract and validate JWT from Authorization header. Returns user dict."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    token = authorization.removeprefix("Bearer ")
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    with get_db() as db:
        row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="User not found")
    if not row["is_active"]:
        raise HTTPException(status_code=403, detail="User account is deactivated")

    return dict(row)


def require_role(*roles: str) -> Callable:
    """Dependency factory: require user to have one of the specified roles."""
    def _check(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail=f"Requires role: {', '.join(roles)}")
        return user
    return _check


def _resolve_agent_identity(raw_api_key: str) -> dict | None:
    with get_db() as db:
        row = find_agent_by_api_key(db, raw_api_key)
    if not row:
        return None
    result = dict(row)
    result["identity_type"] = "agent"
    result["identity_id"] = row["id"]
    return result


def _resolve_bearer_identity(token: str) -> dict | None:
    # Try JWT first
    try:
        payload = decode_token(token)
        if payload.get("type") == "access":
            user_id = payload.get("sub")
            if user_id:
                with get_db() as db:
                    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
                if row and row["is_active"]:
                    result = dict(row)
                    result["identity_type"] = "user"
                    result["identity_id"] = row["id"]
                    return result
    except JWTError:
        pass

    # Bearer token can also be an agent API key
    return _resolve_agent_identity(token)


def get_authenticated_identity(
    authorization: str | None = Header(default=None),
    x_agent_api_key: str | None = Header(default=None, alias="x-agent-api-key"),
) -> dict:
    """Unified auth: accepts JWT (user) or agent API key.

    Returns a dict with at least:
      - "identity_type": "user" | "agent"
      - "identity_id": user or agent ID
      - plus the full row from the relevant table
    """
    # Independent auth path for agents.
    if x_agent_api_key:
        agent = _resolve_agent_identity(x_agent_api_key)
        if agent:
            return agent

    if authorization:
        if not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        token = authorization.removeprefix("Bearer ")
        identity = _resolve_bearer_identity(token)
        if identity:
            return identity
    elif not x_agent_api_key:
        # Keep backwards compatibility with routes/tests that relied on header validation semantics.
        raise HTTPException(status_code=422, detail="Authorization header or x-agent-api-key is required")

    raise HTTPException(status_code=401, detail="Invalid credentials")
