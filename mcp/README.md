# rwc-mcp-server

> **MCP Server for RealWorldClaw (RWC)** — Enable any MCP-compatible AI agent (Claude, Cursor, etc.) to discover, monitor, and control IoT/hardware devices through the RealWorldClaw platform.

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://www.apache.org/licenses/LICENSE-2.0)

**GitHub:** https://github.com/brianzhibo-design/RealWorldClaw

## What is this?

`rwc-mcp-server` is a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server that bridges AI agents to physical devices managed by the RealWorldClaw (RWC) platform. Once configured, any MCP-compatible AI client can list devices, read live sensor telemetry, send control commands, and trigger emergency stops — all through a secure, permission-gated interface.

Ideal for: smart-home automation, industrial IoT control, robotics experiments, or any scenario where you want an AI assistant to interact with the real world safely.

## Security features (MCP v2)

- **Permission levels**: `readonly` / `restricted` / `full`
- **High-risk guardrail**: in `restricted` mode, high-risk commands (`firmware_update`, `factory_reset`) require `confirmation_token`
- **Rate limiting**: max **10 commands/minute** per `(agent_id, device_id)`
- **Audit logging**: all control and emergency operations are written to in-memory audit log
- **Emergency control**: supports per-device or global emergency stop with mandatory reason

## Requirements

- Python 3.10+
- RWC backend running (FastAPI)
- API token with permission to access device endpoints

## Install

```bash
cd mcp
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Configuration

Set environment variables (API URL must come from env, no hardcoding):

```bash
export RWC_API_BASE_URL="http://localhost:8000"
export RWC_API_TOKEN="<your_api_token>"
# optional
export RWC_API_TIMEOUT="10"
```

## Run MCP Server

```bash
python server.py
```

The server uses `stdio` transport, suitable for MCP clients like Claude Desktop, Cursor, etc.

## MCP Client Integration

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "rwc": {
      "command": "python",
      "args": ["/absolute/path/to/realworldclaw/mcp/server.py"],
      "env": {
        "RWC_API_BASE_URL": "http://localhost:8000",
        "RWC_API_TOKEN": "<your_api_token>"
      }
    }
  }
}
```

### Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "rwc": {
      "command": "python",
      "args": ["/absolute/path/to/realworldclaw/mcp/server.py"],
      "env": {
        "RWC_API_BASE_URL": "http://localhost:8000",
        "RWC_API_TOKEN": "<your_api_token>"
      }
    }
  }
}
```

## Run Tests

```bash
cd mcp
pytest -q
```

## Available Tools (MCP v2)

| Tool | Description |
|------|-------------|
| `list_devices` | List all registered devices and their current status |
| `device_info` | Get detailed status and metadata for a specific device |
| `read_sensor` | Read live telemetry from a device (optionally filter by sensor type) |
| `control_device` | Send a control command to a device (subject to permission level) |
| `query_audit_log` | Query the in-memory audit log by device, action, or time range |
| `get_permissions` | Resolve the agent's permission level and allowed actions for a device |
| `emergency_stop` | Immediately stop one or all devices and record a mandatory audit entry |

## License

Apache License 2.0 — see [LICENSE](../LICENSE) for details.

## Notes

- `control_device` forwards commands to `/api/v1/devices/{device_id}/command`
- `read_sensor` uses `/api/v1/devices/{device_id}/status` and extracts telemetry
- `list_devices` calls `/api/v1/devices` (expects backend to expose list endpoint)
- Source repository: https://github.com/brianzhibo-design/RealWorldClaw
