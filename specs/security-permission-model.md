# RWC Security: Permission Model & Action Audit

> Status: Draft | 2026-02-24
> Part of Security Foundation (贯穿所有阶段)

## 1. Permission Model (最小权限)

### 1.1 Permission Levels

Every agent-to-module interaction requires an explicit permission grant. Three tiers:

| Level | Name | Examples | Grant Method |
|-------|------|----------|-------------|
| `read` | 感知权限 | Read temperature, humidity, status | Auto-granted on module bind |
| `write` | 执行权限 | Toggle relay, set target temp, adjust speed | Explicit user approval |
| `critical` | 高危权限 | Firmware update, factory reset, unlock door | User 2FA confirmation per-action |

### 1.2 Permission Scopes

Permissions are scoped to `{agent}:{module}:{capability}`:

```yaml
# Example: Agent "home-climate" permissions
permissions:
  - scope: "home-climate:temp-sensor-01:temperature"
    level: read
    granted: "2026-02-24T00:00:00Z"
    expires: null  # permanent until revoked

  - scope: "home-climate:relay-01:toggle"
    level: write
    granted: "2026-02-24T00:00:00Z"
    expires: "2026-03-24T00:00:00Z"  # 30-day auto-expire
    constraints:
      rate_limit: "10/hour"
      time_window: "06:00-23:00"  # no night toggling

  - scope: "home-climate:relay-01:firmware_update"
    level: critical
    # Not pre-granted — requires per-action 2FA
```

### 1.3 Constraint System

Write/critical permissions support optional constraints:

- **`rate_limit`**: Max invocations per time window (e.g. `"10/hour"`, `"100/day"`)
- **`time_window`**: Allowed hours in local time (e.g. `"06:00-23:00"`)
- **`cooldown_ms`**: Minimum interval between invocations
- **`requires_context`**: Condition that must be true (e.g. `"temperature > 30"` for AC activation)
- **`max_duration_ms`**: Auto-revert after duration (e.g. unlock door for max 30s)

### 1.4 Permission Lifecycle

```
Request → Evaluate Scope → Check Constraints → Execute / Deny
                                    ↓ (if critical)
                              2FA Prompt → User Confirm → Execute
```

- Permissions can be **revoked** at any time by the owner
- Write permissions default to **30-day expiry** (configurable)
- Critical permissions are **never cached** — always prompt
- On module disconnect, all active permissions are **suspended** (resume on reconnect within grace period)

### 1.5 Default Deny

Any action without an explicit permission grant returns:

```json
{
  "error": "permission_denied",
  "required_level": "write",
  "scope": "agent-x:relay-01:toggle",
  "action": "Request permission from device owner"
}
```

---

## 2. Action Audit Log

### 2.1 Log Schema

Every module interaction produces an immutable audit entry:

```json
{
  "id": "audit-uuid-v4",
  "timestamp": "2026-02-24T12:00:00.000Z",
  "agent_id": "home-climate",
  "module_id": "relay-01",
  "capability": "toggle",
  "action": "write",
  "command": {"state": "on"},
  "result": {"success": true, "previous_state": "off", "new_state": "on"},
  "latency_ms": 42,
  "permission_ref": "perm-uuid",
  "ip_origin": "192.168.1.50",
  "session_id": "sess-abc123"
}
```

### 2.2 Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | uuid | Unique audit entry ID |
| `timestamp` | ISO8601 | Server-side timestamp (not client) |
| `agent_id` | string | Who initiated the action |
| `module_id` | string | Target module |
| `capability` | string | Capability invoked |
| `action` | enum | `read` / `write` / `critical` / `denied` / `error` |
| `command` | object | The command payload sent |
| `result` | object | Outcome including previous/new state |
| `latency_ms` | int | Round-trip time |
| `permission_ref` | uuid | Which permission grant authorized this |

### 2.3 Denied & Error Entries

Failed attempts are **always logged** (critical for security forensics):

```json
{
  "action": "denied",
  "denial_reason": "rate_limit_exceeded",
  "command": {"state": "on"},
  "result": null
}
```

### 2.4 Retention & Export

- **Default retention**: 90 days (configurable per org)
- **Export format**: JSON Lines (`.jsonl`) or CSV
- **API endpoint**: `GET /api/audit?module_id=X&from=DATE&to=DATE`
- **Real-time stream**: WebSocket at `/api/audit/stream` for monitoring dashboards

### 2.5 Rollback Support

For write/critical actions, the audit log captures `previous_state`, enabling:

```
POST /api/audit/{audit-id}/rollback
```

Rollback creates a **new** audit entry with `rollback_of: "original-audit-id"`, maintaining full traceability.

---

## 3. Fault Protection (故障保护)

### 3.1 Network Loss Behavior

| Scenario | Behavior |
|----------|----------|
| Module loses WiFi | Continue executing **local rules** (pre-cached) |
| Agent loses connection | Module enters **safe state** (configurable per capability) |
| Platform outage | All modules fall back to local-only mode |

### 3.2 Emergency Stop (E-Stop)

Any module with `write` or `critical` capabilities MUST implement:

```yaml
capabilities:
  - id: "e_stop"
    type: "critical"
    description: "Immediately halt all actuator outputs"
    behavior: "set_all_outputs_to_safe_state"
    response_time_ms: 100  # max allowed
```

E-stop is:
- **Always available** (no permission check)
- **Locally executable** (no network required)
- **Logged** when connectivity restores

### 3.3 Local Rule Priority

Rules are evaluated in order:
1. E-stop (hardware interrupt)
2. Safety constraints (max temp, max current, etc.)
3. Local automation rules (cached from platform)
4. Remote agent commands

Remote commands **never override** levels 1-2.

---

## 4. Firmware Update Security

### 4.1 Requirements

- All firmware images **must be signed** (Ed25519, key managed by platform)
- Modules verify signature **before** applying update
- Failed verification → reject update, log attempt, alert owner
- Every update preserves **rollback partition** (A/B scheme)

### 4.2 Update Flow

```
Platform signs image → Module downloads → Verify signature
  → Write to inactive partition → Verify boot → Switch active
  → If boot fails within 60s → Auto-rollback to previous
```

### 4.3 CVE Response

- Platform maintains module dependency graph
- On CVE disclosure: identify affected modules → push advisory → optional force-update (owner opt-in)

---

## Implementation Priority

1. **Permission model** (core — block all writes without it)
2. **Audit logging** (required for trust)
3. **E-stop + safe states** (safety critical)
4. **Firmware signing** (pre-production)

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/permissions` | GET/POST | List/grant permissions |
| `/api/permissions/{id}` | DELETE | Revoke permission |
| `/api/permissions/check` | POST | Check if action is allowed |
| `/api/audit` | GET | Query audit log |
| `/api/audit/stream` | WS | Real-time audit stream |
| `/api/audit/{id}/rollback` | POST | Rollback an action |
| `/api/modules/{id}/e-stop` | POST | Emergency stop |
