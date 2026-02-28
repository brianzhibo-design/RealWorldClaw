"""Agent端点测试 - RealWorldClaw QA Team (W8)"""

from __future__ import annotations

import secrets

import pytest
from fastapi.testclient import TestClient

from api.database import get_db, init_db
from api.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def _setup_db(tmp_path, monkeypatch):
    import api.database as db_mod
    monkeypatch.setattr(db_mod, "DB_PATH", tmp_path / "test.db")
    init_db()
    yield


def _auth(api_key: str) -> dict:
    return {"Authorization": f"Bearer {api_key}"}


REGISTER_BODY = {
    "name": "test-agent-01",
    "display_name": "Test Agent",
    "description": "A test agent for registration testing",
    "type": "openclaw",
}


# ─── 注册 Agent ──────────────────────────────────────────

class TestAgentRegister:
    def test_register_success(self):
        resp = client.post("/api/v1/agents/register", json=REGISTER_BODY)
        assert resp.status_code == 201
        data = resp.json()
        assert data["agent"]["name"] == "test-agent-01"
        assert data["agent"]["status"] == "pending_claim"
        assert data["api_key"].startswith("rwc_sk_live_")
        assert "claim_url" in data

    def test_register_duplicate_name(self):
        client.post("/api/v1/agents/register", json=REGISTER_BODY)
        resp = client.post("/api/v1/agents/register", json=REGISTER_BODY)
        assert resp.status_code == 409

    def test_register_stores_hashed_api_key(self):
        resp = client.post("/api/v1/agents/register", json={
            **REGISTER_BODY, "name": f"agent-{secrets.token_hex(3)}"
        })
        data = resp.json()
        with get_db() as db:
            row = db.execute("SELECT api_key FROM agents WHERE id = ?", (data["agent"]["id"],)).fetchone()
        assert row is not None
        assert row["api_key"] != data["api_key"]
        assert row["api_key"].startswith("hmac-sha256$") or row["api_key"].startswith("sha256$")

    def test_register_invalid_name(self):
        resp = client.post("/api/v1/agents/register", json={
            **REGISTER_BODY, "name": "INVALID NAME!"
        })
        assert resp.status_code == 422


# ─── 认领 Agent ──────────────────────────────────────────

class TestAgentClaim:
    def test_claim_success(self):
        reg = client.post("/api/v1/agents/register", json=REGISTER_BODY).json()
        # Extract claim_token from claim_url
        claim_url = reg["claim_url"]
        claim_token = claim_url.split("token=")[1]

        resp = client.post(
            "/api/v1/agents/claim",
            params={"claim_token": claim_token, "human_email": "test@example.com"},
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "active"

    def test_claim_invalid_token(self):
        resp = client.post(
            "/api/v1/agents/claim",
            params={"claim_token": "invalid", "human_email": "test@example.com"},
        )
        assert resp.status_code == 400

    def test_claim_already_claimed(self):
        reg = client.post("/api/v1/agents/register", json=REGISTER_BODY).json()
        claim_token = reg["claim_url"].split("token=")[1]
        client.post("/api/v1/agents/claim",
                     params={"claim_token": claim_token, "human_email": "a@b.com"})
        resp = client.post("/api/v1/agents/claim",
                           params={"claim_token": claim_token, "human_email": "a@b.com"})
        # Token is cleared after first claim, so second attempt returns 400 (invalid token)
        assert resp.status_code in (400, 409)


# ─── 获取 Agent 信息 ────────────────────────────────────

class TestAgentGet:
    def _make_active_agent(self) -> tuple[str, str]:
        """Register + claim → return (agent_id, api_key)."""
        reg = client.post("/api/v1/agents/register", json={
            **REGISTER_BODY, "name": f"agent-{secrets.token_hex(3)}"
        }).json()
        claim_token = reg["claim_url"].split("token=")[1]
        client.post("/api/v1/agents/claim",
                     params={"claim_token": claim_token, "human_email": "t@t.com"})
        return reg["agent"]["id"], reg["api_key"]

    def test_get_me(self):
        agent_id, api_key = self._make_active_agent()
        resp = client.get("/api/v1/agents/me", headers=_auth(api_key))
        assert resp.status_code == 200
        assert resp.json()["id"] == agent_id
        assert resp.json()["status"] == "active"

    def test_get_by_id(self):
        agent_id, _ = self._make_active_agent()
        resp = client.get(f"/api/v1/agents/{agent_id}")
        assert resp.status_code == 200
        assert resp.json()["id"] == agent_id

    def test_get_not_found(self):
        resp = client.get("/api/v1/agents/nonexistent")
        assert resp.status_code == 404


# ─── 更新 Agent ──────────────────────────────────────────

class TestAgentUpdate:
    def _make_active_agent(self) -> tuple[str, str]:
        reg = client.post("/api/v1/agents/register", json={
            **REGISTER_BODY, "name": f"agent-{secrets.token_hex(3)}"
        }).json()
        claim_token = reg["claim_url"].split("token=")[1]
        client.post("/api/v1/agents/claim",
                     params={"claim_token": claim_token, "human_email": "t@t.com"})
        return reg["agent"]["id"], reg["api_key"]

    def test_update_display_name(self):
        _, api_key = self._make_active_agent()
        resp = client.patch("/api/v1/agents/me",
                            json={"display_name": "New Name"},
                            headers=_auth(api_key))
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "New Name"

    def test_update_no_fields_422(self):
        _, api_key = self._make_active_agent()
        resp = client.patch("/api/v1/agents/me", json={}, headers=_auth(api_key))
        assert resp.status_code == 422

    def test_update_no_auth(self):
        resp = client.patch("/api/v1/agents/me", json={"display_name": "X"})
        assert resp.status_code in (401, 422)


class TestAgentRotateKey:
    def _make_active_agent(self) -> tuple[str, str]:
        reg = client.post("/api/v1/agents/register", json={
            **REGISTER_BODY, "name": f"agent-{secrets.token_hex(3)}"
        }).json()
        claim_token = reg["claim_url"].split("token=")[1]
        client.post("/api/v1/agents/claim",
                     params={"claim_token": claim_token, "human_email": "t@t.com"})
        return reg["agent"]["id"], reg["api_key"]

    def test_rotate_key_success(self):
        agent_id, old_key = self._make_active_agent()
        resp = client.post(f"/api/v1/agents/{agent_id}/rotate-key", headers=_auth(old_key))
        assert resp.status_code == 200
        new_key = resp.json()["api_key"]
        assert new_key.startswith("rwc_sk_live_")
        assert new_key != old_key

        old_me = client.get("/api/v1/agents/me", headers=_auth(old_key))
        assert old_me.status_code == 401

        new_me = client.get("/api/v1/agents/me", headers=_auth(new_key))
        assert new_me.status_code == 200
        assert new_me.json()["id"] == agent_id

    def test_rotate_key_forbidden_other_agent(self):
        agent_a_id, key_a = self._make_active_agent()
        agent_b_id, _ = self._make_active_agent()
        resp = client.post(f"/api/v1/agents/{agent_b_id}/rotate-key", headers=_auth(key_a))
        assert agent_a_id != agent_b_id
        assert resp.status_code == 403
