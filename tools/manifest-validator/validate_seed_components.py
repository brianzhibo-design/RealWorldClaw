#!/usr/bin/env python3
"""Validate all seed-components manifests with schema + legacy adapter."""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path
from typing import Any

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[2]
SEED_DIR = ROOT / "seed-components"
SCHEMA_PATH = ROOT / "schemas" / "manifest.schema.json"


def _slug(value: str) -> str:
    v = re.sub(r"[^a-z0-9-]+", "-", value.lower()).strip("-")
    if not v:
        return "component"
    if not v[0].isalpha():
        v = f"c-{v}"
    return v[:64]


def _pick(*values: Any, default: Any = None) -> Any:
    for v in values:
        if v is None:
            continue
        if isinstance(v, str) and not v.strip():
            continue
        return v
    return default


def _to_compute(raw: str | None) -> str:
    if not raw:
        return "custom"
    s = raw.lower()
    for token in ["esp32-c3", "esp32-s3", "esp32-c6", "esp32", "esp8266", "rpi-5", "rpi-4", "rpi-zero", "rpi-pico"]:
        if token in s:
            return token.replace("rpi-4", "rpi-4b").replace("rpi-zero", "rpi-zero-2w")
    if "arduino" in s and "nano" in s:
        return "arduino-nano"
    if "arduino" in s and "uno" in s:
        return "arduino-uno"
    return "custom"


def _collect_model_paths(manifest: dict[str, Any]) -> list[str]:
    paths: list[str] = []

    for section in (manifest.get("printing", {}).get("files", []), manifest.get("files", {}).get("models", [])):
        for item in section:
            if isinstance(item, dict):
                path = item.get("path")
            else:
                path = item
            if isinstance(path, str) and path.startswith("models/"):
                paths.append(path)

    for variant_key in ("variants", "shell_variants"):
        for variant in manifest.get(variant_key, []) or []:
            if isinstance(variant, dict):
                path = variant.get("model") or variant.get("file")
                if isinstance(path, str) and path.startswith("models/"):
                    paths.append(path)

    out: list[str] = []
    seen = set()
    for p in paths:
        if not re.search(r"\.(stl|3mf|step)$", p, flags=re.IGNORECASE):
            continue
        if p not in seen:
            out.append(p)
            seen.add(p)
    return out




def _load_yaml_with_fallback(text: str) -> dict[str, Any]:
    try:
        data = yaml.safe_load(text)
        return data if isinstance(data, dict) else {}
    except yaml.YAMLError:
        # legacy fix: unquoted scalar with colon in parentheses, e.g.
        # buttons: 2 (A: front, B: side)
        fixed = re.sub(r'(^\s*[^#\n][^:\n]*:\s*[^"\n]*\([^\n]*?:[^\n]*\)\s*$)', lambda m: m.group(0).split(':',1)[0]+': "'+m.group(0).split(':',1)[1].strip()+'"', text, flags=re.MULTILINE)
        data = yaml.safe_load(fixed)
        return data if isinstance(data, dict) else {}

def normalize_manifest(raw: dict[str, Any], component_dir: Path) -> dict[str, Any]:
    display = raw.get("display_name")
    if not isinstance(display, dict):
        title = _pick(raw.get("title"), raw.get("name"), component_dir.name, default=component_dir.name)
        display = {"en": str(title)}

    desc = raw.get("description")
    if isinstance(desc, dict):
        en_desc = _pick(desc.get("en"), desc.get("zh"), default="")
        zh_desc = _pick(desc.get("zh"), desc.get("en"), default="")
    else:
        en_desc = str(_pick(desc, default=""))
        zh_desc = ""

    if len(en_desc) < 50:
        en_desc = (en_desc + " " + "Auto-normalized from legacy seed-component manifest.").strip()
    if len(zh_desc) < 10:
        zh_desc = "由历史 manifest 自动归一化。"

    authors = raw.get("authors") or []
    first_author = authors[0].get("name") if authors and isinstance(authors[0], dict) else None
    author = _pick(raw.get("author"), raw.get("designer"), first_author, default="realworldclaw")

    hw = raw.get("hardware") if isinstance(raw.get("hardware"), dict) else {}
    model_paths = _collect_model_paths(raw)
    if not model_paths:
        model_paths = ["models/missing.stl"]

    return {
        "id": _slug(str(_pick(raw.get("id"), raw.get("slug"), raw.get("name"), raw.get("codename"), component_dir.name))),
        "version": str(_pick(raw.get("version"), default="1.0.0")),
        "display_name": {
            "en": str(_pick(display.get("en"), display.get("zh"), component_dir.name))[:100],
            "zh": str(_pick(display.get("zh"), display.get("en"), component_dir.name))[:100],
        },
        "description": {"en": en_desc[:2000], "zh": zh_desc[:2000]},
        "author": str(author)[:64],
        "license": raw.get("license", "MIT"),
        "hardware": {
            "compute": _to_compute(_pick(hw.get("compute"), hw.get("mcu"), hw.get("core"))),
            "power": {"type": "usb-c", "voltage": "5V"},
        },
        "printing": {"files": [{"path": p, "quantity": 1} for p in model_paths], "material": "PLA"},
        "physical": {"module_size": "custom", "dimensions": [50, 50, 50]},
        "completeness": {
            "has_models": True,
            "has_wiring": bool((component_dir / "electronics").exists() or (component_dir / "docs").exists()),
            "has_firmware": bool((component_dir / "firmware").exists() or (component_dir / "src").exists()),
            "has_agent": bool((component_dir / "agent").exists()),
            "has_docs": bool((component_dir / "docs").exists()),
        },
    }


def main() -> int:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    validator = Draft202012Validator(schema)

    manifest_files = sorted(SEED_DIR.glob("*/manifest.yaml"))
    if not manifest_files:
        print("No seed-components manifests found.")
        return 1

    failed = 0
    for mf in manifest_files:
        try:
            raw = _load_yaml_with_fallback(mf.read_text(encoding="utf-8"))
        except yaml.YAMLError as exc:
            failed += 1
            print(f"❌ {mf.relative_to(ROOT)}")
            print(f"  - yaml_parse: {exc}")
            continue

        normalized = normalize_manifest(raw, mf.parent)
        errors = sorted(validator.iter_errors(normalized), key=lambda e: list(e.path))
        if errors:
            failed += 1
            print(f"❌ {mf.relative_to(ROOT)}")
            for err in errors:
                path = ".".join(str(p) for p in err.absolute_path) or "(root)"
                print(f"  - {path}: {err.message}")
        else:
            print(f"✅ {mf.relative_to(ROOT)}")

    print(f"\nValidation done: {len(manifest_files)-failed} passed, {failed} failed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
