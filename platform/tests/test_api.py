"""RealWorldClaw API tests."""

from __future__ import annotations

import json
import secrets
import sqlite3
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from api.database import get_db, init_db
from api.main import app

client = TestClient(app)

TEST_API_KEY = "rwc-test-key-2026"
AUTH_HEADER = {"Authorization": f"Bearer {TEST_API_KEY}"}


# ─── Fixtures ────────────────────────────────────────────

@pytest.fixture(autouse=True)
def _setup_db(tmp_path, monkeypatch):
    """Use a temporary database for each test."""
    import api.database as db_mod
    db_path = tmp_path / "test.db"
    monkeypatch.setattr(db_mod, "DB_PATH", db_path)
    init_db()
    yield


def _seed_agent(agent_id: str = "ag_test01", api_key: str = "rwc_sk_live_test") -> str:
    """Insert a minimal active agent and return its id."""
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        db.execute(
            """INSERT OR IGNORE INTO agents
               (id, name, display_name, description, type, status,
                reputation, tier, api_key, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (agent_id, f"test-{secrets.token_hex(3)}", "Test Agent",
             "A test agent for unit tests", "openclaw", "active",
             0, "newcomer", api_key, now, now),
        )
    return agent_id


def _seed_component(component_id: str = "test-component", agent_id: str = "ag_test01"):
    """Insert a minimal component."""
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        db.execute(
            """INSERT OR IGNORE INTO components
               (id, display_name, description, version, author_id,
                tags, capabilities, status, downloads, rating, review_count,
                created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (component_id, "Test Component", "A test component for searching",
             "0.1.0", agent_id, json.dumps(["test", "demo"]),
             json.dumps(["print"]), "unverified", 0, 0.0, 0, now, now),
        )


# ─── Health ──────────────────────────────────────────────

def test_health():
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["version"] == "0.1.0"


def test_root():
    resp = client.get("/")
    assert resp.status_code == 200
    assert "RealWorldClaw" in resp.json()["name"]


# ─── Stats ───────────────────────────────────────────────

def test_stats_empty():
    resp = client.get("/api/v1/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert data["components"] == 0
    assert data["agents"] == 0


def test_stats_with_data():
    _seed_agent()
    _seed_component()
    resp = client.get("/api/v1/stats")
    data = resp.json()
    assert data["components"] == 1
    assert data["agents"] == 1


# ─── Component List ─────────────────────────────────────

def test_list_components_empty():
    resp = client.get("/api/v1/components")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["components"] == []


def test_list_components_pagination():
    _seed_agent()
    for i in range(5):
        _seed_component(f"comp-{i}")
    resp = client.get("/api/v1/components?skip=2&limit=2")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 5
    assert len(data["components"]) == 2


# ─── Component Detail ───────────────────────────────────

def test_get_component_not_found():
    resp = client.get("/api/v1/components/nonexistent")
    assert resp.status_code == 404


def test_get_component():
    _seed_agent()
    _seed_component("my-comp")
    resp = client.get("/api/v1/components/my-comp")
    assert resp.status_code == 200
    assert resp.json()["id"] == "my-comp"


# ─── Search ──────────────────────────────────────────────

def test_search_components():
    _seed_agent()
    _seed_component("search-target")
    resp = client.get("/api/v1/components/search?q=Test")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1


def test_search_no_results():
    resp = client.get("/api/v1/components/search?q=nonexistentkeyword")
    assert resp.status_code == 200
    assert resp.json()["total"] == 0


# ─── Auth ────────────────────────────────────────────────

def test_create_component_no_auth():
    """POST without auth header should return 422 (missing header) or 401."""
    resp = client.post("/api/v1/components", json={
        "id": "test-new",
        "display_name": "New Comp",
        "description": "A brand new component for testing",
    })
    assert resp.status_code in (401, 422)


def test_create_component_bad_key():
    resp = client.post(
        "/api/v1/components",
        json={
            "id": "test-new",
            "display_name": "New Comp",
            "description": "A brand new component for testing",
        },
        headers={"Authorization": "Bearer wrong-key"},
    )
    assert resp.status_code == 401


def test_create_component_success():
    """W7: seed active agent → create component → verify 201."""
    api_key = "rwc_sk_live_creator"
    _seed_agent("ag_creator", api_key)
    resp = client.post(
        "/api/v1/components",
        json={
            "id": "new-component",
            "display_name": "My New Component",
            "description": "A brand new component for testing creation",
            "version": "1.0.0",
            "tags": ["test", "widget"],
            "capabilities": ["print"],
        },
        headers={"Authorization": f"Bearer {api_key}"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["id"] == "new-component"
    assert data["display_name"] == "My New Component"
    assert data["version"] == "1.0.0"
    assert data["status"] == "unverified"
    assert data["author_id"] == "ag_creator"
    assert "test" in data["tags"]
