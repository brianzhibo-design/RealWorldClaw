/**
 * WiFi Manager - Connection management with AP captive portal fallback
 */

#pragma once
#include <Arduino.h>

namespace WiFiManager {
    /// Initialize WiFi. Tries saved credentials, falls back to AP mode.
    void init();

    /// Call in loop to handle reconnection
    void loop();

    /// Check if connected to a WiFi network
    bool isConnected();

    /// Get the current IP address as string
    String getIP();

    /// Force AP mode for reconfiguration
    void startAPMode();

    /// Reset saved credentials
    void resetCredentials();
}
