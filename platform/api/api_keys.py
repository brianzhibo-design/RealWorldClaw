"""Agent API key hashing and verification helpers."""

from __future__ import annotations

import hashlib
import hmac

HASH_PREFIX = "sha256$"


def hash_api_key(raw_api_key: str) -> str:
    digest = hashlib.sha256(raw_api_key.encode("utf-8")).hexdigest()
    return f"{HASH_PREFIX}{digest}"


def is_hashed_api_key(value: str | None) -> bool:
    return bool(value and value.startswith(HASH_PREFIX))


def verify_api_key(raw_api_key: str, stored_value: str | None) -> bool:
    """Verify raw key against stored hash (or legacy plaintext for compatibility)."""
    if not stored_value:
        return False
    if is_hashed_api_key(stored_value):
        return hmac.compare_digest(hash_api_key(raw_api_key), stored_value)
    # Legacy plaintext compatibility; should be migrated to hashed on rotation.
    return hmac.compare_digest(raw_api_key, stored_value)


def find_agent_by_api_key(db, raw_api_key: str):
    """Find agent row by API key with hashed-first + legacy fallback lookup."""
    row = db.execute("SELECT * FROM agents WHERE api_key = ?", (hash_api_key(raw_api_key),)).fetchone()
    if row:
        return row
    return db.execute("SELECT * FROM agents WHERE api_key = ?", (raw_api_key,)).fetchone()
