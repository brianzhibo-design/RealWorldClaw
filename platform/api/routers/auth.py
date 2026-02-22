"""Authentication routes — register, login, refresh, me."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from ..database import get_db
from ..deps import get_current_user
from ..models.user import (
    RefreshRequest,
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
    UserUpdateRequest,
)
from ..security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(req: UserRegisterRequest):
    now = datetime.now(timezone.utc).isoformat()
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    hashed = hash_password(req.password)

    with get_db() as db:
        # Check duplicates
        if db.execute("SELECT 1 FROM users WHERE email = ?", (req.email,)).fetchone():
            raise HTTPException(status_code=409, detail="Email already registered")
        if db.execute("SELECT 1 FROM users WHERE username = ?", (req.username,)).fetchone():
            raise HTTPException(status_code=409, detail="Username already taken")

        db.execute(
            """INSERT INTO users (id, email, username, hashed_password, role, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'user', 1, ?, ?)""",
            (user_id, req.email, req.username, hashed, now, now),
        )
        row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    return _user_response(row)


@router.post("/login", response_model=TokenResponse)
def login(req: UserLoginRequest):
    with get_db() as db:
        if req.email:
            row = db.execute("SELECT * FROM users WHERE email = ?", (req.email.lower().strip(),)).fetchone()
        elif req.username:
            row = db.execute("SELECT * FROM users WHERE username = ?", (req.username,)).fetchone()
        else:
            raise HTTPException(status_code=400, detail="Email or username required")

    if not row or not verify_password(req.password, row["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not row["is_active"]:
        raise HTTPException(status_code=403, detail="Account deactivated")

    token_data = {"sub": row["id"], "role": row["role"]}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/refresh", response_model=TokenResponse)
def refresh(req: RefreshRequest):
    from jose import JWTError

    try:
        payload = decode_token(req.refresh_token)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Not a refresh token")

    user_id = payload.get("sub")
    with get_db() as db:
        row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row or not row["is_active"]:
        raise HTTPException(status_code=401, detail="User not found or deactivated")

    token_data = {"sub": row["id"], "role": row["role"]}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserResponse)
def get_me(user: dict = Depends(get_current_user)):
    return _user_response(user)


@router.put("/me", response_model=UserResponse)
def update_me(req: UserUpdateRequest, user: dict = Depends(get_current_user)):
    updates = {}
    if req.username is not None:
        updates["username"] = req.username
    if req.email is not None:
        updates["email"] = req.email

    if not updates:
        return _user_response(user)

    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        # Check uniqueness
        if "email" in updates:
            existing = db.execute("SELECT 1 FROM users WHERE email = ? AND id != ?", (updates["email"], user["id"])).fetchone()
            if existing:
                raise HTTPException(status_code=409, detail="Email already registered")
        if "username" in updates:
            existing = db.execute("SELECT 1 FROM users WHERE username = ? AND id != ?", (updates["username"], user["id"])).fetchone()
            if existing:
                raise HTTPException(status_code=409, detail="Username already taken")

        set_clause = ", ".join(f"{k} = ?" for k in updates)
        values = list(updates.values()) + [now, user["id"]]
        db.execute(f"UPDATE users SET {set_clause}, updated_at = ? WHERE id = ?", values)
        row = db.execute("SELECT * FROM users WHERE id = ?", (user["id"],)).fetchone()

    return _user_response(row)


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}


def _user_response(row) -> UserResponse:
    """Convert a DB row (dict or sqlite3.Row) to UserResponse."""
    d = dict(row) if not isinstance(row, dict) else row
    return UserResponse(
        id=d["id"],
        email=d["email"],
        username=d["username"],
        role=d["role"],
        is_active=bool(d["is_active"]),
        created_at=d["created_at"],
        updated_at=d["updated_at"],
    )
