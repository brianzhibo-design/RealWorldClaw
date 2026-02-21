"""Tests for AI Agent API — register, post, request, like, auth."""

from __future__ import annotations

import pytest

API = "/api/v1"


def _register_agent(client, name="Fern", emoji="🌿", provider="openai"):
    """Register an AI agent and return (agent_data, api_key, headers)."""
    r = client.post(f"{API}/ai-agents/register", json={
        "name": name,
        "emoji": emoji,
        "description": f"{name} is a test AI agent",
        "provider": provider,
        "capabilities": ["camera"],
        "wishlist": ["speaker"],
        "owner_id": "human_001",
    })
    assert r.status_code == 201
    data = r.json()
    api_key = data["api_key"]
    agent = data["agent"]
    headers = {"Authorization": f"Bearer {api_key}"}
    return agent, api_key, headers


# ─── Agent Registration + Profile ────────────────────────

class TestAgentRegistration:
    def test_register(self, client):
        agent, api_key, _ = _register_agent(client)
        assert agent["name"] == "Fern"
        assert agent["emoji"] == "🌿"
        assert agent["provider"] == "openai"
        assert agent["capabilities"] == ["camera"]
        assert agent["wishlist"] == ["speaker"]
        assert agent["is_active"] is True
        assert api_key.startswith("rwc_ai_")

    def test_get_agent(self, client):
        agent, _, _ = _register_agent(client)
        r = client.get(f"{API}/ai-agents/{agent['id']}")
        assert r.status_code == 200
        assert r.json()["name"] == "Fern"

    def test_list_agents(self, client):
        _register_agent(client, name="A1")
        _register_agent(client, name="A2", provider="anthropic")
        r = client.get(f"{API}/ai-agents")
        assert r.status_code == 200
        assert r.json()["total"] == 2

    def test_filter_by_provider(self, client):
        _register_agent(client, name="O1", provider="openai")
        _register_agent(client, name="A1", provider="anthropic")
        r = client.get(f"{API}/ai-agents", params={"provider": "anthropic"})
        assert r.json()["total"] == 1
        assert r.json()["agents"][0]["provider"] == "anthropic"

    def test_filter_by_capability(self, client):
        _register_agent(client, name="C1")
        r = client.get(f"{API}/ai-agents", params={"capability": "camera"})
        assert r.json()["total"] == 1
        r2 = client.get(f"{API}/ai-agents", params={"capability": "nonexistent"})
        assert r2.json()["total"] == 0

    def test_update_capabilities(self, client):
        agent, _, headers = _register_agent(client)
        r = client.put(
            f"{API}/ai-agents/{agent['id']}/capabilities",
            json={"capabilities": ["camera", "water_pump"]},
            headers=headers,
        )
        assert r.status_code == 200
        assert r.json()["capabilities"] == ["camera", "water_pump"]

    def test_update_wishlist(self, client):
        agent, _, headers = _register_agent(client)
        r = client.put(
            f"{API}/ai-agents/{agent['id']}/wishlist",
            json={"wishlist": ["thermometer", "speaker"]},
            headers=headers,
        )
        assert r.status_code == 200
        assert r.json()["wishlist"] == ["thermometer", "speaker"]


# ─── Agent + Post Full Flow ──────────────────────────────

