#!/usr/bin/env python3
"""RealWorldClaw CLI — rwc 命令行工具"""

from __future__ import annotations

import argparse
import subprocess
import sys


def cmd_serve(args):
    """启动API服务"""
    print(f"🐾 Starting RealWorldClaw API on port {args.port}...")
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "api.main:app",
        "--host", args.host,
        "--port", str(args.port),
        "--reload" if args.reload else "--no-access-log",
    ], cwd=str(__import__("pathlib").Path(__file__).parent.parent))


def cmd_printer_scan(args):
    """扫描局域网打印机"""
    print("🔍 Scanning for 3D printers on local network...")
    print()
    # MVP: 展示框架，实际扫描待实现
    printers = [
        {"name": "Bambu X1C (demo)", "protocol": "bambu-mqtt", "ip": "192.168.1.100", "status": "simulated"},
    ]
    for p in printers:
        print(f"  🖨️  {p['name']}")
        print(f"     Protocol: {p['protocol']}")
        print(f"     IP: {p['ip']}")
        print(f"     Status: {p['status']}")
        print()
    print(f"Found {len(printers)} printer(s). (MVP: simulated results)")
    print("Tip: Real scanning coming in Phase 2 with printer-drivers module.")


def cmd_printer_add(args):
    """添加打印机"""
    print(f"➕ Adding printer: {args.name}")
    print(f"   Model: {args.model}")
    print(f"   IP: {args.ip}")
    print("   ✅ Printer registered (MVP: local config only)")
    print("   Tip: Full printer management coming in Phase 2.")


def cmd_validate(args):
    """验证组件包"""
    import pathlib
    path = pathlib.Path(args.path)

    print(f"🔍 Validating component package: {path}")
    print()

    checks = []

    # Check manifest
    manifest = path / "manifest.yaml"
    if manifest.exists():
        checks.append(("manifest.yaml exists", True))
    else:
        manifest = path / "manifest.yml"
        checks.append(("manifest.yaml exists", manifest.exists()))

    # Check models directory
    models_dir = path / "models"
    if models_dir.is_dir():
        stl_files = list(models_dir.glob("*.stl"))
        checks.append(("models/ directory exists", True))
        checks.append((f"STL files found ({len(stl_files)})", len(stl_files) > 0))
    else:
        checks.append(("models/ directory exists", False))

    # Check firmware
    firmware_dir = path / "firmware"
    checks.append(("firmware/ directory exists", firmware_dir.is_dir()))

    # Check README
    checks.append(("README.md exists", (path / "README.md").exists()))

    # Check LICENSE
    checks.append(("LICENSE exists", (path / "LICENSE").exists() or (path / "LICENSE.md").exists()))

    # Print results
    passed = 0
    for name, ok in checks:
        icon = "✅" if ok else "❌"
        print(f"  {icon} {name}")
        if ok:
            passed += 1

    print()
    print(f"Result: {passed}/{len(checks)} checks passed")
    if passed == len(checks):
        print("🎉 Component package is valid!")
    else:
        print("⚠️  Some checks failed. Please fix issues before uploading.")
    return 0 if passed == len(checks) else 1


def main():
    parser = argparse.ArgumentParser(
        prog="rwc",
        description="🐾 RealWorldClaw CLI — Distributed manufacturing network",
    )
    subparsers = parser.add_subparsers(dest="command")

    # rwc serve
    serve_p = subparsers.add_parser("serve", help="Start the API server")
    serve_p.add_argument("--host", default="0.0.0.0")
    serve_p.add_argument("--port", type=int, default=8000)
    serve_p.add_argument("--reload", action="store_true", default=True)

    # rwc printer
    printer_p = subparsers.add_parser("printer", help="Printer management")
    printer_sub = printer_p.add_subparsers(dest="printer_cmd")

    printer_sub.add_parser("scan", help="Scan for printers on LAN")

    add_p = printer_sub.add_parser("add", help="Add a printer")
    add_p.add_argument("--name", required=True)
    add_p.add_argument("--model", required=True)
    add_p.add_argument("--ip", required=True)

    # rwc validate
    val_p = subparsers.add_parser("validate", help="Validate a component package")
    val_p.add_argument("path", help="Path to component directory")

    args = parser.parse_args()

    if args.command == "serve":
        cmd_serve(args)
    elif args.command == "printer":
        if args.printer_cmd == "scan":
            cmd_printer_scan(args)
        elif args.printer_cmd == "add":
            cmd_printer_add(args)
        else:
            printer_p.print_help()
    elif args.command == "validate":
        sys.exit(cmd_validate(args))
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
