#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Preferences.h>

class WiFiManager {
public:
    void begin() {
        _prefs.begin("rwc-wifi", false);
        _ssid = _prefs.getString("ssid", "");
        _pass = _prefs.getString("pass", "");

        if (_ssid.length() > 0) {
            connectSTA();
        } else {
            startAP();
        }
    }

    void loop() {
        if (_apMode && _server) {
            _server->handleClient();
        }
        // Auto-reconnect in STA mode
        if (!_apMode && WiFi.status() != WL_CONNECTED && millis() - _lastReconnect > 10000) {
            Serial.println("[WIFI] Reconnecting...");
            WiFi.reconnect();
            _lastReconnect = millis();
        }
    }

    bool isConnected() { return !_apMode && WiFi.status() == WL_CONNECTED; }
    bool isAPMode() { return _apMode; }
    String getIP() { return _apMode ? WiFi.softAPIP().toString() : WiFi.localIP().toString(); }

private:
    Preferences _prefs;
    String _ssid, _pass;
    bool _apMode = false;
    WebServer* _server = nullptr;
    unsigned long _lastReconnect = 0;

    void connectSTA() {
        Serial.printf("[WIFI] Connecting to '%s'...\n", _ssid.c_str());
        WiFi.mode(WIFI_STA);
        WiFi.begin(_ssid.c_str(), _pass.c_str());

        int tries = 0;
        while (WiFi.status() != WL_CONNECTED && tries++ < 20) {
            delay(500);
            Serial.print(".");
        }
        Serial.println();

        if (WiFi.status() == WL_CONNECTED) {
            Serial.printf("[WIFI] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
            _apMode = false;
        } else {
            Serial.println("[WIFI] Failed, falling back to AP mode");
            startAP();
        }
    }

    void startAP() {
        _apMode = true;
        WiFi.mode(WIFI_AP);
        WiFi.softAP("RWC-Core-Setup", "realworld");
        Serial.printf("[WIFI] AP Mode - SSID: RWC-Core-Setup, IP: %s\n", WiFi.softAPIP().toString().c_str());

        _server = new WebServer(80);
        _server->on("/", [this]() { handleRoot(); });
        _server->on("/save", HTTP_POST, [this]() { handleSave(); });
        _server->begin();
    }

    void handleRoot() {
        String html = R"(<!DOCTYPE html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>RWC Core Setup</title>
<style>body{font-family:sans-serif;max-width:400px;margin:40px auto;padding:0 20px}
input{width:100%;padding:8px;margin:8px 0;box-sizing:border-box}
button{background:#4CAF50;color:#fff;padding:12px;width:100%;border:none;cursor:pointer;font-size:16px}</style>
</head><body><h2>🎀 RealWorldClaw Core</h2><h3>Wi-Fi Configuration</h3>
<form action="/save" method="POST">
<label>SSID:</label><input name="ssid" required>
<label>Password:</label><input name="pass" type="password">
<button type="submit">Save & Connect</button></form></body></html>)";
        _server->send(200, "text/html", html);
    }

    void handleSave() {
        String ssid = _server->arg("ssid");
        String pass = _server->arg("pass");
        _prefs.putString("ssid", ssid);
        _prefs.putString("pass", pass);
        _server->send(200, "text/html", "<h2>Saved! Rebooting...</h2>");
        delay(1000);
        ESP.restart();
    }
};
