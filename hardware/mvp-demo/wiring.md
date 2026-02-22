# Wiring Diagram — RWC Bus v0.1

## Pin Assignments

```
ESP32-S3-DevKitC-1
┌──────────────────┐
│              3V3  │──── DHT22 VCC (pin 1)
│              GND  │──── DHT22 GND (pin 4) ──── Relay GND
│             GPIO4 │──── DHT22 DATA (pin 2)
│             GPIO5 │──── Relay IN
│              5V   │──── Relay VCC
│             USB-C │  ← PC / 5V Power
└──────────────────┘
```

## Connections

### DHT22 (AM2302 Module)
| DHT22 Pin | Connect To |
|-----------|-----------|
| VCC (pin 1) | ESP32 **3V3** |
| DATA (pin 2) | ESP32 **GPIO4** |
| NC (pin 3) | — |
| GND (pin 4) | ESP32 **GND** |

> 如果用裸 DHT22（非模块），需在 DATA 和 VCC 之间加 10kΩ 上拉电阻。模块版已内置。

### 5V Relay Module
| Relay Pin | Connect To |
|-----------|-----------|
| VCC | ESP32 **5V** (USB VBUS) |
| GND | ESP32 **GND** |
| IN | ESP32 **GPIO5** |

> Relay 的 COM/NO/NC 端子连接你要控制的负载（如 LED 灯带、小风扇）。MVP 演示可不接负载，听继电器"咔嗒"声即可。

## RWC Bus v0.1 Protocol

| Bus Signal | GPIO | Direction | Purpose |
|-----------|------|-----------|---------|
| SENSOR_DATA | GPIO4 | IN | DHT22 one-wire data |
| ACTUATOR_0 | GPIO5 | OUT | Relay control (HIGH=ON) |
| I2C_SDA | GPIO8 | I/O | Reserved for future sensors |
| I2C_SCL | GPIO9 | I/O | Reserved for future sensors |
| SPI_CS | GPIO10 | OUT | Reserved for displays |
