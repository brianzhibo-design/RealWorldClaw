"""SLO monitoring middleware and endpoints (in-memory, zero external deps)."""

from __future__ import annotations

import math
import threading
import time
from dataclasses import dataclass, field
from typing import Callable

from fastapi import FastAPI
from fastapi.responses import JSONResponse, PlainTextResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


@dataclass
class SLOMetricsStore:
    """Thread-safe in-memory counters for simple SLO tracking."""

    started_at: float = field(default_factory=time.time)
    total_requests: int = 0
    error_5xx_count: int = 0
    latency_ms_samples: list[float] = field(default_factory=list)
    latency_sample_limit: int = 20_000
    lock: threading.Lock = field(default_factory=threading.Lock)

    def record(self, *, status_code: int, duration_ms: float, include_latency: bool) -> None:
        with self.lock:
            self.total_requests += 1
            if status_code >= 500:
                self.error_5xx_count += 1

            if include_latency:
                self.latency_ms_samples.append(duration_ms)
                if len(self.latency_ms_samples) > self.latency_sample_limit:
                    # Keep a moving window in memory.
                    overflow = len(self.latency_ms_samples) - self.latency_sample_limit
                    del self.latency_ms_samples[:overflow]

    def snapshot(self) -> dict:
        with self.lock:
            total_requests = self.total_requests
            error_5xx_count = self.error_5xx_count
            samples = list(self.latency_ms_samples)

        error_rate = (error_5xx_count / total_requests) if total_requests else 0.0
        p99 = _percentile(samples, 99)

        return {
            "window": {
                "type": "process_lifetime",
                "started_at_unix": self.started_at,
                "uptime_seconds": round(time.time() - self.started_at, 2),
            },
            "targets": {
                "availability_monthly": 99.5,
                "latency_p99_ms_lt": 500.0,
                "error_5xx_rate_lt": 0.01,
            },
            "current": {
                "total_requests": total_requests,
                "error_5xx_count": error_5xx_count,
                "error_5xx_rate": round(error_rate, 6),
                "latency_samples": len(samples),
                "latency_p99_ms": round(p99, 2) if p99 is not None else None,
            },
            "compliance": {
                "error_rate_ok": error_rate < 0.01,
                "latency_p99_ok": (p99 is None) or (p99 < 500.0),
            },
        }

    def prometheus(self) -> str:
        snap = self.snapshot()
        current = snap["current"]

        lines = [
            "# HELP rwc_api_requests_total Total API requests observed by SLO middleware",
            "# TYPE rwc_api_requests_total counter",
            f"rwc_api_requests_total {current['total_requests']}",
            "# HELP rwc_api_errors_5xx_total Total 5xx responses observed by SLO middleware",
            "# TYPE rwc_api_errors_5xx_total counter",
            f"rwc_api_errors_5xx_total {current['error_5xx_count']}",
            "# HELP rwc_api_error_5xx_rate Current 5xx ratio (0-1)",
            "# TYPE rwc_api_error_5xx_rate gauge",
            f"rwc_api_error_5xx_rate {current['error_5xx_rate']}",
            "# HELP rwc_api_latency_p99_ms Current p99 latency in milliseconds (excluding upload requests)",
            "# TYPE rwc_api_latency_p99_ms gauge",
            f"rwc_api_latency_p99_ms {current['latency_p99_ms'] if current['latency_p99_ms'] is not None else 'NaN'}",
            "# HELP rwc_api_latency_samples Current latency sample size",
            "# TYPE rwc_api_latency_samples gauge",
            f"rwc_api_latency_samples {current['latency_samples']}",
        ]
        return "\n".join(lines) + "\n"


def _percentile(values: list[float], p: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    rank = math.ceil((p / 100) * len(ordered)) - 1
    rank = max(0, min(rank, len(ordered) - 1))
    return ordered[rank]


def _is_upload_request(request: Request) -> bool:
    path = request.url.path.lower()
    content_type = request.headers.get("content-type", "").lower()
    if "multipart/form-data" in content_type:
        return True
    return ("/files" in path and "/upload" in path)


slo_metrics_store = SLOMetricsStore()


class SLOMonitoringMiddleware(BaseHTTPMiddleware):
    """Collect per-request latency and 5xx counters for SLO tracking."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        started = time.perf_counter()
        status_code = 500

        try:
            response = await call_next(request)
            status_code = response.status_code
            return response
        finally:
            duration_ms = (time.perf_counter() - started) * 1000
            include_latency = not _is_upload_request(request)
            slo_metrics_store.record(
                status_code=status_code,
                duration_ms=duration_ms,
                include_latency=include_latency,
            )


def register_slo_routes(app: FastAPI) -> None:
    """Expose SLO health endpoint and optional Prometheus metrics endpoint."""

    @app.get(
        "/api/v1/health/slo",
        tags=["Health"],
        summary="SLO metrics snapshot",
        description="In-memory SLO indicators including request volume, 5xx error rate, and p99 latency.",
        response_model=dict,
        responses={200: {"description": "Current SLO snapshot"}},
    )
    def slo_health() -> JSONResponse:
        return JSONResponse(content=slo_metrics_store.snapshot())

    @app.get(
        "/metrics",
        tags=["Health"],
        summary="Prometheus metrics",
        description="Prometheus text exposition for SLO counters and gauges.",
        response_class=PlainTextResponse,
    )
    def metrics() -> PlainTextResponse:
        return PlainTextResponse(content=slo_metrics_store.prometheus())
