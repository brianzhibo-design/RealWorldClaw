"""WebSocket endpoints for RealWorldClaw real-time communication."""

from __future__ import annotations

import asyncio
import json
import logging

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from jose import JWTError

from ..security import decode_token
from ..ws_manager import manager

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ws", tags=["websocket"])

AUTH_FIRST_MSG_TIMEOUT_SECONDS = 5


async def _safe_close(ws: WebSocket, *, code: int, reason: str) -> None:
    try:
        await ws.close(code=code, reason=reason)
    except Exception:
        # Ignore second-close / disconnected socket errors.
        pass


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
            first_msg = await asyncio.wait_for(
                ws.receive_json(),
                timeout=AUTH_FIRST_MSG_TIMEOUT_SECONDS,
            )
        except WebSocketDisconnect:
            return None
        except asyncio.TimeoutError:
            await _safe_close(ws, code=4001, reason="Auth timeout")
            return None
        except (json.JSONDecodeError, ValueError):
            await _safe_close(ws, code=4001, reason="Invalid auth payload")
            return None

        if not isinstance(first_msg, dict):
            await _safe_close(ws, code=4001, reason="Invalid auth payload")
            return None

        if first_msg.get("type") != "auth":
            await _safe_close(ws, code=4001, reason="Invalid auth payload")
            return None

        if not first_msg.get("token"):
            await _safe_close(ws, code=4001, reason="Missing token")
            return None

        incoming_token = first_msg["token"]

    try:
        payload = decode_token(incoming_token)
    except JWTError:
        await _safe_close(ws, code=4001, reason="Invalid token")
        return None

    if payload.get("type") != "access":
        await _safe_close(ws, code=4001, reason="Invalid token type")
        return None

    if not payload.get("sub"):
        await _safe_close(ws, code=4001, reason="Invalid token payload")
        return None

    return payload


async def _check_ws_authorization(ws: WebSocket, channel: str, target_id: str, payload: dict) -> bool:
    """IDOR防护：校验 token 身份与目标资源关系。"""
    sub = payload.get("sub")
    role = payload.get("role")
    is_admin = role == "admin"

    if channel == "notifications":
        allowed = sub == target_id
    elif channel == "orders":
        allowed = (sub == target_id) or is_admin
    elif channel == "printer":
        # 简化版：按用户身份校验，防止跨用户越权订阅。
        allowed = sub == target_id
    else:
        allowed = True

    if not allowed:
        await _safe_close(ws, code=4003, reason="Forbidden")
        return False

    return True


async def _ws_loop(ws: WebSocket, channel: str, target_id: str, token: str | None) -> None:
    payload = await _authenticate_ws(ws, token)
    if not payload:
        return

    if not await _check_ws_authorization(ws, channel, target_id, payload):
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
