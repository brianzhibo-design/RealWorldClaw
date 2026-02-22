/*
 * RealWorldClaw P0.2 MVP Firmware
 * ESP32-S3 + DHT22 + Relay
 * 
 * Arduino IDE: Board = "ESP32S3 Dev Module"
 * Libraries needed: DHT sensor library (Adafruit), PubSubClient, ArduinoJson
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <ArduinoJson.h>

// ===== USER CONFIG — Edit these! =====
#define WIFI_SSID       "YOUR_WIFI_SSID"
#define WIFI_PASS       "YOUR_WIFI_PASSWORD"
#define MQTT_BROKER     "realworldclaw-api.fly.dev"
#define MQTT_PORT       1883
#define DEVICE_ID       "esp32-mvp-001"
// =====================================

// Pins (RWC Bus v0.1)
#define DHT_PIN         4
#define RELAY_PIN       5
#define DHT_TYPE        DHT22

// Topics
#define TOPIC_TELEMETRY "rwc/" DEVICE_ID "/telemetry"
#define TOPIC_COMMAND   "rwc/" DEVICE_ID "/command"
#define TOPIC_STATUS    "rwc/" DEVICE_ID "/status"

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClient espClient;
PubSubClient mqtt(espClient);

unsigned long lastTelemetry = 0;
const unsigned long TELEMETRY_INTERVAL = 2000; // 2s
bool relayState = false;

void setupWiFi() {
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
}

void setRelay(bool on) {
  relayState = on;
  digitalWrite(RELAY_PIN, on ? HIGH : LOW);
  Serial.printf("[Relay] %s\n", on ? "ON" : "OFF");
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  // Parse JSON command
  JsonDocument doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.printf("[MQTT] JSON parse error: %s\n", err.c_str());
    return;
  }

  const char* action = doc["action"];
  if (!action) return;

  Serial.printf("[MQTT] Command: %s\n", action);

  if (strcmp(action, "relay_on") == 0) {
    setRelay(true);
  } else if (strcmp(action, "relay_off") == 0) {
    setRelay(false);
  } else if (strcmp(action, "relay_toggle") == 0) {
    setRelay(!relayState);
  } else if (strcmp(action, "ping") == 0) {
    mqtt.publish(TOPIC_STATUS, "{\"status\":\"pong\"}");
  }
}

void connectMqtt() {
  while (!mqtt.connected()) {
    Serial.print("[MQTT] Connecting...");
    String clientId = String(DEVICE_ID) + "-" + String(random(0xffff), HEX);
    if (mqtt.connect(clientId.c_str())) {
      Serial.println(" connected!");
      mqtt.subscribe(TOPIC_COMMAND);
      // Announce online
      JsonDocument doc;
      doc["status"] = "online";
      doc["device"] = DEVICE_ID;
      doc["firmware"] = "0.2.0";
      char buf[128];
      serializeJson(doc, buf);
      mqtt.publish(TOPIC_STATUS, buf, true); // retained
    } else {
      Serial.printf(" failed (rc=%d), retry in 5s\n", mqtt.state());
      delay(5000);
    }
  }
}

void publishTelemetry() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("[DHT22] Read failed!");
    return;
  }

  JsonDocument doc;
  doc["device"] = DEVICE_ID;
  doc["temperature"] = round(temperature * 10) / 10.0;
  doc["humidity"] = round(humidity * 10) / 10.0;
  doc["relay"] = relayState;
  doc["uptime_ms"] = millis();
  doc["ts"] = millis(); // No RTC; server should use receive time

  char buf[256];
  serializeJson(doc, buf);
  mqtt.publish(TOPIC_TELEMETRY, buf);
  Serial.printf("[Telemetry] T=%.1f°C H=%.1f%% Relay=%s\n",
                temperature, humidity, relayState ? "ON" : "OFF");
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n=== RealWorldClaw P0.2 MVP ===");

  pinMode(RELAY_PIN, OUTPUT);
  setRelay(false);

  dht.begin();
  setupWiFi();

  mqtt.setServer(MQTT_BROKER, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);
  mqtt.setBufferSize(512);
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    setupWiFi();
  }
  if (!mqtt.connected()) {
    connectMqtt();
  }
  mqtt.loop();

  unsigned long now = millis();
  if (now - lastTelemetry >= TELEMETRY_INTERVAL) {
    lastTelemetry = now;
    publishTelemetry();
  }
}
