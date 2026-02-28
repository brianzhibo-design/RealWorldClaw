#!/usr/bin/env python3
"""rwc-ops.py — RWC全自动运营统一CLI入口
小灰灰🐺开发 / 喜羊羊☀️运营专用

用法:
  python3 rwc-ops.py post --platform [all|community|x|xhs|moltbook] [--count N] [--dry-run]
  python3 rwc-ops.py reply --platform [all|community|x|xhs|moltbook] [--count N] [--dry-run]
  python3 rwc-ops.py status
  python3 rwc-ops.py cookie refresh --platform xhs
  python3 rwc-ops.py cookie check
  python3 rwc-ops.py monitor
"""

import argparse
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent.resolve()
CST = timezone(timedelta(hours=8))

# ── 每日限额（硬编码，安全规则） ──
DAILY_LIMITS = {
    "community": {"post": 5, "reply": 10},
    "x": {"post": 2, "reply": 5},
    "xhs": {"post": 2, "reply": 5},
    "moltbook": {"post": 5, "reply": 5},
}

ALL_PLATFORMS = list(DAILY_LIMITS.keys())

# ── 日志文件 ──
POSTED_LOG = Path.home() / "openclaw/yangcun/realworldclaw/content/posted-log.json"
REPLIED_LOG = SCRIPT_DIR / "replied-log.json"
ENV_FILE = Path.home() / ".rwc-ops.env"
FALLBACK_ENV = Path.home() / "Desktop/Realworldclaw/scripts/.env"


def load_env():
    env_path = ENV_FILE if ENV_FILE.exists() else FALLBACK_ENV
    if not env_path.exists():
        return {}
    env = {}
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            env[k.strip()] = v.strip()
    return env


def load_json(path, default=None):
    try:
        with open(path) as f:
            return json.load(f)
    except Exception:
        return default if default is not None else []


def today_str():
    return datetime.now(CST).strftime("%Y-%m-%d")


def count_today_posted(log_data, platform):
    today = today_str()
    count = 0
    if isinstance(log_data, list):
        for e in log_data:
            if e.get("platform") == platform and e.get("timestamp", "").startswith(today):
                if e.get("status") in ("success", "dry-run"):
                    count += 1
    return count


def count_today_replied(log_data, platform=None):
    today = today_str()
    count = 0
    if isinstance(log_data, dict):
        for key, e in log_data.items():
            if e.get("time", "").startswith(today):
                count += 1
    return count


def check_limit(platform, action, count_fn, log_data):
    limit = DAILY_LIMITS.get(platform, {}).get(action, 0)
    used = count_fn(log_data, platform) if action == "post" else count_today_replied(log_data)
    return max(0, limit - used)


