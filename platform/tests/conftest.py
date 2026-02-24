"""Test configuration."""
import os
os.environ["TESTING"] = "1"

import pytest
import uuid
from fastapi.testclient import TestClient

collect_ignore = ['_archived']

API = "/api/v1"


@pytest.fixture(autouse=True)
def _fresh_db(tmp_path, monkeypatch):
    """Give each test a fresh SQLite database."""
    import api.database as db_mod
    monkeypatch.setattr(db_mod, "DB_PATH", tmp_path / "test.db")
    db_mod.init_db()
    yield


def _agent_auth(client, name: str = "test-agent", description: str = "Test agent"):
    """Register a user and return auth headers. Legacy helper for e2e tests."""
    uid = uuid.uuid4().hex[:8]
    resp = client.post(f"{API}/auth/register", json={
        "email": f"{name}-{uid}@test.com",
        "username": f"{name}_{uid}",
        "password": "testpass1234",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def client():
    """Provide a test client for the FastAPI app."""
    from api.main import app
    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_headers(client):
    """Register a test user and return auth headers."""
    import uuid
    uid = uuid.uuid4().hex[:8]
    resp = client.post("/api/v1/auth/register", json={
        "email": f"test-{uid}@test.com",
        "username": f"test_{uid}",
        "password": "testpass1234",
    })
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def maker_headers(client):
    """Register a test user, register as maker, return auth headers."""
    import uuid
    uid = uuid.uuid4().hex[:8]
    resp = client.post("/api/v1/auth/register", json={
        "email": f"maker-{uid}@test.com",
        "username": f"maker_{uid}",
        "password": "testpass1234",
    })
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    client.post("/api/v1/makers/register", json={
        "display_name": f"Maker {uid}",
        "capabilities": ["fdm_printing"],
        "materials": ["PLA"],
    }, headers=headers)
    return headers


@pytest.fixture
def admin_headers(client):
    """Register a test user with admin role and return auth headers."""
    import uuid
    uid = uuid.uuid4().hex[:8]
    resp = client.post("/api/v1/auth/register", json={
        "email": f"admin-{uid}@test.com",
        "username": f"admin_{uid}",
        "password": "testpass1234",
    })
    data = resp.json()
    token = data["access_token"]
    user_id = data.get("user", {}).get("id", "")
    # Directly set admin role in DB
    from api.database import get_db
    with get_db() as db:
        db.execute("UPDATE users SET role = 'admin' WHERE id = ?", (user_id,))
    # Re-login to get token with updated role
    resp2 = client.post("/api/v1/auth/login", json={
        "email": f"admin-{uid}@test.com",
        "password": "testpass1234",
    })
    token2 = resp2.json()["access_token"]
    return {"Authorization": f"Bearer {token2}"}
