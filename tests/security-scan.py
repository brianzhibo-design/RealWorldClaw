#!/usr/bin/env python3
"""RealWorldClaw Security Scanner — .env protection, hardcoded secrets, dependency vulns."""

import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_DIRS = {".git", "node_modules", "__pycache__", ".next", "dist", "build", ".venv", "venv"}

ISSUES: list[dict] = []


def issue(severity: str, category: str, message: str, file: str = ""):
    ISSUES.append({"severity": severity, "category": category, "message": message, "file": file})


# ── 1. Check .env in .gitignore ──────────────────────────────────

def check_env_gitignore():
    gitignore = ROOT / ".gitignore"
    if not gitignore.exists():
        issue("HIGH", "gitignore", ".gitignore not found — .env files may be committed")
        return

    content = gitignore.read_text()
    patterns = [".env", "*.env", ".env.*"]
    found = any(p in content for p in patterns)
    if found:
        print("✅ .env is in .gitignore")
    else:
        issue("HIGH", "gitignore", ".env is NOT in .gitignore — secrets may be committed")
        print("❌ .env is NOT in .gitignore")

    # Check if any .env files are tracked
    try:
        tracked = subprocess.check_output(
            ["git", "ls-files", "--cached"], cwd=ROOT, text=True, stderr=subprocess.DEVNULL
        )
        for line in tracked.strip().splitlines():
            if line.endswith(".env") or "/.env" in line:
                issue("CRITICAL", "gitignore", f".env file is tracked in git: {line}", line)
                print(f"🚨 .env file tracked: {line}")
    except Exception:
        pass


# ── 2. Hardcoded secrets ─────────────────────────────────────────

SECRET_PATTERNS = [
    (r'(?:api[_-]?key|apikey)\s*[:=]\s*["\']([A-Za-z0-9_\-]{20,})["\']', "API key"),
    (r'(?:secret[_-]?key|SECRET_KEY)\s*[:=]\s*["\']([^"\']{8,})["\']', "Secret key"),
    (r'(?:password|passwd|pwd)\s*[:=]\s*["\']([^"\']{6,})["\']', "Password"),
    (r'(?:token)\s*[:=]\s*["\']([A-Za-z0-9_\-\.]{20,})["\']', "Token"),
    (r'(?:aws_access_key_id)\s*[:=]\s*["\']?(AKIA[A-Z0-9]{16})', "AWS Key"),
    (r'(?:private[_-]?key)\s*[:=]\s*["\']([^"\']{20,})["\']', "Private key"),
    (r'sk-[A-Za-z0-9]{20,}', "OpenAI key"),
    (r'ghp_[A-Za-z0-9]{36,}', "GitHub PAT"),
]

SAFE_FILES = {".env.example", ".env.sample", ".env.template", "requirements.txt", "package-lock.json", "poetry.lock"}


def check_hardcoded_secrets():
    print("\n🔍 Scanning for hardcoded secrets...")
    count = 0
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for f in filenames:
            if f in SAFE_FILES or f.endswith((".lock", ".svg", ".png", ".jpg", ".ico")):
                continue
            fp = os.path.join(dirpath, f)
            rel = os.path.relpath(fp, ROOT)
            try:
                content = open(fp, "r", errors="ignore").read()
            except Exception:
                continue
            for pattern, label in SECRET_PATTERNS:
                for m in re.finditer(pattern, content, re.IGNORECASE):
                    # Skip test files and examples
                    if "test" in rel.lower() or "example" in rel.lower() or "mock" in rel.lower():
                        continue
                    issue("HIGH", "hardcoded_secret", f"Possible {label} found", rel)
                    count += 1
    print(f"   Found {count} potential hardcoded secrets")


# ── 3. Dependency vulnerabilities ────────────────────────────────

def check_pip_audit():
    print("\n🔍 Checking Python dependencies...")
    req = ROOT / "platform" / "requirements.txt"
    if not req.exists():
        print("   ⚠️  No platform/requirements.txt found")
        return

    try:
        result = subprocess.run(
            [sys.executable, "-m", "pip_audit", "-r", str(req), "--format", "json"],
            capture_output=True, text=True, timeout=60,
        )
        if result.returncode == 0:
            vulns = __import__("json").loads(result.stdout) if result.stdout.strip() else []
            if not vulns:
                print("   ✅ No known vulnerabilities")
            else:
                for v in vulns:
                    issue("HIGH", "dependency", f"{v.get('name', '?')} {v.get('version', '?')}: {v.get('id', '?')}")
                print(f"   ❌ {len(vulns)} vulnerabilities found")
        else:
            print(f"   ⚠️  pip-audit exited {result.returncode}: {result.stderr[:200]}")
    except FileNotFoundError:
        print("   ⚠️  pip-audit not installed (pip install pip-audit)")
    except Exception as e:
        print(f"   ⚠️  pip-audit error: {e}")


def check_npm_audit():
    print("\n🔍 Checking Node.js dependencies...")
    for subdir in ["frontend", "landing", "docs-site"]:
        pkg = ROOT / subdir / "package.json"
        if not pkg.exists():
            continue
        try:
            result = subprocess.run(
                ["npm", "audit", "--json"],
                cwd=str(ROOT / subdir), capture_output=True, text=True, timeout=60,
            )
            data = __import__("json").loads(result.stdout) if result.stdout.strip() else {}
            total = data.get("metadata", {}).get("vulnerabilities", {})
            high = total.get("high", 0) + total.get("critical", 0)
            if high:
                issue("HIGH", "dependency", f"{subdir}: {high} high/critical npm vulnerabilities")
                print(f"   ❌ {subdir}: {high} high/critical vulns")
            else:
                print(f"   ✅ {subdir}: no high/critical vulns")
        except Exception as e:
            print(f"   ⚠️  {subdir} npm audit error: {e}")


# ── Main ─────────────────────────────────────────────────────────

def main():
    print("🔒 RealWorldClaw Security Scan")
    print("=" * 50)

    check_env_gitignore()
    check_hardcoded_secrets()
    check_pip_audit()
    check_npm_audit()

    print("\n" + "=" * 50)
    print(f"Total issues: {len(ISSUES)}")
    critical = [i for i in ISSUES if i["severity"] == "CRITICAL"]
    high = [i for i in ISSUES if i["severity"] == "HIGH"]
    if critical:
        print(f"🚨 CRITICAL: {len(critical)}")
        for i in critical:
            print(f"   {i['category']}: {i['message']}")
    if high:
        print(f"⚠️  HIGH: {len(high)}")
        for i in high:
            print(f"   {i['category']}: {i['message']}")
    if not ISSUES:
        print("✅ No issues found!")

    # Write JSON
    import json
    out = ROOT / "security-scan-results.json"
    with open(out, "w") as f:
        json.dump(ISSUES, f, indent=2)
    print(f"\nResults saved to {out}")

    sys.exit(1 if critical else 0)


if __name__ == "__main__":
    main()
