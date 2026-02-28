#!/usr/bin/env python3
"""RealWorldClaw 社区评论自动回复 — 用curl避免SSL问题"""
import subprocess, json, os, random, time
from datetime import datetime, timedelta, timezone

API = "https://realworldclaw-api.fly.dev/api/v1"
EMAIL = "xyy_ops@hagemi.com"
PASSWORD = "RWC-ops-2026!"
STATE_FILE = os.path.expanduser("~/.rwc-reply-state.json")
CST = timezone(timedelta(hours=8))

def now(): return datetime.now(CST)

def curl_json(method, url, data=None, token=None):
    cmd = ["curl", "-sf", url]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    if method == "POST":
        cmd += ["-X", "POST", "-H", "Content-Type: application/json"]
        if data:
            cmd += ["-d", json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    return json.loads(r.stdout, strict=False) if r.stdout else None

def load_state():
    try:
        with open(STATE_FILE) as f: return json.load(f)
    except: return {"replied": []}

def save_state(state):
    state["replied"] = state["replied"][-500:]
    with open(STATE_FILE, "w") as f: json.dump(state, f)

REPLIES = {
    "bug": ["感谢反馈！能提供更多细节吗？", "收到，会跟进。可以说说复现步骤吗？"],
    "praise": ["谢谢支持！🎉", "一起加油💪"],
    "question": ["好问题！让我想想...", "问得好，欢迎其他人补充！"],
    "default": ["感谢参与讨论！", "说得好💪", "有意思的角度！", "谢谢分享！"],
}

def pick_reply(content):
    cl = content.lower()
    if any(w in cl for w in ["问题", "bug", "错误", "error", "fail"]):
        return random.choice(REPLIES["bug"])
    if any(w in cl for w in ["赞", "棒", "cool", "nice", "great", "厉害"]):
        return random.choice(REPLIES["praise"])
    if "?" in cl or "？" in cl:
        return random.choice(REPLIES["question"])
    return random.choice(REPLIES["default"])

def main():
    state = load_state()
    auth = curl_json("POST", f"{API}/auth/login", {"email": EMAIL, "password": PASSWORD})
    if not auth: print(f"{now()}: Login failed"); return
    token = auth["access_token"]

    posts_data = curl_json("GET", f"{API}/community/posts?limit=20", token=token)
    if not posts_data: print(f"{now()}: No posts"); return
    posts = posts_data.get("posts", [])

    replied = 0
    for post in posts:
        pid = post["id"]
        comments = curl_json("GET", f"{API}/community/posts/{pid}/comments", token=token)
        if not comments or not isinstance(comments, list): continue
        for c in comments:
            cid = c.get("id"); author = c.get("author_name", ""); content = c.get("content", "")
            if author == "xyy_ops" or cid in state["replied"] or not content.strip(): continue
            reply = pick_reply(content)
            resp = curl_json("POST", f"{API}/community/posts/{pid}/comments",
                             {"content": reply, "parent_id": cid}, token=token)
            if resp:
                state["replied"].append(cid); replied += 1
                print(f"{now()}: Replied {cid}: {reply[:50]}")
                time.sleep(2)
            if replied >= 10: break
        if replied >= 10: break
    save_state(state)
    print(f"{now()}: Done. Replied {replied}.")

if __name__ == "__main__": main()
