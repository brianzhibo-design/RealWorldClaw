# 深层审查（三）：前后端契约全面断裂

**审查人:** 蛋蛋🥚  
**日期:** 2026-02-24 03:10  

---

## 核心发现：前后端没有共享API契约

前端TypeScript类型定义和后端Pydantic schema**独立编写，从未对齐**。
这不是"个别字段名不同"的问题——是**整个数据模型都对不上**。

---

## 一、Order接口 — 完全断裂

### 前端 `Order` interface
```ts
{
  id, title, description, material, color, quantity, fill_rate,
  status: 'submitted'|'accepted'|'printing'|'shipped'|'delivered'|'cancelled',
  file_name, file_size, notes,
  maker: { id, name, rating, completed_orders, avatar }
}
```

### 后端 `_customer_view` 实际返回
```python
{
  id, order_number, order_type, component_id, quantity, material,
  urgency, status: 'pending'|'accepted'|'printing'|'shipping'|'delivered'|'completed'|'cancelled',
  notes, price_total_cny, platform_fee_cny, maker_display(string),
  estimated_completion, created_at, updated_at
}
```

### 不匹配清单
| 前端期望 | 后端实际 | 影响 |
|----------|----------|------|
| title | ❌ 不存在 | 订单列表显示undefined |
| description | ❌ 不存在 | |
| color | ❌ 不存在 | |
| fill_rate | ❌ 不存在 | |
| file_name, file_size | ❌ 不存在 | |
| status: submitted | status: pending | 状态映射断裂 |
| status: shipped | status: shipping | 状态映射断裂 |
| maker.name/rating/avatar | maker_display (字符串) | maker信息全丢 |
| ❌ | order_number | 前端没用到 |
| ❌ | order_type | 前端没用到 |
| ❌ | urgency | 前端没用到 |
| ❌ | price_total_cny | 前端没用到 |

**结果：订单列表/详情页大部分字段显示undefined或空。**

---

## 二、CommunityPost接口 — 部分断裂

### 前端多出的字段（后端不返回）
- `author: string` — 后端返回 `author_id` + `author_name`
- `tags: string[]` — 后端不返回
- `materials: string[]` — 后端不返回
- `budget: number` — 后端不返回
- `deadline: string` — 后端不返回

### 后端多出的字段（前端没定义）
- `author_type` — user/agent区分
- `author_name` — 刚加的
- `likes_count` — 和upvotes并存
- `downvotes` — 前端没展示

---

## 三、功能断裂清单

| 功能 | 状态 | 原因 |
|------|------|------|
| 帖子投票（详情页） | ❌ 不可用→ ✅ 已修 | VoteButtons有但没接入页面 |
| 帖子投票（列表页） | ✅ 可用 | 已有onClick |
| WebSocket实时通信 | ❌ 不可用→ ⚠️ 部分修 | WS_BASE默认值已修，但前端无页面使用WS |
| Agent认领(claim) | ❌ 不可用→ ✅ 已修 | 页面不存在，已创建 |
| 订单列表显示 | ⚠️ 降级 | 字段名不匹配，显示不完整 |
| 订单详情显示 | ⚠️ 降级 | 同上 |
| 节点匹配 | ❌ 不可用 | 前端用GET，后端只支持POST |
| 评论投票 | ❌ 不可用 | 只显示数字，无onClick |
| 文件下载 | ❌ 不可用 | 后端有端点但前端没有下载按钮 |
| 用户头像 | ❌ 不可用 | 前端期望avatar字段，后端不返回 |

---

## 四、根本原因

1. **前端和后端由不同sub-agent在不同时间编写**，没有共享的API contract
2. **前端类型定义基于"理想中的API"而非"实际的API"**
3. **没有集成测试**验证前后端数据流通
4. **没有OpenAPI自动生成前端类型**（FastAPI自带OpenAPI，可以用来生成TS类型）

---

## 五、修复建议

### 立即：统一Order类型
```ts
// 基于后端实际返回
export interface Order {
  id: string;
  order_number: string;
  order_type: 'print_only' | 'full_build';
  component_id?: string;
  quantity: number;
  material?: string;
  urgency: 'normal' | 'express';
  status: 'pending' | 'accepted' | 'printing' | 'assembling' | 'quality_check' | 'shipping' | 'delivered' | 'completed' | 'cancelled';
  notes?: string;
  price_total_cny: number;
  maker_display?: string;
  estimated_completion?: string;
  created_at: string;
  updated_at: string;
}
```

### 短期：自动类型生成
```bash
# 从FastAPI OpenAPI spec生成前端类型
npx openapi-typescript https://realworldclaw-api.fly.dev/openapi.json -o lib/api-types.ts
```

### 长期：API contract testing
- 添加Playwright e2e测试
- 每次部署前验证前后端契约

---

*蛋蛋🥚 | 2026-02-24 03:10 | 这是所有bug的根源*
