#!/usr/bin/env python3
"""cookie_refresh.py — 小红书cookie自动刷新
需要人工验证时会打开浏览器，完成后自动获取cookie。
"""

import argparse
import sys
import re
from pathlib import Path

ENV_FILE = Path.home() / "Desktop/Realworldclaw/scripts/.env"
ENV_FILE_UNIFIED = Path.home() / ".rwc-ops.env"


def get_current_a1():
    for env_path in [ENV_FILE_UNIFIED, ENV_FILE]:
        if not env_path.exists():
            continue
        for line in env_path.read_text().splitlines():
            if line.strip().startswith("XHS_COOKIE="):
                cookie = line.split("=", 1)[1]
                for part in cookie.split(";"):
                    k, _, v = part.strip().partition("=")
                    if k == "a1":
                        return v, env_path
    return None, None


def check_cookie_valid():
    """用xhs SDK检查cookie是否有效"""
    try:
        a1, env_path = get_current_a1()
        if not a1:
            print("❌ 找不到a1 cookie")
            return False

        # 读取完整cookie
        for line in env_path.read_text().splitlines():
            if line.strip().startswith("XHS_COOKIE="):
                cookie = line.split("=", 1)[1]
                break

        from xhs import XhsClient
        client = XhsClient(cookie)
        me = client.get_self_info()
        print(f"✅ Cookie有效 — 用户: {me.get('nickname', '未知')}")
        return True
    except Exception as e:
        print(f"❌ Cookie无效或已过期: {e}")
        return False


def refresh_cookie():
    """用Playwright刷新cookie"""
    a1, env_path = get_current_a1()
    if not a1:
        print("❌ 找不到现有a1 cookie，无法刷新")
        sys.exit(1)

    print(f"🔄 当前a1: {a1[:8]}...")
    print("🌐 启动浏览器（如需滑块验证请手动操作）...")

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("❌ 需要安装playwright: pip install playwright && playwright install chromium")
        sys.exit(1)

    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=False)  # 需要人工可能操作
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        )

        stealth_js = Path(__file__).parent / "stealth.min.js"
        if stealth_js.exists():
            ctx.add_init_script(path=str(stealth_js))

        page = ctx.new_page()

        # 注入已有a1
        ctx.add_cookies([
            {"name": "a1", "value": a1, "domain": ".xiaohongshu.com", "path": "/"}
        ])

        page.goto("https://www.xiaohongshu.com")
        print("⏳ 等待页面加载... 如有验证码请手动完成")
        page.wait_for_load_state("networkidle", timeout=60000)

        # 额外等待让用户处理验证
        import time
        time.sleep(5)

        # 获取所有cookies
        cookies = ctx.cookies("https://www.xiaohongshu.com")
        browser.close()

    if not cookies:
        print("❌ 未获取到cookie")
        sys.exit(1)

    # 拼接cookie字符串
    cookie_str = "; ".join(f"{c['name']}={c['value']}" for c in cookies)
    print(f"✅ 获取到 {len(cookies)} 个cookie")

    # 更新.env文件
    for target in [env_path, ENV_FILE_UNIFIED]:
        if not target or not target.exists():
            continue
        content = target.read_text()
        new_content = re.sub(
            r"XHS_COOKIE=.*",
            f"XHS_COOKIE={cookie_str}",
            content
        )
        if new_content != content:
            target.write_text(new_content)
            print(f"✅ 已更新: {target}")

    # 验证
    print("\n🔍 验证新cookie...")
    check_cookie_valid()


def main():
    parser = argparse.ArgumentParser(description="小红书cookie刷新")
    parser.add_argument("--check-only", action="store_true", help="仅检查cookie有效性")
    args = parser.parse_args()

    if args.check_only:
        valid = check_cookie_valid()
        sys.exit(0 if valid else 1)
    else:
        refresh_cookie()


if __name__ == "__main__":
    main()
