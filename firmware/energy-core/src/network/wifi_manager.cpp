/**
 * WiFi Manager
 *
 * On boot: attempts to connect with saved credentials from NVS (Preferences).
 * If no credentials or connection fails, starts an AP with a captive portal
 * web page for configuration.
 */

#include "wifi_manager.h"
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>
#include <DNSServer.h>

// AP configuration
static const char* AP_SSID = "RWC-EnergyCore";
static const char* AP_PASS = "realworld";
static const uint32_t CONNECT_TIMEOUT_MS = 15000;
static const uint32_t RECONNECT_INTERVAL_MS = 30000;

static Preferences prefs;
static WebServer server(80);
static DNSServer dnsServer;
static bool apMode = false;
static bool connected = false;
static uint32_t lastReconnectAttempt = 0;
static String savedSSID;
static String savedPass;

// --- Captive Portal HTML ---
static const char PORTAL_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1">
<title>RWC Energy Core Setup</title>
<style>
body{font-family:sans-serif;text-align:center;padding:20px;background:#111;color:#0f0}
input{width:80%;padding:10px;margin:8px;font-size:16px;border-radius:8px;border:1px solid #0f0;background:#222;color:#fff}
button{padding:12px 40px;font-size:18px;background:#0f0;color:#000;border:none;border-radius:8px;cursor:pointer}
h1{font-size:24px}
</style></head><body>
<h1>🔮 Energy Core</h1><p>WiFi Configuration</p>
<form action="/save" method="POST">
<input name="ssid" placeholder="WiFi SSID" required><br>
<input name="pass" type="password" placeholder="Password"><br>
<button type="submit">Connect</button>
</form></body></html>
)rawliteral";

static void handleRoot() {
    server.send(200, "text/html", PORTAL_HTML);
}

static void handleSave() {
    savedSSID = server.arg("ssid");
    savedPass = server.arg("pass");

    // Save to NVS
    prefs.begin("wifi", false);
    prefs.putString("ssid", savedSSID);
    prefs.putString("pass", savedPass);
    prefs.end();

    server.send(200, "text/html",
        "<html><body style='background:#111;color:#0f0;text-align:center;padding:40px'>"
        "<h2>Saved! Rebooting...</h2></body></html>");
    delay(1500);
    ESP.restart();
}

static bool tryConnect() {
    if (savedSSID.isEmpty()) return false;

    Serial.printf("[WiFi] Connecting to '%s'...\n", savedSSID.c_str());
    WiFi.mode(WIFI_STA);
    WiFi.begin(savedSSID.c_str(), savedPass.c_str());

    uint32_t start = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - start < CONNECT_TIMEOUT_MS) {
        delay(250);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        Serial.printf("[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
        return true;
    }

    Serial.println("[WiFi] Connection failed");
    return false;
}

namespace WiFiManager {

void init() {
    // Load saved credentials
    prefs.begin("wifi", true);
    savedSSID = prefs.getString("ssid", "");
    savedPass = prefs.getString("pass", "");
    prefs.end();

    // Try connecting with saved creds
    if (tryConnect()) {
        connected = true;
        return;
    }

    // Fall back to AP mode
    startAPMode();
}

void startAPMode() {
    apMode = true;
    connected = false;
    WiFi.mode(WIFI_AP);
    WiFi.softAP(AP_SSID, AP_PASS);
    Serial.printf("[WiFi] AP Mode: SSID='%s' IP=%s\n",
                  AP_SSID, WiFi.softAPIP().toString().c_str());

    // DNS redirect all requests to portal
    dnsServer.start(53, "*", WiFi.softAPIP());

    server.on("/", handleRoot);
    server.on("/save", HTTP_POST, handleSave);
    server.onNotFound(handleRoot); // captive portal redirect
    server.begin();
}

void loop() {
    if (apMode) {
        dnsServer.processNextRequest();
        server.handleClient();
        return;
    }

    // Monitor connection, attempt reconnect
    if (WiFi.status() != WL_CONNECTED) {
        connected = false;
        uint32_t now = millis();
        if (now - lastReconnectAttempt > RECONNECT_INTERVAL_MS) {
            lastReconnectAttempt = now;
            Serial.println("[WiFi] Reconnecting...");
            connected = tryConnect();
        }
    } else {
        connected = true;
    }
}

bool isConnected() {
    return connected;
}

String getIP() {
    if (apMode) return WiFi.softAPIP().toString();
    return WiFi.localIP().toString();
}

void resetCredentials() {
    prefs.begin("wifi", false);
    prefs.clear();
    prefs.end();
    Serial.println("[WiFi] Credentials cleared");
}

} // namespace WiFiManager
