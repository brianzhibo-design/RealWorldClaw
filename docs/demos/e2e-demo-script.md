# End-to-End Demo Script / 端到端演示脚本

> **Duration / 时长:** 3–5 minutes  
> **Scenario / 场景:** AI Agent controls a DHT22 temperature/humidity sensor + relay module via RealWorldClaw  
> **Base URL:** `https://api.realworldclaw.com` (or `http://localhost:8000` for local dev)

---

## Prerequisites / 前置准备

| Item | Description |
|------|------------|
| ESP32 dev board | Flashed with RealWorldClaw firmware (Energy Core) |
| DHT22 sensor | Connected to GPIO4 |
| Relay module | Connected to GPIO5 |
| RealWorldClaw account | Or local dev server running |

---

## Demo Flow / 演示流程

### Step 1: Register Agent / 注册 Agent

> 📸 **Screenshot:** Terminal showing successful agent registration  
> 预期：返回 `api_key` 和 `claim_url`

#### CLI

```bash
curl -X POST https://api.realworldclaw.com/api/v1/agents/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "climate-controller",
    "display_name": "Climate Controller",
    "description": "AI agent that monitors temperature and controls relay"
  }'
```

**Expected Output / 预期输出:**
```json
{
  "agent": {
    "id": "ag_abc12345",
    "name": "climate-controller",
    "status": "pending_claim"
  },
  "api_key": "rwc_sk_live_abcdef1234567890abcdef1234567890",
  "claim_url": "https://realworldclaw.com/claim/ag_abc12345?token=..."
}
```

#### Python SDK

```python
import requests

BASE = "https://api.realworldclaw.com/api/v1"

# Register agent
resp = requests.post(f"{BASE}/agents/register", json={
    "name": "climate-controller",
    "display_name": "Climate Controller",
    "description": "AI agent that monitors temperature and controls relay"
})
agent_data = resp.json()
API_KEY = agent_data["api_key"]
AGENT_ID = agent_data["agent"]["id"]
print(f"✅ Agent registered: {AGENT_ID}")
print(f"🔑 API Key: {API_KEY[:20]}...")
```

---

### Step 2: Register Device / 注册设备

> 📸 **Screenshot:** Device registration response with `device_token`  
> 预期：返回 `device_token`（仅显示一次）

#### CLI

```bash
export TOKEN="rwc_sk_live_abcdef1234567890abcdef1234567890"

curl -X POST https://api.realworldclaw.com/api/v1/devices/register \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "esp32-demo-001",
    "name": "Demo Sensor + Relay",
    "type": "sensor",
    "capabilities": ["temperature", "humidity", "relay"]
  }'
```

**Expected Output / 预期输出:**
```json
{
  "id": "uuid",
  "device_id": "esp32-demo-001",
  "name": "Demo Sensor + Relay",
  "device_token": "rwc_dev_xxxxxxxxxxxx"
}
```

#### Python SDK

```python
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

resp = requests.post(f"{BASE}/devices/register", headers=HEADERS, json={
    "device_id": "esp32-demo-001",
    "name": "Demo Sensor + Relay",
    "type": "sensor",
    "capabilities": ["temperature", "humidity", "relay"]
})
device = resp.json()
DEVICE_TOKEN = device["device_token"]
DEVICE_ID = device["device_id"]
print(f"✅ Device registered: {DEVICE_ID}")
```

---

### Step 3: Device Sends Telemetry / 设备上报数据

> 📸 **Screenshot:** Telemetry accepted response  
> 预期：状态 `accepted`，数据入库

#### CLI

```bash
export DEV_TOKEN="rwc_dev_xxxxxxxxxxxx"

curl -X POST https://api.realworldclaw.com/api/v1/devices/esp32-demo-001/telemetry \
  -H "Authorization: Bearer $DEV_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2026-02-22T10:00:00Z",
    "sensor_type": "temperature",
    "value": 28.5,
    "unit": "°C"
  }'
```

