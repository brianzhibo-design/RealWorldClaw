# RealWorldClaw 全平台修复指南

**基于5轮深层审查，52+问题，20维度评分4.5/10**  
**目标：6周内达到7.0/10**

---

## 修复优先级框架

```
P0 = 不修就出事（安全/法律/数据丢失）
P1 = 不修就没人用（核心体验断裂）
P2 = 不修就不专业（质量/品牌）
P3 = 不修也能活（优化/锦上添花）
```

---

## ═══════════════════════════════════════
## P0：不修就出事（第1周）
## ═══════════════════════════════════════

### P0-1. 合规三件套（评分 0/10 → 6/10）

**问题：** 无隐私政策、无服务条款、无Cookie声明。面向海外=法律风险。

**修复步骤：**

1. 创建 `frontend/app/privacy/page.tsx`
```
内容要点：
- 收集什么数据（邮箱、用户名、IP、上传文件）
- 如何使用（账户管理、订单匹配、平台改进）
- 是否共享（不卖给第三方，maker只看到省市不看区）
- 数据保留期（账户存续期+30天）
- 用户权利（查看、修改、删除数据的方式）
- Cookie使用（仅session token，无tracking）
- 联系方式
```

2. 创建 `frontend/app/terms/page.tsx`
```
内容要点：
- 平台性质（匹配平台，不是制造商）
- 用户责任（上传合法文件、真实信息）
- Maker责任（质量、按时交付）
- 平台责任（匹配、隐私保护，不保证制造质量）
- 知识产权（用户保留文件所有权）
- 争议处理（先协商，后仲裁）
- 免责声明
- 终止条款
```

3. 注册页面添加条款checkbox
```tsx
// frontend/app/auth/register/page.tsx
<label className="flex items-center gap-2 text-sm text-slate-400">
  <input type="checkbox" required ... />
  I agree to the <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Service</Link>
</label>
```

4. Header/Footer添加链接

**负责人：** ☀️喜羊羊（文案） + 🎀美羊羊（页面）  
**预计工时：** 4h  

---

### P0-2. 注册安全加固（评分提升安全维度）

**问题：** 密码无最小长度、无注册频率限制、无登录暴力破解防护

**修复步骤：**

1. 添加密码验证到 `UserRegisterRequest`
```python
# platform/api/routers/auth.py — register函数开头
class UserRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
```

2. 添加注册频率限制
```python
# platform/api/routers/auth.py
from ..rate_limit import rate_limit

@router.post("/register")
@rate_limit(max_calls=5, period=3600)  # 5次/小时
def register(req: UserRegisterRequest): ...

@router.post("/login")
@rate_limit(max_calls=20, period=300)  # 20次/5分钟
def login(req: LoginRequest): ...
```

3. 登录失败延迟
```python
# platform/api/routers/auth.py — login函数
import time
# 在密码验证失败后：
time.sleep(1)  # 简单但有效——暴力破解变慢60倍
raise HTTPException(401, "Invalid credentials")
```

4. 前端密码强度提示
```tsx
// 注册页面添加实时密码强度指示器
// 至少8位、包含数字、包含字母
```

**负责人：** 🐺小灰灰（后端） + 🎀美羊羊（前端提示）  
**预计工时：** 3h  

---

### P0-3. 竞态条件修复

**问题：** accept_order无锁，两个maker同时接单会冲突

**修复步骤：**

```python
# platform/api/routers/orders.py — accept_order
def accept_order(order_id: str, ...):
    with get_db() as db:
        # SQLite默认DEFERRED事务，改为IMMEDIATE确保写锁
        db.execute("BEGIN IMMEDIATE")
        row = db.execute("SELECT * FROM orders WHERE id = ? AND status = 'pending'", (order_id,)).fetchone()
        if not row:
            db.execute("ROLLBACK")
            raise HTTPException(400, "Order already accepted or not found")
        # ... 正常接单逻辑
        db.execute("COMMIT")
```

**负责人：** 🐺小灰灰  
**预计工时：** 1h  

---

### P0-4. XSS防护

**问题：** 帖子/评论内容不做sanitize

**修复步骤：**

1. 安装bleach: `pip install bleach`
2. 在community.py创建sanitize helper:
```python
import bleach
ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'code', 'pre', 'br']
ALLOWED_ATTRS = {'a': ['href', 'title']}

def sanitize(text: str) -> str:
    return bleach.clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)
```
3. 在create_post和create_comment中调用sanitize

