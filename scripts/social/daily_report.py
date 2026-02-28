#!/usr/bin/env python3
"""每日运营汇报脚本 — 生成报告供飞书发送
Cron: 0 21 * * * python3 ~/Desktop/Realworldclaw/scripts/social/daily_report.py
"""
import json, os
from datetime import datetime, timezone, timedelta

CST = timezone(timedelta(hours=8))
TODAY = datetime.now(CST).strftime("%Y-%m-%d")
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
POSTED_LOG = os.path.expanduser("~/openclaw/yangcun/realworldclaw/content/posted-log.json")
REPLIED_LOG = os.path.join(SCRIPT_DIR, "replied-log.json")

def load_json(path):
    if os.path.exists(path):
        with open(path) as f:
            data = json.load(f)
            return data if isinstance(data, list) else list(data.values()) if isinstance(data, dict) else []
    return []

def count_today(records):
    counts = {}
    for r in records:
        if TODAY in r.get("timestamp", ""):
            p = r.get("platform", "unknown")
            counts[p] = counts.get(p, 0) + 1
    return counts

def generate_report():
    posts = load_json(POSTED_LOG)
    post_counts = count_today(posts)
    
    reply_total = 0
    if os.path.exists(REPLIED_LOG):
        with open(REPLIED_LOG) as f:
            raw = json.load(f)
        if isinstance(raw, dict):
            reply_total = len([v for v in raw.values() if TODAY in v.get("time", "")])
        elif isinstance(raw, list):
            reply_total = len([r for r in raw if TODAY in r.get("timestamp", "")])
    
    total_posts = sum(post_counts.values())
    limits = {"community": 5, "x": 2, "xhs": 2, "moltbook": 5}
    
    lines = [f"📊 RWC每日运营报告 — {TODAY}", "",  "══ 发帖情况 ══"]
    for p in ["community", "x", "xhs", "moltbook"]:
        done = post_counts.get(p, 0)
        limit = limits[p]
        bar = "█" * min(done, limit) + "░" * max(0, limit - done)
        lines.append(f"  {p.upper():10s} {bar} {done}/{limit}")
    lines.append(f"  {'总计':10s}      {total_posts}条")
    lines.append("")
    lines.append("══ 社区互动 ══")
    lines.append(f"  自动回复: {reply_total}条")
    lines.append("")
    lines.append("══ 喜羊羊分析 ══")
    if total_posts >= 10:
        lines.append("  ✅ 今日发帖达标")
    elif total_posts >= 5:
        lines.append("  ⚠️ 发帖量中等")
    else:
        lines.append("  🔴 发帖量偏低")
    for p in ["community", "x", "xhs", "moltbook"]:
        if post_counts.get(p, 0) == 0:
            lines.append(f"  ⚠️ {p.upper()} 今日0发帖")
    if reply_total < 3:
        lines.append("  💬 建议增加社区互动")
    lines.append("")
    lines.append("══ 明日计划 ══")
    lines.append("  • 社区5 / X 2 / 小红书2 / Moltbook 5")
    lines.append("  • 回复新增用户评论")
    lines.append("")
    lines.append("（RWC喜羊羊自动运营报告）")
    return "\n".join(lines)

if __name__ == "__main__":
    report = generate_report()
    print(report)
    with open(os.path.join(SCRIPT_DIR, f"report-{TODAY}.txt"), "w") as f:
        f.write(report)
