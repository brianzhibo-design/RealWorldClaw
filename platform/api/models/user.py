"""User model for authentication system."""

from __future__ import annotations

import enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class UserRole(str, enum.Enum):
    admin = "admin"
    maker = "maker"
    designer = "designer"
    user = "user"


# ─── Request / Response schemas ──────────────────────────

class UserRegisterRequest(BaseModel):
    email: str = Field(..., min_length=5)
    username: str = Field(..., min_length=3, max_length=32)
    password: str = Field(..., min_length=8)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email format")
        return v.lower().strip()


class UserLoginRequest(BaseModel):
    email: Optional[str] = None
    username: Optional[str] = None
    password: str

    @field_validator("email")
    @classmethod
    def validate_login_id(cls, v, info):
        """At least one of email or username must be provided."""
        if v is None and info.data.get("username") is None:
            raise ValueError("Either email or username is required")
        return v


class UserUpdateRequest(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=32)
    email: Optional[str] = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email format")
        return v.lower().strip()


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    role: UserRole
    is_active: bool
    created_at: str
    updated_at: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── DB schema creation ─────────────────────────────────

USERS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username);
"""
