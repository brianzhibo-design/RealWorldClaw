# RWC MCP Server (MVP)

RWC MCP Server lets any MCP-compatible AI agent control RealWorldClaw devices through the existing RWC REST API.

## Features

Implemented MCP tools:

- `list_devices` — list registered devices and status
- `read_sensor` — read device telemetry (optionally filter by sensor type)
- `control_device` — send control commands to a device
- `device_info` — get detailed status for a device

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

## MCP Client Example (Claude Desktop)

Add to your MCP server config:

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

## Notes

- `control_device` forwards commands to `/api/v1/devices/{device_id}/command`
- `read_sensor` uses `/api/v1/devices/{device_id}/status` and extracts telemetry
- `list_devices` calls `/api/v1/devices` (expects backend to expose list endpoint)
