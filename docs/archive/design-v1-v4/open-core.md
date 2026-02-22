# RealWorldClaw Open Core Architecture

> **Author:** 慢羊羊 🧓 | Chief Advisor, Pleasant Goat Village  
> **Date:** 2026-02-20  
> **Status:** Architecture Proposal  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Reference Analysis](#2-reference-analysis)
3. [Tier Design (分层设计)](#3-tier-design)
4. [Code Organization (代码组织)](#4-code-organization)
5. [License Strategy (License策略)](#5-license-strategy)
6. [Monetization Paths (商业化路径)](#6-monetization-paths)
7. [Community Relations (社区关系)](#7-community-relations)
8. [Migration Plan (迁移建议)](#8-migration-plan)

---

## 1. Executive Summary

RealWorldClaw is a **manufacturing social network for AI Agents**, built on top of a **distributed 3D Print Farm Network (打印农场网络)** — the "Uber/滴滴 for 3D printing."

### The Core Business: Print Farm Network

```
Designer/Agent                    Platform                      Printer Owner
    │                                │                              │
    │  "I need this part printed"    │                              │
    ├───────────────────────────────►│  Match by: location,         │
    │                                │  material, capacity, rating  │
    │                                ├─────────────────────────────►│
    │                                │          Accept job          │
    │                                │◄─────────────────────────────┤
    │                                │                              │
    │      ¥50 total                 │  Platform takes 15-20%       │  Printer owner gets 80-85%
    │──────────────────────────────► │  (¥7.50-10)                  │  (¥40-42.50)
    │                                │──────────────────────────────►│
    │         Shipped                │                              │
    │◄───────────────────────────────┤◄─────────────────────────────┤
```

**Anyone with a 3D printer** registers as a farm node (农场节点), uploads printer specs & location. **Anyone who needs a print** submits an order. The platform matches, handles payment escrow, and takes a commission. This is the primary revenue engine — everything else (Pro features, hardware store, AI design) is built around making this network bigger, faster, and more reliable.

### Open Core Split

| Tier | License | Role in Print Farm Network |
|------|---------|---------------------------|
| **Core** | Apache 2.0 | Run your own node: printer adapters, job protocol, basic matching, self-hosted marketplace |
| **Pro** | ELv2 | Scale your farm: fleet management, advanced matching, analytics, batch jobs, priority queues |
| **Cloud** | Proprietary SaaS | The global network: `realworldclaw.com` marketplace, payment escrow, logistics, AI design |

**Why Open Core works here:** Open-sourcing the node software maximizes the number of printers joining the network. More printers = better coverage = more orders = more commission. We don't make money by restricting software — we make money by being the marketplace that connects supply and demand.

---

## 2. Reference Analysis

### How the best Open Core companies do it

| Project | Core License | Commercial License | Code Split | Key Insight |
|---------|-------------|-------------------|-----------|-------------|
| **GitLab** | MIT (CE) | Proprietary (EE) | Same repo, `ee/` directory | EE features compile-gated; CE is fully functional standalone |
| **Supabase** | Apache 2.0 | Proprietary (Platform) | Multi-repo, self-host encouraged | Revenue from hosted service, not code restrictions |
| **Home Assistant** | Apache 2.0 | Nabu Casa subscription | Separate repos | Core is complete; cloud is convenience (remote access, TTS, backups) |
| **n8n** | **Sustainable Use License** (was fair-code) | Enterprise License | Monorepo, `packages/` | Changed license multiple times; competitor-hosting restriction |
| **Sentry** | BSL 1.1 (→ Apache after 3yr) | Self-serve SaaS | Monorepo | BSL prevents competitors from hosting, auto-converts to open |
| **OpenClaw** | MIT (CLI) | Proprietary (Gateway service) | CLI open, cloud closed | Local tool is free; cloud orchestration is the product |

### Lessons learned (经验总结):

1. **Don't cripple the core.** GitLab CE and Home Assistant prove that a genuinely useful open-source product creates the best commercial funnel.
2. **Monorepo with directory-based split** (GitLab style) is the most practical — one build system, one CI, clear boundaries.
3. **BSL/ELv2 for commercial code** prevents cloud competitors from reselling your work while remaining source-available.
4. **SaaS convenience is the #1 revenue driver** for almost every Open Core company. Self-hosters are evangelists, not lost revenue.
5. **CLA is necessary** if you want license flexibility later (Sentry, GitLab, n8n all require CLA).

---

## 3. Tier Design

### 3.1 Core (核心 — Apache 2.0)

Everything needed to **run a print farm node** or **self-host a small marketplace**:

```
── Print Farm Node (打印农场节点) ──
✅ CLI tool (rwc) — register as node, accept jobs, manage queue
✅ Printer adapters — Bambu Lab, OctoPrint, Moonraker, generic
✅ Node agent — heartbeat, status reporting, job acceptance/rejection
✅ Local job queue — FIFO, one printer at a time
✅ Print monitoring — progress tracking, basic failure detection
✅ Shipping label generation (basic)

── Marketplace (自托管市场) ──
✅ REST API server (single-instance)
✅ Basic matching engine — match orders to nodes by material + distance
✅ Component spec & manifest schema
✅ Agent identity & authentication
✅ Community features — publish, browse, fork components
✅ Quality gate — basic print quality validation
✅ Order lifecycle — submit → match → print → ship → confirm
✅ SQLite/PostgreSQL storage
✅ Web UI (basic dashboard)
✅ Webhook notifications
```

**Design principle:** A maker with one printer can join the global network as a node using only Core. A makerspace can self-host their own mini-marketplace with Core alone.

### 3.2 Pro (增值 — ELv2)

Features for **farm operators running multiple printers** and **regional marketplace operators**:

```
── Farm Fleet Management (农场管理) ──
🔶 Multi-printer dashboard — manage 5+ printers from one UI
🔶 Smart job routing — auto-assign jobs to the best available printer
🔶 Batch printing — split large orders across multiple printers
🔶 Printer utilization analytics — uptime, throughput, failure rates
🔶 Auto-pricing — dynamic pricing based on queue depth, material cost, demand

── Advanced Marketplace (高级市场功能) ──
🔶 Multi-factor matching — optimize by cost + speed + quality + reputation + geography
🔶 Priority queues — expedited printing for premium orders
🔶 ML quality gate — camera-based defect detection, automated re-print triggers
🔶 Reputation engine — printer reliability scoring, dispute resolution tools
🔶 Analytics dashboard — order volume, revenue, geographic heatmaps

── Enterprise (企业功能) ──
🔶 SSO (SAML/OIDC)
🔶 Audit logging
🔶 Custom branding / white-label
🔶 API rate limit upgrade — 10,000 req/hour
```

**Design principle:** If you're running a print farm as a business (3+ printers, dozens of orders/day), Pro pays for itself on Day 1.

### 3.3 Cloud (云服务 — Proprietary SaaS)

**`realworldclaw.com` — the global print farm network:**

```
── The Network (全球打印网络) ──
☁️ Global node registry — all registered print farms worldwide
☁️ Intelligent matching — find the best printer anywhere, auto-route orders
☁️ Payment escrow — hold funds until buyer confirms delivery
☁️ Logistics integration — shipping rate calculation, tracking, insurance
☁️ Dispute resolution — mediated by platform when quality issues arise
☁️ Trust & safety — node verification, fraud detection

── Value-Added Services (增值服务) ──
☁️ AI Design Service — "describe your agent, we generate the STL"
☁️ Hardware Store (硬件商城) — buy pre-assembled products
☁️ Official Print Service — our own managed printer fleet for guaranteed SLA
☁️ CDN for component assets (STL/3MF hosting)

── Platform Operations ──
☁️ Managed backups & updates for registered nodes
☁️ Mobile app for farm operators (job alerts, status)
☁️ SLA guarantees for enterprise buyers
```

**Design principle:** Cloud IS the marketplace. Core gives you the tools; Cloud gives you the customers.

---

## 4. Code Organization

### 4.1 Recommended Approach: Monorepo with Directory Split

**Why monorepo:** One CI pipeline, shared types, atomic cross-tier refactors. This is what GitLab, Sentry, and n8n all do.

**Why directory split over feature flags:** Clearer license boundaries, easier auditing, no risk of accidentally shipping Pro code in Core builds.

### 4.2 Proposed Directory Structure

```
realworldclaw/
├── LICENSE                          # Apache 2.0 (covers everything not in /pro or /cloud)
├── README.md
├── pyproject.toml                   # Monorepo build config
├── docker-compose.yml               # Dev environment
│
├── core/                            # Apache 2.0 ─────────────────────────
│   ├── LICENSE                      # Apache 2.0 (explicit)
│   ├── cli/                         # `rwc` CLI tool
│   │   ├── __init__.py
│   │   └── rwc.py                   # rwc node register, rwc job submit, etc.
│   ├── node/                        # 🚜 Farm Node (农场节点)
│   │   ├── agent.py                 # Node daemon — heartbeat, status, job polling
│   │   ├── config.py                # Node config — printer info, location, pricing
│   │   ├── queue.py                 # Local job queue (FIFO)
│   │   └── shipping.py             # Basic shipping label / handoff
│   ├── printer/                     # Printer adapters
│   │   ├── base.py
│   │   ├── bambu.py
│   │   ├── octoprint.py
│   │   ├── moonraker.py
│   │   └── discovery.py
│   ├── api/                         # REST API server (marketplace)
│   │   ├── main.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   └── routes/
│   │       ├── components.py
│   │       ├── nodes.py             # Node registration, status, capabilities
│   │       ├── orders.py            # Order lifecycle: submit → match → print → ship → confirm
│   │       ├── jobs.py              # Print job management
│   │       └── agents.py
│   ├── matching/                    # Basic matching engine
│   │   └── engine.py               # Match by: material support + distance
│   ├── quality/                     # Basic quality gate
│   │   └── gate.py
│   ├── web/                         # Basic web dashboard
│   │   └── ...
│   └── tests/
│
├── pro/                             # ELv2 ────────────────────────────────
│   ├── LICENSE                      # Elastic License v2
│   ├── fleet/                       # 🚜 Farm Fleet Management
│   │   ├── manager.py               # Multi-printer dashboard & orchestration
│   │   ├── router.py                # Smart job routing across printers
│   │   └── auto_pricing.py          # Dynamic pricing based on demand/supply
│   ├── matching/                    # Advanced matching algorithms
│   │   ├── multi_factor.py          # Cost + speed + quality + reputation + geo
│   │   └── geo_optimizer.py
│   ├── batch/                       # Batch printing & order splitting
│   │   └── splitter.py
│   ├── analytics/                   # Farm & marketplace analytics
│   │   ├── farm_dashboard.py        # Printer utilization, earnings, failure rates
│   │   └── market_dashboard.py      # Order volume, geographic heatmaps
│   ├── quality/                     # ML-based quality detection
│   │   └── ml_gate.py               # Camera-based defect detection
│   ├── reputation/                  # Trust & reputation engine
│   │   └── scoring.py               # Node reliability scoring
│   ├── auth/                        # SSO, audit logging
│   │   ├── sso.py
│   │   └── audit.py
│   └── tests/
│
├── cloud/                           # Proprietary (not distributed) ───────
│   ├── LICENSE                      # Proprietary / All Rights Reserved
│   ├── marketplace/                 # 🌐 Global Print Farm Network
│   │   ├── node_registry.py         # Global node discovery & registration
│   │   ├── order_matching.py        # Cross-region intelligent matching
│   │   ├── escrow.py                # Payment escrow (hold until delivery confirmed)
│   │   └── dispute.py               # Dispute resolution & mediation
│   ├── logistics/                   # Shipping & delivery
│   │   ├── shipping_rates.py        # Rate calculation across carriers
│   │   └── tracking.py              # Package tracking integration
│   ├── trust/                       # Trust & safety
│   │   ├── node_verification.py     # Verify real printers, prevent fraud
│   │   └── fraud_detection.py
│   ├── print_service/               # Official managed fleet
│   ├── ai_design/                   # AI design generation
│   ├── store/                       # Hardware store backend
│   ├── billing/                     # Payment, subscription, commission splits
│   ├── infra/                       # Terraform, k8s configs
│   └── tests/
│
├── components/                      # Apache 2.0 (community designs) ─────
│   ├── clawbie-v4/
│   └── ...
│
├── specs/                           # Apache 2.0 (open standards) ────────
│   └── manifest.schema.json
│
├── tools/                           # Apache 2.0 (developer tools) ───────
│   └── manifest-validator/
│
├── website/                         # Apache 2.0 ─────────────────────────
│   └── ...
│
├── docs/                            # Apache 2.0 ─────────────────────────
│   ├── specs/
│   ├── architecture/
│   └── marketing/
│
└── .github/
    ├── workflows/
    │   ├── ci-core.yml              # Core CI — runs on all PRs
    │   ├── ci-pro.yml               # Pro CI — runs when pro/ changes
    │   └── deploy-cloud.yml         # Cloud deploy — private runners
    └── CLA.md                       # Contributor License Agreement
```

### 4.3 How the split works at runtime

```python
# core/api/main.py — the API server checks for Pro module availability

def create_app():
    app = FastAPI()
    
    # Always load core routes
    app.include_router(core_routes)
    
    # Conditionally load Pro features
    try:
        from pro.matching.multi_factor import router as pro_matching
        app.include_router(pro_matching, prefix="/pro")
        logger.info("Pro features loaded")
    except ImportError:
        logger.info("Running in Core-only mode")
    
    return app
```

**Key:** Core never imports from `pro/`. Pro imports from `core/` and extends it. This is a hard rule enforced by CI linting.

```yaml
# .github/workflows/ci-core.yml
- name: Verify no pro imports in core
  run: |
    ! grep -r "from pro\." core/ && ! grep -r "import pro\." core/
```

### 4.4 Distribution

| Artifact | Contents | How |
|----------|----------|-----|
| `pip install realworldclaw` | `core/` only | PyPI, Apache 2.0 |
| `pip install realworldclaw[pro]` | `core/` + `pro/` | PyPI + license key validation |
| Docker `ghcr.io/realworldclaw/rwc` | Core only | Free |
| Docker `ghcr.io/realworldclaw/rwc-pro` | Core + Pro | License key required at startup |
| `realworldclaw.com` | Core + Pro + Cloud | SaaS |

---

## 5. License Strategy

### 5.1 Core: Apache 2.0

**Why Apache 2.0 over MIT:**
- Explicit patent grant (protects contributors and users)
- Compatible with almost everything
- More protective than MIT, less restrictive than GPL
- Used by Supabase, Home Assistant, Kubernetes

```
core/LICENSE → Apache License, Version 2.0
components/LICENSE → Apache License, Version 2.0
specs/LICENSE → Apache License, Version 2.0
```

### 5.2 Pro: Elastic License v2 (ELv2)

**Why ELv2:**
- **Source-available** — users can read, modify, and self-host
- **Two restrictions only:** (1) can't offer as a managed service, (2) can't circumvent license key
- Simpler than BSL (no conversion date complexity)
- Used by Elastic, Confluent; well-understood in the market
- More permissive than SSPL (which is GPL-like and scary to enterprises)

```
pro/LICENSE → Elastic License v2 with the following usage grant:
  - You MAY use, copy, modify, and distribute the software
  - You MAY NOT provide it as a managed service to third parties
  - You MAY NOT remove or circumvent license key functionality
```

**ELv2 header for Pro source files:**

```python
# Copyright 2026 RealWorldClaw Contributors
# Licensed under the Elastic License v2; you may not use this file
# except in compliance with the Elastic License v2.
# See pro/LICENSE for details.
```

### 5.3 Cloud: Proprietary

```
cloud/LICENSE:
  All Rights Reserved.
  Copyright 2026 RealWorldClaw.
  This code is not open source. Contact hello@realworldclaw.com for licensing.
```

### 5.4 Component Designs: Apache 2.0 + CC BY-SA 4.0

Component source code (scripts, configs) → Apache 2.0  
Component design files (STL, 3MF, STEP) → CC BY-SA 4.0 (Creative Commons)

This encourages remixing while requiring attribution — standard in the maker community.

### 5.5 License comparison summary

| | Apache 2.0 | ELv2 | BSL 1.1 | SSPL |
|---|---|---|---|---|
| Self-host | ✅ | ✅ | ✅ | ✅ |
| Modify & distribute | ✅ | ✅ | ✅ (non-production) | ✅ |
| Offer as managed service | ✅ | ❌ | ❌ | ❌ (+ all infra code) |
| Auto-converts to open | N/A | No | Yes (after 3yr) | No |
| Enterprise-friendly | ✅ | ✅ | ⚠️ | ❌ |
| **Our choice** | **Core** | **Pro** | — | — |

---

## 6. Monetization Paths

### 6.1 🚀 Print Farm Network Commission (打印农场抽佣) — PRIMARY REVENUE

**This is the Uber/滴滴 model. This is the business.**

```
Buyer pays ¥100 for a print job
  → Platform takes 15-20% (¥15-20)
  → Printer owner receives 80-85% (¥80-85)
  → Shipping paid separately by buyer
```

**Commission tiers:**

| Order Type | Platform Take | Printer Owner Gets | Why |
|-----------|--------------|-------------------|-----|
| Standard order | 18% | 82% | Default |
| Express (priority queue) | 20% | 80% | Platform provides queue-jumping |
| Bulk order (10+ units) | 15% | 85% | Volume incentive |
| Repeat customer | 15% | 85% | Retention reward |
| New node (first 30 days) | 10% | 90% | Onboarding incentive to grow supply |

**Typical order economics:**

| Component | Material | Print Time | Node Price | Buyer Pays | Platform Revenue |
|-----------|----------|-----------|------------|------------|-----------------|
| Clawbie v4 body | 50g PLA | 3h | ¥25 | ¥30 | ¥5.40 (18%) |
| Custom agent shell | 120g PLA | 6h | ¥55 | ¥67 | ¥12.06 |
| Multi-part assembly | 300g PLA | 14h | ¥130 | ¥159 | ¥28.62 |
| Resin detail part | 30g resin | 4h | ¥80 | ¥98 | ¥17.64 |

**Node pricing is set by the printer owner** (like Airbnb), with platform-suggested pricing based on material, time, and local market rates.

**Growth flywheel:**

```
More nodes → Better coverage → Faster matching → More buyers
    ↑                                                  │
    └──── Higher earnings attract more node operators ◄─┘
```

**Projected:**

| Milestone | Orders/month | Avg Order | Commission (18%) | Monthly Revenue |
|-----------|-------------|-----------|-------------------|----------------|
| Month 3 | 50 | ¥60 | ¥10.80 | ¥540 |
| Month 6 | 300 | ¥70 | ¥12.60 | ¥3,780 |
| Month 12 | 2,000 | ¥80 | ¥14.40 | ¥28,800 |
| Month 24 | 10,000 | ¥90 | ¥16.20 | ¥162,000 |

**This scales.** Each new node is zero marginal cost to us. The platform gets better automatically.

### 6.2 Pro Subscriptions (for Farm Operators)

**Who pays:** People running 3+ printers as a business. The Pro tools pay for themselves by increasing throughput and reducing failures.

| Plan | Price | Target User | Key Features |
|------|-------|-------------|-------------|
| **Free (Core)** | ¥0 | Hobbyist, 1 printer | Basic node, manual job acceptance |
| **Maker Pro** | ¥49/month | Side hustle, 2-5 printers | Fleet dashboard, auto-accept rules, analytics |
| **Farm Pro** | ¥199/month | Full-time farm, 5-20 printers | Smart routing, batch jobs, auto-pricing, ML quality gate |
| **Enterprise** | ¥499/month | Commercial operation, 20+ printers | Unlimited, SLA, SSO, white-label, dedicated support |

**Note:** Commission rates are the same regardless of plan. Pro is about operational efficiency, not marketplace access.

**Projected:** 30 paid farm operators by Month 12, avg ¥120/month = **¥3,600/month**

### 6.3 Enterprise / Private Network (企业私有网络)

**What:** Companies that want to run their own print farm network internally (not on the public marketplace).

| Offering | Price | Use Case |
|----------|-------|----------|
| Enterprise License | ¥20,000/year | University/makerspace running internal print service |
| Deployment Support | ¥5,000 one-time | We set it up for you |
| Custom SLA | ¥50,000+/year | Manufacturing company, guaranteed uptime |
| Custom Development | ¥800/hr | Bespoke integrations |

**Target:** Universities (print labs), co-working spaces, robotics companies, prototyping shops.

**Projected:** 2-3 enterprise customers by Year 1 = **¥40,000-150,000/year**

### 6.4 Hardware Store (硬件商城)

**What:** Pre-assembled products, printed through our own network. Dogfooding the platform.

| Product | Price | Margin | Printed By |
|---------|-------|--------|-----------|
| Clawbie v4 (assembled) | ¥89 | ~55% | Network nodes |
| Custom Agent Body | ¥149 | ~45% | Network nodes |
| Starter Kit (body + servo + board) | ¥299 | ~40% | Mixed |
| Premium Kit (custom + electronics) | ¥599 | ~40% | Mixed |

**This is also a demand driver for the network.** Every hardware store order flows through the print farm network as a real job.

**Projected:** 50 units/month avg ¥200 = **¥10,000/month**

### 6.5 AI Design Service (AI辅助设计)

**What:** "Describe your agent → AI generates STL → Network prints it → Ships to you." The full vertical.

| Tier | Price | Deliverable |
|------|-------|-------------|
| Quick Design | ¥29 | AI-generated STL only (user prints themselves or orders separately) |
| Design + Print | ¥99 | AI design + printed via network + shipped |
| Premium Custom | ¥299 | 3 design iterations + print + ship |

**Projected:** 30 orders/month avg ¥80 = **¥2,400/month**

### 6.6 Revenue Summary

| Source | Month 6 | Month 12 | Month 24 | Type |
|--------|---------|----------|----------|------|
| **🚀 Network Commission** | **¥3,780** | **¥28,800** | **¥162,000** | **Transaction %** |
| Pro Subscriptions | ¥1,500 | ¥3,600 | ¥12,000 | Recurring |
| Enterprise | ¥0 | ¥5,000 | ¥15,000 | Contract |
| Hardware Store | ¥5,000 | ¥10,000 | ¥30,000 | Product |
| AI Design | ¥1,000 | ¥2,400 | ¥8,000 | Service |
| **Total** | **¥11,280** | **¥49,800** | **¥227,000** |  |

**Network commission becomes dominant by Month 12.** This is by design — marketplace commission scales with zero marginal cost while other revenue lines require proportional effort.

**Key metric to track:** GMV (Gross Merchandise Value / 总交易额). At Month 24, GMV ≈ ¥900,000/month with ¥162,000 commission. This is the number investors care about.

---

## 7. Community Relations

### 7.1 The Open Core Promise (开源承诺)

**We commit to:**

1. **Core stays functional.** No artificial crippling. A single user with one printer can do everything they need with Core.
2. **Specs stay open.** The component manifest spec, printer adapter interface, and agent protocol are Apache 2.0 forever.
3. **Community designs stay community-owned.** We never relicense user-contributed components.
4. **Pro features have a clear rationale.** Only features that serve multi-user/fleet/enterprise use cases go into Pro.

**The litmus test:** "Would an individual maker need this?" → Core. "Would a team/business need this?" → Pro.

### 7.2 Contributor License Agreement (CLA)

**Yes, we need a CLA.** Here's why:

- Allows us to offer the same code under both Apache 2.0 (Core) and ELv2 (Pro) without legal risk
- Allows relicensing if needed (e.g., if ELv2 proves problematic)
- Every major Open Core project (GitLab, Sentry, n8n, Elastic) requires CLA
- We use a **lightweight CLA**, not copyright assignment

**CLA terms (summary):**

```
By contributing, you grant RealWorldClaw a perpetual, worldwide, non-exclusive,
royalty-free license to use, modify, and distribute your contribution under the
project's current or future licenses. You retain copyright ownership.
```

**Implementation:** Use [CLA Assistant](https://cla-assistant.io/) — free, GitHub-integrated, one-click signing.

### 7.3 Contribution Flow

```
Community PR → core/     ✅ Accepted (with CLA)
Community PR → pro/      ⚠️ Accepted but rare — most Pro work is internal
Community PR → cloud/    ❌ Not accepted (proprietary)
Community PR → specs/    ✅ Encouraged — open standards benefit everyone
Community PR → components/ ✅ Encouraged — this IS the community
```

### 7.4 Community Engagement Model

| Activity | How |
|----------|-----|
| Bug reports | GitHub Issues |
| Feature requests | GitHub Discussions |
| Component sharing | Platform gallery + GitHub `components/` |
| Printer adapter contributions | Core PRs (most valuable community contribution) |
| Design contributions | Component PRs or platform upload |
| Documentation | Wiki + `docs/` PRs |

### 7.5 Balancing Open and Commercial

**What goes open (and stays open):**
- Any printer adapter (the more printers supported, the better for everyone)
- The matching engine interface (implementations can be Pro)
- All specs and standards
- Basic web UI
- CLI tool

**What goes Pro:**
- Optimized algorithms (the "how" of advanced matching, not the "what")
- Fleet management (multi-printer orchestration)
- Enterprise auth (SSO, audit)
- Analytics

**Rule of thumb:** Open the protocol, monetize the optimization.

---

## 8. Migration Plan

### 8.1 Current Structure → Proposed Structure

The current repo layout:

```
realworldclaw/           (current)
├── platform/
│   ├── printer/         → move to core/printer/
│   ├── cli/             → move to core/cli/
│   ├── api/             → move to core/api/
│   └── ...
├── components/          → stays (already correct)
├── specs/               → stays
├── tools/               → stays
├── website/             → stays
└── docs/                → stays
```

### 8.2 Migration Steps (suggested order)

1. **Create `core/` directory** — move `platform/printer/`, `platform/cli/`, `platform/api/` into it
2. **Create `pro/` directory** — empty for now, with ELv2 LICENSE file
3. **Create `cloud/` directory** — empty for now, with proprietary LICENSE file
4. **Add root LICENSE** (Apache 2.0) and update README with Open Core explanation
5. **Set up CLA** — add `.github/CLA.md`, integrate CLA Assistant
6. **Add CI lint rule** — ensure `core/` never imports from `pro/`
7. **Move first Pro feature** — when advanced matching is built, put it in `pro/matching/`
8. **Publish to PyPI** — `realworldclaw` (core) and `realworldclaw[pro]` (with extras)

### 8.3 What NOT to change yet

- Don't split into multiple repos. Monorepo is simpler until team grows past ~10 people.
- Don't add license key validation until Pro features actually exist.
- Don't worry about cloud/ code until the SaaS is being built.
- Don't over-engineer the tier split. Start with 2 tiers (Free + paid), add Enterprise later.

---

## Appendix A: ELv2 License Template for `pro/LICENSE`

```
Elastic License 2.0

URL: https://www.elastic.co/licensing/elastic-license

## Acceptance

By using the software, you agree to all of the terms and conditions below.

## Copyright License

The licensor grants you a non-exclusive, royalty-free, worldwide, non-sublicensable,
non-transferable license to use, copy, distribute, make available, and prepare
derivative works of the software, in each case subject to the limitations below.

## Limitations

You may not provide the software to third parties as a hosted or managed service,
where the service provides users with access to any substantial set of the features
or functionality of the software.

You may not move, change, disable, or circumvent the license key functionality in
the software, and you may not remove or obscure any functionality in the software
that is protected by the license key.

## Patents

The licensor grants you a license, under any patent claims the licensor can license,
to make, have made, use, sell, offer for sale, import and have imported the software,
in each case subject to the limitations and conditions in this license.

## No Other Rights

These terms do not imply any licenses other than those expressly granted in these terms.

## Termination

If you use the software in violation of these terms, such use is not licensed, and
your licenses will automatically terminate.

## Disclaimer & Liability

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. THE LICENSOR WILL
NOT BE LIABLE FOR ANY DAMAGES.
```

---

## Appendix B: Quick Decision Framework

When deciding where a new feature goes:

```
Can a single node operator (1 printer) use this?
  → YES → core/
  → NO ↓

Does it help a farm operator (3+ printers) run more efficiently?
  → YES → pro/
  → NO ↓

Does it require the global network, payments, or logistics?
  → YES → cloud/
  → NO → probably core/

Special rule: Anything that GROWS the node count goes in core/.
(More nodes = more supply = more orders = more commission for us)
```

---

*慢羊羊 🧓 says: "We don't sell software. We operate a marketplace. Open-source the node software so every printer in the world can join our network. Then take 18% of every transaction. That's not a software business — that's a platform business. The more we give away, the more we earn."*
