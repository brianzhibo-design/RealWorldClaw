/**
 * Display Driver - GC9A01 Round LCD initialization and utilities
 */

#pragma once
#include <Arduino.h>
#include <TFT_eSPI.h>

// Display dimensions
#define SCREEN_WIDTH  240
#define SCREEN_HEIGHT 240
#define SCREEN_CENTER_X 120
#define SCREEN_CENTER_Y 120

namespace Display {
    /// Initialize the GC9A01 display
    void init();

    /// Get reference to the TFT instance
    TFT_eSPI& getTFT();

    /// Get reference to the sprite (double-buffered drawing)
    TFT_eSprite& getCanvas();

    /// Push the canvas sprite to the display
    void flush();

    /// Set backlight brightness (0-255)
    void setBrightness(uint8_t level);

    /// Clear the canvas to black
    void clear();
}
