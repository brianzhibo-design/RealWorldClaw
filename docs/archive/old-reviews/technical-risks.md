# 技术风险识别与缓解方案

> **审查人**：慢羊羊🧓 · 小灰灰🐺 · 沸羊羊🐏  
> **日期**：2026-02-22

---

## 风险矩阵

| # | 风险 | 概率 | 影响 | 等级 | 负责人 |
|---|------|:----:|:----:|:----:|--------|
| R1 | 硬件方案未经实物验证 | 高 | 高 | 🔴 严重 | 小灰灰🐺 |
| R2 | STL 无法生成/打印 | 高 | 高 | 🔴 严重 | 小灰灰🐺 |
| R3 | SQLite 数据丢失/并发问题 | 中 | 高 | 🔴 严重 | 沸羊羊🐏 |
| R4 | 固件不能编译 | 中 | 高 | 🟡 高 | 小灰灰🐺 |
| R5 | 打印机 API 适配不通 | 中 | 中 | 🟡 高 | 沸羊羊🐏 |
| R6 | API Key 泄露无撤销机制 | 低 | 高 | 🟡 高 | 慢羊羊🧓 |
| R7 | 单点部署，无容灾 | 中 | 中 | 🟡 中 | 沸羊羊🐏 |
| R8 | 前端性能未测试 | 低 | 中 | 🟢 低 | 美羊羊🎀 |

---

## 详细分析

### R1 🔴 硬件方案未经实物验证

**描述**：M5StickC Plus2 外壳设计完全基于数据手册尺寸，0.3mm 公差是估算值。卡扣、开孔位置、按钮对位均无实物校验。

**影响**：第一产品 Energy Core 可能需要多次迭代才能配合，延迟发布 2-4 周。

**缓解方案**：
1. **立即**：打印简单矩形测试盒（无装饰），验证 M5StickC Plus2 配合度
2. **短期**：购入 M5StickC Plus2 实物（约 ¥150），建立实物验证流程
3. **长期**：所有硬件设计必须经过 Print → Fit → Iterate 三步才能标记为 "Ready"

### R2 🔴 STL 文件无法生成

**描述**：OpenSCAD 在 MacBook 上因内存不足被 kill，5 个零件 STL 均未生成。

**缓解方案**：
1. 使用 Mac Mini（16GB）运行 OpenSCAD
2. 简化模型复杂度（减少 $fn 值）
3. 备选：用 FreeCAD 或 Fusion 360 重建模型
4. 在线 OpenSCAD 渲染服务作为最后方案

### R3 🔴 SQLite 生产环境风险

**描述**：当前使用 SQLite 单文件数据库，无备份脚本、无 migration 工具、无 WAL 模式配置。Fly.io 部署时 volume 丢失 = 数据全失。

**缓解方案**：
1. **短期**（1 周）：启用 WAL 模式 + 每日自动备份到 S3
2. **中期**（1 月）：迁移到 PostgreSQL（Fly.io Postgres 或 Supabase）
3. 集成 Alembic 做 schema migration
4. 添加数据库健康检查端点

### R4 🟡 固件编译未通过

**描述**：ESP32 固件引用 M5StickCPlus2 库，但从未在 PlatformIO 中实际编译。可能存在 API 变更、依赖缺失等问题。

**缓解方案**：
1. 在 Mac Mini 上安装 PlatformIO，编译验证
2. 添加 GitHub Actions CI 自动编译检查
3. 编写最小 blink 固件先验证工具链

### R5 🟡 打印机适配层未实测

**描述**：支持 4 种打印机接口（Bambu/OctoPrint/Moonraker/Generic），但只有代码框架，未连接真实打印机测试。

**缓解方案**：
1. 先用拓竹 P2S（已有）验证 Bambu 适配器
2. 编写 mock 打印机服务用于 CI 测试
3. 逐步验证其他适配器

### R6 🟡 API 安全机制薄弱

**描述**：Agent 认证仅用 API Key（Bearer token），无过期时间、无撤销机制、无 scope 限制。

**缓解方案**：
1. 添加 key rotation 端点
2. 实现 key scope（read/write/admin）
3. 中期迁移到 JWT + refresh token
4. 添加异常登录检测

### R7 🟡 部署单点故障

**描述**：API 部署在 Fly.io 单实例，前端在 Vercel。无健康监控、无告警、无自动恢复。

**缓解方案**：
1. Fly.io 启用 min_machines_running = 2
2. 接入 UptimeRobot 或 Better Stack 监控
3. 添加 /health 端点（已有）+ 外部探针

---

## 技术债务清单

| 项 | 优先级 | 估时 |
|----|:------:|:----:|
| 种子数据 SQL 字段名不一致 | P1 | 1h |
| 无 database migration 工具 | P1 | 4h |
| 无 CI/CD pipeline | P1 | 4h |
| CORS 配置硬编码 | P2 | 1h |
| 无请求验证（Pydantic schema 不完整） | P2 | 8h |
| 无 API 版本管理策略 | P3 | 2h |
| WebSocket 无认证 | P2 | 2h |
