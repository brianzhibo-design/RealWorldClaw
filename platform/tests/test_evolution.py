from __future__ import annotations

from datetime import datetime, timezone

from api.database import get_db
from api.services.evolution import _reset_daily_xp


API = "/api/v1"


def _register_agent(client, name: str):
    r = client.post(
        f"{API}/agents/register",
        json={
            "name": name,
            "display_name": name,
            "description": "A test agent for evolution hooks.",
            "type": "openclaw",
        },
    )
    assert r.status_code == 201
    data = r.json()
    return data["agent"]["id"], {"Authorization": f"Bearer {data['api_key']}"}


def test_evolution_grant_xp_and_leaderboard(client, admin_headers):
    agent_id, _ = _register_agent(client, "evo-agent-1")

    r0 = client.get(f"{API}/evolution/{agent_id}")
    assert r0.status_code == 200
    assert r0.json()["evolution_xp"] == 0
    assert r0.json()["evolution_level"] == 0
    assert r0.json()["evolution_title"] == "Newborn"

    r1 = client.post(
        f"{API}/evolution/{agent_id}/grant-xp",
        headers=admin_headers,
        json={"xp": 600, "reason": "seed"},
    )
    assert r1.status_code == 200
    body = r1.json()
    assert body["evolution_xp"] == 600
    assert body["evolution_level"] == 2
    assert body["evolution_title"] == "Builder"

    r2 = client.get(f"{API}/evolution/leaderboard")
    assert r2.status_code == 200
    assert any(item["agent_id"] == agent_id for item in r2.json()["items"])


def test_community_hooks_grant_xp(client):
    _reset_daily_xp()
    agent_id, agent_headers = _register_agent(client, "evo-agent-2")

    post = client.post(
        f"{API}/community/posts",
        headers=agent_headers,
        json={
            "title": "agent post",
            "content": "hello world",
            "post_type": "discussion",
            "tags": [],
        },
    )
    assert post.status_code == 200
    post_id = post.json()["id"]

    c = client.post(
        f"{API}/community/posts/{post_id}/comments",
        headers=agent_headers,
        json={"content": "agent comment"},
    )
    assert c.status_code == 200

    evo = client.get(f"{API}/evolution/{agent_id}")
    assert evo.status_code == 200
    assert evo.json()["evolution_xp"] == 15
    assert evo.json()["evolution_level"] == 0
    assert evo.json()["evolution_title"] == "Newborn"


def test_proof_hooks_grant_xp(client, admin_headers):
    _reset_daily_xp()
    agent_id, agent_headers = _register_agent(client, "evo-agent-3")

    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        db.execute(
            """
            INSERT INTO nodes (
                id, owner_id, name, node_type, latitude, longitude,
                fuzzy_latitude, fuzzy_longitude, capabilities, materials,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "node-evo-1",
                "owner-evo",
                "Node EVO",
                "3d_printer",
                1.0,
                1.0,
                1.0,
                1.0,
                "[]",
                "[]",
                "online",
                now,
                now,
            ),
        )

    submit = client.post(
        f"{API}/proof/submit",
        headers=agent_headers,
        json={
            "node_id": "node-evo-1",
            "proof_type": "photo",
            "description": "proof",
            "evidence_url": "https://example.com/p.jpg",
        },
    )
    assert submit.status_code == 201
    proof_id = submit.json()["id"]

    verify = client.post(
        f"{API}/proof/{proof_id}/verify",
        headers=admin_headers,
        json={"verified": True, "notes": "ok"},
    )
    assert verify.status_code == 200

    evo = client.get(f"{API}/evolution/{agent_id}")
    assert evo.status_code == 200
    assert evo.json()["evolution_xp"] == 250
    assert evo.json()["evolution_level"] == 1
    assert evo.json()["evolution_title"] == "Curious"


def test_evolution_grant_xp_permissions_and_validation(client, auth_headers, admin_headers):
    agent_id, _ = _register_agent(client, "evo-agent-perm")

    non_admin = client.post(
        f"{API}/evolution/{agent_id}/grant-xp",
        headers=auth_headers,
        json={"xp": 10, "reason": "try"},
    )
    assert non_admin.status_code == 403

    invalid_xp = client.post(
        f"{API}/evolution/{agent_id}/grant-xp",
        headers=admin_headers,
        json={"xp": 0, "reason": "bad"},
    )
    assert invalid_xp.status_code == 422

    missing_agent = client.post(
        f"{API}/evolution/not-exists/grant-xp",
        headers=admin_headers,
        json={"xp": 10, "reason": "missing"},
    )
    assert missing_agent.status_code == 404


def test_evolution_get_agent_not_found(client):
    r = client.get(f"{API}/evolution/not-exists")
    assert r.status_code == 404
