"""Tests for MCP server endpoints.

Tests:
- GET /.well-known/mcp.json  — discovery
- POST /mcp initialize
- POST /mcp tools/list
- POST /mcp tools/call (list_devices, read_sensor, execute_command)
- POST /mcp unknown method → error
"""

from __future__ import annotations

import os

# Set required env vars before any app imports
os.environ.setdefault("RWC_API_KEY_SECRET", "test-api-key-secret-for-mcp-tests")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret-key")

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def mcp_client():
    """Provide a test client for the FastAPI app (reuse conftest DB setup)."""
    from api.main import app

    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# Discovery
# ---------------------------------------------------------------------------


class TestMCPDiscovery:
    def test_discovery_returns_200(self, mcp_client):
        resp = mcp_client.get("/.well-known/mcp.json")
        assert resp.status_code == 200

    def test_discovery_has_tools_field(self, mcp_client):
        data = mcp_client.get("/.well-known/mcp.json").json()
        assert "tools" in data
        assert isinstance(data["tools"], list)
        assert len(data["tools"]) >= 3

    def test_discovery_has_server_info(self, mcp_client):
        data = mcp_client.get("/.well-known/mcp.json").json()
        assert data["server"]["name"] == "rwc"
        assert data["server"]["version"] == "0.1.0"

    def test_discovery_tool_names(self, mcp_client):
        data = mcp_client.get("/.well-known/mcp.json").json()
        names = {t["name"] for t in data["tools"]}
        assert {"list_devices", "read_sensor", "execute_command"}.issubset(names)

    def test_discovery_tools_have_input_schema(self, mcp_client):
        data = mcp_client.get("/.well-known/mcp.json").json()
        for tool in data["tools"]:
            assert "inputSchema" in tool, f"Tool {tool['name']} missing inputSchema"


# ---------------------------------------------------------------------------
# JSON-RPC: initialize
# ---------------------------------------------------------------------------


class TestMCPInitialize:
    def _post(self, client, method: str, params=None, req_id=1):
        body = {"jsonrpc": "2.0", "id": req_id, "method": method}
        if params is not None:
            body["params"] = params
        return client.post("/mcp", json=body)

    def test_initialize_returns_200(self, mcp_client):
        resp = self._post(mcp_client, "initialize")
        assert resp.status_code == 200

    def test_initialize_jsonrpc_envelope(self, mcp_client):
        data = self._post(mcp_client, "initialize", req_id=42).json()
        assert data["jsonrpc"] == "2.0"
        assert data["id"] == 42
        assert "result" in data

    def test_initialize_result_content(self, mcp_client):
        result = self._post(mcp_client, "initialize").json()["result"]
        assert "protocolVersion" in result
        assert result["serverInfo"]["name"] == "rwc"
        assert "capabilities" in result


# ---------------------------------------------------------------------------
# JSON-RPC: tools/list
# ---------------------------------------------------------------------------


class TestMCPToolsList:
    def _post(self, client, method: str, params=None, req_id=1):
        body = {"jsonrpc": "2.0", "id": req_id, "method": method}
        if params is not None:
            body["params"] = params
        return client.post("/mcp", json=body)

    def test_tools_list_returns_200(self, mcp_client):
        resp = self._post(mcp_client, "tools/list")
        assert resp.status_code == 200

    def test_tools_list_envelope(self, mcp_client):
        data = self._post(mcp_client, "tools/list", req_id=7).json()
        assert data["jsonrpc"] == "2.0"
        assert data["id"] == 7
        assert "result" in data

    def test_tools_list_contains_tools(self, mcp_client):
        result = self._post(mcp_client, "tools/list").json()["result"]
        assert "tools" in result
        assert len(result["tools"]) >= 3

    def test_tools_list_tool_structure(self, mcp_client):
        tools = self._post(mcp_client, "tools/list").json()["result"]["tools"]
        for tool in tools:
            assert "name" in tool
            assert "description" in tool
            assert "inputSchema" in tool


# ---------------------------------------------------------------------------
# JSON-RPC: tools/call
# ---------------------------------------------------------------------------


class TestMCPToolsCall:
    def _call(self, client, tool_name: str, arguments: dict | None = None, req_id=1):
        params = {"name": tool_name, "arguments": arguments or {}}
        body = {"jsonrpc": "2.0", "id": req_id, "method": "tools/call", "params": params}
        return client.post("/mcp", json=body)

    # list_devices
    def test_list_devices_returns_200(self, mcp_client):
        resp = self._call(mcp_client, "list_devices")
        assert resp.status_code == 200

    def test_list_devices_result_structure(self, mcp_client):
        data = self._call(mcp_client, "list_devices").json()
        assert data["jsonrpc"] == "2.0"
        assert "result" in data
        result = data["result"]["result"]
        assert isinstance(result, list)
        assert len(result) >= 1
        device = result[0]
        assert device["id"] == "device-001"
        assert device["name"] == "RWC Sensor"

    # read_sensor
    def test_read_sensor_returns_200(self, mcp_client):
        resp = self._call(
            mcp_client,
            "read_sensor",
            {"device_id": "device-001", "sensor_type": "temperature"},
        )
        assert resp.status_code == 200

    def test_read_sensor_result_structure(self, mcp_client):
        data = self._call(
            mcp_client,
            "read_sensor",
            {"device_id": "device-001", "sensor_type": "temperature"},
        ).json()
        result = data["result"]["result"]
        assert result["device_id"] == "device-001"
        assert result["sensor_type"] == "temperature"
        assert "value" in result
        assert "timestamp" in result

    # execute_command
    def test_execute_command_returns_200(self, mcp_client):
        resp = self._call(
            mcp_client,
            "execute_command",
            {"device_id": "device-001", "command": "reboot", "params": {}},
        )
        assert resp.status_code == 200

    def test_execute_command_result_structure(self, mcp_client):
        data = self._call(
            mcp_client,
            "execute_command",
            {"device_id": "device-001", "command": "reboot", "params": {"force": True}},
        ).json()
        result = data["result"]["result"]
        assert result["device_id"] == "device-001"
        assert result["command"] == "reboot"
        assert result["status"] == "accepted"

    # unknown tool
    def test_unknown_tool_returns_error(self, mcp_client):
        data = self._call(mcp_client, "nonexistent_tool").json()
        assert "error" in data
        assert data["error"]["code"] == -32601

    # unknown method
    def test_unknown_method_returns_error(self, mcp_client):
        body = {"jsonrpc": "2.0", "id": 99, "method": "bogus/method"}
        data = mcp_client.post("/mcp", json=body).json()
        assert "error" in data
        assert data["error"]["code"] == -32601
