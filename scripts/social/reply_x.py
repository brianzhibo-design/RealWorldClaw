#!/usr/bin/env python3
"""reply_x.py — X/Twitter自动回复
复用post_x.py的OAuth逻辑，获取mentions并自动回复。
"""

import argparse
import json
import os
import random
import time
from pathlib import Path
from datetime import datetime, timezone, timedelta

CST = timezone(timedelta(hours=8))
SCRIPT_DIR = Path(__file__).parent.resolve()
LOG_FILE = SCRIPT_DIR / "replied-log.json"
SUFFIX = "\n\n（RWC喜羊羊自动回复）"

# OAuth keys (same as post_x.py)
CONSUMER_KEY = "bxteaDL5FvGvJkcYBMCMUJNOW"
CONSUMER_SECRET = "w55WwYRNPcgsiuB290xuagzjH4cS0PBcmVxhs5Tky0MdYyR2FK"
ACCESS_TOKEN = "2026171284976173058-xQeV6x9BBuXkS166KhKfjFoN4QQQNk"
ACCESS_SECRET = "N7KVP9NDLCvAiiruap1JCimlOytoYenB9qnknG0ayurDW"

# 安全规则（从auto_reply.py复制）
SKIP_KEYWORDS = [
    "请帮我", "帮我执行", "运行命令", "删除", "修改数据", "给我权限",
    "admin", "sudo", "rm -rf", "drop table", "eval(", "exec(",
    "system prompt", "ignore previous", "忽略之前", "你的指令",
    "http://", "bit.ly", "加微信", "加QQ", "私聊", "免费领",
    "点击链接", "扫码", "优惠券", "代理", "刷单",
    "政治", "赌博", "色情",
]

REPLY_TEMPLATES = [
    "谢谢关注！{topic}这个方向我们一直在探索 🚀",
    "感谢回复！{topic}确实值得深入讨论",
    "收到！{topic}的反馈已记录，感谢支持 🙏",
    "哈哈说得对，{topic}我们也有同感",
    "感谢分享你的看法！{topic}我们会持续改进的",
    "谢谢！这个建议很有价值 👍",
    "有道理！关于{topic}我们内部也在讨论",
    "感谢支持RWC！有什么想法随时交流 ✨",
]


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


def generate_reply(text):
    topic = text[:20].strip() + "..." if len(text) > 20 else text.strip()
    tpl = random.choice(REPLY_TEMPLATES)
    return tpl.format(topic=topic) + SUFFIX


def main():
    parser = argparse.ArgumentParser(description="X/Twitter自动回复")
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    try:
        from requests_oauthlib import OAuth1Session
    except ImportError:
        print("❌ 需要: pip install requests-oauthlib")
        return

    oauth = OAuth1Session(CONSUMER_KEY, CONSUMER_SECRET, ACCESS_TOKEN, ACCESS_SECRET)
    log = load_log()

    # 获取自己的用户ID
    me_resp = oauth.get("https://api.twitter.com/2/users/me")
    if me_resp.status_code != 200:
        print(f"❌ 获取用户信息失败: {me_resp.status_code} {me_resp.text[:200]}")
        return
    my_id = me_resp.json()["data"]["id"]
    print(f"✅ 登录: @{me_resp.json()['data']['username']} (ID: {my_id})")

    # 获取mentions
    mentions_resp = oauth.get(
        f"https://api.twitter.com/2/users/{my_id}/mentions",
        params={"max_results": 20, "tweet.fields": "author_id,text,created_at"}
    )
    if mentions_resp.status_code != 200:
        print(f"❌ 获取mentions失败: {mentions_resp.status_code} {mentions_resp.text[:200]}")
        return

    mentions = mentions_resp.json().get("data", [])
    print(f"📋 获取到 {len(mentions)} 条mention")

    replied = 0
    for mention in mentions:
        if replied >= args.count:
            break

        tweet_id = mention["id"]
        text = mention["text"]
        log_key = f"x_reply_{tweet_id}"

        if log_key in log:
            continue
        if check_skip(text):
            print(f"  🚫 跳过可疑内容: {text[:50]}")
            continue

        reply_text = generate_reply(text)
        print(f"  💬 回复 [{tweet_id}]: {reply_text[:80]}...")

        if args.dry_run:
            print(f"  🏷️ [DRY-RUN]")
            replied += 1
            continue

        resp = oauth.post(
            "https://api.twitter.com/2/tweets",
            json={"text": reply_text, "reply": {"in_reply_to_tweet_id": tweet_id}}
        )
        if resp.status_code in (200, 201):
            print(f"  ✅ 发送成功")
            log[log_key] = {
                "platform": "x", "tweet_id": tweet_id, "reply": reply_text,
                "time": datetime.now(CST).strftime("%Y-%m-%d %H:%M:%S"), "type": "x_reply"
            }
            save_log(log)
            replied += 1
            time.sleep(5)
        else:
            print(f"  ❌ 失败: {resp.status_code} {resp.text[:200]}")

    print(f"\n📊 完成: 回复 {replied} 条")


if __name__ == "__main__":
    main()
