"""Shared test fixtures - RealWorldClaw QA Team

提供：test_client, auth_headers, maker_headers, admin_headers
每个测试模块用独立临时数据库。
"""
from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True, scope="session")
def _patch_env():
    """Ensure required env vars are set before any import."""
    os.environ.setdefault("RWC_API_KEY", "test-key-for-ci")
    os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")
    os.environ["TESTING"] = "1"


@pytest.fixture()
def tmp_db(tmp_path):
    """Create a fresh temporary database for each test."""
    db_file = tmp_path / "test.db"
    import api.database as db_mod
    original = db_mod.DB_PATH
    db_mod.DB_PATH = db_file

    from api.database import init_db
    from api.audit import init_audit_table
    init_db()
    init_audit_table()

    yield db_file

    db_mod.DB_PATH = original


@pytest.fixture()
def client(tmp_db):
    """TestClient with isolated database and reset rate limiter."""
    from api.rate_limit import _bucket
    _bucket._hits.clear()
    from api.main import app
    with TestClient(app) as c:
        yield c


API = "/api/v1"


def _agent_auth(client: TestClient, name: str, desc: str) -> dict:
    """Register + claim an agent, return auth headers."""
    r = client.post(f"{API}/agents/register", json={
        "name": name,
        "display_name": name.title(),
        "description": desc,
    })
    assert r.status_code == 201
    data = r.json()
    api_key = data["api_key"]
    claim_token = data["claim_url"].split("token=")[1]
    r2 = client.post(f"{API}/agents/claim", params={
        "claim_token": claim_token,
        "human_email": f"{name}@test.com",
    })
    assert r2.status_code == 200
    return {"Authorization": f"Bearer {api_key}"}


@pytest.fixture()
def auth_headers(client):
    """Authenticated agent (regular user) headers."""
    return _agent_auth(client, "test-user", "A regular test user for QA testing purposes")


@pytest.fixture()
def maker_headers(client):
    """Authenticated maker agent headers + maker_id."""
    headers = _agent_auth(client, "test-maker", "A maker agent for QA testing purposes")
    # Register as maker
    r = client.post(f"{API}/makers/register", headers=headers, json={
        "maker_type": "builder",
        "printer_model": "P2S",
        "printer_brand": "Bambu Lab",
        "build_volume_x": 256, "build_volume_y": 256, "build_volume_z": 256,
        "materials": ["PLA", "PETG"],
        "location_province": "上海市",
        "location_city": "上海市",
        "location_district": "浦东新区",
        "availability": "open",
        "pricing_per_hour_cny": 15.0,
    })
    assert r.status_code == 201
    headers["_maker_id"] = r.json()["id"]
    return headers


@pytest.fixture()
def admin_headers(client, tmp_db):
    """Admin user headers (JWT-based auth for admin endpoints)."""
    from api.database import get_db
    from api.security import create_access_token, hash_password
    import uuid
    from datetime import datetime, timezone

    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    hashed = hash_password("adminpass123")

    with get_db() as db:
        db.execute(
            """INSERT INTO users (id, email, username, hashed_password, role, is_active, created_at, updated_at)
               VALUES (?, ?, ?, ?, 'admin', 1, ?, ?)""",
            (user_id, "admin@test.com", "testadmin", hashed, now, now),
        )

    token = create_access_token({"sub": user_id, "role": "admin"})
    return {"Authorization": f"Bearer {token}"}
