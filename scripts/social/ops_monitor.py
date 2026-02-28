#!/usr/bin/env python3
"""ops_monitor.py — RWC运营数据监控
汇总各平台数据，支持实时轮询模式。
"""

import json
import time
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

CST = timezone(timedelta(hours=8))
SCRIPT_DIR = Path(__file__).parent.resolve()
POSTED_LOG = Path.home() / "openclaw/yangcun/realworldclaw/content/posted-log.json"
REPLIED_LOG = SCRIPT_DIR / "replied-log.json"

PLATFORMS = ["community", "x", "xhs", "moltbook"]


def load_json(path, default=None):
    try:
        with open(path) as f:
            return json.load(f)
    except:
        return default if default is not None else []


def get_status():
    posted = load_json(POSTED_LOG, [])
    replied = load_json(REPLIED_LOG, {})
    today = datetime.now(CST).strftime("%Y-%m-%d")

    status = {}
    for plat in PLATFORMS:
        posts_today = 0
        posts_total = 0
        if isinstance(posted, list):
            for e in posted:
                if e.get("platform") == plat:
                    posts_total += 1
                    if e.get("timestamp", "").startswith(today) and e.get("status") in ("success", "dry-run"):
                        posts_today += 1

        replies_today = 0
        replies_total = 0
        if isinstance(replied, dict):
            for key, e in replied.items():
                # 简单统计所有回复（replied-log不区分平台，除非有type字段）
                etype = e.get("type", "")
                is_plat = (
                    (plat == "community" and etype in ("post", "comment_reply", ""))
                    or (plat == "x" and etype == "x_reply")
                    or (plat == "xhs" and etype == "xhs_reply")
                    or (plat == "moltbook" and etype == "moltbook_reply")
                )
                if is_plat:
                    replies_total += 1
                    if e.get("time", "").startswith(today):
                        replies_today += 1

        status[plat] = {
            "posts_today": posts_today,
            "posts_total": posts_total,
            "replies_today": replies_today,
            "replies_total": replies_total,
        }

    return status


def print_status():
    status = get_status()
    now = datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S")

    print(f"\n{'=' * 55}")
    print(f"  📊 RWC运营监控面板 — {now}")
    print(f"{'=' * 55}")

    for plat in PLATFORMS:
        s = status[plat]
        print(f"\n  📌 {plat.upper()}")
        print(f"     发帖: {s['posts_today']} 今日 / {s['posts_total']} 总计")
        print(f"     回复: {s['replies_today']} 今日 / {s['replies_total']} 总计")

    print(f"\n{'=' * 55}")

    # 总计
    total_posts = sum(s["posts_today"] for s in status.values())
    total_replies = sum(s["replies_today"] for s in status.values())
    print(f"  📈 今日总计: {total_posts} 帖 + {total_replies} 回复")
    print(f"{'=' * 55}\n")


def monitor_loop(interval=30):
    """轮询模式"""
    print("🔍 进入实时监控模式 (Ctrl+C退出)")
    try:
        while True:
            print_status()
            time.sleep(interval)
    except KeyboardInterrupt:
        print("\n👋 监控结束")


if __name__ == "__main__":
    if "--loop" in sys.argv:
        monitor_loop()
    else:
        print_status()