def run_script(cmd, dry_run=False):
    if dry_run and "--dry-run" not in cmd:
        cmd.append("--dry-run")
    print(f"  🔧 执行: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, cwd=str(SCRIPT_DIR), text=True, timeout=180)
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        print("  ⏰ 超时")
        return False
    except Exception as e:
        print(f"  ❌ 失败: {e}")
        return False


# ═══ POST ═══

def cmd_post(args):
    platforms = ALL_PLATFORMS if args.platform == "all" else [args.platform]
    posted_log = load_json(POSTED_LOG, [])

    for plat in platforms:
        remaining = check_limit(plat, "post", count_today_posted, posted_log)
        count = min(args.count or DAILY_LIMITS[plat]["post"], remaining)

        if count <= 0:
            print(f"⚠️ [{plat}] 今日限额已满，跳过")
            continue

        print(f"\n▶ [{plat}] 发帖 {count} 条 {'(dry-run)' if args.dry_run else ''}")

        if plat == "community":
            run_script(["bash", str(SCRIPT_DIR / "community-post.sh"), f"--count={count}"], args.dry_run)
        elif plat == "x":
            run_script(["python3", str(SCRIPT_DIR / "post_x.py")], args.dry_run)
        elif plat == "xhs":
            run_script(["python3", str(SCRIPT_DIR / "post_xhs_v2.py"), "--count", str(count)], args.dry_run)
        elif plat == "moltbook":
            run_script(["python3", str(SCRIPT_DIR / "post_moltbook.py")], args.dry_run)

    print("\n✅ 发帖完成")


# ═══ REPLY ═══

def cmd_reply(args):
    platforms = ALL_PLATFORMS if args.platform == "all" else [args.platform]
    replied_log = load_json(REPLIED_LOG, {})

    for plat in platforms:
        remaining = check_limit(plat, "reply", count_today_posted, replied_log)
        count = min(args.count or DAILY_LIMITS[plat]["reply"], remaining)

        if count <= 0:
            print(f"⚠️ [{plat}] 今日回复限额已满，跳过")
            continue

        print(f"\n▶ [{plat}] 回复 {count} 条 {'(dry-run)' if args.dry_run else ''}")

        if plat == "community":
            run_script(["python3", str(SCRIPT_DIR / "auto_reply.py"), "--count", str(count), "--mode", "both"], args.dry_run)
        elif plat == "x":
            run_script(["python3", str(SCRIPT_DIR / "reply_x.py"), "--count", str(count)], args.dry_run)
        elif plat == "xhs":
            run_script(["python3", str(SCRIPT_DIR / "reply_xhs.py"), "--count", str(count)], args.dry_run)
        elif plat == "moltbook":
            run_script(["python3", str(SCRIPT_DIR / "reply_moltbook.py"), "--count", str(count)], args.dry_run)

    print("\n✅ 回复完成")


# ═══ STATUS ═══

def cmd_status(args):
    posted_log = load_json(POSTED_LOG, [])
    replied_log = load_json(REPLIED_LOG, {})
    today = today_str()

    print(f"📊 RWC运营状态 — {today}")
    print("=" * 50)

    for plat in ALL_PLATFORMS:
        posts_today = count_today_posted(posted_log, plat)
        posts_total = sum(1 for e in posted_log if e.get("platform") == plat) if isinstance(posted_log, list) else 0

        replies_today = 0
        replies_total = 0
        if isinstance(replied_log, dict):
            for key, e in replied_log.items():
                replies_total += 1
                if e.get("time", "").startswith(today):
                    replies_today += 1

        pl = DAILY_LIMITS[plat]
        print(f"\n📌 {plat.upper()}")
        print(f"   发帖: {posts_today}/{pl['post']} (今日/限额)  总计: {posts_total}")
        print(f"   回复: {replies_today}/{pl['reply']} (今日/限额)  总计: {replies_total}")

    print(f"\n{'=' * 50}")
    print("🕐", datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S"))


# ═══ COOKIE ═══

def cmd_cookie(args):
    if args.cookie_action == "refresh":
        if args.platform != "xhs":
            print("⚠️ 仅支持小红书cookie刷新")
            return
        run_script(["python3", str(SCRIPT_DIR / "cookie_refresh.py")])
    elif args.cookie_action == "check":
        run_script(["python3", str(SCRIPT_DIR / "cookie_refresh.py"), "--check-only"])


# ═══ MONITOR ═══

def cmd_monitor(args):
    print("🔍 启动运营监控...")
    run_script(["python3", str(SCRIPT_DIR / "ops_monitor.py")])


# ═══ MAIN ═══

def main():
    parser = argparse.ArgumentParser(
        description="RWC全自动运营工具集 — 喜羊羊☀️专用",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python3 rwc-ops.py post --platform all --dry-run
  python3 rwc-ops.py reply --platform community --count 5
  python3 rwc-ops.py status
  python3 rwc-ops.py cookie refresh --platform xhs
  python3 rwc-ops.py monitor
        """,
    )
    sub = parser.add_subparsers(dest="command", help="操作命令")

    p_post = sub.add_parser("post", help="多平台发帖")
    p_post.add_argument("--platform", "-p", default="all", choices=["all"] + ALL_PLATFORMS)
    p_post.add_argument("--count", "-c", type=int, default=0)
    p_post.add_argument("--dry-run", action="store_true")

    p_reply = sub.add_parser("reply", help="多平台回复")
    p_reply.add_argument("--platform", "-p", default="all", choices=["all"] + ALL_PLATFORMS)
    p_reply.add_argument("--count", "-c", type=int, default=0)
    p_reply.add_argument("--dry-run", action="store_true")

    sub.add_parser("status", help="今日统计")

    p_cookie = sub.add_parser("cookie", help="Cookie管理")
    p_cookie.add_argument("cookie_action", choices=["refresh", "check"])
    p_cookie.add_argument("--platform", "-p", default="xhs", choices=["xhs"])

    sub.add_parser("monitor", help="实时监控")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return

    print(f"🐑 RWC运营工具集 v1.0 — {datetime.now(CST).strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📋 命令: {args.command}\n")

    {"post": cmd_post, "reply": cmd_reply, "status": cmd_status, "cookie": cmd_cookie, "monitor": cmd_monitor}[args.command](args)


if __name__ == "__main__":
    main()
