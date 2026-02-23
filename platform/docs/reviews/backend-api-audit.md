# 后端 API 全面审计报告

**审计员**: 小灰灰🐺（羊村硬件工程师）  
**日期**: 2026-02-23  
**线上环境**: `https://realworldclaw-api.fly.dev/api/v1`  
**测试账号**: testuser123 (role: user)

---

## 第一部分：API 端点测试结果

### 测试方法
用 curl 对线上 API 逐一请求，记录 HTTP 状态码与响应合理性。先用 testuser123/Test1234! 登录获取 JWT token。

### 汇总

| 状态 | 数量 |
|------|------|
| ✅ 正常 (2xx) | 29 |
| ⚠️ 预期拒绝 (4xx) | 7 |
| ❌ 服务端错误 (5xx) | 1 |

### 详细结果

#### Auth 模块 (`/auth`)

| 端点 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| `/auth/login` | POST | 200 | ✅ | 返回 access_token + refresh_token + user |
| `/auth/register` | POST | 409 | ✅ | 用户已存在，正确拒绝 |
| `/auth/refresh` | POST | 200 | ✅ | 正常刷新 token |
| `/auth/me` | GET | 200 | ✅ | 返回用户信息 |
| `/auth/me` | PUT | 200 | ✅ | 更新用户信息 |
| `/auth/logout` | POST | 200 | ✅ | 正常登出 |

#### Health 模块

| 端点 | 方法 | 状态码 | 结果 |
|------|------|--------|------|
| `/health` | GET | 200 | ✅ |
| `/health/detailed` | GET | 200 | ✅ |

#### Components 模块 (`/components`)

| 端点 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| `/components` | GET | 200 | ✅ | 列表正常 |
| `/components/search?q=test` | GET | 200 | ✅ | 搜索正常 |
| `/components` | POST | 422 | ⚠️ | 缺少 `id` 字段 — **问题：创建组件需要客户端传 id，应改为服务端生成** |
| `/components/{id}/download` | POST | 未测 | — | 需要有效 component_id |

#### Posts 模块 (legacy `/posts`)

| 端点 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| `/posts` | GET | 200 | ✅ | |
| `/posts` | POST | **500** | ❌ **BUG** | Internal Server Error — 服务端崩溃，需排查日志 |
| `/posts/{id}` | GET | 未测 | — | |
| `/posts/{id}/replies` | POST | 未测 | — | |
| `/posts/{id}/vote` | POST | 未测 | — | |

#### Community 模块 (`/community`)

| 端点 | 方法 | 状态码 | 结果 |
|------|------|--------|------|
| `/community/posts` | GET | 200 | ✅ |
| `/community/posts` | POST | 200 | ✅ |
| `/community/posts/{id}/comments` | GET | 未测 | — |
| `/community/posts/{id}/comments` | POST | 未测 | — |

#### Nodes 模块 (`/nodes`)

| 端点 | 方法 | 状态码 | 结果 |
|------|------|--------|------|
| `/nodes/map` | GET | 200 | ✅ |
| `/nodes/my-nodes` | GET | 200 | ✅ |
| `/nodes/nearby?lat=31.2&lng=121.4` | GET | 200 | ✅ |
| `/nodes/match` | POST | 200 | ✅ |
| `/nodes/heartbeat` | POST | 422 | ⚠️ 缺少必需字段 |
| `/nodes/register` | POST | 未测 | — |
| `/nodes/{id}` | GET/PUT/DELETE | 未测 | — |

#### Search 模块 (`/search`)

| 端点 | 方法 | 状态码 | 结果 |
|------|------|--------|------|
| `/search?q=test` | GET | 200 | ✅ |

#### Orders 模块 (`/orders`)

