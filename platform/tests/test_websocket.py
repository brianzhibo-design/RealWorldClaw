"""Tests for WebSocket real-time communication system."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from api.main import app
from api.security import create_access_token
from api.events import Event, EventBus
from api.ws_manager import ConnectionManager


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def valid_token():
    return create_access_token({"sub": "test-user-1", "type": "access"})


# --- WebSocket Connection Tests ---

class TestWebSocketConnection:
    def test_printer_ws_no_token_rejected(self, client):
        with pytest.raises(Exception):
            with client.websocket_connect("/api/v1/ws/printer/printer-1"):
                pass

    def test_printer_ws_invalid_token_rejected(self, client):
        with pytest.raises(Exception):
            with client.websocket_connect("/api/v1/ws/printer/printer-1?token=bad-token"):
                pass

    def test_printer_ws_connects_with_valid_token(self, client, valid_token):
        with client.websocket_connect(f"/api/v1/ws/printer/printer-1?token={valid_token}"):
            # Connection should be established; we can close cleanly
            pass

    def test_orders_ws_connects(self, client, valid_token):
        with client.websocket_connect(f"/api/v1/ws/orders/test-user-1?token={valid_token}"):
            pass

    def test_notifications_ws_connects(self, client, valid_token):
        with client.websocket_connect(f"/api/v1/ws/notifications/test-user-1?token={valid_token}"):
            pass


# --- Event Bus Tests ---

class TestEventBus:
    @pytest.mark.anyio
    async def test_publish_subscribe(self):
        bus = EventBus()
        received = []

        async def handler(event: Event):
            received.append(event)

        bus.subscribe("test_event", handler)
        await bus.publish(Event(type="test_event", data={"foo": "bar"}))
        assert len(received) == 1
        assert received[0].data["foo"] == "bar"

    @pytest.mark.anyio
    async def test_wildcard_subscriber(self):
        bus = EventBus()
        received = []

        async def handler(event: Event):
            received.append(event)

        bus.subscribe("*", handler)
        await bus.publish(Event(type="anything", data={}))
        assert len(received) == 1

    @pytest.mark.anyio
    async def test_unsubscribe(self):
        bus = EventBus()
        received = []

        async def handler(event: Event):
            received.append(event)

        bus.subscribe("x", handler)
        bus.unsubscribe("x", handler)
        await bus.publish(Event(type="x", data={}))
        assert len(received) == 0


# --- Connection Manager Tests ---

class TestConnectionManager:
    def test_connection_count_starts_zero(self):
        mgr = ConnectionManager()
        assert mgr.connection_count == 0


# --- Printer Simulation Tests ---

class TestPrinterSim:
    def test_print_start(self, client):
        resp = client.post("/api/v1/sim/print-start", json={"printer_id": "p1"})
        assert resp.status_code == 200
        assert resp.json()["ok"] is True
        assert resp.json()["event"]["type"] == "printer_status_changed"

    def test_print_progress(self, client):
        resp = client.post("/api/v1/sim/print-progress", json={"printer_id": "p1", "progress": 50.0})
        assert resp.status_code == 200
        assert resp.json()["event"]["data"]["progress"] == 50.0

    def test_print_progress_validation(self, client):
        resp = client.post("/api/v1/sim/print-progress", json={"printer_id": "p1", "progress": 150})
        assert resp.status_code == 422

    def test_print_complete(self, client):
        resp = client.post("/api/v1/sim/print-complete", json={"printer_id": "p1"})
        assert resp.status_code == 200
        assert resp.json()["event"]["data"]["status"] == "idle"
