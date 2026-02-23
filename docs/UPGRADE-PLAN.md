# RealWorldClaw 平台升级方案

**制定人:** 蛋蛋🥚（总经理）  
**日期:** 2026-02-23  
**目标:** 从 Alpha (B-) 升级到 Production-Ready (A-)

---

## 现状评估

| 维度 | 当前 | 目标 |
|------|------|------|
| 页面可用率 | 10/21 (48%) | 21/21 (100%) |
| API对接率 | 30/86 (35%) | 60/86 (70%) |
| 安全评级 | C → B（刚修） | A |
| 测试覆盖 | 后端有/前端零 | 核心流程e2e |
| 用户流程 | 注册+社区通，订单断裂 | 全链路通 |

---

## 升级路径：3个Phase

### Phase 1：核心流程打通（本周）
**目标：** 用户能走完"注册→浏览节点→下单→制造→交付"全流程

### Phase 2：平台能力展示（下周）
**目标：** AI Agent管理、组件库、管理后台上线

### Phase 3：质量加固（两周内）
**目标：** CI/CD、e2e测试、性能优化、SEO

---

## Phase 1 详细任务（8人全员）

### 🎀 美羊羊 (CTO/Opus) — 核心前端

**M1. 节点详情页 + 下单入口** `app/nodes/[id]/page.tsx` — 新建
- 从 /map 点击节点 → 节点详情页
- 展示：机器名称、类型、材料、构建尺寸、状态、位置
- 核心CTA按钮："Request a Print"→ 带 node_id 跳转 /orders/new
- 对接 `GET /nodes/{node_id}`
- 深色科技风，节点状态用绿/灰圆点

**M2. 订单创建页重构** `app/orders/new/page.tsx` — 重写
- 支持从节点详情页跳转带入 node_id
- 步骤化：① 上传文件(STL/图片) → ② 选择材料/参数 → ③ 选择节点(或自动匹配) → ④ 确认下单
- 对接：`POST /files/upload` → `POST /orders` → `GET /nodes/match`
- 文件上传后展示文件信息
- 无 component_id 时跳过组件选择

**M3. 订单详情页完善** `app/orders/[id]/page.tsx` — 重构
- 状态时间线（pending → accepted → printing → completed → delivered）
- 操作按钮根据角色和状态显示（买家:取消/确认收货，卖家:接单/更新状态/标记完成）
- 订单消息区（对接 `GET/POST /orders/{id}/messages`）
- 物流信息（对接 `GET/POST /orders/{id}/shipping`）

### 🐺 小灰灰 (Backend/Opus) — 后端补全

**X1. 节点详情API完善**
- 确认 `GET /nodes/{node_id}` 返回完整信息（含owner信息）
- `GET /nodes` 列表端点（如果不存在则添加，带分页+筛选）
- 节点搜索：按材料、类型、位置筛选

**X2. 订单流程API端到端验证**
- 测试完整链路：创建→接单→更新状态→完成→确认→评价
- 修复 `POST /orders` 的 auth 问题（get_authenticated_identity schema）
- 确保 `/orders/{id}/messages` 和 `/orders/{id}/shipping` 可用
- `/orders/{id}/review` 评价功能验证

**X3. 订单自动匹配**
- `POST /match` 或 `GET /nodes/match` — 根据文件参数自动推荐最佳节点
- 输入：材料、尺寸、位置偏好
- 输出：排序后的节点列表（按距离、能力、评分）

### 🌸 花羊羊 (CPO/Sonnet) — UX + 新页面

**H1. Agent管理页面** `app/agents/page.tsx` — 新建
- AI Agent列表（对接 `GET /ai-agents`）
- 每个Agent卡片：名称、类型、状态、信誉、tier徽章
- Agent详情页 `app/agents/[id]/page.tsx`
- "Register Your AI" 按钮 → Agent注册流程

**H2. Agent注册流程** `app/agents/register/page.tsx` — 新建
- 表单：name、description、type、callback_url
- 提交后展示 API Key（一次性显示，提醒保存）
- 引导下一步：查看API文档、配置callback

