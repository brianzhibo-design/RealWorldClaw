#pragma once
// RWC Display Module - SSD1306 0.96" OLED 128x64 I2C Driver
// Part of RealWorldClaw firmware

#include <Arduino.h>
#include <Wire.h>

#define SSD1306_ADDR 0x3C
#define OLED_WIDTH   128
#define OLED_HEIGHT  64

// Expression types
enum class Expression : uint8_t {
    HAPPY,
    SAD,
    ANGRY,
    SURPRISED,
    THINKING,
    SLEEPING,
    LOVE,
    NEUTRAL
};

class DisplaySSD1306 {
public:
    bool begin(TwoWire &wire = Wire);
    void clear();
    void display();  // flush buffer to screen
    
    // Pixel operations
    void setPixel(int16_t x, int16_t y, bool on = true);
    void drawLine(int16_t x0, int16_t y0, int16_t x1, int16_t y1);
    void fillRect(int16_t x, int16_t y, int16_t w, int16_t h, bool on = true);
    void drawCircle(int16_t cx, int16_t cy, int16_t r, bool fill = false);
    
    // Text
    void setCursor(int16_t x, int16_t y);
    void setTextSize(uint8_t size);
    void print(const char *text);
    void printf(const char *fmt, ...);
    
    // Expressions (the fun part! 🎀)
    void showExpression(Expression expr);
    void animateTransition(Expression from, Expression to, uint16_t duration_ms = 300);
    
    // Brightness
    void setBrightness(uint8_t level);  // 0-255
    void sleep(bool on);

private:
    TwoWire *_wire = nullptr;
    uint8_t _buffer[OLED_WIDTH * OLED_HEIGHT / 8] = {};
    int16_t _cursor_x = 0, _cursor_y = 0;
    uint8_t _text_size = 1;
    
    void sendCommand(uint8_t cmd);
    void sendCommandList(const uint8_t *cmds, size_t len);
    
    // Expression drawing helpers
    void drawEyes(int16_t lx, int16_t ly, int16_t rx, int16_t ry,
                  int16_t w, int16_t h, bool open = true);
    void drawMouth(int16_t x, int16_t y, int16_t w, int16_t curve);
    void drawHeart(int16_t cx, int16_t cy, int16_t size);
    void drawZzz(int16_t x, int16_t y, uint8_t frame);
};
