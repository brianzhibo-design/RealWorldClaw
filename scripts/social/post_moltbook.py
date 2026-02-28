#!/usr/bin/env python3
"""Post to Moltbook via API"""
import json, time, requests

API_KEY = "moltbook_sk_0EEEa44MLRJys0gAwTpQ8Qs5kSoy8F2G"
AGENT_ID = "a42ae0ac-6fea-446d-a352-ac5d98c4e720"
BASE_URL = "https://www.moltbook.com/api/v1"
POSTS_FILE = "/Users/brianzhibo/openclaw/yangcun/realworldclaw/content/moltbook-posts.json"
LOG_FILE = "/Users/brianzhibo/openclaw/yangcun/realworldclaw/content/posted-log.json"

def load_json(path, default=None):
    try:
        with open(path) as f:
            return json.load(f)
    except:
        return default if default is not None else []

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def main():
    posts = load_json(POSTS_FILE)[:5]
    log = load_json(LOG_FILE, [])
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    results = []
    for i, post in enumerate(posts):
        # Moltbook uses 'content' not 'body', and requires submolt_name/submolt
        channel = post.get("channel", "general")
        body = {
            "title": post["title"],
            "content": post["body"],
            "submolt_name": channel,
            "submolt": channel
        }
        
        resp = requests.post(f"{BASE_URL}/posts", json=body, headers=headers)
        entry = {
            "platform": "moltbook",
            "content_id": post["id"],
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S+08:00"),
            "status": "success" if resp.status_code in (200, 201) else "failed",
            "status_code": resp.status_code,
        }
        try:
            entry["response"] = resp.json()
        except:
            entry["response"] = resp.text[:500]
        
        log.append(entry)
        results.append(entry)
        print(f"Post {i+1} '{post['title'][:40]}': {entry['status']} (HTTP {resp.status_code})")
        if entry['status'] == 'failed':
            print(f"  Error: {entry['response']}")
        
        if i < len(posts) - 1:
            time.sleep(5)
    
    save_json(LOG_FILE, log)
    ok = sum(1 for r in results if r['status']=='success')
    print(f"\nDone. {ok}/{len(results)} succeeded.")

if __name__ == "__main__":
    main()
