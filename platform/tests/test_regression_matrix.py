from __future__ import annotations

import io
import time

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


def test_social_follow_lifecycle_updates_is_following_state(client):
    follower_headers, _ = _register_and_get_headers(
        client,
        email="social_follower@test.com",
        username="social_follower",
    )
    _, target_user_id = _register_and_get_headers(
        client,
        email="social_target@test.com",
        username="social_target",
    )

    before = client.get(f"{API}/social/is-following/{target_user_id}", headers=follower_headers)
    assert before.status_code == 200
    assert before.json()["is_following"] is False

    follow = client.post(f"{API}/social/follow/{target_user_id}", headers=follower_headers)
    assert follow.status_code == 200

    after_follow = client.get(f"{API}/social/is-following/{target_user_id}", headers=follower_headers)
    assert after_follow.status_code == 200
    assert after_follow.json()["is_following"] is True

    unfollow = client.delete(f"{API}/social/follow/{target_user_id}", headers=follower_headers)
    assert unfollow.status_code == 200

    after_unfollow = client.get(f"{API}/social/is-following/{target_user_id}", headers=follower_headers)
    assert after_unfollow.status_code == 200
    assert after_unfollow.json()["is_following"] is False


def test_community_feed_prioritizes_followed_author_posts(client):
    viewer_headers, _ = _register_and_get_headers(
        client,
        email="feedviewer@test.com",
        username="feed_viewer",
    )
    followed_headers, followed_user_id = _register_and_get_headers(
        client,
        email="feedfollowed@test.com",
        username="feed_followed_author",
    )
    other_headers, _ = _register_and_get_headers(
        client,
        email="feedother@test.com",
        username="feed_other_author",
    )

    follow_resp = client.post(f"{API}/social/follow/{followed_user_id}", headers=viewer_headers)
    assert follow_resp.status_code == 200

    followed_post = client.post(
        f"{API}/community/posts",
        json={"title": "feed-followed-priority", "content": "from followed", "post_type": "discussion"},
        headers=followed_headers,
    )
    assert followed_post.status_code in (200, 201)

    other_post = client.post(
        f"{API}/community/posts",
        json={"title": "feed-other-priority", "content": "from other", "post_type": "discussion"},
        headers=other_headers,
    )
    assert other_post.status_code in (200, 201)

    feed = client.get(f"{API}/community/feed", headers=viewer_headers)
    assert feed.status_code == 200
    payload = feed.json()
    assert len(payload["posts"]) >= 2

    top_two_titles = [item["title"] for item in payload["posts"][:2]]
    assert "feed-followed-priority" in top_two_titles


def test_search_type_node_only_excludes_posts_and_users(client):
    headers, _ = _register_and_get_headers(client, email="searchnode@test.com", username="search_node_user")

    client.post(
        f"{API}/community/posts",
        json={"title": "node-only-keyword post", "content": "body", "post_type": "showcase"},
        headers=headers,
    )
    node_resp = client.post(
        f"{API}/nodes/register",
        json={
            "name": "node-only-keyword node",
            "node_type": "3d_printer",
            "latitude": 31.23,
            "longitude": 121.47,
            "capabilities": ["print"],
            "materials": ["pla"],
        },
        headers=headers,
    )
    assert node_resp.status_code in (200, 201)

    r = client.get(f"{API}/search", params={"q": "node-only-keyword", "type": "node"})
    assert r.status_code == 200
    data = r.json()

    assert data["posts"] == []
    assert data["users"] == []
    assert len(data["spaces"]) >= 1
    assert all(item["type"] == "node" for item in data["spaces"])
    assert data["total"] == len(data["spaces"])


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

    listed = client.get(f"{API}/spaces")
    assert listed.status_code == 200
    listed_spaces = listed.json()["spaces"]
    created_space = next((space for space in listed_spaces if space["name"] == payload["name"]), None)
    assert created_space is not None
    assert created_space["display_name"] == payload["display_name"]

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


