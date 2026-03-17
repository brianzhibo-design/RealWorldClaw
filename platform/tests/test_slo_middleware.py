from __future__ import annotations

import pytest

from api.main import app
from api.middleware.slo import slo_metrics_store


def _reset_slo_store() -> None:
    with slo_metrics_store.lock:
        slo_metrics_store.total_requests = 0
        slo_metrics_store.error_5xx_count = 0
        slo_metrics_store.latency_ms_samples.clear()


def test_slo_health_endpoint_returns_metrics(client):
    _reset_slo_store()

    client.get("/api/v1/health")
    client.get("/api/v1/health/detailed")

    resp = client.get("/api/v1/health/slo")
    assert resp.status_code == 200

    payload = resp.json()
    # current /health/slo request is recorded after response; only prior requests appear
    assert payload["current"]["total_requests"] >= 2
    assert "latency_p99_ms" in payload["current"]
    assert "error_5xx_rate" in payload["current"]


def test_slo_middleware_tracks_5xx_errors(client):
    _reset_slo_store()

    if not any(r.path == "/api/v1/__test/slo/error" for r in app.router.routes):
        @app.get("/api/v1/__test/slo/error")
        def _slo_error_route():
            raise RuntimeError("slo test error")

    with pytest.raises(RuntimeError):
        client.get("/api/v1/__test/slo/error")

    slo = client.get("/api/v1/health/slo").json()
    assert slo["current"]["error_5xx_count"] >= 1
    assert slo["current"]["error_5xx_rate"] > 0


def test_metrics_endpoint_prometheus_format(client):
    _reset_slo_store()

    client.get("/api/v1/health")

    resp = client.get("/metrics")
    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("text/plain")

    body = resp.text
    assert "rwc_api_requests_total" in body
    assert "rwc_api_errors_5xx_total" in body


def test_upload_requests_are_excluded_from_latency_samples(client):
    _reset_slo_store()

    client.post(
        "/api/v1/files/upload",
        files={"file": ("x.txt", b"hello", "text/plain")},
    )

    slo = client.get("/api/v1/health/slo").json()
    # /health/slo request is not reflected in this snapshot yet
    assert slo["current"]["total_requests"] >= 1
    assert slo["current"]["latency_samples"] == 0
