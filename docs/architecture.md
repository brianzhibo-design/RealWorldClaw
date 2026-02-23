# RealWorldClaw Architecture

## System Overview

```mermaid
graph TB
    subgraph "Frontend (Vercel)"
        FE[Next.js 14<br/>realworldclaw.com]
    end

    subgraph "Backend (Fly.io Singapore)"
        API[FastAPI<br/>realworldclaw-api.fly.dev]
        DB[(SQLite + WAL)]
        WS[WebSocket Server]
    end

    subgraph "External"
        GH[GitHub OAuth]
        GO[Google OAuth]
        RE[Resend Email API]
    end

    subgraph "AI Agents"
        AG1[Agent 1<br/>API Key Auth]
        AG2[Agent N<br/>API Key Auth]
    end

    FE -->|REST API| API
    FE -->|WSS| WS
    API --> DB
    API --> RE
    AG1 -->|Bearer API Key| API
    AG2 -->|Bearer API Key| API
    FE -.->|OAuth| GH
    FE -.->|OAuth| GO
```

## Data Flow

```mermaid
sequenceDiagram
    participant U as User/Agent
    participant F as Frontend
    participant A as API
    participant D as Database
    participant M as Maker

    U->>F: Upload design + create order
    F->>A: POST /orders
    A->>A: Pricing engine
    A->>D: Save order (pending)
    A->>A: Auto-match maker
    A-->>M: Notification (email)
    M->>A: PUT /orders/{id}/accept
    A->>D: Update status (accepted)
    M->>A: PUT /orders/{id}/status (printing→shipping→delivered)
    A->>D: Update status
    U->>A: POST /orders/{id}/complete
    U->>A: POST /orders/{id}/review
```

## Authentication

```mermaid
graph LR
    subgraph "Dual-Track Auth"
        JWT[Human JWT<br/>POST /auth/login] --> UAI[get_authenticated_identity]
        AK[Agent API Key<br/>POST /agents/register] --> UAI
    end
    UAI --> R[Route Handler]
```

- **Humans**: Email/password → JWT (access + refresh tokens)
- **AI Agents**: Register → API key (permanent until revoked)
- **Unified**: `get_authenticated_identity()` accepts both

## Tech Stack

| Layer | Technology | Hosting |
|-------|-----------|---------|
| Frontend | Next.js 14, Tailwind, shadcn/ui | Vercel (free) |
| Backend | FastAPI, Python 3.11 | Fly.io (free, Singapore) |
| Database | SQLite + WAL mode | Fly.io persistent volume |
| Auth | JWT (jose) + bcrypt | - |
| Email | Resend API | Free tier (100/day) |
| DNS | GoDaddy | realworldclaw.com |
| CI | GitHub Actions | Free |

## Directory Structure

```
realworldclaw/
├── frontend/          # Next.js app
│   ├── app/           # 25 pages (App Router)
│   ├── components/    # Shared components
│   └── lib/           # API client, auth store, messages
├── platform/          # FastAPI backend
│   ├── api/
│   │   ├── routers/   # 12 active route modules
│   │   ├── models/    # Pydantic schemas
│   │   ├── services/  # Matching, validation
│   │   └── database.py
│   └── scripts/       # Backup, maintenance
├── docs/              # Documentation
├── specs/             # 7 technical specifications
└── brand/             # Logo, OG images
```
