/**
 * MQTT Client - Communication with RealWorldClaw platform
 */

#pragma once
#include <Arduino.h>
#include <functional>

namespace MQTTClient {
    /// Initialize MQTT (call after WiFi connected)
    void init();

    /// Process MQTT messages (call in loop)
    void loop();

    /// Check if connected to broker
    bool isConnected();

    /// Publish a message to a topic
    bool publish(const char* topic, const char* payload);

    /// Set callback for incoming expression commands
    using ExpressionCallback = std::function<void(const char* expression)>;
    void onExpressionCommand(ExpressionCallback cb);

    /// Set callback for incoming TTS data
    using TTSCallback = std::function<void(const uint8_t* data, size_t len)>;
    void onTTSData(TTSCallback cb);
}