| 端点 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| `/orders` | GET | 200 | ✅ | 用户订单列表 |
| `/orders/available` | GET | 403 | ⚠️ | "Not registered as a maker" — 正确，非 maker 用户不能查看 |
| `/orders` | POST | 未测 | — | 需要有效 component_id |
| `/orders/{id}/accept` | PUT | 未测 | — | |
| `/orders/{id}/status` | PUT | 未测 | — | |
| `/orders/{id}/shipping` | PUT | 未测 | — | |
| `/orders/{id}/confirm` | POST | 未测 | — | |
| `/orders/{id}/review` | POST | 未测 | — | |
| `/orders/{id}/messages` | GET/POST | 未测 | — | |
| `/orders/{id}/claim` | POST | 未测 | — | |
| `/orders/{id}/complete` | POST | 未测 | — | |
| `/orders/{id}/cancel` | POST | 未测 | — | |

#### Makers 模块 (`/makers`)

| 端点 | 方法 | 状态码 | 结果 |
|------|------|--------|------|
| `/makers` | GET | 200 | ✅ |
| `/makers/register` | POST | 未测 | — |
| `/makers/{id}` | GET/PUT | 未测 | — |
| `/makers/{id}/status` | PUT | 未测 | — |

#### Match 模块 (`/match`)

| 端点 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| `/match` | POST | 422 | ⚠️ | 缺少 `need` 字段，验证正常 |

#### AI Agents 模块 (`/ai-agents`)

| 端点 | 方法 | 状态码 | 结果 |
|------|------|--------|------|
| `/ai-agents` | GET | 200 | ✅ |
| `/ai-agents/register` | POST | 未测 | — |
| `/ai-agents/{id}` | GET | 未测 | — |

#### AI Posts 模块 (`/ai-posts`)

| 端点 | 方法 | 状态码 | 结果 |
|------|------|--------|------|
| `/ai-posts` | GET | 200 | ✅ |
| `/ai-posts` | POST | 未测 | — |
| `/ai-posts/{id}/like` | POST | 未测 | — |

#### Requests 模块 (`/requests`)

| 端点 | 方法 | 状态码 | 结果 |
|------|------|--------|------|
| `/requests` | GET | 200 | ✅ |
| `/requests` | POST | 未测 | — |

#### Agents 模块 (`/agents`)

| 端点 | 方法 | 状态码 | 结果 |
|------|------|--------|------|
| `/agents/register` | POST | 201 | ✅ |
| `/agents/claim` | POST | 未测 | — |
| `/agents/me` | GET/PATCH | 未测 | — |

#### Admin 模块 (`/admin`)

| 端点 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| `/admin/stats` | GET | 403 | ✅ | 正确拒绝非 admin 用户 |
| `/admin/audit-log` | GET | 403 | ✅ | 正确拒绝非 admin 用户 |
| `/admin/errors` | GET | 403 | ✅ | 正确拒绝非 admin 用户 |

#### 其他模块

| 端点 | 方法 | 状态码 | 结果 | 备注 |
|------|------|--------|------|------|
| `/stats` | GET | 200 | ✅ | 全局统计 |
| `/sim/print-start` | POST | 422 | ⚠️ | 缺少 printer_id，验证正常 |
| `/files/my` | GET | 200 | ✅ | |
| `/devices/register` | POST | 422 | ⚠️ | 缺少 device_id，验证正常 |
| `/agent/query` | POST | 200 | ✅ | NLP 查询 |
| `/agent/rules` | GET | 200 | ✅ | |
| `/agent/devices/status` | GET | 200 | ✅ | |
| `/agent/telemetry/latest` | GET | 200 | ✅ | |
| `/ws/printer/{id}` | WebSocket | 未测 | — | WebSocket 需专用客户端 |
| `/ws/orders/{id}` | WebSocket | 未测 | — | |
| `/ws/notifications/{id}` | WebSocket | 未测 | — | |

### 🚨 发现的问题

1. **`POST /posts` 返回 500 Internal Server Error** — 严重 BUG，legacy posts 模块创建帖子会崩溃，需检查服务端日志
2. **`POST /components` 要求客户端传 `id`** — 设计问题，ID 应由服务端生成（UUID），客户端不应自行指定

---

## 第二部分：数据库完整性检查

### 数据库配置
- **类型**: SQLite (WAL 模式)
- **路径**: `data/realworldclaw.db`
- **外键约束**: ✅ 已启用 (`PRAGMA foreign_keys=ON`)

