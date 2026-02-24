from __future__ import annotations

import io

import pytest
from starlette.websockets import WebSocketDisconnect

API = "/api/v1"


def _register_and_get_headers(client, *, email: str, username: str) -> tuple[dict[str, str], str]:
    resp = client.post(
        f"{API}/auth/register",
        json={"email": email, "username": username, "password": "testpass1234"},
    )
    assert resp.status_code == 201
    body = resp.json()
    token = body["access_token"]
    user_id = body["user"]["id"]
    return {"Authorization": f"Bearer {token}"}, user_id


def test_search_response_contains_posts_spaces_users_structure(client):
    headers, _ = _register_and_get_headers(client, email="searcher@test.com", username="searcher")

    # Seed one searchable post + one node + one user
    client.post(
        f"{API}/community/posts",
        json={"title": "search-keyword post", "content": "body", "post_type": "showcase"},
        headers=headers,
    )
    node_resp = client.post(
        f"{API}/nodes/register",
        json={
            "name": "search-keyword node",
            "node_type": "3d_printer",
            "latitude": 31.23,
            "longitude": 121.47,
            "capabilities": ["print"],
            "materials": ["pla"],
        },
        headers=headers,
    )
    assert node_resp.status_code in (200, 201)

    r = client.get(f"{API}/search", params={"q": "search-keyword", "type": "all"})
    assert r.status_code == 200
    data = r.json()
    assert "posts" in data and isinstance(data["posts"], list)
    assert "spaces" in data and isinstance(data["spaces"], list)
    assert "users" in data and isinstance(data["users"], list)


def test_social_following_requires_auth_401(client):
    r = client.get(f"{API}/social/is-following/some-user", headers={"Authorization": "Bearer invalid-token"})
    assert r.status_code == 401


def test_spaces_create_contract_includes_display_name(client):
    headers, _ = _register_and_get_headers(client, email="spaces@test.com", username="spaces_user")

    payload = {
        "name": "maker_space",
        "display_name": "Maker Space",
        "description": "A place for makers",
        "icon": "🏭",
    }
    r = client.post(f"{API}/spaces", json=payload, headers=headers)
    assert r.status_code == 201
    data = r.json()
    assert data["name"] == payload["name"]
    assert data["display_name"] == payload["display_name"]

    # display_name is required by contract
    bad = client.post(
        f"{API}/spaces",
        json={"name": "missing_display", "description": "x", "icon": "🏭"},
        headers=headers,
    )
    assert bad.status_code == 422


def test_files_download_requires_auth_401_and_returns_200_when_authenticated(client):
    headers, _ = _register_and_get_headers(client, email="files@test.com", username="files_user")

    upload = client.post(
        f"{API}/files/upload",
        headers=headers,
        files={"file": ("demo.stl", io.BytesIO(b"solid demo\nendsolid"), "model/stl")},
    )
    assert upload.status_code == 200
    file_id = upload.json()["file_id"]

    unauth = client.get(
        f"{API}/files/{file_id}/download",
        headers={"Authorization": "Bearer invalid-token"},
    )
    assert unauth.status_code == 401

    ok = client.get(f"{API}/files/{file_id}/download", headers=headers)
    assert ok.status_code == 200


def test_files_download_missing_file_returns_404_when_authenticated(client):
    headers, _ = _register_and_get_headers(client, email="files404@test.com", username="files_404_user")

    not_found = client.get(f"{API}/files/file_missing_404/download", headers=headers)
    assert not_found.status_code == 404


def test_ws_rejects_connection_when_token_missing(client):
    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"{API}/ws/orders/user_1"):
            pass

    assert exc.value.code == 4001


def test_ws_accepts_connection_with_valid_query_token(client):
    headers, user_id = _register_and_get_headers(client, email="ws@test.com", username="ws_user")
    token = headers["Authorization"].split(" ", 1)[1]

    with client.websocket_connect(f"{API}/ws/orders/{user_id}?token={token}") as ws:
        ws.send_json({"type": "pong"})
