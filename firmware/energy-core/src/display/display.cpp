/**
 * Display Driver - GC9A01 Round LCD
 * Uses TFT_eSPI with sprite-based double buffering for smooth animation.
 */

#include "display.h"

static TFT_eSPI tft;
static TFT_eSprite canvas(&tft);

namespace Display {

void init() {
    tft.init();
    tft.setRotation(0);
    tft.fillScreen(TFT_BLACK);

    // Initialize backlight pin
    #ifdef TFT_BL
    pinMode(TFT_BL, OUTPUT);
    setBrightness(200);
    #endif

    // Create sprite for double-buffered drawing (16-bit color)
    canvas.createSprite(SCREEN_WIDTH, SCREEN_HEIGHT);
    canvas.fillSprite(TFT_BLACK);
}

TFT_eSPI& getTFT() {
    return tft;
}

TFT_eSprite& getCanvas() {
    return canvas;
}

void flush() {
    canvas.pushSprite(0, 0);
}

void setBrightness(uint8_t level) {
    #ifdef TFT_BL
    analogWrite(TFT_BL, level);
    #endif
}

void clear() {
    canvas.fillSprite(TFT_BLACK);
}

} // namespace Display
