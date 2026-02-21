# Quick Start

Get your first RealWorldClaw device running in 3 steps.

## Prerequisites

- A computer with USB port
- A 3D printer (or access to the [Maker Network](/guides/maker-network))
- Basic familiarity with the command line

## Step 1: Clone & Install

```bash
# Clone the repository
git clone https://github.com/brianzhibo-design/RealWorldClaw.git
cd RealWorldClaw

# Install the RWC CLI
npm install -g @realworldclaw/cli

# Verify installation
rwc --version
```

## Step 2: Flash the Core Module

The Core Module is the brain of every RealWorldClaw device. It runs on an ESP32-S3 with WiFi and Bluetooth.

```bash
# Connect your Core Module via USB-C
# Flash the firmware
cd firmware/core
pio run --target upload

# Verify the module is responding
rwc status
```

You should see output like:

```
🧠 Core Module v1.0.0
   MCU: ESP32-S3
   WiFi: Connected
   Modules: 1 detected (Core)
   Status: Ready
```

## Step 3: Print & Assemble

Choose a reference design and print the structure:

### Option A: Print It Yourself

```bash
# Browse available designs
rwc modules list

# Download STL files for the Desktop AI Assistant
rwc print download desktop-ai-assistant
```

Open the STL file in your slicer (Bambu Studio, Cura, PrusaSlicer), slice with these recommended settings:

| Setting | Value |
|---------|-------|
| Material | PLA |
| Layer Height | 0.2mm |
| Infill | 20% |
| Supports | Auto |

Print, snap in your modules, and you're done!

### Option B: Order via Maker Network

```bash
# Find a nearby maker and place an order
rwc orders create --design desktop-ai-assistant --location "your city"
```

A verified maker near you will print, assemble, and ship to your door.

## What You've Built

Congratulations! You now have a working RealWorldClaw device with:

- 🧠 **Core Module** — ESP32-S3 brain with WiFi/BLE
- 🏗️ **3D Printed Shell** — Customizable structure

## Next Steps

Now expand your device by adding more modules:

| Add This | Get This |
|----------|----------|
| [Audio Module](/modules/audio) | Voice input/output — your AI can hear and speak |
| [Display Module](/modules/display) | OLED face — your AI shows emotions |
| [Power Module](/modules/power) | Battery — your AI goes wireless |
| [Sensor Module](/modules/sensor) | Environment sensing — your AI perceives the world |
| [Servo Module](/modules/servo) | Movement — your AI can physically interact |

Each module snaps in magnetically via the [RWC Bus](/modules/rwc-bus) — no soldering, no rebooting.

- **[Installation Guide →](/getting-started/installation)** — Detailed CLI setup
- **[Your First Module →](/getting-started/your-first-module)** — Step-by-step module assembly tutorial
- **[Module Overview →](/modules/overview)** — Explore all 6 core modules