def test_files_download_forbidden_for_non_uploader(client):
    uploader_headers, _ = _register_and_get_headers(client, email="owner@test.com", username="files_owner")
    other_headers, _ = _register_and_get_headers(client, email="other@test.com", username="files_other")

    upload = client.post(
        f"{API}/files/upload",
        headers=uploader_headers,
        files={"file": ("private.stl", io.BytesIO(b"solid private\nendsolid"), "model/stl")},
    )
    assert upload.status_code == 200
    file_id = upload.json()["file_id"]

    forbidden = client.get(f"{API}/files/{file_id}/download", headers=other_headers)
    assert forbidden.status_code == 403


def test_ws_rejects_connection_when_token_missing(client):
    with client.websocket_connect(f"{API}/ws/orders/user_1") as ws:
        ws.send_json({"type": "pong"})
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_json()

    assert exc.value.code == 4001


def test_ws_accepts_connection_with_valid_query_token(client):
    headers, user_id = _register_and_get_headers(client, email="ws@test.com", username="ws_user")
    token = headers["Authorization"].split(" ", 1)[1]

    with client.websocket_connect(f"{API}/ws/orders/{user_id}?token={token}") as ws:
        ws.send_json({"type": "pong"})


def test_ws_accepts_notifications_subscription_for_token_owner(client):
    headers, user_id = _register_and_get_headers(
        client,
        email="wsnotifyok@test.com",
        username="ws_notify_ok_user",
    )
    token = headers["Authorization"].split(" ", 1)[1]

    with client.websocket_connect(f"{API}/ws/notifications/{user_id}?token={token}") as ws:
        ws.send_json({"type": "pong"})


def test_ws_accepts_notifications_subscription_with_first_auth_message_token(client):
    headers, user_id = _register_and_get_headers(
        client,
        email="wsnotifyauth@test.com",
        username="ws_notify_auth_user",
    )
    token = headers["Authorization"].split(" ", 1)[1]

    with client.websocket_connect(f"{API}/ws/notifications/{user_id}") as ws:
        ws.send_json({"type": "auth", "token": token})
        ws.send_json({"type": "pong"})


def test_ws_accepts_connection_with_first_auth_message_token(client):
    headers, user_id = _register_and_get_headers(client, email="wsauth@test.com", username="ws_auth_user")
    token = headers["Authorization"].split(" ", 1)[1]

    with client.websocket_connect(f"{API}/ws/orders/{user_id}") as ws:
        ws.send_json({"type": "auth", "token": token})
        ws.send_json({"type": "pong"})


def test_ws_rejects_connection_with_invalid_first_auth_message(client):
    _, user_id = _register_and_get_headers(client, email="wsauthbad@test.com", username="ws_auth_bad_user")

    with client.websocket_connect(f"{API}/ws/orders/{user_id}") as ws:
        ws.send_json({"type": "auth", "token": "invalid-token"})
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_json()

    assert exc.value.code == 4001


def test_ws_rejects_connection_when_first_auth_message_times_out(client, monkeypatch):
    from api.routers import ws as ws_router

    monkeypatch.setattr(ws_router, "AUTH_FIRST_MSG_TIMEOUT_SECONDS", 0.01)
    _, user_id = _register_and_get_headers(client, email="wstimeout@test.com", username="ws_timeout_user")

    with client.websocket_connect(f"{API}/ws/orders/{user_id}") as ws:
        time.sleep(0.05)
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_json()

    assert exc.value.code == 4001


def test_ws_rejects_connection_when_first_auth_message_is_not_dict(client):
    headers, user_id = _register_and_get_headers(client, email="wstype@test.com", username="ws_type_user")
    token = headers["Authorization"].split(" ", 1)[1]

    with client.websocket_connect(f"{API}/ws/orders/{user_id}") as ws:
        ws.send_json(["auth", token])
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_json()

    assert exc.value.code == 4001


def test_ws_rejects_connection_when_first_auth_message_dict_missing_type_and_token(client):
    _, user_id = _register_and_get_headers(client, email="wsdictbad@test.com", username="ws_dict_bad_user")

    with client.websocket_connect(f"{API}/ws/orders/{user_id}") as ws:
        ws.send_json({})
        with pytest.raises(WebSocketDisconnect) as exc:
            ws.receive_json()

    assert exc.value.code == 4001


