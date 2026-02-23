# 企业级标准审查报告

**审查人:** 蛋蛋🥚（总经理亲审）  
**日期:** 2026-02-23 23:19  
**范围:** 前端(Next.js) + 后端(FastAPI) + 部署 + 安全 + 代码质量

---

## 评分总览

| 维度 | 评分 | 说明 |
|------|------|------|
| 🔒 安全 | **C** | JWT硬编码fallback、Google token无签名验证、SQL用f-string |
| 🏗️ 架构 | **B** | 双轨认证设计合理，但API模块仍有冗余 |
| 📐 代码质量 | **B-** | 编译无错，但有`any`类型、重复API_BASE定义 |
| 🎨 UX/UI | **B+** | 深色科技风一致，双轨登录页有特色 |
| ⚡ 性能 | **B+** | 页面JS大小合理(最大136kB/map)，API响应快 |
| 🧪 测试 | **D** | 后端有测试，前端零测试 |
| 📦 部署 | **A-** | 前端Vercel+后端Fly.io，CI未配置 |
| 📚 文档 | **B** | API自动文档86端点，缺少开发者指南 |

**综合评级: B-（可用但需加固）**

---

## 🔴 严重问题（P0）

### S1. JWT Secret Key 硬编码 Fallback
**文件:** `platform/api/security.py:12`
```python
SECRET_KEY = os.environ.get("JWT_SECRET_KEY", os.environ.get("SECRET_KEY", "dev-secret-change-me"))
```
- 如果环境变量未设置，使用硬编码字符串，任何人可伪造JWT
- **状态:** Fly.io已通过`flyctl secrets set`配置，但代码fallback不安全
- **修复:** 无环境变量时应抛异常而非使用默认值

### S2. Google ID Token 无签名验证
**文件:** `platform/api/routers/auth.py` (google_auth)
- 使用 `get_unverified_claims()` 解码Google JWT，不验证签名
- 攻击者可伪造任意Google账号登录
- **修复:** 使用 `google-auth` 库的 `verify_oauth2_token()`

### S3. NPM 依赖漏洞
- **25个漏洞**（1 moderate, 24 high）
- **修复:** `npm audit fix`

---

## 🟡 重要问题（P1）

### C1. Search页重复定义 API_BASE
**文件:** `app/search/page.tsx:7`
```
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
```
美羊羊迁移API模块时漏了这个文件。应改为 `import { API_BASE } from "@/lib/api-client"`

### C2. lib/nodes.ts 独立 API_URL
**文件:** `lib/nodes.ts:6`
同上，有独立的 `API_URL` 定义，应统一

### C3. SQL f-string 注入风险
**文件:** 多个路由使用 f-string 构建SQL
- `auth.py:142` — `f"UPDATE users SET {set_clause}"`
- `posts.py:70` — `f"SELECT ... {where} ORDER BY {order}"`
- `orders.py:209` — `f"SELECT ... WHERE maker_id IN ({placeholders})"`
- 虽然values用了参数化，但column名和order来自代码内部（非用户输入），风险可控
- **评估:** 低风险（非直接用户输入），但不符合最佳实践

### C4. `any` 类型滥用
- dashboard: 10处 `any`
- register-node: 3处
- search: 1处
- 降低了TypeScript的类型安全价值

### C5. Spaces/Topics TODO残留
**文件:** `app/spaces/page.tsx:97`
```
return 0; // TODO: fetch real member count from API
```

### C6. Homepage Math.random
**文件:** `app/page.tsx:207-212`
- 用于地图节点动画的微移动效果（非假数据，是UI动画）
- **评估:** 可接受，但应加注释说明

---

## 🟢 良好实践

### ✅ 通过的检查项
1. **编译零错误** — `npm run build` 通过
2. **零mock数据** — grep确认app/目录无MOCK/fake/dummy常量
3. **零console.log** — 生产代码无调试日志
4. **认证保护完整** — 9个需认证页面全部有保护
5. **Token统一** — 所有页面使用 `auth_token` fallback
6. **CORS配置** — 从环境变量读取，非硬编码通配符
7. **密码哈希** — 使用bcrypt，正确实现
8. **双轨认证** — User JWT + Agent API Key 统一在 `get_authenticated_identity`
9. **API文档** — 86端点自动生成OpenAPI
10. **.env不在git中** — .env.local和.env.production未被track

---

## 📋 修复计划

### 立即修（P0，安全相关）

| # | 问题 | 负责人 | 预计 |
|---|------|--------|------|
| F1 | JWT fallback → 无环境变量时抛异常 | 🐺小灰灰 | 10min |
| F2 | Google token签名验证 | 🐺小灰灰 | 20min |
| F3 | npm audit fix | 🎀美羊羊 | 5min |

### 尽快修（P1，代码质量）

| # | 问题 | 负责人 | 预计 |
|---|------|--------|------|
| F4 | search页/nodes.ts API_BASE统一 | 🎀美羊羊 | 5min |
| F5 | TypeScript any → 正确类型 | 🎀美羊羊 | 30min |
| F6 | Spaces TODO清理 | 🐑暖羊羊 | 5min |

### 计划修（P2，架构改进）

| # | 问题 | 负责人 | 预计 |
|---|------|--------|------|
| F7 | 前端测试（至少核心流程e2e） | 🐑暖羊羊 | 2h |
| F8 | GitHub Actions CI | 🎀美羊羊 | 1h |
| F9 | SQL查询用参数化替代f-string | 🐺小灰灰 | 1h |

---

*蛋蛋🥚 | 2026-02-23 23:19 | 企业级标准审查*
