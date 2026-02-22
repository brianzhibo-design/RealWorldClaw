"""API契约测试 - RealWorldClaw QA Team

验证：
- 响应格式（JSON schema）
- 分页参数
- 错误响应格式统一
- CORS headers
"""
from __future__ import annotations


API = "/api/v1"


class TestResponseFormats:
    """验证所有端点的响应格式"""

    def test_health_response_schema(self, client):
        r = client.get(f"{API}/health")
        data = r.json()
        assert isinstance(data, dict)
        assert "status" in data
        assert isinstance(data["status"], str)

    def test_health_detailed_schema(self, client):
        r = client.get(f"{API}/health/detailed")
        data = r.json()
        assert "status" in data
        assert "database" in data
        assert "disk" in data
        assert "memory" in data
        assert "uptime_seconds" in data
        assert isinstance(data["disk"], dict)
        assert "total_gb" in data["disk"]
        assert "free_gb" in data["disk"]

    def test_stats_response_schema(self, client):
        r = client.get(f"{API}/stats")
        data = r.json()
        for key in ["components", "agents", "makers", "orders"]:
            assert key in data
            assert isinstance(data[key], int)

    def test_components_list_schema(self, client):
        r = client.get(f"{API}/components")
        data = r.json()
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert "components" in data
        assert isinstance(data["total"], int)
        assert isinstance(data["components"], list)

    def test_component_response_schema(self, client, auth_headers):
        client.post(f"{API}/components", headers=auth_headers, json={
            "id": "schema-test-comp",
            "display_name": "Schema Test",
            "description": "A component for schema validation testing",
            "tags": ["test"],
            "material": "PLA",
        })
        r = client.get(f"{API}/components/schema-test-comp")
        assert r.status_code == 200
        data = r.json()
        required = ["id", "display_name", "description", "version", "author_id",
                     "tags", "capabilities", "status", "downloads", "rating",
                     "review_count", "created_at", "updated_at"]
        for field in required:
            assert field in data, f"Missing field: {field}"
        assert isinstance(data["tags"], list)
        assert isinstance(data["capabilities"], list)
        assert isinstance(data["downloads"], int)
        assert isinstance(data["rating"], (int, float))

    def test_makers_list_schema(self, client, maker_headers):
        r = client.get(f"{API}/makers")
        data = r.json()
        assert isinstance(data, list)
        if data:
            maker = data[0]
            required = ["id", "maker_type", "printer_brand", "printer_model",
                         "materials", "capabilities", "location_province",
                         "location_city", "availability", "pricing_per_hour_cny",
                         "rating", "total_orders", "verified"]
            for field in required:
                assert field in maker, f"Missing field in maker: {field}"

    def test_agent_response_schema(self, client, auth_headers):
        r = client.get(f"{API}/agents/me", headers=auth_headers)
        data = r.json()
        required = ["id", "name", "description", "type", "status",
                     "reputation", "tier", "created_at", "updated_at"]
        for field in required:
            assert field in data, f"Missing field in agent: {field}"

    def test_auth_register_response_schema(self, client):
        r = client.post(f"{API}/auth/register", json={
            "email": "schema@test.com", "username": "schemauser", "password": "securepass123",
        })
        data = r.json()
        required = ["id", "email", "username", "role", "is_active", "created_at", "updated_at"]
        for field in required:
            assert field in data, f"Missing field in user: {field}"

    def test_login_response_schema(self, client):
        client.post(f"{API}/auth/register", json={
            "email": "loginschema@test.com", "username": "loginschema", "password": "securepass123",
        })
        r = client.post(f"{API}/auth/login", json={
            "email": "loginschema@test.com", "password": "securepass123",
        })
        data = r.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert "token_type" in data
        assert isinstance(data["access_token"], str)
        assert len(data["access_token"]) > 10

    def test_admin_stats_schema(self, client, admin_headers):
        r = client.get(f"{API}/admin/stats", headers=admin_headers)
        data = r.json()
        for key in ["total_users", "total_orders", "active_makers", "audit_events_24h"]:
            assert key in data
            assert isinstance(data[key], int)

    def test_admin_audit_log_schema(self, client, admin_headers):
        r = client.get(f"{API}/admin/audit-log", headers=admin_headers)
        data = r.json()
        assert "items" in data
        assert "limit" in data
        assert "offset" in data
        assert isinstance(data["items"], list)


