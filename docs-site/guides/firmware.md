# Firmware Development

Guide to developing and customizing RealWorldClaw firmware.

## Development Environment

- **IDE:** VS Code + PlatformIO extension
- **Framework:** Arduino (ESP32-S3)
- **Language:** C/C++

## Getting Started

```bash
cd firmware/core
pio run          # Build
pio run -t upload  # Flash
pio device monitor  # Serial monitor
```

## Architecture

The firmware uses an event-driven architecture with automatic module discovery via the RWC Bus.

*Detailed firmware documentation coming soon.*
