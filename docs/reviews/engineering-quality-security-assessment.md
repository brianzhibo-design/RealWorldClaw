# 工程质量 & 安全评估报告

**评估日期**: 2026-02-24  
**评估人**: 蛋蛋（GM）  
**版本**: v0.1.0

---

## 总评: 6/10 — 原型级，尚未达到生产安全标准

---

## 1. 代码架构与质量

### ✅ 做得好的
- **清晰的项目结构**: platform(FastAPI) + frontend(Next.js) + SDK(Python/TS) + firmware，职责分明
- **中间件分层合理**: RequestLogging → RateLimit → CORS，有基本的请求观测能力
- **审计日志已实现**: audit.py 有结构化的审计表（who/when/action/resource/ip），含索引
- **Docker Compose 一键启动**: 降低开发者入门门槛
- **CI模板存在**: 可复用的 GitHub Actions workflow

### ⚠️ 需要改进
- **测试覆盖极低**: 仅发现 `test_integration.py` 一个测试文件，5000+ 源文件无对应单元测试
- **无 linting CI**: Makefile 有 `ruff check` 但未接入 CI pipeline
- **前端无测试**: 无 Jest/Vitest 测试文件
- **无类型检查**: Python 无 mypy，TypeScript 未见 strict mode 验证

### 🔴 严重问题
- **无数据库迁移工具**: 直接用 `CREATE TABLE IF NOT EXISTS`，生产环境 schema 变更将很危险
- **SQLite 用于生产**: Fly.io 部署使用 SQLite — 不支持并发写入、无备份策略、容器重启数据丢失

---

## 2. 安全评估

### ✅ 基本安全措施已有
- **API Key 认证**: require_auth 依赖注入，Bearer token 验证
- **启动时强制校验**: RWC_API_KEY 未设置则拒绝启动（好！）
- **Rate Limiting**: IP 级别速率限制，认证端点 10/min，普通端点 100/min
- **.env 不入 git**: .gitignore 正确排除了 .env 文件
- **CORS 白名单**: 非通配符，指定了具体域名
- **审计日志**: 有 action/user/ip/timestamp 记录

### ⚠️ 安全薄弱点
- **无 JWT/Session 体系**: 仅靠静态 API Key + 数据库查 agent key，无过期/刷新机制
- **无 HTTPS 强制**: 代码层无 HSTS header（依赖 Fly.io 平台层）
- **无输入验证/清洗层**: 未见统一的 input sanitization 中间件
- **SQL 注入风险低但需验证**: 使用参数化查询（`?` 占位符），基本安全，但需全局审查
- **无 CSRF 保护**: 前后端分离架构下风险较低，但 cookie-based auth 未来可能引入风险

### 🔴 安全红线
- **无权限模型**: 所有认证用户权限相同，无 RBAC/最小权限
- **无命令执行沙箱**: 设备控制命令（继电器动作）无二次确认、无操作范围限制
- **无固件签名**: OTA 更新通道无签名验证
- **无 E-stop 机制**: 缺少紧急停止/断网降级逻辑
- **密钥管理原始**: 单一 API Key，无密钥轮换、无多租户隔离

---

## 3. 部署与运维

### ✅ 已有
- Docker Compose 开发环境
- Fly.io 后端部署
- Vercel 前端部署
- 基础日志（structlog 风格）

### 🔴 缺失
- **无监控/告警**: 无 Prometheus/Sentry/healthcheck 告警
- **无备份策略**: SQLite 文件无定期备份
- **无蓝绿/金丝雀部署**: 直接 `fly deploy`
- **无密钥管理服务**: 硬编码环境变量，无 Vault/KMS
- **无日志聚合**: 本地 stdout，无 ELK/Loki

---

## 4. 评分明细

| 维度 | 分数 | 说明 |
|------|------|------|
| 代码结构 | 7/10 | 清晰分层，路由合理 |
| 测试覆盖 | 3/10 | 几乎无自动化测试 |
| 安全认证 | 4/10 | 有基础 API Key，缺权限模型 |
| 安全防护 | 3/10 | 无沙箱、无E-stop、无固件签名 |
| 审计与合规 | 6/10 | 有审计表，缺完整覆盖 |
| 部署运维 | 4/10 | 能跑，但无监控/备份/告警 |
| CI/CD | 5/10 | 有模板，未全面接入 |
| **综合** | **6/10** | **原型可用，生产部署前需大量加固** |

---

## 5. 优先修复建议（按风险排序）

### 立即（P0 安全）
1. **实现最小权限模型** — admin/agent/device 三级角色
2. **设备命令二次确认** — 高危操作需确认 token
3. **数据库迁移工具** — 引入 Alembic
4. **增加核心 API 测试** — 至少 auth + devices + agent 端点

### 短期（1-2周）
5. 迁移 PostgreSQL（Fly.io Postgres 或 Supabase）
6. 添加 Sentry 错误监控
7. CI 接入 lint + test + type-check
8. 实现 API Key 轮换机制

### 中期（1-2月）
9. 固件签名 + OTA 安全通道
10. E-stop 紧急停止协议
11. 断网降级本地规则引擎
12. 渗透测试

---

*本报告基于代码静态审查，未含运行时渗透测试。*
