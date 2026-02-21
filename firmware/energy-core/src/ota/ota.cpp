/**
 * OTA Update - ArduinoOTA integration
 *
 * Enables wireless firmware updates over the local network.
 * During update, the display shows a progress indicator.
 */

#include "ota.h"
#include <ArduinoOTA.h>
#include "../display/display.h"

static bool updating = false;

namespace OTA {

void init() {
    ArduinoOTA.setHostname("rwc-energy-core");

    ArduinoOTA.onStart([]() {
        updating = true;
        String type = (ArduinoOTA.getCommand() == U_FLASH) ? "firmware" : "filesystem";
        Serial.printf("[OTA] Start updating %s\n", type.c_str());

        // Show update indicator on display
        TFT_eSprite& canvas = Display::getCanvas();
        Display::clear();
        canvas.setTextDatum(MC_DATUM);
        canvas.setTextColor(TFT_CYAN, TFT_BLACK);
        canvas.drawString("OTA Update", SCREEN_CENTER_X, SCREEN_CENTER_Y - 20, 4);
        canvas.drawString("0%", SCREEN_CENTER_X, SCREEN_CENTER_Y + 20, 4);
        Display::flush();
    });

    ArduinoOTA.onEnd([]() {
        updating = false;
        Serial.println("[OTA] Complete!");

        TFT_eSprite& canvas = Display::getCanvas();
        Display::clear();
        canvas.setTextDatum(MC_DATUM);
        canvas.setTextColor(TFT_GREEN, TFT_BLACK);
        canvas.drawString("Done!", SCREEN_CENTER_X, SCREEN_CENTER_Y, 4);
        Display::flush();
    });

    ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
        uint8_t pct = (progress * 100) / total;
        Serial.printf("[OTA] Progress: %u%%\r", pct);

        TFT_eSprite& canvas = Display::getCanvas();
        Display::clear();
        canvas.setTextDatum(MC_DATUM);
        canvas.setTextColor(TFT_CYAN, TFT_BLACK);
        canvas.drawString("OTA Update", SCREEN_CENTER_X, SCREEN_CENTER_Y - 30, 4);

        // Progress bar
        int barW = 160;
        int barH = 16;
        int barX = SCREEN_CENTER_X - barW / 2;
        int barY = SCREEN_CENTER_Y + 10;
        canvas.drawRect(barX, barY, barW, barH, TFT_CYAN);
        canvas.fillRect(barX + 2, barY + 2, (barW - 4) * pct / 100, barH - 4, TFT_CYAN);

        char buf[8];
        snprintf(buf, sizeof(buf), "%u%%", pct);
        canvas.drawString(buf, SCREEN_CENTER_X, barY + barH + 20, 2);
        Display::flush();
    });

    ArduinoOTA.onError([](ota_error_t error) {
        updating = false;
        Serial.printf("[OTA] Error[%u]: ", error);
        switch (error) {
            case OTA_AUTH_ERROR:    Serial.println("Auth Failed"); break;
            case OTA_BEGIN_ERROR:   Serial.println("Begin Failed"); break;
            case OTA_CONNECT_ERROR: Serial.println("Connect Failed"); break;
            case OTA_RECEIVE_ERROR: Serial.println("Receive Failed"); break;
            case OTA_END_ERROR:     Serial.println("End Failed"); break;
        }

        TFT_eSprite& canvas = Display::getCanvas();
        Display::clear();
        canvas.setTextDatum(MC_DATUM);
        canvas.setTextColor(TFT_RED, TFT_BLACK);
        canvas.drawString("OTA Error!", SCREEN_CENTER_X, SCREEN_CENTER_Y, 4);
        Display::flush();
    });

    ArduinoOTA.begin();
    Serial.println("[OTA] Service started");
}

void loop() {
    ArduinoOTA.handle();
}

bool isUpdating() {
    return updating;
}

} // namespace OTA
