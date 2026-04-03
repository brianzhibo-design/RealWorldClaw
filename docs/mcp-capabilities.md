# RWC MCP Server Capabilities Matrix

## Overview

This document summarizes RWC MCP Server v2 capabilities and how they differ from a baseline MCP server implementation.

## Capability matrix

| Capability | Generic MCP baseline | RWC MCP Server v2 |
|---|---|---|
| Tool discovery (`tools/list`) | ✅ | ✅ |
| JSON-RPC endpoint | ✅ | ✅ (`/mcp`) |
| Device inventory tool | Optional | ✅ `list_devices` |
| Device sensor read tool | Optional | ✅ `read_sensor` |
| Device command execution | Optional | ✅ `execute_command` / `control_device` |
| Permission levels | Usually external to MCP | ✅ built-in (`readonly`, `restricted`, `full`) |
| High-risk command confirmation | Usually not standardized | ✅ required in `restricted` mode for `firmware_update`, `factory_reset` |
| Rate limiting | Usually infra-level | ✅ in-tool guardrail (10/min per agent+device) |
| Audit logging | Optional | ✅ in-memory operation audit log |
| Audit query tool | Rare | ✅ `query_audit_log` |
| Emergency stop tool | Rare | ✅ `emergency_stop` (single/all devices) |
| Permission introspection tool | Rare | ✅ `get_permissions` |
| Well-known capability exposure | Varies | ✅ `/.well-known/mcp.json` includes security capability section |

## Security capability payload

RWC MCP discovery includes security metadata under `capabilities.security`, including:

- supported permission levels
- restricted-mode high-risk command policy
- command rate-limit scope and quota
- audit log metadata
- emergency stop support indicator

## Notes

- Current audit and rate-limit state are in-memory (MVP scope), reset on process restart.
- No external dependencies were introduced for these controls.
