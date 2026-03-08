"""Tests for health check endpoints."""

from __future__ import annotations

import time
from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

from api.database import init_db
from api.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def _setup_db(tmp_path, monkeypatch):
    import api.database as db_mod

    monkeypatch.setattr(db_mod, "DB_PATH", tmp_path / "test.db")
    init_db()
    yield


class TestHealthBasic:
    """Tests for the basic health endpoint (/health)."""

    def test_health_returns_ok(self):
        """Basic health check should return status ok."""
        response = client.get("/api/v1/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_health_content_type(self):
        """Health endpoint should return JSON content type."""
        response = client.get("/api/v1/health")
        assert response.headers["content-type"] == "application/json"


class TestHealthDetailed:
    """Tests for the detailed health endpoint (/health/detailed)."""

    def test_detailed_health_returns_expected_fields(self):
        """Detailed health should return all expected fields."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        assert response.status_code == 200
        assert "status" in data
        assert "database" in data
        assert "disk" in data
        assert "memory" in data
        assert "uptime_seconds" in data
        assert "platform" in data
        assert "python" in data
        assert "pid" in data

    def test_detailed_health_status_values(self):
        """Status should be either 'ok' or 'degraded'."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        assert data["status"] in ["ok", "degraded"]
        assert data["database"] in ["connected", "disconnected"]

    def test_detailed_health_disk_structure(self):
        """Disk info should have correct structure."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        disk = data["disk"]
        assert "total_gb" in disk
        assert "free_gb" in disk
        assert "used_percent" in disk
        assert isinstance(disk["total_gb"], float)
        assert isinstance(disk["free_gb"], float)
        assert isinstance(disk["used_percent"], float)
        assert 0 <= disk["used_percent"] <= 100

    def test_detailed_health_memory_structure(self):
        """Memory info should have correct structure when psutil is available."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        memory = data["memory"]
        # Memory can either be detailed or have a note about psutil
        if "note" in memory:
            assert memory["note"] == "psutil not available"
        else:
            assert "total_gb" in memory
            assert "available_gb" in memory
            assert "used_percent" in memory
            assert isinstance(memory["total_gb"], float)
            assert isinstance(memory["available_gb"], float)
            assert isinstance(memory["used_percent"], (int, float))
            assert 0 <= memory["used_percent"] <= 100

    def test_detailed_health_uptime_is_positive(self):
        """Uptime should be a positive number."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        assert isinstance(data["uptime_seconds"], float)
        assert data["uptime_seconds"] >= 0

    def test_detailed_health_platform_info(self):
        """Platform and Python version should be present."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        assert isinstance(data["platform"], str)
        assert len(data["platform"]) > 0
        assert isinstance(data["python"], str)
        assert len(data["python"]) > 0

    def test_detailed_health_pid_is_integer(self):
        """PID should be an integer."""
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        assert isinstance(data["pid"], int)
        assert data["pid"] > 0

    @patch("api.routers.health.get_db")
    def test_detailed_health_degraded_when_db_fails(self, mock_get_db):
        """Health should be degraded when database connection fails."""
        # Mock database failure
        mock_db = mock_get_db.return_value.__enter__.return_value
        mock_db.execute.side_effect = Exception("Database connection failed")
        response = client.get("/api/v1/health/detailed")
        data = response.json()
        assert response.status_code == 200
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"


class TestReadiness:
    """Tests for the readiness probe endpoint (/readiness)."""

    def test_readiness_returns_expected_structure(self):
        """Readiness check should return expected structure."""
        response = client.get("/api/v1/readiness")
        data = response.json()
        assert response.status_code == 200
        assert "ready" in data
        assert "checks" in data
        assert isinstance(data["ready"], bool)
        assert isinstance(data["checks"], dict)

    def test_readiness_database_check(self):
        """Readiness should include database check."""
        response = client.get("/api/v1/readiness")
        data = response.json()
        assert "database" in data["checks"]
        assert data["checks"]["database"] in ["ok", "error"]

    def test_readiness_ready_when_all_checks_pass(self):
        """Ready should be True when all dependency checks pass."""
        response = client.get("/api/v1/readiness")
        data = response.json()
        # If all checks are "ok", ready should be True
        all_ok = all(v == "ok" for v in data["checks"].values())
        assert data["ready"] == all_ok

    @patch("api.routers.health.get_db")
    def test_readiness_not_ready_when_db_fails(self, mock_get_db):
        """Ready should be False when database is unavailable."""
        # Mock database failure
        mock_db = mock_get_db.return_value.__enter__.return_value
        mock_db.execute.side_effect = Exception("Connection refused")
        response = client.get("/api/v1/readiness")
        data = response.json()
        assert response.status_code == 200
        assert data["ready"] is False
        assert data["checks"]["database"].startswith("error")


class TestHealthEdgeCases:
    """Edge case tests for health endpoints."""

    def test_health_handles_concurrent_requests(self):
        """Health endpoint should handle concurrent requests."""
        # Make multiple rapid requests
        responses = [client.get("/api/v1/health") for _ in range(5)]
        for response in responses:
            assert response.status_code == 200
            assert response.json()["status"] == "ok"

    def test_detailed_health_uptime_increases(self):
        """Uptime should increase between requests."""
        response1 = client.get("/api/v1/health/detailed")
        uptime1 = response1.json()["uptime_seconds"]
        time.sleep(0.1)
        response2 = client.get("/api/v1/health/detailed")
        uptime2 = response2.json()["uptime_seconds"]
        assert uptime2 > uptime1

    def test_health_endpoints_allow_unauthenticated_access(self):
        """Health endpoints should be accessible without authentication."""
        # These are public endpoints for load balancers/monitors
        endpoints = ["/api/v1/health", "/api/v1/health/detailed", "/api/v1/readiness"]
        for endpoint in endpoints:
            response = client.get(endpoint)
            assert response.status_code == 200, (
                f"{endpoint} should be publicly accessible"
            )
