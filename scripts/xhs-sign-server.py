#!/usr/bin/env python3
"""小红书签名服务"""
import time, json, os, threading
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from playwright.sync_api import sync_playwright

# Load cookie
env_path = Path(__file__).parent / ".env"
COOKIE = ""
A1 = ""
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if line.startswith("XHS_COOKIE="):
            COOKIE = line.split("=", 1)[1]
for pair in COOKIE.split("; "):
    if pair.startswith("a1="):
        A1 = pair.split("=", 1)[1]

print(f"a1 = {A1[:10]}...")
print("Starting playwright...")
playwright = sync_playwright().start()
browser = playwright.chromium.launch(headless=True)
context = browser.new_context()

cookies = []
for pair in COOKIE.split("; "):
    if "=" in pair:
        n, v = pair.split("=", 1)
        cookies.append({"name": n, "value": v, "domain": ".xiaohongshu.com", "path": "/"})
context.add_cookies(cookies)
page = context.new_page()
page.goto("https://www.xiaohongshu.com")
time.sleep(3)
page.reload()
time.sleep(2)
print(f"_webmsxyw: {page.evaluate('typeof window._webmsxyw')}")
print("Sign server ready on :5005")

lock = threading.Lock()

class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args): pass
    
    def do_GET(self):
        if self.path == "/health":
            self._json({"status": "ok", "a1": A1[:10]})
        elif self.path == "/a1":
            self._json({"a1": A1})
        else:
            self._json({"error": "not found"}, 404)
    
    def do_POST(self):
        if self.path == "/sign":
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))
            uri = body.get("uri", "")
            data = body.get("data", "")
            try:
                with lock:
                    result = page.evaluate("([url, data]) => window._webmsxyw(url, data)", [uri, data])
                self._json({"x-s": result["X-s"], "x-t": str(result["X-t"])})
            except Exception as e:
                self._json({"error": str(e)}, 500)
        else:
            self._json({"error": "not found"}, 404)
    
    def _json(self, data, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

HTTPServer(("127.0.0.1", 5005), Handler).serve_forever()
