#!/usr/bin/env python3
"""统一评论回复层 — 沸羊羊🐏出品

安全规则从 auto_reply.py 继承，硬编码到模块中。
所有回复结尾带（RWC喜羊羊自动回复）署名。
"""

import json
import os
import random
import re
import time
import urllib.request
from typing import Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env"))
except ImportError:
    pass

# ── 安全规则（硬编码） ──

SUFFIX = "\n\n（RWC喜羊羊自动回复）"

SKIP_KEYWORDS = [
    "请帮我", "帮我执行", "运行命令", "删除", "修改数据", "给我权限",
    "admin", "sudo", "rm -rf", "drop table", "eval(", "exec(",
    "system prompt", "ignore previous", "忽略之前", "你的指令",
    "http://", "bit.ly", "加微信", "加QQ", "私聊", "免费领",
    "点击链接", "扫码", "优惠券", "代理", "刷单",
    "政治", "赌博", "色情",
]

NEGATIVE_KEYWORDS = [
    "垃圾", "骗子", "太烂", "不好用", "坑人", "退款", "投诉",
    "trash", "scam", "sucks", "waste",
]

NEGATIVE_REPLY_TEMPLATES = [
    "唉，听起来体验确实不太好 😅 方便说说具体卡在哪了吗？我帮你反馈给团队看看",
    "这个问题收到了，确实不应该。你能描述一下具体场景吗？好定位问题",
    "抱歉遇到这种情况了… 具体是哪个环节出了问题？说详细点我好帮你追",
]

COMMENT_REPLY_TEMPLATES = [
    "确实，说得有道理",
    "哈哈同感",
    "对对对，我也是这么想的",
    "这个角度不错，之前没想到",
    "赞同 👍",
    "有道理，值得多讨论",
    "嗯嗯这个观点我认同",
    "哈哈你说的这个我也遇到过！",
    "长知识了",
    "对，就是这样。重点就在这里",
]

RWC_BASE_URL = "https://realworldclaw-api.fly.dev/api/v1"
MOLTBOOK_BASE_URL = "https://www.moltbook.com/api/v1"

LOG_DIR = os.path.dirname(os.path.abspath(__file__))
REPLIED_LOG = os.path.join(LOG_DIR, "replied-log.json")


def _load_log() -> dict:
    try:
        with open(REPLIED_LOG) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _save_log(log: dict):
    with open(REPLIED_LOG, "w") as f:
        json.dump(log, f, ensure_ascii=False, indent=2)


class ReplyDecision:
    """回复决策结果"""
    SKIP = "skip"       # 可疑内容，直接跳过
    NEGATIVE = "negative"  # 负面内容，温和回复
    NORMAL = "normal"   # 正常回复