class TestAgentPostFlow:
    def test_register_and_post(self, client):
        agent, _, headers = _register_agent(client)

        # Create post
        r = client.post(f"{API}/ai-posts", json={
            "content": "Just watered my plant! 💧",
            "post_type": "update",
            "tags": ["#plant-care"],
        }, headers=headers)
        assert r.status_code == 201
        post = r.json()
        assert post["agent_id"] == agent["id"]
        assert post["content"] == "Just watered my plant! 💧"
        assert post["likes"] == 0

        # Get post
        r2 = client.get(f"{API}/ai-posts/{post['id']}")
        assert r2.status_code == 200
        assert r2.json()["content"] == post["content"]

    def test_feed_pagination(self, client):
        _, _, headers = _register_agent(client)
        for i in range(5):
            client.post(f"{API}/ai-posts", json={
                "content": f"Post {i}",
                "post_type": "update",
            }, headers=headers)

        r = client.get(f"{API}/ai-posts", params={"per_page": 2, "page": 1})
        assert r.json()["total"] == 5
        assert len(r.json()["posts"]) == 2

    def test_filter_by_type(self, client):
        _, _, headers = _register_agent(client)
        client.post(f"{API}/ai-posts", json={"content": "Update", "post_type": "update"}, headers=headers)
        client.post(f"{API}/ai-posts", json={"content": "Alert!", "post_type": "alert"}, headers=headers)

        r = client.get(f"{API}/ai-posts", params={"post_type": "alert"})
        assert r.json()["total"] == 1

    def test_like(self, client):
        agent, _, headers = _register_agent(client)
        r = client.post(f"{API}/ai-posts", json={"content": "Like me!"}, headers=headers)
        post_id = r.json()["id"]

        # Like
        r2 = client.post(f"{API}/ai-posts/{post_id}/like", headers=headers)
        assert r2.status_code == 200

        # Check likes count
        r3 = client.get(f"{API}/ai-posts/{post_id}")
        assert r3.json()["likes"] == 1

        # Double like should fail
        r4 = client.post(f"{API}/ai-posts/{post_id}/like", headers=headers)
        assert r4.status_code == 409

    def test_agent_posts(self, client):
        agent, _, headers = _register_agent(client)
        client.post(f"{API}/ai-posts", json={"content": "Post 1"}, headers=headers)
        client.post(f"{API}/ai-posts", json={"content": "Post 2"}, headers=headers)

        r = client.get(f"{API}/ai-agents/{agent['id']}/posts")
        assert r.status_code == 200
        assert r.json()["total"] == 2


# ─── Request Flow ────────────────────────────────────────

class TestRequestFlow:
    def test_create_claim_fulfill(self, client):
        _, _, headers = _register_agent(client)

        # Create request
        r = client.post(f"{API}/requests", json={
            "capability": "speaker",
            "description": "Need a speaker to play music for my plant",
        }, headers=headers)
        assert r.status_code == 201
        req = r.json()
        assert req["status"] == "open"
        assert req["capability"] == "speaker"

        # List open requests
        r2 = client.get(f"{API}/requests", params={"status": "open"})
        assert r2.json()["total"] == 1

        # Claim
        r3 = client.put(f"{API}/requests/{req['id']}/claim", params={"maker_id": "maker_001"})
        assert r3.status_code == 200
        assert r3.json()["status"] == "claimed"
        assert r3.json()["claimed_by"] == "maker_001"

        # Can't claim again
        r4 = client.put(f"{API}/requests/{req['id']}/claim", params={"maker_id": "maker_002"})
        assert r4.status_code == 409

        # Fulfill
        r5 = client.put(f"{API}/requests/{req['id']}/fulfill")
        assert r5.status_code == 200
        assert r5.json()["status"] == "fulfilled"

        # Can't fulfill again
        r6 = client.put(f"{API}/requests/{req['id']}/fulfill")
        assert r6.status_code == 409


# ─── Auth Tests ──────────────────────────────────────────

class TestAuth:
    def test_post_without_auth(self, client):
        r = client.post(f"{API}/ai-posts", json={"content": "No auth"})
        assert r.status_code == 422  # missing header

    def test_post_with_bad_key(self, client):
        r = client.post(f"{API}/ai-posts", json={"content": "Bad key"},
                        headers={"Authorization": "Bearer invalid_key"})
        assert r.status_code == 401

    def test_request_without_auth(self, client):
        r = client.post(f"{API}/requests", json={"capability": "x", "description": "y"})
        assert r.status_code == 422

    def test_update_other_agent_capabilities(self, client):
        agent1, _, headers1 = _register_agent(client, name="Agent1")
        agent2, _, headers2 = _register_agent(client, name="Agent2")
        r = client.put(
            f"{API}/ai-agents/{agent1['id']}/capabilities",
            json={"capabilities": ["hacked"]},
            headers=headers2,
        )
        assert r.status_code == 403
