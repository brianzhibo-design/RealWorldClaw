/**
 * RealWorldClaw - Energy Core Firmware
 * Main entry point
 *
 * Hardware: ESP32-S3 + GC9A01 (240x240) + I2S Audio + I2C Bus
 */

#include <Arduino.h>
#include "display/display.h"
#include "display/expressions.h"
#include "network/wifi_manager.h"
#include "network/mqtt_client.h"
#include "audio/audio.h"
#include "bus/rwc_bus.h"
#include "ota/ota.h"

// Task intervals (ms)
static const uint32_t BUS_SCAN_INTERVAL = 5000;
static const uint32_t EXPRESSION_UPDATE_INTERVAL = 33; // ~30fps
static const uint32_t MQTT_LOOP_INTERVAL = 50;

static uint32_t lastBusScan = 0;
static uint32_t lastExprUpdate = 0;
static uint32_t lastMqttLoop = 0;

void setup() {
    Serial.begin(115200);
    delay(500);
    Serial.println("\n=== RealWorldClaw Energy Core ===");
    Serial.println("Firmware v0.1.0");

    // 1. Initialize display first (show boot animation)
    Display::init();
    Expressions::init();
    Expressions::setExpression(Expression::IDLE);
    Serial.println("[OK] Display initialized");

    // 2. Initialize audio and play boot sound
    Audio::init();
    Audio::playBootSound();
    Serial.println("[OK] Audio initialized");

    // 3. Initialize I2C bus for module discovery
    RWCBus::init();
    Serial.println("[OK] RWC Bus initialized");

    // 4. Connect WiFi (shows thinking expression while connecting)
    Expressions::setExpression(Expression::THINKING);
    WiFiManager::init();

    if (WiFiManager::isConnected()) {
        Expressions::setExpression(Expression::HAPPY);
        Audio::playConnectedSound();
        Serial.println("[OK] WiFi connected");

        // 5. Initialize MQTT
        MQTTClient::init();
        Serial.println("[OK] MQTT initialized");

        // 6. Initialize OTA
        OTA::init();
        Serial.println("[OK] OTA initialized");
    } else {
        // AP mode for configuration
        Expressions::setExpression(Expression::SAD);
        Serial.println("[INFO] WiFi not configured, AP mode active");
    }

    Expressions::setExpression(Expression::IDLE);
    Serial.println("\n=== Setup Complete ===\n");
}

void loop() {
    uint32_t now = millis();

    // Update expression animation (~30fps)
    if (now - lastExprUpdate >= EXPRESSION_UPDATE_INTERVAL) {
        lastExprUpdate = now;
        Expressions::update();
    }

    // WiFi connection monitoring
    WiFiManager::loop();

    // Update WiFi status expression
    if (!WiFiManager::isConnected() && Expressions::getCurrentExpression() != Expression::SAD) {
        // Don't override if already showing something intentional
    }

    // MQTT loop
    if (WiFiManager::isConnected()) {
        if (now - lastMqttLoop >= MQTT_LOOP_INTERVAL) {
            lastMqttLoop = now;
            MQTTClient::loop();
        }
    }

    // Periodic bus scan for module discovery
    if (now - lastBusScan >= BUS_SCAN_INTERVAL) {
        lastBusScan = now;
        bool newModule = RWCBus::scan();
        if (newModule) {
            Expressions::setExpression(Expression::EXCITED);
            // Return to idle after 2 seconds
            delay(2000);
            Expressions::setExpression(Expression::IDLE);
        }
    }

    // OTA handling
    if (WiFiManager::isConnected()) {
        OTA::loop();
    }
}
