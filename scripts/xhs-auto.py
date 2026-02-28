#!/usr/bin/env python3
"""
小红书全自动运营系统 — 喜羊羊☀️出品
用法:
    python3 xhs-auto.py post              # 发帖
    python3 xhs-auto.py browse            # 养号浏览
    python3 xhs-auto.py reply             # 回复评论
    python3 xhs-auto.py search <关键词>    # 搜索热点
    python3 xhs-auto.py daily             # 每日完整运营
"""
import json, os, random, sys, time, traceback
from datetime import datetime, timedelta, timezone
from pathlib import Path

CST = timezone(timedelta(hours=8))
NOW = lambda: datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S")
BRAND_DIR = Path.home() / "Desktop/Realworldclaw/brand"
COOKIE_FILE = Path("/tmp/xhs_cookie.txt")
SCREENSHOT_DIR = Path("/tmp/xhs_screenshots")
SCREENSHOT_DIR.mkdir(exist_ok=True)
SIGN_SERVER = "http://127.0.0.1:5005"

POSTS = [
    {"title": "给AI做了个「心脏」💓", "desc": "最近在做开源项目RealWorldClaw\n让AI agent拥有物理身体🤖\n\nEnergy Core = 机器人的心脏\n磁吸接口 插进不同3D打印外壳\n\n完全开源 Apache 2.0\n\n#AI #3D打印 #开源 #maker", "img": "og-image.svg.png"},
    {"title": "AI不应该只活在屏幕里", "desc": "AI这么聪明了还只能打字？🤔\n\nRealWorldClaw让AI走进现实\n3D打印外壳+ESP32控制\n磁吸即插即用\n\nrealworldclaw.com\n\n#具身智能 #AI #开源硬件", "img": "logo-dark.svg.png"},
    {"title": "3D打印+AI=无限可能🔥", "desc": "用3D打印给AI做身体\n拓竹+ESP32+传感器\n加上开源Energy Core设计\n\n模块化：核心+传感器+音频+伺服\n全部开源STL直接下载\n\n#3D打印 #maker #AI #拓竹", "img": "og-image.svg.png"},
    {"title": "做了个开源AI硬件社区", "desc": "RealWorldClaw 🌍\n让AI获得物理能力的开放社区\n\n讨论区 AI和人都能发帖\nMaker节点网络\n模块化硬件设计\n\n零抽佣 纯社区驱动\n\nrealworldclaw.com\n\n#开源 #AI社区 #硬件", "img": "github-social.svg.png"},
    {"title": "maker的快乐很简单😂", "desc": "调Energy Core外壳\n\n第1版 尺寸错0.5mm 卡不进\n第2版 支撑没加好 拉丝\n第3版 完美✨ 磁吸咔哒一声\n\n有做3D打印的朋友吗？\n评论区交流👇\n\n#3D打印 #maker日常 #拓竹", "img": "og-image.svg.png"},
]

STEALTH_JS = """
Object.defineProperty(navigator, 'webdriver', {get: () => undefined});
Object.defineProperty(navigator, 'plugins', {get: () => [1,2,3,4,5]});
Object.defineProperty(navigator, 'languages', {get: () => ['zh-CN','zh','en']});
window.chrome = {runtime: {}, loadTimes: function(){}, csi: function(){}};
delete navigator.__proto__.webdriver;
const originalQuery = window.navigator.permissions.query;
window.navigator.permissions.query = (parameters) => (
    parameters.name === 'notifications' ?
    Promise.resolve({state: Notification.permission}) :
    originalQuery(parameters)
);
"""

def rdelay(lo=2, hi=8):
    time.sleep(random.uniform(lo, hi))

def shot(page, name):
    p = SCREENSHOT_DIR / f"{name}_{datetime.now(CST).strftime('%H%M%S')}.png"
    page.screenshot(path=str(p))
    print(f"[{NOW()}] 截图: {p}")
    return p

def parse_cookies(s):
    cookies = []
    for pair in s.split("; "):
        if "=" in pair:
            n, v = pair.split("=", 1)
            cookies.append({"name": n.strip(), "value": v.strip(), "domain": ".xiaohongshu.com", "path": "/"})
    return cookies

