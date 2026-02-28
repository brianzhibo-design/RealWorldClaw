# Community Cold Start Plan

> Goal: Achieve **weekly real external contributions** within 8 weeks.

## Current State

- All commits from internal team only
- 0 external PRs, minimal community engagement
- Existing assets: CONTRIBUTING.md, CODE_OF_CONDUCT.md, PR template, issue templates

## Phase 1: Good First Issues (Week 1–2)

Create 10 well-scoped issues labeled `good first issue` + `help wanted`.

### Issue Backlog

| # | Title | Category | Effort | Description |
|---|-------|----------|--------|-------------|
| 1 | **Translate Quick Start guide to Chinese** | i18n | 2-3h | Translate `docs-site/` Quick Start section into `docs-site/zh/` with proper VitePress routing |
| 2 | **Translate Quick Start guide to Japanese** | i18n | 2-3h | Add `docs-site/ja/` with translated Quick Start, following the `zh/` pattern |
| 3 | **Add CLI `rwc status` unit tests** | testing | 2-4h | Write pytest tests for `cli/src/` status command — mock API responses, verify output format |
| 4 | **Document firmware module development guide** | docs | 3-4h | Create `docs/guides/firmware-modules.md` explaining how to add a new sensor/actuator module under `firmware/modules/` |
| 5 | **Add humidity sensor firmware module** | firmware | 4-6h | Implement `rwc_humidity.h/.cpp` following the pattern in `firmware/modules/rwc_sensor.*` for DHT22/SHT30 |
| 6 | **Create example: LED status indicator scene** | example | 2-3h | Add a `seed-components/` example that uses NeoPixel LEDs to show agent status (thinking/acting/idle) |
| 7 | **Add `--json` output flag to CLI commands** | CLI | 3-4h | Add `--json` flag to `rwc status` and `rwc printer` for machine-readable output |
| 8 | **Fix: API error responses missing consistent schema** | bugfix | 2-3h | Audit `platform/api/` endpoints and normalize error response format to `{error, message, detail}` |
| 9 | **Add component manifest JSON Schema validation** | tooling | 3-4h | Create a JSON Schema for `manifest.yaml` and wire it into `make validate` |
| 10 | **Write end-to-end test for order creation flow** | testing | 4-6h | Add e2e test in `tests/e2e/` covering: create order → assign printer → complete → verify status |

### Criteria for Good First Issues
- Clear acceptance criteria in every issue
- Estimated effort stated
- No deep codebase knowledge required
- Pointer to relevant files/directories
- A maintainer available to review within 48h

## Phase 2: Social Media Outreach (Week 3–4)

### Reddit Posts

**r/homeautomation** (280k members)
> Title: "We're building an open-source network to let AI agents control physical devices — looking for contributors"
>
> Body: Quick intro to RealWorldClaw, show the firmware module pattern, link to good-first-issues. Ask for feedback from people who've done ESP32 + home automation.

**r/esp32** (120k members)
> Title: "Open-source ESP32 firmware framework for AI agent ↔ physical world — contributors welcome"
>
> Body: Focus on the firmware layer, show `firmware/modules/` structure. Highlight the humidity sensor issue as entry point.

**r/3Dprinting** (2M members)
> Title: "Open-source distributed manufacturing network — print requests routed to community printers"
>
> Body: Focus on the print-farm-as-a-service angle. Show how `seed-components/` work with manifests. Link to component contribution guide.

### Hacker News — Show HN Draft

> **Show HN: RealWorldClaw – Open-source network for AI agents to interact with the physical world**
>
> We're building an open platform that connects AI agents to physical manufacturing capacity — 3D printers, sensors, actuators. Think "AWS for atoms."
>
> The stack: Python backend, ESP32 firmware, React frontend, a CLI, and a growing library of hardware components with standardized manifests.
>
> We just published 10 good-first-issues and would love contributors who care about bridging the digital-physical gap. Everything's MIT licensed.
>
> GitHub: https://github.com/brianzhibo-design/RealWorldClaw
> Website: https://realworldclaw.com

### Discord / Community Seeding

- Post in **OpenClaw Discord** #showcase channel
- Share in **ESP32** and **3D Printing** Discord servers' project-share channels
- Cross-post to Maker forums (Hackaday.io project page)

## Phase 3: Sustained Growth (Month 2+)

### Hacktoberfest Participation
- Register the repo as Hacktoberfest-participating
- Create 10+ issues with `hacktoberfest` label
- Write a Hacktoberfest landing section in README
- Timeline: prep in September, active in October

### Recurring Activities
- **Weekly**: Triage new issues, respond to PRs within 48h
- **Bi-weekly**: Write a "What's new" post for discussions/blog
- **Monthly**: Recognize top contributors in README or CHANGELOG

### Developer Experience Improvements
- Add `devcontainer.json` for GitHub Codespaces (zero-setup onboarding)
- Create a `DEVELOPMENT.md` with architecture overview
- Record a 5-min "your first PR" video walkthrough

## Metrics & Targets

| Metric | Week 2 | Week 4 | Month 2 | Month 3 |
|--------|--------|--------|---------|---------|
| External PRs (cumulative) | 1 | 5 | 15 | 30 |
| GitHub Stars | +20 | +80 | +200 | +500 |
| Forks | +5 | +15 | +40 | +80 |
| Contributors (non-team) | 1 | 3 | 10 | 20 |
| Good First Issues open | 10 | 8 | 15 | 15 |

### Tracking Method
- GitHub Insights for PR/star/fork data
- Weekly check: `gh api repos/brianzhibo-design/RealWorldClaw -q '.stargazers_count, .forks_count'`
- Monthly contributor audit: `git shortlog -sn --no-merges | head -20`

## Owner

☀️ 喜羊羊 (COO) — execution & community engagement
🧓 慢羊羊 (CTO) — technical review of issues & PRs
