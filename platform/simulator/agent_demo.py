#!/usr/bin/env python3
"""AI agent demo: auto-control relay based on temperature."""

from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request

# ANSI colors
RESET = "\033[0m"
GREEN = "\033[92m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
RED = "\033[91m"
BOLD = "\033[1m"

DEVICE_BASE_URL = os.environ.get("RWC_DEVICE_URL", "http://127.0.0.1:8765")
DEVICE_ID = os.environ.get("RWC_DEVICE_ID", "rwc-sim-001")
CHECK_INTERVAL_SECONDS = 5


def _http_json(method: str, path: str, payload: dict | None = None) -> dict:
    data = None
    headers = {"Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(f"{DEVICE_BASE_URL}{path}", data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=5) as resp:
        return json.loads(resp.read().decode("utf-8"))


def read_status() -> dict:
    result = _http_json("GET", f"/api/v1/devices/{DEVICE_ID}/status")
    return result["data"]


def set_relay(should_on: bool) -> None:
    command = "relay_on" if should_on else "relay_off"
    _http_json("POST", f"/api/v1/devices/{DEVICE_ID}/command", {"command": command})


def decision_text(temp: float, relay_state: str) -> tuple[str, bool | None]:
    if temp > 27 and relay_state != "on":
        return f"Temperature: {temp:.2f}°C → Above threshold → Turning ON relay", True
    if temp < 24 and relay_state != "off":
        return f"Temperature: {temp:.2f}°C → Below threshold → Turning OFF relay", False
    return f"Temperature: {temp:.2f}°C → In safe range → Keep relay {relay_state.upper()}", None


def main() -> None:
    print(f"{BOLD}🤖 RealWorldClaw AI Agent Demo Started{RESET}")
    print(f"🔗 Target device API: {DEVICE_BASE_URL}")
    print("🧠 Policy: >27°C => relay ON, <24°C => relay OFF")

    while True:
        try:
            status = read_status()
            temp = float(status["temperature"]["value"])
            humidity = float(status["humidity"]["value"])
            relay_state = str(status["relay"]["state"]).lower()

            msg, action = decision_text(temp, relay_state)
            print(f"{CYAN}📥 Readings{RESET}  🌡️ {YELLOW}{temp:.2f}°C{RESET}  💧 {YELLOW}{humidity:.2f}%{RESET}  ⚡ {relay_state.upper()}")
            if action is True:
                print(f"{GREEN}✅ {msg}{RESET}")
                set_relay(True)
            elif action is False:
                print(f"{RED}🛑 {msg}{RESET}")
                set_relay(False)
            else:
                print(f"{YELLOW}⏸️ {msg}{RESET}")

        except urllib.error.URLError as exc:
            print(f"{RED}❌ Device unreachable: {exc}{RESET}")
        except Exception as exc:
            print(f"{RED}❌ Unexpected error: {exc}{RESET}")

        time.sleep(CHECK_INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
