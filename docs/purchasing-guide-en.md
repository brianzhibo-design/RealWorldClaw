[中文](purchasing-guide.md) | English

# 🛒 RealWorldClaw Purchasing Guide (International)

> **v1.0 | Feb 2026**
>
> This guide helps you source all electronic components for RealWorldClaw standard modules from international suppliers.

---

## Table of Contents

1. [Core Module BOM](#1-core-module-bom)
2. [Reference Design Kits](#2-reference-design-kits)
3. [Tools](#3-tools)
4. [3D Printing Filament](#4-3d-printing-filament)
5. [Bulk Purchasing Tips](#5-bulk-purchasing-tips)

---

## Supplier Legend

| Supplier | Region | Best For |
|----------|--------|----------|
| **Amazon** | Global | Dev boards, modules, fast shipping |
| **AliExpress** | Global | Cheapest prices, 2-4 week shipping |
| **DigiKey** | NA/EU | Precision components, datasheets |
| **Mouser** | NA/EU | Same as DigiKey, good for SMD parts |
| **Adafruit** | NA | Quality breakout boards, tutorials |
| **SparkFun** | NA | Quality breakout boards, tutorials |
| **Pimoroni** | UK/EU | Maker-friendly, good curation |

---

## 1. Core Module BOM

### 🧠 Core Module (MCU)

| Component | Spec | Search Keywords | Est. Price (USD) | Recommended Source |
|-----------|------|----------------|:-----------------:|-------------------|
| ESP32-S3 Module | ESP32-S3-WROOM-1 N8R8 (8MB Flash + 8MB PSRAM) | `ESP32-S3-WROOM-1 N8R8` | $3.50-5.00 | DigiKey, Mouser |
| USB-C Connector | 16-pin SMD | `USB-C female connector 16pin SMD` | $0.10-0.30 | DigiKey, AliExpress |
| 3.3V LDO Regulator | AMS1117-3.3 SOT-223 | `AMS1117-3.3 SOT-223` | $0.10 | DigiKey, Mouser |
| Decoupling Cap 100nF | 0805 MLCC | `0805 100nF capacitor` | $0.01 | DigiKey, Mouser |
| Decoupling Cap 10µF | 0805 MLCC | `0805 10uF capacitor` | $0.02 | DigiKey, Mouser |
| ESD Protection | USBLC6-2SC6 SOT-23-6 | `USBLC6-2SC6` | $0.15 | DigiKey, Mouser |
| I2C Pull-up Resistor 4.7kΩ ×2 | 0805 SMD | `0805 4.7K resistor` | $0.01 | DigiKey, Mouser |
| 1-Wire Pull-up Resistor 4.7kΩ | 0805 SMD | `0805 4.7K resistor` | $0.01 | DigiKey, Mouser |
| Module EEPROM | DS28E05 SOT-23 | `DS28E05` | $0.80-1.00 | DigiKey, Mouser |
| 8-pin Pogo Pin Connector | 2.54mm pitch, 8P spring-loaded | `2.54mm 8pin pogo pin connector` | $1.00-2.00 | AliExpress, Amazon |
| Magnets 5×2mm | N35 Neodymium disc, nickel-plated | `5x2mm neodymium disc magnet N35` | $0.05-0.10/ea | AliExpress, Amazon |

> **Simplified approach**: Buy an **ESP32-S3-DevKitC-1** dev board ($7-12 on Amazon/AliExpress) — it has USB-C and voltage regulation built in. You only need the Pogo Pin connector and magnets additionally.

**Quick search**: `ESP32-S3 development board N8R8` on Amazon or AliExpress. Recommended brands: Espressif official, WeAct, Waveshare.

---

### 🖥️ Display Module

| Component | Spec | Search Keywords | Est. Price (USD) | Recommended Source |
|-----------|------|----------------|:-----------------:|-------------------|
| OLED Display | 0.96" SSD1306 I2C 128×64 White | `0.96 inch OLED SSD1306 I2C white` | $2.50-4.00 | AliExpress, Amazon, Adafruit |
| Module EEPROM | DS28E05 SOT-23 | `DS28E05` | $0.80-1.00 | DigiKey, Mouser |
| 8-pin Pogo Pin Connector | 2.54mm pitch 8P | `2.54mm 8pin pogo pin` | $1.00-2.00 | AliExpress |
| Magnets 5×2mm ×4 | N35 Neodymium | `5x2mm neodymium magnet` | $0.20-0.40 | AliExpress |

> **Upgrade options**: 1.3" OLED (SH1106, ~$4-5) for larger display; 1.69" IPS color LCD (ST7789, 240×280, ~$5-7) for full color.

---

### 🔊 Audio Module

| Component | Spec | Search Keywords | Est. Price (USD) | Recommended Source |
|-----------|------|----------------|:-----------------:|-------------------|
| MEMS Microphone | INMP441 I2S digital mic module | `INMP441 I2S microphone module` | $1.50-3.00 | AliExpress, Amazon, Adafruit |
| I2S Amplifier | MAX98357A I2S 3W Class-D amp module | `MAX98357A I2S amplifier module` | $2.00-4.00 | AliExpress, Amazon, Adafruit |
| Speaker | 3W 4Ω 40mm round | `3W 4ohm 40mm speaker` | $0.50-1.00 | AliExpress, Amazon |
| Module EEPROM | DS28E05 SOT-23 | `DS28E05` | $0.80-1.00 | DigiKey, Mouser |
| 8-pin Pogo Pin Connector | 2.54mm pitch 8P | `2.54mm 8pin pogo pin` | $1.00-2.00 | AliExpress |
| Magnets 5×2mm ×4 | N35 Neodymium | `5x2mm neodymium magnet` | $0.20-0.40 | AliExpress |

---

### 🔋 Power Module

| Component | Spec | Search Keywords | Est. Price (USD) | Recommended Source |
|-----------|------|----------------|:-----------------:|-------------------|
| Li-ion Charge/Protect Board | TP4056 + DW01 USB-C | `TP4056 USB-C charging module` | $0.50-1.00 | AliExpress, Amazon |
| Boost Converter | MT3608 step-up module 5V | `MT3608 boost converter 5V` | $0.50-1.00 | AliExpress, Amazon |
| 18650 Battery | Samsung/Panasonic 3.7V 2600-3400mAh | `18650 battery 3400mAh protected` | $3.00-5.00 | Amazon, Adafruit |
| 18650 Battery Holder | Single cell, spring contact | `18650 battery holder single` | $0.30-0.50 | AliExpress, Amazon |
| Power Switch | SS12D00 slide switch | `SS12D00 slide switch` | $0.05-0.10 | AliExpress, DigiKey |
| Module EEPROM | DS28E05 SOT-23 | `DS28E05` | $0.80-1.00 | DigiKey, Mouser |
| 8-pin Pogo Pin Connector | 2.54mm pitch 8P | `2.54mm 8pin pogo pin` | $1.00-2.00 | AliExpress |
| Magnets 5×2mm ×4 | N35 Neodymium | `5x2mm neodymium magnet` | $0.20-0.40 | AliExpress |

> ⚠️ **Battery safety**: Only buy protected cells from reputable brands (Panasonic NCR18650B, Samsung 35E). Avoid unprotected/recycled cells.

---

### ⚙️ Servo Module

| Component | Spec | Search Keywords | Est. Price (USD) | Recommended Source |
|-----------|------|----------------|:-----------------:|-------------------|
| Servo Driver Board | PCA9685 16-ch PWM I2C | `PCA9685 16 channel servo driver` | $2.00-4.00 | AliExpress, Amazon, Adafruit |
| SG90 Servo | 9g micro servo 180° | `SG90 9g micro servo 180 degree` | $1.50-2.50 | AliExpress, Amazon |
| Jumper Wires | Female-to-female 20cm, 10pcs | `dupont jumper wire female 20cm` | $1.00 | AliExpress, Amazon |
| Bulk Capacitor | 470µF 16V electrolytic | `470uF 16V electrolytic capacitor` | $0.10 | DigiKey, AliExpress |
| Module EEPROM | DS28E05 SOT-23 | `DS28E05` | $0.80-1.00 | DigiKey, Mouser |
| 8-pin Pogo Pin Connector | 2.54mm pitch 8P | `2.54mm 8pin pogo pin` | $1.00-2.00 | AliExpress |
| Magnets 5×2mm ×4 | N35 Neodymium | `5x2mm neodymium magnet` | $0.20-0.40 | AliExpress |

---

### 📡 Sensor Module

| Component | Spec | Search Keywords | Est. Price (USD) | Recommended Source |
|-----------|------|----------------|:-----------------:|-------------------|
| Temp/Humidity Sensor | SHT30/SHT31 I2C module | `SHT30 temperature humidity I2C module` | $2.00-4.00 | AliExpress, Amazon, Adafruit |
| Barometric Sensor | BMP280 I2C module | `BMP280 barometric pressure I2C module` | $1.50-3.00 | AliExpress, Amazon |
| Light Sensor | BH1750 I2C module | `BH1750 light sensor I2C module` | $1.00-2.00 | AliExpress, Amazon |
| Module EEPROM | DS28E05 SOT-23 | `DS28E05` | $0.80-1.00 | DigiKey, Mouser |
| 8-pin Pogo Pin Connector | 2.54mm pitch 8P | `2.54mm 8pin pogo pin` | $1.00-2.00 | AliExpress |
| Magnets 5×2mm ×4 | N35 Neodymium | `5x2mm neodymium magnet` | $0.20-0.40 | AliExpress |

---

## 2. Reference Design Kits

### 🤖 Desktop AI Assistant (Target cost ≈ $15)

The simplest AI companion: it listens, speaks, and shows expressions.

| # | Component | Qty | Unit Price | Subtotal | Search Keywords |
|---|-----------|:---:|:----------:|:--------:|----------------|
| 1 | ESP32-S3 Dev Board (N8R8) | 1 | $8.00 | $8.00 | `ESP32-S3 dev board N8R8 USB-C` |
| 2 | 0.96" OLED (SSD1306 I2C) | 1 | $3.00 | $3.00 | `0.96 inch OLED SSD1306 I2C` |
| 3 | INMP441 Microphone Module | 1 | $2.00 | $2.00 | `INMP441 I2S microphone` |
| 4 | MAX98357A Amplifier Module | 1 | $2.50 | $2.50 | `MAX98357A I2S amplifier` |
| 5 | 3W 4Ω 40mm Speaker | 1 | $0.80 | $0.80 | `3W 4ohm 40mm speaker` |
| 6 | Pogo Pin 8P Connector (2.54mm) | 3 | $1.50 | $4.50 | `2.54mm 8pin pogo pin spring` |
| 7 | Magnets 5×2mm N35 (pack of 50+) | 1 | $3.00 | $3.00 | `5x2mm neodymium magnet 50pcs` |
| 8 | DS28E05 EEPROM | 3 | $0.90 | $2.70 | `DS28E05` (DigiKey/Mouser) |
| 9 | Jumper Wires F-F 10cm | 1 pack | $1.00 | $1.00 | `dupont jumper wire female 10cm` |
| 10 | Silicone Bumpers | 1 sheet | $0.50 | $0.50 | `silicone bumper pads clear` |
| 11 | USB-C Cable | 1 | $2.00 | $2.00 | `USB-C data cable 1m` |
| | **Electronics Total** | | | **≈ $30** | |
| 12 | 3D Printing Filament (~50g PLA) | — | — | $1.00 | Self-print |
| 13 | M2 Screws/Standoffs | assorted | — | $1.00 | `M2 screw standoff kit` |
| | **Grand Total** | | | **≈ $32** | |

> 💡 **Budget tip**: Skip DS28E05 in early prototyping (use software module ID) to save ~$2.70. If you already have USB cables and screws, actual cost is ~$27.

**Best value source**: AliExpress for lowest prices (2-4 week shipping). Amazon for faster delivery at ~30% premium.

---

### 🕷️ Hexapod Walker (Target cost ≈ $18)

Six-legged walking robot with tripod gait and autonomous navigation.

| # | Component | Qty | Unit Price | Subtotal | Search Keywords |
|---|-----------|:---:|:----------:|:--------:|----------------|
| 1 | ESP32-S3 Dev Board (N8R8) | 1 | $8.00 | $8.00 | `ESP32-S3 dev board N8R8` |
| 2 | PCA9685 Servo Driver | 1 | $2.50 | $2.50 | `PCA9685 16ch servo driver` |
| 3 | SG90 9g Servo 180° (×6) | 6 | $1.80 | $10.80 | `SG90 servo 9g 180 degree` (buy 6-pack) |
| 4 | 0.96" OLED (SSD1306 I2C) | 1 | $3.00 | $3.00 | `0.96 inch OLED SSD1306` |
| 5 | 18650 Battery (3400mAh) | 1 | $4.00 | $4.00 | `Panasonic NCR18650B protected` |
| 6 | TP4056 Charge Board (USB-C) | 1 | $0.60 | $0.60 | `TP4056 USB-C charger module` |
| 7 | MT3608 Boost Module (5V) | 1 | $0.50 | $0.50 | `MT3608 boost converter 5V` |
| 8 | 18650 Battery Holder | 1 | $0.30 | $0.30 | `18650 battery holder` |
| 9 | 470µF 16V Electrolytic Cap | 1 | $0.10 | $0.10 | `470uF 16V capacitor` |
| 10 | Jumper Wires F-F 20cm | 1 pack | $1.50 | $1.50 | `dupont wire female 20cm 40pcs` |
| 11 | M2×8 Screws + Nuts | 18+18 | — | $1.00 | `M2 screw nut assortment` |
| 12 | Slide Switch SS12D00 | 1 | $0.05 | $0.05 | `SS12D00 slide switch` |
| | **Electronics Total** | | | **≈ $32** | |
| 13 | 3D Printing Filament (~65g PLA) | — | — | $1.50 | Self-print |
| | **Grand Total** | | | **≈ $34** | |

> 💡 **Budget tip**: SG90 servos in 6-packs are usually cheaper (~$9 for 6 on AliExpress).

---

### 🌡️ Environmental Sentinel (Target cost ≈ $10)

Desktop/wall-mount environmental monitor: temp, humidity, pressure, light, OLED display, MQTT reporting.

| # | Component | Qty | Unit Price | Subtotal | Search Keywords |
|---|-----------|:---:|:----------:|:--------:|----------------|
| 1 | ESP32-C3 Dev Board (mini) | 1 | $3.50 | $3.50 | `ESP32-C3 dev board USB-C mini` |
| 2 | SHT30 Temp/Humidity Module | 1 | $2.50 | $2.50 | `SHT30 I2C module` |
| 3 | BMP280 Pressure Module | 1 | $1.50 | $1.50 | `BMP280 I2C module` |
| 4 | BH1750 Light Module | 1 | $1.20 | $1.20 | `BH1750 I2C light sensor` |
| 5 | 0.96" OLED (SSD1306 I2C) | 1 | $3.00 | $3.00 | `0.96 inch OLED SSD1306` |
| 6 | Pogo Pin 8P Connector | 2 | $1.50 | $3.00 | `2.54mm 8pin pogo pin` |
| 7 | Magnets 5×2mm N35 (20pcs) | 1 | $2.00 | $2.00 | `5x2mm neodymium magnet` |
| 8 | DS28E05 EEPROM | 2 | $0.90 | $1.80 | `DS28E05` (DigiKey/Mouser) |
| 9 | USB-C Cable | 1 | $2.00 | $2.00 | `USB-C cable 1m` |
| | **Electronics Total** | | | **≈ $20.50** | |
| 10 | 3D Printing Filament (~40g PLA) | — | — | $0.80 | Self-print |
| 11 | M2 Screws/Standoffs | assorted | — | $0.70 | `M2 standoff kit` |
| | **Grand Total** | | | **≈ $22** | |

---

## 3. Tools

### Essential (Most People Already Have These)

| Tool | Purpose | Est. Price | Search Keywords |
|------|---------|:----------:|----------------|
| Phillips Screwdriver (PH0/PH1) | M2/M3 screws | $3-8 | `precision Phillips screwdriver PH0` |
| Tweezers (fine tip) | Placing magnets, small parts | $2-4 | `ESD safe precision tweezers` |
| Super Glue or UV Glue | Securing magnets to printed parts | $3 | `super glue` or `UV cure glue pen` |
| Wire Stripper/Cutter | Trimming jumper wires | $5-10 | `wire stripper mini` |

### Recommended (Better Experience)

| Tool | Purpose | Est. Price | Search Keywords |
|------|---------|:----------:|----------------|
| Multimeter | Checking continuity/voltage | $15-30 | `digital multimeter auto-ranging` |
| Hot Glue Gun | Securing cables, reinforcement | $8-12 | `hot glue gun 20W mini` |
| Helping Hands | Holding modules while wiring | $10-15 | `helping hands soldering third hand` |

### Optional (Advanced Users)

| Tool | Purpose | Est. Price | Search Keywords |
|------|---------|:----------:|----------------|
| Soldering Iron + Solder | Custom PCB work | $20-50 | `adjustable soldering iron 60W` |
| Logic Analyzer | Debugging I2C/SPI signals | $8-15 | `logic analyzer 24MHz 8 channel` |
| Heat Shrink Tubing Kit | Wire insulation | $5 | `heat shrink tubing assortment` |

> 📌 **Basic builds (Desktop AI Assistant / Environmental Sentinel) require NO soldering** — all connections are via pin headers, jumper wires, and magnetic snap-on. The Hexapod may need soldering for servo wire extensions.

---

## 4. 3D Printing Filament

### Recommended PLA Brands

| Brand | Notes | Est. Price | Source |
|-------|-------|:----------:|--------|
| **Bambu Lab PLA Basic** | Great quality, wide color range | $20-25/kg | Bambu Lab store |
| **eSUN PLA+** | Excellent value, tough, not brittle | $15-20/kg | Amazon, AliExpress |
| **Hatchbox PLA** | Reliable, popular in NA | $18-22/kg | Amazon |
| **Polymaker PolyLite PLA** | Premium, smooth surface | $22-28/kg | Amazon, Polymaker store |
| **Overture PLA** | Budget-friendly, good quality | $15-18/kg | Amazon |

### Filament Usage Per Design

| Reference Design | PLA Usage | Print Time | Supports? | Layer Height |
|-----------------|:---------:|:----------:|:---------:|:------------:|
| 🤖 Desktop AI Assistant | ~50g | ~3 hours | None | 0.2mm |
| 🕷️ Hexapod Walker | ~65g (body + 6 legs) | ~5 hours | None | 0.2mm |
| 🌡️ Environmental Sentinel | ~40g | ~2.5 hours | None | 0.2mm |

> 📐 **Print settings**: PLA, nozzle 210°C, bed 60°C, 15-20% infill, 1.2mm wall (3 perimeters), 0.4mm nozzle. All designs print flat — no supports needed.

---

## 5. Bulk Purchasing Tips (10+ units)

### AliExpress Bulk

For 10+ units, message sellers directly for bulk pricing. Typical discounts:

| Component | 1pc Price | 10+ Price | Savings |
|-----------|:---------:|:---------:|:-------:|
| ESP32-S3 Dev Board | $8.00 | $6.00 | 25% |
| SG90 Servo | $1.80 | $1.20 (60+) | 33% |
| 0.96" OLED | $3.00 | $2.00 | 33% |
| INMP441 Microphone | $2.00 | $1.50 | 25% |
| 5×2mm Magnets | $0.08 | $0.03 (500+) | 60% |
| Pogo Pin 8P | $1.50 | $0.80 (50+) | 47% |

### DigiKey/Mouser Bulk

IC components have automatic price breaks at 10/25/100 quantities.

### Recommended Bulk Strategy

1. **DigiKey/Mouser** for SMD components: EEPROM, resistors, capacitors, TVS diodes (low MOQ, fast shipping)
2. **AliExpress** for modules and dev boards: ESP32, OLED, sensors, servos (contact sellers for bulk quotes)
3. **Amazon** for batteries and tools: better consumer protection for lithium cells
4. **Dedicated magnet suppliers** on AliExpress: 500+ pieces for best per-unit price

---

## Notes

1. **Prices are estimates** based on Feb 2026 market prices. Actual prices may vary ±20%.
2. **Shipping costs not included** — factor in shipping when comparing suppliers.
3. **ESP32 Dev Board brands**: Espressif official DevKit, WeAct, Waveshare, Seeed Studio XIAO (compact alternative).
4. **Verify on arrival**: Plug in dev boards via USB to check serial output. Scan I2C address for OLED/sensors.
5. **Adafruit/SparkFun premium**: These cost more but include excellent tutorials and guaranteed quality — great for beginners.

---

*RealWorldClaw — Turning 3D printers into smart hardware factories.*
