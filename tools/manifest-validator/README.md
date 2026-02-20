# RealWorldClaw Manifest 验证器 💪

> 作者：沸羊羊（基建负责人）

验证 RealWorldClaw 组件包的 `manifest.yaml` 是否符合规范。

## 安装

```bash
pip install -r requirements.txt
```

## 用法

```bash
# 验证组件包
python validate.py /path/to/component/

# JSON 输出（适合 CI）
python validate.py /path/to/component/ --json

# 严格模式（警告也算失败）
python validate.py /path/to/component/ --strict
```

## 验证内容

1. **Schema 验证** — 用 JSON Schema (Draft 2020-12) 校验所有字段
2. **文件存在性** — 检查 `printing.files` 中的 STL/3MF/STEP 是否存在
3. **引用完整性** — 检查 README、firmware、wiring 等声明的资源
4. **星级计算** — 根据 `completeness` 自动算出 ⭐ 评级（满分5星）

## 星级规则

| 星级 | 条件 |
|------|------|
| ⭐⭐⭐⭐⭐ | has_models + has_wiring + has_firmware + has_agent + has_docs |
| ⭐⭐⭐ | 任意3项为 true |
| ⭐ | 仅1项为 true |

## CI 集成

```yaml
# GitHub Actions
- name: Validate manifest
  run: |
    pip install pyyaml jsonschema
    python tools/manifest-validator/validate.py components/my-component/ --strict --json
```
