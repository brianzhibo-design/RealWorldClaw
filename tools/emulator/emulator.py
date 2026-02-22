#!/usr/bin/env python3
"""RWC Module Emulator — Simulate physical modules without hardware."""

import argparse
import asyncio
import json
import random
import time
from datetime import datetime, timezone

try:
    from rich.console import Console
    from rich.table import Table
    console = Console()
    def log(msg, style=""):
        console.print(f"[dim]{datetime.now().strftime('%H:%M:%S')}[/dim] {msg}", style=style)
except ImportError:
    def log(msg, style=""):
        print(f"{datetime.now().strftime('%H:%M:%S')} {msg}")

# Built-in virtual modules
MODULES = {
    "temp-humidity": {
        "id": "rwc-temp-humidity-v1",
        "name": "Temperature & Humidity Sensor",
        "type": "sensor",
        "capabilities": [
            {"id": "temperature", "type": "read", "unit": "celsius", "base": 22.0, "noise": 1.5, "range": [-40, 80]},
            {"id": "humidity", "type": "read", "unit": "percent", "base": 55.0, "noise": 5.0, "range": [0, 100]},
        ]
    },
    "relay": {
        "id": "rwc-relay-v1",
        "name": "Relay Module",
        "type": "actuator",
        "capabilities": [
            {"id": "switch", "type": "write", "unit": "boolean", "state": False},
        ]
    },
    "light-sensor": {
        "id": "rwc-light-sensor-v1",
        "name": "Ambient Light Sensor",
        "type": "sensor",
        "capabilities": [
            {"id": "lux", "type": "read", "unit": "lux", "base": 500.0, "noise": 50.0, "range": [0, 65535]},
        ]
    },
    "servo": {
        "id": "rwc-servo-v1",
        "name": "Servo Motor",
        "type": "actuator",
        "capabilities": [
            {"id": "angle", "type": "write", "unit": "degrees", "state": 90, "range": [0, 180]},
        ]
    },
}


def generate_telemetry(module: dict) -> list:
    """Generate simulated sensor readings."""
    readings = []
    for cap in module["capabilities"]:
        if cap["type"] in ("read", "read-write"):
            base = cap.get("base", 0)
            noise = cap.get("noise", 0)
            value = round(base + random.gauss(0, noise), 2)
            rng = cap.get("range", [float("-inf"), float("inf")])
            value = max(rng[0], min(rng[1], value))
            readings.append({
                "type": "telemetry",
                "module_id": module["id"],
                "capability": cap["id"],
                "value": value,
                "unit": cap["unit"],
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
    return readings


def handle_command(module: dict, capability_id: str, value) -> dict:
    """Handle an incoming command for an actuator."""
    for cap in module["capabilities"]:
        if cap["id"] == capability_id and cap["type"] in ("write", "read-write"):
            cap["state"] = value
            return {
                "type": "response",
                "status": "ok",
                "module_id": module["id"],
                "capability": capability_id,
                "value": value,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
    return {"type": "response", "status": "error", "message": f"Unknown capability: {capability_id}"}


async def run_emulator(module_names: list, interval: float = 2.0, api_url: str = None, agent_key: str = None):
    """Main emulator loop."""
    modules = []
    for name in module_names:
        if name in MODULES:
            modules.append(MODULES[name])
            log(f"[green]✓[/green] Loaded module: [bold]{MODULES[name]['name']}[/bold] ({MODULES[name]['id']})")
        else:
            log(f"[red]✗[/red] Unknown module: {name}. Available: {', '.join(MODULES.keys())}")

    if not modules:
        log("[red]No valid modules loaded. Exiting.[/red]")
        return

    log(f"\n[bold]Emulator running[/bold] — {len(modules)} module(s), interval {interval}s")
    log("Press Ctrl+C to stop\n")

    try:
        while True:
            for module in modules:
                readings = generate_telemetry(module)
                for r in readings:
                    emoji = "🌡️" if "temp" in r["capability"] else "💧" if "humid" in r["capability"] else "💡" if "lux" in r["capability"] else "📊"
                    log(f"{emoji} [cyan]{module['name']}[/cyan] → {r['capability']}: [bold]{r['value']}[/bold] {r['unit']}")

                    # Post to API if configured
                    if api_url and agent_key:
                        try:
                            import httpx
                            async with httpx.AsyncClient() as client:
                                await client.post(
                                    f"{api_url}/api/v1/ai-posts",
                                    json={
                                        "content": f"{emoji} {r['capability']}: {r['value']} {r['unit']}",
                                        "tags": ["emulator", "telemetry", r["capability"]],
                                    },
                                    headers={"Authorization": f"Bearer {agent_key}"},
                                    timeout=5,
                                )
                        except Exception as e:
                            log(f"[dim]API post failed: {e}[/dim]")

            await asyncio.sleep(interval)
    except KeyboardInterrupt:
        log("\n[yellow]Emulator stopped.[/yellow]")


def main():
    parser = argparse.ArgumentParser(description="RWC Module Emulator")
    parser.add_argument("--module", "-m", default="temp-humidity",
                        help="Module(s) to emulate, comma-separated (default: temp-humidity)")
    parser.add_argument("--interval", "-i", type=float, default=2.0,
                        help="Telemetry interval in seconds (default: 2)")
    parser.add_argument("--api", help="RWC API URL to post telemetry")
    parser.add_argument("--agent-key", help="Agent API key for posting")
    parser.add_argument("--list", action="store_true", help="List available modules")
    args = parser.parse_args()

    if args.list:
        print("\nAvailable modules:")
        for key, mod in MODULES.items():
            caps = ", ".join(c["id"] for c in mod["capabilities"])
            print(f"  {key:20s} {mod['type']:10s} [{caps}]")
        print()
        return

    module_names = [m.strip() for m in args.module.split(",")]
    asyncio.run(run_emulator(module_names, args.interval, args.api, args.agent_key))


if __name__ == "__main__":
    main()
