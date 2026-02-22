# RealWorldClaw 文档修正日志

> **修正执行：** 蛋蛋修正助手
> **日期：** 2026-02-20
> **基于：** clawforge-review-notes.md 审核报告

---

## 一、品牌重命名（全部4份文档）

| 变更项 | 旧值 | 新值 |
|--------|------|------|
| 项目名 | ClawForge | RealWorldClaw |
| 域名 | clawforge.com | realworldclaw.com |
| API Base URL | https://api.clawforge.com/v1 | https://api.realworldclaw.com/v1 |
| WebSocket URL | wss://api.clawforge.com/ws | wss://api.realworldclaw.com/ws |
| Schema $id | https://clawforge.com/schemas/... | https://realworldclaw.com/schemas/... |
| MQTT topic 前缀 | clawforge/ | realclaw/ |
| 认证徽章 | 🏆 ClawForge Certified | 🏆 RealWorldClaw Certified |

**涉及文件：** clawforge-spec-v1.md, clawforge-spec-hardware.md, clawforge-spec-platform.md, clawforge-spec-infra.md

---

## 二、P0 修正

### R1: 统一 manifest 数值字段格式

**文件：** clawforge-spec-v1.md §3.2 manifest 示例

- `layer_height: 0.2mm` → `layer_height: 0.2  # 单位: mm`
- `infill: 20%` → `infill: 20  # 单位: %`
- `estimated_filament: 45g` → `estimated_filament: 45  # 单位: g`
- `min_bed_size: [150, 150]mm` → `min_bed_size: [150, 150]  # 单位: mm`
- `dimensions: [60, 40, 30]mm` → `dimensions: [60, 40, 30]  # 单位: mm`
- `weight: 85g` → `weight: 85  # 单位: g`

所有数值字段现在为纯数值，单位通过注释标注，与 JSON Schema 定义一致。

### R1 续: 统一 description 最低字符数为 50

**文件：** clawforge-spec-hardware.md §1 JSON Schema

- `description.en.minLength`: 20 → **50**
- 验证规则说明表同步更新

与 v1 主文档 `description_adequate > 50字符` 保持一致。

### R1 续: 统一 dependencies 格式

**文件：** clawforge-spec-v1.md §3.2 + clawforge-spec-hardware.md Schema + 全部种子 manifest

旧格式（字典简写）：
```yaml
dependencies:
  - DHT-sensor-library: ">=1.4.0"
```

新格式（显式 name+version）：
```yaml
dependencies:
  - name: DHT-sensor-library
    version: ">=1.4.0"
```

Schema 的 `dependencies.items` 更新为 `required: ["name", "version"]` 的对象定义。

### R2: 新增 actuator type `display` 和 `speaker`

**文件：** clawforge-spec-hardware.md

- Schema `actuators[].type` 枚举增加 `display`, `speaker`
- 种子 manifest 中 SSD1306 (OLED) 和 ILI9341 (TFT)：`type: led-strip` → `type: display`

---

## 三、P1 修正

### R3: 合并信誉/积分体系为统一信誉体系

**问题：** 存在三套并行体系——v1 信誉分、平台规范 5 级信誉、基建规范 L1-L5 积分。

**修正：**

1. **clawforge-spec-v1.md §6.5**：补充完整信誉等级（newcomer→legend）、每日上限、新增扣分项，引用平台规范 §2.4
2. **clawforge-spec-infra.md §2.3.1**：标注积分直接计入统一信誉分
3. **clawforge-spec-infra.md §2.3.2**：废弃 L1-L5 独立体系，替换为与平台规范一致的 5 级信誉等级表，保留验证权重倍数

最终统一为：
- **用户信誉（reputation）：** 5 级体系 newcomer(0-19) → legend(2000+)
- **组件验证状态（verification）：** 3 级 unverified → verified → certified

### R4: 统一 MQTT topic 格式

**文件：** clawforge-spec-v1.md §3.2 manifest 示例

- `{prefix}/temperature` → `realclaw/{agent_id}/temperature-monitor/temperature`
- `{prefix}/humidity` → `realclaw/{agent_id}/temperature-monitor/humidity`
- `{prefix}/command` → `realclaw/{agent_id}/temperature-monitor/command`

统一使用 `realclaw/{agent_id}/{component_id}/{data_type}` 完整格式，与 §7.9 和种子组件一致。

---

## 四、未修正项（P2/P3，留待后续）

| 编号 | 内容 | 优先级 |
|------|------|--------|
| R5 | 增加 schema_version 字段 | P1 |
| R6 | 补充光固化打印支持 | P2 |
| R7 | 加强安全机制（签名、WebSocket认证） | P2 |
| R8 | 补充打印机精确 bed_size 数据 | P2 |
| R9 | 增加组件依赖声明 | P3 |
| R10 | 基建补充数据库 Schema | P3 |

---

*修正日志由蛋蛋修正助手生成*
*日期：2026-02-20*
