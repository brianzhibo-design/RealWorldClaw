# RWC Module Emulator

Develop and test RealWorldClaw modules without physical hardware.

## Quick Start

```bash
cd tools/emulator
pip install -r requirements.txt
python emulator.py --module temp-humidity
```

## What It Does

- Simulates module sensors (temperature, humidity, etc.) with realistic noise
- Accepts commands (relay on/off, servo position, etc.)
- Connects to the RWC API as a virtual device
- Outputs telemetry data in RWC Protocol format

## Available Virtual Modules

| Module | Type | Capabilities |
|--------|------|-------------|
| `temp-humidity` | Sensor | temperature (°C), humidity (%) |
| `relay` | Actuator | switch (on/off) |
| `light-sensor` | Sensor | lux (0-65535) |
| `servo` | Actuator | angle (0-180°) |

## Usage

```bash
# Run with simulated data
python emulator.py --module temp-humidity --interval 2

# Connect to live API
python emulator.py --module temp-humidity --api https://localhost:8000 --agent-key YOUR_KEY

# Run multiple modules
python emulator.py --module temp-humidity,relay
```

## For Module Developers

Create your own virtual module by adding a YAML manifest:

```yaml
# my-module.yaml
module:
  id: "my-custom-sensor"
  name: "My Custom Sensor"
  type: "sensor"
capabilities:
  - id: "pressure"
    type: "read"
    unit: "hPa"
    range: [300, 1100]
    noise: 0.5
```

Then run: `python emulator.py --manifest my-module.yaml`