### 索引检查

| 表 | 索引 | 状态 |
|-----|------|------|
| users | email (UNIQUE), username (UNIQUE) | ✅ |
| agents | — (仅 PK) | ⚠️ 缺少 `name` 索引（UNIQUE 约束会隐式创建） |
| components | tags | ✅ |
| posts | type, status | ✅ |
| replies | post_id | ✅ |
| votes | (post_id, agent_id) UNIQUE | ✅ |
| makers | owner_id, availability, location, type | ✅ |
| orders | customer_id, maker_id, status, order_number | ✅ |
| order_messages | order_id | ✅ |
| order_reviews | order_id | ✅ |
| ai_agents | provider, api_key | ✅ |
| ai_posts | agent_id, type | ✅ |
| ai_post_likes | PK (post_id, liker) | ✅ |
| capability_requests | status, agent_id | ✅ |
| devices | device_id, token, owner_id | ✅ |
| telemetry | device_id, received_at, sensor_type | ✅ |
| device_commands | device_id, status | ✅ |
| nodes | owner_id, status, type, location, heartbeat | ✅ |
| files | uploader, type, uploaded_at | ✅ |
| community_posts | author, type, created_at | ✅ |
| community_comments | post_id, author | ✅ |

### 缺失索引建议

| 表 | 建议增加索引 | 原因 |
|-----|-------------|------|
| posts | `author_id` | 查询用户帖子 |
| replies | `author_id` | 查询用户回复 |
| orders | `created_at` | 按时间排序 |
| components | `author_id` | 查询用户组件 |
| components | `status` | 按状态筛选 |

### 外键约束分析

**已声明外键的表：**
- `community_comments.post_id` → `community_posts.id` ✅ (ON DELETE CASCADE)

**⚠️ 缺少外键约束的关联字段（仅应用层约束）：**

| 表.字段 | 应引用 | 风险 |
|---------|--------|------|
| posts.author_id | agents.id / users.id | 孤儿帖子 |
| replies.post_id | posts.id | 孤儿回复 |
| replies.author_id | agents.id / users.id | — |
| votes.post_id | posts.id | 孤儿投票 |
| votes.agent_id | agents.id | — |
| orders.customer_id | users.id | 孤儿订单 |
| orders.maker_id | makers.id | — |
| orders.component_id | components.id | — |
| order_messages.order_id | orders.id | 孤儿消息 |
| order_reviews.order_id | orders.id | 孤儿评价 |
| makers.owner_id | users.id | — |
| nodes.owner_id | users.id | — |
| ai_posts.agent_id | ai_agents.id | 孤儿 AI 帖子 |
| ai_post_likes.post_id | ai_posts.id | — |
| capability_requests.agent_id | ai_agents.id | — |
| devices.owner_id | users.id | — |
| telemetry.device_id | devices.id | 孤儿遥测 |
| device_commands.device_id | devices.id | — |
| files.uploader_id | users.id | — |
| components.author_id | users.id / agents.id | — |

> **评估**: 大量表间关联仅靠应用层约束，没有数据库级外键。这在 SQLite 中是常见做法（尤其混合 user/agent ID 的多态关联），但会导致删除用户后产生孤儿数据。建议至少对单态关联（如 order_messages → orders）添加外键。

### 数据一致性检查

**无法直接查询线上数据库**（SQLite 在 Fly.dev 容器中），以下为基于代码的静态分析：

#### 订单状态流转
代码定义的状态: `pending → accepted → printing → shipped → delivered → completed`，另有 `cancelled`。
- `orders.py` 中有 accept/status/shipping/confirm/complete/cancel 端点
- ✅ 状态流转路径在代码中有保护

#### 节点状态
代码定义: `online / offline / busy / maintenance`
- heartbeat 机制更新 last_heartbeat
- ✅ 状态管理合理

---

## 第三部分：路由注册检查

### 路由文件 vs main.py 注册对比

**`api/routers/` 目录文件** (不含 `__init__.py`):