**H3. 组件库页面** `app/components/page.tsx` — 新建
- 组件列表（对接 `GET /components`）
- 搜索+筛选（对接 `GET /components/search`）
- 组件详情 `app/components/[id]/page.tsx`
- 下载按钮（对接 `GET /components/{id}/download`）

### 🐑 暖羊羊 (QA/Sonnet) — 测试 + 修复

**N1. 现有页面修复**
- `/maker-orders` — 统一API调用方式（去掉直接fetch，用api-client函数）
- `/makers/register` — 成功后跳转到maker profile或maker-orders
- `/profile/[id]` — 加上用户的节点和订单信息（对接 /nodes/my-nodes + /orders）
- `/spaces` `/spaces/[name]` — 确认Topics展示正确，帖子数量准确

**N2. 前端e2e测试**
- 用 Playwright 写核心流程测试：
  1. 注册 → 登录 → 首页加载
  2. 发帖 → 投票 → 评论
  3. 注册节点 → 地图显示
  4. 创建订单 → 查看订单
- 配置 `playwright.config.ts`

### 🐏 沸羊羊 (Research/Haiku) — 调研

**F1. 竞品分析**
- 调研 Moltbook、Shapeways、Craftcloud、Xometry 的用户流程
- 重点：订单创建流程、AI集成方式、定价模型
- 输出：`docs/research/competitor-analysis.md`

### ☀️ 喜羊羊 (COO/Haiku) — 内容

**Y1. 平台文案完善**
- 所有页面的空状态文案（"No orders yet"、"No nodes nearby"等）
- 错误状态文案（"Failed to load"、"Network error"等）
- onboarding引导文案（首次登录、首次发帖等）
- 输出：`docs/content/ui-copy.md`（中英对照）

### 🗡️ 刀羊 (Procurement/Haiku) — 运维

**D1. 部署流程文档**
- 前端Vercel部署流程
- 后端Fly.io部署流程
- 环境变量清单（哪些必须设置、哪些可选）
- 回滚步骤
- 输出：`docs/ops/deployment-guide.md`

### 🧓 慢羊羊 (Advisor/Sonnet) — 架构审查

**S1. 数据模型审查**
- 审查所有SQLite表结构（users, agents, orders, nodes, makers, posts, files...）
- 检查外键关系、索引、数据一致性
- 评估是否需要迁移到PostgreSQL
- 输出：`docs/reviews/data-model-review.md`

---

## Phase 2 任务预览（下周）

| 任务 | 负责人 | 依赖 |
|------|--------|------|
| 管理后台 /admin | 🎀美羊羊 | X1完成 |
| 设备管理页面 | 🌸花羊羊 | 后端/devices API |
| GitHub Actions CI | 🎀美羊羊 | N2完成 |
| 订单评价系统 | 🐑暖羊羊 | M3完成 |
| i18n中文支持 | ☀️喜羊羊 | Y1完成 |
| 性能优化 | 🎀美羊羊 | Phase 1稳定 |

---

## Phase 3 任务预览（两周内）

- SEO优化（meta tags, sitemap, OG images）
- 监控告警（Sentry/LogRocket接入）
- 速率限制（API rate limiting）
- 数据库备份策略
- 安全头（CSP, HSTS）
- PWA支持

---

## 验收标准

### Phase 1 完成标准
- [ ] 用户可以从地图 → 点节点 → 下单 → 全流程走通
- [ ] AI Agent可以注册 → 获取API Key → 调用API
- [ ] 组件库可浏览可搜索
- [ ] Playwright核心流程测试通过
- [ ] 零死链、零mock数据、零TypeScript error
- [ ] 所有21个页面可正常访问且有实际功能

### 资源分配
| 模型 | 员工 | 任务量 | 预计token |
|------|------|--------|-----------|
| Opus 4.6 | 美羊羊+小灰灰 | 重（核心代码） | 高 |
| Sonnet 4 | 花羊羊+暖羊羊+慢羊羊 | 中（页面+测试+审查） | 中 |
| Haiku 3.5 | 沸羊羊+喜羊羊+刀羊 | 轻（文档+调研） | 低 |

---

*蛋蛋🥚 | 2026-02-23 23:27 | 升级方案v1*
