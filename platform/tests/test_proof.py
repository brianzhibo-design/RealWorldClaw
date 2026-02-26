from __future__ import annotations

from datetime import datetime, timezone

from api.database import get_db

API = "/api/v1"


def _register_agent(client, name: str):
    r = client.post(
        f"{API}/agents/register",
        json={
            "name": name,
            "display_name": name,
            "description": "A test agent for proof endpoints.",
            "type": "openclaw",
        },
    )
    assert r.status_code == 201
    data = r.json()
    return data["agent"]["id"], {"Authorization": f"Bearer {data['api_key']}"}


def _insert_node(node_id: str = "node-proof-1"):
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
                node_id,
                "owner-proof",
                "Node Proof",
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


def test_proof_submit_and_list_and_detail(client, admin_headers):
    _agent_id, agent_headers = _register_agent(client, "proof-agent-1")
    _insert_node("node-proof-ok")

    submit = client.post(
        f"{API}/proof/submit",
        headers=agent_headers,
        json={
            "node_id": "node-proof-ok",
            "proof_type": "photo",
            "description": "quality check",
            "evidence_url": "https://example.com/p.jpg",
        },
    )
    assert submit.status_code == 201
    proof_id = submit.json()["id"]

    listed = client.get(f"{API}/proof/node/node-proof-ok", headers=agent_headers)
    assert listed.status_code == 200
    assert listed.json()["total"] == 1
    assert listed.json()["items"][0]["id"] == proof_id

    detail = client.get(f"{API}/proof/verify/{proof_id}", headers=agent_headers)
    assert detail.status_code == 200
    assert detail.json()["verification_status"] == "pending"

    verify = client.post(
        f"{API}/proof/{proof_id}/verify",
        headers=admin_headers,
        json={"verified": True, "notes": "looks good"},
    )
    assert verify.status_code == 200
    assert verify.json()["verification_status"] == "verified"


def test_proof_submit_validation_and_not_found(client):
    _agent_id, agent_headers = _register_agent(client, "proof-agent-2")

    missing_node = client.post(
        f"{API}/proof/submit",
        headers=agent_headers,
        json={
            "node_id": "node-missing",
            "proof_type": "photo",
            "description": "proof",
            "evidence_url": "https://example.com/p.jpg",
        },
    )
    assert missing_node.status_code == 404

    invalid_type = client.post(
        f"{API}/proof/submit",
        headers=agent_headers,
        json={
            "node_id": "node-missing",
            "proof_type": "bad-type",
            "description": "proof",
            "evidence_url": "https://example.com/p.jpg",
        },
    )
    assert invalid_type.status_code == 422

    _insert_node("node-proof-order")
    missing_order = client.post(
        f"{API}/proof/submit",
        headers=agent_headers,
        json={
            "node_id": "node-proof-order",
            "order_id": "order-not-exists",
            "proof_type": "photo",
            "description": "proof",
            "evidence_url": "https://example.com/p.jpg",
        },
    )
    assert missing_order.status_code == 404


def test_proof_permissions_and_not_found_on_verify(client, auth_headers, admin_headers):
    _agent_id, agent_headers = _register_agent(client, "proof-agent-3")
    _insert_node("node-proof-perm")

    submit = client.post(
        f"{API}/proof/submit",
        headers=agent_headers,
        json={
            "node_id": "node-proof-perm",
            "proof_type": "photo",
            "description": "proof",
            "evidence_url": "https://example.com/p.jpg",
        },
    )
    assert submit.status_code == 201
    proof_id = submit.json()["id"]

    list_unauth = client.get(f"{API}/proof/node/node-proof-perm")
    assert list_unauth.status_code == 422

    detail_unauth = client.get(f"{API}/proof/verify/{proof_id}")
    assert detail_unauth.status_code == 422

    verify_non_admin = client.post(
        f"{API}/proof/{proof_id}/verify",
        headers=auth_headers,
        json={"verified": True, "notes": "not allowed"},
    )
    assert verify_non_admin.status_code == 403

    verify_missing = client.post(
        f"{API}/proof/not-exists/verify",
        headers=admin_headers,
        json={"verified": True, "notes": "x"},
    )
    assert verify_missing.status_code == 404
