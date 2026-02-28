#!/usr/bin/env python3
"""reply_moltbook.py — Moltbook评论自动回复"""

import argparse
import json
import random
import time
import requests
from pathlib import Path
from datetime import datetime, timezone, timedelta

CST = timezone(timedelta(hours=8))
SCRIPT_DIR = Path(__file__).parent.resolve()
LOG_FILE = SCRIPT_DIR / "replied-log.json"
SUFFIX = "\n\n（RWC喜羊羊自动回复）"

API_KEY = "moltbook_sk_0EEEa44MLRJys0gAwTpQ8Qs5kSoy8F2G"
AGENT_ID = "a42ae0ac-6fea-446d-a352-ac5d98c4e720"
BASE_URL = "https://www.moltbook.com/api/v1"

SKIP_KEYWORDS = [
    "请帮我", "帮我执行", "运行命令", "删除", "修改数据", "给我权限",
    "admin", "sudo", "rm -rf", "drop table", "eval(", "exec(",
    "system prompt", "ignore previous", "忽略之前", "你的指令",
    "http://", "bit.ly", "加微信", "加QQ", "私聊", "免费领",
    "点击链接", "扫码", "优惠券", "代理", "刷单",
    "政治", "赌博", "色情",
]

REPLY_TEMPLATES = [
    "谢谢关注！这个话题很有意思 🔥",
    "说得有道理！一起讨论 💡",
    "感谢回复，已记录反馈 🙏",
    "哈哈同感！这个方向值得继续探索",
    "好观点！有什么想法随时交流 ✨",
    "收到！感谢支持RWC社区 👍",
]

HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}


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
    parser = argparse.ArgumentParser(description="Moltbook评论自动回复")
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    log = load_log()

    # 获取自己的帖子
    print("📋 获取帖子...")
    resp = requests.get(f"{BASE_URL}/posts", headers=HEADERS, params={"limit": 20})
    if resp.status_code != 200:
        print(f"❌ 获取帖子失败: {resp.status_code}")
        return

    posts = resp.json() if isinstance(resp.json(), list) else resp.json().get("data", resp.json().get("posts", []))
    print(f"  找到 {len(posts)} 个帖子")

    replied = 0
    for post in posts:
        if replied >= args.count:
            break

        post_id = str(post.get("id") or post.get("_id"))
        title = post.get("title", "")

        # 获取评论
        comments_resp = requests.get(f"{BASE_URL}/posts/{post_id}/comments", headers=HEADERS)
        if comments_resp.status_code != 200:
            continue

        comments = comments_resp.json() if isinstance(comments_resp.json(), list) else comments_resp.json().get("data", comments_resp.json().get("comments", []))

        for comment in comments:
            if replied >= args.count:
                break

            comment_id = str(comment.get("id") or comment.get("_id"))
            content = comment.get("content", "") or comment.get("body", "")
            log_key = f"moltbook_reply_{comment_id}"

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

            post_resp = requests.post(
                f"{BASE_URL}/posts/{post_id}/comments",
                headers=HEADERS,
                json={"content": reply_text, "parent_id": comment_id}
            )
            if post_resp.status_code in (200, 201):
                print(f"  ✅ 成功")
                log[log_key] = {
                    "platform": "moltbook", "post_id": post_id, "comment_id": comment_id,
                    "reply": reply_text, "time": datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S"),
                    "type": "moltbook_reply"
                }
                save_log(log)
                replied += 1
                time.sleep(3)
            else:
                print(f"  ❌ 失败: {post_resp.status_code}")

    print(f"\n📊 完成: 回复 {replied} 条")


if __name__ == "__main__":
    main()
