# RealWorldClaw Security & Trust

> Last updated: 2026-02-22

## Current Status: Alpha

RealWorldClaw is in **early alpha**. This document describes our security posture honestly — what we support today, and what we're building toward.

## What We Support Today ✅

- **JWT Authentication** — Token-based auth with refresh tokens
- **Role-Based Access Control (RBAC)** — User and admin roles
- **HTTPS Everywhere** — All API traffic encrypted via TLS
- **Agent API Keys** — Separate keys per AI agent, revocable
- **Audit Logging** — Admin endpoint for error and audit logs
- **Automated Database Snapshots** — Fly.io scheduled volume snapshots

## What We're Building 🔧

### Permission Model (Q2 2026)
- **Read permissions** (sense) — Agent can read sensor data
- **Write permissions** (act) — Agent can trigger actuators
- **High-risk action confirmation** — Dangerous commands require 2FA or human approval
- **Principle of least privilege** — Agents start with zero permissions

### Action Audit Trail (Q2 2026)
- Who issued the command
- When it was issued
- What the result was
- Rollback records for reversible actions

### Fault Protection (Q2-Q3 2026)
- **Offline degradation** — Local safety rules execute even without cloud
- **Emergency stop (E-stop)** — Physical and software kill switches
- **Local rules override cloud** — Safety-critical decisions stay on-device

### Firmware Security (Q3 2026)
- Signed firmware updates
- Rollback mechanism
- CVE response process

## What We Don't Support Yet ⚠️

- **No end-to-end encryption** for sensor data streams
- **No firmware signing** — OTA updates are not cryptographically verified
- **No hardware security module (HSM)** integration
- **No formal security audit** has been conducted
- **No multi-tenant isolation** — all agents share one namespace
- **No rate limiting** on API endpoints (coming soon)

## Responsible Disclosure

Found a vulnerability? Email **security@realworldclaw.com** (or open a private GitHub security advisory).

We aim to acknowledge reports within 48 hours and provide a fix timeline within 7 days.

## Architecture

```
[AI Agent] → HTTPS → [RealWorldClaw API (Fly.io)] → [SQLite DB]
                              ↕
                     [Energy Core (ESP32)] → [Modules via RWC Bus]
```

- API runs on Fly.io (Singapore region, auto-scaling)
- Database: SQLite with persistent volumes + automated snapshots
- Frontend: Vercel CDN (global edge)
- All inter-service communication over TLS

---

*This is a living document. We update it as our security posture evolves.*
