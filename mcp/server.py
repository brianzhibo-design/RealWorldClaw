"""RWC MCP Server MVP.

Exposes MCP tools that wrap RWC backend REST APIs.
"""
from __future__ import annotations

import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

import httpx
from mcp.server.fastmcp import FastMCP


mcp = FastMCP("rwc-mcp-server")

DEFAULT_AGENT_ID = "mcp_agent"
DEFAULT_PERMISSION_LEVEL = "restricted"
HIGH_RISK_COMMANDS = {"firmware_update", "factory_reset"}
PERMISSION_ACTIONS: dict[str, list[str]] = {
    "readonly": ["list_devices", "device_info", "read_sensor", "query_audit_log", "get_permissions"],
    "restricted": [
        "list_devices",
        "device_info",
        "read_sensor",
        "control_device",
        "query_audit_log",
        "emergency_stop",
        "get_permissions",
    ],
    "full": [
        "list_devices",
        "device_info",
        "read_sensor",
        "control_device",
        "query_audit_log",
        "emergency_stop",
        "get_permissions",
    ],
}

_audit_log: list[dict[str, Any]] = []
_rate_limit_window: dict[tuple[str, str], list[datetime]] = defaultdict(list)


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_iso_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _allowed_actions(permission_level: str) -> list[str]:
    return PERMISSION_ACTIONS.get(permission_level, PERMISSION_ACTIONS[DEFAULT_PERMISSION_LEVEL])


def _record_audit(
    *,
    agent_id: str,
    device_id: str | None,
    action_type: str,
    command: str,
    result: str,
    permission_level: str,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    entry = {
        "timestamp": _utc_now().isoformat(),
        "agent_id": agent_id,
        "device_id": device_id,
        "action_type": action_type,
        "command": command,
        "result": result,
        "permission_level": permission_level,
    }
    if metadata:
        entry["metadata"] = metadata
    _audit_log.append(entry)
    return entry


def _check_rate_limit(agent_id: str, device_id: str) -> tuple[bool, int]:
    now = _utc_now()
    key = (agent_id, device_id)
    one_minute_ago = now - timedelta(minutes=1)
    window = [ts for ts in _rate_limit_window[key] if ts >= one_minute_ago]
    _rate_limit_window[key] = window
    if len(window) >= 10:
        return False, 0
    window.append(now)
    _rate_limit_window[key] = window
    return True, 10 - len(window)


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
    requester_agent_id: str = DEFAULT_AGENT_ID,
    permission_level: str = DEFAULT_PERMISSION_LEVEL,
    confirmation_token: str | None = None,
) -> dict[str, Any]:
    """Send a control command to a device (e.g., relay_on / relay_off)."""
    if permission_level not in PERMISSION_ACTIONS:
        raise ValueError("permission_level must be one of: readonly, restricted, full")

    if "control_device" not in _allowed_actions(permission_level):
        audit = _record_audit(
            agent_id=requester_agent_id,
            device_id=device_id,
            action_type="control_device",
            command=command,
            result="denied_permission",
            permission_level=permission_level,
        )
        return {"status": "denied", "message": "Permission denied", "audit": audit}

    if permission_level == "restricted" and command in HIGH_RISK_COMMANDS and not confirmation_token:
        audit = _record_audit(
            agent_id=requester_agent_id,
            device_id=device_id,
            action_type="control_device",
            command=command,
            result="denied_confirmation_required",
            permission_level=permission_level,
        )
        return {
            "status": "denied",
            "message": "confirmation_token is required for high-risk command in restricted mode",
            "audit": audit,
        }

    allowed, remaining = _check_rate_limit(requester_agent_id, device_id)
    if not allowed:
        audit = _record_audit(
            agent_id=requester_agent_id,
            device_id=device_id,
            action_type="control_device",
            command=command,
            result="rate_limited",
            permission_level=permission_level,
        )
        return {
            "status": "rate_limited",
            "message": "Rate limit exceeded: max 10 commands per minute for same agent/device",
            "audit": audit,
        }

    api = _build_client()
    try:
        result = api.control_device(
            device_id=device_id,
            command=command,
            parameters=parameters,
            requester_agent_id=requester_agent_id,
        )
        audit = _record_audit(
            agent_id=requester_agent_id,
            device_id=device_id,
            action_type="control_device",
            command=command,
            result="success",
            permission_level=permission_level,
            metadata={"rate_limit_remaining": remaining},
        )
        return {**result, "permission_level": permission_level, "audit": audit}
    except httpx.HTTPStatusError:
        _record_audit(
            agent_id=requester_agent_id,
            device_id=device_id,
            action_type="control_device",
            command=command,
            result="error",
            permission_level=permission_level,
        )
        raise
    finally:
        api.close()


@mcp.tool()
def query_audit_log(
    device_id: str | None = None,
    action_type: str | None = None,
    since: str | None = None,
    limit: int = 20,
) -> dict[str, Any]:
    """Query in-memory operation audit logs."""
    entries = _audit_log
    if device_id:
        entries = [e for e in entries if e.get("device_id") == device_id]
    if action_type:
        entries = [e for e in entries if e.get("action_type") == action_type]
    if since:
        since_dt = _parse_iso_datetime(since)
        entries = [e for e in entries if _parse_iso_datetime(e["timestamp"]) >= since_dt]

    safe_limit = max(limit, 0)
    limited = entries[-safe_limit:] if safe_limit else []
    return {"items": list(reversed(limited)), "count": len(limited)}


@mcp.tool()
def emergency_stop(
    reason: str,
    device_id: str | None = None,
    requester_agent_id: str = DEFAULT_AGENT_ID,
    permission_level: str = DEFAULT_PERMISSION_LEVEL,
) -> dict[str, Any]:
    """Emergency stop one device or all devices."""
    if permission_level not in PERMISSION_ACTIONS:
        raise ValueError("permission_level must be one of: readonly, restricted, full")

    if "emergency_stop" not in _allowed_actions(permission_level):
        audit = _record_audit(
            agent_id=requester_agent_id,
            device_id=device_id,
            action_type="emergency_stop",
            command="emergency_stop",
            result="denied_permission",
            permission_level=permission_level,
            metadata={"reason": reason},
        )
        return {"status": "denied", "message": "Permission denied", "audit": audit}

    target = device_id or "all"
    audit = _record_audit(
        agent_id=requester_agent_id,
        device_id=device_id,
        action_type="emergency_stop",
        command="emergency_stop",
        result="success",
        permission_level=permission_level,
        metadata={"reason": reason, "target": target},
    )
    return {
        "status": "stopped",
        "target": target,
        "reason": reason,
        "audit": audit,
    }


@mcp.tool()
def get_permissions(device_id: str, agent_id: str = DEFAULT_AGENT_ID) -> dict[str, Any]:
    """Get effective permission level and allowed operations for an agent/device."""
    if agent_id.endswith("_admin"):
        level = "full"
    elif agent_id.endswith("_viewer"):
        level = "readonly"
    else:
        level = DEFAULT_PERMISSION_LEVEL

    return {
        "device_id": device_id,
        "agent_id": agent_id,
        "permission_level": level,
        "allowed_actions": _allowed_actions(level),
    }


if __name__ == "__main__":
    mcp.run(transport="stdio")
