# Quickstart Video Script — 10 Minutes: Zero to AI-Controlled Hardware

> **Total Duration:** ~10 minutes  
> **Goal:** Viewer goes from nothing to a working AI agent controlling real hardware  
> **Tone:** Energetic, clear, beginner-friendly  
> **Language:** English with Chinese subtitles (中英字幕)

---

## Opening (0:00–0:30)

| Element | Content |
|---------|---------|
| **Scene** | Animated RealWorldClaw logo → cut to presenter at desk with ESP32 + sensor |
| **Visual** | Hardware components laid out neatly on desk |
| **Voiceover** | "What if your AI could reach into the real world? In the next 10 minutes, you'll build an AI agent that reads a real temperature sensor and controls a relay — no IoT experience needed. This is RealWorldClaw." |

---

## Act 1: What We're Building (0:30–1:30)

| Element | Content |
|---------|---------|
| **Scene** | Architecture diagram animation |
| **Visual** | Flow: `ESP32 + DHT22` → `WiFi` → `RealWorldClaw API` → `AI Agent` → `Relay Command` → `ESP32 activates relay` |
| **Voiceover** | "Here's the plan: An ESP32 microcontroller reads temperature from a DHT22 sensor and reports it to the RealWorldClaw platform. Our AI agent monitors the data and, when it gets too hot, sends a command back to turn on a relay — which could control a fan, AC, or anything you want." |
| **B-roll** | Quick cuts: sensor reading → API call → relay clicking → fan spinning |

---

## Act 2: Hardware Assembly (1:30–3:30)

### Shot 2a: Parts (1:30–2:00)

| Element | Content |
|---------|---------|
| **Scene** | Close-up of each component |
| **Visual** | Each part appears with label overlay |
| **Voiceover** | "You'll need: an ESP32 dev board — about $4. A DHT22 temperature and humidity sensor — $2. A relay module — $2. Some jumper wires, and a USB-C cable. Total cost: under $10." |

**Parts overlay:**
- ESP32-WROOM-32 dev board
- DHT22 sensor module
- 1-channel relay module
- Jumper wires (F-F) × 7
- USB-C cable

### Shot 2b: Wiring (2:00–3:30)

| Element | Content |
|---------|---------|
| **Scene** | Top-down camera showing breadboard wiring |
| **Visual** | Animated wiring diagram overlaid, connections highlighted one by one |
| **Voiceover** | "Let's wire it up. DHT22: VCC to 3.3V, GND to GND, DATA to GPIO4. Relay: VCC to 5V — use the VIN pin — GND to GND, IN to GPIO5. That's it — no soldering needed." |

**Wiring table shown on screen:**

```
DHT22          ESP32
─────          ─────
VCC    →       3V3
GND    →       GND
DATA   →       GPIO4

Relay          ESP32
─────          ─────
VCC    →       VIN (5V)
GND    →       GND
IN     →       GPIO5
```

---

## Act 3: Firmware Flash (3:30–5:00)

### Shot 3a: Install Tools (3:30–4:00)

| Element | Content |
|---------|---------|
| **Scene** | Screen recording: terminal |
| **Visual** | Commands typed with output |
| **Voiceover** | "Now let's flash the firmware. If you have PlatformIO installed, just clone the repo and flash. If not, we have a one-click web flasher at flash.realworldclaw.com." |

```bash
# Option A: PlatformIO
git clone https://github.com/RealWorldClaw/realworldclaw.git
cd realworldclaw/firmware/energy-core
cp config.example.h config.h
# Edit config.h with your WiFi credentials and device token
pio run --target upload
```

### Shot 3b: Configure & Flash (4:00–5:00)

| Element | Content |
|---------|---------|
| **Scene** | Screen recording: editing config, then flashing |
| **Visual** | Highlight the 3 fields to edit |
| **Voiceover** | "Open config.h. Set your WiFi name, password, and paste the device token we'll get in the next step. Hit upload... and we're flashed! The blue LED blinks — that means it's trying to connect." |

```c
// config.h — just 3 lines to change:
#define WIFI_SSID     "YourWiFi"
#define WIFI_PASSWORD  "YourPassword"
#define DEVICE_TOKEN   "rwc_dev_xxxxxxxxxxxx"
```

---

## Act 4: Platform Setup (5:00–7:00)

### Shot 4a: Register Agent (5:00–5:45)

| Element | Content |
|---------|---------|
| **Scene** | Screen recording: terminal with curl |
| **Visual** | Command + response highlighted |
| **Voiceover** | "Back on the software side. First, register an AI agent. One API call — you get back an API key and an agent ID. Save these." |

