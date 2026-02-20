#!/usr/bin/env python3
"""
RealWorldClaw manifest.yaml 验证器 💪
作者：沸羊羊（基建负责人）

用法：python validate.py /path/to/component/
"""

import argparse
import json
import os
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator, ValidationError


# ── 星级计算规则 ──
# completeness 中每个 true 得 1 分，满分 5 分
# 5分 = ⭐⭐⭐⭐⭐, 4分 = ⭐⭐⭐⭐, 3分 = ⭐⭐⭐, 2分 = ⭐⭐, 1分 = ⭐, 0分 = ☆
COMPLETENESS_FIELDS = ["has_models", "has_wiring", "has_firmware", "has_agent", "has_docs"]
STAR_FULL = "⭐"
STAR_EMPTY = "☆"


def load_schema() -> dict:
    schema_path = Path(__file__).parent / "schema.json"
    with open(schema_path) as f:
        return json.load(f)


def load_manifest(component_dir: Path) -> dict:
    manifest_path = component_dir / "manifest.yaml"
    if not manifest_path.exists():
        manifest_path = component_dir / "manifest.yml"
    if not manifest_path.exists():
        raise FileNotFoundError(f"manifest.yaml 未找到: {component_dir}")
    with open(manifest_path) as f:
        return yaml.safe_load(f)


def validate_schema(manifest: dict, schema: dict) -> list[str]:
    """用 JSON Schema 验证 manifest，返回错误列表"""
    validator = Draft202012Validator(schema)
    errors = []
    for err in sorted(validator.iter_errors(manifest), key=lambda e: list(e.path)):
        path = ".".join(str(p) for p in err.absolute_path) or "(root)"
        errors.append(f"[Schema] {path}: {err.message}")
    return errors


def check_stl_files(manifest: dict, component_dir: Path) -> tuple[list[str], list[str]]:
    """检查 printing.files 中引用的 STL/3MF/STEP 是否存在"""
    errors = []
    warnings = []
    printing = manifest.get("printing", {})
    files = printing.get("files", [])
    for entry in files:
        fpath = entry.get("path", "")
        full = component_dir / fpath
        if not full.exists():
            errors.append(f"[文件缺失] 模型文件不存在: {fpath}")
        else:
            size = full.stat().st_size
            if size < 100:
                warnings.append(f"[警告] 模型文件可能无效（太小 {size}B）: {fpath}")
    return errors, warnings


def check_referenced_files(manifest: dict, component_dir: Path) -> tuple[list[str], list[str]]:
    """检查其他可能引用的文件"""
    errors = []
    warnings = []

    # 检查 README
    if not (component_dir / "README.md").exists() and not (component_dir / "readme.md").exists():
        warnings.append("[警告] 缺少 README.md")

    # 检查 firmware 目录（如果声明了 has_firmware）
    completeness = manifest.get("completeness", {})
    if completeness.get("has_firmware") and not (component_dir / "firmware").exists() and not (component_dir / "src").exists():
        warnings.append("[警告] 声明 has_firmware=true 但未找到 firmware/ 或 src/ 目录")

    # 检查 wiring 图
    if completeness.get("has_wiring"):
        wiring_found = any(
            (component_dir / d).exists()
            for d in ["wiring", "docs/wiring", "wiring.png", "wiring.svg", "docs/wiring.png"]
        )
        if not wiring_found:
            warnings.append("[警告] 声明 has_wiring=true 但未找到接线图文件")

    return errors, warnings


def calculate_stars(manifest: dict) -> tuple[int, str]:
    """根据 completeness 计算星级"""
    completeness = manifest.get("completeness", {})
    score = sum(1 for f in COMPLETENESS_FIELDS if completeness.get(f, False))
    stars = STAR_FULL * score + STAR_EMPTY * (5 - score)
    return score, stars


