# 🐑 QA Audit Report — Pre-Deploy

**审查员：** 暖羊羊🐑（质量部）  
**日期：** 2026-02-21  
**范围：** 后端 platform/ + 前端 frontend/ + 配置文件 + 文档  
**结论：** 🔴 **有 3 个 Critical 问题必须修复后才能上线**

---

## 🔴 Critical（必须修）

### C1. 硬编码测试 API Key — `platform/api/auth.py:10`

```python
_VALID_API_KEYS = {"rwc-test-key-2026"}
```

硬编码的测试密钥会直接部署到生产环境，任何人都可以用这个 key 获得完整 API 访问权限。代码里的 `TODO` 注释说明开发者知道这个问题但没修。

**修复：** 从环境变量读取，或删除硬编码集合，仅使用数据库 agent API key 验证。

---

### C2. 无 CORS 中间件配置

后端 `api/main.py` 中 **没有任何 CORS 配置**。`grep` 搜索全部后端 Python 文件未找到任何 CORS 相关代码。

- `.env.example` 中定义了 `CORS_ORIGINS` 但从未使用
- 前端 Vercel 部署后将无法调用后端 API（跨域被阻止）
- 或者更危险：如果部署环境默认允许所有来源

**修复：** 在 `main.py` 中添加 `CORSMiddleware`：
```python
from fastapi.middleware.cors import CORSMiddleware
import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### C3. API 文档与实际端点不一致 — "Print Farms" vs "Makers"

API 文档 `docs/api-reference.md` Section 4 仍使用旧名 **"Print Farms"**，路径为 `/api/v1/farms/*`。但实际代码已重构为 **"Makers"**，路径为 `/api/v1/makers/*`。

文档中的路由名、参数名、响应结构均与代码不符，第三方集成将全部失败。

**修复：** 更新 Section 4 全部内容，`farms` → `makers`，字段名同步更新。

---

## 🟡 Warning（建议修）

### W1. `SECRET_KEY` 在 `.env.example` 中值为 `change-me-in-production`

虽然是示例文件，但如果部署时忘记改（常见），会导致安全隐患。目前代码中未看到 SECRET_KEY 的实际使用，但既然定义了就应该用起来或删除。

### W2. fly.toml 中 `min_machines_running = 0`

冷启动会导致首次请求延迟 5-15 秒。对于 API 服务，建议至少 `min_machines_running = 1`。

### W3. SQLite 用于生产环境

`fly.toml` 中 `DATABASE_URL = "sqlite:///data/realworldclaw.db"`。Fly.io 的 volume 在机器重启时可能丢失数据。SQLite 也不支持并发写入。

MVP 阶段可接受，但应在 README 中明确标注这是临时方案。

### W4. `stats` 端点返回字段与文档不一致

文档显示 stats 返回 `{components, agents}`，但实际代码返回 `{components, agents, makers, orders}`。

### W5. 前端 `fetchStats()` 未使用实际 `/api/v1/stats` 端点

`frontend/lib/api.ts` 中 `fetchStats()` 注释说"后端暂无 /stats 端点"，但实际后端已有。导致前端多发两个请求且 agents 数固定为 0。

### W6. 前端 API 路径缺少 `/api/v1` 前缀

`frontend/lib/api.ts` 中请求路径为 `/components`、`/makers` 等，但后端路由注册在 `/api/v1` 前缀下。前端在 dev 模式通过 rewrite 可能工作，但生产环境会 404。

### W7. `requirements.txt` 无版本上限锁定

```
fastapi>=0.109.0
uvicorn[standard]>=0.27.0
```

建议使用 `pip freeze` 生成精确版本或添加上限（如 `<1.0.0`），避免未来破坏性更新。

### W8. Dockerfile 以 root 运行

未设置 `USER` 指令，容器内进程以 root 运行。建议添加非特权用户。

### W9. 订单号生成有碰撞风险

```python
seq = random.randint(1000, 9999)
return f"RWC-{now.strftime('%Y%m%d')}-{seq}"
```

同一天内 9000 个可能值，高并发下会碰撞。`order_number` 有 UNIQUE 约束会抛异常但没重试逻辑。

### W10. `match` 端点无认证

`POST /api/v1/match` 是公开的，可被滥用进行大量查询。建议添加 rate limiting 或基本认证。

---

## 🟢 Good（做得好的）

### G1. 隐私保护设计 ✅

订单系统的隐私分层做得很好：
- `_customer_view` 隐藏 Maker 真实身份
- `_maker_view` 隐藏买家详细地址（只显示省市）
- 消息中转使用角色显示名（"客户"/"制造商"）

### G2. SQL 注入防护 ✅

所有数据库查询均使用参数化查询（`?` 占位符），没有字符串拼接 SQL。

### G3. Pydantic 输入验证 ✅

所有 API 端点都使用 Pydantic schema 进行输入验证，包括：
- 字段长度限制（`min_length`, `max_length`）
- 正则模式（`pattern=r"^[a-z0-9-]+$"`）
- 数值范围（`ge=1`, `le=100`）
- 枚举类型约束

### G4. 订单状态机 ✅

`orders.py` 中的 `valid_transitions` 字典实现了严格的状态流转控制，防止非法状态变更。

### G5. 权限控制完善 ✅

- Maker 只能更新自己的 profile（`owner_id` 校验）
- 只有 customer 能确认收货和评价
- 只有 maker 能更新订单状态和物流信息
- Agent 必须 active 才能发帖/上传组件

### G6. 前端无 XSS 风险 ✅

前端代码未使用 `dangerouslySetInnerHTML`，React 默认转义防止 XSS。

### G7. API Key 生成安全 ✅

使用 `secrets.token_hex()` 生成 API key 和 claim token，密码学安全。

### G8. 前端 API 地址使用环境变量 ✅

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
```

### G9. Manifest 验证器完善 ✅

独立的 schema 验证 + 文件存在性检查 + 完整度评分，可在上传时自动质检。

---

## 📋 上线前 Checklist

| # | 任务 | 优先级 | 状态 |
|---|------|--------|------|
| 1 | 移除 `auth.py` 中硬编码 API key | 🔴 必须 | ⬜ |
| 2 | 添加 CORS 中间件 | 🔴 必须 | ⬜ |
| 3 | 更新 API 文档 farms → makers | 🔴 必须 | ⬜ |
| 4 | 修复前端 API 路径前缀 | 🟡 建议 | ⬜ |
| 5 | 前端 fetchStats 对接真实端点 | 🟡 建议 | ⬜ |
| 6 | Dockerfile 添加非 root 用户 | 🟡 建议 | ⬜ |
| 7 | 锁定 Python 依赖版本 | 🟡 建议 | ⬜ |

---

*暖羊羊🐑 质量部出品 — 安全上线，人人有责 🛡️*