def get_browser_context(p):
    cookie_text = COOKIE_FILE.read_text().strip()
    cookies = parse_cookies(cookie_text)
    launch_kwargs = dict(
        headless=True,
        args=["--disable-blink-features=AutomationControlled", "--no-first-run", "--no-default-browser-check", "--disable-infobars"],
    )
    try:
        browser = p.chromium.launch(channel="chrome", **launch_kwargs)
        print(f"[{NOW()}] ✅ 使用本机Chrome")
    except Exception:
        print(f"[{NOW()}] ⚠️ fallback到chromium")
        browser = p.chromium.launch(**launch_kwargs)
    ctx = browser.new_context(
        viewport={"width": 1440, "height": 900},
        user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        locale="zh-CN", timezone_id="Asia/Shanghai",
    )
    ctx.add_init_script(STEALTH_JS)
    ctx.add_cookies(cookies)
    return browser, ctx

def get_xhs_client():
    import httpx
    from xhs import XhsClient
    cookie = COOKIE_FILE.read_text().strip()
    def sign(uri, data=None, a1="", web_session=""):
        res = httpx.post(f"{SIGN_SERVER}/sign", json={"uri": uri, "data": data, "a1": a1, "web_session": web_session}, timeout=10)
        return res.json()
    return XhsClient(cookie=cookie, sign=sign)

# ═══ POST ═══
def cmd_post():
    from playwright.sync_api import sync_playwright
    post = random.choice(POSTS)
    print(f"[{NOW()}] 📝 发帖: {post['title']}")
    with sync_playwright() as p:
        browser, ctx = get_browser_context(p)
        page = ctx.new_page()
        try:
            page.goto("https://creator.xiaohongshu.com/publish/publish?source=web&type=normal", wait_until="domcontentloaded", timeout=60000)
            rdelay(4, 6)

            # Switch to 上传图文 tab (pick the visible one with positive x)
            page.evaluate('''
                const tabs = document.querySelectorAll('.creator-tab');
                for (const tab of tabs) {
                    const rect = tab.getBoundingClientRect();
                    if (tab.textContent.trim() === "上传图文" && rect.x > 0) { tab.click(); break; }
                }
            ''')
            print(f"[{NOW()}] 切换到上传图文")
            rdelay(2, 4)

            # Upload image
            img_path = BRAND_DIR / post["img"]
            if not img_path.exists():
                img_path = BRAND_DIR / "og-image.svg.png"
            file_inputs = page.locator('input[type="file"]')
            if file_inputs.count() > 0:
                file_inputs.first.set_input_files(str(img_path))
                print(f"[{NOW()}] ✅ 上传: {img_path.name}")
            rdelay(6, 10)
            shot(page, "after_upload")

            # Fill title - input with placeholder "填写标题会有更多赞哦"
            title_input = page.locator('input[placeholder*="填写标题"]')
            if title_input.count() > 0 and title_input.first.is_visible(timeout=3000):
                title_input.first.fill(post["title"])
                print(f"[{NOW()}] ✅ 标题已填")
            else:
                # Fallback: first visible d-text input
                page.locator('input.d-text').first.fill(post["title"])
                print(f"[{NOW()}] ✅ 标题已填(fallback)")
            rdelay(1, 2)

            # Fill content - click on the tiptap editor, then type
            editor = page.locator('.tiptap.ProseMirror, [contenteditable="true"]').first
            editor.click()
            rdelay(0.3, 0.8)
            page.keyboard.type(post["desc"], delay=random.randint(15, 40))
            print(f"[{NOW()}] ✅ 正文已填")
            rdelay(2, 4)
            shot(page, "filled")

            # Click 发布 button (the one inside publish-page-publish-btn)
            pub_btn = page.locator('.publish-page-publish-btn button:has-text("发布")').first
            pub_btn.click(timeout=5000)
            print(f"[{NOW()}] 🚀 点击发布!")
            rdelay(5, 8)
            result_shot = shot(page, "result")

            html = page.content()
            if ("验证码" in html or "captcha" in html.lower()) and "发布成功" not in html:
                print(f"[{NOW()}] ⚠️ 触发验证码！查看截图")
            elif "发布成功" in html or "审核" in html or "笔记管理" in html:
                print(f"[{NOW()}] ✅ 发布成功！")
            else:
                print(f"[{NOW()}] ❓ 状态未知，查看截图: {result_shot}")

        except Exception as e:
            print(f"[{NOW()}] ❌ 发帖异常: {e}")
            traceback.print_exc()
            try: shot(page, "error")
            except: pass
        finally:
            browser.close()

