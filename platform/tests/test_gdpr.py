from api.database import get_db


def test_gdpr_consent_get_and_update(client, auth_headers):
    get_resp = client.get("/api/v1/gdpr/consent", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["consent"] == {}

    payload = {"consent": {"analytics": True, "marketing": False}}
    post_resp = client.post("/api/v1/gdpr/consent", json=payload, headers=auth_headers)
    assert post_resp.status_code == 200
    assert post_resp.json()["consent"] == payload["consent"]

    get_resp2 = client.get("/api/v1/gdpr/consent", headers=auth_headers)
    assert get_resp2.status_code == 200
    assert get_resp2.json()["consent"] == payload["consent"]


def test_gdpr_export_only_current_user_data(client):
    # user A
    reg_a = client.post("/api/v1/auth/register", json={
        "email": "a@test.com",
        "username": "user_a",
        "password": "testpass1234",
    })
    headers_a = {"Authorization": f"Bearer {reg_a.json()['access_token']}"}
    user_a = reg_a.json()["user"]

    # user B
    reg_b = client.post("/api/v1/auth/register", json={
        "email": "b@test.com",
        "username": "user_b",
        "password": "testpass1234",
    })
    user_b = reg_b.json()["user"]

    with get_db() as db:
        db.execute(
            "INSERT INTO community_posts (id, title, content, post_type, author_id, author_type, created_at, updated_at) VALUES (?, ?, ?, 'discussion', ?, 'user', datetime('now'), datetime('now'))",
            ("post_a", "A", "A content", user_a["id"]),
        )
        db.execute(
            "INSERT INTO community_posts (id, title, content, post_type, author_id, author_type, created_at, updated_at) VALUES (?, ?, ?, 'discussion', ?, 'user', datetime('now'), datetime('now'))",
            ("post_b", "B", "B content", user_b["id"]),
        )

    resp = client.get("/api/v1/gdpr/export", headers=headers_a)
    assert resp.status_code == 200
    body = resp.json()
    assert body["user"]["id"] == user_a["id"]

    posts = body["datasets"]["community_posts"]
    assert len(posts) == 1
    assert posts[0]["author_id"] == user_a["id"]


def test_gdpr_soft_delete_anonymizes_account(client, auth_headers):
    # find current user id
    me = client.get("/api/v1/auth/me", headers=auth_headers)
    user_id = me.json()["id"]

    delete_resp = client.delete("/api/v1/gdpr/delete", headers=auth_headers)
    assert delete_resp.status_code == 200
    assert delete_resp.json()["anonymized"] is True

    with get_db() as db:
        row = db.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    assert row is not None
    assert row["is_active"] == 0
    assert row["anonymized"] == 1
    assert row["deleted_at"] is not None
    assert row["email"].startswith("deleted+")
