"""RealWorldClaw — Simple in-memory IP-based rate limiting."""

from __future__ import annotations

import os
import time
from collections import defaultdict
from typing import Callable

from fastapi import HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

def _is_testing() -> bool:
    return os.getenv("TESTING", "").lower() in ("1", "true", "yes")

# path prefix -> (max_requests, window_seconds)
AUTH_PREFIXES = ("/api/v1/auth/login", "/api/v1/auth/register")
DEFAULT_LIMIT = 100  # per minute
AUTH_LIMIT = 10  # per minute
WINDOW = 60  # seconds


class _TokenBucket:
    """Simple sliding-window counter per IP."""

    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str, limit: int, window: int) -> tuple[bool, int]:
        now = time.monotonic()
        bucket = self._hits[key]
        # Prune old entries
        cutoff = now - window
        self._hits[key] = bucket = [t for t in bucket if t > cutoff]
        if len(bucket) >= limit:
            return False, limit - len(bucket)
        bucket.append(now)
        return True, limit - len(bucket)

    def cleanup(self, max_age: float = 300) -> None:
        """Remove stale keys (call periodically if needed)."""
        now = time.monotonic()
        stale = [k for k, v in self._hits.items() if not v or v[-1] < now - max_age]
        for k in stale:
            del self._hits[k]


_bucket = _TokenBucket()


class RateLimitMiddleware(BaseHTTPMiddleware):
    """IP-based rate limiting middleware."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        if _is_testing():
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path

        # Determine limit
        is_auth = any(path.startswith(p) for p in AUTH_PREFIXES)
        limit = AUTH_LIMIT if is_auth else DEFAULT_LIMIT
        key = f"{client_ip}:auth" if is_auth else client_ip

        allowed, remaining = _bucket.is_allowed(key, limit, WINDOW)
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
            )

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(max(0, remaining))
        return response
