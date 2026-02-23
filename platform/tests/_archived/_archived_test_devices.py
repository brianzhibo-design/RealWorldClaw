"""Tests for hardware device API - RealWorldClaw Team

Covers: register → telemetry → command → status full flow.
"""
from __future__ import annotations

from datetime import datetime, timezone

API = "/api/v1"


class TestDeviceRegistration:
    def test_register_device(self, client, admin_headers):
        r = client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "esp32-001",
            "name": "温湿度传感器-1号",
            "type": "sensor",
            "capabilities": ["temperature", "humidity"],
        })
        assert r.status_code == 200
        data = r.json()
        assert data["device_id"] == "esp32-001"
        assert data["device_token"].startswith("rwc_dev_")

    def test_register_duplicate_device(self, client, admin_headers):
        payload = {"device_id": "dup-001", "name": "Dup", "type": "sensor", "capabilities": []}
        r1 = client.post(f"{API}/devices/register", headers=admin_headers, json=payload)
        assert r1.status_code == 200
        r2 = client.post(f"{API}/devices/register", headers=admin_headers, json=payload)
        assert r2.status_code == 409

    def test_register_requires_auth(self, client):
        r = client.post(f"{API}/devices/register", json={
            "device_id": "x", "name": "x", "type": "x", "capabilities": [],
        })
        assert r.status_code in (401, 422)


class TestTelemetry:
    def _register(self, client, admin_headers, device_id="tel-dev-001"):
        r = client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": device_id, "name": "Tele Sensor", "type": "sensor", "capabilities": ["temperature"],
        })
        return r.json()["device_token"]

    def test_ingest_telemetry(self, client, admin_headers):
        token = self._register(client, admin_headers)
        r = client.post(f"{API}/devices/tel-dev-001/telemetry",
                        headers={"Authorization": f"Bearer {token}"},
                        json={
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "sensor_type": "temperature",
                            "value": 23.5,
                            "unit": "°C",
                        })
        assert r.status_code == 201
        assert r.json()["status"] == "accepted"

    def test_telemetry_wrong_token(self, client, admin_headers):
        self._register(client, admin_headers)
        r = client.post(f"{API}/devices/tel-dev-001/telemetry",
                        headers={"Authorization": "Bearer bad-token"},
                        json={
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "sensor_type": "temperature",
                            "value": 20.0,
                            "unit": "°C",
                        })
        assert r.status_code == 401


class TestCommand:
    def test_send_command(self, client, admin_headers):
        client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "relay-001", "name": "Relay", "type": "relay", "capabilities": ["relay"],
        })
        r = client.post(f"{API}/devices/relay-001/command", headers=admin_headers, json={
            "command": "relay_on",
            "parameters": {"channel": 1},
            "requester_agent_id": "agent-test-001",
        })
        assert r.status_code == 200
        assert r.json()["status"] == "pending"

    def test_invalid_command(self, client, admin_headers):
        client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "relay-002", "name": "Relay2", "type": "relay", "capabilities": [],
        })
        r = client.post(f"{API}/devices/relay-002/command", headers=admin_headers, json={
            "command": "self_destruct",
            "parameters": {},
            "requester_agent_id": "agent-test-001",
        })
        assert r.status_code == 400


class TestDeviceStatus:
    def test_full_flow(self, client, admin_headers):
        """Register → telemetry → command → status check (full e2e)."""
        # 1. Register
        r = client.post(f"{API}/devices/register", headers=admin_headers, json={
            "device_id": "flow-001", "name": "Full Flow Device", "type": "sensor",
            "capabilities": ["temperature", "relay"],
        })
        assert r.status_code == 200
        dev_token = r.json()["device_token"]

        # 2. Send telemetry
        for val in [22.1, 22.5, 23.0]:
            r = client.post(f"{API}/devices/flow-001/telemetry",
                            headers={"Authorization": f"Bearer {dev_token}"},
                            json={
                                "timestamp": datetime.now(timezone.utc).isoformat(),
                                "sensor_type": "temperature",
                                "value": val,
                                "unit": "°C",
                            })
            assert r.status_code == 201

        # 3. Send command
        r = client.post(f"{API}/devices/flow-001/command", headers=admin_headers, json={
            "command": "relay_on",
            "parameters": {"channel": 0},
            "requester_agent_id": "agent-flow",
        })
        assert r.status_code == 200

        # 4. Query status
        r = client.get(f"{API}/devices/flow-001/status", headers=admin_headers)
        assert r.status_code == 200
        status = r.json()
        assert status["device_id"] == "flow-001"
        assert status["health"] == "healthy"
        assert len(status["recent_telemetry"]) == 3
        assert len(status["pending_commands"]) == 1
        assert status["capabilities"] == ["temperature", "relay"]

    def test_device_not_found(self, client, admin_headers):
        r = client.get(f"{API}/devices/nonexistent/status", headers=admin_headers)
        assert r.status_code == 404