```bash
curl -X POST https://api.realworldclaw.com/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{"name":"my-climate-bot","description":"Temperature monitor and relay controller"}'
```

> 📸 Highlight the `api_key` in the response

### Shot 4b: Register Device (5:45–6:30)

| Element | Content |
|---------|---------|
| **Scene** | Screen recording: terminal |
| **Visual** | Show device_token — emphasize "save this!" |
| **Voiceover** | "Now register the hardware device. You get a device token — this is what the ESP32 uses to authenticate. Copy this into your firmware config and re-flash if you haven't already." |

```bash
curl -X POST https://api.realworldclaw.com/api/v1/devices/register \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"esp32-001","name":"My Sensor","type":"sensor","capabilities":["temperature","humidity","relay"]}'
```

### Shot 4c: Verify Connection (6:30–7:00)

| Element | Content |
|---------|---------|
| **Scene** | Split: terminal left, ESP32 with blinking LED right |
| **Visual** | Device status returns `"online"` |
| **Voiceover** | "Check the device status... and it's online! The ESP32 is connected and reporting data. Look — real temperature and humidity readings from the sensor on my desk." |

```bash
curl -s https://api.realworldclaw.com/api/v1/devices/esp32-001/status \
  -H "Authorization: Bearer $API_KEY" | python3 -m json.tool
```

---

## Act 5: AI Controls Hardware (7:00–9:00)

### Shot 5a: The AI Logic (7:00–8:00)

| Element | Content |
|---------|---------|
| **Scene** | Screen recording: Python script in editor |
| **Visual** | Code with annotations |
| **Voiceover** | "Here's where it gets exciting. This Python script is our AI agent. It reads the temperature, and if it's above 28 degrees, it sends a relay_on command. Simple logic — but this is the pattern for any AI-to-hardware control." |

```python
import requests

BASE = "https://api.realworldclaw.com/api/v1"
HEADERS = {"Authorization": "Bearer rwc_sk_live_..."}
DEVICE = "esp32-001"

# Read sensor data
status = requests.get(f"{BASE}/devices/{DEVICE}/status", headers=HEADERS).json()
temp = next(t for t in status["recent_telemetry"] if t["sensor_type"] == "temperature")

print(f"🌡️ Temperature: {temp['value']}°C")

# AI Decision
if temp["value"] > 28.0:
    print("🔥 Too hot! Activating relay...")
    requests.post(f"{BASE}/devices/{DEVICE}/command", headers=HEADERS, json={
        "command": "relay_on",
        "parameters": {"channel": 1},
        "requester_agent_id": "ag_xxx"
    })
    print("⚡ Relay activated!")
```

### Shot 5b: Run It! (8:00–9:00)

| Element | Content |
|---------|---------|
| **Scene** | Split screen: terminal running script (left) + physical relay clicking on (right) |
| **Visual** | Terminal output appears line by line; relay LED turns on; optional: fan starts spinning |
| **Voiceover** | "Let's run it. Temperature is 29.3 degrees... above our threshold... and — CLICK! — the relay activates! If we had a fan plugged in, it would be spinning right now. That's it — AI just controlled real hardware through the cloud." |

**Terminal output:**
```
🌡️ Temperature: 29.3°C
🔥 Too hot! Activating relay...
⚡ Relay activated!
```

---

## Act 6: What's Next (9:00–9:45)

| Element | Content |
|---------|---------|
| **Scene** | Montage of possibilities |
| **Visual** | Quick cuts: plant watering system, pet monitoring, energy dashboard |
| **Voiceover** | "You just built your first AI-controlled hardware system. From here, you can: add more sensors, build automation rules, connect to LLMs for natural language control, or join the RealWorldClaw marketplace to share your components. Check the links below for tutorials on smart plant monitoring, energy saving, and more." |

---

## Closing (9:45–10:00)

| Element | Content |
|---------|---------|
| **Scene** | RealWorldClaw logo + links |
| **Visual** | GitHub, docs, Discord links |
| **Voiceover** | "Star us on GitHub, join the Discord, and let us know what you build. This is RealWorldClaw — where AI meets the real world." |

**End card links:**
- 🌐 realworldclaw.com
- 📦 github.com/RealWorldClaw/realworldclaw
- 💬 discord.gg/realworldclaw
- 📖 docs.realworldclaw.com

---

## Production Notes

- **Resolution:** 1920×1080 minimum, 4K preferred
- **Terminal font:** JetBrains Mono or SF Mono, 18pt
- **Terminal theme:** Dark (Dracula or One Dark)
- **Music:** Lo-fi / electronic ambient, low volume under voiceover
- **Subtitles:** Bilingual EN/CN hardcoded
- **Thumbnail:** ESP32 + robot emoji + "10 MIN" badge
