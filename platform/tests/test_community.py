"""Community API tests - RealWorldClaw Team"""

from __future__ import annotations

import io

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


@pytest.fixture
def authenticated_user():
    client.post("/api/v1/auth/register", json={
        "email": "test@example.com", "username": "testuser", "password": "securepass123",
    })
    r = client.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "securepass123"})
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_file_id(authenticated_user):
    file_obj = io.BytesIO(b"test stl content")
    r = client.post(
        "/api/v1/files/upload",
        headers=authenticated_user,
        files={"file": ("test.stl", file_obj, "model/stl")}
    )
    return r.json()["file_id"]


def _create_post(headers, **overrides):
    payload = {
        "title": "hello",
        "content": "world",
        "post_type": "discussion",
    }
    payload.update(overrides)
    return client.post("/api/v1/community/posts", headers=headers, json=payload)


class TestTagsAndTemplate:
    def test_get_tags_grouped(self):
        r = client.get("/api/v1/tags")
        assert r.status_code == 200
        data = r.json()
        assert "categories" in data
        assert "craft" in data["categories"]

    def test_get_tags_by_category(self):
        r = client.get("/api/v1/tags?category=craft")
        assert r.status_code == 200
        data = r.json()
        assert data["category"] == "craft"
        assert any(t["name"] == "3D Printing" for t in data["tags"])

    def test_create_post_with_tags_and_template(self, authenticated_user):
        r = _create_post(
            authenticated_user,
            title="Tagged post",
            tags=["3D Printing", "PLA"],
            template_type="engineering_log",
        )
        assert r.status_code == 200
        data = r.json()
        assert "3D Printing" in data["tags"]
        assert data["template_type"] == "engineering_log"

    def test_filter_posts_by_tag(self, authenticated_user):
        _create_post(authenticated_user, title="A", tags=["3D Printing"])
        _create_post(authenticated_user, title="B", tags=["CNC"])
        r = client.get("/api/v1/community/posts?tag=3d printing")
        assert r.status_code == 200
        data = r.json()
        assert data["total"] == 1
        assert data["posts"][0]["title"] == "A"


class TestGovernanceAPI:
    def test_resolve_post_by_author(self, authenticated_user):
        p = _create_post(authenticated_user).json()
        r = client.post(f"/api/v1/community/posts/{p['id']}/resolve", headers=authenticated_user)
        assert r.status_code == 200
        detail = client.get(f"/api/v1/community/posts/{p['id']}").json()
        assert detail["is_resolved"] is True

    def test_mark_best_answer(self, authenticated_user):
        p = _create_post(authenticated_user).json()
        c = client.post(
            f"/api/v1/community/posts/{p['id']}/comments",
            headers=authenticated_user,
            json={"content": "answer"},
        ).json()
        r = client.post(f"/api/v1/community/comments/{c['id']}/best-answer", headers=authenticated_user)
        assert r.status_code == 200
        comments = client.get(f"/api/v1/community/posts/{p['id']}/comments").json()
        assert comments[0]["is_best_answer"] is True

    def test_report_post(self, authenticated_user):
        p = _create_post(authenticated_user).json()
        r = client.post(
            f"/api/v1/community/posts/{p['id']}/report",
            headers=authenticated_user,
            json={"reason": "spam"},
        )
        assert r.status_code == 200

    def test_pin_and_lock_post_admin_only(self, authenticated_user):
        p = _create_post(authenticated_user).json()

        # non-admin forbidden
        r = client.post(f"/api/v1/community/posts/{p['id']}/pin", headers=authenticated_user)
        assert r.status_code == 403

        with get_db() as db:
            db.execute("UPDATE users SET role = 'admin' WHERE email = ?", ("test@example.com",))

        r_pin = client.post(f"/api/v1/community/posts/{p['id']}/pin", headers=authenticated_user)
        r_lock = client.post(f"/api/v1/community/posts/{p['id']}/lock", headers=authenticated_user)
        assert r_pin.status_code == 200
        assert r_lock.status_code == 200

        # locked post cannot comment
        r_comment = client.post(
            f"/api/v1/community/posts/{p['id']}/comments",
            headers=authenticated_user,
            json={"content": "cannot"},
        )
        assert r_comment.status_code == 403


class TestCreatePostCompatibility:
    def test_create_post_with_file(self, authenticated_user, sample_file_id):
        r = _create_post(authenticated_user, file_id=sample_file_id)
        assert r.status_code == 200
        assert r.json()["file_id"] == sample_file_id