def test_ws_client_disconnects_before_first_auth_message_no_server_exception(client):
    _, user_id = _register_and_get_headers(client, email="wsearlydisc@test.com", username="ws_early_disc_user")

    # Should not raise even if server sees disconnect before first auth payload.
    with client.websocket_connect(f"{API}/ws/orders/{user_id}") as ws:
        ws.close()


def test_ws_rejects_cross_user_notifications_subscription(client):
    headers_a, _ = _register_and_get_headers(client, email="wsusera@test.com", username="ws_user_a")
    _, user_b = _register_and_get_headers(client, email="wsuserb@test.com", username="ws_user_b")
    token_a = headers_a["Authorization"].split(" ", 1)[1]

    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"{API}/ws/notifications/{user_b}?token={token_a}"):
            pass

    assert exc.value.code == 4003


def test_ws_rejects_cross_user_orders_subscription(client):
    headers_a, _ = _register_and_get_headers(client, email="wsordera@test.com", username="ws_order_user_a")
    _, user_b = _register_and_get_headers(client, email="wsorderb@test.com", username="ws_order_user_b")
    token_a = headers_a["Authorization"].split(" ", 1)[1]

    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"{API}/ws/orders/{user_b}?token={token_a}"):
            pass

    assert exc.value.code == 4003


def test_ws_rejects_cross_user_printer_subscription(client):
    headers_a, _ = _register_and_get_headers(client, email="wsprintera@test.com", username="ws_printer_user_a")
    _, user_b = _register_and_get_headers(client, email="wsprinterb@test.com", username="ws_printer_user_b")
    token_a = headers_a["Authorization"].split(" ", 1)[1]

    with pytest.raises(WebSocketDisconnect) as exc:
        with client.websocket_connect(f"{API}/ws/printer/{user_b}?token={token_a}"):
            pass

    assert exc.value.code == 4003


def test_ws_accepts_printer_subscription_for_token_owner(client):
    headers, user_id = _register_and_get_headers(
        client,
        email="wsprinterok@test.com",
        username="ws_printer_ok_user",
    )
    token = headers["Authorization"].split(" ", 1)[1]

    with client.websocket_connect(f"{API}/ws/printer/{user_id}?token={token}") as ws:
        ws.send_json({"type": "pong"})


def test_community_post_best_answer_contract_persists_post_and_comment_fields(client):
    author_headers, _ = _register_and_get_headers(
        client,
        email="bestanswerauthor@test.com",
        username="best_answer_author",
    )
    helper_headers, _ = _register_and_get_headers(
        client,
        email="bestanswerhelper@test.com",
        username="best_answer_helper",
    )

    post_resp = client.post(
        f"{API}/community/posts",
        json={"title": "Need help", "content": "How to calibrate?", "post_type": "discussion"},
        headers=author_headers,
    )
    assert post_resp.status_code in (200, 201)
    post_id = post_resp.json()["id"]

    comment_resp = client.post(
        f"{API}/community/posts/{post_id}/comments",
        json={"content": "Use a 0.2mm feeler gauge and re-run test print."},
        headers=helper_headers,
    )
    assert comment_resp.status_code in (200, 201)
    comment_id = comment_resp.json()["id"]

    mark_resp = client.post(
        f"{API}/community/posts/{post_id}/best-answer",
        json={"comment_id": comment_id},
        headers=author_headers,
    )
    assert mark_resp.status_code == 200
    marked = mark_resp.json()
    assert marked["ok"] is True
    assert marked["comment_id"] == comment_id

    post_detail = client.get(f"{API}/community/posts/{post_id}")
    assert post_detail.status_code == 200
    detail_payload = post_detail.json()
    assert detail_payload["best_answer_comment_id"] == comment_id
    assert detail_payload["best_comment_id"] == comment_id
    assert detail_payload["resolved_at"] is not None

    comments = client.get(f"{API}/community/posts/{post_id}/comments")
    assert comments.status_code == 200
    payload = comments.json()
    matched = next(item for item in payload if item["id"] == comment_id)
    assert matched["is_best_answer"] is True
