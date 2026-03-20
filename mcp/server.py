"""RWC MCP Server MVP.

Exposes MCP tools that wrap RWC backend REST APIs.
"""
from __future__ import annotations

import os
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP


mcp = FastMCP("rwc-mcp-server")


class RwcApiClient:
    """Small HTTP client for RWC backend APIs."""

    def __init__(self) -> None:
        base_url = os.getenv("RWC_API_BASE_URL")
        if not base_url:
            raise ValueError("RWC_API_BASE_URL is required")

        token = os.getenv("RWC_API_TOKEN")
        timeout = float(os.getenv("RWC_API_TIMEOUT", "10"))

        headers: dict[str, str] = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"

        self.client = httpx.Client(base_url=base_url.rstrip("/"), headers=headers, timeout=timeout)

    def close(self) -> None:
        self.client.close()

    def _request(self, method: str, path: str, **kwargs: Any) -> dict[str, Any]:
        response = self.client.request(method, path, **kwargs)
        response.raise_for_status()

        body = response.json()
        if isinstance(body, dict):
            return body
        return {"data": body}

    def list_devices(self, status: str | None = None, limit: int = 50, offset: int = 0) -> dict[str, Any]:
        params: dict[str, Any] = {"limit": limit, "offset": offset}
        if status:
            params["status"] = status
        return self._request("GET", "/api/v1/devices", params=params)

    def device_info(self, device_id: str) -> dict[str, Any]:
        return self._request("GET", f"/api/v1/devices/{device_id}/status")

    def control_device(
        self,
        device_id: str,
        command: str,
        parameters: dict[str, Any] | None,
        requester_agent_id: str,
    ) -> dict[str, Any]:
        payload = {
            "command": command,
            "parameters": parameters or {},
            "requester_agent_id": requester_agent_id,
        }
        return self._request("POST", f"/api/v1/devices/{device_id}/command", json=payload)


def _build_client() -> RwcApiClient:
    return RwcApiClient()


@mcp.tool()
def list_devices(status: str | None = None, limit: int = 50, offset: int = 0) -> dict[str, Any]:
    """List registered devices and their status."""
    api = _build_client()
    try:
        return api.list_devices(status=status, limit=limit, offset=offset)
    finally:
        api.close()


@mcp.tool()
def device_info(device_id: str) -> dict[str, Any]:
    """Get full details of a specific device."""
    api = _build_client()
    try:
        return api.device_info(device_id)
    finally:
        api.close()


@mcp.tool()
def read_sensor(device_id: str, sensor_type: str | None = None) -> dict[str, Any]:
    """Read sensor telemetry from a device.

    Uses device status API and returns latest telemetry, optionally filtered by sensor_type.
    """
    api = _build_client()
    try:
        info = api.device_info(device_id)
    finally:
        api.close()

    telemetry = info.get("recent_telemetry", [])
    if sensor_type:
        telemetry = [t for t in telemetry if t.get("sensor_type") == sensor_type]

    latest = telemetry[0] if telemetry else None
    return {
        "device_id": device_id,
        "sensor_type": sensor_type,
        "latest": latest,
        "telemetry": telemetry,
    }


@mcp.tool()
def control_device(
    device_id: str,
    command: str,
    parameters: dict[str, Any] | None = None,
    requester_agent_id: str = "mcp_agent",
) -> dict[str, Any]:
    """Send a control command to a device (e.g., relay_on / relay_off)."""
    api = _build_client()
    try:
        return api.control_device(
            device_id=device_id,
            command=command,
            parameters=parameters,
            requester_agent_id=requester_agent_id,
        )
    finally:
        api.close()


if __name__ == "__main__":
    mcp.run(transport="stdio")
