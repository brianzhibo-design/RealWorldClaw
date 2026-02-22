# ⚡ Home Energy Saver / 家庭节能助手

> AI monitors room temperature and controls AC/heater via IR or relay to minimize energy waste.  
> AI 监控室温，通过红外或继电器控制空调，减少能源浪费。

---

## Overview / 概述

An ESP32 monitors room temperature and occupancy. The AI agent learns comfortable temperature ranges and controls an AC unit via relay (on/off) or IR transmitter (full control). When no one is home or the temperature is in the comfort zone, it turns off the AC — saving electricity automatically.

---

## BOM (Bill of Materials) / 物料清单

| # | Component | Spec | Qty | Est. Cost (USD) |
|---|-----------|------|-----|-----------------|
| 1 | ESP32-WROOM-32 dev board | 38-pin | 1 | $4.00 |
| 2 | DHT22 sensor | Temperature + humidity | 1 | $2.00 |
| 3 | IR transmitter module | 38kHz, 940nm LED | 1 | $0.50 |
| 4 | PIR motion sensor | HC-SR501 | 1 | $1.50 |
| 5 | 5V relay module | 1-channel (backup control) | 1 | $1.50 |
| 6 | Jumper wires | F-F, 20cm | 10 | $0.50 |
| 7 | USB-C cable + power adapter | 5V 2A | 1 | $3.00 |
| 8 | 3D-printed case (optional) | PLA, ~20g | 1 | $0.50 |

**Total estimated cost: ~$13.50 / ≈¥96**

---

## Wiring Diagram / 接线图

```
ESP32 GPIO Pin Map
──────────────────
3V3   ──→  DHT22 VCC
GND   ──→  DHT22 GND
GPIO4  ──→  DHT22 DATA

3V3   ──→  PIR VCC
GND   ──→  PIR GND
GPIO13 ──→  PIR OUT

GPIO14 ──→  IR LED (via 100Ω resistor)
GND   ──→  IR LED cathode

VIN   ──→  Relay VCC
GND   ──→  Relay GND
GPIO5  ──→  Relay IN
```

```
┌─────────┐     ┌──────────┐     ┌──────────┐
│  DHT22  │────→│          │────→│ IR LED   │───→ 📺 AC Unit
│(temp/hum│     │          │     └──────────┘
└─────────┘     │  ESP32   │
┌─────────┐     │          │     ┌──────────┐
│  PIR    │────→│          │────→│  Relay   │───→ ⚡ AC Power
│(motion) │     │          │     └──────────┘
└─────────┘     └──────────┘
                     │
                     └───→ WiFi → RealWorldClaw API
```

---

## Code Example / 代码示例

### Agent Logic (Python)

