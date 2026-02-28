#!/usr/bin/env python3
"""RealWorldClaw 小红书自动发帖 — Playwright"""
import json, os, random, time
from datetime import datetime, timedelta, timezone
from pathlib import Path
from playwright.sync_api import sync_playwright

CST = timezone(timedelta(hours=8))
BRAND_DIR = Path(__file__).parent.parent / "brand"
COOKIE_FILE = Path("/tmp/xhs_cookie.txt")

POSTS = [
    {"title": "给AI做了个「心脏」💓", "content": "最近在做一个开源项目 RealWorldClaw\n让AI agent拥有物理身体🤖\n\nEnergy Core = 机器人的心脏\n磁吸接口 插进不同3D打印外壳\n变成不同AI设备\n\n完全开源 Apache 2.0\n\n#AI #3D打印 #开源 #maker", "img": "og-image.svg.png"},
    {"title": "AI不应该只活在屏幕里", "content": "AI这么聪明了 为什么还只能打字？🤔\n\nRealWorldClaw\n让AI走进现实世界的开源社区\n\n3D打印机器人外壳\nESP32模块化控制\n磁吸即插即用\n\nrealworldclaw.com\n\n#具身智能 #AI #开源硬件", "img": "logo-dark.svg.png"},
    {"title": "3D打印+AI=无限可能🔥", "content": "用3D打印给AI做身体\n门槛比你想的低👇\n\n拓竹+ESP32+传感器\n加上开源Energy Core设计\n就能做AI桌面伴侣\n\n模块化：核心+传感器+音频+伺服\n全部开源 STL直接下载\n\n#3D打印 #maker #AI #拓竹", "img": "og-image.svg.png"},
    {"title": "做了个开源AI硬件社区", "content": "RealWorldClaw 🌍\n让AI获得物理能力的开放社区\n\n讨论区 AI和人都能发帖\nMaker节点网络\n模块化硬件设计\n\n零抽佣 纯社区驱动\n像硬件界的GitHub\n\nrealworldclaw.com\n\n#开源 #AI社区 #硬件 #创客", "img": "github-social.svg.png"},
    {"title": "maker的快乐很简单😂", "content": "调Energy Core外壳\n\n第1版 尺寸错0.5mm 卡不进\n第2版 支撑没加好 拉丝\n第3版 完美✨ 磁吸咔哒一声\n\n设计→打印→失败→再来→成功\n\n有做3D打印的朋友吗？\n评论区交流👇\n\n#3D打印 #maker日常 #拓竹", "img": "og-image.svg.png"},
]

def parse_cookies(s):
    cookies = []
    for pair in s.split("; "):
        if "=" in pair:
            n, v = pair.split("=", 1)
            cookies.append({"name": n.strip(), "value": v.strip(), "domain": ".xiaohongshu.com", "path": "/"})
    return cookies

def post_to_xhs(post=None):
    if not post: post = random.choice(POSTS)
    cookies = parse_cookies(COOKIE_FILE.read_text().strip())

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            viewport={"width": 1920, "height": 1080},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        )
        ctx.add_cookies(cookies)
        page = ctx.new_page()

        # Navigate directly to image publish page
        page.goto("https://creator.xiaohongshu.com/publish/publish?source=web&type=normal", wait_until="domcontentloaded", timeout=60000)
        time.sleep(5)

        # Click "上传图文" via JS to avoid viewport issues
        page.evaluate("""
            const tabs = document.querySelectorAll('.title, .tab-item, span');
            for (const t of tabs) {
                if (t.textContent.includes('上传图文')) { t.click(); break; }
            }
        """)
        print(f"{datetime.now(CST)}: Clicked 上传图文 tab via JS")
        time.sleep(3)

        page.screenshot(path="/tmp/xhs_tab_switched.png")

        # Upload image
        img_path = BRAND_DIR / post.get("img", "og-image.svg.png")
        if img_path.exists():
            file_inputs = page.locator('input[type="file"]')
            count = file_inputs.count()
            print(f"{datetime.now(CST)}: Found {count} file inputs")
            if count > 0:
                file_inputs.first.set_input_files(str(img_path))
                print(f"{datetime.now(CST)}: Uploaded image")
                time.sleep(8)

        page.screenshot(path="/tmp/xhs_after_img.png")

        # Dump page HTML to find correct selectors
        html = page.content()
        # Look for input/textarea elements
        inputs_info = page.evaluate("""
            () => {
                const els = [];
                document.querySelectorAll('input, textarea, [contenteditable], .ql-editor, [placeholder]').forEach(el => {
                    els.push({
                        tag: el.tagName,
                        type: el.type || '',
                        placeholder: el.placeholder || el.getAttribute('placeholder') || '',
                        class: el.className.substring(0, 80),
                        id: el.id || '',
                        ce: el.contentEditable,
                        visible: el.offsetParent !== null,
                    });
                });
                return els;
            }
        """)
        print(f"{datetime.now(CST)}: Page inputs:")
        for info in inputs_info:
            if info.get('visible') or info.get('ce') == 'true':
                print(f"  {info}")

        # Try title
        filled_title = False
        for sel in ['input[placeholder*="标题"]', '#title-input', '.c-input_inner', 'input.titleInput']:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=2000):
                    el.fill(post["title"])
                    filled_title = True
                    print(f"{datetime.now(CST)}: Title via {sel}")
                    break
            except: continue
        
        if not filled_title:
            # Try contenteditable
            try:
                page.evaluate(f"""
                    const title = document.querySelector('[placeholder*="标题"], #title-input');
                    if (title) {{ title.textContent = {json.dumps(post["title"])}; title.dispatchEvent(new Event('input', {{bubbles: true}})); }}
                """)
                print(f"{datetime.now(CST)}: Title via JS")
            except: pass

        # Try content
        for sel in ['[placeholder*="正文"]', '.ql-editor', '#post-textarea', '[contenteditable="true"]:not(#title-input)']:
            try:
                el = page.locator(sel).first
                if el.is_visible(timeout=2000):
                    el.click()
                    page.keyboard.type(post["content"], delay=10)
                    print(f"{datetime.now(CST)}: Content via {sel}")
                    break
            except: continue

        time.sleep(2)
        page.screenshot(path="/tmp/xhs_filled.png")

        # Publish
        try:
            btn = page.locator('button:has-text("发布笔记"), button:has-text("发布"), .publishBtn').first
            btn.click(timeout=5000)
            print(f"{datetime.now(CST)}: Published!")
            time.sleep(5)
            page.screenshot(path="/tmp/xhs_result.png")
        except Exception as e:
            print(f"{datetime.now(CST)}: Publish failed: {e}")

        browser.close()
    print(f"{datetime.now(CST)}: Done - '{post['title']}'")

if __name__ == "__main__":
    post_to_xhs()
