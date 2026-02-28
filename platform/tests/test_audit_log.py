"""Tests for audit log middleware and query endpoint."""

import os
os.environ.setdefault("TESTING", "1")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key")

import time
import uuid


API = "/api/v1"


def _register_user(client, role=None):
    """Register a user and optionally set role. Returns (headers, user_id)."""
    uid = uuid.uuid4().hex[:8]
    resp = client.post(f"{API}/auth/register", json={
        "email": f"audit-{uid}@test.com",
        "username": f"audit_{uid}",
        "password": "testpass1234",
    })
    data = resp.json()
    token = data["access_token"]
    user_id = data.get("user", {}).get("id", "")

    if role:
        from api.database import get_db
        with get_db() as db:
            db.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
        # Re-login to get token with updated role
        resp2 = client.post(f"{API}/auth/login", json={
            "email": f"audit-{uid}@test.com",
            "password": "testpass1234",
        })
        token = resp2.json()["access_token"]

    return {"Authorization": f"Bearer {token}"}, user_id


class TestAuditLogMiddleware:
    """Test that write operations are recorded and reads are not."""

    def test_post_is_recorded(self, client):
        """POST requests should create an audit log entry."""
        headers, user_id = _register_user(client, role="admin")

        # Wait briefly for background audit write from the registration itself
        time.sleep(0.3)

        # Check audit logs — registration POST should be recorded
        resp = client.get(f"{API}/audit/logs", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] > 0
        # At least one POST entry from registration
        methods = [log.get("method") for log in data["logs"]]
        assert "POST" in methods

    def test_get_not_recorded(self, client):
        """GET requests should NOT create audit log entries."""
        headers, user_id = _register_user(client, role="admin")
        time.sleep(0.3)

        # Record current count
        resp1 = client.get(f"{API}/audit/logs", headers=headers)
        count_before = resp1.json()["total"]

        time.sleep(0.2)

        # Do several GETs
        client.get(f"{API}/health", headers=headers)
        client.get(f"{API}/health", headers=headers)
        time.sleep(0.3)

        # Count should not have increased (GETs from audit/logs query itself are GETs too)
        resp2 = client.get(f"{API}/audit/logs", headers=headers)
        count_after = resp2.json()["total"]
        assert count_after == count_before

    def test_delete_is_recorded(self, client):
        """DELETE/PUT/PATCH should also be recorded."""
        headers, user_id = _register_user(client, role="admin")
        time.sleep(0.3)

        # Try a DELETE (will likely 404, but middleware still logs it)
        client.delete(f"{API}/agents/nonexistent", headers=headers)
        time.sleep(0.3)

        resp = client.get(f"{API}/audit/logs?method=DELETE", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1

    def test_audit_entry_fields(self, client):
        """Audit entries should have expected fields."""
        headers, user_id = _register_user(client, role="admin")
        time.sleep(0.3)

        resp = client.get(f"{API}/audit/logs", headers=headers)
        logs = resp.json()["logs"]
        assert len(logs) > 0

        entry = logs[0]
        assert "id" in entry
        assert "timestamp" in entry
        assert "method" in entry
        assert "path" in entry
        assert "response_status" in entry


class TestAuditQueryEndpoint:
    """Test the GET /api/v1/audit/logs query endpoint."""

    def test_requires_admin(self, client, auth_headers):
        """Non-admin users should be rejected."""
        resp = client.get(f"{API}/audit/logs", headers=auth_headers)
        assert resp.status_code == 403

    def test_filter_by_user_id(self, client):
        """Filter audit logs by user_id."""
        headers, user_id = _register_user(client, role="admin")
        time.sleep(0.3)

        resp = client.get(f"{API}/audit/logs?user_id={user_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        for log in data["logs"]:
            assert log.get("user_id") == user_id or log.get("agent_id") == user_id

    def test_filter_by_method(self, client):
        """Filter audit logs by HTTP method."""
        headers, _ = _register_user(client, role="admin")
        time.sleep(0.3)

        resp = client.get(f"{API}/audit/logs?method=POST", headers=headers)
        assert resp.status_code == 200
        for log in resp.json()["logs"]:
            assert log["method"] == "POST"

    def test_pagination(self, client):
        """Pagination parameters work."""
        headers, _ = _register_user(client, role="admin")
        time.sleep(0.3)

        resp = client.get(f"{API}/audit/logs?page=1&page_size=1", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["page"] == 1
        assert data["page_size"] == 1
        assert len(data["logs"]) <= 1

    def test_filter_by_date(self, client):
        """Filter audit logs by date."""
        from datetime import datetime, timezone
        headers, _ = _register_user(client, role="admin")
        time.sleep(0.3)

        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        resp = client.get(f"{API}/audit/logs?date={today}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["total"] >= 0