**负责人：** 🐺小灰灰  
**预计工时：** 1h  

---

### P0-5. 数据库备份

**问题：** SQLite单点，无备份

**修复步骤：**

1. 创建备份脚本 `platform/scripts/backup.sh`
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 /app/data/realworldclaw.db ".backup /app/data/backups/rwc_${DATE}.db"
# 保留最近7天
find /app/data/backups/ -name "*.db" -mtime +7 -delete
```

2. 在fly.toml添加定时任务或用cron
3. 考虑备份到S3/R2（长期）

**负责人：** 🗡️刀羊  
**预计工时：** 2h  

---

## ═══════════════════════════════════════
## P1：不修就没人用（第2-3周）
## ═══════════════════════════════════════

### P1-1. 前后端Order契约统一（最大的体验问题）

**问题：** Order interface完全不匹配，订单页面大部分字段undefined

**修复步骤：**

1. 以后端为准，重写前端Order interface（已完成初版）

2. 修改所有使用Order的页面：
```
文件清单：
- app/orders/page.tsx — 列表页
- app/orders/[id]/page.tsx — 详情页
- app/orders/new/page.tsx — 创建页
- app/maker-orders/page.tsx — Maker接单页
- app/dashboard/page.tsx — 仪表盘订单统计
```

3. 每个页面逐一检查：
```tsx
// 旧: order.title (不存在)
// 新: order.order_number

// 旧: order.status === 'submitted'
// 新: order.status === 'pending'

// 旧: order.maker?.name
// 新: order.maker_display

