"""Event bus for RealWorldClaw — pub/sub with WebSocket integration."""

from __future__ import annotations

import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Callable, Awaitable

logger = logging.getLogger(__name__)

EventHandler = Callable[["Event"], Awaitable[None]]


@dataclass
class Event:
    type: str
    data: dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        return {"type": self.type, "data": self.data, "timestamp": self.timestamp}


class EventBus:
    """Simple async pub/sub event bus."""

    def __init__(self) -> None:
        self._handlers: dict[str, list[EventHandler]] = {}

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        self._handlers.setdefault(event_type, []).append(handler)

    def unsubscribe(self, event_type: str, handler: EventHandler) -> None:
        handlers = self._handlers.get(event_type, [])
        try:
            handlers.remove(handler)
        except ValueError:
            pass

    async def publish(self, event: Event) -> None:
        logger.info("Event published: %s", event.type)
        handlers = self._handlers.get(event.type, []) + self._handlers.get("*", [])
        for handler in handlers:
            try:
                await handler(event)
            except Exception:
                logger.exception("Error in event handler for %s", event.type)


# Singleton
event_bus = EventBus()


# --- Wire events to WebSocket manager ---

async def _ws_printer_handler(event: Event) -> None:
    from .ws_manager import manager
    printer_id = event.data.get("printer_id", "")
    if printer_id:
        await manager.send_to("printer", printer_id, event.to_dict())


async def _ws_order_handler(event: Event) -> None:
    from .ws_manager import manager
    user_id = event.data.get("user_id", "")
    if user_id:
        await manager.send_to("orders", user_id, event.to_dict())


async def _ws_notification_handler(event: Event) -> None:
    from .ws_manager import manager
    user_id = event.data.get("user_id", "")
    if user_id:
        await manager.send_to("notifications", user_id, event.to_dict())


def setup_event_handlers() -> None:
    """Register default event->WebSocket handlers."""
    event_bus.subscribe("printer_status_changed", _ws_printer_handler)
    event_bus.subscribe("print_progress", _ws_printer_handler)
    event_bus.subscribe("order_status_changed", _ws_order_handler)
    event_bus.subscribe("module_discovered", _ws_printer_handler)
    event_bus.subscribe("notification", _ws_notification_handler)
