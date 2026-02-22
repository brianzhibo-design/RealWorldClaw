# 🐾 Pet Comfort Zone / 宠物舒适区管理

> AI maintains optimal temperature & humidity for pets by controlling a fan and humidifier.  
> AI 为宠物维持最佳温湿度，自动控制风扇和加湿器。

---

## Overview / 概述

Pets (especially cats, dogs, reptiles, and small animals) are sensitive to temperature and humidity extremes. This system uses an ESP32 with a DHT22 sensor to monitor the pet's area and controls a fan (cooling) and USB humidifier (moisture) via two relay channels — keeping conditions in the ideal range 24/7.

---

## BOM (Bill of Materials) / 物料清单

| # | Component | Spec | Qty | Est. Cost (USD) |
|---|-----------|------|-----|-----------------|
| 1 | ESP32-WROOM-32 dev board | 38-pin | 1 | $4.00 |
| 2 | DHT22 sensor | Temperature + humidity | 1 | $2.00 |
| 3 | 2-channel relay module | 5V, optocoupled | 1 | $2.50 |
| 4 | USB mini fan | 5V, quiet (<30dB) | 1 | $5.00 |
| 5 | USB mini humidifier | Ultrasonic, 5V | 1 | $6.00 |
| 6 | USB splitter / hub | Powered, 4-port | 1 | $3.00 |
| 7 | Jumper wires | F-F, 20cm | 8 | $0.50 |
| 8 | USB-C cable + power adapter | 5V 3A (enough for all) | 1 | $4.00 |
| 9 | Pet-safe enclosure | Wire mesh or 3D-printed | 1 | $2.00 |

**Total estimated cost: ~$29.00 / ≈¥206**

---

## Wiring Diagram / 接线图

```
ESP32 GPIO Pin Map
──────────────────
3V3    ──→  DHT22 VCC
GND    ──→  DHT22 GND
GPIO4   ──→  DHT22 DATA

VIN (5V) ──→  Relay VCC
GND    ──→  Relay GND
GPIO5   ──→  Relay IN1 (Fan)
GPIO18  ──→  Relay IN2 (Humidifier)

Relay CH1 (NO/COM) ──→  Fan USB power wire (cut & splice)
Relay CH2 (NO/COM) ──→  Humidifier USB power wire (cut & splice)
```

```
                    ┌──────────┐
┌─────────┐        │          │──Relay CH1──→ 🌀 Fan
│  DHT22  │───────→│  ESP32   │
│(temp/hum)│       │          │──Relay CH2──→ 💨 Humidifier
└─────────┘        │          │
                    │          │───→ WiFi → RealWorldClaw API
                    └──────────┘
```

> ⚠️ **Safety:** Ensure all wires are pet-proof. Use cable covers or mount the electronics above pet reach.

---

## Comfort Zones by Pet / 宠物舒适区参考

| Pet | Ideal Temp (°C) | Ideal Humidity (%) |
|-----|------------------|--------------------|
| 🐱 Cat | 20–26 | 40–60 |
| 🐶 Dog | 18–24 | 40–60 |
| 🐹 Hamster | 20–24 | 40–65 |
| 🦎 Reptile (tropical) | 24–32 | 60–80 |
| 🐦 Bird | 18–27 | 40–60 |

---

## Code Example / 代码示例

### Agent Logic (Python)

