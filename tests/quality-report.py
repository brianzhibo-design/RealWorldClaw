#!/usr/bin/env python3
"""RealWorldClaw Quality Report — code stats, test count, docs check, dead links."""

import json
import os
import re
import subprocess
import sys
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import requests

ROOT = Path(__file__).resolve().parent.parent
TIMEOUT = 10

LANG_EXTENSIONS = {
    ".py": "Python",
    ".ts": "TypeScript",
    ".tsx": "TypeScript (JSX)",
    ".js": "JavaScript",
    ".jsx": "JavaScript (JSX)",
    ".html": "HTML",
    ".css": "CSS",
    ".scss": "SCSS",
    ".md": "Markdown",
    ".yml": "YAML",
    ".yaml": "YAML",
    ".json": "JSON",
    ".toml": "TOML",
    ".c": "C",
    ".h": "C Header",
    ".cpp": "C++",
    ".ino": "Arduino",
    ".sh": "Shell",
}

SKIP_DIRS = {".git", "node_modules", "__pycache__", ".next", "dist", "build", ".venv", "venv", ".egg-info"}


def count_lines_by_lang() -> dict[str, dict]:
    stats: dict[str, dict] = {}
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            ext = os.path.splitext(f)[1]
            lang = LANG_EXTENSIONS.get(ext)
            if not lang:
                continue
            fp = os.path.join(dirpath, f)
            try:
                lines = sum(1 for _ in open(fp, "r", errors="ignore"))
            except Exception:
                continue
            if lang not in stats:
                stats[lang] = {"files": 0, "lines": 0}
            stats[lang]["files"] += 1
            stats[lang]["lines"] += lines
    return dict(sorted(stats.items(), key=lambda x: -x[1]["lines"]))


def count_tests() -> dict:
    result = {"pytest_files": 0, "test_functions": 0, "test_classes": 0}
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            if not f.endswith(".py"):
                continue
            fp = os.path.join(dirpath, f)
            if f.startswith("test_") or f.endswith("_test.py"):
                result["pytest_files"] += 1
            try:
                content = open(fp, "r", errors="ignore").read()
            except Exception:
                continue
            result["test_functions"] += len(re.findall(r"^\s*def test_", content, re.MULTILINE))
            result["test_classes"] += len(re.findall(r"^\s*class Test", content, re.MULTILINE))
    return result


def check_docs() -> dict:
    expected = ["README.md", "CONTRIBUTING.md", "LICENSE", "CHANGELOG.md", "CODE_OF_CONDUCT.md"]
    found = [f for f in expected if (ROOT / f).exists()]
    missing = [f for f in expected if f not in found]
    return {"expected": expected, "found": found, "missing": missing}


def extract_urls_from_md() -> list[tuple[str, str]]:
    urls = []
    url_re = re.compile(r'https?://[^\s\)\]>"\']+')
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            if not f.endswith(".md"):
                continue
            fp = os.path.join(dirpath, f)
            try:
                content = open(fp, "r", errors="ignore").read()
            except Exception:
                continue
            for m in url_re.finditer(content):
                urls.append((m.group(0).rstrip(".,;:)"), os.path.relpath(fp, ROOT)))
    return urls


def check_dead_links(urls: list[tuple[str, str]], max_workers: int = 8) -> list[dict]:
    seen = set()
    unique = []
    for url, source in urls:
        if url not in seen:
            seen.add(url)
            unique.append((url, source))

    dead = []

    def _check(item):
        url, source = item
        try:
            r = requests.head(url, timeout=TIMEOUT, allow_redirects=True)
            if r.status_code >= 400:
                return {"url": url, "source": source, "status": r.status_code}
        except Exception as e:
            return {"url": url, "source": source, "error": str(e)[:100]}
        return None

    with ThreadPoolExecutor(max_workers=max_workers) as pool:
        futures = {pool.submit(_check, item): item for item in unique[:200]}  # cap at 200
        for fut in as_completed(futures):
            result = fut.result()
            if result:
                dead.append(result)

    return dead


def main():
    print("📊 RealWorldClaw Quality Report")
    print("=" * 50)

    report = {}

    # 1. Code stats
    report["code_stats"] = count_lines_by_lang()
    total_lines = sum(v["lines"] for v in report["code_stats"].values())
    total_files = sum(v["files"] for v in report["code_stats"].values())
    print(f"\n📝 Code: {total_files} files, {total_lines:,} lines")
    for lang, s in report["code_stats"].items():
        print(f"   {lang}: {s['files']} files, {s['lines']:,} lines")

    # 2. Tests
    report["tests"] = count_tests()
    print(f"\n🧪 Tests: {report['tests']['pytest_files']} test files, "
          f"{report['tests']['test_functions']} test functions, "
          f"{report['tests']['test_classes']} test classes")

    # 3. Docs
    report["docs"] = check_docs()
    print(f"\n📚 Docs: {len(report['docs']['found'])}/{len(report['docs']['expected'])} present")
    if report["docs"]["missing"]:
        print(f"   Missing: {', '.join(report['docs']['missing'])}")

    # 4. Dead links
    print("\n🔗 Checking links in .md files (up to 200)...")
    urls = extract_urls_from_md()
    report["total_urls_found"] = len(urls)
    dead = check_dead_links(urls)
    report["dead_links"] = dead
    print(f"   Found {len(urls)} URLs, {len(dead)} dead/broken")
    for d in dead[:10]:
        print(f"   ❌ {d['url']} (in {d.get('source', '?')})")

    # Write JSON
    out = ROOT / "quality-report.json"
    with open(out, "w") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f"\n✅ Report saved to {out}")


if __name__ == "__main__":
    main()
