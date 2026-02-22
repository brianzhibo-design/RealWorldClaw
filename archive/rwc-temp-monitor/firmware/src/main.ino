/*
 * ─── RealWorldClaw 温湿度监控器固件 ───
 * 
 * 硬件：ESP32-C3 SuperMini + DHT22 + LED
 * 功能：WiFi连接、MQTT上报、DHT22读取、LED状态指示、OTA更新
 * 
 * Author: RealWorldClaw Team
 * 协议：MIT License
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <ArduinoOTA.h>
#include <Preferences.h>

// ─── 引脚定义 ───
#define DHT_PIN       4
#define DHT_TYPE      DHT22
#define LED_PIN       8

// ─── 默认配置（可通过MQTT远程修改） ───
#define DEFAULT_WIFI_SSID     "YourWiFi"
#define DEFAULT_WIFI_PASS     "YourPassword"
#define DEFAULT_MQTT_SERVER   "192.168.1.100"
#define DEFAULT_MQTT_PORT     1883
#define DEFAULT_MQTT_USER     ""
#define DEFAULT_MQTT_PASS     ""
#define DEFAULT_AGENT_ID      "temp-monitor-001"
#define DEFAULT_INTERVAL_MS   30000    // 30秒上报间隔

// ─── 全局对象 ───
DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient mqtt(espClient);
Preferences prefs;

// ─── 状态变量 ───
String agentId;
String topicTemp;
String topicHumi;
String topicStatus;
String topicCommand;
String topicConfig;

unsigned long lastReadTime = 0;
unsigned long intervalMs = DEFAULT_INTERVAL_MS;
unsigned long lastWifiAttempt = 0;
unsigned long lastMqttAttempt = 0;

float lastTemp = NAN;
float lastHumi = NAN;
int readFailCount = 0;
bool ledState = false;

// LED闪烁模式
enum LedMode { LED_OFF, LED_SLOW, LED_FAST, LED_ON };
LedMode currentLedMode = LED_FAST;
unsigned long lastLedToggle = 0;

// ─── 前向声明 ───
void setupWiFi();
void setupMQTT();
void setupOTA();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void reconnectMQTT();
void readAndPublish();
void updateLed();
void publishStatus(const char* state);
void loadConfig();
void saveConfig();
void buildTopics();

// ═══════════════════════════════════════
void setup() {
    Serial.begin(115200);
    delay(1000);
    
    Serial.println();
    Serial.println("╔══════════════════════════════════════╗");
    Serial.println("║  RealWorldClaw 温湿度监控器 v1.0.0  ║");
    Serial.println("║  by RealWorldClaw Team                    ║");
    Serial.println("╚══════════════════════════════════════╝");
    Serial.println();
    
    // LED初始化
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, LOW);
    currentLedMode = LED_FAST; // 快闪=启动中
    
    // 加载保存的配置
    loadConfig();
    buildTopics();
    
    // DHT22初始化
    dht.begin();
    Serial.println("[DHT22] 传感器初始化完成");
    
    // WiFi连接
    setupWiFi();
    
    // MQTT设置
    setupMQTT();
    
    // OTA更新
    setupOTA();
    
    Serial.println("[系统] 初始化完成！开始工作~");
}

void loop() {
    // WiFi重连
    if (WiFi.status() != WL_CONNECTED) {
        currentLedMode = LED_FAST;
        if (millis() - lastWifiAttempt > 10000) {
            setupWiFi();
            lastWifiAttempt = millis();
        }
    }
    
    // MQTT重连
    if (WiFi.status() == WL_CONNECTED && !mqtt.connected()) {
        currentLedMode = LED_SLOW;
        if (millis() - lastMqttAttempt > 5000) {
            reconnectMQTT();
            lastMqttAttempt = millis();
        }
    }
    
    if (mqtt.connected()) {
        currentLedMode = LED_ON;
        mqtt.loop();
    }
    
    // 定时读取并上报
    if (millis() - lastReadTime >= intervalMs) {
        readAndPublish();
        lastReadTime = millis();
    }
    
    // OTA处理
    ArduinoOTA.handle();
    
    // LED更新
    updateLed();
    
    delay(10);
}

// ═══════════════════════════════════════
// WiFi 连接
// ═══════════════════════════════════════
void setupWiFi() {
    String ssid = prefs.getString("wifi_ssid", DEFAULT_WIFI_SSID);
    String pass = prefs.getString("wifi_pass", DEFAULT_WIFI_PASS);
    
    Serial.printf("[WiFi] 连接到 %s ...\n", ssid.c_str());
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid.c_str(), pass.c_str());
    
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("\n[WiFi] 已连接！IP: %s\n", WiFi.localIP().toString().c_str());
        Serial.printf("[WiFi] RSSI: %d dBm\n", WiFi.RSSI());
    } else {
        Serial.println("\n[WiFi] 连接失败，将稍后重试");
    }
}

// ═══════════════════════════════════════
// MQTT 设置与回调
// ═══════════════════════════════════════
void setupMQTT() {
    String server = prefs.getString("mqtt_srv", DEFAULT_MQTT_SERVER);
    int port = prefs.getInt("mqtt_port", DEFAULT_MQTT_PORT);
    
    mqtt.setServer(server.c_str(), port);
    mqtt.setCallback(mqttCallback);
    mqtt.setBufferSize(512);
    
    Serial.printf("[MQTT] 服务器: %s:%d\n", server.c_str(), port);
}

void reconnectMQTT() {
    String user = prefs.getString("mqtt_user", DEFAULT_MQTT_USER);
    String pass = prefs.getString("mqtt_pass", DEFAULT_MQTT_PASS);
    String clientId = "rwc-" + agentId;
    
    Serial.printf("[MQTT] 连接中 (clientId: %s)...\n", clientId.c_str());
    
    bool connected;
    if (user.length() > 0) {
        connected = mqtt.connect(clientId.c_str(), user.c_str(), pass.c_str());
    } else {
        connected = mqtt.connect(clientId.c_str());
    }
    
    if (connected) {
        Serial.println("[MQTT] 已连接！");
        mqtt.subscribe(topicCommand.c_str());
        mqtt.subscribe(topicConfig.c_str());
        publishStatus("online");
    } else {
        Serial.printf("[MQTT] 连接失败, rc=%d\n", mqtt.state());
    }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String msg;
    for (unsigned int i = 0; i < length; i++) {
        msg += (char)payload[i];
    }
    
    Serial.printf("[MQTT] 收到: %s -> %s\n", topic, msg.c_str());
    
    JsonDocument doc;
    DeserializationError err = deserializeJson(doc, msg);
    if (err) {
        Serial.printf("[MQTT] JSON解析失败: %s\n", err.c_str());
        return;
    }
    
    String t = String(topic);
    
    // 命令处理
    if (t == topicCommand) {
        String cmd = doc["cmd"] | "";
        if (cmd == "read_now") {
            readAndPublish();
        } else if (cmd == "restart") {
            publishStatus("restarting");
            delay(500);
            ESP.restart();
        } else if (cmd == "status") {
            publishStatus("online");
        }
    }
    
    // 配置更新
    if (t == topicConfig) {
        if (doc.containsKey("interval_s")) {
            intervalMs = doc["interval_s"].as<unsigned long>() * 1000;
            prefs.putULong("interval", intervalMs);
            Serial.printf("[配置] 上报间隔更新为 %lu 秒\n", intervalMs / 1000);
        }
        if (doc.containsKey("wifi_ssid")) {
            prefs.putString("wifi_ssid", doc["wifi_ssid"].as<String>());
            Serial.println("[配置] WiFi SSID已更新，重启后生效");
        }
        if (doc.containsKey("wifi_pass")) {
            prefs.putString("wifi_pass", doc["wifi_pass"].as<String>());
        }
        if (doc.containsKey("mqtt_server")) {
            prefs.putString("mqtt_srv", doc["mqtt_server"].as<String>());
        }
    }
}

// ═══════════════════════════════════════
// 传感器读取与上报
// ═══════════════════════════════════════
void readAndPublish() {
    float temp = dht.readTemperature();
    float humi = dht.readHumidity();
    
    if (isnan(temp) || isnan(humi)) {
        readFailCount++;
        Serial.printf("[DHT22] 读取失败 (连续%d次)\n", readFailCount);
        
        if (readFailCount >= 5) {
            publishStatus("sensor_error");
        }
        return;
    }
    
    readFailCount = 0;
    lastTemp = temp;
    lastHumi = humi;
    
    Serial.printf("[DHT22] 温度: %.1f°C  湿度: %.1f%%\n", temp, humi);
    
    if (!mqtt.connected()) return;
    
    // 发布温度
    {
        JsonDocument doc;
        doc["value"] = round(temp * 10.0) / 10.0;
        doc["unit"] = "°C";
        doc["ts"] = millis();
        String json;
        serializeJson(doc, json);
        mqtt.publish(topicTemp.c_str(), json.c_str(), true);
    }
    
    // 发布湿度
    {
        JsonDocument doc;
        doc["value"] = round(humi * 10.0) / 10.0;
        doc["unit"] = "%RH";
        doc["ts"] = millis();
        String json;
        serializeJson(doc, json);
        mqtt.publish(topicHumi.c_str(), json.c_str(), true);
    }
}

void publishStatus(const char* state) {
    if (!mqtt.connected()) return;
    
    JsonDocument doc;
    doc["state"] = state;
    doc["ip"] = WiFi.localIP().toString();
    doc["rssi"] = WiFi.RSSI();
    doc["uptime_s"] = millis() / 1000;
    doc["free_heap"] = ESP.getFreeHeap();
    doc["version"] = "1.0.0";
    doc["interval_s"] = intervalMs / 1000;
    
    if (!isnan(lastTemp)) doc["last_temp"] = lastTemp;
    if (!isnan(lastHumi)) doc["last_humi"] = lastHumi;
    
    String json;
    serializeJson(doc, json);
    mqtt.publish(topicStatus.c_str(), json.c_str(), true);
}

// ═══════════════════════════════════════
// OTA 更新
// ═══════════════════════════════════════
void setupOTA() {
    ArduinoOTA.setHostname(agentId.c_str());
    
    ArduinoOTA.onStart([]() {
        Serial.println("[OTA] 开始更新...");
        publishStatus("updating");
    });
    ArduinoOTA.onEnd([]() {
        Serial.println("\n[OTA] 更新完成！");
    });
    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        Serial.printf("[OTA] 进度: %u%%\r", (progress / (total / 100)));
    });
    ArduinoOTA.onError([](ota_error_t error) {
        Serial.printf("[OTA] 错误[%u]\n", error);
    });
    
    ArduinoOTA.begin();
    Serial.println("[OTA] 已就绪");
}

// ═══════════════════════════════════════
// LED 状态指示
// ═══════════════════════════════════════
void updateLed() {
    unsigned long now = millis();
    
    switch (currentLedMode) {
        case LED_OFF:
            digitalWrite(LED_PIN, LOW);
            break;
        case LED_FAST: // 快闪 = WiFi未连接
            if (now - lastLedToggle > 150) {
                ledState = !ledState;
                digitalWrite(LED_PIN, ledState);
                lastLedToggle = now;
            }
            break;
        case LED_SLOW: // 慢闪 = MQTT未连接
            if (now - lastLedToggle > 500) {
                ledState = !ledState;
                digitalWrite(LED_PIN, ledState);
                lastLedToggle = now;
            }
            break;
        case LED_ON: // 常亮 = 一切正常
            digitalWrite(LED_PIN, HIGH);
            break;
    }
}

// ═══════════════════════════════════════
// 配置管理
// ═══════════════════════════════════════
void loadConfig() {
    prefs.begin("rwc-tm", false);
    agentId = prefs.getString("agent_id", DEFAULT_AGENT_ID);
    intervalMs = prefs.getULong("interval", DEFAULT_INTERVAL_MS);
    Serial.printf("[配置] Agent ID: %s\n", agentId.c_str());
    Serial.printf("[配置] 上报间隔: %lu 秒\n", intervalMs / 1000);
}

void saveConfig() {
    prefs.putString("agent_id", agentId);
    prefs.putULong("interval", intervalMs);
}

void buildTopics() {
    String prefix = "rwc/" + agentId + "/temp-monitor";
    topicTemp    = prefix + "/temperature";
    topicHumi    = prefix + "/humidity";
    topicStatus  = prefix + "/status";
    topicCommand = prefix + "/command";
    topicConfig  = prefix + "/config";
}
