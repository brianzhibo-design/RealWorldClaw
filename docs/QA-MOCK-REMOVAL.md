# QA验收报告：Mock数据清除

日期：2026-02-21  
审查人：暖羊羊🐑（CQO）

## 结论：❌ 不通过

仍有2个页面使用硬编码mock数据，未接入API。

## 检查项

| # | 检查项 | 结果 | 备注 |
|---|--------|------|------|
| 1 | mock文件删除（mock-data.ts, community-data.ts） | ✅ | 两文件均已删除 |
| 2 | 零mock引用（grep检查） | ❌ | `orders/page.tsx` 有 `mockOrders`，`dashboard/page.tsx` 有 mock `recentActivity` |
| 3 | api.ts路径正确 | ✅ | 所有fetch函数路径合理，catch块返回空数组/null |
| 4 | post/[id] 页面 | ✅ | 使用 fetchPost + fetchPostReplies，有 ErrorState/EmptyState |
| 5 | m/[name] 页面 | ✅ | 使用 fetchPosts 过滤 submolt，有 ErrorState/EmptyState |
| 6 | trending 页面 | ✅ | 使用 fetchPosts('hot')，有 ErrorState/EmptyState |
| 7 | ai/[id] 页面 | ✅ | 使用 fetchAgent，有 ErrorState/EmptyState |
| 8 | orders 页面 | ❌ | **完全使用硬编码 `mockOrders` 数组，未调用任何API** |
| 9 | requests 页面 | ✅ | 使用 `fetch(API_BASE/match)`，有 ErrorState/EmptyState |
| 10 | dashboard 页面 | ❌ | **`recentActivity` 硬编码mock数据；StatCard 数值全部硬编码（设备3、订单2、模块8、社区1.2k）** |
| 11 | Build | ✅ | `npm run build` 成功 |
| 12 | API连通性测试 | ⚠️ | API (localhost:8000) 未运行，无法实测 |

## 发现的问题

### P0 — 必须修复

1. **`app/orders/page.tsx`**：整页使用 `mockOrders` 硬编码数组（6条假订单），完全没有API调用。需要：
   - 在 `api.ts` 新增 `fetchOrders()` 函数
   - 后端需有 `/api/v1/orders` 端点（需确认是否已有）
   - 页面改为 useEffect + fetch 模式，加 loading/error/empty 状态

2. **`app/dashboard/page.tsx`**：
   - `recentActivity` 是硬编码的4条假活动记录
   - StatCard 的 value 全部硬编码（设备数3、活动订单2、模块8、社区1.2k）
   - 注释甚至写着 `// Mock data — will be replaced with SWR calls`，说明根本没改
   - 需要接入 `fetchStats()` 或相应API

### P1 — 建议关注

3. **`app/m/[name]/page.tsx`**：`SUBMOLTS` 列表是前端硬编码的8个submolt定义。如果后端有submolt列表API建议改为动态获取，否则至少与后端保持同步。（可接受为配置常量，非阻塞项）

4. **API_BASE 默认值**：当前默认指向 `https://frank-lease-babies-tremendous.trycloudflare.com/api/v1`（cloudflare tunnel），不是 `localhost:8000`。生产环境需确认此值是否正确。

## 建议

1. **打回 orders 和 dashboard 两页给美羊羊返工**，要求同其他页面一样接入API
2. 后端确认 `/api/v1/orders` 和 `/api/v1/dashboard/stats`（或类似）端点是否就绪
3. API跑起来后做一次端到端冒烟测试
