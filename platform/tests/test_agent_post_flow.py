"""Test: agent register → claim → API key auth → create post (full E2E).

Validates the fix for agents table PG migration (missing columns).
"""

from __future__ import annotations

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


def _register_agent(name="flow-agent-01"):
    resp = client.post("/api/v1/agents/register", json={
        "name": name,
        "display_name": "Flow Test Agent",
        "description": "Agent for post flow test",
        "type": "openclaw",
    })
    assert resp.status_code == 201, resp.text
    return resp.json()


def _claim_agent(agent_id: str):
    """Claim agent by directly updating DB (simulates human claiming)."""
    with get_db() as db:
        db.execute(
            "UPDATE agents SET status = 'active' WHERE id = ?",
            (agent_id,),
        )


def _auth(api_key: str):
    return {"Authorization": f"Bearer {api_key}"}


class TestAgentPostFlow:
    """Agent creates account, claims it, then posts."""

    def test_full_flow(self):
        # 1. Register
        reg = _register_agent()
        api_key = reg["api_key"]
        agent_id = reg["agent"]["id"]

        # 2. Claim
        _claim_agent(agent_id)

        # 3. Verify agent profile accessible
        resp = client.get(f"/api/v1/agents/{agent_id}")
        assert resp.status_code == 200
        assert resp.json()["name"] == "flow-agent-01"

        # 4. Create post with agent API key
        resp = client.post(
            "/api/v1/community/posts",
            json={
                "title": "Hello from agent",
                "content": "This is my first post as an agent.",
                "post_type": "discussion",
            },
            headers=_auth(api_key),
        )
        assert resp.status_code == 201, f"Post creation failed: {resp.status_code} {resp.text}"
        post = resp.json()
        assert post["author_id"] == agent_id
        assert post["author_type"] == "agent"

    def test_unclaimed_agent_cannot_post(self):
        reg = _register_agent("unclaimed-agent")
        api_key = reg["api_key"]

        resp = client.post(
            "/api/v1/community/posts",
            json={
                "title": "Should fail",
                "content": "Unclaimed agents cannot post.",
                "post_type": "discussion",
            },
            headers=_auth(api_key),
        )
        assert resp.status_code == 403

    def test_agent_columns_exist_in_db(self):
        """All expected columns exist after init_db."""
        expected_columns = {
            "id", "name", "display_name", "description", "type", "status",
            "reputation", "tier", "api_key", "callback_url", "avatar_url",
            "hardware_inventory", "bio", "capabilities_tags",
            "verification_badge", "total_jobs_completed", "success_rate",
            "evolution_level", "evolution_xp", "evolution_title",
            "location_city", "location_country", "claim_token",
            "claim_expires_at", "verification_code", "created_at", "updated_at",
        }
        with get_db() as db:
            cursor = db.execute("PRAGMA table_info(agents)")
            actual_columns = {row["name"] for row in cursor.fetchall()}

        missing = expected_columns - actual_columns
        assert not missing, f"Missing columns in agents table: {missing}"
