#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

class RWCMqtt {
public:
    using CommandCallback = std::function<void(const char* topic, JsonDocument& doc)>;

    void begin(const char* server = "broker.emqx.io", uint16_t port = 1883) {
        _server = server;
        _port = port;
        _clientId = "rwc-core-" + String((uint32_t)ESP.getEfuseMac(), HEX);
        _topicPrefix = "rwc/" + _clientId + "/";

        _wifiClient = new WiFiClient();
        _mqtt = new PubSubClient(*_wifiClient);
        _mqtt->setServer(_server, _port);
        _mqtt->setBufferSize(1024);
        _mqtt->setCallback([this](char* topic, byte* payload, unsigned int len) {
            _handleMessage(topic, payload, len);
        });
    }

    void loop() {
        if (!_mqtt->connected()) {
            _reconnect();
        }
        _mqtt->loop();
    }

    void onCommand(CommandCallback cb) { _cmdCallback = cb; }

    // Publish module data
    void publishModuleData(uint8_t port, uint16_t moduleType, JsonDocument& data) {
        String topic = _topicPrefix + "port/" + String(port) + "/data";
        String payload;
        serializeJson(data, payload);
        _mqtt->publish(topic.c_str(), payload.c_str());
    }

    // Publish status
    void publishStatus(const char* status) {
        String topic = _topicPrefix + "status";
        _mqtt->publish(topic.c_str(), status, true);  // retained
    }

    bool isConnected() { return _mqtt && _mqtt->connected(); }

private:
    const char* _server;
    uint16_t _port;
    String _clientId;
    String _topicPrefix;
    WiFiClient* _wifiClient = nullptr;
    PubSubClient* _mqtt = nullptr;
    CommandCallback _cmdCallback = nullptr;
    unsigned long _lastReconnect = 0;

    void _reconnect() {
        if (millis() - _lastReconnect < 5000) return;
        _lastReconnect = millis();

        Serial.printf("[MQTT] Connecting to %s:%d as %s...\n", _server, _port, _clientId.c_str());
        
        String willTopic = _topicPrefix + "status";
        if (_mqtt->connect(_clientId.c_str(), nullptr, nullptr, willTopic.c_str(), 0, true, "offline")) {
            Serial.println("[MQTT] Connected!");
            publishStatus("online");
            // Subscribe to commands
            String cmdTopic = _topicPrefix + "cmd/#";
            _mqtt->subscribe(cmdTopic.c_str());
        } else {
            Serial.printf("[MQTT] Failed, rc=%d\n", _mqtt->state());
        }
    }

    void _handleMessage(char* topic, byte* payload, unsigned int len) {
        if (!_cmdCallback) return;
        
        JsonDocument doc;
        DeserializationError err = deserializeJson(doc, payload, len);
        if (err) {
            Serial.printf("[MQTT] JSON parse error: %s\n", err.c_str());
            return;
        }
        _cmdCallback(topic, doc);
    }
};
