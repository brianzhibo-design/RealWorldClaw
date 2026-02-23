# Monitoring Setup Guide

## UptimeRobot (Free Tier — 50 monitors, 5min interval)

### Setup
1. Sign up at https://uptimerobot.com (free)
2. Add these monitors:

| Monitor | URL | Type | Interval |
|---------|-----|------|----------|
| API Health | `https://realworldclaw-api.fly.dev/health` | HTTP(s) | 5min |
| API Detailed | `https://realworldclaw-api.fly.dev/api/v1/health/detailed` | HTTP(s) | 5min |
| Frontend | `https://realworldclaw.com` | HTTP(s) | 5min |
| skill.md | `https://realworldclaw.com/.well-known/skill.md` | HTTP(s) | 15min |

3. Set alert contacts: your email
4. Optional: Add status page at `status.realworldclaw.com`

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

## Cost: $0
All free tier.