**Expected Output / 预期输出:**
```json
{ "id": "uuid", "status": "accepted" }
```

#### Python SDK

```python
DEV_HEADERS = {"Authorization": f"Bearer {DEVICE_TOKEN}"}

# Send temperature reading
resp = requests.post(f"{BASE}/devices/{DEVICE_ID}/telemetry",
    headers=DEV_HEADERS, json={
        "timestamp": "2026-02-22T10:00:00Z",
        "sensor_type": "temperature",
        "value": 28.5,
        "unit": "°C"
    })
print(f"📡 Telemetry: {resp.json()['status']}")

# Send humidity reading
resp = requests.post(f"{BASE}/devices/{DEVICE_ID}/telemetry",
    headers=DEV_HEADERS, json={
        "timestamp": "2026-02-22T10:00:01Z",
        "sensor_type": "humidity",
        "value": 65.2,
        "unit": "%"
    })
print(f"📡 Humidity: {resp.json()['status']}")
```

---

### Step 4: Read Device Status / 读取设备状态

> 📸 **Screenshot:** Device status showing online + recent telemetry  
> 预期：设备在线，显示最近的温湿度数据

#### CLI

```bash
curl -s https://api.realworldclaw.com/api/v1/devices/esp32-demo-001/status \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

**Expected Output / 预期输出:**
```json
{
  "device_id": "esp32-demo-001",
  "status": "online",
  "health": "healthy",
  "last_seen_at": "2026-02-22T10:00:01Z",
  "recent_telemetry": [
    { "sensor_type": "temperature", "value": 28.5, "unit": "°C" },
    { "sensor_type": "humidity", "value": 65.2, "unit": "%" }
  ]
}
```

#### Python SDK

```python
resp = requests.get(f"{BASE}/devices/{DEVICE_ID}/status", headers=HEADERS)
status = resp.json()
temp = next(t for t in status["recent_telemetry"] if t["sensor_type"] == "temperature")
print(f"🌡️ Temperature: {temp['value']}{temp['unit']}")
print(f"📶 Device health: {status['health']}")
```

---

### Step 5: AI Decision → Trigger Relay / AI 决策 → 触发继电器

> 📸 **Screenshot:** Command sent + relay activation  
> 预期：温度>28°C，AI 决定开启继电器（风扇/空调）

#### CLI

```bash
# Temperature is 28.5°C > threshold 28°C → turn on relay!
curl -X POST https://api.realworldclaw.com/api/v1/devices/esp32-demo-001/command \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "command": "relay_on",
    "parameters": { "channel": 1 },
    "requester_agent_id": "ag_abc12345"
  }'
```

**Expected Output / 预期输出:**
```json
{
  "command_id": "uuid",
  "status": "pending",
  "message": "Command 'relay_on' queued for esp32-demo-001"
}
```

#### Python SDK — Full AI Logic

```python
# AI Decision Logic
TEMP_THRESHOLD = 28.0

status = requests.get(f"{BASE}/devices/{DEVICE_ID}/status", headers=HEADERS).json()
temp_reading = next(
    (t for t in status["recent_telemetry"] if t["sensor_type"] == "temperature"),
    None
)

if temp_reading and temp_reading["value"] > TEMP_THRESHOLD:
    print(f"🔥 Temperature {temp_reading['value']}°C exceeds {TEMP_THRESHOLD}°C")
    print("🤖 AI Decision: Activate cooling relay")
    
    resp = requests.post(f"{BASE}/devices/{DEVICE_ID}/command",
        headers=HEADERS, json={
            "command": "relay_on",
            "parameters": {"channel": 1},
            "requester_agent_id": AGENT_ID
        })
    result = resp.json()
    print(f"⚡ Relay command: {result['status']}")
    print(f"📋 Command ID: {result['command_id']}")
else:
    print(f"✅ Temperature normal ({temp_reading['value']}°C). No action needed.")
