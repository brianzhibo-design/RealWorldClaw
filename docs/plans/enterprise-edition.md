# RealWorldClaw Enterprise Edition — 设计草案

> 版本: 0.1-draft | 日期: 2025-02-24 | 作者: 蛋蛋(GM)

---

## 1. 概述

Enterprise Edition 面向需要管理 **50+ 物联网模块** 的团队/公司，提供多设备管理、组织级权限、审计导出和 SLA 监控能力。

---

## 2. 多设备管理

### 2.1 设备分组（Fleet Management）

| 概念 | 说明 |
|------|------|
| **Workspace** | 顶层租户，对应一个公司/组织 |
| **Site** | 物理位置（如"北京办公室"、"深圳工厂"） |
| **Zone** | Site 内的区域（如"3楼"、"产线A"） |
| **Device Group** | 逻辑分组，可跨 Site（如"所有温湿度传感器"） |

### 2.2 批量操作

- **批量注册**: CSV/JSON 导入设备清单，自动生成 API Key
- **批量固件更新**: 按 Group/Zone/Site 分批推送，支持灰度（10%→50%→100%）
- **批量配置**: 统一修改采样间隔、报警阈值等参数
- **设备模板**: 预定义模块类型 + 默认配置，新设备一键套用

### 2.3 设备生命周期

```
Provisioned → Active → Maintenance → Decommissioned
                ↑          ↓
                ← Reactivated ←
```

- 每个状态转换记录审计日志
- Maintenance 模式：暂停告警但保持数据采集
- Decommissioned：数据归档后释放 License 席位

---

## 3. 组织权限（RBAC + ABAC）

### 3.1 预定义角色

| 角色 | 查看设备 | 控制设备 | 管理设备 | 管理成员 | 审计导出 | 计费管理 |
|------|---------|---------|---------|---------|---------|---------|
| **Viewer** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Operator** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Engineer** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### 3.2 自定义角色

- 可组合细粒度权限（`device:read`, `device:control`, `device:provision`, `audit:export` 等）
- 权限可限定作用域（全局 / 指定 Site / 指定 Zone / 指定 Device Group）

### 3.3 SSO 集成

- SAML 2.0 / OIDC 支持
- 自动角色映射（IdP group → RWC role）
- SCIM 2.0 用户/组同步（可选）

### 3.4 API Key 管理

- 组织级 API Key（带权限作用域）
- Key 轮换策略（可配置过期时间）
- Key 使用审计（调用次数、来源 IP、最后使用时间）

---

## 4. 审计导出

### 4.1 审计事件类型

| 类别 | 事件示例 |
|------|---------|
| **认证** | 登录、登出、SSO 认证、API Key 使用 |
| **设备管理** | 注册、删除、固件更新、配置变更 |
| **设备控制** | 命令下发、自动化规则触发、E-stop |
| **权限变更** | 角色分配、成员邀请/移除、API Key 创建/吊销 |
| **数据访问** | 遥测数据导出、报表生成 |

### 4.2 导出格式

- **实时流**: Webhook（每事件推送）或 WebSocket
- **批量导出**: JSON / CSV，按时间范围筛选
- **SIEM 集成**: Splunk HEC / Elasticsearch / Datadog Log 格式
- **合规报告**: 预定义模板（ISO 27001 / SOC 2 审计所需字段）

### 4.3 保留策略

| 计划 | 审计日志保留 | 遥测数据保留 |
|------|-------------|-------------|
| Pro | 90 天 | 30 天 |
| Enterprise | 1 年（可扩展至 7 年） | 1 年 |

---

## 5. SLA 监控

### 5.1 可用性指标

| 指标 | 定义 | Enterprise SLA 目标 |
|------|------|-------------------|
| **API 可用性** | 成功请求 / 总请求 | 99.9% |
| **命令延迟 P95** | 命令下发到设备确认 | < 2s（同区域） |
| **遥测延迟 P95** | 设备上报到平台可查 | < 5s |
| **Webhook 交付率** | 成功交付 / 总触发 | 99.5% |

### 5.2 监控 Dashboard

- 实时可用性面板（按 Site/Zone 细分）
- 历史 SLA 报告（月度/季度，可导出 PDF）
- 异常检测：设备离线率突增、延迟飙升自动告警

### 5.3 事件管理

- **Incident 时间线**: 自动记录故障发现→响应→恢复全过程
- **Postmortem 模板**: 根因分析 + 改进措施跟踪
- **状态页**: 公开状态页（可选），展示各组件实时状态

### 5.4 告警通道

- Email / Slack / 飞书 / PagerDuty / 自定义 Webhook
- 告警升级策略（5min 无响应→升级至 Admin→15min→升级至 Owner）
- 静默规则（维护窗口期间抑制告警）

---

## 6. 定价参考（与 pricing-model.md 对齐）

| | Pro | Enterprise |
|---|-----|-----------|
| 设备数 | ≤ 50 | 无限制 |
| 用户数 | ≤ 10 | 无限制 |
| SSO | ❌ | ✅ |
| RBAC | 基础角色 | 自定义角色 + 作用域 |
| 审计保留 | 90 天 | 1年+ |
| SLA | Best-effort | 99.9% + 赔偿条款 |
| 支持 | 工单（48h） | 专属支持 + 季度评审 |
| 价格 | $49/月 | 联系销售（$500+/月起） |

---

## 7. 实施优先级

### Phase 1（MVP，1-2个月）
1. Workspace + Site + Zone 层级结构
2. 5个预定义角色 RBAC
3. 审计日志存储 + JSON 导出
4. 基础 SLA Dashboard

### Phase 2（3-4个月）
5. 自定义角色 + 作用域限定
6. SSO (OIDC) 集成
7. SIEM 集成（Webhook + Splunk）
8. 批量设备管理

### Phase 3（5-6个月）
9. SAML + SCIM 支持
10. 合规报告模板
11. 高级告警升级策略
12. 公开状态页

---

## 8. 技术依赖

- 现有 `specs/security-permission-model.md` 的权限模型需扩展至组织级
- 需新增数据库表: `workspaces`, `sites`, `zones`, `roles`, `role_permissions`, `audit_events`
- 审计日志建议用 append-only 存储（如 ClickHouse / TimescaleDB）
- SLA 计算需独立的 metrics pipeline（Prometheus + Grafana 或自建）

---

*本文档为设计草案，具体实现需根据用户反馈和技术评估调整。*
