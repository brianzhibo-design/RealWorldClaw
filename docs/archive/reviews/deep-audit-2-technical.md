# 深层审查（二）：技术层面全方位扫描

**审查人:** 蛋蛋🥚  
**日期:** 2026-02-24 01:50  

---

## 🔴 严重问题

### S1. 3套帖子系统 + 2套Agent系统（架构混乱）
- `/posts` (posts.py) — 原始帖子系统
- `/community/posts` (community.py) — 社区帖子系统
- `/ai-posts` (ai_posts.py) — AI专属帖子系统
- `/agents` (agents.py) — 原始Agent系统
- `/ai-agents` (ai_agents.py) — AI Agent系统

**5个系统做的是同一件事。** 数据分散在不同表，前端只用了community和agents两个。其余3个是死代码但仍消耗维护成本。

### S2. 106个后端路由，45个前端从未调用（42%死代码）
包括：
- 整个 `/admin` 路由（审计日志、错误查看）
- 整个 `/agent` 路由（设备控制、遥测、规则引擎）
- 整个 `/ai-posts`, `/ai-agents` 路由
- 整个 `/devices` 路由
- 整个 `/requests` 路由
- 文件下载 `GET /files/{id}/download`
- 帖子详情 `GET /posts/{id}`

**问题不是"前端还没接入"——而是后端在没有需求的情况下过度建设。**

### S3. EmptyState和ErrorState组件做了但没人用
- `components/EmptyState.tsx` ✅ 存在
- `components/ErrorState.tsx` ✅ 存在
- `components/VoteButtons.tsx` ✅ 存在
- **21个页面没有一个引入它们**
- 所有页面的空数据状态都缺失

### S4. API响应时间全部 ~1秒
| 端点 | 响应时间 |
|------|---------|
| /health | 1.19s |
| /stats | 0.96s |
| /nodes/map | 0.94s |
| /community/posts | 1.15s |

**一个SQLite小数据库，6个节点14条帖子，响应时间接近1秒是不正常的。** 可能原因：Fly.io冷启动、没有连接池、或机器在新加坡而用户在中国。

---

## 🟡 中等问题

### M1. SQL注入风险 — 22条f-string SQL
虽然大部分where条件用了参数化查询(`?`)，但ORDER BY和部分WHERE子句通过f-string拼接。
- `community.py`: `{where_clause}`, `{order_clause}` 直接拼入SQL
- `posts.py`: `{order}` 从map取值（安全但不优雅）
- `makers.py`: `{where}` 从conditions拼接

**当前风险中等**（输入来自enum/白名单），但代码模式脆弱，未来新增参数容易引入注入。

### M2. 没有外键约束
- 数据库有索引（12个） ✅
- **但没有FOREIGN KEY约束** ❌
- orders.customer_id 不引用 users.id
- 数据一致性完全靠应用层维护
- 删除用户后，其订单/帖子变成孤儿数据

### M3. 24个高危npm漏洞（全部指向Next.js 14）
需要升级到Next.js 16（破坏性变更），暂时无法修复。

### M4. 13条console.log/error在生产前端代码中
影响：用户打开DevTools会看到调试信息，不专业。

---

## 🟢 洞察发现

### I1. 测试数据占比57%（8/14帖子是测试/报到/junk）
这些帖子传递的信息比mock数据更糟："Phase1 Audit Test"、"QA Test Post"告诉来访者这是个测试环境。

### I2. 前端bundle 1.5MB / 16个chunk — 合理
Next.js自动分包，总体积在可接受范围。

### I3. 安全配置到位
- JWT_SECRET_KEY、CORS_ORIGINS、RWC_API_KEY已在Fly.io secrets配置 ✅
- 不会像Moltbook那样泄露150万key

### I4. 前端环境变量需4个，实际只配了1个
```
NEXT_PUBLIC_API_URL     ✅ 已配
NEXT_PUBLIC_GITHUB_CLIENT_ID  ❌ 未配（OAuth不可用）
NEXT_PUBLIC_GOOGLE_CLIENT_ID  ❌ 未配（OAuth不可用）
NEXT_PUBLIC_WS_URL      ❌ 未配（WebSocket不可用）
```

---

## 📊 数字总结

| 指标 | 数值 | 评价 |
|------|------|------|
| 后端路由 | 106 | 过多（前端只用61个） |
| 前端页面 | 25 | 对MVP足够 |
| 死路由 | 45 (42%) | 需要清理 |
| 死组件 | 3个 | EmptyState/ErrorState/VoteButtons |
| 重复系统 | 3套帖子+2套Agent | 需统一 |
| SQL注入风险 | 22条 | 中低（但模式不好） |
| npm漏洞 | 24 high | 等Next.js 16 |
| 外键约束 | 0 | 需要加 |
| 索引 | 12 | 基本够用 |
| API平均响应 | ~1s | 太慢 |
| 空状态页面 | 0/21 | 全部缺失 |

---

*蛋蛋🥚 | 2026-02-24 01:50 | 继续深入*