```

---

### Step 6: Verify & Cleanup / 验证与清理

> 📸 **Screenshot:** Final device status showing pending command

```python
# Verify command was queued
status = requests.get(f"{BASE}/devices/{DEVICE_ID}/status", headers=HEADERS).json()
print(f"📋 Pending commands: {len(status.get('pending_commands', []))}")
for cmd in status.get("pending_commands", []):
    print(f"   → {cmd['command']} ({cmd['status']})")
```

---

## Complete Python Script / 完整 Python 脚本

Save as `demo.py` and run:

```python
#!/usr/bin/env python3
"""RealWorldClaw E2E Demo — AI Agent Controls Sensor + Relay"""

import requests, time

BASE = "https://api.realworldclaw.com/api/v1"
TEMP_THRESHOLD = 28.0

# 1. Register Agent
print("=" * 50)
print("Step 1: Register Agent")
agent_resp = requests.post(f"{BASE}/agents/register", json={
    "name": f"demo-agent-{int(time.time())}",
    "display_name": "Demo Climate Agent",
    "description": "Demo agent for temperature monitoring and relay control"
}).json()
API_KEY = agent_resp["api_key"]
AGENT_ID = agent_resp["agent"]["id"]
HEADERS = {"Authorization": f"Bearer {API_KEY}"}
print(f"  ✅ Agent: {AGENT_ID}")

# 2. Register Device
print("\nStep 2: Register Device")
dev_resp = requests.post(f"{BASE}/devices/register", headers=HEADERS, json={
    "device_id": f"esp32-demo-{int(time.time())}",
    "name": "Demo Sensor+Relay",
    "type": "sensor",
    "capabilities": ["temperature", "humidity", "relay"]
}).json()
DEVICE_ID = dev_resp["device_id"]
DEV_TOKEN = dev_resp["device_token"]
DEV_HEADERS = {"Authorization": f"Bearer {DEV_TOKEN}"}
print(f"  ✅ Device: {DEVICE_ID}")

# 3. Send Telemetry
print("\nStep 3: Send Telemetry")
for sensor, value, unit in [("temperature", 28.5, "°C"), ("humidity", 65.2, "%")]:
    r = requests.post(f"{BASE}/devices/{DEVICE_ID}/telemetry",
        headers=DEV_HEADERS, json={
            "sensor_type": sensor, "value": value, "unit": unit
        })
    print(f"  📡 {sensor}: {value}{unit} → {r.json()['status']}")

# 4. Read Status
print("\nStep 4: Read Device Status")
status = requests.get(f"{BASE}/devices/{DEVICE_ID}/status", headers=HEADERS).json()
print(f"  📶 Health: {status['health']}")

# 5. AI Decision
print("\nStep 5: AI Decision")
temp = next(t for t in status["recent_telemetry"] if t["sensor_type"] == "temperature")
print(f"  🌡️ Current: {temp['value']}{temp['unit']} (threshold: {TEMP_THRESHOLD}°C)")
if temp["value"] > TEMP_THRESHOLD:
    cmd = requests.post(f"{BASE}/devices/{DEVICE_ID}/command", headers=HEADERS, json={
        "command": "relay_on",
        "parameters": {"channel": 1},
        "requester_agent_id": AGENT_ID
    }).json()
    print(f"  ⚡ Relay ON → {cmd['status']}")
else:
    print("  ✅ No action needed")

print("\n" + "=" * 50)
print("🎉 Demo complete! AI agent successfully controlled hardware.")
```

---

## Recording Tips / 录制提示

1. **Terminal:** Use a clean terminal with large font (16pt+)
2. **Split screen:** Terminal left, device/LED right (if filming hardware)
3. **Pace:** Pause 2s between steps for viewer comprehension
4. **Narration points:**
   - Step 1: "First, we register an AI agent on the platform"
   - Step 2: "Now we register our ESP32 hardware device"
   - Step 3: "The device reports real sensor data"
   - Step 4: "The agent reads the current temperature"
   - Step 5: "Temperature exceeds threshold — AI triggers the relay!"
