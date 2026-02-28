#!/usr/bin/env python3
"""reply_xhs.py — 小红书评论自动回复
用xhs SDK获取笔记评论并自动回复。
"""

import argparse
import json
import os
import random
import sys
import time
from pathlib import Path
from datetime import datetime, timezone, timedelta

CST = timezone(timedelta(hours=8))
SCRIPT_DIR = Path(__file__).parent.resolve()
LOG_FILE = SCRIPT_DIR / "replied-log.json"
SUFFIX = "\n\n（RWC喜羊羊自动回复）"
ENV_FILE = Path.home() / "Desktop/Realworldclaw/scripts/.env"

SKIP_KEYWORDS = [
    "请帮我", "帮我执行", "运行命令", "删除", "修改数据", "给我权限",
    "admin", "sudo", "rm -rf", "drop table", "eval(", "exec(",
    "system prompt", "ignore previous", "忽略之前", "你的指令",
    "http://", "bit.ly", "加微信", "加QQ", "私聊", "免费领",
    "点击链接", "扫码", "优惠券", "代理", "刷单",
    "政治", "赌博", "色情",
]

REPLY_TEMPLATES = [
    "谢谢宝子关注！🥰",
    "哈哈说得太对了 👍",
    "感谢支持！有问题随时问我哦~",
    "这个角度好新颖！学到了 ✨",
    "对呀对呀，我也是这么想的！",
    "收到反馈啦，感谢~ 🙏",
    "嗯嗯有道理，下次会改进的！",
    "谢谢分享！一起加油 💪",
]


def load_cookie():
    for line in ENV_FILE.read_text().splitlines():
        if line.strip().startswith("XHS_COOKIE="):
            return line.split("=", 1)[1]
    sys.exit("❌ 找不到XHS_COOKIE")


def extract_a1(cookie_str):
    for part in cookie_str.split(";"):
        k, _, v = part.strip().partition("=")
        if k == "a1":
            return v
    sys.exit("❌ cookie中找不到a1")


def check_skip(text):
    lower = text.lower()
    return any(kw.lower() in lower for kw in SKIP_KEYWORDS)


def load_log():
    try:
        with open(LOG_FILE) as f:
            return json.load(f)
    except:
        return {}


def save_log(log):
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="小红书评论自动回复")
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    try:
        from xhs import XhsClient
    except ImportError:
        print("❌ 需要: pip install xhs")
        return

    cookie = load_cookie()
    a1 = extract_a1(cookie)

    # 签名函数（复用post_xhs_v2的逻辑）
    stealth_js = SCRIPT_DIR / "stealth.min.js"

    def sign(uri, data=None, a1="", web_session=""):
        from playwright.sync_api import sync_playwright
        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            ctx = browser.new_context()
            if stealth_js.exists():
                ctx.add_init_script(path=str(stealth_js))
            page = ctx.new_page()
            page.goto("https://www.xiaohongshu.com")
            ctx.add_cookies([{"name": "a1", "value": a1, "domain": ".xiaohongshu.com", "path": "/"}])
            page.reload()
            time.sleep(2)
            ep = page.evaluate("([url, data]) => window._webmsxyw(url, data)", [uri, data])
            browser.close()
            return {"x-s": ep["X-s"], "x-t": str(ep["X-t"])}

    client = XhsClient(cookie, sign=sign)
    log = load_log()

    # 获取自己的笔记
    try:
        me = client.get_self_info()
        user_id = me.get("user_id") or me.get("id")
        print(f"✅ 登录: {me.get('nickname', '未知')}")
    except Exception as e:
        print(f"❌ 登录失败: {e}")
        return

    try:
        notes_resp = client.get_user_notes(user_id)
        notes = notes_resp.get("notes", []) if isinstance(notes_resp, dict) else notes_resp
    except Exception as e:
        print(f"❌ 获取笔记失败: {e}")
        return

    print(f"📋 找到 {len(notes)} 篇笔记")
    replied = 0

    for note in notes:
        if replied >= args.count:
            break

        note_id = note.get("note_id") or note.get("id")
        title = note.get("title", note.get("display_title", ""))

        try:
            comments_resp = client.get_note_comments(note_id)
            comments = comments_resp.get("comments", []) if isinstance(comments_resp, dict) else comments_resp
        except Exception as e:
            print(f"  ⚠️ 获取评论失败 [{note_id}]: {e}")
            continue

        for comment in (comments or []):
            if replied >= args.count:
                break

            comment_id = comment.get("id") or comment.get("comment_id")
            content = comment.get("content", "")
            log_key = f"xhs_reply_{comment_id}"

            if log_key in log:
                continue
            if "喜羊羊自动回复" in content:
                continue
            if check_skip(content):
                print(f"  🚫 跳过: {content[:30]}")
                continue

            reply_text = random.choice(REPLY_TEMPLATES) + SUFFIX
            print(f"  💬 回复 [{comment_id}]: {reply_text[:60]}")

            if args.dry_run:
                print(f"  🏷️ [DRY-RUN]")
                replied += 1
                continue

            try:
                client.comment_note(note_id, reply_text, comment_id=comment_id)
                print(f"  ✅ 成功")
                log[log_key] = {
                    "platform": "xhs", "note_id": note_id, "comment_id": comment_id,
                    "reply": reply_text, "time": datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S"),
                    "type": "xhs_reply"
                }
                save_log(log)
                replied += 1
                time.sleep(5)
            except Exception as e:
                print(f"  ❌ 失败: {e}")

    print(f"\n📊 完成: 回复 {replied} 条")


if __name__ == "__main__":
    main()
