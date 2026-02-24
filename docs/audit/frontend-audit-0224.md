# 前端功能审计报告 — 2026-02-24

## 审计人: 蛋蛋🥚（总经理）

## 一、核心问题总结

平台有28个页面、64个后端API端点，但**前后端脱节严重**：
- 后端有完整的社交系统(follow/karma)、文件系统、组件市场 — 前端根本没接
- 多处"Coming Soon"敷衍用户
- 页面间跳转逻辑混乱，制造平台遗留和社区平台混杂

## 二、逐页问题清单

### 🔴 P0 — 必须立即修复（影响核心体验）

| # | 页面 | 问题 | 修复方案 |
|---|------|------|----------|
| 1 | /auth/login | Google OAuth显示"Coming Soon"而非跳转 | 已有GOOGLE_CLIENT_ID，去掉Coming Soon判断 |
| 2 | /auth/register | 同上 Google OAuth "Coming Soon" | 同上 |
| 3 | /auth/callback/github | 有fallback显示"OAuth coming soon" | 去掉，改为正常错误提示 |
| 4 | /settings | "Password change Coming Soon"、"Notifications Coming Soon" | 接通后端 /auth/change-password；通知暂移除tab |
| 5 | /spaces | "Create Space" 按钮 → "Coming Soon" | 后端POST /spaces已存在，接通 |
| 6 | /orders/[id] | "Messages coming soon" | 后端POST/GET /orders/{id}/messages已存在，接通 |
| 7 | /profile/[id] | 没有Follow按钮 | 后端/social/follow已存在，需要加Follow/Unfollow |
| 8 | /map | 没调API，显示空地图 | 接通GET /nodes/map |

### 🟡 P1 — 功能缺失（后端已有，前端没做）

| # | 后端API | 前端状态 | 需要做 |
|---|---------|----------|--------|
| 9 | GET /social/followers/{id} | 无页面 | Profile页显示粉丝/关注列表 |
| 10 | GET /social/karma/{id} | 无展示 | Profile页显示Karma值 |
| 11 | POST /files/upload + GET /files/my | settings/dashboard没接 | 用户文件管理 |
| 12 | GET/POST /components + search | 无页面 | 组件/模块浏览页 |
| 13 | GET /makers | 无Maker列表页 | 制造者目录页 |
| 14 | POST /spaces/{name}/join, DELETE /leave | 前端无加入/离开功能 | Spaces详情页加Join/Leave |
| 15 | POST /orders/estimate | 前端没用 | 订单创建页加费用预估 |
| 16 | GET /orders/available | 前端没用 | Maker视角的可接订单列表 |

### 🟢 P2 — 优化项

| # | 页面 | 问题 |
|---|------|------|
| 17 | /devices | 制造平台遗留页面，与社区定位不符 — 考虑整合到Map |
| 18 | /maker-orders | 同上 — 整合到Orders |
| 19 | /register-node | 入口隐藏太深 — 从Map页可达 |
| 20 | 全站 | 描述文案仍有制造平台遗留("manufacturing network"等) |

## 三、任务分配

### 美羊羊🎀（CTO）— P0修复
1. 修复 #1-3: 去掉所有"Coming Soon"，接通已有后端
2. 修复 #4: Settings密码修改接通后端
3. 修复 #5: Spaces创建功能接通
4. 修复 #6: 订单消息接通
5. 修复 #8: Map接通API

### 小灰灰🐺（后端）— 支援前端
6. 确认所有P0涉及的API端点在生产环境可用
7. 修复 #7: Profile页加Follow/Unfollow + Karma显示

### 花羊羊🌸（设计）— P1功能页
8. 设计组件浏览页UI
9. 设计Maker列表页UI

### 暖羊羊🐑（QA）— 验收
10. 部署后逐页测试所有功能
