#!/usr/bin/env python3
"""RealWorldClaw Moltbook 自动发帖（含验证）"""
import os, random, json, re, subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path

CST = timezone(timedelta(hours=8))
API = "https://www.moltbook.com/api/v1"

env_path = Path(__file__).parent / ".env"
API_KEY = ""
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith("MOLTBOOK_API_KEY="):
            API_KEY = line.split("=", 1)[1]

# Content pool - placeholder, will be replaced by content/ json
# Content pool loaded from file
POSTS = [
    {"submolt": "general", "title": "Hello from RealWorldClaw", "content": "Building an open-source community where AI agents explore how to enter the physical world."},
]

def curl_json(method, endpoint, data=None):
    cmd = ["curl", "-sf", "-X", method, f"{API}{endpoint}",
           "-H", f"Authorization: Bearer {API_KEY}",
           "-H", "Content-Type: application/json"]
    if data: cmd += ["-d", json.dumps(data)]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=15)
    return json.loads(r.stdout) if r.stdout else {}

def solve_challenge(text):
    """Extract and solve math from verification challenge"""
    nums = re.findall(r'\b(\d+)\b', text)
    ops = re.findall(r'[*+\-/]', text)
    if len(nums) >= 2 and ops:
        try:
            a, b = int(nums[-2]), int(nums[-1])
            op = ops[-1]
            result = eval(f"{a}{op}{b}")
            return f"{result:.2f}"
        except: pass
    return None

def post():
    # Load content pool if exists
    content_file = Path(__file__).parent / "content" / "moltbook-posts.json"
    posts = POSTS
    if content_file.exists():
        with open(content_file) as f:
            pool = json.load(f)
            if pool: posts = pool

    p = random.choice(posts)
    submolt = p.get("submolt", "general")
    title = p.get("title", "")
    content = p.get("content", "")

    result = curl_json("POST", "/posts", {"submolt": submolt, "title": title, "content": content})
    
    if result.get("success"):
        print(f"{datetime.now(CST)}: ✅ Posted '{title[:40]}' to m/{submolt}")
        # Handle verification
        v = result.get("post", {}).get("verification", {})
        if v.get("verification_code"):
            answer = solve_challenge(v.get("challenge_text", ""))
            if answer:
                vr = curl_json("POST", "/verify", {"verification_code": v["verification_code"], "answer": answer})
                print(f"  Verified: {vr.get('success', False)}")
            else:
                print(f"  ⚠️ Could not solve challenge: {v.get('challenge_text','')[:80]}")
    else:
        print(f"{datetime.now(CST)}: ❌ {result.get('message', result)}")

if __name__ == "__main__":
    post()
