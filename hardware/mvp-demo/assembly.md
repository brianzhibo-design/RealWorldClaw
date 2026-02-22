# 10-Minute Assembly Guide / 10分钟组装指南

## Prerequisites / 准备工作

- All parts from [BOM](bom.md) / BOM 清单中的所有零件
- Arduino IDE 2.x with ESP32 board package / 安装好 ESP32 开发板包的 Arduino IDE
- Install libraries: **DHT sensor library** (Adafruit), **PubSubClient**, **ArduinoJson** v7
  
  安装库：DHT sensor library (Adafruit), PubSubClient, ArduinoJson v7

---

## Step 1: Wire DHT22 (2 min) / 第一步：连接 DHT22（2分钟）

1. Place DHT22 module on breadboard / 将 DHT22 模块插入面包板
2. **VCC** → ESP32 **3V3**
3. **DATA** → ESP32 **GPIO4**
4. **GND** → ESP32 **GND**

## Step 2: Wire Relay (2 min) / 第二步：连接继电器（2分钟）

1. **VCC** → ESP32 **5V** (USB VBUS pin)
2. **GND** → ESP32 **GND** (can share with DHT22 / 可与 DHT22 共用)
3. **IN** → ESP32 **GPIO5**

> 💡 No load needed for demo — just listen for the relay click!
> 
> 演示不需要接负载，听到继电器"咔嗒"声就算成功！

## Step 3: Flash Firmware (4 min) / 第三步：烧录固件（4分钟）

1. Connect ESP32 to PC via USB-C / 用 USB-C 线连接电脑
2. Open `firmware/main.cpp` in Arduino IDE
3. **Edit WiFi credentials** at the top / 修改顶部的 WiFi 账号密码：
   ```cpp
   #define WIFI_SSID  "your-wifi"
   #define WIFI_PASS  "your-password"
   ```
4. Select board: **ESP32S3 Dev Module** / 选择开发板
5. Click Upload / 点击上传 ⬆️
6. Open Serial Monitor (115200 baud) — you should see:
   ```
   === RealWorldClaw P0.2 MVP ===
   [WiFi] Connected! IP: 192.168.x.x
   [MQTT] Connecting... connected!
   [Telemetry] T=25.3°C H=48.2% Relay=OFF
   ```

## Step 4: Verify (2 min) / 第四步：验证（2分钟）

```bash
pip install paho-mqtt
python test/verify.py
```

Expected output / 预期输出：
```
✅ Telemetry: T=25.3°C H=48.2% relay=False
✅ Ping/Pong OK
  4/4 passed
```

---

## 🎉 Done! / 完成！

You now have an AI-agent-controllable hardware device. Any MQTT client (or the RealWorldClaw API) can:

你现在拥有一个 AI agent 可控制的硬件设备。任何 MQTT 客户端（或 RWC API）都可以：

- **Read** real-time temperature & humidity / 读取实时温湿度
- **Control** the relay (on/off/toggle) / 控制继电器开关
- **Ping** the device / 测试设备连通性

```json
// Send to: rwc/esp32-mvp-001/command
{"action": "relay_on"}
{"action": "relay_off"}
{"action": "relay_toggle"}
{"action": "ping"}
```

## Troubleshooting / 常见问题

| Issue / 问题 | Fix / 解决 |
|---|---|
| DHT22 read failed | Check wiring; ensure 3V3 not 5V for data / 检查接线，数据线用3.3V |
| WiFi won't connect | Check SSID/password; ensure 2.4GHz / 检查密码，确认2.4GHz |
| MQTT won't connect | Check broker address; firewall may block 1883 / 检查防火墙 |
| Relay doesn't click | Check 5V power; some boards need USB power / 确认5V供电 |
