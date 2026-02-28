"""RealWorldClaw — Audit log middleware for write operations."""

from __future__ import annotations

import asyncio
import uuid
from datetime import datetime, timezone
from typing import Callable, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from ..logging_config import get_logger

logger = get_logger("middleware.audit")

# HTTP methods that count as write operations
WRITE_METHODS = {"POST", "PUT", "DELETE", "PATCH"}

# Paths to skip (health checks, static, etc.)
SKIP_PREFIXES = ("/health", "/docs", "/openapi.json", "/redoc")


def _extract_user_id(request: Request) -> Optional[str]:
    """Try to extract user/agent ID from the Authorization header without blocking."""
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header.removeprefix("Bearer ")
    try:
        from ..security import decode_token
        payload = decode_token(token)
        return payload.get("sub")
    except Exception:
        return None


def _write_audit_entry(
    *,
    user_id: Optional[str],
    agent_id: Optional[str],
    method: str,
    path: str,
    request_body_summary: Optional[str],
    response_status: int,
    ip_address: Optional[str],
) -> None:
    """Synchronously write an audit log entry (called from background task)."""
    from ..database import get_db

    entry_id = str(uuid.uuid4())
    ts = datetime.now(timezone.utc).isoformat()
    action = f"{method} {path}"

    try:
        with get_db() as db:
            db.execute(
                "INSERT INTO audit_log (id, timestamp, user_id, agent_id, action, method, path, "
                "request_body_summary, response_status, ip_address) "
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (entry_id, ts, user_id, agent_id, action, method, path,
                 request_body_summary, response_status, ip_address),
            )
    except Exception:
        logger.exception("audit_write_failed", action=action)


class AuditLogMiddleware(BaseHTTPMiddleware):
    """Record all write operations (POST/PUT/DELETE/PATCH) to the audit_log table.

    Uses background tasks so request latency is unaffected.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        method = request.method.upper()

        # Skip non-write methods and health/docs paths
        if method not in WRITE_METHODS:
            return await call_next(request)

        path = request.url.path
        if any(path.startswith(p) for p in SKIP_PREFIXES):
            return await call_next(request)

        # Read body summary before call_next consumes it
        body_summary: Optional[str] = None
        try:
            body_bytes = await request.body()
            if body_bytes:
                body_summary = body_bytes[:500].decode("utf-8", errors="replace")
        except Exception:
            pass

        # Extract user info from token (non-blocking, best-effort)
        user_id = _extract_user_id(request)
        # agent_id: check X-Agent-Id header (for agent-initiated requests)
        agent_id = request.headers.get("x-agent-id")
        ip_address = request.client.host if request.client else None

        # Process the actual request
        response = await call_next(request)

        # Fire-and-forget audit write in background
        asyncio.get_event_loop().run_in_executor(
            None,
            lambda: _write_audit_entry(
                user_id=user_id,
                agent_id=agent_id,
                method=method,
                path=path,
                request_body_summary=body_summary,
                response_status=response.status_code,
                ip_address=ip_address,
            ),
        )

        return response
