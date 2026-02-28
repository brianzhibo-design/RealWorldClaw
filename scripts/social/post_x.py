#!/usr/bin/env python3
"""Post tweets to X/Twitter via OAuth 1.0a"""
import json, time
from requests_oauthlib import OAuth1Session

CONSUMER_KEY = "bxteaDL5FvGvJkcYBMCMUJNOW"
CONSUMER_SECRET = "w55WwYRNPcgsiuB290xuagzjH4cS0PBcmVxhs5Tky0MdYyR2FK"
ACCESS_TOKEN = "2026171284976173058-xQeV6x9BBuXkS166KhKfjFoN4QQQNk"
ACCESS_SECRET = "N7KVP9NDLCvAiiruap1JCimlOytoYenB9qnknG0ayurDW"

TWEETS_FILE = "/Users/brianzhibo/openclaw/yangcun/realworldclaw/content/x-tweets.json"
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
    tweets = load_json(TWEETS_FILE)[:2]
    log = load_json(LOG_FILE, [])
    
    oauth = OAuth1Session(CONSUMER_KEY, CONSUMER_SECRET, ACCESS_TOKEN, ACCESS_SECRET)
    
    results = []
    for i, tweet in enumerate(tweets):
        text = tweet["text"]
        resp = oauth.post("https://api.twitter.com/2/tweets", json={"text": text})
        entry = {
            "platform": "x",
            "content_id": tweet["id"],
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S+08:00"),
            "status": "success" if resp.status_code in (200, 201) else "failed",
            "status_code": resp.status_code,
            "response": resp.json() if resp.headers.get("content-type","").startswith("application/json") else resp.text[:500]
        }
        log.append(entry)
        results.append(entry)
        print(f"Tweet {i+1}: {entry['status']} (HTTP {resp.status_code})")
        if resp.status_code not in (200, 201):
            print(f"  Error: {entry['response']}")
        if i < len(tweets) - 1:
            print("Waiting 30s...")
            time.sleep(30)
    
    save_json(LOG_FILE, log)
    print(f"\nDone. {sum(1 for r in results if r['status']=='success')}/{len(results)} succeeded.")

if __name__ == "__main__":
    main()