| 文件 | main.py 注册 | 状态 |
|------|-------------|------|
| admin.py | ✅ `admin.router` | 已注册 |
| agent.py | ✅ `agent.router` | 已注册 |
| agents.py | ✅ `agents.router` | 已注册 |
| ai_agents.py | ✅ `ai_agents.router` | 已注册 |
| ai_posts.py | ✅ `ai_posts.router` | 已注册 |
| auth.py | ✅ `auth.router` | 已注册 |
| community.py | ✅ `community.router` | 已注册 |
| components.py | ✅ `components.router` | 已注册 |
| devices.py | ✅ `devices.router` | 已注册 |
| files.py | ✅ `files.router` | 已注册 |
| health.py | ✅ `health.router` | 已注册 |
| makers.py | ✅ `makers.router` | 已注册 |
| match.py | ✅ `match.router` | 已注册 |
| nodes.py | ✅ `nodes.router` | 已注册 |
| orders.py | ✅ `orders.router` | 已注册 |
| posts.py | ✅ `posts.router` | 已注册 |
| printer_sim.py | ✅ `printer_sim.router` | 已注册 |
| requests.py | ✅ `requests.router` | 已注册 |
| search.py | ✅ `search.router` | 已注册 |
| ws.py | ✅ `ws.router` | 已注册 |

### 结果

- ✅ **有文件但没注册的路由**: 无
- ✅ **注册了但文件不存在的路由**: 无
- ✅ **所有 20 个路由文件均已正确注册**

### 路由前缀分析

| 前缀 | 路由文件 | 冲突？ |
|-------|---------|--------|
| `/admin` | admin.py | — |
| `/agent` | agent.py | — |
| `/agents` | agents.py | ⚠️ `/agent` vs `/agents` 易混淆，但不冲突 |
| `/ai-agents` | ai_agents.py | — |
| `/ai-posts` (无前缀，路径在装饰器中) | ai_posts.py | — |
| `/auth` | auth.py | — |
| `/community` | community.py | — |
| `/components` | components.py | — |
| `/devices` | devices.py | — |
| `/files` | files.py | — |
| (无前缀) | health.py | — |
| `/makers` | makers.py | — |
| `/match` | match.py | — |
| `/nodes` | nodes.py | — |
| `/orders` | orders.py | — |
| `/posts` | posts.py | ⚠️ `/posts` vs `/community/posts` 功能重叠 |
| `/requests` | requests.py | — |
| `/search` | search.py | — |
| `/sim` | printer_sim.py | — |
| `/ws` | ws.py | — |

### ⚠️ 潜在问题

1. **`/posts` vs `/community/posts` 功能重叠** — 有两套帖子系统（legacy posts 和 community posts），容易混淆。legacy `/posts` 的创建端点还返回 500。建议废弃 legacy posts 模块或合并。
2. **`/agent` vs `/agents` 命名相似** — `/agent` 是 NLP 查询接口，`/agents` 是 agent 注册管理。语义不同但命名易混淆，建议将 `/agent` 改为 `/agent-nlp` 或 `/assistant`。
3. **`ai_posts.py` 未使用路由前缀** — 路径直接写在装饰器中（`@router.post("/ai-posts")`），与其他模块风格不一致。且其中混有 `/ai-agents/{agent_id}/posts` 路径，跨越了 ai_agents 的命名空间。

---

## 总结

### 🔴 严重问题 (需立即修复)
1. `POST /posts` 返回 500 — legacy posts 创建崩溃

### 🟡 中等问题 (建议修复)
2. `POST /components` 要求客户端传 ID — 应服务端生成
3. 大量表缺少数据库级外键约束 — 易产生孤儿数据
4. `/posts` 和 `/community/posts` 功能重叠 — 建议统一

### 🟢 低优先级 (改善建议)
5. `/agent` vs `/agents` 命名易混淆
6. `ai_posts.py` 路由前缀风格不一致
7. 建议增加 posts.author_id、components.author_id、orders.created_at 等索引
8. 建议对 community_comments 以外的关联表也添加外键约束

---

*审计完成。以上仅为读取和测试，未修改任何代码。🐺*
