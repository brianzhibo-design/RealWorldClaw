from __future__ import annotations

import time

from starlette.websockets import WebSocketState

from api.ws_manager import Connection, ConnectionManager


class _FakeWebSocket:
    def __init__(self):
        self.sent: list[dict] = []
        self.closed = False
        self.client_state = WebSocketState.CONNECTED
        self.application_state = WebSocketState.CONNECTED

    async def send_json(self, data: dict):
        self.sent.append(data)

    async def close(self, code: int = 1000, reason: str | None = None):
        self.closed = True
        self.client_state = WebSocketState.DISCONNECTED


def test_heartbeat_disconnects_stale_connections():
    manager = ConnectionManager()
    ws = _FakeWebSocket()
    conn = Connection(websocket=ws, channel="orders", target_id="u1", user_id="u1", last_pong=time.time() - 31)
    manager._connections = {"orders": {"u1": [conn]}}

    import asyncio

    asyncio.run(manager._heartbeat_once())

    assert ws.closed is True
    assert manager.connection_count == 0


def test_heartbeat_sends_ping_to_alive_connection():
    manager = ConnectionManager()
    ws = _FakeWebSocket()
    conn = Connection(websocket=ws, channel="orders", target_id="u1", user_id="u1", last_pong=time.time())
    manager._connections = {"orders": {"u1": [conn]}}

    import asyncio

    asyncio.run(manager._heartbeat_once())

    assert any(msg.get("type") == "ping" for msg in ws.sent)
    assert ws.closed is False
    assert manager.connection_count == 1
