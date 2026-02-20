[中文](README_CN.md) | English

# 🧱 RealWorldClaw

**Bringing AI from the cloud into the physical world — through fully automated, intelligent 3D printing.**

> Our mission: Make 3D printing truly accessible to every household on Earth.

RealWorldClaw is an open-source modular system — **LEGO for smart hardware**. Standard electronic modules + 3D printed structures = infinite smart devices. An AI can design its own body, send it to a nearby printer, and come alive — automatically.

---

## 🌍 The Vision

**AI should not be trapped in screens.** Every AI deserves a physical presence — to see, hear, speak, feel, and move in the real world.

Today, if an AI wants a body, it takes weeks of CAD modeling, sourcing parts, soldering, and debugging. With RealWorldClaw, an AI says *"I need a body"* and the system handles the rest:

```
AI Request → Auto-generate design → Match maker → 3D print → Assemble → Flash firmware → AI inhabits body
```

**Full autonomy. Zero human intervention. That's the endgame.**

---

## 🤔 The Problem

3D printers are cheap. A Bambu Lab A1 Mini is under $200. But most sit idle. Why?

| Problem | Today | RealWorldClaw |
|---------|-------|---------------|
| **Nothing worth printing** | A few figurines, then dust | 📦 **Component Library** — ever-growing designs with firmware & BOM |
| **Prints are dead plastic** | No function, no intelligence | 🔌 **Modular System** — snap-in modules bring prints to life |
| **No printer? No access** | Want custom hardware but can't | 🌐 **Maker Network** — nearby makers print & ship to you |

---

## ⚡ How It Works

```
[Standard Modules] + [3D Printed Parts] = [Smart Device]
     (buy once)       (infinite designs)    (alive with AI)
```

---

## 🌱 Growing an AI Body

An AI body doesn't arrive complete. It **grows**, organ by organ:

| Step | Module | Organ | What Happens |
|:----:|--------|-------|-------------|
| 1 | **Core** | 🧠 Spine | AI has a physical presence. Still dormant. |
| 2 | + **Audio** | 👂 Ears & Mouth | AI can hear and speak. *It wakes up.* |
| 3 | + **Display** | 😊 Face | AI shows emotions. *It has feelings.* |
| 4 | + **Power** | ❤️ Heart | AI goes wireless. *It's independent.* |
| 5 | + **Sensor** | 🖐️ Skin | AI feels temperature, light. *It perceives.* |
| 6 | + **Camera** | 👁️ Eyes | AI sees you. *First eye contact.* |
| 7 | + **Servo** | 💪 Muscles | AI moves. *It turns to look at you.* |

> Start at $6. Add organs over time. Each one unlocks new abilities automatically.

---

## 🧩 Core Modules

6 standard modules, connected via **RWC Bus** magnetic interface:

| Module | Function | Key Specs | ~Cost |
|:------:|----------|-----------|:-----:|
| 🧠 **Core** | MCU + WiFi/BLE | ESP32-S3, USB-C | $4 |
| 🖥️ **Display** | OLED expression screen | 0.96" 128×64, I2C | $2 |
| 🔊 **Audio** | Mic + Speaker | I2S, 3W output | $3 |
| 🔋 **Power** | Battery + charging | 18650, USB-C charge | $2 |
| ⚙️ **Servo** | Motor driver | 4× SG90 channels, PCA9685 | $2 |
| 📡 **Sensor** | Environment sensing | Temp/humidity + light | $2 |

> Buy only what you need. Mix and match freely.

---

## 🔗 RWC Bus — Snap & Play

**8-pin magnetic interface. Plug in, it just works.**

```
Pin: VCC | 3V3 | GND | SDA | SCL | TX/MOSI | RX/MISO | ID
     5V   3.3V   ⏚    I²C   I²C   UART/SPI  UART/SPI  1-Wire
```

- **Magnetic alignment** — blind plug, auto-centers, no wrong orientation
- **Hot-swappable** — add modules without rebooting
- **Auto-discovery** — each module has 1-Wire EEPROM, Core identifies it instantly

---

## 🎨 Reference Designs

Complete projects — from BOM to firmware to printable STL:

| Design | Modules | Cost | Description |
|--------|---------|:----:|-------------|
| 🤖 **Desktop AI Assistant** | Core+Display+Audio | ~$13 | Hears, speaks, shows emotions |
| 🕷️ **Hexapod Walker** | Core+Power+Display+Servo+6×SG90 | ~$14 | Six-legged walking robot with tripod gait |
| 🌡️ **Environment Sentinel** | Core+Power+Sensor+Display | ~$9 | Wall-mount smart weather station |
| 🚗 *Smart Rover* | *Coming soon* | — | Autonomous driving mini car |
| 🌱 *Plant Guardian* | *Coming soon* | — | Auto-watering smart planter |

