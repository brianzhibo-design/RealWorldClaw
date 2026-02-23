"""Authentication routes — register, login, refresh, me, OAuth."""

from __future__ import annotations

import os
import uuid
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt as jose_jwt
from pydantic import BaseModel, Field

from ..database import get_db
from ..deps import get_current_user
from ..models.user import (
    AuthResponse,
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


@router.post("/register", response_model=AuthResponse, status_code=201)
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

    token_data = {"sub": user_id, "role": "user"}
    return AuthResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=_user_response(row),
    )


@router.post("/login", response_model=AuthResponse)
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
    return AuthResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=_user_response(row),
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


class _ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


@router.post("/change-password")
def change_password(req: _ChangePasswordRequest, user: dict = Depends(get_current_user)):
    if not verify_password(req.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    now = datetime.now(timezone.utc).isoformat()
    hashed = hash_password(req.new_password)
    with get_db() as db:
        db.execute("UPDATE users SET hashed_password = ?, updated_at = ? WHERE id = ?", (hashed, now, user["id"]))

    return {"message": "Password updated successfully"}


@router.post("/logout")
def logout():
    return {"message": "Logged out successfully"}


# ── OAuth helpers ──────────────────────────────────────────────

def _oauth_find_or_create(db, *, email: str, username: str, oauth_provider: str, oauth_id: str) -> dict:
    """Find existing user by email or create a new OAuth user. Returns row dict."""
    row = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if row:
        # Update oauth info if missing
        if not row["oauth_provider"]:
            db.execute(
                "UPDATE users SET oauth_provider = ?, oauth_id = ? WHERE id = ?",
                (oauth_provider, oauth_id, row["id"]),
            )
            row = db.execute("SELECT * FROM users WHERE id = ?", (row["id"],)).fetchone()
        return dict(row)

    # Auto-register
    now = datetime.now(timezone.utc).isoformat()
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    # Ensure unique username
    base = username or email.split("@")[0]
    uname = base
    suffix = 0
    while db.execute("SELECT 1 FROM users WHERE username = ?", (uname,)).fetchone():
        suffix += 1
        uname = f"{base}_{suffix}"
    hashed = hash_password(uuid.uuid4().hex)  # random password
    db.execute(
        """INSERT INTO users (id, email, username, hashed_password, role, is_active, oauth_provider, oauth_id, created_at, updated_at)
           VALUES (?, ?, ?, ?, 'user', 1, ?, ?, ?, ?)""",
        (user_id, email, uname, hashed, oauth_provider, oauth_id, now, now),
    )
    row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row)


def _build_auth_response(row: dict) -> AuthResponse:
    token_data = {"sub": row["id"], "role": row["role"]}
    return AuthResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
        user=_user_response(row),
    )


# ── GitHub OAuth ──────────────────────────────────────────────

class GitHubAuthRequest(BaseModel):
    code: str


@router.post("/github", response_model=AuthResponse)
def github_auth(req: GitHubAuthRequest):
    client_id = os.environ.get("GITHUB_CLIENT_ID", "")
    client_secret = os.environ.get("GITHUB_CLIENT_SECRET", "")

    # Exchange code for access token
    token_resp = httpx.post(
        "https://github.com/login/oauth/access_token",
        json={"client_id": client_id, "client_secret": client_secret, "code": req.code},
        headers={"Accept": "application/json"},
        timeout=15,
    )
    token_data = token_resp.json()
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail=f"GitHub OAuth failed: {token_data.get('error_description', 'unknown')}")

    headers = {"Authorization": f"Bearer {access_token}", "Accept": "application/json"}

    # Get user info
    user_resp = httpx.get("https://api.github.com/user", headers=headers, timeout=10)
    if user_resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Failed to fetch GitHub user")
    gh_user = user_resp.json()

    # Get primary email
    email = gh_user.get("email")
    if not email:
        emails_resp = httpx.get("https://api.github.com/user/emails", headers=headers, timeout=10)
        if emails_resp.status_code == 200:
            for e in emails_resp.json():
                if e.get("primary"):
                    email = e["email"]
                    break
    if not email:
        raise HTTPException(status_code=400, detail="No email associated with GitHub account")

    with get_db() as db:
        row = _oauth_find_or_create(
            db,
            email=email.lower().strip(),
            username=gh_user.get("login", ""),
            oauth_provider="github",
            oauth_id=str(gh_user["id"]),
        )
    return _build_auth_response(row)


# ── Google OAuth ──────────────────────────────────────────────

class GoogleAuthRequest(BaseModel):
    credential: str  # Google ID token (JWT)


@router.post("/google", response_model=AuthResponse)
def google_auth(req: GoogleAuthRequest):
    # Decode JWT without verification (MVP)
    try:
        payload = jose_jwt.get_unverified_claims(req.credential)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google ID token")

    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="No email in Google token")

    name = payload.get("name", email.split("@")[0])
    google_id = payload.get("sub", "")

    with get_db() as db:
        row = _oauth_find_or_create(
            db,
            email=email.lower().strip(),
            username=name,
            oauth_provider="google",
            oauth_id=google_id,
        )
    return _build_auth_response(row)


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
