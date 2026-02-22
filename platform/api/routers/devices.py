"""RealWorldClaw — Hardware Device API endpoints.

Supports device registration, telemetry ingestion, command dispatch, and status queries.
"""

from __future__ import annotations

import json
import secrets
import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from ..database import get_db
from ..deps import get_current_user

router = APIRouter(prefix="/devices", tags=["devices"])

# ── Pydantic schemas ────────────────────────────────────────────

class DeviceRegisterRequest(BaseModel):
    device_id: str = Field(..., description="Unique hardware identifier (e.g. MAC address)")
    name: str = Field(..., description="Human-friendly device name")
    type: str = Field(..., description="Device type: sensor, relay, printer, camera, etc.")
    capabilities: list[str] = Field(default_factory=list, description="List of capabilities")


class DeviceRegisterResponse(BaseModel):
    id: str
    device_id: str
    name: str
    device_token: str


class TelemetryRequest(BaseModel):
    timestamp: str = Field(..., description="ISO-8601 timestamp")
    sensor_type: str = Field(..., description="e.g. temperature, humidity, current")
    value: float
    unit: str = Field(..., description="e.g. °C, %, A")


class CommandRequest(BaseModel):
    command: str = Field(..., description="Command name, e.g. relay_on, relay_off, reboot")
    parameters: dict[str, Any] = Field(default_factory=dict)
    requester_agent_id: str = Field(..., description="Agent that requested this command")


class CommandResponse(BaseModel):
    command_id: str
    status: str
    message: str


# ── Auth helper for device tokens ───────────────────────────────

def require_device_token(authorization: str = Header(...)) -> dict:
    """Validate Bearer device_token and return the device row."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    token = authorization.removeprefix("Bearer ")
    with get_db() as db:
        row = db.execute("SELECT * FROM devices WHERE device_token = ?", (token,)).fetchone()
    if not row:
        raise HTTPException(status_code=401, detail="Invalid device token")
    return dict(row)


def _verify_device_access(device_id: str, token_header: str) -> dict:
    """Verify the bearer token matches the target device."""
    device = require_device_token(token_header)
    if device["device_id"] != device_id:
        raise HTTPException(status_code=403, detail="Token does not match device_id")
    return device


# ── Endpoints ────────────────────────────────────────────────────

@router.post("/register", response_model=DeviceRegisterResponse)
def register_device(req: DeviceRegisterRequest, user: dict = Depends(get_current_user)):
    """Register a new hardware device. Requires JWT auth (platform user)."""
    now = datetime.now(timezone.utc).isoformat()
    row_id = str(uuid.uuid4())
    device_token = f"rwc_dev_{secrets.token_urlsafe(32)}"

    with get_db() as db:
        # Check for duplicate device_id
        existing = db.execute("SELECT id FROM devices WHERE device_id = ?", (req.device_id,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="Device already registered")

        db.execute(
            """INSERT INTO devices (id, device_id, name, type, capabilities, device_token,
                                    owner_id, status, created_at, updated_at, last_seen_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'online', ?, ?, ?)""",
            (row_id, req.device_id, req.name, req.type,
             json.dumps(req.capabilities), device_token,
             user["id"], now, now, now),
        )

    return DeviceRegisterResponse(id=row_id, device_id=req.device_id, name=req.name, device_token=device_token)


@router.post("/{device_id}/telemetry", status_code=201)
def ingest_telemetry(device_id: str, req: TelemetryRequest, authorization: str = Header(...)):
    """Receive telemetry data from a device. Requires Bearer device_token."""
    device = _verify_device_access(device_id, authorization)
    now = datetime.now(timezone.utc).isoformat()
    tel_id = str(uuid.uuid4())

    with get_db() as db:
        db.execute(
            """INSERT INTO telemetry (id, device_id, timestamp, sensor_type, value, unit, received_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (tel_id, device["id"], req.timestamp, req.sensor_type, req.value, req.unit, now),
        )
        # Update last_seen
        db.execute("UPDATE devices SET last_seen_at = ?, updated_at = ? WHERE id = ?",
                    (now, now, device["id"]))

    return {"id": tel_id, "status": "accepted"}


@router.post("/{device_id}/command", response_model=CommandResponse)
def send_command(device_id: str, req: CommandRequest, user: dict = Depends(get_current_user)):
    """Send a control command to a device. Requires JWT auth."""
    now = datetime.now(timezone.utc).isoformat()
    cmd_id = str(uuid.uuid4())

    with get_db() as db:
        device = db.execute("SELECT * FROM devices WHERE device_id = ?", (device_id,)).fetchone()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")

        # Validate relay commands
        valid_commands = {"relay_on", "relay_off", "reboot", "ping", "set_config"}
        if req.command not in valid_commands:
            raise HTTPException(status_code=400, detail=f"Unknown command. Valid: {', '.join(sorted(valid_commands))}")

        db.execute(
            """INSERT INTO device_commands (id, device_id, command, parameters, requester_agent_id, status, created_at)
               VALUES (?, ?, ?, ?, ?, 'pending', ?)""",
            (cmd_id, device["id"], req.command, json.dumps(req.parameters), req.requester_agent_id, now),
        )

    return CommandResponse(command_id=cmd_id, status="pending", message=f"Command '{req.command}' queued for {device_id}")


@router.get("/{device_id}/status")
def get_device_status(device_id: str, user: dict = Depends(get_current_user)):
    """Query device status including last seen time, recent telemetry, and health."""
    with get_db() as db:
        device = db.execute("SELECT * FROM devices WHERE device_id = ?", (device_id,)).fetchone()
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")

        # Recent telemetry (last 10)
        telemetry = db.execute(
            """SELECT sensor_type, value, unit, timestamp, received_at
               FROM telemetry WHERE device_id = ? ORDER BY received_at DESC LIMIT 10""",
            (device["id"],),
        ).fetchall()

        # Pending commands
        pending_cmds = db.execute(
            "SELECT id, command, status, created_at FROM device_commands WHERE device_id = ? ORDER BY created_at DESC LIMIT 5",
            (device["id"],),
        ).fetchall()

    # Determine health
    last_seen = device["last_seen_at"]
    if last_seen:
        delta = (datetime.now(timezone.utc) - datetime.fromisoformat(last_seen)).total_seconds()
        health = "healthy" if delta < 300 else ("degraded" if delta < 3600 else "offline")
    else:
        health = "unknown"

    return {
        "device_id": device["device_id"],
        "name": device["name"],
        "type": device["type"],
        "status": device["status"],
        "capabilities": json.loads(device["capabilities"] or "[]"),
        "health": health,
        "last_seen_at": last_seen,
        "created_at": device["created_at"],
        "recent_telemetry": [dict(t) for t in telemetry],
        "pending_commands": [dict(c) for c in pending_cmds],
    }
