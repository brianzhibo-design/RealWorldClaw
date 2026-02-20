"""帖子端点测试 — 暖羊羊🐑 QA (W8)"""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from api.database import get_db, init_db
from api.main import app

client = TestClient(app)

AGENT_KEY = "rwc_sk_poster"


@pytest.fixture(autouse=True)
def _setup_db(tmp_path, monkeypatch):
    import api.database as db_mod
    monkeypatch.setattr(db_mod, "DB_PATH", tmp_path / "test.db")
    init_db()
    yield


def _auth(api_key: str = AGENT_KEY) -> dict:
    return {"Authorization": f"Bearer {api_key}"}


def _seed_agent(agent_id: str = "ag_poster", api_key: str = AGENT_KEY) -> str:
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        db.execute(
            """INSERT OR IGNORE INTO agents
               (id, name, display_name, description, type, status,
                reputation, tier, api_key, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (agent_id, f"post-{secrets.token_hex(3)}", "Post Agent",
             "A test agent", "openclaw", "active",
             0, "newcomer", api_key, now, now),
        )
    return agent_id


POST_BODY = {
    "type": "discussion",
    "title": "测试帖子标题",
    "content": "这是一个测试帖子的内容",
    "tags": ["test", "demo"],
}


def _create_post(api_key: str = AGENT_KEY) -> dict:
    resp = client.post("/api/v1/posts", json=POST_BODY, headers=_auth(api_key))
    assert resp.status_code == 201
    return resp.json()


# ─── 创建帖子 ────────────────────────────────────────────

class TestPostCreate:
    def test_create_success(self):
        _seed_agent()
        data = _create_post()
        assert data["id"].startswith("post_")
        assert data["title"] == "测试帖子标题"
        assert data["type"] == "discussion"
        assert data["upvotes"] == 0
        assert data["reply_count"] == 0

    def test_create_no_auth_401(self):
        resp = client.post("/api/v1/posts", json=POST_BODY)
        assert resp.status_code in (401, 422)

    def test_create_bad_key_401(self):
        resp = client.post("/api/v1/posts", json=POST_BODY,
                           headers={"Authorization": "Bearer wrong"})
        assert resp.status_code == 401


# ─── 帖子列表 ────────────────────────────────────────────

class TestPostList:
    def test_list_empty(self):
        resp = client.get("/api/v1/posts")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 0
        assert data["posts"] == []

    def test_list_with_posts(self):
        _seed_agent()
        _create_post()
        _create_post()
        resp = client.get("/api/v1/posts")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 2
        assert len(data["posts"]) == 2

    def test_list_pagination(self):
        _seed_agent()
        for _ in range(3):
            _create_post()
        resp = client.get("/api/v1/posts?per_page=2&page=1")
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] == 3
        assert len(data["posts"]) == 2


# ─── 帖子详情 ────────────────────────────────────────────

class TestPostDetail:
    def test_get_post(self):
        _seed_agent()
        post = _create_post()
        resp = client.get(f"/api/v1/posts/{post['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == post["id"]
        assert resp.json()["title"] == "测试帖子标题"

    def test_get_post_not_found(self):
        resp = client.get("/api/v1/posts/nonexistent")
        assert resp.status_code == 404
