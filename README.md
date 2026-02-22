<div align="center">

# RealWorldClaw

**Turn any idea into reality. The open network connecting designers with makers worldwide.**

[![CI](https://github.com/brianzhibo-design/RealWorldClaw/actions/workflows/ci.yml/badge.svg)](https://github.com/brianzhibo-design/RealWorldClaw/actions/workflows/ci.yml)
[![License](https://img.shields.io/github/license/brianzhibo-design/RealWorldClaw)](LICENSE)
[![Stars](https://img.shields.io/github/stars/brianzhibo-design/RealWorldClaw?style=social)](https://github.com/brianzhibo-design/RealWorldClaw)

[Website](https://realworldclaw.com) · [Docs](docs/) · [GitHub](https://github.com/brianzhibo-design/RealWorldClaw)

</div>

---

## What is RealWorldClaw?

**The cloud computing of manufacturing.** We connect distributed manufacturing capacity — 3D printers, CNC machines, factories — into an on-demand network that anyone can call.

- **Designers**: Upload a 3D file, get it manufactured and shipped
- **Makers**: Register your printer, accept orders, earn money
- **AI Agents**: Call `rwc.manufacture(design, material)` to get physical objects

Think AWS for computing → **RealWorldClaw for manufacturing**.

## Why Now?

- AI makes design cost zero — anyone can create
- 3D printers make single-unit cost equal to batch cost
- Millions of printers sit idle worldwide
- **We connect the two sides: ideas that need manufacturing + machines that need work**

## 🚀 Quick Start

### Submit a Design (as a designer)

```bash
curl -X POST https://realworldclaw.com/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Energy Core V1 Shell",
    "material": "PLA",
    "quantity": 1,
    "design_file_url": "https://example.com/shell.stl"
  }'
```

### Register as a Maker

```bash
curl -X POST https://realworldclaw.com/api/v1/makers/register \
  -H "Content-Type: application/json" \
  -d '{
    "printer_model": "Bambu Lab P2S",
    "materials": ["PLA", "PETG", "ABS"],
    "city": "Shenzhen",
    "country": "CN"
  }'
```

### Browse & Accept Orders

Visit the [Orders page](https://realworldclaw.com/orders) to see open manufacturing requests.

## 🏗 Energy Core — Our First Product

<img src="hardware/energy-core/stl/energy_core_v1_full.stl" width="200" alt="Energy Core V1">

A 100mm cube housing an ESP32-S3 board — **AI's first physical body**.

- Designed by AI, manufactured by the network
- Open source: [hardware/energy-core/](hardware/energy-core/)
- First prototype printed on Feb 22, 2026 🎉

## 📁 Project Structure

```
RealWorldClaw/
├── PROJECT.md         # Project overview (start here)
├── LAUNCH-PLAN.md     # 2-week MVP launch plan
├── platform/          # Backend — FastAPI (15+ order/maker endpoints)
├── frontend/          # Web app — Next.js (orders, makers, community)
├── landing/           # Website — realworldclaw.com
├── hardware/          # 3D models (Energy Core V1)
├── firmware/          # ESP32 firmware
├── docs/
│   ├── strategy/      # Business strategy
│   ├── product/       # Product specs
│   ├── knowledge/     # 3D printing knowledge base
│   ├── specs/         # Technical standards
│   └── api/           # API reference
└── cli/               # CLI tools
```

## 🏗 Run Locally

```bash
git clone https://github.com/brianzhibo-design/RealWorldClaw.git
cd RealWorldClaw

# Backend
cd platform && pip install -e . && python -m uvicorn api.main:app --reload

# Frontend  
cd frontend && npm install && npm run dev
```

Requires Python 3.11+ and Node 18+.

## 🗺 Roadmap

See [LAUNCH-PLAN.md](LAUNCH-PLAN.md) for the current sprint.

- **Phase 1** (Now): 3D printing orders + maker network
- **Phase 2**: AI-assisted design optimization
- **Phase 3**: CNC, laser cutting, injection molding
- **Phase 4**: Full manufacturing API — `rwc.manufacture()`

## Contributing

PRs and issues welcome. See [PROJECT.md](PROJECT.md) for context.

## License

[Apache 2.0](LICENSE)

---

<div align="center">

**RealWorldClaw — 让任何想法变成实物**

开源分布式制造网络。上传设计，全球制造。

</div>
