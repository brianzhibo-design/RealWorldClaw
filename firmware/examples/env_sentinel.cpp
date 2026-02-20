/**
 * Environment Sentinel — 环境哨兵固件
 * RealWorldClaw Reference Design #3
 *
 * 模块: Core + Power + Sensor + Display
 * 功能: 温湿度/光照监测, OLED显示, WiFi上报, 异常告警
 */

#include <Arduino.h>
#include <WiFi.h>
#include <Wire.h>
#include <Adafruit_SHT4x.h>
#include <BH1750.h>
#include <Adafruit_SSD1306.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// === 配置 ===
#define WIFI_SSID       "YOUR_SSID"
#define WIFI_PASS       "YOUR_PASS"
#define MQTT_SERVER     "YOUR_MQTT_SERVER"
#define MQTT_PORT       1883
#define MQTT_TOPIC_DATA "rwc/sentinel/data"
#define MQTT_TOPIC_ALERT "rwc/sentinel/alert"
#define MQTT_TOPIC_CMD  "rwc/sentinel/cmd"

#define SAMPLE_INTERVAL_MS  2000
#define REPORT_INTERVAL_MS  30000
#define SCREEN_W  128
#define SCREEN_H  64

// === 告警阈值（可通过MQTT远程配置）===
struct Thresholds {
    float temp_high = 35.0;
    float temp_low  = 5.0;
    float humi_high = 80.0;
    float humi_low  = 20.0;
    float lux_high  = 10000.0;
    float lux_low   = 1.0;
} thresholds;

// === 硬件 ===
Adafruit_SHT4x sht4;
BH1750 lightMeter;
Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);
WiFiClient espClient;
PubSubClient mqtt(espClient);

// === 状态 ===
float temperature = 0, humidity = 0, lux = 0;
unsigned long lastSample = 0, lastReport = 0;
bool wifiConnected = false;
bool mqttConnected = false;

// --- WiFi ---
void setupWiFi() {
    WiFi.mode(WIFI_STA);
    WiFi.begin(WIFI_SSID, WIFI_PASS);
    Serial.print("WiFi connecting");
    int tries = 0;
    while (WiFi.status() != WL_CONNECTED && tries++ < 40) {
        delay(250);
        Serial.print(".");
    }
    wifiConnected = (WiFi.status() == WL_CONNECTED);
    Serial.println(wifiConnected ? " OK" : " FAIL");
}

// --- MQTT 回调（接收远程配置）---
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    JsonDocument doc;
    if (deserializeJson(doc, payload, length)) return;

    if (doc["temp_high"]) thresholds.temp_high = doc["temp_high"];
    if (doc["temp_low"])  thresholds.temp_low  = doc["temp_low"];
    if (doc["humi_high"]) thresholds.humi_high = doc["humi_high"];
    if (doc["humi_low"])  thresholds.humi_low  = doc["humi_low"];
    if (doc["lux_high"])  thresholds.lux_high  = doc["lux_high"];
    if (doc["lux_low"])   thresholds.lux_low   = doc["lux_low"];

    Serial.println("Thresholds updated via MQTT");
}

void reconnectMQTT() {
    if (mqtt.connected()) return;
    if (mqtt.connect("env-sentinel")) {
        mqtt.subscribe(MQTT_TOPIC_CMD);
        mqttConnected = true;
    }
}

// --- 传感器读取 ---
void readSensors() {
    sensors_event_t h, t;
    if (sht4.getEvent(&h, &t)) {
        temperature = t.temperature;
        humidity = h.relative_humidity;
    }
    lux = lightMeter.readLightLevel();
}

// --- OLED 显示 ---
void updateDisplay() {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);

    // 标题
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.print("ENV SENTINEL");
    display.setCursor(90, 0);
    display.print(wifiConnected ? "WiFi" : "----");

    // 分隔线
    display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

    // 温度（大字）
    display.setTextSize(2);
    display.setCursor(0, 16);
    display.print(temperature, 1);
    display.setTextSize(1);
    display.print(" C");

    // 湿度
    display.setTextSize(2);
    display.setCursor(0, 36);
    display.print(humidity, 0);
    display.setTextSize(1);
    display.print(" %RH");

    // 光照
    display.setTextSize(1);
    display.setCursor(0, 56);
    display.print(lux, 0);
    display.print(" lux");

    // 告警指示
    bool alert = (temperature > thresholds.temp_high ||
                  temperature < thresholds.temp_low ||
                  humidity > thresholds.humi_high ||
                  humidity < thresholds.humi_low);
    if (alert) {
        display.setCursor(90, 56);
        display.print("! ALERT");
    }

    display.display();
}

// --- 数据上报 ---
void reportData() {
    if (!mqtt.connected()) return;

    JsonDocument doc;
    doc["temp"] = round(temperature * 10) / 10.0;
    doc["humi"] = round(humidity * 10) / 10.0;
    doc["lux"]  = round(lux);
    doc["uptime"] = millis() / 1000;

    char buf[200];
    serializeJson(doc, buf);
    mqtt.publish(MQTT_TOPIC_DATA, buf);
}

// --- 告警检查 ---
void checkAlerts() {
    if (!mqtt.connected()) return;

    String alerts = "";
    if (temperature > thresholds.temp_high)
        alerts += "TEMP_HIGH:" + String(temperature, 1) + " ";
    if (temperature < thresholds.temp_low)
        alerts += "TEMP_LOW:" + String(temperature, 1) + " ";
    if (humidity > thresholds.humi_high)
        alerts += "HUMI_HIGH:" + String(humidity, 0) + " ";
    if (humidity < thresholds.humi_low)
        alerts += "HUMI_LOW:" + String(humidity, 0) + " ";

    if (alerts.length() > 0) {
        JsonDocument doc;
        doc["alerts"] = alerts;
        doc["temp"] = temperature;
        doc["humi"] = humidity;
        doc["lux"] = lux;
        char buf[300];
        serializeJson(doc, buf);
        mqtt.publish(MQTT_TOPIC_ALERT, buf);
    }
}

// === Setup ===
void setup() {
    Serial.begin(115200);
    Wire.begin();

    // OLED
    if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
        Serial.println("OLED failed");
    }
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 28);
    display.print("ENV SENTINEL v1.0");
    display.display();

    // SHT40
    if (!sht4.begin()) {
        Serial.println("SHT4x not found");
    }
    sht4.setPrecision(SHT4X_HIGH_PRECISION);
    sht4.setHeater(SHT4X_NO_HEATER);

    // BH1750
    if (!lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
        Serial.println("BH1750 not found");
    }

    // WiFi + MQTT
    setupWiFi();
    mqtt.setServer(MQTT_SERVER, MQTT_PORT);
    mqtt.setCallback(mqttCallback);

    delay(1000);
}

// === Loop ===
void loop() {
    unsigned long now = millis();

    // MQTT keepalive
    if (wifiConnected) {
        reconnectMQTT();
        mqtt.loop();
    }

    // 采样
    if (now - lastSample >= SAMPLE_INTERVAL_MS) {
        lastSample = now;
        readSensors();
        updateDisplay();
    }

    // 定期上报
    if (now - lastReport >= REPORT_INTERVAL_MS) {
        lastReport = now;
        reportData();
        checkAlerts();
    }
}