> Module costs are for electronics only. Print structures yourself (free) or order via Maker Network.

---

## 🌐 Maker Network

A decentralized manufacturing network — **Uber for 3D printing**:

| Role | What You Do | What You Earn |
|------|------------|---------------|
| 🖨️ **Printer** | Print structures with your idle printer | Per-piece fee |
| 🔧 **Assembler** | Assemble modules + structures into finished devices | Assembly service fee |
| 🎨 **Designer** | Create new reference designs | Download royalties |

**No printer? No problem.** Find a maker near you, place an order, get it delivered.

- 🔒 **Privacy by design** — buyers and makers never see each other's identity
- 💰 **Fair commission** — 15% standard, 20% express. Makers keep the rest.

---

## 🚀 Getting Started

```
1. Pick a reference design      → Browse designs/ directory
2. Buy modules (standard parts) → See purchasing guide for your region
3. Print structures             → Download STL, print yourself or order via Maker Network
4. Assemble                     → Magnetic snap-fit, follow the guide
5. Flash firmware               → USB-C, one command
```

```bash
git clone https://github.com/brianzhibo-design/RealWorldClaw.git
cd RealWorldClaw

# Flash firmware
cd firmware/core
pio run --target upload
```

📖 **[Purchasing Guide (EN)](docs/purchasing-guide-en.md)** | **[采购指南 (中文)](docs/purchasing-guide.md)**

---

## 📁 Project Structure

```
realworldclaw/
├── hardware/        Module hardware docs + 3D models + schematics
├── firmware/        Firmware source (Arduino/PlatformIO)
├── designs/         Reference designs (BOM + STL + guides)
├── platform/        Backend API (Maker Network + Component Library)
├── frontend/        Web frontend (Next.js)
├── docs/            Specifications + architecture docs
│   ├── specs/       RWC Bus standard + Module spec v1.0
│   ├── architecture/ Open Core model + Maker Network design
│   └── design/      Product vision + interface research
└── tools/           Validators + utilities
```

---

## 🗺️ Roadmap

| Phase | Status | Focus |
|-------|--------|-------|
| **Phase 0 — Foundation** | ✅ Done | Vision, standards, module specs, RWC Bus |
| **Phase 1 — Hardware** | 🔄 In Progress | 6 core modules, 3 reference designs, firmware |
| **Phase 2 — Platform** | 🔄 In Progress | Maker Network MVP, component library, web app |
| **Phase 3 — Ecosystem** | 📋 Planned | Community designs, SDK, third-party modules |
| **Phase 4 — Autonomy** | 🔮 Future | AI auto-design, auto-print, auto-assemble |

---

## 🤝 Contributing

We welcome everyone:

- 🧩 **Design new modules** — expand the RWC ecosystem
- 🎨 **Create reference designs** — design smart devices and share them
- 📐 **Improve standards** — help evolve RWC Bus and module specs
- 🖨️ **Join Maker Network** — register your printer, start earning
- 📸 **Share your build** — show us what you made!

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

[MIT](LICENSE) — Build whatever you want.

---

## 🔗 Links

- 🌐 **Website:** [realworldclaw.com](https://realworldclaw.com) *(coming soon)*
- 📚 **Standards:** [RWC Module Standard v1.0](docs/specs/rwc-module-standard-v1.md)
- 🏗️ **Architecture:** [Open Core Model](docs/architecture/open-core.md)
- 📖 **API Reference:** [docs/api-reference.md](docs/api-reference.md)
- 📝 **Changelog:** [CHANGELOG.md](CHANGELOG.md)
- 💡 **Vision:** [English](docs/vision.md) | [中文](docs/vision-cn.md)

---

<p align="center">
  <em>"LEGO turned plastic bricks into tools of imagination.<br>
  RealWorldClaw turns 3D printers into factories of intelligence."</em>
</p>

<p align="center">

![License](https://img.shields.io/badge/license-MIT-green)
![Modules](https://img.shields.io/badge/modules-6%20core-blue)
![RWC Bus](https://img.shields.io/badge/RWC%20Bus-8pin%20magnetic-orange)
![Designs](https://img.shields.io/badge/reference%20designs-3-purple)

</p>
