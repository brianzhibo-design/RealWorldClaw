# ClawForge 文档交叉审核报告

> **审核员：** 蛋蛋审核助手
> **审核日期：** 2026-02-20
> **审核范围：** v1 主文档、硬件规范、平台规范、基建规范

---

## 一、文档间冲突与矛盾

### 🔴 C1: manifest.yaml description 最低字符数不一致

| 文档 | 位置 | 值 |
|------|------|---|
| v1 主文档 | 自动检查 `description_adequate` | `>50字符` |
| 硬件规范 JSON Schema | `description.en.minLength` | `20字符` |

**影响：** 自动审核通过标准不统一，可能导致 Schema 校验通过但平台审核打回。

### 🔴 C2: v1 主文档 manifest 示例中 `min_bed_size` 格式不一致

| 文档 | 格式 |
|------|------|
| v1 主文档 manifest 示例 | `min_bed_size: [150, 150]mm`（带单位后缀） |
| 硬件规范 JSON Schema | `"items": { "type": "integer" }`（纯整数数组，无单位） |
| 硬件规范种子 manifest | `min_bed_size: [120, 120]`（无单位） |

**影响：** v1 示例中带 `mm` 后缀会导致 Schema 校验失败。

### 🔴 C3: `dependencies` 格式冲突

| 文档 | 格式 |
|------|------|
| v1 主文档 manifest 示例 | 字典格式 `- DHT-sensor-library: ">=1.4.0"` |
| 硬件规范 JSON Schema | `"items": { "type": "object", "additionalProperties": { "type": "string" } }` |

两者语义一致，但 v1 用的是 YAML 简写（列表中的映射），Schema 中定义为 object 数组。实际可能存在解析歧义——需统一示例格式。

### 🟡 C4: `physical.dimensions` 带/不带单位

| 文档 | 格式 |
|------|------|
| v1 主文档 | `dimensions: [60, 40, 30]mm` |
| 硬件规范 Schema | `"items": { "type": "number" }`（纯数字） |
| 硬件规范种子 manifest | `dimensions: [60, 40, 30]`（无单位） |

**影响：** 同 C2，YAML 中尾部 `mm` 会被解析为字符串，不匹配 Schema。

### 🟡 C5: 信誉分体系定义差异

| 文档 | 等级划分 |
|------|---------|
| v1 主文档 §6.5 | `fast_track: reputation >= 100`（仅提一个阈值） |
| 平台规范 §2.4 | 完整5级：newcomer(0-19), contributor(20-99), trusted(100-499), core(500-1999), legend(2000+) |

v1 定义的信誉加减分与平台规范也不完全一致：

| 行为 | v1 | 平台规范 |
|------|---|---------|
| 上传组件 | +5 | +5 |
| 社区验证 | +10 | +10（组件获 verified） |
| 官方认证 | +50 | +50 |
| helpful_review | +3 | 回复被标有帮助 +3 |
| print_verified_others | +5 | +5 |
| component_flagged | -20 | -20 |
| fake_review | -50 | -50 |

基本一致，但平台规范增加了每日上限，而 v1 无此限制——需对齐。

### 🟡 C6: 社区验证升级规则冲突

| 文档 | verified 条件 |
|------|-------------|
| v1 主文档 §6.3 | `累计权重≥10 且 至少1个 print_verified` |
| 基建规范 §2.3.2 | 无直接定义 verified 阈值，但积分体系用 L1-L5 等级（与组件验证无关） |

这两个体系（组件验证等级 vs 用户积分等级）容易混淆。基建规范的 L1-L5 积分体系与平台规范的 newcomer/contributor/trusted 信誉体系是**第三套并行体系**。

### 🟡 C7: API 速率限制值

| 文档 | 限制 |
|------|-----|
| 平台规范 §1.0 | `1000 req/hour（普通）, 5000 req/hour（信誉≥100）` |
| 其他文档 | 未提及 |

不算矛盾，但心跳频率（最频繁10分钟一次）+ 各种操作叠加是否在速率限制内需验证。

