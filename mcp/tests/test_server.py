from __future__ import annotations

import os
import sys
from pathlib import Path

import httpx
import pytest
import respx

sys.path.append(str(Path(__file__).resolve().parents[1]))

os.environ["RWC_API_BASE_URL"] = "http://localhost:8000"
os.environ["RWC_API_TOKEN"] = "token_test"

import server  # noqa: E402
from server import control_device, device_info, emergency_stop, get_permissions, list_devices, query_audit_log, read_sensor  # noqa: E402


@pytest.fixture(autouse=True)
def _reset_state() -> None:
    server._audit_log.clear()
    server._rate_limit_window.clear()


@respx.mock
def test_list_devices_calls_api() -> None:
    route = respx.get("http://localhost:8000/api/v1/devices").mock(
        return_value=httpx.Response(200, json={"items": [{"device_id": "dev-1", "status": "online"}]})
    )

    result = list_devices(limit=10, offset=0)

    assert route.called
    assert result["items"][0]["device_id"] == "dev-1"


@respx.mock
def test_device_info_calls_status_api() -> None:
    route = respx.get("http://localhost:8000/api/v1/devices/dev-1/status").mock(
        return_value=httpx.Response(200, json={"device_id": "dev-1", "recent_telemetry": []})
    )

    result = device_info("dev-1")

    assert route.called
    assert result["device_id"] == "dev-1"


@respx.mock
def test_read_sensor_filters_telemetry() -> None:
    respx.get("http://localhost:8000/api/v1/devices/dev-1/status").mock(
        return_value=httpx.Response(
            200,
            json={
                "device_id": "dev-1",
                "recent_telemetry": [
                    {"sensor_type": "temperature", "value": 23.4},
                    {"sensor_type": "humidity", "value": 56},
                ],
            },
        )
    )

    result = read_sensor("dev-1", sensor_type="humidity")

    assert result["latest"]["sensor_type"] == "humidity"
    assert len(result["telemetry"]) == 1


@respx.mock
def test_control_device_posts_command() -> None:
    route = respx.post("http://localhost:8000/api/v1/devices/dev-1/command").mock(
        return_value=httpx.Response(200, json={"status": "pending", "command_id": "cmd-1"})
    )

    result = control_device("dev-1", command="relay_on", parameters={"channel": 1})

    assert route.called
    assert result["status"] == "pending"
    assert result["permission_level"] == "restricted"
    assert result["audit"]["result"] == "success"


@respx.mock
def test_http_error_raises() -> None:
    respx.get("http://localhost:8000/api/v1/devices").mock(return_value=httpx.Response(500, json={"detail": "error"}))

    with pytest.raises(httpx.HTTPStatusError):
        list_devices()


@respx.mock
def test_restricted_high_risk_requires_confirmation() -> None:
    result = control_device("dev-1", command="firmware_update")

    assert result["status"] == "denied"
    assert "confirmation_token" in result["message"]


@respx.mock
def test_rate_limit_kicks_in_after_10_commands() -> None:
    respx.post("http://localhost:8000/api/v1/devices/dev-1/command").mock(
        return_value=httpx.Response(200, json={"status": "pending"})
    )

    for _ in range(10):
        result = control_device("dev-1", command="relay_on", requester_agent_id="agent-1")
        assert result["status"] == "pending"

    blocked = control_device("dev-1", command="relay_on", requester_agent_id="agent-1")
    assert blocked["status"] == "rate_limited"


def test_query_audit_log_filters_and_limit() -> None:
    emergency_stop(reason="manual", device_id="dev-1")
    emergency_stop(reason="manual", device_id="dev-2")

    result = query_audit_log(device_id="dev-1", action_type="emergency_stop", limit=5)

    assert result["count"] == 1
    assert result["items"][0]["device_id"] == "dev-1"


def test_get_permissions_returns_expected_level_and_actions() -> None:
    viewer = get_permissions("dev-1", agent_id="ops_viewer")
    admin = get_permissions("dev-1", agent_id="ops_admin")

    assert viewer["permission_level"] == "readonly"
    assert "control_device" not in viewer["allowed_actions"]
    assert admin["permission_level"] == "full"
    assert "control_device" in admin["allowed_actions"]
