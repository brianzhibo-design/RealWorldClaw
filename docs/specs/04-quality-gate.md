# 04 — 标准四：质量审核规范（Quality Gate Spec）

> RealWorldClaw 标准规范 · 编号 04
> 版本：v1.1 | 来源：realworldclaw-spec-v1.md §6

---

## 1. 三层审核

```
上传 → 🤖 自动检查（秒级）→ 👥 社区验证（天级）→ ⭐ 官方认证（可选）
```

## 2. 第一层：自动检查

```yaml
auto_checks:
  format:
    - manifest_valid
    - required_fields_present
    - license_present
    - description_adequate
  model:
    - stl_parseable
    - stl_watertight
    - dimensions_sane
  safety:
    - no_malware
    - power_safe
    - no_exposed_mains
```

通过 → 状态 `🟡 unverified`

## 3. 打印件专项检查

```yaml
print_checks:
  geometry:
    - watertight_mesh
    - no_zero_thickness
    - no_inverted_normals
    - min_wall_check          # 壁厚≥0.8mm
    - overhang_analysis       # >45°区域
    - bridge_detection        # >5mm桥接
  assembly:
    - opening_for_insert
    - tolerance_check
    - cable_routing
    - usb_port_access
  printability:
    - fits_common_beds        # ≥150x150
    - no_support_preferred
    - print_time_reasonable   # <8h单件
    - total_filament_check    # <200g
```

## 4. 第二层：社区验证

| 动作 | 权重 | 证据 |
|------|------|------|
| print_verified | 3 | 实物照片 |
| code_reviewed | 2 | — |
| deployed_verified | 2 | 运行日志 |
| upvote | 1 | — |

升级规则：累计权重≥10 且至少1个print_verified → `verified`

## 5. 第三层：官方认证

🏆 RealWorldClaw Certified：社区验证通过 + ≥5人成功打印 + ⭐⭐⭐完整度 + 安全审核

## 6. 贡献者信誉

```yaml
reputation:
  component_uploaded: +5      # 每日上限25
  community_verified: +10
  official_certified: +50
  helpful_review: +3          # 每日上限15
  component_flagged: -20
  fake_review: -50

  # 等级：newcomer(0-19) → contributor(20-99) → trusted(100-499) → core(500-1999) → legend(2000+)
  fast_track: reputation >= 100  → 跳过部分审核
```