// 旧: order.file_name
// 新: order.file_id ? `File: ${order.file_id.slice(0,8)}` : 'No file'
```

4. 添加statusMapping统一处理
```tsx
const STATUS_LABELS: Record<string, string> = {
  pending: 'Submitted',
  accepted: 'Accepted',
  printing: 'Printing',
  assembling: 'Assembling',
  quality_check: 'QC',
  shipping: 'Shipping',
  delivered: 'Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
```

**负责人：** 🎀美羊羊  
**预计工时：** 6h  

---

### P1-2. CommunityPost契约统一

**修复步骤：**

1. 前端CommunityPost interface已更新（有author_name/downvotes等）

2. 修改所有显示author的地方：
```tsx
// 旧: post.author
// 新: post.author_name || post.author_id?.slice(0, 8) || 'Anonymous'
```

3. 检查所有用到tags/budget/deadline的地方——这些后端不返回，用optional渲染：
```tsx
{post.tags && post.tags.length > 0 && <Tags tags={post.tags} />}
```

**负责人：** 🎀美羊羊  
**预计工时：** 3h  

---

### P1-3. 空状态全面接入

**问题：** EmptyState/ErrorState做了但21个页面没用

**修复步骤：**

对每个列表页添加：
```tsx
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

// 在渲染逻辑中:
if (error) return <ErrorState message={error} />;
if (!loading && items.length === 0) return <EmptyState 
  icon="📦" 
  title="No orders yet" 
  description="Create your first order to get started" 
/>;
```

需要修改的页面（21个）：
```
agents, community, components, dashboard, maker-orders,
map, orders, register-node, settings, spaces,
agents/register, auth/login, auth/register, community/new,
makers/register, nodes/[id], orders/[id], orders/new,
profile/[id], spaces/[name], search
```

**负责人：** 🐑暖羊羊  
**预计工时：** 4h  

---

### P1-4. 自定义404/Error/Loading页面

**修复步骤：**

1. `frontend/app/not-found.tsx`
```tsx
export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-sky-400 mb-4">404</h1>
        <p className="text-xl text-slate-400 mb-8">Page not found</p>
        <Link href="/" className="px-6 py-3 bg-sky-600 text-white rounded-lg">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
```

2. `frontend/app/error.tsx` — 类似但显示"Something went wrong"
3. `frontend/app/loading.tsx` — 骨架屏或spinner

**负责人：** 🎀美羊羊  
**预计工时：** 2h  

---

### P1-5. SEO基础修复

**问题：** 25个页面同一title、无OG标签、无favicon、Sitemap只有3个URL

**修复步骤：**

1. 每个页面添加metadata:
```tsx
// frontend/app/map/page.tsx
export const metadata = {
  title: "Manufacturing Map — RealWorldClaw",
  description: "Explore 3D printers and manufacturing nodes worldwide",
};
// 注意: 'use client'页面不能export metadata，需改用generateMetadata或在layout中设置
```

2. 添加favicon — 用现有logo生成:
```bash
# 放到 frontend/public/favicon.ico 和 /favicon.svg
```

3. 添加OG标签到layout.tsx:
```tsx
export const metadata = {
  openGraph: {
    title: 'RealWorldClaw — Global Manufacturing Network',
    description: '...',
    images: ['/og-image.png'],
    siteName: 'RealWorldClaw',
  },
  twitter: { card: 'summary_large_image' },
};
```

4. 更新sitemap.xml — 包含所有静态页面路由

**负责人：** ☀️喜羊羊（文案+sitemap） + 🎀美羊羊（实现）  
**预计工时：** 4h  

---

### P1-6. skill.md诚实化

**问题：** 60%虚假承诺

**修复步骤：**

重写 `frontend/public/.well-known/skill.md`，只写实际可用的功能：

```markdown
# RealWorldClaw API

## What you can do:
- Register as an AI agent (POST /agents/register)
- Post in community (POST /community/posts)
- Comment and vote
- Browse manufacturing nodes (GET /nodes/map)
- Create print orders (POST /orders)
- Upload STL/3MF files (POST /files/upload)
- Register your 3D printer as a node (POST /nodes/register)

## What's coming soon:
- AI design assistant
- Automated manufacturability check
- Real-time order tracking (WebSocket)
- Review system
```

**负责人：** 🐏沸羊羊（调研实际能力） + ☀️喜羊羊（文案）  
**预计工时：** 2h  

---

### P1-7. 通知系统（最小可用版）

**问题：** 订单状态变更无通知，maker不知道有新单

**修复步骤（最小版 — 邮件通知）：**

1. 添加邮件发送（用免费的Resend或smtp）:
```python
# platform/api/notifications.py
import smtplib
from email.mime.text import MIMEText

async def send_email(to: str, subject: str, body: str):
    # 用Resend API (免费100封/天)
    pass
```

2. 在关键节点发邮件：
```
- 新订单创建 → 通知匹配到的maker
- 订单被接受 → 通知customer
- 订单状态变更 → 通知双方
- 订单完成 → 邀请评价
```

3. 用户设置页面添加通知偏好

**负责人：** 🐺小灰灰（后端） + 🎀美羊羊（设置页面）  
**预计工时：** 8h  

---

### P1-8. 定价引擎（最小版）

**问题：** 所有订单price=0

**修复步骤：**

```python
# platform/api/pricing.py
def estimate_price(
    material: str,
    quantity: int, 
    maker_rate: float,  # 元/小时
    estimated_hours: float = 2.0,  # 默认2小时/件
    urgency: str = "normal"
) -> dict:
    base = maker_rate * estimated_hours * quantity
    urgency_mult = 1.5 if urgency == "express" else 1.0
    total = round(base * urgency_mult, 2)
    return {
        "estimated_price_cny": total,
        "breakdown": {
            "base_rate": maker_rate,
            "hours_per_unit": estimated_hours,
            "quantity": quantity,
            "urgency_multiplier": urgency_mult,
        }
    }
```

在订单创建时调用，显示给用户确认。

**负责人：** 🐺小灰灰（后端） + 🐏沸羊羊（定价调研）  
**预计工时：** 6h  

---

## ═══════════════════════════════════════
## P2：不修就不专业（第4-5周）
## ═══════════════════════════════════════

### P2-1. 可访问性提升（3/10 → 6/10）

**修复步骤：**

1. 批量添加aria-label（87个button）:
```bash
# 找到所有缺aria-label的button
grep -rn "<button" app/ --include="*.tsx" | grep -v "aria-label"
# 对每个按钮添加描述性label
```

2. 颜色对比度修复（61处text-slate-500）:
```css
/* 把 text-slate-500 → text-slate-400 (对比度4.5+) */
/* 全局替换或在需要的地方 */
```

3. 添加focus-visible样式到全局CSS:
```css
/* frontend/app/globals.css */
*:focus-visible {
  outline: 2px solid #38bdf8;
  outline-offset: 2px;
}
```

**负责人：** 🎀美羊羊  
**预计工时：** 6h  

---

### P2-2. 前端代码统一

**修复步骤：**

1. 统一fetch模式 — 14处直接fetch改为apiFetch:
```bash
grep -rn "fetch(\`\${API" app/ --include="*.tsx"
# 每个改为 apiFetch(path, options)
```

2. 统一localStorage → authStore:
```bash
grep -rn "localStorage" app/ --include="*.tsx"
# 改为 useAuthStore()
```

3. 清除console.log:
```bash
grep -rn "console\." app/ --include="*.tsx" 
# 删除或改为条件调试
```

4. 清理unused依赖:
```bash
npm uninstall d3-geo d3-geo-projection @types/d3-geo
```

**负责人：** 🐑暖羊羊  
**预计工时：** 4h  

---

### P2-3. 后端日志系统

**问题：** 整个后端仅7条日志

**修复步骤：**

```python
# 在每个路由文件开头:
import logging
logger = logging.getLogger(__name__)

# 关键位置加日志:
# - 每次请求开始（INFO）
# - 认证失败（WARNING）
# - 数据库操作失败（ERROR）
# - 关键业务操作（INFO: 创建订单、接单、状态变更）
```

**负责人：** 🐺小灰灰  
**预计工时：** 3h  

---

### P2-4. 国际化准备（2/10 → 4/10）

**修复步骤（最小版 — 不装i18n框架）：**

1. 创建 `frontend/lib/messages.ts`:
```ts
export const messages = {
  en: {
    'nav.home': 'Home',
    'nav.map': 'Map',
    'empty.orders': 'No orders yet',
    'empty.posts': 'No posts yet',
    // ...
  }
};
// 暂时只做英文，但所有文本集中管理
// 后续加中文只需添加 zh 对象
```

2. 清理后端中文字符串:
```python
# "待匹配" → "Pending match"
# "客户" → "customer"  
# "制造商" → "maker"
```

**负责人：** ☀️喜羊羊  
**预计工时：** 6h  

---

### P2-5. Landing Page提升（4/10 → 7/10）

**修复步骤：**

1. 添加"How it works"三步骤:
```
Step 1: Upload your design (STL, 3MF, or sketch)
Step 2: Get matched with a nearby maker
Step 3: Receive your creation
```

2. 添加stats section（用真实数据）:
```tsx
// 从 /stats API获取实时数据
<div>
  <span>{stats.makers} Makers</span>
  <span>{stats.nodes} Machines</span>
  <span>{stats.orders} Orders Completed</span>
</div>
```

3. 添加FAQ section

4. Footer添加Privacy/Terms链接

**负责人：** 🌸花羊羊（设计） + 🎀美羊羊（实现）  
**预计工时：** 6h  

---

### P2-6. 外键约束 + 索引补全

**修复步骤：**

```sql
-- platform/api/database.py init_db()

-- 添加到表创建后:
-- (SQLite不支持ALTER TABLE ADD FOREIGN KEY,
--  但可以在新建表时加入，或用触发器模拟)

-- 通过触发器防止孤儿数据:
CREATE TRIGGER IF NOT EXISTS fk_orders_customer
    BEFORE INSERT ON orders
    WHEN NEW.customer_id NOT IN (SELECT id FROM users)
    BEGIN
        SELECT RAISE(ABORT, 'Foreign key violation: customer_id');
    END;

-- 补充索引:
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_comments_post ON community_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
```

**负责人：** 🐺小灰灰  
**预计工时：** 3h  

---

## ═══════════════════════════════════════
## P3：锦上添花（第6周+）
## ═══════════════════════════════════════

### P3-1. CI/CD完善
- GitHub Actions添加前端build检查
- 添加自动部署到Vercel/Fly.io
- 添加Playwright e2e测试（至少覆盖注册→登录→创建订单）

### P3-2. 监控
- Sentry集成（前端+后端）
- Fly.io metrics dashboard
- Uptime监控（UptimeRobot免费版）

### P3-3. 性能优化
- API响应时间从~1s降到<300ms
- 前端SSR关键页面（首页、地图）
- 数据库连接复用

### P3-4. PWA
- manifest.json
- Service Worker
- 离线缓存策略

### P3-5. 评价系统UI
- POST /orders/{id}/review 已存在
- 添加前端评价表单（星级+文字）
- 添加maker profile页面显示评价

### P3-6. SECURITY.md + CHANGELOG.md
- 安全漏洞报告流程
- 版本变更记录

### P3-7. 架构文档
- 系统架构图（Mermaid）
- 数据流图
- 部署拓扑图

---

## 执行看板

### 第1周 — P0（安全/合规）
| 任务 | 负责人 | 工时 | 状态 |
|------|--------|------|------|
| P0-1 合规三件套 | ☀️+🎀 | 4h | ⬜ |
| P0-2 注册安全加固 | 🐺+🎀 | 3h | ⬜ |
| P0-3 竞态条件修复 | 🐺 | 1h | ⬜ |
| P0-4 XSS防护 | 🐺 | 1h | ⬜ |
| P0-5 数据库备份 | 🗡️ | 2h | ⬜ |

### 第2-3周 — P1（核心体验）
| 任务 | 负责人 | 工时 | 状态 |
|------|--------|------|------|
| P1-1 Order契约统一 | 🎀 | 6h | ⬜ |
| P1-2 Post契约统一 | 🎀 | 3h | ⬜ |
| P1-3 空状态接入×21页 | 🐑 | 4h | ⬜ |
| P1-4 404/Error/Loading | 🎀 | 2h | ⬜ |
| P1-5 SEO基础 | ☀️+🎀 | 4h | ⬜ |
| P1-6 skill.md诚实化 | 🐏+☀️ | 2h | ⬜ |
| P1-7 邮件通知 | 🐺+🎀 | 8h | ⬜ |
| P1-8 定价引擎 | 🐺+🐏 | 6h | ⬜ |

### 第4-5周 — P2（专业度）
| 任务 | 负责人 | 工时 | 状态 |
|------|--------|------|------|
| P2-1 a11y提升 | 🎀 | 6h | ⬜ |
| P2-2 前端代码统一 | 🐑 | 4h | ⬜ |
| P2-3 后端日志 | 🐺 | 3h | ⬜ |
| P2-4 i18n准备 | ☀️ | 6h | ⬜ |
| P2-5 Landing提升 | 🌸+🎀 | 6h | ⬜ |
| P2-6 外键+索引 | 🐺 | 3h | ⬜ |

### 第6周+ — P3（优化）
| 任务 | 负责人 | 工时 | 状态 |
|------|--------|------|------|
| P3-1 CI/CD | 🐑 | 8h | ⬜ |
| P3-2 监控 | 🐺 | 4h | ⬜ |
| P3-3 性能 | 🐺+🎀 | 8h | ⬜ |
| P3-4 PWA | 🎀 | 4h | ⬜ |
| P3-5 评价UI | 🎀 | 4h | ⬜ |
| P3-6 SECURITY+CHANGELOG | ☀️ | 2h | ⬜ |
| P3-7 架构文档 | 🧓慢羊羊 | 4h | ⬜ |

---

## 工作量汇总

| 优先级 | 任务数 | 总工时 | 周期 |
|--------|--------|--------|------|
| P0 | 5 | 11h | 第1周 |
| P1 | 8 | 35h | 第2-3周 |
| P2 | 6 | 28h | 第4-5周 |
| P3 | 7 | 34h | 第6周+ |
| **总计** | **26** | **108h** | **~6周** |

### 人员负载
| 角色 | P0 | P1 | P2 | P3 | 总计 |
|------|----|----|----|----|------|
| 🎀美羊羊 | 3h | 19h | 10h | 12h | 44h |
| 🐺小灰灰 | 3h | 14h | 9h | 12h | 38h |
| ☀️喜羊羊 | 2h | 4h | 6h | 2h | 14h |
| 🐑暖羊羊 | - | 4h | 4h | 8h | 16h |
| 🌸花羊羊 | - | - | 3h | - | 3h |
| 🐏沸羊羊 | - | 4h | - | - | 4h |
| 🗡️刀羊 | 2h | - | - | - | 2h |
| 🧓慢羊羊 | - | - | - | 4h | 4h |

---

## 评分目标

| 维度 | 当前 | P0后 | P1后 | P2后 | P3后 |
|------|------|------|------|------|------|
| 安全 | 3 | **7** | 7 | 8 | 9 |
| 合规 | 0 | **6** | 6 | 6 | 7 |
| 契约 | 3 | 3 | **8** | 9 | 9 |
| 空状态 | 1 | 1 | **8** | 8 | 9 |
| SEO | 2 | 2 | **6** | 7 | 8 |
| a11y | 3 | 3 | 3 | **6** | 7 |
| i18n | 2 | 2 | 2 | **4** | 6 |
| Landing | 4 | 4 | **6** | **7** | 8 |
| 代码质量 | 5 | 5 | 6 | **7** | 8 |
| 架构 | 4 | **5** | 5 | 6 | 7 |
| **总分** | **~4.5** | **~5.5** | **~6.5** | **~7.0** | **~8.0** |

---

*蛋蛋🥚 | 2026-02-24 | 108小时，26个任务，8个人，6周*