def print_report(
    manifest: dict,
    component_dir: Path,
    schema_errors: list[str],
    file_errors: list[str],
    file_warnings: list[str],
    ref_errors: list[str],
    ref_warnings: list[str],
    score: int,
    stars: str,
):
    """输出详细验证报告"""
    component_id = manifest.get("id", "unknown")
    version = manifest.get("version", "?")
    display = manifest.get("display_name", {}).get("zh") or manifest.get("display_name", {}).get("en", "?")

    all_errors = schema_errors + file_errors + ref_errors
    all_warnings = file_warnings + ref_warnings
    passed = len(all_errors) == 0

    print("=" * 60)
    print(f"  RealWorldClaw Manifest 验证报告 💪")
    print("=" * 60)
    print(f"  组件：{display} ({component_id} v{version})")
    print(f"  路径：{component_dir}")
    print(f"  星级：{stars} ({score}/5)")
    print(f"  结果：{'✅ 通过' if passed else '❌ 未通过'}")
    print("-" * 60)

    if schema_errors:
        print(f"\n🔴 Schema 错误 ({len(schema_errors)}):")
        for e in schema_errors:
            print(f"  • {e}")

    if file_errors:
        print(f"\n🔴 文件错误 ({len(file_errors)}):")
        for e in file_errors:
            print(f"  • {e}")

    if ref_errors:
        print(f"\n🔴 引用错误 ({len(ref_errors)}):")
        for e in ref_errors:
            print(f"  • {e}")

    if all_warnings:
        print(f"\n🟡 警告 ({len(all_warnings)}):")
        for w in all_warnings:
            print(f"  • {w}")

    if passed and not all_warnings:
        print("\n🟢 完美！没有错误或警告。")
    elif passed:
        print(f"\n🟢 验证通过，但有 {len(all_warnings)} 个警告。")

    # 星级详情
    print(f"\n📊 完整度明细：")
    completeness = manifest.get("completeness", {})
    for f in COMPLETENESS_FIELDS:
        val = completeness.get(f, False)
        icon = "✅" if val else "❌"
        print(f"  {icon} {f}")

    print("=" * 60)
    return passed


def main():
    parser = argparse.ArgumentParser(description="RealWorldClaw manifest.yaml 验证器 💪")
    parser.add_argument("component_dir", help="组件包目录路径")
    parser.add_argument("--json", action="store_true", help="输出 JSON 格式")
    parser.add_argument("--strict", action="store_true", help="警告也视为错误")
    args = parser.parse_args()

    component_dir = Path(args.component_dir).resolve()
    if not component_dir.is_dir():
        print(f"❌ 目录不存在: {component_dir}", file=sys.stderr)
        sys.exit(1)

    # 加载
    schema = load_schema()
    try:
        manifest = load_manifest(component_dir)
    except FileNotFoundError as e:
        print(f"❌ {e}", file=sys.stderr)
        sys.exit(1)
    except yaml.YAMLError as e:
        print(f"❌ YAML 解析错误: {e}", file=sys.stderr)
        sys.exit(1)

    # 验证
    schema_errors = validate_schema(manifest, schema)
    file_errors, file_warnings = check_stl_files(manifest, component_dir)
    ref_errors, ref_warnings = check_referenced_files(manifest, component_dir)
    score, stars = calculate_stars(manifest)

    if args.json:
        result = {
            "component_id": manifest.get("id", "unknown"),
            "version": manifest.get("version", "?"),
            "passed": len(schema_errors + file_errors + ref_errors) == 0,
            "stars": score,
            "stars_display": stars,
            "errors": schema_errors + file_errors + ref_errors,
            "warnings": file_warnings + ref_warnings,
        }
        if args.strict:
            result["passed"] = result["passed"] and len(result["warnings"]) == 0
        print(json.dumps(result, ensure_ascii=False, indent=2))
        sys.exit(0 if result["passed"] else 1)

    passed = print_report(
        manifest, component_dir,
        schema_errors, file_errors, file_warnings,
        ref_errors, ref_warnings, score, stars,
    )

    if args.strict and (file_warnings or ref_warnings):
        passed = False

    sys.exit(0 if passed else 1)


if __name__ == "__main__":
    main()
