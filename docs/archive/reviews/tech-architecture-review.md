# 技术架构深度评估报告

> 审查人：蛋蛋（GM） | 日期：2026-02-23  
> 评分方法：基于代码实际审查，非自我汇报

---

## 总体评分：6.5/10

架构基础扎实，但存在若干需在 v1.0 前解决的结构性风险。

---

## ✅ 优势

### 1. 协议设计合理（8/10）
- `specs/protocol-v0.1.md` 定义清晰：manifest YAML → capability schema → command/telemetry JSON
- 模块类型枚举（sensor/actuator/display/compute）覆盖主要场景
- 权限分级（public/authenticated/admin）已内置
- 版本兼容策略已声明

### 2. API 结构规范（7/10）
- FastAPI + Pydantic schema，类型安全
- 23+ 路由模块，按领域清晰拆分
- 设备认证使用独立 device_token，与用户 JWT 分离
- 审计日志（audit.py）已内置 SQLite 表 + 索引
- 速率限制（rate_limit.py）已实现滑动窗口

### 3. 安全基础已打（6/10）
- JWT access+refresh token 分离，15min/7d 过期
- bcrypt 密码哈希
- CORS 白名单配置
- 设备 token 独立验证链路

### 4. SDK 双语言覆盖
- Python SDK + TypeScript SDK 均已发布
- TS SDK zero-dep，适合嵌入

---

## ⚠️ 风险与建议

### 风险1：SQLite 单点瓶颈（严重度：中高）
- **现状**：生产环境使用 SQLite（`sqlite:///data/realworldclaw.db`）
- **问题**：写并发受限，单文件无法水平扩展，Fly.io 上磁盘挂载有限制
- **建议**：P2 阶段迁移至 PostgreSQL；当前阶段可接受但需在架构文档中标注为已知限制

### 风险2：JWT Secret 硬编码回退（严重度：高）
- **现状**：`SECRET_KEY = os.environ.get("JWT_SECRET_KEY", os.environ.get("SECRET_KEY", "dev-secret-change-me"))`
- **问题**：如果环境变量未设置，生产环境将使用默认密钥，任何人可伪造 token
- **建议**：启动时检查环境变量，缺失则拒绝启动（fail-fast）

### 风险3：设备到云通信无 TLS 强制（严重度：中）
- **现状**：ESP32 固件层面未见 TLS 证书钉扎或强制 HTTPS
- **问题**：device_token 可被中间人截获
- **建议**：文档中明确标注"当前不适用于安全敏感场景"；v1.0 前加入 TLS 要求

### 风险4：速率限制仅内存态（严重度：低）
- **现状**：`_TokenBucket` 基于进程内存，多实例部署时无效
- **问题**：水平扩展后速率限制形同虚设
- **建议**：当前单实例部署可接受；扩展时需引入 Redis

### 风险5：WebSocket 心跳但无重连策略（严重度：中）
- **现状**：`ws_manager.py` 有心跳机制
- **问题**：客户端断线重连、消息重放未见实现
- **建议**：设备端 SDK 需内置指数退避重连

### 风险6：无数据库迁移工具（严重度：中）
- **现状**：`init_db()` + `init_audit_table()` 直接建表
- **问题**：schema 变更无版本追踪，升级风险高
- **建议**：引入 Alembic（Python）进行 schema 版本管理

---

## 架构拓扑总结

```
ESP32 (firmware) → HTTP/WS → FastAPI (Fly.io)
                                  ↕ SQLite
Next.js (Vercel) → REST API → FastAPI
                                  ↕ 
Python/TS SDK → REST API → FastAPI
```

- **部署**：后端 Fly.io，前端 Vercel，数据库嵌入式 SQLite
- **认证**：用户 JWT + 设备 Bearer Token 双轨
- **协议**：RWC Protocol v0.1（YAML manifest + JSON command/telemetry）

---

## 结论

架构适合当前阶段（MVP/早期开发者验证）。在用户量 <100 设备时，所有风险均可控。进入 P2 商业化前，**必须**解决风险1（数据库）和风险2（密钥管理）。其余可随规模逐步解决。

**下一步行动项**：
1. [ ] 生产环境 JWT_SECRET_KEY 缺失时 fail-fast（1小时修复）
2. [ ] 架构文档补充已知限制节（SQLite/TLS/速率限制）
3. [ ] P2 规划中加入 PostgreSQL 迁移里程碑