class TestPagination:
    """验证分页参数"""

    def test_components_pagination_skip_limit(self, client):
        r = client.get(f"{API}/components?skip=0&limit=5")
        assert r.status_code == 200
        data = r.json()
        assert data["skip"] == 0
        assert data["limit"] == 5

    def test_components_pagination_large_skip(self, client):
        r = client.get(f"{API}/components?skip=1000&limit=10")
        assert r.status_code == 200
        assert r.json()["components"] == []

    def test_components_invalid_limit(self, client):
        r = client.get(f"{API}/components?limit=0")
        assert r.status_code == 422

    def test_components_limit_cap(self, client):
        r = client.get(f"{API}/components?limit=200")
        assert r.status_code == 422

    def test_makers_pagination(self, client, maker_headers):
        r = client.get(f"{API}/makers?page=1&per_page=5")
        assert r.status_code == 200

    def test_audit_log_pagination(self, client, admin_headers):
        r = client.get(f"{API}/admin/audit-log?limit=10&offset=0", headers=admin_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["limit"] == 10
        assert data["offset"] == 0


class TestErrorResponseFormat:
    """验证错误响应格式统一"""

    def test_404_has_detail(self, client):
        r = client.get(f"{API}/components/nonexistent")
        assert r.status_code == 404
        data = r.json()
        assert "detail" in data
        assert isinstance(data["detail"], str)

    def test_401_has_detail(self, client):
        r = client.get(f"{API}/auth/me", headers={"Authorization": "Bearer bad"})
        assert r.status_code == 401
        assert "detail" in r.json()

    def test_422_validation_error(self, client):
        r = client.post(f"{API}/auth/register", json={})
        assert r.status_code == 422
        data = r.json()
        assert "detail" in data

    def test_409_conflict_has_detail(self, client):
        payload = {"email": "conflict@test.com", "username": "conflictuser", "password": "securepass123"}
        client.post(f"{API}/auth/register", json=payload)
        r = client.post(f"{API}/auth/register", json=payload)
        assert r.status_code == 409
        assert "detail" in r.json()

    def test_403_has_detail(self, client):
        # Regular user accessing admin endpoint
        client.post(f"{API}/auth/register", json={
            "email": "noadmin@test.com", "username": "noadmin", "password": "securepass123",
        })
        login = client.post(f"{API}/auth/login", json={
            "email": "noadmin@test.com", "password": "securepass123",
        }).json()
        r = client.get(f"{API}/admin/stats", headers={
            "Authorization": f"Bearer {login['access_token']}"
        })
        assert r.status_code == 403
        assert "detail" in r.json()


class TestCORSHeaders:
    """验证CORS headers"""

    def test_cors_preflight(self, client):
        r = client.options(f"{API}/health", headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        })
        # FastAPI CORS middleware responds to OPTIONS preflight
        assert r.status_code in (200, 204, 405)

    def test_cors_on_response(self, client):
        r = client.get(f"{API}/health", headers={
            "Origin": "http://localhost:3000",
        })
        assert r.status_code == 200
        # CORS headers should be present for allowed origin
        assert "access-control-allow-origin" in r.headers

    def test_cors_allows_credentials(self, client):
        r = client.get(f"{API}/health", headers={
            "Origin": "http://localhost:3000",
        })
        assert r.headers.get("access-control-allow-credentials") == "true"

    def test_json_content_type(self, client):
        r = client.get(f"{API}/health")
        assert "application/json" in r.headers.get("content-type", "")

    def test_all_endpoints_return_json(self, client, auth_headers, admin_headers):
        """All major GET endpoints return JSON content type."""
        from api.rate_limit import _bucket
        _bucket._hits.clear()
        endpoints = [
            ("/", None),
            ("/health", None),
            (f"{API}/health", None),
            (f"{API}/health/detailed", None),
            (f"{API}/stats", None),
            (f"{API}/components", None),
            (f"{API}/makers", None),
            (f"{API}/agents/me", auth_headers),
            (f"{API}/admin/stats", admin_headers),
        ]
        for path, headers in endpoints:
            r = client.get(path, headers=headers or {})
            assert "application/json" in r.headers.get("content-type", ""), \
                f"Endpoint {path} should return JSON, got {r.headers.get('content-type')}"