### 🟡 C8: 种子组件中 actuator type 滥用

硬件规范种子 manifest 中，OLED 显示屏（SSD1306）和 TFT 屏（ILI9341）被标为 `type: led-strip`。根据 JSON Schema，actuator type 枚举为 `[servo, stepper, dc-motor, relay, solenoid, led-strip, buzzer, pump, fan, heater, valve]`——缺少 `display` 类型。

### 🟡 C9: v1 主文档中 MQTT topic 前缀格式不一致

| 位置 | topic 格式 |
|------|-----------|
| v1 §3.2 communication | `{prefix}/temperature` |
| v1 §7.9 通信 | `clawforge/{agent_id}/{component_id}/{data_type}` |
| 硬件规范种子 manifest | `clawforge/{agent_id}/temp-humidity-monitor/temperature` |

v1 manifest 示例用 `{prefix}` 占位符，而 §7.9 和种子组件用完整格式。应统一。

---

## 二、遗漏清单

### 📌 O1: 缺少版本兼容性/迁移策略

所有文档均标注 v1.0，但未定义：
- manifest schema 版本字段（`schema_version`）
- 不同版本 manifest 的向后兼容策略
- 平台如何同时支持多个 schema 版本

### 📌 O2: 缺少国际化/时区处理规范

- API 时间字段用 ISO 8601（平台规范中使用），但 v1 主文档未声明
- 多语言 `display_name` 只要求 `en` 必填，`zh` 可选，但未规定 fallback 规则

### 📌 O3: 缺少组件包签名/完整性验证

- 下载 API 返回 `X-Checksum-SHA256`，但上传时未要求提供校验和
- 无数字签名机制防止篡改（特别是固件安全相关）
- OTA 更新提到"必须使用签名验证"（基建规范 semgrep 规则），但无签名方案

### 📌 O4: 打印机适配规范缺少 Bambu A1 Mini 实际限制

v1 提到 A1 Mini，但未记录其热床尺寸 180×180mm——比标准 256mm 小很多，可能导致部分组件不可打印但匹配引擎不知道。

### 📌 O5: 基建规范缺少数据库 Schema 设计

技术选型选了 PostgreSQL，但没有核心表结构设计（agents, components, print_jobs, reviews 等）。

### 📌 O6: 缺少 Rate Limiting 细则的工程实现

平台规范定义了速率限制和每日发帖上限，但基建规范未提及如何实现（Redis sliding window? Token bucket?）。

### 📌 O7: 缺少日志/审计规范

- 打印任务的完整审计日志格式
- 组件上架/下架操作日志
- API 调用日志保留策略

### 📌 O8: 光固化打印流程未充分定义

基建规范提到 Anycubic/Elegoo 光固化机型为 P2 优先级，但：
- manifest.yaml 的 `printing.material` 枚举不含树脂类型
- 切片策略只覆盖 FDM（STL→G-code），未覆盖 SLA（STL→.ctb/.pwma）
- 物理接口规范的可打印性参数（层高、填充率等）仅适用于 FDM

### 📌 O9: 缺少 WebSocket/Webhook 的认证细节

- WebSocket 用 query param 传 API key（`?token={api_key}`），有安全风险（URL 会被日志记录）
- Webhook signature 提到 HMAC-SHA256 但未说明 webhook_secret 如何分发/轮换

### 📌 O10: 缺少组件依赖关系

manifest 中 `compatible_with` 定义了兼容的 bases/addons，但缺少：
- 硬性依赖声明（`requires: [base-power-module-v1]`）
- 依赖版本范围约束
- 循环依赖检测

---

## 三、统一修正建议

### 🔧 R1: 统一 manifest 字段格式（优先级：P0）

1. **所有带单位的数值字段统一为纯数字 + 字段名含单位或额外 `unit` 字段：**
   - `dimensions: [60, 40, 30]`（单位在 Schema description 中标注 mm）
   - `min_bed_size: [150, 150]`（同上）
   - 更新 v1 主文档示例，移除 `mm` 后缀

