#!/usr/bin/env python3
"""RealWorldClaw Health Monitor — checks endpoints every 60s, alerts on 3 consecutive failures."""

import json
import logging
import time
from datetime import datetime, timezone

import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("health-monitor")

ENDPOINTS = [
    {"name": "Landing Page", "url": "https://realworldclaw.com", "expect_status": 200},
    {"name": "API Health", "url": "https://realworldclaw-api.fly.dev/api/v1/health", "expect_status": 200},
    {"name": "Frontend", "url": "https://realworldclaw-api.fly.dev/", "expect_status": 200},
]

INTERVAL = 60  # seconds
ALERT_THRESHOLD = 3
TIMEOUT = 10
LOG_FILE = "health-monitor.log"

fail_counts: dict[str, int] = {ep["name"]: 0 for ep in ENDPOINTS}
history: list[dict] = []


def check_endpoint(ep: dict) -> dict:
    start = time.monotonic()
    try:
        r = requests.get(ep["url"], timeout=TIMEOUT, allow_redirects=True)
        elapsed_ms = round((time.monotonic() - start) * 1000)
        ok = r.status_code == ep["expect_status"]
        return {
            "name": ep["name"],
            "url": ep["url"],
            "status_code": r.status_code,
            "response_time_ms": elapsed_ms,
            "ok": ok,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    except Exception as e:
        elapsed_ms = round((time.monotonic() - start) * 1000)
        return {
            "name": ep["name"],
            "url": ep["url"],
            "status_code": None,
            "response_time_ms": elapsed_ms,
            "ok": False,
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }


def alert(name: str, result: dict):
    """Fire alert — extend this with Slack/email/webhook as needed."""
    log.error(f"🚨 ALERT: {name} has failed {ALERT_THRESHOLD} consecutive times! Latest: {json.dumps(result)}")


def run():
    log.info(f"🐾 RealWorldClaw Health Monitor started — checking {len(ENDPOINTS)} endpoints every {INTERVAL}s")
    while True:
        for ep in ENDPOINTS:
            result = check_endpoint(ep)
            history.append(result)

            if result["ok"]:
                fail_counts[ep["name"]] = 0
                log.info(f"✅ {ep['name']} — {result['response_time_ms']}ms")
            else:
                fail_counts[ep["name"]] += 1
                log.warning(f"❌ {ep['name']} — fail #{fail_counts[ep['name']]} — {result.get('error', result.get('status_code'))}")
                if fail_counts[ep["name"]] >= ALERT_THRESHOLD:
                    alert(ep["name"], result)

        # Persist last 1000 entries
        with open(LOG_FILE, "w") as f:
            json.dump(history[-1000:], f, indent=2)

        time.sleep(INTERVAL)


if __name__ == "__main__":
    run()
