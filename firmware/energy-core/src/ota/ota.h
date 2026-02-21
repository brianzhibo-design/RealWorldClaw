/**
 * OTA Update - WiFi firmware updates via ArduinoOTA
 */

#pragma once
#include <Arduino.h>

namespace OTA {
    /// Initialize OTA service
    void init();

    /// Handle OTA in loop
    void loop();

    /// Check if OTA update is in progress
    bool isUpdating();
}
