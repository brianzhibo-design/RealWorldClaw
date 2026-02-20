"""
Manifest 验证服务 — 封装 tools/manifest-validator 的验证逻辑
用于组件上传时自动验证 manifest.yaml

沸羊羊💪 基建出品
"""

import json
import logging
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional

import yaml
from jsonschema import Draft202012Validator

logger = logging.getLogger(__name__)

# Schema 路径（相对于项目根目录）
_SCHEMA_PATH = Path(__file__).resolve().parents[3] / "tools" / "manifest-validator" / "schema.json"

COMPLETENESS_FIELDS = ["has_models", "has_wiring", "has_firmware", "has_agent", "has_docs"]


@dataclass
class ValidationResult:
    """验证结果"""
    passed: bool
    component_id: str = "unknown"
    version: str = "?"
    stars: int = 0
    stars_display: str = "☆☆☆☆☆"
    errors: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "passed": self.passed,
            "component_id": self.component_id,
            "version": self.version,
            "stars": self.stars,
            "stars_display": self.stars_display,
            "errors": self.errors,
            "warnings": self.warnings,
        }


class ManifestValidator:
    """
    Manifest 验证器，可在 API 中直接调用。

    用法：
        validator = ManifestValidator()
        result = validator.validate_component("/path/to/component/")
        if not result.passed:
            raise HTTPException(400, detail=result.errors)
    """

    def __init__(self, schema_path: Optional[Path] = None):
        path = schema_path or _SCHEMA_PATH
        with open(path) as f:
            self._schema = json.load(f)
        self._json_validator = Draft202012Validator(self._schema)

    def validate_manifest_dict(self, manifest: dict) -> ValidationResult:
        """验证 manifest 字典（不检查文件系统）"""
        errors = []
        for err in sorted(self._json_validator.iter_errors(manifest), key=lambda e: list(e.path)):
            path = ".".join(str(p) for p in err.absolute_path) or "(root)"
            errors.append(f"[Schema] {path}: {err.message}")

        stars, stars_display = self._calc_stars(manifest)

        return ValidationResult(
            passed=len(errors) == 0,
            component_id=manifest.get("id", "unknown"),
            version=manifest.get("version", "?"),
            stars=stars,
            stars_display=stars_display,
            errors=errors,
        )

    def validate_component(self, component_dir: str | Path, strict: bool = False) -> ValidationResult:
        """
        完整验证组件目录：schema + 文件存在性检查。
        strict=True 时警告也算失败。
        """
        component_dir = Path(component_dir).resolve()

        # 加载 manifest
        manifest_path = component_dir / "manifest.yaml"
        if not manifest_path.exists():
            manifest_path = component_dir / "manifest.yml"
        if not manifest_path.exists():
            return ValidationResult(passed=False, errors=["manifest.yaml 未找到"])

        try:
            with open(manifest_path) as f:
                manifest = yaml.safe_load(f)
        except yaml.YAMLError as e:
            return ValidationResult(passed=False, errors=[f"YAML 解析错误: {e}"])

        if not isinstance(manifest, dict):
            return ValidationResult(passed=False, errors=["manifest.yaml 内容不是有效对象"])

        # Schema 验证
        result = self.validate_manifest_dict(manifest)

        # 文件检查
        file_errors, file_warnings = self._check_files(manifest, component_dir)
        ref_warnings = self._check_references(manifest, component_dir)

        result.errors.extend(file_errors)
        result.warnings.extend(file_warnings + ref_warnings)
        result.passed = len(result.errors) == 0

        if strict and result.warnings:
            result.passed = False

        return result

    def _check_files(self, manifest: dict, component_dir: Path) -> tuple[list[str], list[str]]:
        errors, warnings = [], []
        for entry in manifest.get("printing", {}).get("files", []):
            fpath = entry.get("path", "")
            full = component_dir / fpath
            if not full.exists():
                errors.append(f"[文件缺失] 模型文件不存在: {fpath}")
            elif full.stat().st_size < 100:
                warnings.append(f"[警告] 模型文件可能无效（太小）: {fpath}")
        return errors, warnings

    def _check_references(self, manifest: dict, component_dir: Path) -> list[str]:
        warnings = []
        if not (component_dir / "README.md").exists() and not (component_dir / "readme.md").exists():
            warnings.append("[警告] 缺少 README.md")
        completeness = manifest.get("completeness", {})
        if completeness.get("has_firmware") and not any(
            (component_dir / d).exists() for d in ["firmware", "src"]
        ):
            warnings.append("[警告] 声明 has_firmware=true 但未找到 firmware/ 或 src/ 目录")
        if completeness.get("has_wiring") and not any(
            (component_dir / d).exists()
            for d in ["wiring", "docs/wiring", "wiring.png", "wiring.svg", "docs/wiring.png"]
        ):
            warnings.append("[警告] 声明 has_wiring=true 但未找到接线图文件")
        return warnings

    @staticmethod
    def _calc_stars(manifest: dict) -> tuple[int, str]:
        completeness = manifest.get("completeness", {})
        score = sum(1 for f in COMPLETENESS_FIELDS if completeness.get(f, False))
        return score, "⭐" * score + "☆" * (5 - score)


# ── 模块级便捷实例 ──
_default_validator: Optional[ManifestValidator] = None


def get_validator() -> ManifestValidator:
    """获取/创建全局验证器实例"""
    global _default_validator
    if _default_validator is None:
        _default_validator = ManifestValidator()
    return _default_validator


def validate_on_upload(component_dir: str | Path, strict: bool = False) -> ValidationResult:
    """
    组件上传时调用的验证入口。

    在 API 路由中使用：
        from platform.api.services.validator import validate_on_upload
        result = validate_on_upload(upload_path)
        if not result.passed:
            return JSONResponse(status_code=400, content=result.to_dict())
    """
    return get_validator().validate_component(component_dir, strict=strict)
