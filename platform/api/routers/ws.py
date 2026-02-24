"""WebSocket endpoints for RealWorldClaw real-time communication."""

from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from jose import JWTError

from ..security import decode_token
from ..ws_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["websocket"])


async def _authenticate_ws(ws: WebSocket, token: str | None) -> dict | None:
    """Validate JWT token for WebSocket. Returns payload or None.

    Supports two auth modes for backward compatibility:
    1) Query token: ws://.../ws/...?...&token=<jwt>
    2) First message auth: {"type":"auth","token":"<jwt>"}
    """
    incoming_token = token

    if not incoming_token:
        await ws.accept()
        try:
            first_msg = await ws.receive_json()
        except Exception:
            await ws.close(code=4001, reason="Missing token")
            return None

        if first_msg.get("type") != "auth" or not first_msg.get("token"):
            await ws.close(code=4001, reason="Missing token")
            return None
        incoming_token = first_msg["token"]

    try:
        payload = decode_token(incoming_token)
    except JWTError:
        await ws.close(code=4001, reason="Invalid token")
        return None
    if payload.get("type") != "access":
        await ws.close(code=4001, reason="Invalid token type")
        return None
    if not payload.get("sub"):
        await ws.close(code=4001, reason="Invalid token payload")
        return None
    return payload


async def _ws_loop(ws: WebSocket, channel: str, target_id: str, token: str | None) -> None:
    payload = await _authenticate_ws(ws, token)
    if not payload:
        return
    user_id = payload["sub"]
    conn = await manager.connect(ws, channel, target_id, user_id)
    try:
        while True:
            data = await ws.receive_json()
            # Handle pong responses
            if data.get("type") == "pong":
                import time
                conn.last_pong = time.time()
    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception("WS error: channel=%s target=%s", channel, target_id)
    finally:
        manager.disconnect(conn)


@router.websocket("/printer/{printer_id}")
async def ws_printer(websocket: WebSocket, printer_id: str, token: str | None = Query(None)):
    await _ws_loop(websocket, "printer", printer_id, token)


@router.websocket("/orders/{user_id}")
async def ws_orders(websocket: WebSocket, user_id: str, token: str | None = Query(None)):
    await _ws_loop(websocket, "orders", user_id, token)


@router.websocket("/notifications/{user_id}")
async def ws_notifications(websocket: WebSocket, user_id: str, token: str | None = Query(None)):
    await _ws_loop(websocket, "notifications", user_id, token)
