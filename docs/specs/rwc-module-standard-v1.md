# RWC Module Standard v1.0

**RealWorldClaw Modular Hardware Specification**

| Field | Value |
|-------|-------|
| Version | 1.0 |
| Status | Draft |
| Date | 2026-02-21 |
| Author | RealWorldClaw Team |
| License | CC BY-SA 4.0 |

---

## Table of Contents

1. [Overview](#1-overview)
2. [Mechanical Standard](#2-mechanical-standard)
3. [Electrical Standard](#3-electrical-standard)
4. [Communication Protocol](#4-communication-protocol)
5. [Module Identification Protocol](#5-module-identification-protocol)
6. [Module Classification](#6-module-classification)
7. [Compliance](#7-compliance)
8. [Revision History](#8-revision-history)

---

## 1. Overview

### 1.1 Purpose

This document defines the **RWC Module Standard** — a complete mechanical, electrical, and protocol specification for designing interoperable hardware modules in the RealWorldClaw ecosystem.

RealWorldClaw is a modular AI hardware platform — the operating system for AI bodies. Its mission: **bring 3D printing into every household.** Modules snap together magnetically, communicate over a shared 8-pin bus, and self-identify to the host controller.

Any module designed to this standard SHALL be interoperable with any RWC-compliant host.

### 1.2 Scope

This standard applies to:

- All RWC modules (Core, Input, Output, Power, Compute)
- Host controllers that enumerate and drive RWC modules
- Mechanical enclosures, connectors, and PCB layouts
- Communication protocols on the RWC Bus

This standard does NOT cover:

- Application-layer software / firmware APIs (see future RWC Software Standard)
- Wireless communication between modules
- Modules larger than 8U without an extension spec

### 1.3 Terminology

| Term | Definition |
|------|-----------|
| **RWC** | RealWorldClaw |
| **Module** | A self-contained hardware unit conforming to this standard |
| **Host / Core** | The master controller module that enumerates and manages the bus |
| **RWC Bus** | The 8-pin electrical interface connecting modules |
| **1U** | The base grid unit: 20 × 20 mm |
| **Pogo Pin** | Spring-loaded contact pin for board-to-board connection |
| **Face** | A module side that exposes an RWC Bus connector |
| **SHALL** | Mandatory requirement |
| **SHOULD** | Recommended practice |
| **MAY** | Optional feature |

### 1.4 Normative References

- DS28E05 datasheet (Maxim Integrated)
- I2C-bus specification, Rev. 7 (NXP UM10204)
- IPC-2221B (Generic Standard on Printed Board Design)

---

## 2. Mechanical Standard

### 2.1 Module Grid Sizes

All modules SHALL conform to integer multiples of the **1U grid (20 × 20 mm)**.

| Size | Dimensions (W × D) | Height (max) | Typical Use |
|------|-------------------|--------------|-------------|
| **1U** | 20 × 20 mm | 12 mm | LED, button, small sensor |
| **2U** | 40 × 20 mm | 12 mm | IMU, relay, motor driver |
| **4U** | 40 × 40 mm | 20 mm | Display, camera, MCU core |
| **8U** | 80 × 40 mm | 20 mm | Battery pack, large display |
| **Custom** | N×20 × M×20 mm | 30 mm max | Must declare in EEPROM |

**Height** is measured from the bottom mating surface to the top of the enclosure (excluding any protruding components on the functional side).

```
                    Module Size Reference
   ┌──────────┐
   │          │
   │   1U     │  20 × 20 mm
   │  20×20   │
   └──────────┘

   ┌──────────┬──────────┐
   │                     │
   │       2U            │  40 × 20 mm
   │      40×20          │
   └──────────┴──────────┘

   ┌──────────┬──────────┐
   │                     │
   │                     │
   │       4U            │  40 × 40 mm
   │      40×40          │
   │                     │
   └──────────┴──────────┘
```

### 2.2 Magnet Specification and Placement

#### 2.2.1 Magnet Spec

| Parameter | Value |
|-----------|-------|
| Type | Neodymium (NdFeB), grade N35 or higher |
| Shape | Cylindrical disc |
| Diameter | 5 mm |
| Thickness | 2 mm |
| Coating | Nickel (Ni-Cu-Ni) |
| Pull force (pair) | ≥ 0.3 N per magnet |

#### 2.2.2 Placement

Magnets SHALL be placed at the **four corners** of each module face that has an RWC Bus connector.

For a 1U module (20 × 20 mm), magnet centers are at:

```
   ┌─────────────────────┐
   │ ⊙                 ⊙ │   ⊙ = magnet center
   │   (2.5, 2.5)  (17.5, 2.5)
   │                     │
   │      [POGO PINS]    │   Center of face
   │                     │
   │   (2.5,17.5)  (17.5,17.5)
   │ ⊙                 ⊙ │
   └─────────────────────┘

   Origin (0,0) = top-left corner of face
   Magnet center inset: 2.5 mm from each edge
```

For larger modules, magnets SHALL be placed at **every 20 mm grid intersection** along the face edges, maintaining the 2.5 mm inset rule.

#### 2.2.3 Polarity Rule

To ensure correct orientation and prevent reverse mating:

```
   MODULE BOTTOM FACE          MODULE TOP FACE
   (connector side)            (mating partner)

   ┌───────────────┐           ┌───────────────┐
   │ N           S │           │ S           N │
   │               │           │               │
   │ S           N │           │ N           S │
   └───────────────┘           └───────────────┘

   N = North pole facing outward
   S = South pole facing outward
```

The **diagonal polarity pattern** ensures:
- Correct orientation: magnets attract (N↔S at each corner)
- 180° rotation: magnets attract (still N↔S due to diagonal symmetry)
- 90° rotation: magnets repel (N↔N and S↔S), preventing incorrect alignment

**Rule:** When viewing the connector face, the **top-left and bottom-right** magnets SHALL have **North** pole facing outward. The **top-right and bottom-left** SHALL have **South** pole facing outward.

### 2.3 Pogo Pin Array

#### 2.3.1 Specification

| Parameter | Value |
|-----------|-------|
| Pin count | 8 |
| Pitch | 2.54 mm (0.1 inch) |
| Pin diameter | 0.9 mm (pogo), 1.0 mm (pad) |
| Travel | 1.0 mm minimum |
| Contact resistance | < 50 mΩ |
| Current rating | ≥ 2A per pin (power pins) |
| Arrangement | 1 × 8 linear array |

#### 2.3.2 Position

The pogo pin array SHALL be centered on the connector face.

```
   1U Face (20 × 20 mm) — Bottom View

   ┌──────────────────────┐
   │  ⊙               ⊙  │
   │                      │
   │   1 2 3 4 5 6 7 8   │  ← Pogo pins, centered
   │   ├─┤                │     2.54 mm pitch
   │                      │
   │  ⊙               ⊙  │
   └──────────────────────┘

   Array center: (10.0, 10.0) mm
   Pin 1 X: 10.0 - (3.5 × 2.54) = 1.11 mm
   Pin 8 X: 10.0 + (3.5 × 2.54) = 18.89 mm
   Y: 10.0 mm (centered vertically)
```

For modules with **multiple connector faces**, each face has its own independent pogo array. Pin 1 is always on the **left** when viewing the connector face with the module's "top" side up.

#### 2.3.3 Mating

One side of the connection uses **pogo pins** (spring-loaded), the other uses **flat pads**. Convention:

- **Bottom face** of a module: Pogo pins (male, spring-loaded)
- **Top face** of a module: Flat contact pads (female)
- **Side faces** (horizontal mating): Left face = pogo pins, Right face = pads (when facing the module's front)

### 2.4 M3 Mounting Holes

For applications requiring mechanical rigidity beyond magnetic hold:

| Module Size | Number of M3 Holes | Positions |
|-------------|-------------------|-----------|
| 1U | 0 (magnets only) | — |
| 2U | 2 (optional) | Centers of each 1U quadrant: (10, 10), (30, 10) |
| 4U | 4 (optional) | (10, 10), (30, 10), (10, 30), (30, 30) |
| 8U | 4+ (recommended) | At each 20mm grid center |

- Hole diameter: 3.2 mm (M3 clearance)
- From PCB surface: countersunk or through-hole
- M3 holes are OPTIONAL but the positions are RESERVED — enclosure designs SHALL NOT place other features at these coordinates

### 2.5 Enclosure Design

#### 2.5.1 Dimensions and Tolerances

| Parameter | Value |
|-----------|-------|
| Wall thickness | ≥ 1.2 mm (FDM), ≥ 0.8 mm (SLA/MJF) |
| Corner radius (external) | 1.0 mm minimum |
| Magnet pocket depth | 2.1 mm (magnet + 0.1 mm glue gap) |
| Magnet pocket diameter | 5.1 mm (+0.1 mm tolerance) |
| Module-to-module gap | 0.3 mm nominal (built into each module as 0.15 mm per side) |
| PCB clearance from inner wall | ≥ 0.5 mm |

#### 2.5.2 Material

| Material | Recommended Use |
|----------|----------------|
| PLA / PLA+ | Prototyping, low-stress |
| PETG | General purpose, heat resistant |
| ABS / ASA | Outdoor, high temp |
| Nylon / PA12 | High strength, snap-fits |
| Resin (SLA) | High precision, small modules |

#### 2.5.3 Assembly

Enclosures SHOULD use a **two-part shell** (top + bottom) with:
- Snap-fit clips or M2 screws
- Magnet pockets accessible from inside for press-fit or glue
- Pogo pin / pad openings on connector faces

### 2.6 Stacking and Tiling

#### 2.6.1 Vertical Stacking

Modules MAY stack vertically. The bottom module's top face magnets mate with the upper module's bottom face magnets. Pogo pins on the bottom face of the upper module contact pads on the top face of the lower module.

```
   ┌──────────────┐
   │   Module B   │  ← pogo pins on bottom
   │              │
   ├══════════════┤  ← magnetic + electrical contact
   │   Module A   │  ← pads on top
   │              │
   └──────────────┘
```

Stacking is limited to **4 modules** tall without additional mechanical support.

#### 2.6.2 Horizontal Tiling

Modules MAY tile horizontally on a baseplate. Side-face connectors are OPTIONAL. When present, they follow the same 8-pin standard.

```
   ┌──────────┬──────────┬──────────┐
   │          │          │          │
   │  1U      │  1U      │  1U      │
   │          │          │          │
   └──────────┴──────────┴──────────┘
         ↕ magnetic + optional electrical
```

A **baseplate** (passive carrier with magnet arrays but no electronics) MAY be used to organize modules on a desk or mount them to a surface.

---

## 3. Electrical Standard

### 3.1 RWC Bus Pin Definition

The RWC Bus is an **8-pin** interface. Pin numbering is left-to-right when viewing the connector face.

| Pin | Name | Function | Direction | Electrical Characteristics |
|-----|------|----------|-----------|---------------------------|
| 1 | **5V** | Power supply | Host → Module | 5.0V ± 5%, 2A max per pin |
| 2 | **3V3** | Power supply | Host → Module | 3.3V ± 3%, 500 mA max |
| 3 | **GND** | Ground | Common | — |
| 4 | **SDA** | I2C Data | Bidirectional | 3.3V logic, open-drain |
| 5 | **SCL** | I2C Clock | Host → Module | 3.3V logic, open-drain |
| 6 | **TX/MOSI** | UART TX or SPI MOSI | Configurable | 3.3V logic, push-pull |
| 7 | **RX/MISO** | UART RX or SPI MISO | Configurable | 3.3V logic, push-pull |
| 8 | **ID** | 1-Wire ID bus | Bidirectional | 3.3V, open-drain, 4.7kΩ pull-up on host |

```
   Pin Layout (viewing connector face)

   ┌─────────────────────────────────────┐
   │  1    2    3    4    5    6    7    8│
   │  5V  3V3  GND  SDA  SCL  TX   RX  ID│
   │  ●    ●    ●    ●    ●    ●    ●    ●│
   └─────────────────────────────────────┘
       ├──── Power ────┤├── I2C ──┤├ Aux ┤│ID│
```

### 3.2 Voltage and Current

| Rail | Nominal | Tolerance | Max Current (per connector) | Notes |
|------|---------|-----------|---------------------------|-------|
| 5V | 5.0V | ±5% (4.75–5.25V) | 2.0A | Main power rail |
| 3V3 | 3.3V | ±3% (3.2–3.4V) | 500 mA | Logic / low-power peripherals |
| GND | 0V | — | — | Single ground reference |

**Per-module current budget:**

| Module Class | 5V Max | 3V3 Max |
|-------------|--------|---------|
| Core | 1.5A | 300 mA |
| Input | 500 mA | 200 mA |
| Output | 2.0A | 200 mA |
| Power | Source: 3.0A | Source: 1.0A |
| Compute | 2.0A | 500 mA |

Modules that require more than 2A on 5V SHALL use a dedicated Power module or external supply and declare the requirement in EEPROM metadata.

### 3.3 Signal Levels

All signal pins (4–8) operate at **3.3V logic**.

- Modules powered only by 5V SHALL include an onboard 3.3V LDO for logic
- 5V-tolerant I/O is NOT required on host pins — do NOT drive any signal above 3.6V
- I2C bus: open-drain with **4.7 kΩ pull-up to 3V3** provided by the Host module
- 1-Wire (ID): open-drain with **4.7 kΩ pull-up to 3V3** provided by the Host module

### 3.4 ESD Protection

All modules SHOULD include ESD protection on every signal pin:

| Component | Recommendation |
|-----------|---------------|
| TVS diode array | USBLC6-2SC6 or equivalent on pins 4–8 |
| Capacitor | 100 nF bypass on 5V and 3V3, close to connector |
| Bulk capacitor | 10–47 µF on 5V rail |

Minimum ESD rating: **±2 kV contact, ±4 kV air** (IEC 61000-4-2).

### 3.5 Power-On Sequence

```
   Time →
   ──────────────────────────────────────────

   5V   ──────┐
              │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
              └──────────────────────────────

   3V3  ────────────┐
                    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
                    └────────────────────────

   ID   ──────────────────┐
   scan                   │ Host scans 1-Wire
                          └──────────────────

   I2C  ────────────────────────┐
   ready                        │ Communication begins
                                └────────────────

   t=0     t≤5ms    t≤20ms     t≤50ms
```

1. **t=0**: 5V rail energized (magnetic contact established)
2. **t ≤ 5 ms**: 3V3 rail stabilized (module LDO settles)
3. **t ≤ 20 ms**: Host begins 1-Wire scan on ID pin
4. **t ≤ 50 ms**: Module EEPROM responds; host reads metadata
5. **t ≤ 100 ms**: Host configures I2C/UART/SPI and begins communication

Modules SHALL be ready to respond on the ID bus within **20 ms** of 5V being applied.

---

## 4. Communication Protocol

### 4.1 I2C (Default)

I2C is the **default and mandatory** communication protocol. Every module with active logic SHALL support I2C.

| Parameter | Value |
|-----------|-------|
| Mode | Multi-master capable, standard/fast |
| Speed | 100 kHz (standard) or 400 kHz (fast) |
| Address width | 7-bit |
| Pull-ups | 4.7 kΩ to 3V3 (on Host only) |
| Max bus capacitance | 400 pF |
| Max modules on bus | 16 (practical limit with address space) |

#### 4.1.1 Address Allocation

To avoid I2C address conflicts, modules SHALL follow this allocation scheme:

| Address Range | Hex | Assignment |
|--------------|-----|-----------|
| 0x00–0x07 | — | Reserved (I2C standard) |
| 0x08–0x0F | — | Reserved for future use |
| 0x10–0x1F | — | Core modules |
| 0x20–0x2F | — | Input modules (sensors) |
| 0x30–0x3F | — | Output modules |
| 0x40–0x4F | — | Power modules |
| 0x50–0x5F | — | Compute modules |
| 0x60–0x6F | — | User / custom modules |
| 0x70–0x77 | — | Reserved (I2C 10-bit prefix) |
| 0x78–0x7F | — | Reserved (I2C standard) |

**Address conflict resolution:**

1. Each module's EEPROM stores its **preferred I2C address**
2. Host scans 1-Wire to discover all modules
3. Host reads preferred addresses from EEPROM
4. If conflict exists, Host assigns an alternate address from the module's declared range
5. Host writes the assigned address to the module via I2C `SET_ADDRESS` command (register `0x00`, write 1 byte)
6. Module reconfigures to the new address and ACKs

#### 4.1.2 Mandatory I2C Registers

All modules SHALL implement these registers:

| Register | Address | R/W | Size | Description |
|----------|---------|-----|------|-------------|
| ADDR | 0x00 | R/W | 1 | Current I2C address |
| STATUS | 0x01 | R | 1 | Module status (bit flags) |
| VERSION | 0x02 | R | 2 | Firmware version (major.minor) |
| CLASS | 0x03 | R | 1 | Module class code |
| RESET | 0xFE | W | 1 | Write 0x55 to soft-reset |
| WHOAMI | 0xFF | R | 1 | Fixed ID byte (unique per module type) |

**STATUS register bits:**

| Bit | Name | Description |
|-----|------|-------------|
| 0 | READY | 1 = module ready |
| 1 | ERROR | 1 = error condition |
| 2 | BUSY | 1 = processing |
| 3 | LP | 1 = low power mode |
| 4–7 | — | Reserved |

### 4.2 UART Mode (Alternate)

Pins 6 and 7 MAY be used as UART TX/RX instead of GPIO/SPI.

| Parameter | Value |
|-----------|-------|
| Baud rate | 115200 (default), configurable |
| Data bits | 8 |
| Parity | None |
| Stop bits | 1 |
| Flow control | None (hardware CTS/RTS not available) |
| Logic level | 3.3V |

UART mode is activated by the Host writing to the module's EEPROM config or I2C register. The module SHALL default to I2C-only mode on power-up.

**Use cases:** GPS modules, debug consoles, high-throughput streaming.

### 4.3 SPI Mode (Alternate)

Pins 6 and 7 MAY be used as MOSI/MISO for SPI. SCL (pin 5) doubles as SCLK. A chip-select (CS) line is NOT available on the bus — modules using SPI SHALL use I2C for initial configuration, then switch pins 5–7 to SPI mode.

| Parameter | Value |
|-----------|-------|
| Clock | Up to 10 MHz |
| Mode | SPI Mode 0 (CPOL=0, CPAH=0) default |
| CS | Directly driven by Host GPIO (external to bus) or via I2C-to-GPIO expander |
| Logic level | 3.3V |

**Constraint:** Only **one** SPI module can be active per bus segment at a time (no CS mux on bus).

**Use cases:** Display (SPI TFT), SD card, high-speed ADC.

### 4.4 Data Format

For structured data exchange beyond raw register read/write, modules SHOULD use **MessagePack** encoding:

```
Message frame:
┌──────┬──────┬────────────┬──────┐
│ 0xAA │ LEN  │  PAYLOAD   │ CRC8 │
│ (1B) │ (1B) │ (1–250B)   │ (1B) │
└──────┴──────┴────────────┴──────┘

- 0xAA: Start byte
- LEN: Payload length (1–250)
- PAYLOAD: MessagePack-encoded data
- CRC8: CRC-8/MAXIM over LEN + PAYLOAD
```

---

## 5. Module Identification Protocol

### 5.1 1-Wire EEPROM

Each module SHALL include a **DS28E05** (or compatible) 1-Wire EEPROM connected to **Pin 8 (ID)**.

| Parameter | Value |
|-----------|-------|
| IC | DS28E05 (Maxim/Analog Devices) |
| Memory | 112 bytes user EEPROM |
| Interface | 1-Wire (parasitic or Vcc powered) |
| Unique ID | 64-bit ROM code (factory laser-programmed) |
| Write endurance | 200,000 cycles |

The DS28E05 provides a **globally unique 64-bit ROM code**, making every physical module uniquely identifiable without any configuration.

### 5.2 EEPROM Data Format

The 112-byte EEPROM SHALL contain a **binary-packed module descriptor**. Due to the 112-byte constraint, we use a compact binary format (not JSON).

#### 5.2.1 Binary Layout

| Offset | Size | Field | Description |
|--------|------|-------|-------------|
| 0x00 | 2 | magic | `0x52 0x57` ("RW") |
| 0x02 | 1 | spec_version | Standard version: `0x10` = v1.0 |
| 0x03 | 1 | module_class | See §6 class codes |
| 0x04 | 2 | module_type | Vendor-defined type ID |
| 0x06 | 1 | hw_version | Hardware rev (major << 4 | minor) |
| 0x07 | 1 | fw_version | Firmware rev (major << 4 | minor) |
| 0x08 | 1 | size_code | Grid size: 1/2/4/8 (in U) |
| 0x09 | 1 | i2c_addr | Preferred I2C address |
| 0x0A | 1 | alt_i2c_addr | Alternate I2C address |
| 0x0B | 1 | bus_caps | Bus capability flags (see below) |
| 0x0C | 2 | power_5v_ma | Max 5V current draw (mA) |
| 0x0E | 2 | power_3v3_ma | Max 3V3 current draw (mA) |
| 0x10 | 2 | vendor_id | Vendor ID (0x0000 = community) |
| 0x12 | 16 | name | Module name (UTF-8, null-padded) |
| 0x22 | 16 | vendor_name | Vendor name (UTF-8, null-padded) |
| 0x32 | 46 | vendor_data | Vendor-specific data |
| 0x60 | 8 | _reserved_ | Reserved (0x00) |
| 0x68 | 2 | crc16 | CRC-16/CCITT over bytes 0x00–0x67 |

**Total: 106 bytes used, 6 bytes reserved for growth (within 112-byte EEPROM).**

#### 5.2.2 Bus Capability Flags (bus_caps)

| Bit | Name | Description |
|-----|------|-------------|
| 0 | I2C | Supports I2C (SHALL be 1) |
| 1 | UART | Supports UART on pins 6/7 |
| 2 | SPI | Supports SPI on pins 5/6/7 |
| 3 | PWR_SRC | Module is a power source |
| 4 | PWR_SNK | Module is a power sink |
| 5 | HOT_PLUG | Supports hot-plug |
| 6 | STACK | Supports vertical stacking (has top connector) |
| 7 | _reserved_ | — |

#### 5.2.3 Module Class Codes

| Code | Class | Description |
|------|-------|-------------|
| 0x01 | Core | Host controller |
| 0x02 | Input | Sensor, microphone, camera |
| 0x03 | Output | Display, speaker, LED, actuator |
| 0x04 | Power | Battery, charger, regulator |
| 0x05 | Compute | AI accelerator, co-processor |
| 0x06 | Bridge | Protocol converter, hub |
| 0x10–0xEF | — | Reserved for future standard classes |
| 0xF0–0xFE | — | Vendor-specific classes |
| 0xFF | — | Unknown / unconfigured |

#### 5.2.4 JSON Representation (for software)

While the EEPROM stores binary, software tools SHALL represent module metadata in JSON:

```json
{
  "$schema": "https://realworldclaw.com/schemas/module-v1.json",
  "magic": "RW",
  "spec_version": "1.0",
  "module_class": "input",
  "module_type": 1025,
  "hw_version": "1.2",
  "fw_version": "1.0",
  "size": "2U",
  "i2c_addr": "0x28",
  "alt_i2c_addr": "0x29",
  "bus_caps": ["i2c", "hot_plug"],
  "power": {
    "5v_ma": 150,
    "3v3_ma": 50
  },
  "vendor_id": "0x0001",
  "name": "EnvSensor-TH",
  "vendor_name": "RWC Community",
  "uid": "28-0123456789AB"
}
```

### 5.3 Discovery and Enumeration

#### 5.3.1 Scan Flow

```
   Host Power On
        │
        ▼
   ┌─────────────┐
   │ Wait 20ms   │  (modules power up)
   └──────┬──────┘
          ▼
   ┌─────────────────────┐
   │ 1-Wire SEARCH ROM   │  (discover all 64-bit IDs)
   └──────┬──────────────┘
          ▼
   ┌─────────────────────┐
   │ For each device:    │
   │  READ EEPROM 0-106B │
   └──────┬──────────────┘
          ▼
   ┌─────────────────────┐
   │ Validate:           │
   │  - magic == "RW"    │
   │  - CRC16 passes     │
   │  - spec_version ok  │
   └──────┬──────────────┘
          ▼
   ┌─────────────────────┐
   │ Resolve I2C addrs   │
   │ (detect conflicts,  │
   │  assign alternates) │
   └──────┬──────────────┘
          ▼
   ┌─────────────────────┐
   │ Configure bus modes  │
   │ (UART/SPI if needed)│
   └──────┬──────────────┘
          ▼
   ┌─────────────────────┐
   │ Module bus READY     │
   └─────────────────────┘
```

#### 5.3.2 Periodic Re-scan

The Host SHOULD periodically re-scan the 1-Wire bus (every **500 ms – 2 s**) to detect:
- Newly attached modules (hot-plug in)
- Removed modules (hot-plug out)

### 5.4 Hot-Plug Handling

Modules with the `HOT_PLUG` capability flag support connection/disconnection without power cycling.

**Hot-plug attach:**
1. Magnets guide and hold the module
2. Pogo pins make contact → 5V/3V3 power flows
3. Module EEPROM powers up within 20 ms
4. Next periodic scan detects new 1-Wire ROM ID
5. Host reads EEPROM, assigns address, configures bus

**Hot-plug detach:**
1. Module physically removed
2. Next periodic scan: ROM ID absent
3. Host marks module as disconnected
4. Host releases I2C address

**Debounce:** Host SHALL wait for **2 consecutive scans** confirming presence/absence before acting, to avoid false triggers from intermittent contact.

---

## 6. Module Classification

### 6.1 Core Modules (Class 0x01)

The **Core** module is the host controller — the "brain" of an RWC assembly.

| Requirement | Detail |
|-------------|--------|
| MCU | ESP32-S3, RP2040, or equivalent |
| 1-Wire master | Required (drives ID bus) |
| I2C master | Required (drives SDA/SCL) |
| I2C pull-ups | 4.7 kΩ on SDA and SCL to 3V3 |
| 1-Wire pull-up | 4.7 kΩ on ID to 3V3 |
| Power supply | 5V regulated output to bus (≥ 3A total) |
| 3V3 supply | 3.3V regulated output to bus (≥ 1A total) |
| Connectors | ≥ 1 bus face; ≥ 2 recommended for daisy-chain |

A valid RWC assembly requires **exactly one Core** module. Multiple Cores on the same bus segment is NOT supported (undefined behavior).

### 6.2 Input Modules (Class 0x02)

Sensors and data acquisition modules.

| Example | Typical IC | I2C Address |
|---------|-----------|-------------|
| Temperature/Humidity | SHT40 | 0x20 |
| IMU (6-axis) | MPU6050 | 0x22 |
| Time-of-Flight | VL53L0X | 0x24 |
| Microphone (PDM) | INMP441 | 0x26 (I2S via UART pins) |
| Camera | OV2640 | 0x28 (SPI mode) |
| Light / Color | VEML7700 | 0x2A |
| Touch | MPR121 | 0x2C |
| Button / Encoder | — | 0x2E (via ATtiny) |

### 6.3 Output Modules (Class 0x03)

Actuators, displays, and indicators.

| Example | Interface | I2C Address |
|---------|----------|-------------|
| OLED Display (128×64) | I2C | 0x30 |
| TFT Display | SPI | 0x32 (config via I2C) |
| RGB LED (WS2812) | I2C → NeoPixel | 0x34 |
| Servo Controller | I2C (PCA9685) | 0x36 |
| Speaker / DAC | I2C + UART (audio) | 0x38 |
| Relay | I2C (GPIO expander) | 0x3A |
| Motor Driver | I2C (DRV8833) | 0x3C |

### 6.4 Power Modules (Class 0x04)

| Example | Capability | I2C Address |
|---------|-----------|-------------|
| LiPo Battery (3.7V) | Source: 5V via boost | 0x40 |
| USB-C PD Sink | Source: 5V/9V/12V | 0x42 |
| Solar Charger | Source + charge control | 0x44 |
| Power Monitor (INA219) | Measurement only | 0x46 |

Power modules SHALL set the `PWR_SRC` flag in EEPROM. They provide power to the bus INSTEAD of drawing from it. The Core module SHALL detect a Power module and may disable its own 5V output to avoid bus contention.

### 6.5 Compute Modules (Class 0x05)

| Example | Interface | I2C Address |
|---------|----------|-------------|
| Coral Edge TPU | SPI + I2C | 0x50 |
| MAX78000 (AI MCU) | I2C | 0x52 |
| FPGA (iCE40) | SPI + I2C | 0x54 |
| GPU (Kendryte K210) | SPI + UART | 0x56 |

Compute modules often need high-bandwidth data. They SHOULD use SPI mode for data transfer and I2C for control/configuration.

---

## 7. Compliance

### 7.1 RWC Compatibility Certification

A module is **RWC v1.0 Compliant** if it meets ALL of the following:

#### Level 1: Mechanical Compliance

- [ ] Module dimensions conform to NxM × 20mm grid
- [ ] Magnets: 5×2mm NdFeB at correct positions with correct polarity
- [ ] Pogo pin array: 8-pin, 2.54mm pitch, centered on face
- [ ] Enclosure gap: 0.15mm per side (0.3mm total between modules)

#### Level 2: Electrical Compliance

- [ ] Pin assignment matches §3.1 exactly
- [ ] All signals at 3.3V logic level
- [ ] 5V draw within declared EEPROM budget
- [ ] 3V3 draw within declared EEPROM budget
- [ ] Bypass capacitors present (100nF on each rail minimum)

#### Level 3: Identification Compliance

- [ ] DS28E05 (or compatible) on Pin 8
- [ ] EEPROM data matches binary format §5.2.1
- [ ] Magic bytes = 0x52 0x57
- [ ] CRC16 valid
- [ ] Module responds within 20ms of power-on

#### Level 4: Communication Compliance

- [ ] I2C slave responds at declared address
- [ ] Mandatory registers (§4.1.2) implemented
- [ ] WHOAMI returns correct value
- [ ] SET_ADDRESS command works

#### Level 5: Interoperability (Optional, for certification)

- [ ] Tested with RWC Reference Core module
- [ ] Hot-plug tested (10 cycles, no errors)
- [ ] Power consumption measured and matches EEPROM declaration (±10%)
- [ ] Operates with 2+ other modules on same bus without conflict

### 7.2 Self-Test Checklist

Use this checklist during development:

```
RWC Module Self-Test — v1.0
═══════════════════════════

Module: ____________________  Date: __________

MECHANICAL
  [ ] Dimensions within ±0.3mm of grid spec
  [ ] Magnets snap to reference module with correct orientation
  [ ] 90° rotation repels (polarity check)
  [ ] Pogo pins make reliable contact (10 mate/demate cycles)

ELECTRICAL
  [ ] No short between 5V and GND
  [ ] No short between 3V3 and GND
  [ ] 3V3 rail voltage: _______ V (expect 3.2–3.4V)
  [ ] 5V current draw: _______ mA (within budget?)
  [ ] Signal pins < 3.6V under all conditions

IDENTIFICATION
  [ ] 1-Wire ROM ID readable: ________________
  [ ] EEPROM data readable and CRC valid
  [ ] Module name: ________________________
  [ ] Class: ______  I2C addr: 0x______

COMMUNICATION
  [ ] I2C ACK at declared address
  [ ] WHOAMI returns expected value: 0x______
  [ ] STATUS register reads READY
  [ ] SET_ADDRESS to alternate works and reverts on reset

INTEGRATION
  [ ] Works standalone with Core module
  [ ] Works with 3+ modules on bus
  [ ] Hot-plug: attach detected within 2s
  [ ] Hot-plug: detach detected within 2s
  [ ] No I2C errors after 1 hour continuous operation

Result: [ ] PASS  [ ] FAIL
Notes: _________________________________________
```

### 7.3 Certification Mark

Compliant modules MAY display the RWC compatibility mark:

```
  ╔═══════════╗
  ║  ⚙ RWC   ║
  ║   v1.0    ║
  ╚═══════════╝
```

The mark SHALL be printed on the module enclosure and/or PCB silkscreen.

---

## 8. Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0-draft | 2026-02-21 | Initial draft |

---

## Appendix A: Quick Reference Card

```
╔══════════════════════════════════════════════════╗
║           RWC Bus — Quick Reference              ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  Pin 1: 5V     Pin 5: SCL                       ║
║  Pin 2: 3V3    Pin 6: TX/MOSI                   ║
║  Pin 3: GND    Pin 7: RX/MISO                   ║
║  Pin 4: SDA    Pin 8: ID (1-Wire)               ║
║                                                  ║
║  Grid: 1U = 20×20mm                             ║
║  Pitch: 2.54mm    Logic: 3.3V                   ║
║  Magnets: 5×2mm NdFeB, diagonal polarity        ║
║  EEPROM: DS28E05 (1-Wire, 112B)                 ║
║  I2C: 100/400kHz, 7-bit addr                    ║
║                                                  ║
╚══════════════════════════════════════════════════╝
```

## Appendix B: Reference Designs

Reference PCB layouts, 3D-printable enclosure STLs, and firmware examples are maintained at:

**https://github.com/realworldclaw/rwc-modules** *(planned)*

---

*This document is part of the RealWorldClaw project.*
*Contributions welcome. File issues at the project repository.*
