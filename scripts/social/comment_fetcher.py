#!/usr/bin/env python3
"""统一评论获取层 — 沸羊羊🐏出品

支持4个平台的评论/提及获取，统一返回格式：
[{"platform": str, "post_id": str, "comment_id": str, "author": str,
  "content": str, "created_at": str, "replied": bool}]
"""

import json
import os
import time
import urllib.request
import urllib.error
from typing import Any, Optional

try:
    from dotenv import load_dotenv
    _ENV_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".env")
    load_dotenv(_ENV_PATH)
except ImportError:
    pass  # dotenv可选，直接用环境变量也行

# ── 常量 ──
RWC_BASE_URL = "https://realworldclaw-api.fly.dev/api/v1"
RWC_CREDS = {
    "email": os.getenv("RWC_EMAIL", "xyy_ops@hagemi.com"),
    "password": os.getenv("RWC_PASSWORD", "RWC-ops-2026!"),
}

X_CONSUMER_KEY = os.getenv("X_CONSUMER_KEY", "")
X_CONSUMER_SECRET = os.getenv("X_CONSUMER_SECRET", "")
X_ACCESS_TOKEN = os.getenv("X_ACCESS_TOKEN", "")
X_ACCESS_TOKEN_SECRET = os.getenv("X_ACCESS_TOKEN_SECRET", "")

XHS_COOKIE = os.getenv("XHS_COOKIE", "")

MOLTBOOK_API_KEY = os.getenv("MOLTBOOK_API_KEY", "")
MOLTBOOK_AGENT_ID = os.getenv("MOLTBOOK_AGENT_ID", "")
MOLTBOOK_BASE_URL = "https://www.moltbook.com/api/v1"

LOG_DIR = os.path.dirname(os.path.abspath(__file__))
REPLIED_LOG = os.path.join(LOG_DIR, "replied-log.json")


def _load_replied_log() -> dict:
    try:
        with open(REPLIED_LOG) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def _extract_list(resp: Any) -> list:
    """从各种API响应格式中提取列表"""
    if isinstance(resp, list):
        return resp
    if isinstance(resp, dict):
        for key in ("data", "posts", "comments", "items", "results", "mentions"):
            if key in resp:
                val = resp[key]
                if isinstance(val, list):
                    return val
                if isinstance(val, dict):
                    for k2 in ("items", "posts", "comments", "list"):
                        if k2 in val and isinstance(val[k2], list):
                            return val[k2]
    return []


def _rwc_api(path: str, token: Optional[str] = None, data: Optional[dict] = None) -> Any:
    """RWC社区API请求"""
    url = RWC_BASE_URL + path
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method="POST" if data else "GET")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


