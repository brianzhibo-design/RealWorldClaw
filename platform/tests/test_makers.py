"""Maker Network API 测试 - RealWorldClaw QA Team"""

from __future__ import annotations

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


def _seed_agent(agent_id: str = "ag_maker01", api_key: str = "rwc_sk_maker") -> str:
    now = datetime.now(timezone.utc).isoformat()
    with get_db() as db:
        db.execute(
            """INSERT OR IGNORE INTO agents
               (id, name, display_name, description, type, status,
                reputation, tier, api_key, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (agent_id, f"maker-{secrets.token_hex(3)}", "Maker Agent",
             "A test maker agent", "openclaw", "active",
             0, "newcomer", api_key, now, now),
        )
    return agent_id


def _auth(api_key: str = "rwc_sk_maker") -> dict:
    return {"Authorization": f"Bearer {api_key}"}


MAKER_BODY = {
    "maker_type": "maker",
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

BUILDER_BODY = {
    **MAKER_BODY,
    "maker_type": "builder",
    "description": "全栈Builder，打印+组装+测试一条龙",
}


def _register_maker(api_key: str = "rwc_sk_maker", body: dict = None) -> dict:
    resp = client.post("/api/v1/makers/register", json=body or MAKER_BODY, headers=_auth(api_key))
    assert resp.status_code == 201
    return resp.json()


# ─── 注册Maker ──────────────────────────────────────────

class TestMakerRegister:
    def test_register_maker_success(self):
        _seed_agent()
        data = _register_maker()
        assert data["id"]
        assert data["maker_type"] == "maker"
        assert data["printer_model"] == "P1S"
        assert data["location_district"] == "南山区"  # owner视角可见
        assert data["capabilities"] == ["printing"]

    def test_register_builder_success(self):
        _seed_agent()
        data = _register_maker(body=BUILDER_BODY)
        assert data["maker_type"] == "builder"
        assert "assembly" in data["capabilities"]
        assert "testing" in data["capabilities"]
        assert "printing" in data["capabilities"]

    def test_register_no_auth_401(self):
        resp = client.post("/api/v1/makers/register", json=MAKER_BODY)
        assert resp.status_code in (401, 422)

    def test_register_bad_key_401(self):
        resp = client.post("/api/v1/makers/register", json=MAKER_BODY,
                           headers={"Authorization": "Bearer wrong"})
        assert resp.status_code == 401


# ─── 浏览Maker列表 ──────────────────────────────────────

class TestMakerList:
    def test_list_empty(self):
        resp = client.get("/api/v1/makers")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_no_owner_info(self):
        """公开列表不暴露owner_id和location_district"""
        _seed_agent()
        _register_maker()
        resp = client.get("/api/v1/makers")
        assert resp.status_code == 200
        makers = resp.json()
        assert len(makers) == 1
        maker = makers[0]
        assert "owner_id" not in maker
        assert "location_district" not in maker
        assert maker["location_province"] == "广东省"
        assert maker["location_city"] == "深圳市"
        assert maker["maker_type"] == "maker"

    def test_list_filter_by_province(self):
        _seed_agent()
        _register_maker()
        resp = client.get("/api/v1/makers?province=广东省")
        assert len(resp.json()) == 1
        resp = client.get("/api/v1/makers?province=北京市")
        assert len(resp.json()) == 0

    def test_list_filter_by_material(self):
        _seed_agent()
        _register_maker()
        assert len(client.get("/api/v1/makers?material=PLA").json()) == 1
        assert len(client.get("/api/v1/makers?material=ABS").json()) == 0

    def test_list_filter_by_maker_type(self):
        _seed_agent("ag_maker01", "rwc_sk_maker")
        _seed_agent("ag_builder01", "rwc_sk_builder")
        _register_maker("rwc_sk_maker", MAKER_BODY)
        _register_maker("rwc_sk_builder", BUILDER_BODY)
        
        # 只看maker
        resp = client.get("/api/v1/makers?maker_type=maker")
        makers = resp.json()
        assert all(m["maker_type"] == "maker" for m in makers)
        
        # 只看builder
        resp = client.get("/api/v1/makers?maker_type=builder")
        builders = resp.json()
        assert all(m["maker_type"] == "builder" for m in builders)


# ─── Maker详情 ──────────────────────────────────────────

class TestMakerDetail:
    def test_detail_privacy(self):
        """公开详情不泄露owner_id、location_district"""
        _seed_agent()
        maker = _register_maker()
        resp = client.get(f"/api/v1/makers/{maker['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert "owner_id" not in data
        assert "location_district" not in data
        assert data["printer_brand"] == "Bambu Lab"
        assert data["maker_type"] == "maker"

    def test_detail_not_found(self):
        resp = client.get("/api/v1/makers/nonexistent")
        assert resp.status_code == 404


# ─── 更新Maker状态 ──────────────────────────────────────

class TestMakerStatus:
    def test_update_status(self):
        _seed_agent()
        maker = _register_maker()
        resp = client.put(
            f"/api/v1/makers/{maker['id']}/status",
            json={"availability": "busy"},
            headers=_auth(),
        )
        assert resp.status_code == 200
        assert resp.json()["availability"] == "busy"

    def test_update_status_not_owner(self):
        _seed_agent("ag_maker01", "rwc_sk_maker")
        _seed_agent("ag_maker02", "rwc_sk_other")
        maker = _register_maker("rwc_sk_maker")
        resp = client.put(
            f"/api/v1/makers/{maker['id']}/status",
            json={"availability": "offline"},
            headers=_auth("rwc_sk_other"),
        )
        assert resp.status_code == 403

    def test_update_status_no_auth(self):
        resp = client.put("/api/v1/makers/x/status", json={"availability": "busy"})
        assert resp.status_code in (401, 422)