```python
#!/usr/bin/env python3
"""Pet Comfort Zone — AI Agent Logic"""

import requests
import time
from datetime import datetime

BASE = "https://api.realworldclaw.com/api/v1"
API_KEY = "rwc_sk_live_..."
HEADERS = {"Authorization": f"Bearer {API_KEY}"}
DEVICE_ID = "esp32-pet-001"
AGENT_ID = "ag_pet_comfort"

# Comfort zone config — adjust per pet type!
PET_TYPE = "cat"
TEMP_MAX = 26.0      # °C — above this → fan ON
TEMP_MIN = 20.0      # °C — below this → fan OFF (don't over-cool)
HUMIDITY_MIN = 40.0   # % — below this → humidifier ON
HUMIDITY_MAX = 60.0   # % — above this → humidifier OFF

fan_on = False
humidifier_on = False

def send_command(command, channel):
    requests.post(f"{BASE}/devices/{DEVICE_ID}/command", headers=HEADERS, json={
        "command": command,
        "parameters": {"channel": channel},
        "requester_agent_id": AGENT_ID
    })

def comfort_check():
    global fan_on, humidifier_on
    
    status = requests.get(f"{BASE}/devices/{DEVICE_ID}/status", headers=HEADERS).json()
    telemetry = {t["sensor_type"]: t for t in status.get("recent_telemetry", [])}
    
    temp = telemetry.get("temperature", {}).get("value")
    humidity = telemetry.get("humidity", {}).get("value")
    
    now = datetime.now()
    fan_icon = "🌀" if fan_on else "⭕"
    hum_icon = "💨" if humidifier_on else "⭕"
    print(f"[{now:%H:%M}] 🐾 {PET_TYPE.title()} Zone | 🌡️ {temp}°C  💧 {humidity}% | Fan:{fan_icon} Hum:{hum_icon}")
    
    # Temperature control (fan)
    if temp is not None:
        if temp > TEMP_MAX and not fan_on:
            print(f"  🔥 Too warm for {PET_TYPE}! Fan ON")
            send_command("relay_on", 1)
            fan_on = True
        elif temp <= TEMP_MIN and fan_on:
            print(f"  ❄️ Cool enough. Fan OFF")
            send_command("relay_off", 1)
            fan_on = False
    
    # Humidity control (humidifier)
    if humidity is not None:
        if humidity < HUMIDITY_MIN and not humidifier_on:
            print(f"  🏜️ Too dry ({humidity}%)! Humidifier ON")
            send_command("relay_on", 2)
            humidifier_on = True
        elif humidity >= HUMIDITY_MAX and humidifier_on:
            print(f"  💧 Humid enough ({humidity}%). Humidifier OFF")
            send_command("relay_off", 2)
            humidifier_on = False

# Main loop
if __name__ == "__main__":
    print(f"🐾 Pet Comfort Zone started for: {PET_TYPE}")
    print(f"   Temp range: {TEMP_MIN}–{TEMP_MAX}°C | Humidity: {HUMIDITY_MIN}–{HUMIDITY_MAX}%")
    while True:
        try:
            comfort_check()
        except Exception as e:
            print(f"  ❌ Error: {e}")
        time.sleep(120)  # Check every 2 minutes
```

---

## Expected Behavior / 预期效果

| Condition | Fan | Humidifier | Note |
|-----------|-----|------------|------|
| 24°C, 50% humidity | OFF | OFF | ✅ Perfect zone |
| 28°C, 50% humidity | ON | OFF | 🌀 Cooling |
| 22°C, 35% humidity | OFF | ON | 💨 Humidifying |
| 30°C, 30% humidity | ON | ON | 🚨 Both active |
| 20°C, 60% humidity | OFF | OFF | ✅ Both off |

**Sample log:**
```
🐾 Pet Comfort Zone started for: cat
   Temp range: 20–26°C | Humidity: 40–60%
[09:00] 🐾 Cat Zone | 🌡️ 24.5°C  💧 52% | Fan:⭕ Hum:⭕
[09:02] 🐾 Cat Zone | 🌡️ 27.1°C  💧 48% | Fan:⭕ Hum:⭕
  🔥 Too warm for cat! Fan ON
[09:04] 🐾 Cat Zone | 🌡️ 25.8°C  💧 38% | Fan:🌀 Hum:⭕
  🏜️ Too dry (38%)! Humidifier ON
[09:06] 🐾 Cat Zone | 🌡️ 24.2°C  💧 45% | Fan:🌀 Hum:💨
[09:08] 🐾 Cat Zone | 🌡️ 22.0°C  💧 52% | Fan:🌀 Hum:💨
  💧 Humid enough (52%). Humidifier OFF
[09:10] 🐾 Cat Zone | 🌡️ 20.0°C  💧 50% | Fan:🌀 Hum:⭕
  ❄️ Cool enough. Fan OFF
```

---

## Cost Summary / 成本总结

| Category | Cost |
|----------|------|
| Hardware (one-time) | ~$29.00 |
| RealWorldClaw API | Free tier |
| Electricity (fan + humidifier) | ~$5/year |
| **Total first year** | **~$34** |

> 🐾 A fraction of one vet visit — and your pet stays comfortable year-round.