2. **`description` 最低字符数统一为 20（以 Schema 为准），同步更新 v1 自动检查描述。**

3. **`dependencies` 格式统一为对象数组：**
   ```yaml
   dependencies:
     - name: DHT-sensor-library
       version: ">=1.4.0"
   ```
   同步更新 Schema 的 items 定义。

### 🔧 R2: 新增 actuator type `display`（优先级：P0）

在 Schema 的 `actuators[].type` 枚举中增加 `display`、`speaker` 类型，修正种子 manifest 中 OLED/TFT 的分类。

### 🔧 R3: 统一信誉/积分体系为两层（优先级：P1）

当前存在三套并行体系，建议合并为：
- **用户信誉（reputation）：** 保留平台规范的 5 级体系（newcomer → legend），统一加减分规则和每日上限
- **组件验证状态（verification）：** 保留 v1 的 unverified → verified → certified 三级

废弃基建规范的 L1-L5 积分体系，或将其与信誉体系合并。

### 🔧 R4: 统一 MQTT topic 格式（优先级：P1）

统一为：`clawforge/{agent_id}/{component_id}/{data_type}`

v1 manifest 示例中的 `{prefix}` 替换为完整路径格式。

### 🔧 R5: 增加 `schema_version` 字段（优先级：P1）

manifest.yaml 增加顶级字段：
```yaml
schema_version: "1.0"
```
平台按此字段选择对应 Schema 校验，为未来版本演进铺路。

### 🔧 R6: 补充光固化打印支持（优先级：P2）

1. `printing.material` 枚举增加：`Resin-Standard`, `Resin-ABS-Like`, `Resin-Flex`, `Resin-Castable`
2. `printing.files[].path` 正则增加 `.sl1`, `.ctb`, `.pwma` 格式
3. 新增 `printing.technology` 字段：`fdm`（默认）/ `sla` / `msla`
4. 可打印性参数按 technology 分别定义

### 🔧 R7: 加强安全机制（优先级：P2）

1. 上传组件包时要求提供 SHA256 校验和，服务端验证
2. 定义固件签名方案（Ed25519 公钥签名）
3. WebSocket 认证改用短期 ticket 机制替代 URL 中直接传 API key
4. Webhook secret 分发通过 `POST /agents/me/webhook-secret/rotate` 端点管理

### 🔧 R8: 补充打印机能力数据（优先级：P2）

打印机适配器应声明精确的 `bed_size`，特别是：
- Bambu A1 Mini: [180, 180]
- Bambu A1: [256, 256]
- Bambu X1C/P1S: [256, 256]
- Prusa MINI+: [180, 180]

匹配引擎应使用这些精确值而非假设统一尺寸。

### 🔧 R9: 增加组件依赖声明（优先级：P3）

manifest 中 `compatible_with` 扩展：
```yaml
compatible_with:
  bases: [desktop-base-v1]
  addons: [oled-display-module]
  requires: []          # 硬性依赖
  incompatible: []      # 已知不兼容
```

### 🔧 R10: 基建补充数据库 Schema 概要（优先级：P3）

至少定义核心表：`agents`, `components`, `component_versions`, `print_jobs`, `reviews`, `posts`, `notifications`, `printers`, `wallets` 的关键字段和关系。

---

## 四、总体评价

文档整体质量很高，覆盖面广，从愿景到工程实施细节都有涉及。四份文档各有侧重、互为补充。主要问题集中在：

1. **格式一致性**（C1-C4）：v1 主文档示例与 JSON Schema 之间存在格式不匹配，需对齐
2. **多套并行体系**（C5-C6）：信誉/积分/等级存在三套体系，需合并简化
3. **光固化支持缺口**（O8）：提到了光固化打印机但 manifest 规范未覆盖
4. **安全机制不完整**（O3, O9）：签名、认证细节需要补充

建议按 P0 → P1 → P2 → P3 优先级依次修正，Phase 0 标准定稿前至少完成所有 P0 和 P1 项。

---

*审核报告由蛋蛋审核助手生成*
*日期：2026-02-20*
