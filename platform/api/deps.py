"""FastAPI dependencies for authentication & RBAC."""

from __future__ import annotations

from typing import Callable

from fastapi import Depends, Header, HTTPException
from jose import JWTError

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
