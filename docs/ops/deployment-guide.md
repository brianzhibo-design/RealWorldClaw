# RealWorldClaw 部署运维指南

> 最后更新：2025-07-17

---

## 1. 架构概览

```
┌──────────────┐        HTTPS        ┌──────────────────────┐
│  Next.js 14  │ ◄──────────────────► │  FastAPI + SQLite     │
│  (Vercel)    │                      │  (Fly.io, sin 区域)   │
│              │        WSS           │                       │
│  realworld   │ ◄──────────────────► │  realworldclaw-api    │
│  claw.com    │                      │  .fly.dev             │
└──────────────┘                      └───────────┬──────────┘
                                                  │
                                           ┌──────┴──────┐
                                           │  SQLite DB  │
                                           │  (Volume)   │
                                           └─────────────┘
```

| 组件 | 技术栈 | 部署平台 | 域名 |
|------|--------|----------|------|
| 前端 | Next.js 14 | Vercel | realworldclaw.com |
| 后端 | FastAPI + SQLite | Fly.io (sin 区域) | realworldclaw-api.fly.dev |
| 代码仓库 | GitHub | — | brianzhibo-design/RealWorldClaw |

---

## 2. 环境变量清单

### 后端（Fly.io secrets）

| 变量名 | 必须 | 说明 |
|--------|------|------|
| `JWT_SECRET_KEY` | ✅ | JWT 签名密钥，至少 32 字符随机字符串 |
| `CORS_ORIGINS` | ✅ | 允许的前端域名，如 `https://realworldclaw.com` |
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | ❌ | GitHub OAuth App Client Secret |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth Client ID |

**设置方式：**

```bash
flyctl secrets set JWT_SECRET_KEY="your-secret-key" \
  CORS_ORIGINS="https://realworldclaw.com" \
  --app realworldclaw-api
```

### 前端（Vercel Environment Variables）

| 变量名 | 必须 | 说明 |
|--------|------|------|
| `NEXT_PUBLIC_API_URL` | ✅ | 后端 API 地址，如 `https://realworldclaw-api.fly.dev` |
| `NEXT_PUBLIC_WS_URL` | ✅ | WebSocket 地址，如 `wss://realworldclaw-api.fly.dev` |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | ❌ | GitHub OAuth Client ID（前端用） |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ❌ | Google OAuth Client ID（前端用） |

**设置方式：** 在 Vercel Dashboard → Settings → Environment Variables 中添加，或通过 CLI：

```bash
vercel env add NEXT_PUBLIC_API_URL production
```

---

## 3. 部署步骤

### 前端部署（Vercel）

```bash
cd frontend
vercel --prod
```

或通过 Git push 触发自动部署（推荐）：

```bash
git push origin main  # Vercel 会自动检测并部署
```

### 后端部署（Fly.io）

```bash
cd platform
flyctl deploy
```

首次部署前确认：
1. 已登录 `flyctl auth login`
2. `fly.toml` 配置正确（app 名、区域 = sin）
3. Volume 已创建（SQLite 数据持久化）

---

## 4. 回滚步骤

### 前端回滚（Vercel）

1. 打开 [Vercel Dashboard](https://vercel.com) → 选择项目
2. 进入 Deployments 列表
3. 找到上一个正常的 deployment，点击 "..." → **Promote to Production**

### 后端回滚（Fly.io）

```bash
# 查看发布历史
flyctl releases list --app realworldclaw-api

# 回滚到指定版本的镜像
flyctl deploy --image-ref <image-ref> --app realworldclaw-api
```

> ⚠️ 如果涉及数据库 schema 变更，回滚前需确认兼容性。

---

## 5. 监控

### 服务状态

```bash
# 查看 Fly.io 应用状态
flyctl status --app realworldclaw-api

# 查看实时日志
flyctl logs --app realworldclaw-api
```

### 健康检查

```bash
# API 健康检查
curl https://realworldclaw-api.fly.dev/api/v1/health
```

预期返回：`{"status": "ok"}` (HTTP 200)

### 建议的监控项

| 检查项 | 方式 | 频率 |
|--------|------|------|
| API 可用性 | `curl /api/v1/health` | 每 5 分钟 |
| Fly.io 实例状态 | `flyctl status` | 按需 |
| 前端可用性 | 访问 realworldclaw.com | 按需 |
| 日志异常 | `flyctl logs` | 排障时 |

---

## 6. 数据库

### 存储位置

SQLite 数据库存储在 Fly.io Volume 上，路径：`/data/realworldclaw.db`

### 手动备份

```bash
# SSH 进入 Fly.io 实例
flyctl ssh console --app realworldclaw-api

# 复制数据库文件（在实例内）
cp /data/realworldclaw.db /data/realworldclaw-backup-$(date +%Y%m%d).db
```

### 下载备份到本地

```bash
# 通过 sftp 下载
flyctl ssh sftp get /data/realworldclaw.db ./realworldclaw-backup.db --app realworldclaw-api
```

### 注意事项

- SQLite 是单文件数据库，备份时确保没有活跃写入（或使用 `.backup` 命令）
- Fly.io Volume 绑定到单个区域（sin），实例重启后数据保留
- **Volume 不会自动备份**，建议定期手动备份重要数据
