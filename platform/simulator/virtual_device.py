#!/usr/bin/env python3
"""Virtual hardware device simulator (temperature + humidity + relay).

Zero extra dependencies: Python standard library only.
"""

from __future__ import annotations

import json
import math
import threading
import time
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from typing import Any

# ANSI colors
RESET = "\033[0m"
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"

HOST = "127.0.0.1"
PORT = 8765
DEVICE_ID = "rwc-sim-001"


class DeviceState:
    def __init__(self) -> None:
        self.temperature_c = 25.0
        self.humidity_pct = 55.0
        self.relay_state = "off"
        self._phase = 0.0
        self.updated_at = datetime.now(timezone.utc)
        self._lock = threading.Lock()

    def step(self) -> None:
        with self._lock:
            self._phase += 0.08
            temp_wave = 25.0 + 4.5 * math.sin(self._phase)
            hum_wave = 55.0 + 12.0 * math.sin(self._phase * 0.85 + 0.7)
            self.temperature_c = min(30.0, max(20.0, temp_wave))
            self.humidity_pct = min(70.0, max(40.0, hum_wave))
            self.updated_at = datetime.now(timezone.utc)

    def set_relay(self, state: str) -> bool:
        if state not in {"on", "off"}:
            return False
        with self._lock:
            self.relay_state = state
            self.updated_at = datetime.now(timezone.utc)
        return True

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            return {
                "device_id": DEVICE_ID,
                "temperature": {"value": round(self.temperature_c, 2), "unit": "C"},
                "humidity": {"value": round(self.humidity_pct, 2), "unit": "%"},
                "relay": {"state": self.relay_state},
                "updated_at": self.updated_at.isoformat(),
            }


STATE = DeviceState()


class VirtualDeviceHandler(BaseHTTPRequestHandler):
    server_version = "RWCVirtualDevice/1.0"

    def _send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        if self.path in {"/health", "/api/v1/health"}:
            self._send_json(HTTPStatus.OK, {"status": "ok", "device_id": DEVICE_ID, "simulator": True})
            return

        if self.path in {"/api/v1/device/status", f"/api/v1/devices/{DEVICE_ID}/status"}:
            self._send_json(HTTPStatus.OK, {"code": 0, "message": "ok", "data": STATE.snapshot()})
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"code": 404, "message": "Not Found", "data": None})

    def do_POST(self) -> None:  # noqa: N802
        content_length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(content_length) if content_length > 0 else b"{}"

        try:
            payload = json.loads(raw.decode("utf-8")) if raw else {}
        except json.JSONDecodeError:
            self._send_json(HTTPStatus.BAD_REQUEST, {"code": 400, "message": "Invalid JSON", "data": None})
            return

        # Friendly simulator API
        if self.path == "/api/v1/device/relay":
            state = str(payload.get("state", "")).lower()
            if not STATE.set_relay(state):
                self._send_json(HTTPStatus.BAD_REQUEST, {"code": 400, "message": "state must be on/off", "data": None})
                return
            self._send_json(HTTPStatus.OK, {"code": 0, "message": "ok", "data": STATE.snapshot()})
            return

        # Compatible command-style API (closer to real hardware platform)
        if self.path == f"/api/v1/devices/{DEVICE_ID}/command":
            command = str(payload.get("command", "")).lower()
            mapping = {"relay_on": "on", "relay_off": "off"}
            state = mapping.get(command)
            if not state:
                self._send_json(HTTPStatus.BAD_REQUEST, {"code": 400, "message": "Unsupported command", "data": None})
                return
            STATE.set_relay(state)
            self._send_json(
                HTTPStatus.OK,
                {
                    "code": 0,
                    "message": "ok",
                    "data": {
                        "device_id": DEVICE_ID,
                        "command": command,
                        "relay_state": state,
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    },
                },
            )
            return

        self._send_json(HTTPStatus.NOT_FOUND, {"code": 404, "message": "Not Found", "data": None})

    def log_message(self, fmt: str, *args: Any) -> None:
        # Keep output clean; we render our own status panel.
        return


def simulation_loop() -> None:
    while True:
        STATE.step()
        snap = STATE.snapshot()
        relay_color = GREEN if snap["relay"]["state"] == "on" else RED
        print(
            f"{CYAN}📡 Sensor{RESET}  "
            f"🌡️ {YELLOW}{snap['temperature']['value']:>5.2f}°C{RESET}  "
            f"💧 {YELLOW}{snap['humidity']['value']:>5.2f}%{RESET}  "
            f"⚡ Relay: {relay_color}{BOLD}{snap['relay']['state'].upper()}{RESET}"
        )
        time.sleep(2)


def main() -> None:
    print(f"{BOLD}🚀 RealWorldClaw Virtual Device Booting...{RESET}")
    print(f"🔌 Device ID: {DEVICE_ID}")
    print(f"🌐 API: http://{HOST}:{PORT}/api/v1/device/status")
    print(f"🧪 Command endpoint: http://{HOST}:{PORT}/api/v1/devices/{DEVICE_ID}/command")

    threading.Thread(target=simulation_loop, daemon=True).start()

    server = ThreadingHTTPServer((HOST, PORT), VirtualDeviceHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Simulator stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
