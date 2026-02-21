# Module Overview

RealWorldClaw uses 6 standard modules connected via the **RWC Bus** magnetic interface. Buy only what you need. Mix and match freely.

## Core Modules

| Module | Function | Key Specs | ~Cost | Status |
|:------:|----------|-----------|:-----:|:------:|
| 🧠 **Core** | MCU + WiFi/BLE | ESP32-S3, USB-C | $4 | ✅ Designed |
| 🖥️ **Display** | OLED expression screen | 0.96" 128×64, I2C | $2 | ✅ Designed |
| 🔊 **Audio** | Mic + Speaker | I2S, 3W output | $3 | ✅ Designed |
| 🔋 **Power** | Battery + charging | 18650, USB-C charge | $2 | ✅ Designed |
| ⚙️ **Servo** | Motor driver | 4× SG90, PCA9685 | $2 | ✅ Designed |
| 📡 **Sensor** | Environment sensing | Temp/humidity + light | $2 | ✅ Designed |

> **Total for a full kit: ~$15.** Start at $6 with just Core + one module.

## The RWC Bus

All modules connect through an **8-pin magnetic interface**:

```
Pin: VCC | 3V3 | GND | SDA | SCL | TX/MOSI | RX/MISO | ID
     5V   3.3V   ⏚    I²C   I²C   UART/SPI  UART/SPI  1-Wire
```

- 🧲 Magnetic alignment — blind plug, auto-centers
- 🔥 Hot-swappable — add modules without rebooting
- 🔍 Auto-discovery — 1-Wire EEPROM identifies modules instantly

## Reference Designs

| Design | Modules | ~Cost |
|--------|---------|:-----:|
| 🤖 Desktop AI Assistant | Core+Display+Audio | $13 |
| 🕷️ Hexapod Walker | Core+Power+Display+Servo+6×SG90 | $14 |
| 🌡️ Environment Sentinel | Core+Power+Sensor+Display | $9 |

## Next Steps

Explore each module in detail from the sidebar.
