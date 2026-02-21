# RealWorldClaw - Energy Core Firmware

The Energy Core is the brain of every RealWorldClaw creature. It handles display, audio, connectivity, and module communication.

## Hardware

| Component | Model | Interface |
|-----------|-------|-----------|
| MCU | ESP32-S3 | - |
| Display | GC9A01 240×240 Round LCD | SPI |
| Speaker | I2S amplifier | I2S TX |
| Microphone | I2S MEMS mic | I2S RX |
| Module Bus | RWC Bus (I2C) | I2C |

## Pin Configuration

| Function | GPIO |
|----------|------|
| TFT_MOSI | 11 |
| TFT_SCLK | 12 |
| TFT_CS | 10 |
| TFT_DC | 8 |
| TFT_RST | 14 |
| TFT_BL | 9 |
| I2S_BCLK | 5 |
| I2S_LRCK | 6 |
| I2S_DOUT | 7 |
| I2S_DIN | 4 |
| RWC_SDA | 1 |
| RWC_SCL | 2 |

## Features

- **Expression System** — 9 animated face expressions with smooth transitions (30fps)
- **WiFi Manager** — AP captive portal for first-time setup, auto-reconnect
- **MQTT** — Bidirectional communication with RWC platform
- **Audio** — I2S output with boot chimes and TTS-ready PCM playback
- **RWC Bus** — I2C module auto-discovery with Pin8 ID protocol
- **OTA** — Wireless firmware updates with progress display

## Build

```bash
# Install PlatformIO CLI, then:
cd firmware/energy-core
pio run                  # Build
pio run -t upload        # Flash via USB
pio run -t monitor       # Serial monitor
```

## OTA Update

After first USB flash, subsequent updates can be done wirelessly:
```bash
pio run -t upload --upload-port rwc-energy-core.local
```

## Architecture

```
src/
├── main.cpp              # Entry point, task orchestration
├── display/
│   ├── display.h/.cpp    # GC9A01 LCD driver (TFT_eSPI + sprite buffering)
│   └── expressions.h/.cpp # Face animation system (lerp-based transitions)
├── network/
│   ├── wifi_manager.h/.cpp # WiFi with AP captive portal fallback
│   └── mqtt_client.h/.cpp  # MQTT client for platform communication
├── audio/
│   └── audio.h/.cpp      # I2S audio output (tones + PCM playback)
├── bus/
│   └── rwc_bus.h/.cpp    # I2C module discovery (RWC Bus protocol)
└── ota/
    └── ota.h/.cpp        # ArduinoOTA with display progress
```

## Expression API

Expressions can be set programmatically or via MQTT command:

```cpp
// Code
Expressions::setExpression(Expression::HAPPY);

// MQTT topic: rwc/device/{id}/cmd/expression
// Payload: "happy", "sad", "thinking", etc.
```

## MQTT Topics

| Topic | Direction | Description |
|-------|-----------|-------------|
| `rwc/device/{id}/status` | Publish | "online" / "offline" (retained) |
| `rwc/device/{id}/cmd/expression` | Subscribe | Set face expression |
| `rwc/device/{id}/cmd/tts` | Subscribe | PCM audio data for TTS |
