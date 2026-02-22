# 🌱 Smart Plant Monitor / 智能植物监控

> AI monitors soil moisture & temperature, automatically waters plants when needed.  
> AI 监控土壤湿度和温度，需要时自动浇水。

---

## Overview / 概述

An ESP32 reads soil moisture and air temperature/humidity via sensors. When soil moisture drops below a threshold, the AI agent triggers a relay-controlled water pump. The system also prevents over-watering by checking recent watering history.

---

## BOM (Bill of Materials) / 物料清单

| # | Component | Spec | Qty | Est. Cost (USD) |
|---|-----------|------|-----|-----------------|
| 1 | ESP32-WROOM-32 dev board | 38-pin | 1 | $4.00 |
| 2 | DHT22 sensor | Temperature + humidity | 1 | $2.00 |
| 3 | Capacitive soil moisture sensor | v1.2 analog | 1 | $1.50 |
| 4 | 5V relay module | 1-channel, optocoupled | 1 | $1.50 |
| 5 | Mini water pump | 3–5V DC submersible | 1 | $2.00 |
| 6 | Silicone tubing | 6mm OD, 1m | 1 | $1.00 |
| 7 | Jumper wires | F-F, 20cm | 10 | $0.50 |
| 8 | USB-C cable + power adapter | 5V 2A | 1 | $3.00 |
| 9 | Water container | Any 1L+ container | 1 | $0.00 |

**Total estimated cost: ~$15.50 / ≈¥110**

---

## Wiring Diagram / 接线图

```
ESP32 GPIO Pin Map
──────────────────
3V3  ──→  DHT22 VCC
GND  ──→  DHT22 GND (shared ground bus)
GPIO4 ──→  DHT22 DATA

3V3  ──→  Soil Sensor VCC
GND  ──→  Soil Sensor GND
GPIO34 ──→  Soil Sensor AOUT (analog)

VIN (5V) ──→  Relay VCC
GND  ────→  Relay GND
GPIO5 ───→  Relay IN

Relay COM  ──→  Pump (+)
Relay NO   ──→  5V supply (+)
Pump (-)   ──→  5V supply GND
```

```
┌─────────┐     ┌──────────┐
│  DHT22  │────→│          │     ┌─────────┐
│(air T/H)│     │          │────→│  Relay   │──→ 💧 Water Pump
└─────────┘     │  ESP32   │     └─────────┘
┌─────────┐     │          │
│  Soil   │────→│          │────→ WiFi → RealWorldClaw API
│ Sensor  │     │          │
└─────────┘     └──────────┘
```

---

## Code Example / 代码示例

### Agent Logic (Python)

```python
#!/usr/bin/env python3
"""Smart Plant Monitor — AI Agent Logic"""

import requests
import time
from datetime import datetime, timedelta

BASE = "https://api.realworldclaw.com/api/v1"
API_KEY = "rwc_sk_live_..."
HEADERS = {"Authorization": f"Bearer {API_KEY}"}
DEVICE_ID = "esp32-plant-001"
AGENT_ID = "ag_plant_monitor"

# Thresholds
SOIL_MOISTURE_MIN = 30.0    # % — below this = too dry
SOIL_MOISTURE_MAX = 70.0    # % — above this = wet enough
TEMP_MIN = 5.0              # °C — too cold, don't water
WATERING_COOLDOWN = 3600    # seconds — min time between waterings

last_watered = None

def check_and_water():
    global last_watered
    
    # Read device status
    status = requests.get(f"{BASE}/devices/{DEVICE_ID}/status", headers=HEADERS).json()
    telemetry = {t["sensor_type"]: t for t in status.get("recent_telemetry", [])}
    
    soil = telemetry.get("soil_moisture", {}).get("value")
    temp = telemetry.get("temperature", {}).get("value")
    humidity = telemetry.get("humidity", {}).get("value")
    
    print(f"[{datetime.now():%H:%M}] 🌡️ {temp}°C  💧 Soil: {soil}%  🌫️ Humidity: {humidity}%")
    
    # Decision logic
    if soil is None:
        print("  ⚠️ No soil moisture data")
        return
    
    if soil >= SOIL_MOISTURE_MIN:
        print(f"  ✅ Soil moisture OK ({soil}% ≥ {SOIL_MOISTURE_MIN}%)")
        return
    
    if temp is not None and temp < TEMP_MIN:
        print(f"  🥶 Too cold ({temp}°C). Skipping watering.")
        return
    
    if last_watered and (time.time() - last_watered) < WATERING_COOLDOWN:
        remaining = WATERING_COOLDOWN - (time.time() - last_watered)
        print(f"  ⏳ Cooldown active. {remaining:.0f}s remaining.")
        return
    
    # Water the plant!
    print(f"  🚿 Soil too dry ({soil}%)! Activating pump for 5 seconds...")
    
    # Turn pump ON
    requests.post(f"{BASE}/devices/{DEVICE_ID}/command", headers=HEADERS, json={
        "command": "relay_on",
        "parameters": {"channel": 1, "duration_ms": 5000},
        "requester_agent_id": AGENT_ID
    })
    last_watered = time.time()
    print("  💧 Watering complete!")

# Main loop — check every 5 minutes
if __name__ == "__main__":
    print("🌱 Smart Plant Monitor started")
    while True:
        try:
            check_and_water()
        except Exception as e:
            print(f"  ❌ Error: {e}")
        time.sleep(300)  # 5 minutes
```

---

## Expected Behavior / 预期效果

| Condition | AI Action |
|-----------|-----------|
| Soil moisture > 30% | ✅ No action, log status |
| Soil moisture < 30%, temp > 5°C | 💧 Activate pump for 5s |
| Soil moisture < 30%, temp < 5°C | 🥶 Skip (too cold to water) |
| Watered < 1 hour ago | ⏳ Wait for cooldown |
| Sensor offline | ⚠️ Alert, no action |

**Dashboard output example:**
```
[08:00] 🌡️ 22.3°C  💧 Soil: 45%  🌫️ Humidity: 58%
  ✅ Soil moisture OK (45% ≥ 30%)
[08:05] 🌡️ 22.5°C  💧 Soil: 28%  🌫️ Humidity: 57%
  🚿 Soil too dry (28%)! Activating pump for 5 seconds...
  💧 Watering complete!
[08:10] 🌡️ 22.4°C  💧 Soil: 52%  🌫️ Humidity: 60%
  ✅ Soil moisture OK (52% ≥ 30%)
```

---

## Cost Summary / 成本总结

| Category | Cost |
|----------|------|
| Hardware (one-time) | ~$15.50 |
| RealWorldClaw API | Free tier (10k calls/mo) |
| Electricity (~0.5W 24/7) | ~$0.50/year |
| **Total first year** | **~$16** |
