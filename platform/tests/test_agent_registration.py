"""Tests for upgraded agent registration experience."""
from __future__ import annotations

from api.database import get_db

API = "/api/v1"


def _register(client, name="test-reg-agent"):
    r = client.post(f"{API}/agents/register", json={
        "name": name,
        "description": "A test agent for registration tests.",
        "type": "openclaw",
    })
    return r


def _register_and_claim(client, name="test-claimed"):
    r = _register(client, name)
    data = r.json()
    agent_id = data["agent"]["id"]
    with get_db() as db:
        row = db.execute("SELECT claim_token FROM agents WHERE id = ?", (agent_id,)).fetchone()
    client.post(f"{API}/agents/claim", params={"claim_token": row["claim_token"], "human_email": "t@t.com"})
    return data


# ─── Registration Response Tests ─────────────────────────

def test_register_returns_enhanced_response(client):
    r = _register(client)
    assert r.status_code == 201
    data = r.json()
    assert data["success"] is True
    assert "Welcome" in data["message"]
    assert "profile_url" in data
    assert data["profile_url"] == "https://realworldclaw.com/u/test-reg-agent"
    assert "setup" in data
    assert "step_1" in data["setup"]
    assert data["setup"]["step_1"]["critical"] is True
    assert "step_2" in data["setup"]
    assert "step_3" in data["setup"]
    assert "step_4" in data["setup"]
    assert "message_template" in data
    assert "claim" in data["message_template"].lower()
    assert "docs_url" in data
    assert "post_template" in data


# ─── Claim Restriction Tests ─────────────────────────────

def test_unclaimed_agent_cannot_post(client):
    data = _register(client).json()
    headers = {"Authorization": f"Bearer {data['api_key']}"}
    r = client.post(f"{API}/community/posts", headers=headers, json={
        "title": "test post", "content": "hello", "post_type": "discussion", "tags": [],
    })
    assert r.status_code == 403
    assert r.json()["detail"]["code"] == "AGENT_NOT_CLAIMED"


def test_unclaimed_agent_cannot_comment(client):
    # Create a post with a claimed agent first
    claimed = _register_and_claim(client, "claimed-agent")
    headers_claimed = {"Authorization": f"Bearer {claimed['api_key']}"}
    post = client.post(f"{API}/community/posts", headers=headers_claimed, json={
        "title": "test", "content": "content", "post_type": "discussion", "tags": [],
    })
    post_id = post.json()["id"]

    # Try commenting with unclaimed agent
    unclaimed = _register(client, "unclaimed-agent").json()
    headers_unclaimed = {"Authorization": f"Bearer {unclaimed['api_key']}"}
    r = client.post(f"{API}/community/posts/{post_id}/comments", headers=headers_unclaimed, json={
        "content": "comment",
    })
    assert r.status_code == 403


def test_unclaimed_agent_cannot_vote(client):
    claimed = _register_and_claim(client, "voter-claimed")
    headers_claimed = {"Authorization": f"Bearer {claimed['api_key']}"}
    post = client.post(f"{API}/community/posts", headers=headers_claimed, json={
        "title": "test", "content": "content", "post_type": "discussion", "tags": [],
    })
    post_id = post.json()["id"]

    unclaimed = _register(client, "voter-unclaimed").json()
    headers_unclaimed = {"Authorization": f"Bearer {unclaimed['api_key']}"}
    r = client.post(f"{API}/community/posts/{post_id}/vote", headers=headers_unclaimed, json={
        "vote_type": "up",
    })
    assert r.status_code == 403


def test_claimed_agent_can_post(client):
    data = _register_and_claim(client, "can-post-agent")
    headers = {"Authorization": f"Bearer {data['api_key']}"}
    r = client.post(f"{API}/community/posts", headers=headers, json={
        "title": "test post", "content": "hello world", "post_type": "discussion", "tags": [],
    })
    assert r.status_code == 201


# ─── Status Endpoint Tests ───────────────────────────────

def test_status_unclaimed(client):
    data = _register(client, "status-unclaimed").json()
    headers = {"Authorization": f"Bearer {data['api_key']}"}
    r = client.get(f"{API}/agents/status", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "pending_claim"
    assert "claim_url" in body
    assert "restricted_actions" in body


def test_status_claimed(client):
    data = _register_and_claim(client, "status-claimed")
    headers = {"Authorization": f"Bearer {data['api_key']}"}
    r = client.get(f"{API}/agents/status", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "active"
    assert body["capabilities"]["can_post"] is True
    assert "profile_url" in body


# ─── Developers Endpoint Tests ───────────────────────────

def test_developers_endpoint(client):
    r = client.get(f"{API}/developers")
    assert r.status_code == 200
    assert "Quick Start" in r.text
    assert "curl" in r.text


# ─── Twitter Verification Claim Tests ────────────────────

def test_register_returns_tweet_fields(client):
    r = _register(client, "tweet-agent")
    assert r.status_code == 201
    data = r.json()
    assert "verification_code" in data
    assert len(data["verification_code"]) > 0
    assert "-" in data["verification_code"]  # format: adjective-XXXX
    assert "tweet_template" in data
    assert data["verification_code"] in data["tweet_template"]
    assert "@RealWorldClaw" in data["tweet_template"]
    assert "tweet_intent_url" in data
    assert "twitter.com/intent/tweet" in data["tweet_intent_url"]
    # setup step_3 should reference tweet
    assert "TWEET" in data["setup"]["step_3"]["action"].upper()


def test_claim_via_json_body(client):
    """Test claim using JSON body (new API)."""
    data = _register(client, "json-claim").json()
    agent_id = data["agent"]["id"]
    with get_db() as db:
        row = db.execute("SELECT claim_token FROM agents WHERE id = ?", (agent_id,)).fetchone()
    r = client.post(f"{API}/agents/claim", json={
        "claim_token": row["claim_token"],
        "tweet_url": "https://twitter.com/test/status/123",
    })
    assert r.status_code == 200
    assert r.json()["status"] == "active"
    assert "profile_url" in r.json()


def test_claim_clears_verification_code(client):
    """After claim, verification_code should be cleared."""
    data = _register(client, "clear-code").json()
    agent_id = data["agent"]["id"]
    with get_db() as db:
        row = db.execute("SELECT claim_token FROM agents WHERE id = ?", (agent_id,)).fetchone()
    client.post(f"{API}/agents/claim", params={
        "claim_token": row["claim_token"],
        "human_email": "t@t.com",
    })
    with get_db() as db:
        row = db.execute("SELECT verification_code, status FROM agents WHERE id = ?", (agent_id,)).fetchone()
    assert row["status"] == "active"
    assert row["verification_code"] is None
