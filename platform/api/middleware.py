"""RealWorldClaw — Request logging middleware."""

from __future__ import annotations

import time
from typing import Callable, Optional

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from .logging_config import get_logger

logger = get_logger("middleware.request")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log every HTTP request with method, path, status, duration, and body size."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        content_length = int(request.headers.get("content-length", 0))

        # Try to extract user_id from request state (set by auth deps)
        user_id: Optional[str] = None

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start) * 1000
            logger.error(
                "request_error",
                method=request.method,
                path=request.url.path,
                duration_ms=round(duration_ms, 2),
                body_bytes=content_length,
                client_ip=request.client.host if request.client else None,
                error=str(exc),
                error_type=type(exc).__name__,
            )
            raise

        duration_ms = (time.perf_counter() - start) * 1000

        log_method = logger.info if response.status_code < 400 else logger.warning
        if response.status_code >= 500:
            log_method = logger.error

        log_method(
            "request",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration_ms, 2),
            body_bytes=content_length,
            client_ip=request.client.host if request.client else None,
            user_id=user_id,
        )

        return response
