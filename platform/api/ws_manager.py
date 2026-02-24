"""WebSocket connection manager for RealWorldClaw."""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from typing import Any

from fastapi import WebSocket
from starlette.websockets import WebSocketState

logger = logging.getLogger(__name__)

HEARTBEAT_INTERVAL = 30  # seconds


@dataclass
class Connection:
    websocket: WebSocket
    channel: str  # "printer", "orders", "notifications"
    target_id: str  # printer_id or user_id
    user_id: str
    connected_at: float = field(default_factory=time.time)
    last_pong: float = field(default_factory=time.time)


class ConnectionManager:
    """Manage WebSocket connections grouped by channel and target_id."""

    def __init__(self) -> None:
        # channel -> target_id -> list[Connection]
        self._connections: dict[str, dict[str, list[Connection]]] = {}
        self._heartbeat_task: asyncio.Task | None = None

    async def connect(self, ws: WebSocket, channel: str, target_id: str, user_id: str) -> Connection:
        if ws.application_state != WebSocketState.CONNECTED:
            await ws.accept()
        conn = Connection(websocket=ws, channel=channel, target_id=target_id, user_id=user_id)
        self._connections.setdefault(channel, {}).setdefault(target_id, []).append(conn)
        logger.info("WS connected: channel=%s target=%s user=%s", channel, target_id, user_id)
        return conn

    def disconnect(self, conn: Connection) -> None:
        bucket = self._connections.get(conn.channel, {}).get(conn.target_id, [])
        try:
            bucket.remove(conn)
        except ValueError:
            pass
        # cleanup empty buckets
        if not bucket:
            self._connections.get(conn.channel, {}).pop(conn.target_id, None)
        logger.info("WS disconnected: channel=%s target=%s user=%s", conn.channel, conn.target_id, conn.user_id)

    async def send_to(self, channel: str, target_id: str, data: dict[str, Any]) -> int:
        """Send message to all connections on channel/target_id. Returns count sent."""
        conns = self._connections.get(channel, {}).get(target_id, [])
        sent = 0
        dead: list[Connection] = []
        for conn in conns:
            try:
                await conn.websocket.send_json(data)
                sent += 1
            except Exception:
                dead.append(conn)
        for c in dead:
            self.disconnect(c)
        return sent

    async def broadcast(self, channel: str, data: dict[str, Any]) -> int:
        """Broadcast to ALL connections in a channel."""
        targets = self._connections.get(channel, {})
        sent = 0
        for target_id in list(targets.keys()):
            sent += await self.send_to(channel, target_id, data)
        return sent

    def start_heartbeat(self) -> None:
        if self._heartbeat_task is None or self._heartbeat_task.done():
            self._heartbeat_task = asyncio.create_task(self._heartbeat_loop())

    def stop_heartbeat(self) -> None:
        if self._heartbeat_task and not self._heartbeat_task.done():
            self._heartbeat_task.cancel()

    async def _heartbeat_loop(self) -> None:
        while True:
            await asyncio.sleep(HEARTBEAT_INTERVAL)
            now = time.time()
            dead: list[Connection] = []
            for channel_targets in self._connections.values():
                for conns in channel_targets.values():
                    for conn in conns:
                        try:
                            await conn.websocket.send_json({"type": "ping", "ts": now})
                        except Exception:
                            dead.append(conn)
            for c in dead:
                self.disconnect(c)

    @property
    def connection_count(self) -> int:
        return sum(
            len(conns)
            for targets in self._connections.values()
            for conns in targets.values()
        )


# Singleton
manager = ConnectionManager()
