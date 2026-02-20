"""打印农场 API 测试 — 暖羊羊🐑 QA"""

from __future__ import annotations

import json
import secrets
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from api.database import get_db, init_db
from api.main import app

client = TestClient(app)


# ─── Fixtures ────────────────────────────────────────────

@pytest.fixture(autouse=True)
def _setup_db(tmp_path, monkeypatch):
    import api.database as db_mod
    monkeypatch.setattr(db_mod, "DB_PATH", tmp_path / "test.db")
    init_db()
    yield


def _seed_agent(agent_id: str = "ag_farmer01", api_key: str = "rwc_sk_farmer") -> str:
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        db.execute(
            """INSERT OR IGNORE INTO agents
               (id, name, display_name, description, type, status,
                reputation, tier, api_key, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (agent_id, f"farm-{secrets.token_hex(3)}", "Farm Agent",
             "A test farm agent", "openclaw", "active",
             0, "newcomer", api_key, now, now),
        )
    return agent_id


def _auth(api_key: str = "rwc_sk_farmer") -> dict:
    return {"Authorization": f"Bearer {api_key}"}


FARM_BODY = {
    "printer_model": "P1S",
    "printer_brand": "Bambu Lab",
    "build_volume_x": 256,
    "build_volume_y": 256,
    "build_volume_z": 256,
    "materials": ["PLA", "PETG"],
    "location_province": "广东省",
    "location_city": "深圳市",
    "location_district": "南山区",
    "availability": "open",
    "pricing_per_hour_cny": 15.0,
    "description": "拓竹P1S高速打印",
}


def _register_farm(api_key: str = "rwc_sk_farmer") -> dict:
    resp = client.post("/api/v1/farms/register", json=FARM_BODY, headers=_auth(api_key))
    assert resp.status_code == 201
    return resp.json()


# ─── 注册农场 ────────────────────────────────────────────

class TestFarmRegister:
    def test_register_success(self):
        _seed_agent()
        data = _register_farm()
        assert data["id"]
        assert data["printer_model"] == "P1S"
        assert data["location_district"] == "南山区"  # owner视角可见

    def test_register_no_auth_401(self):
        resp = client.post("/api/v1/farms/register", json=FARM_BODY)
        assert resp.status_code in (401, 422)

    def test_register_bad_key_401(self):
        resp = client.post("/api/v1/farms/register", json=FARM_BODY,
                           headers={"Authorization": "Bearer wrong"})
        assert resp.status_code == 401


# ─── 浏览农场列表 ────────────────────────────────────────

class TestFarmList:
    def test_list_empty(self):
        resp = client.get("/api/v1/farms")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_no_owner_info(self):
        """公开列表不暴露owner_id和location_district"""
        _seed_agent()
        _register_farm()
        resp = client.get("/api/v1/farms")
        assert resp.status_code == 200
        farms = resp.json()
        assert len(farms) == 1
        farm = farms[0]
        assert "owner_id" not in farm
        assert "location_district" not in farm
        assert farm["location_province"] == "广东省"
        assert farm["location_city"] == "深圳市"

    def test_list_filter_by_province(self):
        _seed_agent()
        _register_farm()
        resp = client.get("/api/v1/farms?province=广东省")
        assert len(resp.json()) == 1
        resp = client.get("/api/v1/farms?province=北京市")
        assert len(resp.json()) == 0

    def test_list_filter_by_material(self):
        _seed_agent()
        _register_farm()
        assert len(client.get("/api/v1/farms?material=PLA").json()) == 1
        assert len(client.get("/api/v1/farms?material=ABS").json()) == 0


# ─── 农场详情 ────────────────────────────────────────────

class TestFarmDetail:
    def test_detail_privacy(self):
        """公开详情不泄露owner_id、location_district"""
        _seed_agent()
        farm = _register_farm()
        resp = client.get(f"/api/v1/farms/{farm['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert "owner_id" not in data
        assert "location_district" not in data
        assert data["printer_brand"] == "Bambu Lab"

    def test_detail_not_found(self):
        resp = client.get("/api/v1/farms/nonexistent")
        assert resp.status_code == 404


# ─── 更新农场状态 ────────────────────────────────────────

class TestFarmStatus:
    def test_update_status(self):
        _seed_agent()
        farm = _register_farm()
        resp = client.put(
            f"/api/v1/farms/{farm['id']}/status",
            json={"availability": "busy"},
            headers=_auth(),
        )
        assert resp.status_code == 200
        assert resp.json()["availability"] == "busy"

    def test_update_status_not_owner(self):
        _seed_agent("ag_farmer01", "rwc_sk_farmer")
        _seed_agent("ag_farmer02", "rwc_sk_other")
        farm = _register_farm("rwc_sk_farmer")
        resp = client.put(
            f"/api/v1/farms/{farm['id']}/status",
            json={"availability": "offline"},
            headers=_auth("rwc_sk_other"),
        )
        assert resp.status_code == 403

    def test_update_status_no_auth(self):
        resp = client.put("/api/v1/farms/x/status", json={"availability": "busy"})
        assert resp.status_code in (401, 422)
