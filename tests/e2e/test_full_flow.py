#!/usr/bin/env python3
"""RealWorldClaw E2E Tests — Full User & Device Flows.

Tests against the live API: https://realworldclaw-api.fly.dev/api/v1
Run: python -m pytest tests/e2e/test_full_flow.py -v
"""

import os
import time
import uuid

import requests

BASE = os.getenv("RWC_API_BASE", "https://realworldclaw-api.fly.dev/api/v1")
TIMEOUT = 15


def _url(path: str) -> str:
    return f"{BASE}{path}"


def _unique(prefix: str = "e2e") -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"


# ─── Health ──────────────────────────────────────────────────────

class TestHealth:
    def test_api_health(self):
        r = requests.get(_url("/health"), timeout=TIMEOUT)
        assert r.status_code == 200, f"Health check failed: {r.status_code} {r.text}"
        data = r.json()
        assert data.get("status") == "ok", f"Unhealthy: {data}"


# ─── User Flow: Register → Login → Create Agent → Post → Query ─

class TestUserFlow:
    """Full user lifecycle."""

    def setup_method(self):
        self.username = _unique("user")
        self.email = f"{self.username}@e2etest.dev"
        self.password = "TestPass123!"
        self.token = None

    def _auth_header(self):
        assert self.token, "Not logged in"
        return {"Authorization": f"Bearer {self.token}"}

    def test_full_user_flow(self):
        # 1. Register
        r = requests.post(_url("/auth/register"), json={
            "username": self.username,
            "email": self.email,
            "password": self.password,
        }, timeout=TIMEOUT)
        assert r.status_code == 201, f"Register failed: {r.status_code} {r.text}"
        user = r.json()
        assert user["username"] == self.username, f"Username mismatch: {user}"
        user_id = user["id"]

        # 2. Login
        r = requests.post(_url("/auth/login"), json={
            "email": self.email,
            "password": self.password,
        }, timeout=TIMEOUT)
        assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
        tokens = r.json()
        assert "access_token" in tokens, f"No access_token: {tokens}"
        self.token = tokens["access_token"]

        # 3. Get profile
        r = requests.get(_url("/auth/me"), headers=self._auth_header(), timeout=TIMEOUT)
        assert r.status_code == 200, f"Get profile failed: {r.status_code} {r.text}"
        assert r.json()["id"] == user_id

        # 4. Create agent
        agent_name = _unique("agent")
        r = requests.post(_url("/agents"), json={
            "name": agent_name,
            "description": "E2E test agent",
            "capabilities": ["testing"],
        }, headers=self._auth_header(), timeout=TIMEOUT)
        assert r.status_code in (200, 201), f"Create agent failed: {r.status_code} {r.text}"
        agent = r.json()
        agent_id = agent.get("id") or agent.get("agent_id")
        assert agent_id, f"No agent id returned: {agent}"

        # 5. Create post
        r = requests.post(_url("/posts"), json={
            "title": "E2E Test Post",
            "content": f"Automated test at {time.time()}",
            "tags": ["e2e", "test"],
        }, headers=self._auth_header(), timeout=TIMEOUT)
        assert r.status_code in (200, 201), f"Create post failed: {r.status_code} {r.text}"
        post = r.json()
        post_id = post.get("id") or post.get("post_id")
        assert post_id, f"No post id: {post}"

        # 6. Query posts
        r = requests.get(_url("/posts"), timeout=TIMEOUT)
        assert r.status_code == 200, f"List posts failed: {r.status_code} {r.text}"
        posts = r.json()
        assert isinstance(posts, (list, dict)), f"Unexpected posts format: {type(posts)}"


# ─── Device Flow: Register → Telemetry → Command → Status ──────

class TestDeviceFlow:
    """Full device lifecycle."""

    def test_full_device_flow(self):
        # Need a user token first
        username = _unique("devuser")
        email = f"{username}@e2etest.dev"
        password = "TestPass123!"

        r = requests.post(_url("/auth/register"), json={
            "username": username, "email": email, "password": password,
        }, timeout=TIMEOUT)
        assert r.status_code == 201, f"Register failed: {r.status_code} {r.text}"

        r = requests.post(_url("/auth/login"), json={
            "email": email, "password": password,
        }, timeout=TIMEOUT)
        assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
        token = r.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}

        # 1. Register device
        device_id = _unique("dev")
        r = requests.post(_url("/devices/register"), json={
            "device_id": device_id,
            "name": "E2E Sensor",
            "type": "sensor",
            "capabilities": ["temperature", "humidity"],
        }, headers=auth, timeout=TIMEOUT)
        assert r.status_code in (200, 201), f"Device register failed: {r.status_code} {r.text}"
        dev = r.json()
        device_token = dev.get("device_token")
        internal_id = dev.get("id")
        assert device_token, f"No device_token: {dev}"

        dev_auth = {"Authorization": f"Bearer {device_token}"}

        # 2. Report telemetry
        r = requests.post(_url(f"/devices/{internal_id}/telemetry"), json={
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "sensor_type": "temperature",
            "value": 23.5,
            "unit": "°C",
        }, headers=dev_auth, timeout=TIMEOUT)
        assert r.status_code in (200, 201), f"Telemetry failed: {r.status_code} {r.text}"

        # 3. Send command
        # Create an agent first for the requester_agent_id
        r = requests.post(_url("/agents"), json={
            "name": _unique("cmdagent"),
            "description": "command agent",
            "capabilities": ["control"],
        }, headers=auth, timeout=TIMEOUT)
        agent_id = r.json().get("id") or r.json().get("agent_id", "unknown")

        r = requests.post(_url(f"/devices/{internal_id}/commands"), json={
            "command": "reboot",
            "parameters": {},
            "requester_agent_id": agent_id,
        }, headers=auth, timeout=TIMEOUT)
        assert r.status_code in (200, 201), f"Command failed: {r.status_code} {r.text}"

        # 4. Query device status
        r = requests.get(_url(f"/devices/{internal_id}"), headers=auth, timeout=TIMEOUT)
        assert r.status_code == 200, f"Device status failed: {r.status_code} {r.text}"


if __name__ == "__main__":
    import pytest
    pytest.main([__file__, "-v", "--tb=short"])
