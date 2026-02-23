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
    from api.database import init_db
    init_db()  # ensure schema is up to date
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
    "auto_match": True,
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
        """消息中sender显示为"Customer"/"Maker"而非真名"""
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
        assert msg["sender_display"] == "Customer"
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
        assert msg["sender_display"] == "Maker"
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
            assert m["sender_display"] in ("Customer", "Maker", "平台")

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


# ─── Enhanced Order Matching Tests ───────────────────────

class TestEnhancedOrders:
    """Test enhanced order functionality with file_id, auto_match, etc."""

    def test_create_order_with_file_id(self):
        """Test creating order with attached file."""
        _seed_world()
        
        # First create a file (mock file creation)
        with get_db() as db:
            file_id = "test-file-id-123"
            db.execute("""
                INSERT INTO files (
                    id, filename, original_filename, size, file_type, mime_type,
                    file_path, uploader_id, uploader_type, uploaded_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                file_id, "test.stl", "test.stl", 1024, ".stl", "model/stl",
                "/tmp/test.stl", "customer_001", "agent", "2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z"
            ))
        
        order_data = {
            "component_id": "servo-bracket",
            "quantity": 2,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
            "file_id": file_id,
            "material": "PLA",
            "color": "red",
            "auto_match": False
        }
        
        resp = client.post("/api/v1/orders", json=order_data, headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 201
        
        # Verify order was created with enhanced fields
        with get_db() as db:
            order = db.execute(
                "SELECT * FROM orders WHERE order_number = ?", 
                (resp.json()["order_number"],)
            ).fetchone()
            assert order["file_id"] == file_id
            assert order["material"] == "PLA"
            assert order["color"] == "red"
            assert order["auto_match"] == 0

    def test_create_order_with_auto_match(self):
        """Test creating order with auto-matching enabled."""
        _seed_world()
        
        order_data = {
            "component_id": "servo-bracket",
            "quantity": 1,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
            "material": "ABS",
            "auto_match": True
        }
        
        resp = client.post("/api/v1/orders", json=order_data, headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 201
        
        # Verify auto_match was set
        with get_db() as db:
            order = db.execute(
                "SELECT * FROM orders WHERE order_number = ?", 
                (resp.json()["order_number"],)
            ).fetchone()
            assert order["auto_match"] == 1

    def test_create_order_with_invalid_file_id(self):
        """Test creating order with non-existent file ID."""
        _seed_world()
        
        order_data = {
            "component_id": "servo-bracket",
            "quantity": 1,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
            "file_id": "nonexistent-file-id"
        }
        
        resp = client.post("/api/v1/orders", json=order_data, headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 400
        assert "File not found" in resp.json()["detail"]

    def test_get_available_orders(self):
        """Test getting orders available for makers."""
        _seed_world()
        
        # Create some orders
        order1_data = {
            "component_id": "servo-bracket",
            "quantity": 1,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
        }
        
        order2_data = {
            "component_id": "wheel-hub",
            "quantity": 2,
            "delivery_province": "北京市",
            "delivery_city": "朝阳区",
            "delivery_district": "望京",
            "delivery_address": "SOHO 1号",
        }
        
        client.post("/api/v1/orders", json=order1_data, headers=_auth(CUSTOMER_KEY))
        client.post("/api/v1/orders", json=order2_data, headers=_auth(CUSTOMER_KEY))
        
        # Get available orders as a maker
        resp = client.get("/api/v1/orders/available", headers=_auth(MAKER_KEY))
        assert resp.status_code == 200
        
        data = resp.json()
        assert "available_orders" in data
        assert data["total"] >= 2  # Should have at least the 2 we created
        
        # All orders should be pending with no maker assigned
        for order in data["available_orders"]:
            assert order["status"] == "pending"

    def test_get_available_orders_not_maker(self):
        """Test getting available orders when not registered as maker."""
        _seed_world()  # seed customer agent so auth works
        resp = client.get("/api/v1/orders/available", headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 403
        assert "Not registered as a maker" in resp.json()["detail"]

    def test_claim_order(self):
        """Test maker claiming an order."""
        _seed_world()
        
        # Create an order
        order_data = {
            "component_id": "servo-bracket",
            "quantity": 1,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
        }
        
        order_resp = client.post("/api/v1/orders", json=order_data, headers=_auth(CUSTOMER_KEY))
        order_id = order_resp.json()["order_id"]
        
        # Claim the order as a maker
        resp = client.post(f"/api/v1/orders/{order_id}/claim", headers=_auth(MAKER_KEY))
        assert resp.status_code == 200
        assert resp.json()["status"] == "accepted"
        
        # Verify order status changed
        with get_db() as db:
            order = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
            assert order["status"] == "accepted"
            assert order["maker_id"] is not None

    def test_claim_nonexistent_order(self):
        """Test claiming non-existent order."""
        _seed_world()
        
        resp = client.post("/api/v1/orders/nonexistent-id/claim", headers=_auth(MAKER_KEY))
        assert resp.status_code == 404
        assert "Order not found" in resp.json()["detail"]

    def test_claim_already_assigned_order(self):
        """Test claiming order that's already assigned."""
        _seed_world()
        
        # Create and claim an order
        order_data = {
            "component_id": "servo-bracket",
            "quantity": 1,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
        }
        
        order_resp = client.post("/api/v1/orders", json=order_data, headers=_auth(CUSTOMER_KEY))
        order_id = order_resp.json()["order_id"]
        
        # First maker claims
        client.post(f"/api/v1/orders/{order_id}/claim", headers=_auth(MAKER_KEY))
        
        # Second attempt should fail
        resp = client.post(f"/api/v1/orders/{order_id}/claim", headers=_auth(MAKER_KEY))
        assert resp.status_code == 400
        assert resp.json()["detail"] in ("Order already assigned", "Order is not available")

    def test_complete_order(self):
        """Test maker completing an order."""
        _seed_world()
        
        # Create and claim an order
        order_data = {
            "component_id": "servo-bracket",
            "quantity": 1,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
        }
        
        order_resp = client.post("/api/v1/orders", json=order_data, headers=_auth(CUSTOMER_KEY))
        order_id = order_resp.json()["order_id"]
        
        # Claim the order
        client.post(f"/api/v1/orders/{order_id}/claim", headers=_auth(MAKER_KEY))
        
        # Complete the order
        resp = client.post(f"/api/v1/orders/{order_id}/complete", headers=_auth(MAKER_KEY))
        assert resp.status_code == 200
        assert resp.json()["status"] == "completed"
        
        # Verify order status
        with get_db() as db:
            order = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
            assert order["status"] == "completed"

    def test_complete_order_not_maker(self):
        """Test completing order when not the assigned maker."""
        _seed_world()
        
        # Create and accept an order
        order_data = {
            "component_id": "servo-bracket",
            "quantity": 1,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
        }
        
        order_resp = client.post("/api/v1/orders", json=order_data, headers=_auth(CUSTOMER_KEY))
        order_id = order_resp.json()["order_id"]
        
        # Customer tries to complete (should fail)
        resp = client.post(f"/api/v1/orders/{order_id}/complete", headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 403

    def test_cancel_order_customer(self):
        """Test customer cancelling an order."""
        _seed_world()
        
        # Create an order
        order_data = {
            "component_id": "servo-bracket",
            "quantity": 1,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
        }
        
        order_resp = client.post("/api/v1/orders", json=order_data, headers=_auth(CUSTOMER_KEY))
        order_id = order_resp.json()["order_id"]
        
        # Cancel the order
        resp = client.post(f"/api/v1/orders/{order_id}/cancel", headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"
        
        # Verify order status
        with get_db() as db:
            order = db.execute("SELECT * FROM orders WHERE id = ?", (order_id,)).fetchone()
            assert order["status"] == "cancelled"

    def test_cancel_order_maker(self):
        """Test maker cancelling a claimed order."""
        _seed_world()
        
        # Create and claim an order
        order_data = {
            "component_id": "servo-bracket",
            "quantity": 1,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
        }
        
        order_resp = client.post("/api/v1/orders", json=order_data, headers=_auth(CUSTOMER_KEY))
        order_id = order_resp.json()["order_id"]
        
        # Claim the order
        client.post(f"/api/v1/orders/{order_id}/claim", headers=_auth(MAKER_KEY))
        
        # Maker cancels the order
        resp = client.post(f"/api/v1/orders/{order_id}/cancel", headers=_auth(MAKER_KEY))
        assert resp.status_code == 200
        assert resp.json()["status"] == "cancelled"

    def test_cancel_completed_order_fails(self):
        """Test that completed orders cannot be cancelled."""
        _seed_world()
        
        # Create, claim, and complete an order
        order_data = {
            "component_id": "servo-bracket",
            "quantity": 1,
            "delivery_province": "广东省",
            "delivery_city": "深圳市",
            "delivery_district": "南山区",
            "delivery_address": "科技园1号",
        }
        
        order_resp = client.post("/api/v1/orders", json=order_data, headers=_auth(CUSTOMER_KEY))
        order_id = order_resp.json()["order_id"]
        
        # Claim and complete the order
        client.post(f"/api/v1/orders/{order_id}/claim", headers=_auth(MAKER_KEY))
        client.post(f"/api/v1/orders/{order_id}/complete", headers=_auth(MAKER_KEY))
        
        # Try to cancel - should fail
        resp = client.post(f"/api/v1/orders/{order_id}/cancel", headers=_auth(CUSTOMER_KEY))
        assert resp.status_code == 400
        assert "Order cannot be cancelled" in resp.json()["detail"]
