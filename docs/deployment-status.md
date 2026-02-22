# RealWorldClaw 部署状态

> 版本: 1.0 | 更新: 2026-02-22 | 作者: 喜羊羊☀️

---

## 1. 线上服务地址与状态

| 服务 | URL | 平台 | 状态 |
|------|-----|------|------|
| **官网 (Landing)** | https://realworldclaw.com | Vercel | ✅ 在线 |
| **API 后端** | https://realworldclaw-api.fly.dev | Fly.io | ✅ 在线 |
| **API 文档 (Swagger)** | https://realworldclaw-api.fly.dev/docs | Fly.io | ✅ 在线 |
| **前端 Dashboard** | https://frontend-wine-eight-32.vercel.app | Vercel | ✅ 在线 |
| **Discord 社区** | https://discord.gg/realworldclaw | Discord | ✅ 活跃 |
| **GitHub 仓库** | https://github.com/brianzhibo-design/RealWorldClaw | GitHub | ✅ 公开 |

---

## 2. 监控端点

### 2.1 健康检查

| 端点 | 方法 | 预期响应 | 用途 |
|------|------|---------|------|
| `https://realworldclaw-api.fly.dev/health` | GET | `200 OK` | API 存活检测 |
| `https://realworldclaw-api.fly.dev/docs` | GET | `200 OK` | Swagger UI 可用性 |
| `https://realworldclaw.com` | GET | `200 OK` | 落地页可用性 |
| `https://frontend-wine-eight-32.vercel.app` | GET | `200 OK` | 前端可用性 |

### 2.2 快速检测脚本

```bash
#!/bin/bash
# RealWorldClaw 服务健康检测
echo "=== RealWorldClaw Health Check ==="

check() {
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$1")
  if [ "$STATUS" = "200" ]; then
    echo "✅ $2: OK ($STATUS)"
  else
    echo "❌ $2: FAILED ($STATUS)"
  fi
}

check "https://realworldclaw-api.fly.dev/health" "API Health"
check "https://realworldclaw.com" "Landing Page"
check "https://frontend-wine-eight-32.vercel.app" "Frontend"
check "https://realworldclaw-api.fly.dev/docs" "API Docs"
```

---

## 3. 部署配置说明

### 3.1 API 后端 (Fly.io)

**部署文件：** `platform/Dockerfile`

**关键配置：**
- 应用名：`realworldclaw-api`
- 区域：自动选择（Fly.io 默认）
- 端口：8000
- 数据库：SQLite（持久化卷挂载）
- 环境变量：`DATABASE_URL=sqlite:///data/realworldclaw.db`

**部署命令：**
```bash
cd platform
fly deploy
```

**扩容：**
```bash
fly scale count 2          # 增加实例数
fly scale vm shared-cpu-2x # 升级 CPU
```

### 3.2 前端 Dashboard (Vercel)

**框架：** Next.js

**环境变量：**
| 变量 | 值 |
|------|---|
| `NEXT_PUBLIC_API_URL` | `https://realworldclaw-api.fly.dev` |

**部署：** 推送到 GitHub main 分支自动触发 Vercel 部署。

### 3.3 落地页 (Vercel)

**目录：** `landing/`

**配置文件：** `landing/vercel.json`

**Vercel Project ID：** `prj_S3D1CzqhAZ1RJ26hX4S9kL8wBeAc`

**域名：** realworldclaw.com → Vercel DNS

**部署：** 推送到 GitHub 自动部署。

### 3.4 本地开发 (Docker Compose)

```bash
# 启动所有服务
docker-compose up

# 服务端口
# API:      http://localhost:8000
# Frontend: http://localhost:3000
```

---

## 4. CI/CD 流水线

| 工作流 | 文件 | 触发条件 | 功能 |
|--------|------|---------|------|
| CI 测试 | `.github/workflows/ci.yml` | PR / Push to main | Python + Node 矩阵测试 |
| 发布 | `.github/workflows/release.yml` | Git Tag | 自动构建发布包 |
| 文档部署 | `.github/workflows/docs.yml` | Push to main (docs/) | 部署文档站 |
| 安全扫描 | `.github/workflows/codeql.yml` | 定时 / PR | CodeQL 代码安全分析 |

---

## 5. 故障排除指南

### 5.1 API 返回 502/503

**可能原因：**
1. Fly.io 实例休眠（免费套餐冷启动）
2. 应用崩溃

**排查步骤：**
```bash
# 查看实例状态
fly status -a realworldclaw-api

# 查看日志
fly logs -a realworldclaw-api

# 重启
fly apps restart realworldclaw-api
```

### 5.2 前端无法加载数据

**可能原因：**
1. API 地址配置错误
2. CORS 未放行前端域名
3. API 服务下线

**排查步骤：**
1. 浏览器 DevTools → Network 面板，检查 API 请求状态
2. 确认 `NEXT_PUBLIC_API_URL` 环境变量正确
3. 直接访问 API health 端点确认后端存活
4. 检查 `platform/api/middleware.py` 中 CORS 配置

### 5.3 数据库锁定 (SQLite)

**症状：** 并发写入时返回 `database is locked`

**解决方案：**
```bash
# 临时：重启应用释放锁
fly apps restart realworldclaw-api

# 长期：迁移到 PostgreSQL
# Fly.io 提供 Postgres 附件：
fly postgres create
fly postgres attach realworldclaw-api
```

### 5.4 落地页域名无法访问

**排查步骤：**
1. 检查 DNS 解析：`dig realworldclaw.com`
2. 确认 Vercel 域名配置
3. 检查 SSL 证书状态（Vercel 自动管理）

### 5.5 打印机连接失败

| 打印机类型 | 常见问题 | 解决方案 |
|-----------|---------|---------|
| Bambu Lab | MQTT 连接超时 | 确认打印机和服务器在同一局域网；检查访问码 |
| OctoPrint | API Key 无效 | 在 OctoPrint Settings → API 重新生成 |
| Moonraker | 端口不可达 | 确认 Moonraker 运行在 7125 端口；检查防火墙 |

### 5.6 WebSocket 断连

**症状：** 前端实时数据停止更新

**排查：**
1. 检查浏览器 Console 是否有 WS 错误
2. 确认 Fly.io 未因超时关闭连接
3. 前端应实现自动重连（指数退避）

---

## 6. 联系与升级

| 渠道 | 用途 |
|------|------|
| GitHub Issues | Bug 报告、功能请求 |
| Discord #dev | 开发者实时讨论 |
| GitHub Actions | 查看 CI/CD 运行状态 |
