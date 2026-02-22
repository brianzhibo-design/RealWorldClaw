"""订单系统 API 测试 - RealWorldClaw QA Team"""

from __future__ import annotations

import secrets
from datetime import datetime, timezone

import pytest
from fastapi.testclient import TestClient

from api.database import get_db, init_db
from api.main import app

client = TestClient(app)

CUSTOMER_KEY = "rwc_sk_customer"
MAKER_KEY = "rwc_sk_maker"


# ─── Fixtures ────────────────────────────────────────────

@pytest.fixture(autouse=True)
def _setup_db(tmp_path, monkeypatch):
    import api.database as db_mod
    monkeypatch.setattr(db_mod, "DB_PATH", tmp_path / "test.db")
    init_db()
    yield


def _auth(api_key: str) -> dict:
    return {"Authorization": f"Bearer {api_key}"}


def _seed_agent(agent_id: str, api_key: str, name: str | None = None) -> str:
    now = datetime.now(timezone.utc).isoformat()
    name = name or f"agent-{secrets.token_hex(3)}"
    with get_db() as db:
        db.execute(
            """INSERT OR IGNORE INTO agents
               (id, name, display_name, description, type, status,
                reputation, tier, api_key, created_at, updated_at)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (agent_id, name, f"Display {agent_id}",
             "Test agent for orders", "openclaw", "active",
             0, "newcomer", api_key, now, now),
        )
    return agent_id


def _seed_world():
    """创建买家 + 制造者 + Maker，返回 (customer_id, maker_id, maker_reg_id)"""
    customer_id = _seed_agent("ag_customer", CUSTOMER_KEY, "buyer")
    maker_id = _seed_agent("ag_maker", MAKER_KEY, "maker")

    # 注册Maker
    resp = client.post("/api/v1/makers/register", json={
        "maker_type": "maker",
        "printer_model": "P1S",
        "printer_brand": "Bambu Lab",
        "build_volume_x": 256, "build_volume_y": 256, "build_volume_z": 256,
        "materials": ["PLA", "PETG"],
        "location_province": "广东省",
        "location_city": "深圳市",
        "location_district": "南山区",
        "availability": "open",
        "pricing_per_hour_cny": 15.0,
    }, headers=_auth(MAKER_KEY))
    assert resp.status_code == 201
    maker_reg_id = resp.json()["id"]
    return customer_id, maker_id, maker_reg_id


ORDER_BODY = {
    "component_id": "test-component",
    "quantity": 2,
    "material_preference": "PLA",
    "delivery_province": "广东省",
    "delivery_city": "深圳市",
    "delivery_district": "福田区",
    "delivery_address": "福田区某某路123号",
    "urgency": "normal",
    "notes": "请用白色PLA",
}


def _create_order() -> dict:
    resp = client.post("/api/v1/orders", json=ORDER_BODY, headers=_auth(CUSTOMER_KEY))
    assert resp.status_code == 201
    return resp.json()


# ─── 创建订单 ────────────────────────────────────────────

class TestOrderCreate:
    def test_create_success(self):
        _seed_world()
        data = _create_order()
        assert data["order_id"]
        assert data["order_number"].startswith("RWC-")
        assert data["status"] == "pending"

    def test_create_no_auth(self):
        resp = client.post("/api/v1/orders", json=ORDER_BODY)
        assert resp.status_code in (401, 422)


# ─── 订单列表 ────────────────────────────────────────────

class TestOrderList:
    def test_list_as_customer(self):
        _seed_world()
        _create_order()
        resp = client.get("/api/v1/orders", headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["as_customer"]) == 1
        assert len(data["as_maker"]) == 0

    def test_list_as_maker(self):
        _seed_world()
        _create_order()
        resp = client.get("/api/v1/orders", headers=_auth(MAKER_KEY))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["as_maker"]) >= 1


# ─── 订单详情 — 隐私 ────────────────────────────────────

class TestOrderDetailPrivacy:
    def test_customer_view_no_farmer_info(self):
        """买家看不到制造者信息"""
        _seed_world()
        order = _create_order()
        resp = client.get(f"/api/v1/orders/{order['order_id']}", headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "customer"
        view = data["order"]
        # 不应包含制造者收入、配送省市以外信息
        assert "maker_income_cny" not in view
        assert "delivery_address" not in view
        assert "delivery_district" not in view
        assert "customer_id" not in view
        assert "maker_id" not in view
        assert "maker_display" in view

    def test_farmer_view_no_buyer_address(self):
        """制造者看不到买家详细地址"""
        _seed_world()
        order = _create_order()
        resp = client.get(f"/api/v1/orders/{order['order_id']}", headers=_auth(MAKER_KEY))
        assert resp.status_code == 200
        data = resp.json()
        assert data["role"] == "maker"
        view = data["order"]
        # 只有省+市，没有区和地址
        assert "delivery_address" not in view
        assert "delivery_district" not in view
        assert view["delivery_province"] == "广东省"
        assert view["delivery_city"] == "深圳市"
        # 不应包含买家ID和总价
        assert "customer_id" not in view
        assert "price_total_cny" not in view

    def test_unrelated_agent_403(self):
        _seed_world()
        _seed_agent("ag_stranger", "rwc_sk_stranger", "stranger")
        order = _create_order()
        resp = client.get(f"/api/v1/orders/{order['order_id']}", headers=_auth("rwc_sk_stranger"))
        assert resp.status_code == 403


# ─── 接单流程 ────────────────────────────────────────────

class TestOrderAccept:
    def test_accept_flow(self):
        _seed_world()
        order = _create_order()
        oid = order["order_id"]

        # 制造者接单
        resp = client.put(
            f"/api/v1/orders/{oid}/accept",
            json={"estimated_hours": 24},
            headers=_auth(MAKER_KEY),
        )
        assert resp.status_code == 200
        assert resp.json()["status"] == "accepted"

    def test_customer_cannot_accept(self):
        _seed_world()
        order = _create_order()
        resp = client.put(
            f"/api/v1/orders/{order['order_id']}/accept",
            json={"estimated_hours": 24},
            headers=_auth(CUSTOMER_KEY),
        )
        assert resp.status_code == 403

    def test_accept_non_pending_fails(self):
        _seed_world()
        order = _create_order()
        oid = order["order_id"]
        # accept once
        client.put(f"/api/v1/orders/{oid}/accept", json={"estimated_hours": 24}, headers=_auth(MAKER_KEY))
        # accept again → 400
        resp = client.put(f"/api/v1/orders/{oid}/accept", json={"estimated_hours": 24}, headers=_auth(MAKER_KEY))
        assert resp.status_code == 400


# ─── 订单消息 ────────────────────────────────────────────

class TestOrderMessages:
    def test_message_sender_display(self):
        """消息中sender显示为"客户"/"制造商"而非真名"""
        _seed_world()
        order = _create_order()
        oid = order["order_id"]

        # 买家发消息
        resp = client.post(
            f"/api/v1/orders/{oid}/messages",
            json={"message": "你好，请问什么时候能开始打印？"},
            headers=_auth(CUSTOMER_KEY),
        )
        assert resp.status_code == 201
        msg = resp.json()
        assert msg["sender_display"] == "客户"
        assert msg["sender_role"] == "customer"

        # 制造者发消息
        # 先接单才有farmer角色
        client.put(f"/api/v1/orders/{oid}/accept", json={"estimated_hours": 24}, headers=_auth(MAKER_KEY))
        resp = client.post(
            f"/api/v1/orders/{oid}/messages",
            json={"message": "已开始打印"},
            headers=_auth(MAKER_KEY),
        )
        assert resp.status_code == 201
        msg = resp.json()
        assert msg["sender_display"] == "制造商"
        assert msg["sender_role"] == "maker"

    def test_get_messages_anonymized(self):
        """获取消息列表也不暴露真名"""
        _seed_world()
        order = _create_order()
        oid = order["order_id"]

        client.post(f"/api/v1/orders/{oid}/messages",
                     json={"message": "hi"}, headers=_auth(CUSTOMER_KEY))

        resp = client.get(f"/api/v1/orders/{oid}/messages", headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 200
        msgs = resp.json()
        assert len(msgs) >= 1
        for m in msgs:
            assert "sender_id" not in m
            assert m["sender_display"] in ("客户", "制造商", "平台")

    def test_stranger_cannot_message(self):
        _seed_world()
        _seed_agent("ag_stranger", "rwc_sk_stranger", "stranger")
        order = _create_order()
        resp = client.post(
            f"/api/v1/orders/{order['order_id']}/messages",
            json={"message": "hacked"},
            headers=_auth("rwc_sk_stranger"),
        )
        assert resp.status_code == 403


# ─── 评价 ────────────────────────────────────────────────

class TestOrderReview:
    def _complete_order(self) -> str:
        """走完整个流程到completed"""
        _seed_world()
        order = _create_order()
        oid = order["order_id"]

        # accept → printing → quality_check → shipping → delivered → confirm
        client.put(f"/api/v1/orders/{oid}/accept", json={"estimated_hours": 24}, headers=_auth(MAKER_KEY))
        client.put(f"/api/v1/orders/{oid}/status", json={"status": "printing"}, headers=_auth(MAKER_KEY))
        client.put(f"/api/v1/orders/{oid}/status", json={"status": "quality_check"}, headers=_auth(MAKER_KEY))
        client.put(f"/api/v1/orders/{oid}/status", json={"status": "shipping"}, headers=_auth(MAKER_KEY))
        client.put(f"/api/v1/orders/{oid}/status", json={"status": "delivered"}, headers=_auth(MAKER_KEY))
        client.post(f"/api/v1/orders/{oid}/confirm", headers=_auth(CUSTOMER_KEY))
        return oid

    def test_review_success(self):
        oid = self._complete_order()
        resp = client.post(
            f"/api/v1/orders/{oid}/review",
            json={"rating": 5, "comment": "非常好！"},
            headers=_auth(CUSTOMER_KEY),
        )
        assert resp.status_code == 201
        assert resp.json()["rating"] == 5

    def test_review_not_completed_fails(self):
        _seed_world()
        order = _create_order()
        resp = client.post(
            f"/api/v1/orders/{order['order_id']}/review",
            json={"rating": 5},
            headers=_auth(CUSTOMER_KEY),
        )
        assert resp.status_code == 400

    def test_review_duplicate_fails(self):
        oid = self._complete_order()
        client.post(f"/api/v1/orders/{oid}/review", json={"rating": 5}, headers=_auth(CUSTOMER_KEY))
        resp = client.post(f"/api/v1/orders/{oid}/review", json={"rating": 4}, headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 400

    def test_farmer_cannot_review(self):
        oid = self._complete_order()
        resp = client.post(
            f"/api/v1/orders/{oid}/review",
            json={"rating": 5},
            headers=_auth(MAKER_KEY),
        )
        assert resp.status_code == 403
