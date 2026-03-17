"""Authentication routes — register, login, refresh, me, OAuth."""

from __future__ import annotations

import logging
import os
import time
import uuid
from collections import defaultdict
from datetime import datetime, timezone

import httpx

logger = logging.getLogger(__name__)

# Simple in-memory rate limiter (resets on restart — fine for SQLite scale)
_rate_buckets: dict[str, list[float]] = defaultdict(list)


def _rate_check(key: str, max_calls: int, window_sec: int) -> bool:
    """Return True if request is allowed, False if rate-limited."""
    if os.environ.get("TESTING"):
        return True
    now = time.monotonic()
    bucket = _rate_buckets[key]
    # Prune expired entries
    _rate_buckets[key] = bucket = [t for t in bucket if now - t < window_sec]
    if len(bucket) >= max_calls:
        return False
    bucket.append(now)
    return True


def _conflict_from_user_integrity_error(exc: Exception) -> HTTPException | None:
    """Map DB-level unique constraint violations to stable API conflicts."""
    msg = str(exc).lower()
    if "unique" not in msg:
        return None
    if "email" in msg:
        return HTTPException(status_code=409, detail="Email already registered")
    if "username" in msg:
        return HTTPException(status_code=409, detail="Username already taken")
    return HTTPException(status_code=409, detail="User already exists")


from fastapi import APIRouter, Depends, HTTPException, status
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_auth_requests
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
from ..telemetry import get_tracer

router = APIRouter(prefix="/auth", tags=["Auth"])
_AUTH_TRACER = get_tracer("realworldclaw.auth.router")


class MessageResponse(BaseModel):
    message: str = Field(..., examples=["Logged out successfully"])


class AccountDeleteResponse(BaseModel):
    message: str = Field(..., examples=["Account deleted. Your data has been removed."])


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., examples=["OldPassword123"])
    new_password: str = Field(..., min_length=8, examples=["NewSecurePass123"])


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Create a user account with email/username/password and immediately return access + refresh tokens.",
    responses={409: {"description": "Email or username already exists"}, 429: {"description": "Too many registration attempts"}},
)
def register(req: UserRegisterRequest):
    with _AUTH_TRACER.start_as_current_span("auth.register"):
        if not _rate_check(f"reg:{req.email}", max_calls=5, window_sec=3600):
            raise HTTPException(status_code=429, detail="Too many registration attempts. Try again later.")
        now = datetime.now(timezone.utc).isoformat()
        user_id = f"usr_{uuid.uuid4().hex[:12]}"
        hashed = hash_password(req.password)

        with get_db() as db:
            # Check duplicates
            if db.execute("SELECT 1 FROM users WHERE email = ?", (req.email,)).fetchone():
                raise HTTPException(status_code=409, detail="Email already registered")
            if db.execute("SELECT 1 FROM users WHERE username = ?", (req.username,)).fetchone():
                raise HTTPException(status_code=409, detail="Username already taken")

            try:
                db.execute(
                    """INSERT INTO users (id, email, username, hashed_password, role, is_active, created_at, updated_at)
                       VALUES (?, ?, ?, ?, 'user', 1, ?, ?)""",
                    (user_id, req.email, req.username, hashed, now, now),
                )
            except Exception as exc:
                conflict = _conflict_from_user_integrity_error(exc)
                if conflict:
                    raise conflict
                raise
            row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

        token_data = {"sub": user_id, "role": "user"}
        return AuthResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user=_user_response(row),
        )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Login with email or username",
    description="Authenticate a user account and return fresh access/refresh JWT tokens.",
    responses={401: {"description": "Invalid credentials"}, 403: {"description": "Account deactivated"}, 429: {"description": "Too many login attempts"}},
)
def login(req: UserLoginRequest):
    with _AUTH_TRACER.start_as_current_span("auth.login"):
        login_key = f"login:{req.email or req.username}"
        if not _rate_check(login_key, max_calls=20, window_sec=300):
            raise HTTPException(status_code=429, detail="Too many login attempts. Try again in 5 minutes.")

        with get_db() as db:
            if req.email:
                row = db.execute("SELECT * FROM users WHERE email = ?", (req.email.lower().strip(),)).fetchone()
            elif req.username:
                row = db.execute("SELECT * FROM users WHERE username = ?", (req.username,)).fetchone()
            else:
                raise HTTPException(status_code=400, detail="Email or username required")

        if not row or not verify_password(req.password, row["hashed_password"]):
            time.sleep(1)  # Brute-force delay
            logger.warning("Failed login attempt for %s", req.email or req.username)
            raise HTTPException(status_code=401, detail="Invalid credentials")
        if not row["is_active"]:
            raise HTTPException(status_code=403, detail="Account deactivated")

        token_data = {"sub": row["id"], "role": row["role"]}
        return AuthResponse(
            access_token=create_access_token(token_data),
            refresh_token=create_refresh_token(token_data),
            user=_user_response(row),
        )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Issue a new token pair from a valid refresh token.",
    responses={401: {"description": "Invalid/expired refresh token or inactive user"}},
)
def refresh(req: RefreshRequest):
    from jose import JWTError

    with _AUTH_TRACER.start_as_current_span("auth.refresh"):
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


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
    description="Return the authenticated user profile derived from bearer token.",
    responses={401: {"description": "Unauthorized"}},
)
def get_me(user: dict = Depends(get_current_user)):
    return _user_response(user)