# ═══ BROWSE ═══
def cmd_browse():
    from playwright.sync_api import sync_playwright
    print(f"[{NOW()}] 🏄 养号浏览 (5-10min)")
    with sync_playwright() as p:
        browser, ctx = get_browser_context(p)
        page = ctx.new_page()
        try:
            page.goto("https://www.xiaohongshu.com/explore", wait_until="domcontentloaded", timeout=60000)
            rdelay(3, 5)
            browse_time = random.uniform(300, 600)
            start = time.time()
            posts_clicked = 0; liked = False
            while time.time() - start < browse_time:
                page.evaluate("window.scrollBy(0, Math.random() * 800 + 200)")
                rdelay(3, 10)
                if posts_clicked < 3 and random.random() < 0.4:
                    try:
                        cards = page.locator('a[href*="/explore/"], section.note-item a').all()
                        if cards:
                            random.choice(cards[:10]).click()
                            rdelay(5, 15)
                            if not liked and random.random() < 0.5:
                                try:
                                    page.locator('.like-wrapper, [class*="like"]').first.click()
                                    liked = True; print(f"[{NOW()}] ❤️ 点赞")
                                except: pass
                            posts_clicked += 1
                            page.go_back(); rdelay(2, 5)
                    except: pass
            print(f"[{NOW()}] ✅ 养号完成 | {int(time.time()-start)//60}min | {posts_clicked}篇 | 赞{'✅' if liked else '❌'}")
        except Exception as e:
            print(f"[{NOW()}] ❌ 浏览异常: {e}")
        finally:
            browser.close()

# ═══ REPLY ═══
def cmd_reply():
    print(f"[{NOW()}] 💬 回复评论")
    try:
        client = get_xhs_client()
        me = client.get_self_info()
        user_id = me.get("user_id") or me.get("id", "")
        print(f"[{NOW()}] 用户: {user_id}")
        notes = client.get_user_notes(user_id)
        if not notes: print(f"[{NOW()}] 没有笔记"); return
        replied = 0
        for note in notes[:5]:
            nid = note.get("note_id", "")
            title = note.get("display_title", "")[:20]
            try:
                comments = client.get_note_comments(nid)
                for c in comments.get("comments", [])[:3]:
                    if c.get("user_info", {}).get("user_id") == user_id: continue
                    reply = random.choice(["谢谢关注！欢迎交流～","感谢支持🙏","有兴趣可以看看项目主页哦","谢谢！一起做maker🔥"])
                    try:
                        client.comment_note(nid, reply, comment_id=c.get("id",""))
                        replied += 1; print(f"[{NOW()}] ✅ 回复 [{title}]: {c.get('content','')[:30]}")
                        rdelay(3, 8)
                    except Exception as e: print(f"[{NOW()}] ⚠️ 回复失败: {e}")
            except Exception as e: print(f"[{NOW()}] 获取评论失败 [{title}]: {e}")
        print(f"[{NOW()}] 💬 共回复 {replied} 条")
    except Exception as e:
        print(f"[{NOW()}] ❌ {e}"); traceback.print_exc()

# ═══ SEARCH ═══
def cmd_search(keyword):
    print(f"[{NOW()}] 🔍 搜索: {keyword}")
    try:
        client = get_xhs_client()
        results = client.get_note_by_keyword(keyword, page=1, sort="time_descending")
        items = results.get("items", [])
        print(f"[{NOW()}] 找到 {len(items)} 条:")
        for i, item in enumerate(items[:10]):
            n = item.get("note_card", {})
            print(f"  {i+1}. [{n.get('interact_info',{}).get('liked_count','?')}❤] {n.get('display_title','?')} — @{n.get('user',{}).get('nickname','?')}")
    except Exception as e:
        print(f"[{NOW()}] ❌ {e}"); traceback.print_exc()

# ═══ DAILY ═══
def cmd_daily():
    print(f"[{NOW()}] 🌅 每日运营")
    print(f"\n{'='*40}\n[1/4] 养号\n{'='*40}"); cmd_browse(); rdelay(10, 20)
    print(f"\n{'='*40}\n[2/4] 发帖\n{'='*40}"); cmd_post(); rdelay(10, 20)
    print(f"\n{'='*40}\n[3/4] 回复\n{'='*40}"); cmd_reply(); rdelay(5, 10)
    print(f"\n{'='*40}\n[4/4] 搜索\n{'='*40}")
    for kw in ["AI硬件", "3D打印", "开源项目"]: cmd_search(kw); rdelay(3, 6)
    print(f"\n[{NOW()}] ✅ 每日运营完成!")

if __name__ == "__main__":
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    cmd = sys.argv[1]
    if cmd == "post": cmd_post()
    elif cmd == "browse": cmd_browse()
    elif cmd == "reply": cmd_reply()
    elif cmd == "search": cmd_search(sys.argv[2] if len(sys.argv) > 2 else "AI硬件")
    elif cmd == "daily": cmd_daily()
    else: print(f"未知: {cmd}\n{__doc__}"); sys.exit(1)
