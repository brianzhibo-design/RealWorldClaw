#!/usr/bin/env python3
"""运营数据统计 — 沸羊羊🐏出品

读取 posted-log.json 和 replied-log.json，统计今日各平台发帖/回复数据。
"""

import json
import os
import time
from datetime import datetime
from typing import Any, Optional

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONTENT_DIR = os.path.join(os.path.expanduser("~"), "openclaw", "yangcun", "realworldclaw", "content")

POSTED_LOG = os.path.join(CONTENT_DIR, "posted-log.json")
REPLIED_LOG = os.path.join(SCRIPT_DIR, "replied-log.json")

# 每日发帖/回复上限
DAILY_LIMITS = {
    "posts": {"community": 5, "x": 2, "xhs": 2, "moltbook": 5},
    "replies": {"community": 10, "x": 5, "xhs": 5, "moltbook": 10},
}

PLATFORMS = ["community", "x", "xhs", "moltbook"]


def _load_json(path: str) -> Any:
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []


def _today_str() -> str:
    return datetime.now().strftime("%Y-%m-%d")


def get_daily_stats(date: Optional[str] = None) -> dict:
    """读取posted-log.json和replied-log.json，统计指定日期各平台数据

    Args:
        date: 日期字符串 "YYYY-MM-DD"，默认今天

    Returns:
        {
            "date": "2026-02-27",
            "posts": {"community": N, "x": N, "xhs": N, "moltbook": N, "total": N},
            "replies": {"community": N, "x": N, "xhs": N, "moltbook": N, "total": N},
            "limits": {"community": "5/5", "x": "2/2", ...},
        }
    """
    target_date = date or _today_str()

    # 统计发帖
    posted_log = _load_json(POSTED_LOG)
    post_counts = {p: 0 for p in PLATFORMS}

    if isinstance(posted_log, list):
        for entry in posted_log:
            ts = entry.get("timestamp", "") or entry.get("time", "")
            platform = entry.get("platform", "")
            if ts.startswith(target_date) and platform in post_counts:
                if entry.get("status") == "success":
                    post_counts[platform] += 1

    # 统计回复
    replied_log = _load_json(REPLIED_LOG)
    reply_counts = {p: 0 for p in PLATFORMS}

    if isinstance(replied_log, dict):
        for key, entry in replied_log.items():
            ts = entry.get("time", "") or entry.get("timestamp", "")
            platform = entry.get("platform", "community")  # 老格式默认community
            if ts.startswith(target_date) and platform in reply_counts:
                reply_counts[platform] += 1

    # 计算限额
    post_limits = {}
    reply_limits = {}
    for p in PLATFORMS:
        pl = DAILY_LIMITS["posts"].get(p, 0)
        rl = DAILY_LIMITS["replies"].get(p, 0)
        post_limits[p] = f"{post_counts[p]}/{pl}"
        reply_limits[p] = f"{reply_counts[p]}/{rl}"

    return {
        "date": target_date,
        "posts": {**post_counts, "total": sum(post_counts.values())},
        "replies": {**reply_counts, "total": sum(reply_counts.values())},
        "post_limits": post_limits,
        "reply_limits": reply_limits,
    }


def format_status_report(stats: Optional[dict] = None) -> str:
    """格式化为终端友好的运营状态报告"""
    if stats is None:
        stats = get_daily_stats()

    lines = [
        f"╔══════════════════════════════════════╗",
        f"║   📊 RWC运营日报 — {stats['date']}    ║",
        f"╠══════════════════════════════════════╣",
        f"║                                      ║",
        f"║  📝 发帖统计                          ║",
    ]

    for p in PLATFORMS:
        name = {"community": "社区", "x": "X/推特", "xhs": "小红书", "moltbook": "Moltbook"}[p]
        count = stats["posts"][p]
        limit = stats["post_limits"][p]
        bar = "█" * count + "░" * max(0, DAILY_LIMITS["posts"].get(p, 5) - count)
        lines.append(f"║  {name:<8} {bar}  {limit:<6}          ║")

    lines.append(f"║  {'合计':<8} {stats['posts']['total']} 篇                    ║")
    lines.append(f"║                                      ║")
    lines.append(f"║  💬 回复统计                          ║")

    for p in PLATFORMS:
        name = {"community": "社区", "x": "X/推特", "xhs": "小红书", "moltbook": "Moltbook"}[p]
        count = stats["replies"][p]
        limit = stats["reply_limits"][p]
        bar = "█" * min(count, 10) + ("+" if count > 10 else "░" * max(0, 5 - count))
        lines.append(f"║  {name:<8} {bar}  {limit:<6}          ║")

    lines.append(f"║  {'合计':<8} {stats['replies']['total']} 条                    ║")
    lines.append(f"║                                      ║")
    lines.append(f"╚══════════════════════════════════════╝")

    return "\n".join(lines)


if __name__ == "__main__":
    stats = get_daily_stats()
    print(format_status_report(stats))
    print(f"\n📋 原始数据: {json.dumps(stats, ensure_ascii=False, indent=2)}")