```python
#!/usr/bin/env python3
"""Home Energy Saver — AI Agent Logic"""

import requests
import time
from datetime import datetime

BASE = "https://api.realworldclaw.com/api/v1"
API_KEY = "rwc_sk_live_..."
HEADERS = {"Authorization": f"Bearer {API_KEY}"}
DEVICE_ID = "esp32-energy-001"
AGENT_ID = "ag_energy_saver"

# Comfort zone
TEMP_COOL_TARGET = 26.0   # °C — AC cools to this
TEMP_HEAT_TARGET = 20.0   # °C — heater warms to this
TEMP_DEADBAND = 1.0        # °C — hysteresis to prevent rapid cycling
NO_MOTION_TIMEOUT = 1800   # 30 min — turn off if no one home

ac_state = "off"
last_motion_time = time.time()

def get_status():
    resp = requests.get(f"{BASE}/devices/{DEVICE_ID}/status", headers=HEADERS)
    return resp.json()

def send_command(command, params=None):
    requests.post(f"{BASE}/devices/{DEVICE_ID}/command", headers=HEADERS, json={
        "command": command,
        "parameters": params or {},
        "requester_agent_id": AGENT_ID
    })

def energy_check():
    global ac_state, last_motion_time
    
    status = get_status()
    telemetry = {t["sensor_type"]: t for t in status.get("recent_telemetry", [])}
    
    temp = telemetry.get("temperature", {}).get("value")
    motion = telemetry.get("motion", {}).get("value", 0)
    
    now = datetime.now()
    print(f"[{now:%H:%M}] 🌡️ {temp}°C  👤 Motion: {'Yes' if motion else 'No'}  ❄️ AC: {ac_state}")
    
    # Update last motion time
    if motion:
        last_motion_time = time.time()
    
    # Check occupancy
    idle_time = time.time() - last_motion_time
    if idle_time > NO_MOTION_TIMEOUT and ac_state != "off":
        print(f"  🏠 No motion for {idle_time/60:.0f}min — turning off AC")
        send_command("relay_off", {"channel": 1})
        ac_state = "off"
        return
    
    if temp is None:
        return
    
    # Summer mode: cool if too hot
    if temp > TEMP_COOL_TARGET + TEMP_DEADBAND and ac_state != "cooling":
        print(f"  🔥 {temp}°C > {TEMP_COOL_TARGET + TEMP_DEADBAND}°C → Cooling ON")
        send_command("relay_on", {"channel": 1})
        ac_state = "cooling"
    
    # Reached target: turn off
    elif ac_state == "cooling" and temp <= TEMP_COOL_TARGET:
        print(f"  ✅ {temp}°C ≤ {TEMP_COOL_TARGET}°C → AC OFF (target reached)")
        send_command("relay_off", {"channel": 1})
        ac_state = "off"
    
    # Winter mode: heat if too cold
    elif temp < TEMP_HEAT_TARGET - TEMP_DEADBAND and ac_state != "heating":
        print(f"  🥶 {temp}°C < {TEMP_HEAT_TARGET - TEMP_DEADBAND}°C → Heating ON")
        send_command("relay_on", {"channel": 1})
        ac_state = "heating"
    
    elif ac_state == "heating" and temp >= TEMP_HEAT_TARGET:
        print(f"  ✅ {temp}°C ≥ {TEMP_HEAT_TARGET}°C → Heater OFF")
        send_command("relay_off", {"channel": 1})
        ac_state = "off"

# Main loop
if __name__ == "__main__":
    print("⚡ Home Energy Saver started")
    while True:
        try:
            energy_check()
        except Exception as e:
            print(f"  ❌ Error: {e}")
        time.sleep(60)  # Check every minute
```

---

## Expected Behavior / 预期效果

| Condition | AI Action | Energy Impact |
|-----------|-----------|---------------|
| Temp > 27°C, someone home | ❄️ AC ON | Normal usage |
| Temp reaches 26°C | ✅ AC OFF | Saves energy |
| No motion for 30min | 🏠 AC OFF | **Major savings** |
| Temp < 19°C, someone home | 🔥 Heater ON | Normal usage |
| Night (schedule) | 💤 Wider deadband | Saves energy |

**Sample log:**
```
[08:00] 🌡️ 24.5°C  👤 Motion: Yes  ❄️ AC: off
[12:30] 🌡️ 28.1°C  👤 Motion: Yes  ❄️ AC: off
  🔥 28.1°C > 27.0°C → Cooling ON
[12:45] 🌡️ 26.0°C  👤 Motion: Yes  ❄️ AC: cooling
  ✅ 26.0°C ≤ 26.0°C → AC OFF (target reached)
[14:00] 🌡️ 27.5°C  👤 Motion: No   ❄️ AC: off
  🏠 No motion for 35min — turning off AC
```

**Estimated savings: 20–40% on AC electricity** compared to leaving AC on all day.

---

## Cost Summary / 成本总结

| Category | Cost |
|----------|------|
| Hardware (one-time) | ~$13.50 |
| RealWorldClaw API | Free tier |
| Electricity (device) | ~$0.50/year |
| **Est. AC savings/year** | **-$50 to -$150** |
| **Net first-year savings** | **$36 – $136** |

> 💡 The system pays for itself within the first month of summer.
