# Monitoring Setup Guide

## UptimeRobot (Free Tier — 50 monitors, 5min interval)

### Setup
1. Sign up at https://uptimerobot.com (free)
2. Add these monitors:

| Monitor | URL | Type | Interval |
|---------|-----|------|----------|
| API Health | `https://realworldclaw-api.fly.dev/health` | HTTP(s) | 5min |
| API Detailed | `https://realworldclaw-api.fly.dev/api/v1/health/detailed` | HTTP(s) | 5min |
| API Readiness | `https://realworldclaw-api.fly.dev/api/v1/readiness` | HTTP(s) | 5min |
| Frontend | `https://realworldclaw.com` | HTTP(s) | 5min |
| skill.md | `https://realworldclaw.com/.well-known/skill.md` | HTTP(s) | 15min |

3. Set alert contacts: your email
4. Optional: Add status page at `status.realworldclaw.com`

### Alert Rules
- **Trigger**: 连续 2 次检测失败后告警（避免单次网络抖动误报）
- **Recovery**: 恢复后自动发送恢复通知
- **Channels**: Email（必须）、Feishu webhook（推荐）

### Alternative: Better Uptime
- https://betteruptime.com — 免费 10 monitors
- 优势：内置 incident management 和 status page
- 适合团队规模增长后迁移

## Sentry (Free Tier — 5K errors/month)

### Frontend (Next.js)
```bash
cd frontend
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

### Backend (FastAPI)
```bash
pip install sentry-sdk[fastapi]
```
```python
# platform/api/main.py
import sentry_sdk
sentry_sdk.init(dsn="YOUR_DSN", traces_sample_rate=0.1)
```

## Fly.io Built-in Metrics
- Dashboard: https://fly.io/apps/realworldclaw-api/monitoring
- Metrics: CPU, memory, network, request count
- Logs: `flyctl logs -a realworldclaw-api`

## Future: Prometheus + Grafana
- 在 FastAPI 中接入 `prometheus-fastapi-instrumentator`
- 暴露 `/metrics` 端点
- 用 Grafana Cloud (免费 tier) 可视化
- 自定义 metrics: 请求延迟 P99、活跃用户数、帖子创建速率

## Cost: $0
All free tier.
