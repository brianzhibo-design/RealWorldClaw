"""MCP (Model Context Protocol) server endpoint for RWC platform.

Implements:
- GET  /.well-known/mcp.json  — MCP discovery
- POST /mcp                   — JSON-RPC 2.0 MCP protocol handler
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel

router = APIRouter(tags=["MCP"])

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
            },
            "required": ["device_id", "command"],
        },
    },
]

SERVER_INFO: dict[str, Any] = {
    "name": "rwc",
    "version": "0.1.0",
}

CAPABILITIES: dict[str, Any] = {
    "tools": {"listChanged": False},
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
    # Structured mock response — clearly labelled as simulated
    return {
        "device_id": device_id,
        "sensor_type": sensor_type,
        "value": 23.5,
        "unit": "°C" if sensor_type == "temperature" else "raw",
        "timestamp": "2026-03-26T06:00:00Z",
        "simulated": True,
    }


def _handle_execute_command(arguments: dict[str, Any]) -> Any:
    device_id = arguments.get("device_id", "")
    command = arguments.get("command", "")
    params = arguments.get("params", {})
    return {
        "device_id": device_id,
        "command": command,
        "params": params,
        "status": "accepted",
        "message": "Command received. Execution is queued (simulation mode).",
        "simulated": True,
    }


TOOL_HANDLERS = {
    "list_devices": _handle_list_devices,
    "read_sensor": _handle_read_sensor,
    "execute_command": _handle_execute_command,
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
