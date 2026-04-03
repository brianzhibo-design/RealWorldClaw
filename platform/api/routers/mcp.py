"""MCP (Model Context Protocol) server endpoint for RWC platform.

Implements:
- GET  /.well-known/mcp.json  — MCP discovery
- POST /mcp                   — JSON-RPC 2.0 MCP protocol handler
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(tags=["MCP"])

DEFAULT_AGENT_ID = "mcp_agent"
DEFAULT_PERMISSION_LEVEL = "restricted"
HIGH_RISK_COMMANDS = {"firmware_update", "factory_reset"}
PERMISSION_ACTIONS: dict[str, list[str]] = {
    "readonly": ["list_devices", "read_sensor", "query_audit_log", "get_permissions"],
    "restricted": [
        "list_devices",
        "read_sensor",
        "execute_command",
        "query_audit_log",
        "emergency_stop",
        "get_permissions",
    ],
    "full": [
        "list_devices",
        "read_sensor",
        "execute_command",
        "query_audit_log",
        "emergency_stop",
        "get_permissions",
    ],
}

AUDIT_LOG: list[dict[str, Any]] = []
RATE_LIMIT_WINDOW: dict[tuple[str, str], list[datetime]] = defaultdict(list)


# ---------------------------------------------------------------------------
# Tool definitions (shared between discovery and protocol handler)
# ---------------------------------------------------------------------------

MCP_TOOLS: list[dict[str, Any]] = [
    {
        "name": "list_devices",
        "description": "List all RWC devices connected to the platform.",
        "inputSchema": {
            "type": "object",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "read_sensor",
        "description": "Read a sensor value from a specific RWC device.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "device_id": {
                    "type": "string",
                    "description": "The unique identifier of the target device.",
                },
                "sensor_type": {
                    "type": "string",
                    "description": "Type of sensor to read (e.g. temperature, humidity, pressure).",
                },
            },
            "required": ["device_id", "sensor_type"],
        },
    },
    {
        "name": "execute_command",
        "description": "Send a command to a specific RWC device.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "device_id": {
                    "type": "string",
                    "description": "The unique identifier of the target device.",
                },
                "command": {
                    "type": "string",
                    "description": "Command name to execute on the device.",
                },
                "params": {
                    "type": "object",
                    "description": "Optional command parameters.",
                    "additionalProperties": True,
                },
                "agent_id": {
                    "type": "string",
                    "description": "Requester agent id. Default mcp_agent.",
                },
                "permission_level": {
                    "type": "string",
                    "description": "Permission level: readonly/restricted/full. Default restricted.",
                },
                "confirmation_token": {
                    "type": "string",
                    "description": "Required for high-risk commands when permission_level is restricted.",
                },
            },
            "required": ["device_id", "command"],
        },
    },
    {
        "name": "query_audit_log",
        "description": "Query device operation audit logs.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "device_id": {"type": "string"},
                "action_type": {"type": "string"},
                "since": {"type": "string", "description": "ISO datetime filter."},
                "limit": {"type": "integer", "default": 20, "minimum": 1, "maximum": 200},
            },
            "required": [],
        },
    },
    {
        "name": "emergency_stop",
        "description": "Emergency stop one target device or all devices.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "device_id": {"type": "string", "description": "Optional. Missing means all devices."},
                "reason": {"type": "string"},
                "agent_id": {"type": "string"},
                "permission_level": {"type": "string"},
            },
            "required": ["reason"],
        },
    },
    {
        "name": "get_permissions",
        "description": "Get effective permission level for an agent on target device.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "device_id": {"type": "string"},
                "agent_id": {"type": "string", "default": "mcp_agent"},
            },
            "required": ["device_id"],
        },
    },
]

SERVER_INFO: dict[str, Any] = {
    "name": "rwc",
    "version": "0.1.0",
}

CAPABILITIES: dict[str, Any] = {
    "tools": {"listChanged": False},
    "security": {
        "permissionLevels": ["readonly", "restricted", "full"],
        "restrictedRequiresConfirmation": list(HIGH_RISK_COMMANDS),
        "rateLimit": {
            "scope": "agent_id+device_id",
            "limit": 10,
            "window": "1m",
        },
        "auditLog": {
            "enabled": True,
            "storage": "memory",
            "fields": ["timestamp", "agent_id", "device_id", "command", "result", "permission_level"],
        },
        "emergencyStop": True,
    },
}


# ---------------------------------------------------------------------------
# Discovery endpoint
# ---------------------------------------------------------------------------


@router.get("/.well-known/mcp.json", summary="MCP discovery", response_class=JSONResponse)
def mcp_discovery() -> dict[str, Any]:
    """Return MCP server capabilities for AI agent auto-discovery."""
    return {
        "schema_version": "1.0",
        "server": SERVER_INFO,
        "capabilities": CAPABILITIES,
        "tools": MCP_TOOLS,
    }


# ---------------------------------------------------------------------------
# JSON-RPC 2.0 request / response models
# ---------------------------------------------------------------------------


class JSONRPCRequest(BaseModel):
    jsonrpc: str = "2.0"
    id: Any = None
    method: str
    params: Any = None


def _ok(id: Any, result: Any) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": id, "result": result}


def _err(id: Any, code: int, message: str) -> dict[str, Any]:
    return {"jsonrpc": "2.0", "id": id, "error": {"code": code, "message": message}}


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_iso_datetime(value: str) -> datetime:
    normalized = value.replace("Z", "+00:00")
    dt = datetime.fromisoformat(normalized)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _effective_permission(agent_id: str) -> str:
    if agent_id.endswith("_admin"):
        return "full"
    if agent_id.endswith("_viewer"):
        return "readonly"
    return DEFAULT_PERMISSION_LEVEL


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
    AUDIT_LOG.append(entry)
    return entry


def _check_rate_limit(agent_id: str, device_id: str) -> tuple[bool, int]:
    now = _utc_now()
    key = (agent_id, device_id)
    one_minute_ago = now - timedelta(minutes=1)
    window = [ts for ts in RATE_LIMIT_WINDOW[key] if ts >= one_minute_ago]
    RATE_LIMIT_WINDOW[key] = window
    if len(window) >= 10:
        return False, 0
    window.append(now)
    RATE_LIMIT_WINDOW[key] = window
    return True, 10 - len(window)


# ---------------------------------------------------------------------------
# Tool handlers
# ---------------------------------------------------------------------------


def _handle_list_devices(_arguments: dict[str, Any]) -> Any:
    return [
        {
            "id": "device-001",
            "name": "RWC Sensor",
            "type": "sensor",
            "status": "online",
        }
    ]


def _handle_read_sensor(arguments: dict[str, Any]) -> Any:
    device_id = arguments.get("device_id", "")
    sensor_type = arguments.get("sensor_type", "")
    return {
        "device_id": device_id,
        "sensor_type": sensor_type,
        "value": 23.5,
        "unit": "°C" if sensor_type == "temperature" else "raw",
        "timestamp": _utc_now().isoformat(),
        "simulated": True,
    }


def _handle_execute_command(arguments: dict[str, Any]) -> Any:
    device_id = arguments.get("device_id", "")
    command = arguments.get("command", "")
    params = arguments.get("params", {})
    agent_id = arguments.get("agent_id", DEFAULT_AGENT_ID)
    permission_level = arguments.get("permission_level", _effective_permission(agent_id))
    confirmation_token = arguments.get("confirmation_token")

    if permission_level not in PERMISSION_ACTIONS:
        return {"status": "denied", "message": "Invalid permission_level"}

    if "execute_command" not in _allowed_actions(permission_level):
        audit = _record_audit(
            agent_id=agent_id,
            device_id=device_id,
            action_type="execute_command",
            command=command,
            result="denied_permission",
            permission_level=permission_level,
        )
        return {"status": "denied", "message": "Permission denied", "audit": audit}

    if permission_level == "restricted" and command in HIGH_RISK_COMMANDS and not confirmation_token:
        audit = _record_audit(
            agent_id=agent_id,
            device_id=device_id,
            action_type="execute_command",
            command=command,
            result="denied_confirmation_required",
            permission_level=permission_level,
        )
        return {
            "device_id": device_id,
            "command": command,
            "status": "denied",
            "message": "confirmation_token is required for high-risk command in restricted mode",
            "audit": audit,
        }

    allowed, remaining = _check_rate_limit(agent_id, device_id)
    if not allowed:
        audit = _record_audit(
            agent_id=agent_id,
            device_id=device_id,
            action_type="execute_command",
            command=command,
            result="rate_limited",
            permission_level=permission_level,
        )
        return {
            "device_id": device_id,
            "command": command,
            "status": "rate_limited",
            "message": "Rate limit exceeded: max 10 commands per minute for same agent/device",
            "audit": audit,
        }

    audit = _record_audit(
        agent_id=agent_id,
        device_id=device_id,
        action_type="execute_command",
        command=command,
        result="accepted",
        permission_level=permission_level,
        metadata={"rate_limit_remaining": remaining},
    )
    return {
        "device_id": device_id,
        "command": command,
        "params": params,
        "permission_level": permission_level,
        "status": "accepted",
        "message": "Command received. Execution is queued (simulation mode).",
        "simulated": True,
        "audit": audit,
    }


def _handle_query_audit_log(arguments: dict[str, Any]) -> Any:
    device_id = arguments.get("device_id")
    action_type = arguments.get("action_type")
    since = arguments.get("since")
    limit = int(arguments.get("limit", 20))

    entries = AUDIT_LOG
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


def _handle_emergency_stop(arguments: dict[str, Any]) -> Any:
    device_id = arguments.get("device_id")
    reason = arguments.get("reason", "")
    agent_id = arguments.get("agent_id", DEFAULT_AGENT_ID)
    permission_level = arguments.get("permission_level", _effective_permission(agent_id))

    if permission_level not in PERMISSION_ACTIONS:
        return {"status": "denied", "message": "Invalid permission_level"}

    if "emergency_stop" not in _allowed_actions(permission_level):
        audit = _record_audit(
            agent_id=agent_id,
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
        agent_id=agent_id,
        device_id=device_id,
        action_type="emergency_stop",
        command="emergency_stop",
        result="stopped",
        permission_level=permission_level,
        metadata={"reason": reason, "target": target},
    )
    return {
        "status": "stopped",
        "target": target,
        "reason": reason,
        "audit": audit,
    }


def _handle_get_permissions(arguments: dict[str, Any]) -> Any:
    device_id = arguments.get("device_id", "")
    agent_id = arguments.get("agent_id", DEFAULT_AGENT_ID)
    permission_level = _effective_permission(agent_id)

    return {
        "device_id": device_id,
        "agent_id": agent_id,
        "permission_level": permission_level,
        "allowed_actions": _allowed_actions(permission_level),
    }


TOOL_HANDLERS = {
    "list_devices": _handle_list_devices,
    "read_sensor": _handle_read_sensor,
    "execute_command": _handle_execute_command,
    "query_audit_log": _handle_query_audit_log,
    "emergency_stop": _handle_emergency_stop,
    "get_permissions": _handle_get_permissions,
}


# ---------------------------------------------------------------------------
# MCP protocol endpoint
# ---------------------------------------------------------------------------


@router.post("/mcp", summary="MCP JSON-RPC handler", response_class=JSONResponse)
def mcp_handler(req: JSONRPCRequest) -> dict[str, Any]:
    """Handle MCP JSON-RPC 2.0 requests from AI agents."""

    if req.jsonrpc != "2.0":
        return _err(req.id, -32600, "Invalid Request: jsonrpc must be '2.0'")

    # --- initialize ---
    if req.method == "initialize":
        return _ok(
            req.id,
            {
                "protocolVersion": "2024-11-05",
                "serverInfo": SERVER_INFO,
                "capabilities": CAPABILITIES,
            },
        )

    # --- tools/list ---
    if req.method == "tools/list":
        return _ok(req.id, {"tools": MCP_TOOLS})

    # --- tools/call ---
    if req.method == "tools/call":
        params = req.params or {}
        tool_name: str = params.get("name", "")
        arguments: dict[str, Any] = params.get("arguments", {})

        handler = TOOL_HANDLERS.get(tool_name)
        if handler is None:
            return _err(req.id, -32601, f"Unknown tool: {tool_name!r}")

        result = handler(arguments)
        return _ok(
            req.id,
            {
                "content": [
                    {
                        "type": "text",
                        "text": str(result) if not isinstance(result, str) else result,
                    }
                ],
                "result": result,
            },
        )

    # --- unknown method ---
    return _err(req.id, -32601, f"Method not found: {req.method!r}")
