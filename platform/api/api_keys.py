"""API key hashing + lifecycle management."""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

HASH_PREFIX = "hmac-sha256$"

_API_KEY_SECRET = os.environ.get("RWC_API_KEY_SECRET", "rwc-default-key-secret")


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _to_iso(ts: datetime) -> str:
    return ts.astimezone(timezone.utc).isoformat()


def hash_api_key(raw_api_key: str) -> str:
    digest = hmac.new(
        _API_KEY_SECRET.encode("utf-8"),
        raw_api_key.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{HASH_PREFIX}{digest}"


def is_hashed_api_key(value: str | None) -> bool:
    return bool(value and value.startswith(HASH_PREFIX))


def verify_api_key(raw_api_key: str, stored_value: str | None) -> bool:
    """Verify raw key against stored hash (or legacy plaintext for compatibility)."""
    if not stored_value:
        return False
    if stored_value.startswith(HASH_PREFIX):
        return hmac.compare_digest(hash_api_key(raw_api_key), stored_value)
    # Legacy plaintext compatibility; should be migrated to hashed on rotation.
    return hmac.compare_digest(raw_api_key, stored_value)


def find_agent_by_api_key(db, raw_api_key: str):
    """Find agent row by API key (HMAC-SHA256 hashed lookup with plaintext fallback)."""
    row = db.execute("SELECT * FROM agents WHERE api_key = ?", (hash_api_key(raw_api_key),)).fetchone()
    if row:
        return row
    # Plaintext fallback for unmigrated keys
    return db.execute("SELECT * FROM agents WHERE api_key = ?", (raw_api_key,)).fetchone()


def ensure_api_keys_table(db) -> None:
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS api_keys (
            key_id TEXT PRIMARY KEY,
            hashed_key TEXT UNIQUE NOT NULL,
            created_at TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            revoked INTEGER NOT NULL DEFAULT 0,
            description TEXT NOT NULL DEFAULT ''
        )
        """
    )
    db.execute("CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON api_keys(expires_at)")
    db.execute("CREATE INDEX IF NOT EXISTS idx_api_keys_revoked ON api_keys(revoked)")


def create_api_key(db, description: str, expires_in_days: int = 90) -> dict:
    ensure_api_keys_table(db)
    now = _utcnow()
    key_id = f"ak_{uuid.uuid4().hex}"
    raw_key = f"rwc_{uuid.uuid4().hex}_{secrets.token_urlsafe(24)}"
    hashed_key = hash_api_key(raw_key)
    expires_at = now + timedelta(days=max(1, expires_in_days))

    db.execute(
        """
        INSERT INTO api_keys (key_id, hashed_key, created_at, expires_at, revoked, description)
        VALUES (?, ?, ?, ?, 0, ?)
        """,
        (key_id, hashed_key, _to_iso(now), _to_iso(expires_at), description or ""),
    )
    return {
        "key_id": key_id,
        "api_key": raw_key,
        "created_at": _to_iso(now),
        "expires_at": _to_iso(expires_at),
        "revoked": False,
        "description": description or "",
    }


def list_api_keys(db) -> list[dict]:
    ensure_api_keys_table(db)
    rows = db.execute(
        """
        SELECT key_id, created_at, expires_at, revoked, description
        FROM api_keys
        ORDER BY created_at DESC
        """
    ).fetchall()
    return [dict(r) for r in rows]


def revoke_api_key(db, key_id: str) -> bool:
    ensure_api_keys_table(db)
    cur = db.execute("UPDATE api_keys SET revoked = 1 WHERE key_id = ?", (key_id,))
    return cur.rowcount > 0


def rotate_api_key(db, key_id: str, expires_in_days: int = 90) -> dict | None:
    ensure_api_keys_table(db)
    row = db.execute(
        "SELECT key_id, description FROM api_keys WHERE key_id = ? AND revoked = 0",
        (key_id,),
    ).fetchone()
    if not row:
        return None

    db.execute("UPDATE api_keys SET revoked = 1 WHERE key_id = ?", (key_id,))
    return create_api_key(
        db,
        description=(row["description"] or f"rotated_from:{row['key_id']}"),
        expires_in_days=expires_in_days,
    )


def validate_api_key(db, raw_key: str) -> dict | None:
    ensure_api_keys_table(db)
    hashed = hash_api_key(raw_key)
    row = db.execute(
        """
        SELECT key_id, created_at, expires_at, revoked, description
        FROM api_keys
        WHERE hashed_key = ?
        """,
        (hashed,),
    ).fetchone()
    if not row:
        return None

    result = dict(row)
    if bool(result.get("revoked")):
        return None

    expires_at_raw = result.get("expires_at")
    if not expires_at_raw:
        return None
    expires_at = datetime.fromisoformat(expires_at_raw)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= _utcnow():
        return None

    return result
