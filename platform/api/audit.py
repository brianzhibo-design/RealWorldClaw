"""RealWorldClaw — Audit logging to SQLite."""

from __future__ import annotations

import uuid
from typing import Optional
from datetime import datetime, timezone

from .database import get_db
from .logging_config import get_logger

logger = get_logger("audit")

AUDIT_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    user_id TEXT,
    action TEXT NOT NULL,
    resource TEXT,
    details TEXT,
    ip_address TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
"""


def init_audit_table() -> None:
    """Create the audit_log table if it doesn't exist."""
    with get_db() as db:
        db.executescript(AUDIT_TABLE_SQL)


def log_audit(
    action: str,
    *,
    user_id: Optional[str] = None,
    resource: Optional[str] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    """Record an audit event."""
    entry_id = str(uuid.uuid4())
    ts = datetime.now(timezone.utc).isoformat()
    try:
        with get_db() as db:
            db.execute(
                "INSERT INTO audit_log (id, timestamp, user_id, action, resource, details, ip_address) "
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                (entry_id, ts, user_id, action, resource, details, ip_address),
            )
        logger.info("audit_event", action=action, user_id=user_id, resource=resource)
    except Exception:
        logger.exception("audit_write_failed", action=action)
