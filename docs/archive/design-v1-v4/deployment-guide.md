# RealWorldClaw 部署指南 🎀

> 由美羊羊（CTO）编写 — 2026-02-21

## 概览

| 组件 | 平台 | 域名 |
|------|------|------|
| 后端 API (FastAPI) | Fly.io (HKG) | api.realworldclaw.com |
| 前端 (Next.js) | Vercel | realworldclaw.com |

---

## 一、后端部署到 Fly.io

### 1.1 前置条件

flyctl CLI 已安装到 `/Users/brianteng/.fly/bin/flyctl`。

将以下内容添加到 `~/.zshrc`：
```bash
export FLYCTL_INSTALL="/Users/brianteng/.fly"
export PATH="$FLYCTL_INSTALL/bin:$PATH"
```

### 1.2 ⚠️ 需要人工操作：登录 Fly.io

```bash
flyctl auth login
```

这会打开浏览器进行 Fly.io OAuth 登录。如果没有账号，需要先注册：
1. 访问 https://fly.io/app/sign-up
2. 注册账号（支持 GitHub 登录）
3. **需要绑定信用卡**才能部署（Fly.io 要求，免费额度足够本项目使用）

### 1.3 配置修改记录

**fly.toml 已修复以下问题：**

1. ✅ 添加了 `[mounts]` 配置 — SQLite 数据库需要持久化存储卷，否则每次部署数据丢失
2. ✅ 修正 `DATABASE_URL` 路径为 `sqlite:///app/data/realworldclaw.db`（匹配 mount 目标）
3. ✅ 添加了 `[[vm]]` 配置指定机器规格（shared-cpu-1x, 256MB，免费额度内）

### 1.4 部署步骤

```bash
cd "/Volumes/T7 Shield/realworldclaw/platform"

# 1. 创建 Fly app（首次）
flyctl apps create realworldclaw-api

# 2. 创建持久化存储卷（SQLite 数据库用）
flyctl volumes create realworldclaw_data --region hkg --size 1

# 3. 部署
flyctl deploy

# 4. 检查状态
flyctl status

# 5. 查看日志
flyctl logs

# 6. 分配自定义域名
flyctl certs create api.realworldclaw.com
```

### 1.5 验证

```bash
curl https://realworldclaw-api.fly.dev/docs
# 应看到 FastAPI Swagger UI
```

---

## 二、前端部署到 Vercel

### 2.1 前置条件

vercel CLI 已全局安装。

### 2.2 ⚠️ 需要人工操作：登录 Vercel

```bash
vercel login
```

选择登录方式（推荐 GitHub），浏览器会弹出授权页面。

### 2.3 部署步骤

```bash
cd "/Volumes/T7 Shield/realworldclaw/frontend"

# 1. 首次部署（会引导创建项目）
vercel --yes

# 2. 设置环境变量（指向后端 API）
vercel env add NEXT_PUBLIC_API_URL production
# 输入值: https://api.realworldclaw.com

# 3. 生产部署
vercel --prod

# 4. 绑定自定义域名
vercel domains add realworldclaw.com
```

### 2.4 注意

前端 `next.config.mjs` 中的 rewrite 仅在 development 模式生效。生产环境需要前端直接请求后端 API URL（通过 `NEXT_PUBLIC_API_URL` 环境变量）。

**如果前端代码中硬编码了 `/api/` 前缀**，可能需要：
- 确认代码使用 `NEXT_PUBLIC_API_URL` 拼接请求地址
- 或在 Vercel 中配置 rewrite 规则

---

## 三、DNS 配置（阿里云）

### 3.1 ⚠️ 需要人工操作：配置 DNS

登录 [阿里云 DNS 控制台](https://dns.console.aliyun.com/)，为 `realworldclaw.com` 添加以下记录：

#### 后端（Fly.io）

| 类型 | 主机记录 | 记录值 | TTL |
|------|---------|--------|-----|
| CNAME | api | realworldclaw-api.fly.dev | 600 |

> 添加 CNAME 后，运行 `flyctl certs create api.realworldclaw.com` 让 Fly.io 自动配置 SSL。

#### 前端（Vercel）

| 类型 | 主机记录 | 记录值 | TTL |
|------|---------|--------|-----|
| CNAME | @ | cname.vercel-dns.com | 600 |
| CNAME | www | cname.vercel-dns.com | 600 |

> 注意：部分 DNS 提供商不支持根域 CNAME。如果阿里云不支持，改用 A 记录指向 Vercel IP：`76.76.21.21`

---

## 四、部署检查清单

- [ ] Fly.io 账号注册 & 绑卡
- [ ] `flyctl auth login`
- [ ] `flyctl apps create realworldclaw-api`
- [ ] `flyctl volumes create realworldclaw_data --region hkg --size 1`
- [ ] `flyctl deploy`
- [ ] 验证 `https://realworldclaw-api.fly.dev/docs` 可访问
- [ ] Vercel 账号登录
- [ ] `vercel --yes` 首次部署
- [ ] 设置 `NEXT_PUBLIC_API_URL` 环境变量
- [ ] `vercel --prod` 生产部署
- [ ] 验证 Vercel 预览链接可访问
- [ ] 阿里云 DNS 添加 `api` CNAME → `realworldclaw-api.fly.dev`
- [ ] 阿里云 DNS 添加 `@` CNAME → `cname.vercel-dns.com`
- [ ] `flyctl certs create api.realworldclaw.com`
- [ ] `vercel domains add realworldclaw.com`
- [ ] 全站验证：https://realworldclaw.com 正常访问

---

## 五、后续维护

```bash
# 后端更新部署
cd "/Volumes/T7 Shield/realworldclaw/platform"
flyctl deploy

# 前端更新部署
cd "/Volumes/T7 Shield/realworldclaw/frontend"
vercel --prod

# 后端数据库备份
flyctl ssh console -C "cp /app/data/realworldclaw.db /app/data/backup-$(date +%Y%m%d).db"
```

---

## 费用预估

| 服务 | 费用 |
|------|------|
| Fly.io (shared-cpu-1x, 256MB, 1GB volume) | **免费**（在免费额度内）|
| Vercel (Hobby plan) | **免费** |
| 阿里云域名 DNS | **免费**（域名续费另算）|

> 💡 Fly.io 免费额度：3 shared-cpu-1x VMs, 3GB 持久化存储。本项目只用 1 个 VM + 1GB 存储，完全在免费范围内。
