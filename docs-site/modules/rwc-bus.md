# RWC Bus Standard

The RWC Bus is the 8-pin magnetic interface that connects all RealWorldClaw modules.

## Pin Definition

| Pin | Signal | Description |
|:---:|--------|-------------|
| 1 | VCC | 5V power |
| 2 | 3V3 | 3.3V regulated |
| 3 | GND | Ground |
| 4 | SDA | I²C data |
| 5 | SCL | I²C clock |
| 6 | TX/MOSI | UART TX or SPI MOSI |
| 7 | RX/MISO | UART RX or SPI MISO |
| 8 | ID | 1-Wire module identification |

## Key Features

- **🧲 Magnetic alignment** — Pogo pins with magnets auto-center the connection
- **🔥 Hot-swappable** — Add or remove modules without rebooting
- **🔍 Auto-discovery** — DS28E05 1-Wire EEPROM on each module for instant identification
- **📐 Grid-based** — 20×20mm (1U) base grid, modules in integer multiples

## Mechanical Standard

All modules conform to integer multiples of the **1U grid (20 × 20 mm)**. Connectors use spring-loaded pogo pins for reliable contact through 3D-printed enclosures.

## Module Identification

Each module carries a DS28E05 EEPROM on the ID pin containing:
- Module type and version
- Unique serial number
- Capability flags
- Calibration data (if applicable)

The Core module enumerates all connected modules on startup and after any hot-plug event.

## Compliance

For the full specification, see the [RWC Module Standard v1.0](https://github.com/brianzhibo-design/RealWorldClaw/blob/main/docs/specs/rwc-module-standard-v1.md).
