#!/usr/bin/env python3
"""RealWorldClaw X(Twitter) 自动发帖 — 从内容池读取"""
import tweepy, os, json, random
from datetime import datetime, timezone, timedelta
from pathlib import Path

env_path = Path(__file__).parent / ".env"
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if "=" in line and not line.startswith("#"):
            k, v = line.strip().split("=", 1)
            os.environ.setdefault(k, v)

CST = timezone(timedelta(hours=8))
CONTENT = Path(__file__).parent / "content" / "x-tweets.json"
STATE = Path("/tmp/rwc-x-posted.json")

def load_state():
    try: return json.loads(STATE.read_text())
    except: return {"posted": []}

def save_state(state):
    state["posted"] = state["posted"][-50:]
    STATE.write_text(json.dumps(state))

def get_client():
    return tweepy.Client(
        consumer_key=os.environ["X_CONSUMER_KEY"],
        consumer_secret=os.environ["X_CONSUMER_SECRET"],
        access_token=os.environ["X_ACCESS_TOKEN"],
        access_token_secret=os.environ["X_ACCESS_TOKEN_SECRET"],
    )

def post():
    posts = json.loads(CONTENT.read_text())
    state = load_state()
    available = [p for p in posts if p["id"] not in state["posted"]]
    if not available:
        state["posted"] = []
        available = posts
    
    post = random.choice(available)
    text = post["content"]
    
    client = get_client()
    resp = client.create_tweet(text=text)
    state["posted"].append(post["id"])
    save_state(state)
    print(f"{datetime.now(CST)}: ✅ [{post['type']}] Tweet {resp.data['id']}")
    print(f"  {text[:80]}...")

if __name__ == "__main__":
    post()
