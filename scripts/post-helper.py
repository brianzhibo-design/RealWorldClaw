#!/usr/bin/env python3
"""Helper: post to RealWorldClaw API with proper JSON handling."""
import sys, json, os, subprocess, random, datetime

API = os.environ.get("RWC_API", "https://realworldclaw-api.fly.dev/api/v1")

try:
    import requests
except ImportError:
    # Fallback to curl
    import urllib.request, urllib.parse
    class FakeRequests:
        @staticmethod
        def post(url, json=None, headers=None, files=None):
            if files:
                # Use curl for file upload
                fpath = list(files.values())[0].name
                cmd = ["curl", "-sf", "-X", "POST", url, "-H", f"Authorization: {headers.get('Authorization','')}", "-F", f"file=@{fpath}"]
                r = subprocess.run(cmd, capture_output=True, text=True)
                class R:
                    status_code = 200 if r.returncode == 0 else 500
                    text = r.stdout
                    def json(self): return __import__('json').loads(self.text)
                return R()
            import json as jmod
            data = jmod.dumps(json).encode()
            req = urllib.request.Request(url, data=data, headers={**(headers or {}), "Content-Type": "application/json"})
            try:
                resp = urllib.request.urlopen(req)
                class R:
                    status_code = resp.status
                    text = resp.read().decode()
                    def json(self): return jmod.loads(self.text)
                return R()
            except urllib.error.HTTPError as e:
                class R:
                    status_code = e.code
                    text = e.read().decode()
                    def json(self): return jmod.loads(self.text)
                return R()
        @staticmethod
        def get(url, headers=None):
            req = urllib.request.Request(url, headers=headers or {})
            resp = urllib.request.urlopen(req)
            class R:
                status_code = resp.status
                text = resp.read().decode()
                def json(self): return __import__('json').loads(self.text)
            return R()
    requests = FakeRequests()

def login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password})
    return r.json()["access_token"]

def get_stats(token):
    h = {"Authorization": f"Bearer {token}"}
    return requests.get(f"{API}/stats", headers=h).json()

def get_top_posts(token, n=3):
    h = {"Authorization": f"Bearer {token}"}
    posts = requests.get(f"{API}/community/posts", headers=h).json().get("posts", [])
    return sorted(posts, key=lambda p: p.get("comment_count",0)*3 + p.get("upvotes",0)*2 + p.get("likes_count",0), reverse=True)[:n]

def upload_image(token, path):
    h = {"Authorization": f"Bearer {token}"}
    with open(path, "rb") as f:
        r = requests.post(f"{API}/files/upload", headers=h, files={"file": f})
        return r.json()["file_id"]

def post(token, title, content, post_type="discussion", images=None):
    h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    body = {"title": title, "content": content, "post_type": post_type}
    if images:
        body["images"] = images
    r = requests.post(f"{API}/community/posts", headers=h, json=body)
    if r.status_code == 200:
        print(f"✅ Posted: {title[:50]} [{post_type}] id={r.json().get('id','?')}")
    else:
        print(f"❌ Failed ({r.status_code}): {title[:50]} - {r.text[:100]}")
    return r

if __name__ == "__main__":
    # Can be used standalone for testing
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", default="xyy_ops@hagemi.com")
    parser.add_argument("--password", default="RWC-ops-2026!")
    parser.add_argument("--title", required=True)
    parser.add_argument("--content", required=True)
    parser.add_argument("--type", default="discussion")
    parser.add_argument("--image", default=None)
    args = parser.parse_args()
    
    token = login(args.email, args.password)
    images = []
    if args.image and os.path.isfile(args.image):
        fid = upload_image(token, args.image)
        images = [fid]
    post(token, args.title, args.content, args.type, images or None)
