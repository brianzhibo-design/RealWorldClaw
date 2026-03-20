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

from server import control_device, device_info, list_devices, read_sensor  # noqa: E402


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


@respx.mock
def test_http_error_raises() -> None:
    respx.get("http://localhost:8000/api/v1/devices").mock(return_value=httpx.Response(500, json={"detail": "error"}))

    with pytest.raises(httpx.HTTPStatusError):
        list_devices()
