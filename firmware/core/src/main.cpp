/*
 * RealWorldClaw Core Module Firmware
 * RealWorldClaw Team | 2026
 * 
 * ESP32-S3-DevKitC-1 + RWC Bus (3 ports)
 * Arduino Framework / PlatformIO
 */

#include <Arduino.h>
#include "rwc_bus.h"
#include "module_registry.h"
#include "wifi_manager.h"
#include "mqtt_client.h"

// ── Globals ──
RWCBus bus;
ModuleRegistry registry;
WiFiManager wifiMgr;
RWCMqtt mqtt;

// Onboard RGB LED (WS2812 on GPIO48)
#include <Adafruit_NeoPixel.h>
Adafruit_NeoPixel pixel(1, 48, NEO_GRB + NEO_KHZ800);

unsigned long lastScan = 0;
const unsigned long SCAN_INTERVAL = 5000;  // re-scan every 5s for hot-plug

// ── Status LED ──
void setLED(uint8_t r, uint8_t g, uint8_t b) {
    pixel.setPixelColor(0, pixel.Color(r, g, b));
    pixel.show();
}

// ── Register example drivers ──
void registerBuiltinDrivers() {
    // Example: Environment sensor (I2C, e.g. BME280 at 0x76)
    registry.registerDriver(MOD_SENSOR_ENV, "EnvSensor",
        [](uint8_t port, const RWCPort& info) -> bool {
            Serial.printf("[ENV] Init on port %d\n", port);
            // TODO: init BME280 on shared I2C
            return true;
        },
        [](uint8_t port, const RWCPort& info) {
            // TODO: read BME280 and publish
        }
    );

    // Example: Servo arm (PWM via I2C PCA9685)
    registry.registerDriver(MOD_SERVO_ARM, "ServoArm",
        [](uint8_t port, const RWCPort& info) -> bool {
            Serial.printf("[SERVO] Init on port %d\n", port);
            return true;
        },
        [](uint8_t port, const RWCPort& info) {
            // TODO: handle servo commands from MQTT
        }
    );
}

// ── MQTT command handler ──
void handleCommand(const char* topic, JsonDocument& doc) {
    Serial.printf("[CMD] %s\n", topic);
    // Example: {"port": 0, "action": "set", "value": 90}
    // Route to appropriate module driver
}

// ── Setup ──
void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n RealWorldClaw Core Module v0.1");
    Serial.println("================================");

    // LED init
    pixel.begin();
    setLED(0, 0, 32);  // Blue = booting

    // Register drivers
    registerBuiltinDrivers();

    // Init RWC Bus
    bus.begin();
    uint8_t found = bus.scanAll();
    Serial.printf("[CORE] Found %d module(s)\n", found);

    // Init discovered modules
    for (int i = 0; i < RWC_PORT_COUNT; i++) {
        const RWCPort& p = bus.getPort(i);
        if (p.module_present) {
            registry.initModule(i, p);
        }
    }

    // Wi-Fi
    wifiMgr.begin();

    if (wifiMgr.isConnected()) {
        setLED(0, 32, 0);  // Green = connected
        // MQTT
        mqtt.begin();
        mqtt.onCommand(handleCommand);
    } else if (wifiMgr.isAPMode()) {
        setLED(32, 16, 0);  // Orange = AP mode
        Serial.println("[CORE] Connect to 'RWC-Core-Setup' WiFi, open 192.168.4.1");
    }

    Serial.println("[CORE] Ready!");
}

// ── Loop ──
void loop() {
    wifiMgr.loop();

    if (wifiMgr.isConnected()) {
        mqtt.loop();
    }

    // Periodic re-scan for hot-plug
    if (millis() - lastScan > SCAN_INTERVAL) {
        lastScan = millis();
        bus.scanAll();
        for (int i = 0; i < RWC_PORT_COUNT; i++) {
            const RWCPort& p = bus.getPort(i);
            if (p.module_present) {
                registry.initModule(i, p);  // no-op if already inited
            }
        }
    }

    // Tick all active modules
    registry.tickAll(bus);

    delay(10);  // yield
}
