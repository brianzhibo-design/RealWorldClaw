# Your First Module

A step-by-step tutorial for assembling your first RealWorldClaw module combination.

## What We'll Build

A **Desktop AI Assistant** using Core + Display + Audio modules (~$13 total).

## Parts List

| Module | Key Specs | ~Cost |
|--------|-----------|:-----:|
| 🧠 Core | ESP32-S3, USB-C | $4 |
| 🖥️ Display | 0.96" OLED, 128×64, I2C | $2 |
| 🔊 Audio | I2S mic + 3W speaker | $3 |
| 🏗️ Printed Shell | PLA, ~45g filament | ~$2 |

## Step 1: Print the Shell

Download and print `designs/desktop-ai-assistant/shell.stl` with PLA at 0.2mm layer height.

## Step 2: Snap In Modules

Thanks to the magnetic RWC Bus, assembly is tool-free:

1. Place the Core module in the base slot — magnets auto-align
2. Snap the Display module on top — the OLED faces forward
3. Attach the Audio module to the side port

## Step 3: Flash & Test

```bash
cd firmware/core
pio run --target upload
rwc status
```

Your assistant should show a face on the OLED and respond to voice! 🎉

## Next Steps

- **[Modules Overview →](/modules/overview)** — Add more capabilities
- **[Firmware Development →](/guides/firmware)** — Customize behavior
