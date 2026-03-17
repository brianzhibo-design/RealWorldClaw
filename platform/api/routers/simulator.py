"""WebSocket stream for hardware simulator telemetry."""

from __future__ import annotations

import asyncio
import json
import os
import urllib.error
import urllib.request

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter(prefix="/ws", tags=["simulator"])

SIMULATOR_BASE_URL = os.environ.get("RWC_SIMULATOR_URL", "http://127.0.0.1:8765")
SIMULATOR_DEVICE_ID = os.environ.get("RWC_SIMULATOR_DEVICE_ID", "rwc-sim-001")


def _fetch_status_sync() -> dict:
    path = f"/api/v1/devices/{SIMULATOR_DEVICE_ID}/status"
    req = urllib.request.Request(f"{SIMULATOR_BASE_URL}{path}", method="GET")
    with urllib.request.urlopen(req, timeout=3) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    return payload.get("data", {})


@router.websocket("/simulator")
async def ws_simulator(websocket: WebSocket):
    """Push simulator data to frontend in real-time."""
    await websocket.accept()

    try:
        while True:
            try:
                status = await asyncio.to_thread(_fetch_status_sync)
                await websocket.send_json(
                    {
                        "type": "simulator_status",
                        "source": "virtual_device",
                        "data": status,
                    }
                )
            except urllib.error.URLError as exc:
                await websocket.send_json(
                    {
                        "type": "simulator_error",
                        "message": f"simulator unreachable: {exc}",
                        "data": None,
                    }
                )
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return
