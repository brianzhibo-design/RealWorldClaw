"""E2E测试增强版 — 暖羊羊🐑出品

完整用户旅程：
1. 用户注册→登录→获取token→浏览模块→创建订单→Maker接单→打印进度→完成
2. Maker注册→设置能力标签→匹配订单→接单→更新进度→完成
3. Admin查看统计→审计日志→健康检查
4. 错误场景：重复注册、错误密码、无权限访问、不存在的资源
"""
from __future__ import annotations

import pytest

API = "/api/v1"


# ═══════════════════════════════════════════════════════════
# Journey 1: 完整用户购买旅程
# ═══════════════════════════════════════════════════════════

class TestUserBuyerJourney:
    """用户注册→登录→浏览→下单→收货→评价"""

    def test_user_register(self, client):
        r = client.post(f"{API}/auth/register", json={
            "email": "buyer@example.com",
            "username": "buyer_wang",
            "password": "securepass123",
        })
        assert r.status_code == 201
        data = r.json()
        assert data["email"] == "buyer@example.com"
        assert data["username"] == "buyer_wang"
        assert data["role"] == "user"
        assert data["is_active"] is True

    def test_user_login(self, client):
        # Register first
        client.post(f"{API}/auth/register", json={
            "email": "login@example.com", "username": "loginuser", "password": "securepass123",
        })
        r = client.post(f"{API}/auth/login", json={
            "email": "login@example.com", "password": "securepass123",
        })
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_get_me_with_token(self, client):
        client.post(f"{API}/auth/register", json={
            "email": "me@example.com", "username": "meuser", "password": "securepass123",
        })
        login = client.post(f"{API}/auth/login", json={
            "email": "me@example.com", "password": "securepass123",
        }).json()
        r = client.get(f"{API}/auth/me", headers={
            "Authorization": f"Bearer {login['access_token']}"
        })
        assert r.status_code == 200
        assert r.json()["email"] == "me@example.com"

    def test_browse_components(self, client, auth_headers):
        r = client.get(f"{API}/components")
        assert r.status_code == 200
        data = r.json()
        assert "total" in data
        assert "components" in data
        assert isinstance(data["components"], list)

    def test_full_order_lifecycle(self, client, auth_headers, maker_headers):
        """完整订单生命周期：下单→接单→打印→质检→发货→确认→评价"""
        # Upload a component
        r = client.post(f"{API}/components", headers=auth_headers, json={
            "id": "e2e-test-comp",
            "display_name": "E2E Test Component",
            "description": "A component for end-to-end testing purposes",
            "material": "PLA",
            "tags": ["test"],
        })
        assert r.status_code == 201

        # Create order
        r = client.post(f"{API}/orders", headers=auth_headers, json={
            "component_id": "e2e-test-comp",
            "order_type": "print_only",
            "quantity": 1,
            "material_preference": "PLA",
            "delivery_province": "上海市",
            "delivery_city": "上海市",
            "delivery_district": "浦东新区",
            "delivery_address": "上海市浦东新区张江路100号",
            "urgency": "normal",
            "notes": "E2E test order",
        })
        assert r.status_code == 201
        order_id = r.json()["order_id"]
        assert r.json()["status"] == "pending"

        # Maker accepts
        r = client.put(f"{API}/orders/{order_id}/accept", headers=maker_headers, json={
            "estimated_hours": 4.0,
        })
        assert r.status_code == 200
        assert r.json()["status"] == "accepted"

        # Status transitions: printing → quality_check → shipping
        for status in ["printing", "quality_check", "shipping"]:
            r = client.put(f"{API}/orders/{order_id}/status", headers=maker_headers, json={
                "status": status,
            })
            assert r.status_code == 200, f"Failed transition to {status}: {r.text}"

        # Add shipping info
        r = client.put(f"{API}/orders/{order_id}/shipping", headers=maker_headers, json={
            "shipping_carrier": "顺丰",
            "shipping_tracking": "SF0001",
        })
        assert r.status_code == 200

        # Customer confirms delivery
        r = client.post(f"{API}/orders/{order_id}/confirm", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "completed"

        # Customer reviews
        r = client.post(f"{API}/orders/{order_id}/review", headers=auth_headers, json={
            "rating": 5, "comment": "Perfect!",
        })
        assert r.status_code == 201
        assert r.json()["rating"] == 5

    def test_order_messaging(self, client, auth_headers, maker_headers):
        """订单内消息隐私中转"""
        # Setup: component + order
        client.post(f"{API}/components", headers=auth_headers, json={
            "id": "msg-test-comp",
            "display_name": "Msg Test Comp",
            "description": "Component for message testing only",
        })
        r = client.post(f"{API}/orders", headers=auth_headers, json={
            "component_id": "msg-test-comp", "quantity": 1,
            "delivery_province": "上海市", "delivery_city": "上海市",
            "delivery_district": "浦东新区", "delivery_address": "test addr 12345",
            "urgency": "normal",
        })
        order_id = r.json()["order_id"]

        # Customer sends message
        r = client.post(f"{API}/orders/{order_id}/messages", headers=auth_headers, json={
            "message": "When will it ship?",
        })
        assert r.status_code == 201
        assert r.json()["sender_display"] == "客户"

        # Maker replies
        r = client.post(f"{API}/orders/{order_id}/messages", headers=maker_headers, json={
            "message": "Tomorrow!",
        })
        assert r.status_code == 201
        assert r.json()["sender_display"] == "制造商"

        # Both see messages
        r = client.get(f"{API}/orders/{order_id}/messages", headers=auth_headers)
        assert len(r.json()) == 2


# ═══════════════════════════════════════════════════════════
# Journey 2: Maker注册旅程
# ═══════════════════════════════════════════════════════════

class TestMakerJourney:
    """Maker注册→设置能力→匹配→接单→更新→完成"""

    def test_maker_register_with_capabilities(self, client):
        from tests.conftest import _agent_auth, API
        headers = _agent_auth(client, "maker-cap-test", "Maker with custom capabilities for testing")
        r = client.post(f"{API}/makers/register", headers=headers, json={
            "maker_type": "builder",
            "printer_model": "X1C",
            "printer_brand": "Bambu Lab",
            "build_volume_x": 256, "build_volume_y": 256, "build_volume_z": 256,
            "materials": ["PLA", "ABS", "TPU"],
            "capabilities": ["printing", "assembly", "testing", "painting"],
            "location_province": "广东省",
            "location_city": "深圳市",
            "location_district": "南山区",
            "pricing_per_hour_cny": 20.0,
        })
        assert r.status_code == 201
        data = r.json()
        assert "painting" in data["capabilities"]
        assert data["maker_type"] == "builder"

    def test_maker_update_status(self, client, maker_headers):
        maker_id = maker_headers["_maker_id"]
        r = client.put(f"{API}/makers/{maker_id}/status", headers=maker_headers, json={
            "availability": "busy",
        })
        assert r.status_code == 200
        assert r.json()["availability"] == "busy"

    def test_maker_list_public_privacy(self, client, maker_headers):
        """公开Maker列表不暴露隐私信息"""
        r = client.get(f"{API}/makers")
        assert r.status_code == 200
        for m in r.json():
            assert "owner_id" not in m
            assert "location_district" not in m

    def test_maker_detail_privacy(self, client, maker_headers):
        maker_id = maker_headers["_maker_id"]
        r = client.get(f"{API}/makers/{maker_id}")
        assert r.status_code == 200
        assert "owner_id" not in r.json()
        assert "location_district" not in r.json()


# ═══════════════════════════════════════════════════════════
# Journey 3: Admin管理旅程
# ═══════════════════════════════════════════════════════════

class TestAdminJourney:
    """Admin统计→审计日志→健康检查"""

    def test_admin_stats(self, client, admin_headers):
        r = client.get(f"{API}/admin/stats", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert "total_users" in data
        assert "total_orders" in data
        assert "active_makers" in data

    def test_admin_audit_log(self, client, admin_headers):
        r = client.get(f"{API}/admin/audit-log", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert "items" in data
        assert isinstance(data["items"], list)

    def test_health_basic(self, client):
        r = client.get(f"{API}/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_health_detailed(self, client):
        r = client.get(f"{API}/health/detailed")
        assert r.status_code == 200
        data = r.json()
        assert "database" in data
        assert "disk" in data
        assert "uptime_seconds" in data

    def test_root_endpoint(self, client):
        r = client.get("/")
        assert r.status_code == 200
        assert "RealWorldClaw" in r.json()["name"]

    def test_stats_endpoint(self, client):
        r = client.get(f"{API}/stats")
        assert r.status_code == 200
        data = r.json()
        for key in ["components", "agents", "makers", "orders"]:
            assert key in data


# ═══════════════════════════════════════════════════════════
# Journey 4: 错误场景
# ═══════════════════════════════════════════════════════════

class TestErrorScenarios:
    """错误场景覆盖"""

    def test_duplicate_user_registration(self, client):
        payload = {"email": "dup@example.com", "username": "dupuser", "password": "securepass123"}
        r1 = client.post(f"{API}/auth/register", json=payload)
        assert r1.status_code == 201
        r2 = client.post(f"{API}/auth/register", json=payload)
        assert r2.status_code == 409

    def test_duplicate_username(self, client):
        client.post(f"{API}/auth/register", json={
            "email": "a@example.com", "username": "samename", "password": "securepass123",
        })
        r = client.post(f"{API}/auth/register", json={
            "email": "b@example.com", "username": "samename", "password": "securepass123",
        })
        assert r.status_code == 409

    def test_wrong_password_login(self, client):
        client.post(f"{API}/auth/register", json={
            "email": "wp@example.com", "username": "wpuser", "password": "securepass123",
        })
        r = client.post(f"{API}/auth/login", json={
            "email": "wp@example.com", "password": "wrongpassword",
        })
        assert r.status_code == 401

    def test_nonexistent_user_login(self, client):
        r = client.post(f"{API}/auth/login", json={
            "email": "ghost@example.com", "password": "whatever123",
        })
        assert r.status_code == 401

    def test_unauthorized_access(self, client):
        r = client.get(f"{API}/auth/me")
        assert r.status_code == 422  # missing header

        r = client.get(f"{API}/auth/me", headers={"Authorization": "Bearer invalid-token"})
        assert r.status_code == 401

    def test_admin_endpoint_without_admin_role(self, client):
        """Non-admin user cannot access admin endpoints."""
        # Register a regular user and get JWT token
        client.post(f"{API}/auth/register", json={
            "email": "nonadmin@test.com", "username": "nonadmin", "password": "securepass123",
        })
        login = client.post(f"{API}/auth/login", json={
            "email": "nonadmin@test.com", "password": "securepass123",
        }).json()
        headers = {"Authorization": f"Bearer {login['access_token']}"}
        r = client.get(f"{API}/admin/stats", headers=headers)
        assert r.status_code == 403

    def test_nonexistent_order(self, client, auth_headers):
        r = client.get(f"{API}/orders/nonexistent-id", headers=auth_headers)
        assert r.status_code == 404

    def test_nonexistent_component(self, client):
        r = client.get(f"{API}/components/nonexistent-id")
        assert r.status_code == 404

    def test_nonexistent_maker(self, client):
        r = client.get(f"{API}/makers/nonexistent-id")
        assert r.status_code == 404

    def test_nonexistent_agent(self, client):
        r = client.get(f"{API}/agents/nonexistent-id")
        assert r.status_code == 404

    def test_duplicate_agent_name(self, client):
        client.post(f"{API}/agents/register", json={
            "name": "dup-agent", "description": "First agent with this name for testing",
        })
        r = client.post(f"{API}/agents/register", json={
            "name": "dup-agent", "description": "Second agent with this name for testing",
        })
        assert r.status_code == 409

    def test_invalid_order_status_transition(self, client, auth_headers, maker_headers):
        """Invalid status transitions should fail."""
        client.post(f"{API}/components", headers=auth_headers, json={
            "id": "trans-test-comp",
            "display_name": "Transition Test",
            "description": "Component for testing invalid status transitions",
        })
        r = client.post(f"{API}/orders", headers=auth_headers, json={
            "component_id": "trans-test-comp", "quantity": 1,
            "delivery_province": "上海市", "delivery_city": "上海市",
            "delivery_district": "浦东新区", "delivery_address": "test addr 12345",
            "urgency": "normal",
        })
        order_id = r.json()["order_id"]

        # Accept first
        client.put(f"{API}/orders/{order_id}/accept", headers=maker_headers, json={
            "estimated_hours": 2.0,
        })

        # Try to skip to shipping (invalid: accepted → shipping not allowed)
        r = client.put(f"{API}/orders/{order_id}/status", headers=maker_headers, json={
            "status": "shipping",
        })
        assert r.status_code == 400

    def test_token_refresh(self, client):
        """Test token refresh flow."""
        client.post(f"{API}/auth/register", json={
            "email": "refresh@test.com", "username": "refreshuser", "password": "securepass123",
        })
        login = client.post(f"{API}/auth/login", json={
            "email": "refresh@test.com", "password": "securepass123",
        }).json()

        r = client.post(f"{API}/auth/refresh", json={
            "refresh_token": login["refresh_token"],
        })
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_invalid_refresh_token(self, client):
        r = client.post(f"{API}/auth/refresh", json={
            "refresh_token": "invalid-token",
        })
        assert r.status_code == 401
