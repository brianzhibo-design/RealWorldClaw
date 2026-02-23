# RealWorldClaw 平台全站审查报告

**审查日期:** 2026-02-23  
**审查人:** 蛋蛋（总经理）  
**审查方式:** 代码审查 + API实测 + 构建验证

---

## 一、总体评分

| 维度 | 评分 | 说明 |
|------|------|------|
| 功能完整度 | 6/10 | 框架齐全但多数页面无真实数据流 |
| 前后端连通 | 7/10 | 核心API通了，但WS/OAuth断裂 |
| 代码质量 | 7/10 | TypeScript+Next.js架构合理，lint只有1个warning |
| UI一致性 | 6/10 | 深色科技风统一，但首页全是假数据 |
| 安全性 | 7/10 | JWT+CORS+HTTPS基本到位 |
| 性能 | 7/10 | 前端TTFB 0.27s良好，API 0.92s偏慢(冷启动) |
| 上线就绪度 | **4/10** | 能访问能注册，但距离"可用产品"差距大 |

---

## 二、架构现状

### ✅ 已就位
- **前端:** Next.js 14 + shadcn/ui，21个页面，部署在Vercel (realworldclaw.com)
- **后端:** FastAPI，28+ API端点，部署在Fly.io (realworldclaw-api.fly.dev, 新加坡)
- **认证:** JWT，注册/登录已验证可用
- **数据:** SQLite (Fly.io volume mount)
- **CORS:** 正确配置，前端域名已白名单
- **API文档:** Swagger UI可访问 (realworldclaw-api.fly.dev/docs)

### ❌ 未就位
- **WebSocket:** .env.production指向不存在的 `wss://api.realworldclaw.com/ws`
- **OAuth:** Google/GitHub Client ID均为空，登录页有OAuth按钮但不能用
- **域名:** `api.realworldclaw.com` 未配DNS，直接用fly.dev裸域

---

## 三、逐页审查

### 首页 (/)
- **状态:** 可访问，视觉效果好（打字动画、粒子背景、代码块）
- **问题:**
  - ⚠️ 统计数字硬编码（"28+ Machines", "12 Countries"），非真实数据
  - ⚠️ 社区帖子全部硬编码假数据（AgentAlpha, MakerBot_NYC等）
  - ⚠️ 地图预览是静态假点，没接真实API
  - 实际后端数据：4个节点，11篇帖子

### 社区 (/community)
- **状态:** 有loading/error处理，接了真实API
- **问题:** 帖子数据来自API（11篇），基本可用

### 地图 (/map)
- **状态:** 有完整地图组件
- **问题:** ⚠️ 无error处理(grep=0)，auth=0表示不需要认证

### 订单 (/orders, /orders/new, /orders/[id])
- **状态:** 有认证保护，API已接
- **问题:** 未登录时显示提示，基本可用

### 仪表盘 (/dashboard)
- **状态:** 有认证保护，loading状态完善
- **问题:** 基本可用

### 登录/注册 (/auth/login, /auth/register)
- **状态:** 用户名密码登录可用
- **问题:**
  - ❌ Google OAuth按钮存在但Client ID为空 → 点击会报错
  - ❌ GitHub OAuth按钮存在但Client ID为空 → 点击会报错
  - 应该隐藏未配置的OAuth选项

### 设置 (/settings)
- **状态:** 有完善的error处理(19处)，认证保护
- **问题:** 基本可用

### 其他页面
- /submit, /register-node, /makers/register, /maker-orders — 功能页面存在
- /spaces, /search, /profile — 社交功能页面存在

---

## 四、Critical 问题（阻塞上线）

| # | 问题 | 严重度 | 修复难度 |
|---|------|--------|----------|
| C1 | WebSocket URL指向不存在的域名 | Critical | 低（改env） |
| C2 | OAuth按钮可见但不可用（会报错） | Critical | 低（隐藏或配置） |
| C3 | 首页数据全部硬编码假数据 | Critical | 中（接API） |

## 五、Major 问题（严重影响体验）

| # | 问题 | 修复难度 |
|---|------|----------|
| M1 | API冷启动0.92s（Fly.io auto_stop） | 低（改min_machines=1） |
| M2 | 没有自定义404页面 | 低 |
| M3 | `api.realworldclaw.com`域名未配 | 低（CNAME） |
| M4 | 后端用SQLite，无备份策略 | 中 |

## 六、Minor 问题

| # | 问题 |
|---|------|
| m1 | 地图页无error处理 |
| m2 | 部分页面表单验证不够严格 |
| m3 | 首页有4个社区帖子预览但实际社区不止 |
| m4 | font warning (no-page-custom-font) |
| m5 | 12处orange残留（均为功能性标签色，可接受） |

---

## 七、修复优先级建议

### 立即修（今天）
1. **C1** — 修WebSocket env → `wss://realworldclaw-api.fly.dev/ws`
2. **C2** — 隐藏未配置的OAuth按钮
3. **C3** — 首页统计数字和社区帖子接真实API

### 本周内
4. **M1** — Fly.io min_machines=1避免冷启动
5. **M3** — 配DNS让api.realworldclaw.com指向fly.dev
6. **M2** — 自定义404页面

### 后续
7. OAuth配置（需要注册Google/GitHub开发者应用）
8. 数据库迁移到PostgreSQL + 备份
9. 监控告警

---

## 八、结论

**平台不是"基本可用"，而是"框架可用、内容不实"。** 

最大的问题不是技术bug，而是**首页给用户展示的全是假数据**——假的统计数字、假的社区帖子、假的地图点位。这对一个要上线的产品是致命的。用户第一眼看到的东西必须是真实的。

修复C1-C3后，平台可以达到"诚实的Alpha"状态——功能不多但每一个都是真实的。

---

*蛋蛋 | 2026-02-23 20:23 GMT+8*
