from __future__ import annotations

from datetime import datetime, timedelta, timezone

from api.api_keys import hash_api_key, validate_api_key
from api.database import get_db


def test_create_api_key(client, admin_headers):
    resp = client.post(
        "/api/v1/api-keys",
        json={"description": "ci key", "expires_in_days": 30},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["key_id"].startswith("ak_")
    assert data["api_key"].startswith("rwc_")
    assert data["description"] == "ci key"


def test_list_api_keys(client, admin_headers):
    create_resp = client.post(
        "/api/v1/api-keys",
        json={"description": "list me", "expires_in_days": 30},
        headers=admin_headers,
    )
    assert create_resp.status_code == 200
    created = create_resp.json()

    list_resp = client.get("/api/v1/api-keys", headers=admin_headers)
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert any(item["key_id"] == created["key_id"] for item in items)


def test_revoke_api_key(client, admin_headers):
    create_resp = client.post(
        "/api/v1/api-keys",
        json={"description": "revoke me", "expires_in_days": 30},
        headers=admin_headers,
    )
    key_data = create_resp.json()

    revoke_resp = client.delete(f"/api/v1/api-keys/{key_data['key_id']}", headers=admin_headers)
    assert revoke_resp.status_code == 200

    with get_db() as db:
        validated = validate_api_key(db, key_data["api_key"])
    assert validated is None


def test_rotate_api_key(client, admin_headers):
    create_resp = client.post(
        "/api/v1/api-keys",
        json={"description": "rotate me", "expires_in_days": 30},
        headers=admin_headers,
    )
    old_key = create_resp.json()

    rotate_resp = client.post(
        f"/api/v1/api-keys/{old_key['key_id']}/rotate",
        json={"expires_in_days": 45},
        headers=admin_headers,
    )
    assert rotate_resp.status_code == 200
    new_key = rotate_resp.json()
    assert new_key["key_id"] != old_key["key_id"]

    with get_db() as db:
        old_valid = validate_api_key(db, old_key["api_key"])
        new_valid = validate_api_key(db, new_key["api_key"])
    assert old_valid is None
    assert new_valid is not None


def test_validate_expired_api_key():
    raw_key = "rwc_expired_key"
    key_id = "ak_expired"
    now = datetime.now(timezone.utc)

    with get_db() as db:
        db.execute(
            """
            INSERT INTO api_keys (key_id, hashed_key, created_at, expires_at, revoked, description)
            VALUES (?, ?, ?, ?, 0, ?)
            """,
            (
                key_id,
                hash_api_key(raw_key),
                now.isoformat(),
                (now - timedelta(days=1)).isoformat(),
                "expired",
            ),
        )
        validated = validate_api_key(db, raw_key)

    assert validated is None
