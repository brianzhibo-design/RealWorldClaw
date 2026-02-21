/**
 * MQTT Client
 *
 * Connects to the RWC platform MQTT broker.
 * Subscribes to command topics and publishes status/telemetry.
 */

#include "mqtt_client.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <Preferences.h>

// Default broker settings (can be overridden via NVS)
static const char* DEFAULT_BROKER = "mqtt.realworldclaw.com";
static const uint16_t DEFAULT_PORT = 1883;
static const uint32_t RECONNECT_INTERVAL_MS = 5000;

static WiFiClient wifiClient;
static PubSubClient mqtt(wifiClient);
static String deviceId;
static String topicPrefix;
static uint32_t lastReconnect = 0;

static MQTTClient::ExpressionCallback exprCallback = nullptr;
static MQTTClient::TTSCallback ttsCallback = nullptr;

/// Generate a unique device ID from MAC address
static String getDeviceId() {
    uint8_t mac[6];
    WiFi.macAddress(mac);
    char id[18];
    snprintf(id, sizeof(id), "rwc-%02x%02x%02x%02x%02x%02x",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    return String(id);
}

/// MQTT message callback
static void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String t(topic);
    String msg((char*)payload, length);
    Serial.printf("[MQTT] Received: %s -> %s\n", topic, msg.c_str());

    // Handle expression command
    if (t.endsWith("/cmd/expression") && exprCallback) {
        exprCallback(msg.c_str());
    }
    // Handle TTS audio data
    else if (t.endsWith("/cmd/tts") && ttsCallback) {
        ttsCallback(payload, length);
    }
}

static bool connectBroker() {
    Serial.printf("[MQTT] Connecting to broker as '%s'...\n", deviceId.c_str());

    // Connect with device ID, optional will message
    String willTopic = topicPrefix + "/status";
    if (mqtt.connect(deviceId.c_str(), nullptr, nullptr,
                     willTopic.c_str(), 1, true, "offline")) {
        Serial.println("[MQTT] Connected!");

        // Publish online status
        mqtt.publish(willTopic.c_str(), "online", true);

        // Subscribe to command topics
        String cmdTopic = topicPrefix + "/cmd/#";
        mqtt.subscribe(cmdTopic.c_str());
        Serial.printf("[MQTT] Subscribed to: %s\n", cmdTopic.c_str());

        return true;
    }

    Serial.printf("[MQTT] Connection failed, rc=%d\n", mqtt.state());
    return false;
}

namespace MQTTClient {

void init() {
    deviceId = getDeviceId();
    topicPrefix = "rwc/device/" + deviceId;

    // Load broker config from NVS (or use defaults)
    Preferences prefs;
    prefs.begin("mqtt", true);
    String broker = prefs.getString("broker", DEFAULT_BROKER);
    uint16_t port = prefs.getUShort("port", DEFAULT_PORT);
    prefs.end();

    mqtt.setServer(broker.c_str(), port);
    mqtt.setCallback(mqttCallback);
    mqtt.setBufferSize(4096); // larger buffer for TTS chunks

    connectBroker();
}

void loop() {
    if (!mqtt.connected()) {
        uint32_t now = millis();
        if (now - lastReconnect > RECONNECT_INTERVAL_MS) {
            lastReconnect = now;
            connectBroker();
        }
        return;
    }
    mqtt.loop();
}

bool isConnected() {
    return mqtt.connected();
}

bool publish(const char* topic, const char* payload) {
    String fullTopic = topicPrefix + "/" + topic;
    return mqtt.publish(fullTopic.c_str(), payload);
}

void onExpressionCommand(ExpressionCallback cb) {
    exprCallback = cb;
}

void onTTSData(TTSCallback cb) {
    ttsCallback = cb;
}

} // namespace MQTTClient