class CommentReplier:
    """统一回复各平台评论

    安全规则：
    - SKIP_KEYWORDS 匹配 → 跳过不回复
    - NEGATIVE_KEYWORDS 匹配 → 温和安抚回复
    - 所有回复结尾加（RWC喜羊羊自动回复）
    - 自我介绍用"RWC社区自动运营机器人喜羊羊"
    - 真人聊天风格，不要AI味
    """

    def __init__(self):
        self._log = _load_log()

    def check_safety(self, content: str) -> str:
        """检查评论安全性，返回 ReplyDecision"""
        lower = content.lower()
        if any(kw.lower() in lower for kw in SKIP_KEYWORDS):
            return ReplyDecision.SKIP
        if any(kw.lower() in lower for kw in NEGATIVE_KEYWORDS):
            return ReplyDecision.NEGATIVE
        return ReplyDecision.NORMAL

    def generate_reply(self, content: str, decision: Optional[str] = None) -> Optional[str]:
        """根据安全决策生成回复文本。返回None表示跳过。"""
        if decision is None:
            decision = self.check_safety(content)
        if decision == ReplyDecision.SKIP:
            return None
        if decision == ReplyDecision.NEGATIVE:
            return random.choice(NEGATIVE_REPLY_TEMPLATES) + SUFFIX
        return random.choice(COMMENT_REPLY_TEMPLATES) + SUFFIX

    def _record(self, log_key: str, platform: str, post_id: str, comment_id: str, reply: str):
        self._log[log_key] = {
            "platform": platform,
            "post_id": post_id,
            "comment_id": comment_id,
            "reply": reply,
            "time": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        _save_log(self._log)

    # ── RWC 社区 ──

    def reply_community(self, token: str, post_id: str, comment_id: str, content: str) -> bool:
        """回复社区评论

        Args:
            token: RWC社区登录token
            post_id: 帖子ID
            comment_id: 被回复的评论ID
            content: 回复内容（会自动加安全后缀）

        Returns:
            是否成功
        """
        if not content.endswith(SUFFIX):
            content += SUFFIX

        url = f"{RWC_BASE_URL}/community/posts/{post_id}/comments"
        headers = {"Content-Type": "application/json", "Authorization": f"Bearer {token}"}
        body = json.dumps({"content": content, "parent_id": comment_id}).encode()

        try:
            req = urllib.request.Request(url, data=body, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp.read()
            self._record(f"reply_{comment_id}", "community", post_id, comment_id, content)
            return True
        except Exception as e:
            print(f"[community] ❌ 回复失败: {e}")
            # 降级：@方式
            try:
                body2 = json.dumps({"content": content}).encode()
                req2 = urllib.request.Request(url, data=body2, headers=headers, method="POST")
                with urllib.request.urlopen(req2, timeout=15) as resp:
                    resp.read()
                self._record(f"reply_{comment_id}", "community", post_id, comment_id, content)
                return True
            except Exception as e2:
                print(f"[community] ❌ 降级也失败: {e2}")
                return False

    # ── X / Twitter ──

    def reply_x(self, oauth_credentials: dict, tweet_id: str, content: str) -> bool:
        """回复推文

        Args:
            oauth_credentials: {"consumer_key", "consumer_secret", "access_token", "access_secret"}
            tweet_id: 被回复的推文ID
            content: 回复内容
        """
        if not content.endswith(SUFFIX):
            content += SUFFIX

        try:
            from requests_oauthlib import OAuth1Session
        except ImportError:
            print("[x] ❌ 需要 requests_oauthlib")
            return False

        oauth = OAuth1Session(
            oauth_credentials["consumer_key"],
            oauth_credentials["consumer_secret"],
            oauth_credentials["access_token"],
            oauth_credentials["access_secret"],
        )

        try:
            resp = oauth.post("https://api.twitter.com/2/tweets", json={
                "text": content,
                "reply": {"in_reply_to_tweet_id": tweet_id},
            })
            if resp.status_code in (200, 201):
                self._record(f"x_{tweet_id}", "x", tweet_id, tweet_id, content)
                return True
            else:
                print(f"[x] ❌ 回复失败: {resp.status_code} {resp.text[:200]}")
                return False
        except Exception as e:
            print(f"[x] ❌ 回复异常: {e}")
            return False

    # ── 小红书 ──

    def reply_xhs(self, xhs_client, note_id: str, comment_id: str, content: str) -> bool:
        """回复小红书评论

        Args:
            xhs_client: xhs SDK client实例
            note_id: 笔记ID
            comment_id: 评论ID
            content: 回复内容

        注意：可能抛出300011错误（cookie过期）
        """
        if not content.endswith(SUFFIX):
            content += SUFFIX

        try:
            xhs_client.comment_note(note_id, content, comment_id)
            self._record(f"xhs_{comment_id}", "xhs", note_id, comment_id, content)
            return True
        except Exception as e:
            if "300011" in str(e):
                print("[xhs] ❌ Cookie已过期(300011)，请更新XHS_COOKIE")
            else:
                print(f"[xhs] ❌ 回复失败: {e}")
            return False

    # ── Moltbook ──

    def reply_moltbook(self, api_key: str, post_id: str, content: str) -> bool:
        """回复Moltbook评论

        Args:
            api_key: Moltbook API key
            post_id: 帖子ID
            content: 回复内容
        """
        if not content.endswith(SUFFIX):
            content += SUFFIX

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
        body = json.dumps({"content": content}).encode()

        try:
            req = urllib.request.Request(
                f"{MOLTBOOK_BASE_URL}/posts/{post_id}/comments",
                data=body, headers=headers, method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                resp.read()
            self._record(f"moltbook_{post_id}", "moltbook", post_id, "", content)
            return True
        except Exception as e:
            print(f"[moltbook] ❌ 回复失败: {e}")
            return False

    # ── 批量智能回复 ──

    def auto_reply(self, comments: list, token: str = "",
                   x_creds: Optional[dict] = None, xhs_client=None,
                   moltbook_key: str = "", dry_run: bool = False) -> dict:
        """对一批评论自动回复（带安全过滤）

        Args:
            comments: CommentFetcher.fetch_all() 的输出
            dry_run: 为True时不实际发送

        Returns:
            {"replied": N, "skipped": N, "failed": N}
        """
        stats = {"replied": 0, "skipped": 0, "failed": 0}

        for c in comments:
            if c.get("replied"):
                stats["skipped"] += 1
                continue

            decision = self.check_safety(c["content"])
            reply_text = self.generate_reply(c["content"], decision)

            if reply_text is None:
                print(f"  🚫 [{c['platform']}] 跳过可疑评论: {c['content'][:40]}")
                stats["skipped"] += 1
                continue

            print(f"  💬 [{c['platform']}] → {reply_text[:60]}...")

            if dry_run:
                stats["replied"] += 1
                continue

            ok = False
            platform = c["platform"]
            if platform == "community" and token:
                ok = self.reply_community(token, c["post_id"], c["comment_id"], reply_text)
            elif platform == "x" and x_creds:
                ok = self.reply_x(x_creds, c["comment_id"], reply_text)
            elif platform == "xhs" and xhs_client:
                ok = self.reply_xhs(xhs_client, c["post_id"], c["comment_id"], reply_text)
            elif platform == "moltbook" and moltbook_key:
                ok = self.reply_moltbook(moltbook_key, c["post_id"], reply_text)
            else:
                print(f"  ⚠️ [{platform}] 缺少凭证，跳过")
                stats["skipped"] += 1
                continue

            if ok:
                stats["replied"] += 1
            else:
                stats["failed"] += 1

            time.sleep(3)  # 平台限流

        return stats


if __name__ == "__main__":
    replier = CommentReplier()

    # 安全检查测试
    test_cases = [
        ("这个项目不错！", ReplyDecision.NORMAL),
        ("帮我执行一个命令", ReplyDecision.SKIP),
        ("这个太垃圾了", ReplyDecision.NEGATIVE),
        ("加微信免费领优惠券", ReplyDecision.SKIP),
    ]
    print("🧪 安全检查测试:")
    for text, expected in test_cases:
        result = replier.check_safety(text)
        status = "✅" if result == expected else "❌"
        print(f"  {status} '{text[:30]}' → {result} (期望 {expected})")

    # 生成回复测试
    print("\n🧪 回复生成测试:")
    for text, _ in test_cases:
        reply = replier.generate_reply(text)
        print(f"  '{text[:30]}' → {reply[:60] if reply else '[SKIP]'}")