@router.put(
    "/me",
    response_model=UserResponse,
    summary="Update current user profile",
    description="Update username and/or email for the authenticated account.",
    responses={401: {"description": "Unauthorized"}, 409: {"description": "Email/username conflict"}},
)
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


@router.post(
    "/change-password",
    response_model=MessageResponse,
    summary="Change account password",
    description="Change password for authenticated user after validating current password.",
    responses={400: {"description": "Current password mismatch"}, 401: {"description": "Unauthorized"}},
)
def change_password(req: ChangePasswordRequest, user: dict = Depends(get_current_user)):
    if not verify_password(req.current_password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    now = datetime.now(timezone.utc).isoformat()
    hashed = hash_password(req.new_password)
    with get_db() as db:
        db.execute("UPDATE users SET hashed_password = ?, updated_at = ? WHERE id = ?", (hashed, now, user["id"]))

    return {"message": "Password updated successfully"}


@router.post(
    "/logout",
    response_model=MessageResponse,
    summary="Logout (stateless)",
    description="Return logout acknowledgement. JWT revocation is handled client-side or by token rotation strategy.",
)
def logout():
    return {"message": "Logged out successfully"}


@router.delete(
    "/me",
    response_model=AccountDeleteResponse,
    summary="Permanently delete account",
    description="Delete the authenticated user and dependent data records from platform tables.",
    responses={401: {"description": "Unauthorized"}},
)
def delete_account(user: dict = Depends(get_current_user)):
    """Delete user account and associated records."""
    user_id = user["id"]
    logger.warning("Account deletion requested: user=%s email=%s", user_id, user.get("email"))

    with get_db() as db:
        # Delete private messages in both directions first.
        db.execute("DELETE FROM direct_messages WHERE sender_id = ? OR recipient_id = ?", (user_id, user_id))

        # Remove follow relationships.
        db.execute("DELETE FROM follows WHERE follower_id = ? OR following_id = ?", (user_id, user_id))

        # Remove comments and votes authored by this user.
        db.execute("DELETE FROM community_comments WHERE author_id = ?", (user_id,))
        db.execute("DELETE FROM community_votes WHERE user_id = ?", (user_id,))

        # Remove posts (and dependent comments/votes via ON DELETE CASCADE where applicable).
        db.execute("DELETE FROM community_posts WHERE author_id = ?", (user_id,))
        db.execute("DELETE FROM replies WHERE author_id = ?", (user_id,))
        db.execute("DELETE FROM posts WHERE author_id = ?", (user_id,))

        # Remove maker profiles bound to this user.
        db.execute("DELETE FROM makers WHERE owner_id = ?", (user_id,))

        # Finally remove user account.
        db.execute("DELETE FROM users WHERE id = ?", (user_id,))

    logger.info("Account deleted: user=%s", user_id)
    return {"message": "Account deleted. Your data has been removed."}


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
    code: str = Field(..., examples=["1a2b3c4d5e6f"])


@router.post(
    "/github",
    response_model=AuthResponse,
    summary="Authenticate via GitHub OAuth",
    description="Exchange GitHub authorization code for user identity and return platform tokens.",
    responses={400: {"description": "No primary email from GitHub"}, 401: {"description": "GitHub OAuth failed"}},
)
def github_auth(req: GitHubAuthRequest):
    with _AUTH_TRACER.start_as_current_span("auth.oauth.github"):
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
    credential: str = Field(..., examples=["4/0AeaYSH...", "eyJhbGciOi..."])  # Google authorization code or ID token (JWT)


@router.post(
    "/google",
    response_model=AuthResponse,
    summary="Authenticate via Google OAuth",
    description="Accept Google auth code or ID token, verify identity, then issue platform JWT tokens.",
    responses={400: {"description": "Invalid Google credential payload"}, 401: {"description": "Google OAuth failed"}},
)
def google_auth(req: GoogleAuthRequest):
    with _AUTH_TRACER.start_as_current_span("auth.oauth.google"):
        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")

        # Try as authorization code first (from OAuth redirect flow)
        idinfo = None
        if not req.credential.startswith("eyJ"):  # Not a JWT → treat as auth code
            try:
                token_resp = httpx.post(
                    "https://oauth2.googleapis.com/token",
                    data={
                        "code": req.credential,
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "redirect_uri": os.environ.get("GOOGLE_REDIRECT_URI", "https://realworldclaw.com/auth/callback/google"),
                        "grant_type": "authorization_code",
                    },
                    timeout=15,
                )
                token_data = token_resp.json()
                id_token_str = token_data.get("id_token")
                if not id_token_str:
                    raise HTTPException(status_code=401, detail=f"Google OAuth failed: {token_data.get('error_description', token_data.get('error', 'unknown'))}")
                # Verify the id_token
                idinfo = google_id_token.verify_oauth2_token(
                    id_token_str, google_auth_requests.Request(), client_id
                )
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=401, detail=f"Google OAuth code exchange failed: {str(e)}")
        else:
            # Direct ID token (from Google Sign-In button)
            try:
                idinfo = google_id_token.verify_oauth2_token(
                    req.credential, google_auth_requests.Request(), client_id
                )
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid Google ID token")

        if not idinfo:
            raise HTTPException(status_code=400, detail="Could not verify Google identity")

        email = idinfo.get("email")
        if not email:
            raise HTTPException(status_code=400, detail="No email in Google token")

        name = idinfo.get("name", email.split("@")[0])
        google_id = idinfo.get("sub", "")

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