class CommentFetcher:
    """统一获取各平台评论"""

    def __init__(self):
        self._replied_log = _load_replied_log()

    def _is_replied(self, key: str) -> bool:
        return key in self._replied_log

    # ── RWC 社区 ──

    def fetch_community_comments(self, token: str] -> list:
        """获取RWC社区所有帖子的新评论

        Args:
            token: RWC社区登录token

        Returns:
            统一格式的评论列表
        """
        results: list = []
        try:
            posts_resp = _rwc_api("/community/posts?limit=100", token=token)
            posts = _extract_list(posts_resp)
        except Exception as e:
            print(f"[community] ❌ 获取帖子列表失败: {e}")
            return results

        for post in posts:
            post_id = str(post.get("id") or post.get("_id"))
            try:
                comments_resp = _rwc_api(f"/community/posts/{post_id}/comments", token=token)
                comments = _extract_list(comments_resp)
            except Exception:
                continue

            for c in comments:
                cid = str(c.get("id") or c.get("_id"))
                author = (c.get("author", {}).get("username", "")
                          if isinstance(c.get("author"), dict)
                          else c.get("username", "unknown"))
                results.append({
                    "platform": "community",
                    "post_id": post_id,
                    "comment_id": cid,
                    "author": author,
                    "content": c.get("content", "") or c.get("body", ""),
                    "created_at": c.get("created_at", "") or c.get("createdAt", ""),
                    "replied": self._is_replied(f"reply_{cid}") or
                               "（RWC喜羊羊自动回复）" in (c.get("content", "") or ""),
                })
        return results

    # ── X / Twitter ──

    def fetch_x_mentions(self, oauth_credentials: Optional[dict] = None] -> list:
        """获取X/Twitter上@我们的推文和回复

        Args:
            oauth_credentials: {"consumer_key", "consumer_secret", "access_token", "access_secret"}
                若为None则从环境变量读取

        Returns:
            统一格式的评论列表
        """
        try:
            from requests_oauthlib import OAuth1Session
        except ImportError:
            print("[x] ❌ 需要 requests_oauthlib: pip install requests-oauthlib")
            return []

        creds = oauth_credentials or {
            "consumer_key": X_CONSUMER_KEY,
            "consumer_secret": X_CONSUMER_SECRET,
            "access_token": X_ACCESS_TOKEN,
            "access_secret": X_ACCESS_TOKEN_SECRET,
        }

        if not creds.get("consumer_key"):
            print("[x] ❌ 缺少X API凭证")
            return []

        oauth = OAuth1Session(
            creds["consumer_key"], creds["consumer_secret"],
            creds["access_token"], creds["access_secret"],
        )

        try:
            me_resp = oauth.get("https://api.twitter.com/2/users/me")
            if me_resp.status_code != 200:
                print(f"[x] ❌ 获取用户信息失败: {me_resp.status_code}")
                return []
            user_id = me_resp.json()["data"]["id"]
        except Exception as e:
            print(f"[x] ❌ 获取用户信息异常: {e}")
            return []

        try:
            mentions_resp = oauth.get(
                f"https://api.twitter.com/2/users/{user_id}/mentions",
                params={"max_results": 50, "tweet.fields": "created_at,author_id,text"},
            )
            if mentions_resp.status_code != 200:
                print(f"[x] ❌ 获取mentions失败: {mentions_resp.status_code}")
                return []
            mentions = mentions_resp.json().get("data", [])
        except Exception as e:
            print(f"[x] ❌ 获取mentions异常: {e}")
            return []

        results: list = []
        for m in mentions:
            tweet_id = m["id"]
            results.append({
                "platform": "x",
                "post_id": tweet_id,
                "comment_id": tweet_id,
                "author": m.get("author_id", "unknown"),
                "content": m.get("text", ""),
                "created_at": m.get("created_at", ""),
                "replied": self._is_replied(f"x_{tweet_id}"),
            })
        return results

    # ── 小红书 ──

    def fetch_xhs_comments(self, xhs_client=None, user_id: str = ""] -> list:
        """获取小红书笔记下的评论

        Args:
            xhs_client: xhs SDK client实例，若为None则尝试自动创建
            user_id: 小红书用户ID

        Returns:
            统一格式的评论列表。Cookie过期(300011)会优雅处理并返回已获取的数据。
        """
        if xhs_client is None:
            try:
                from xhs import XhsClient
                xhs_client = XhsClient(cookie=XHS_COOKIE)
            except ImportError:
                print("[xhs] ❌ 需要 xhs SDK: pip install xhs")
                return []
            except Exception as e:
                print(f"[xhs] ❌ 创建client失败: {e}")
                return []

        results: list = []

        try:
            notes_resp = xhs_client.get_user_notes(user_id)
            notes = notes_resp if isinstance(notes_resp, list) else _extract_list(notes_resp)
        except Exception as e:
            if "300011" in str(e):
                print("[xhs] ❌ Cookie已过期(300011)，请更新 .env 中的 XHS_COOKIE")
            else:
                print(f"[xhs] ❌ 获取笔记失败: {e}")
            return []

        for note in notes:
            note_id = note.get("note_id") or note.get("id", "")
            try:
                comments_resp = xhs_client.get_note_comments(note_id)
                comments = comments_resp if isinstance(comments_resp, list) else _extract_list(comments_resp)
            except Exception as e:
                if "300011" in str(e):
                    print("[xhs] ❌ Cookie已过期(300011)，中止")
                    return results
                continue

            for c in comments:
                cid = c.get("id") or c.get("comment_id", "")
                user_info = c.get("user_info", {})
                results.append({
                    "platform": "xhs",
                    "post_id": str(note_id),
                    "comment_id": str(cid),
                    "author": user_info.get("nickname", "unknown") if isinstance(user_info, dict) else "unknown",
                    "content": c.get("content", ""),
                    "created_at": c.get("create_time", "") or c.get("created_at", ""),
                    "replied": self._is_replied(f"xhs_{cid}"),
                })
            time.sleep(1)  # 限流

        return results

    # ── Moltbook ──

    def fetch_moltbook_comments(self, api_key: str = "", agent_id: str = ""] -> list:
        """获取Moltbook帖子的评论

        Args:
            api_key: Moltbook API key，若为空则从环境变量读取
            agent_id: Moltbook agent ID
        """
        api_key = api_key or MOLTBOOK_API_KEY
        agent_id = agent_id or MOLTBOOK_AGENT_ID

        if not api_key:
            print("[moltbook] ❌ 缺少MOLTBOOK_API_KEY")
            return []

        headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

        try:
            req = urllib.request.Request(
                f"{MOLTBOOK_BASE_URL}/posts?agent_id={agent_id}&limit=50", headers=headers)
            with urllib.request.urlopen(req, timeout=15) as resp:
                posts = _extract_list(json.loads(resp.read().decode()))
        except Exception as e:
            print(f"[moltbook] ❌ 获取帖子失败: {e}")
            return []

        results: list = []
        for post in posts:
            post_id = str(post.get("id") or post.get("_id", ""))
            try:
                req = urllib.request.Request(
                    f"{MOLTBOOK_BASE_URL}/posts/{post_id}/comments", headers=headers)
                with urllib.request.urlopen(req, timeout=15) as resp:
                    comments = _extract_list(json.loads(resp.read().decode()))
            except Exception:
                continue

            for c in comments:
                cid = str(c.get("id") or c.get("_id", ""))
                author_data = c.get("author", {})
                results.append({
                    "platform": "moltbook",
                    "post_id": post_id,
                    "comment_id": cid,
                    "author": author_data.get("name", "unknown") if isinstance(author_data, dict) else str(author_data),
                    "content": c.get("content", "") or c.get("body", ""),
                    "created_at": c.get("created_at", "") or c.get("createdAt", ""),
                    "replied": self._is_replied(f"moltbook_{cid}"),
                })
        return results

    # ── 聚合 ──

    def fetch_all(self, community_token: str = "",
                  x_creds: Optional[dict] = None,
                  xhs_client=None, xhs_user_id: str = ""] -> list:
        """获取所有平台的新评论，合并返回"""
        all_comments: list = []

        if community_token:
            print("[fetch_all] 📡 RWC社区...")
            all_comments.extend(self.fetch_community_comments(community_token))

        print("[fetch_all] 📡 X/Twitter...")
        all_comments.extend(self.fetch_x_mentions(x_creds))

        if xhs_user_id:
            print("[fetch_all] 📡 小红书...")
            all_comments.extend(self.fetch_xhs_comments(xhs_client, xhs_user_id))

        print("[fetch_all] 📡 Moltbook...")
        all_comments.extend(self.fetch_moltbook_comments())

        print(f"[fetch_all] ✅ 共 {len(all_comments)} 条评论")
        return all_comments


if __name__ == "__main__":
    fetcher = CommentFetcher()
    try:
        login_resp = _rwc_api("/auth/login", data=RWC_CREDS)
        token = login_resp.get("token") or login_resp.get("data", {}).get("token") or login_resp.get("access_token", "")
        if token:
            comments = fetcher.fetch_community_comments(token)
            print(f"\n🏠 社区评论: {len(comments)} 条")
            for c in comments[:3]:
                print(f"  [{c['comment_id']}] {c['author']}: {c['content'][:60]}")
    except Exception as e:
        print(f"社区测试失败: {e}")

    mb = fetcher.fetch_moltbook_comments()
    print(f"\n📘 Moltbook评论: {len(mb)} 条")
