#!/usr/bin/env python3
"""小红书发帖脚本 v2 — 基于 xhs SDK + Playwright 签名
用法: python3 post_xhs_v2.py [--count N] [--dry-run]
"""
import argparse, json, os, sys, pathlib, textwrap
from time import sleep
from datetime import datetime, timezone, timedelta

# ── 路径 ──
SCRIPT_DIR = pathlib.Path(__file__).parent
STEALTH_JS = SCRIPT_DIR / "stealth.min.js"
ENV_FILE = pathlib.Path.home() / "Desktop/Realworldclaw/scripts/.env"
POSTS_FILE = pathlib.Path.home() / "openclaw/yangcun/realworldclaw/content/xhs-posts.json"
POSTED_LOG = pathlib.Path.home() / "openclaw/yangcun/realworldclaw/content/posted-log.json"
IMG_DIR = SCRIPT_DIR / "images"

CST = timezone(timedelta(hours=8))

def load_cookie():
    if not ENV_FILE.exists():
        sys.exit(f"❌ .env 不存在: {ENV_FILE}")
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line.startswith("XHS_COOKIE="):
            return line.split("=", 1)[1]
    sys.exit("❌ .env 中找不到 XHS_COOKIE")

def extract_a1(cookie_str):
    for part in cookie_str.split(";"):
        k, _, v = part.strip().partition("=")
        if k == "a1":
            return v
    sys.exit("❌ cookie 中找不到 a1 值")

def make_sign_func(a1_val):
    def sign(uri, data=None, a1="", web_session=""):
        from playwright.sync_api import sync_playwright
        for attempt in range(10):
            try:
                with sync_playwright() as pw:
                    browser = pw.chromium.launch(headless=True)
                    ctx = browser.new_context()
                    ctx.add_init_script(path=str(STEALTH_JS))
                    page = ctx.new_page()
                    page.goto("https://www.xiaohongshu.com")
                    ctx.add_cookies([
                        {"name": "a1", "value": a1_val, "domain": ".xiaohongshu.com", "path": "/"}
                    ])
                    page.reload()
                    sleep(2)
                    ep = page.evaluate(
                        "([url, data]) => window._webmsxyw(url, data)", [uri, data]
                    )
                    browser.close()
                    return {"x-s": ep["X-s"], "x-t": str(ep["X-t"])}
            except Exception as e:
                print(f"  ⚠️ 签名重试 ({attempt+1}/10): {e}")
        raise Exception("签名失败，重试10次均失败")
    return sign

def generate_cover(title, output_path):
    from PIL import Image, ImageDraw, ImageFont
    W, H = 1080, 1440
    img = Image.new("RGB", (W, H), "#FF6B6B")
    draw = ImageDraw.Draw(img)
    font_size = 64
    try:
        font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", font_size)
    except Exception:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/STHeiti Light.ttc", font_size)
        except Exception:
            font = ImageFont.load_default()
    lines = textwrap.wrap(title, width=12)
    total_h = len(lines) * (font_size + 20)
    y = (H - total_h) // 2
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) // 2, y), line, fill="white", font=font)
        y += font_size + 20
    small_font_size = 32
    try:
        small_font = ImageFont.truetype("/System/Library/Fonts/PingFang.ttc", small_font_size)
    except Exception:
        small_font = font
    brand = "RealWorldClaw"
    bbox = draw.textbbox((0, 0), brand, font=small_font)
    draw.text(((W - (bbox[2] - bbox[0])) // 2, H - 120), brand, fill="#FFFFFFAA", font=small_font)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(output_path), quality=95)
    return str(output_path)

def load_json(path):
    if not path.exists():
        return []
    with open(path) as f:
        return json.load(f)

def save_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_posted_ids(log, platform="xhs"):
    return {e["content_id"] for e in log if e.get("platform") == platform and e.get("status") == "success"}

def format_desc_with_tags(body, tags):
    hashtags = " ".join(f"#{t}" for t in (tags or []))
    return f"{body}\n\n{hashtags}" if hashtags else body

def main():
    parser = argparse.ArgumentParser(description="小红书发帖 v2")
    parser.add_argument("--count", type=int, default=2)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    cookie = load_cookie()
    a1 = extract_a1(cookie)
    posts = load_json(POSTS_FILE)
    posted_log = load_json(POSTED_LOG)
    posted_ids = get_posted_ids(posted_log)

    pending = [p for p in posts if p["id"] not in posted_ids]
    if not pending:
        print("✅ 所有帖子已发完，无待发内容")
        return
    batch = pending[:args.count]
    print(f"📋 待发 {len(pending)} 条，本次发 {len(batch)} 条 {'(dry-run)' if args.dry_run else ''}")

    client = None
    if not args.dry_run:
        sign_func = make_sign_func(a1)
        from xhs import XhsClient
        client = XhsClient(cookie, sign=sign_func)
        try:
            me = client.get_self_info()
            print(f"✅ 已登录: {me.get('nickname', '未知')}")
        except Exception as e:
            err_str = str(e).lower()
            if "登录" in err_str or "cookie" in err_str or "401" in err_str or "need_login" in err_str:
                sys.exit(f"❌ Cookie 已过期，请更新 .env 中的 XHS_COOKIE\n  详情: {e}")
            print(f"⚠️ 登录检查异常（继续尝试）: {e}")

    for i, post in enumerate(batch):
        pid = post["id"]
        title = post["title"]
        body = post["body"]
        tags = post.get("tags", [])
        desc = format_desc_with_tags(body, tags)

        img_path = IMG_DIR / f"xhs_cover_{pid}.png"
        generate_cover(title, img_path)

        print(f"\n[{i+1}/{len(batch)}] #{pid} {title}")
        print(f"  📸 封面: {img_path}")

        if args.dry_run:
            print(f"  🏃 DRY-RUN: 跳过实际发帖")
            posted_log.append({
                "platform": "xhs", "content_id": pid,
                "timestamp": datetime.now(CST).isoformat(), "status": "dry-run",
            })
        else:
            try:
                result = client.create_image_note(
                    title=title, desc=desc, files=[str(img_path)], is_private=False,
                )
                print(f"  ✅ 发布成功: {result}")
                posted_log.append({
                    "platform": "xhs", "content_id": pid,
                    "timestamp": datetime.now(CST).isoformat(),
                    "status": "success", "response": result,
                })
            except Exception as e:
                print(f"  ❌ 发布失败: {e}")
                posted_log.append({
                    "platform": "xhs", "content_id": pid,
                    "timestamp": datetime.now(CST).isoformat(),
                    "status": "failed", "error": str(e),
                })

        save_json(POSTED_LOG, posted_log)
        if i < len(batch) - 1 and not args.dry_run:
            print(f"  ⏳ 等待15秒...")
            sleep(15)

    print(f"\n🎉 完成！已处理 {len(batch)} 条")

if __name__ == "__main__":
    main()
