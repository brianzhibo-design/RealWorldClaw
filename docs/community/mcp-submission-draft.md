# awesome-mcp-servers Submission Draft

## Target Repository

- **punkpeye/awesome-mcp-servers** (primary): https://github.com/punkpeye/awesome-mcp-servers
- **wong2/awesome-mcp-servers** (secondary): https://github.com/wong2/awesome-mcp-servers
- **appcypher/awesome-mcp-servers** (secondary): https://github.com/appcypher/awesome-mcp-servers

## PR Title

`Add rwc-mcp-server: IoT/hardware device control via RealWorldClaw`

## README Entry (Markdown row)

The standard entry format used by awesome-mcp-servers is a table row or bullet in the relevant category section. Proposed entry:

### For table-based lists (e.g., punkpeye format)

| Name | Description | Platform |
|------|-------------|----------|
| [rwc-mcp-server](https://github.com/brianzhibo-design/RealWorldClaw/tree/main/mcp) | Control IoT and hardware devices through the RealWorldClaw platform — list devices, read sensor telemetry, send commands, and trigger emergency stops with permission-gated, audit-logged safety controls. | 🐧 🪟 🍎 |

### For bullet-based lists (e.g., wong2/appcypher format)

```
- [rwc-mcp-server](https://github.com/brianzhibo-design/RealWorldClaw/tree/main/mcp) - Control IoT and hardware devices through the RealWorldClaw platform. Supports device listing, sensor telemetry, command dispatch, audit logging, and emergency stop with permission tiers (readonly/restricted/full).
```

## Suggested Category

**IoT / Hardware / Device Control** (or "Hardware & Robotics" if the list uses that grouping)

If no IoT category exists, suggest creating one or placing under **Utilities** / **Infrastructure**.

## One-Sentence Description (English)

> MCP server that enables AI agents to discover, monitor, and control IoT/hardware devices through the RealWorldClaw platform with permission-gated commands and full audit logging.

## Project Details

| Field | Value |
|-------|-------|
| **Project name** | rwc-mcp-server |
| **GitHub URL** | https://github.com/brianzhibo-design/RealWorldClaw/tree/main/mcp |
| **License** | Apache 2.0 |
| **Transport** | stdio |
| **Language** | Python 3.10+ |
| **MCP version** | v2 |
| **Tested with** | Claude Desktop, Cursor |

## PR Body Template

```
## What does this MCP server do?

`rwc-mcp-server` bridges MCP-compatible AI agents (Claude, Cursor, etc.) to physical IoT
and hardware devices managed by the RealWorldClaw (RWC) platform.

## Tools provided

| Tool | Description |
|------|-------------|
| `list_devices` | List all registered devices and status |
| `device_info` | Get detailed info for a specific device |
| `read_sensor` | Read live telemetry, optionally filtered by sensor type |
| `control_device` | Send a control command (permission-gated) |
| `query_audit_log` | Query audit log by device/action/time |
| `get_permissions` | Check agent permission level for a device |
| `emergency_stop` | Immediately stop one or all devices with mandatory audit entry |

## Security highlights

- Three permission tiers: `readonly` / `restricted` / `full`
- High-risk commands require a confirmation token in restricted mode
- Rate limiting: 10 commands/min per (agent_id, device_id)
- All control actions are audit-logged

## Links

- Repo: https://github.com/brianzhibo-design/RealWorldClaw
- MCP README: https://github.com/brianzhibo-design/RealWorldClaw/tree/main/mcp
- License: Apache 2.0

## Checklist

- [x] Server listed in correct category
- [x] Entry follows the existing format of this list
- [x] README contains install, config, and tool documentation
- [x] License is clearly stated (Apache 2.0)
```

## Submission Notes

- Submit to punkpeye/awesome-mcp-servers first (most active / highest traffic as of 2024-2025)
- Then wong2 and appcypher for wider coverage
- Monitor PR for maintainer feedback; typical turnaround is 1-7 days
