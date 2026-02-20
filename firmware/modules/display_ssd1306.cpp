// RWC Display Module - SSD1306 Driver Implementation
#include "display_ssd1306.h"
#include <stdarg.h>

// SSD1306 init sequence
static const uint8_t PROGMEM init_cmds[] = {
    0xAE,       // Display OFF
    0xD5, 0x80, // Clock div
    0xA8, 0x3F, // Multiplex 64
    0xD3, 0x00, // Display offset 0
    0x40,       // Start line 0
    0x8D, 0x14, // Charge pump ON
    0x20, 0x00, // Horizontal addressing
    0xA1,       // Segment remap
    0xC8,       // COM scan dec
    0xDA, 0x12, // COM pins
    0x81, 0xCF, // Contrast
    0xD9, 0xF1, // Pre-charge
    0xDB, 0x40, // VCOMH deselect
    0xA4,       // Display from RAM
    0xA6,       // Normal (not inverted)
    0xAF        // Display ON
};

void DisplaySSD1306::sendCommand(uint8_t cmd) {
    _wire->beginTransmission(SSD1306_ADDR);
    _wire->write(0x00); // Co=0, D/C#=0 (command)
    _wire->write(cmd);
    _wire->endTransmission();
}

void DisplaySSD1306::sendCommandList(const uint8_t *cmds, size_t len) {
    for (size_t i = 0; i < len; i++) {
        sendCommand(pgm_read_byte(&cmds[i]));
    }
}

bool DisplaySSD1306::begin(TwoWire &wire) {
    _wire = &wire;
    sendCommandList(init_cmds, sizeof(init_cmds));
    clear();
    display();
    return true;
}

void DisplaySSD1306::clear() {
    memset(_buffer, 0, sizeof(_buffer));
}

void DisplaySSD1306::display() {
    sendCommand(0x21); sendCommand(0); sendCommand(127); // Column range
    sendCommand(0x22); sendCommand(0); sendCommand(7);   // Page range
    
    for (uint16_t i = 0; i < sizeof(_buffer); i += 16) {
        _wire->beginTransmission(SSD1306_ADDR);
        _wire->write(0x40); // Co=0, D/C#=1 (data)
        uint16_t end = min((uint16_t)(i + 16), (uint16_t)sizeof(_buffer));
        for (uint16_t j = i; j < end; j++)
            _wire->write(_buffer[j]);
        _wire->endTransmission();
    }
}

void DisplaySSD1306::setPixel(int16_t x, int16_t y, bool on) {
    if (x < 0 || x >= OLED_WIDTH || y < 0 || y >= OLED_HEIGHT) return;
    if (on) _buffer[x + (y / 8) * OLED_WIDTH] |=  (1 << (y & 7));
    else    _buffer[x + (y / 8) * OLED_WIDTH] &= ~(1 << (y & 7));
}

void DisplaySSD1306::drawLine(int16_t x0, int16_t y0, int16_t x1, int16_t y1) {
    int16_t dx = abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
    int16_t dy = -abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
    int16_t err = dx + dy;
    while (true) {
        setPixel(x0, y0);
        if (x0 == x1 && y0 == y1) break;
        int16_t e2 = 2 * err;
        if (e2 >= dy) { err += dy; x0 += sx; }
        if (e2 <= dx) { err += dx; y0 += sy; }
    }
}

void DisplaySSD1306::fillRect(int16_t x, int16_t y, int16_t w, int16_t h, bool on) {
    for (int16_t j = y; j < y + h; j++)
        for (int16_t i = x; i < x + w; i++)
            setPixel(i, j, on);
}

void DisplaySSD1306::drawCircle(int16_t cx, int16_t cy, int16_t r, bool fill) {
    int16_t x = r, y = 0, err = 1 - r;
    while (x >= y) {
        if (fill) {
            drawLine(cx - x, cy + y, cx + x, cy + y);
            drawLine(cx - x, cy - y, cx + x, cy - y);
            drawLine(cx - y, cy + x, cx + y, cy + x);
            drawLine(cx - y, cy - x, cx + y, cy - x);
        } else {
            setPixel(cx+x,cy+y); setPixel(cx-x,cy+y);
            setPixel(cx+x,cy-y); setPixel(cx-x,cy-y);
            setPixel(cx+y,cy+x); setPixel(cx-y,cy+x);
            setPixel(cx+y,cy-x); setPixel(cx-y,cy-x);
        }
        y++;
        if (err < 0) err += 2*y + 1;
        else { x--; err += 2*(y - x) + 1; }
    }
}

// Basic 5x7 font - just ASCII 32-127 (space to ~)
// Simplified: using built-in approach, each char is 5 bytes wide
extern const uint8_t font5x7[] PROGMEM;  // Link with font data

void DisplaySSD1306::setCursor(int16_t x, int16_t y) {
    _cursor_x = x; _cursor_y = y;
}

void DisplaySSD1306::setTextSize(uint8_t size) {
    _text_size = size ? size : 1;
}

void DisplaySSD1306::print(const char *text) {
    // Simplified text rendering - placeholder for font rendering
    // In production, iterate chars and blit from font5x7
    (void)text;
}

void DisplaySSD1306::printf(const char *fmt, ...) {
    char buf[64];
    va_list args;
    va_start(args, fmt);
    vsnprintf(buf, sizeof(buf), fmt, args);
    va_end(args);
    print(buf);
}

void DisplaySSD1306::setBrightness(uint8_t level) {
    sendCommand(0x81);
    sendCommand(level);
}

void DisplaySSD1306::sleep(bool on) {
    sendCommand(on ? 0xAE : 0xAF);
}

// ─── Expression Drawing ────────────────────────────

void DisplaySSD1306::drawEyes(int16_t lx, int16_t ly, int16_t rx, int16_t ry,
                               int16_t w, int16_t h, bool open) {
    if (open) {
        drawCircle(lx, ly, w, true);
        drawCircle(rx, ry, w, true);
    } else {
        // Closed eyes = horizontal lines
        drawLine(lx - w, ly, lx + w, ly);
        drawLine(rx - w, ry, rx + w, ry);
    }
}

void DisplaySSD1306::drawMouth(int16_t x, int16_t y, int16_t w, int16_t curve) {
    // curve > 0 = smile, < 0 = frown, 0 = flat
    for (int16_t i = -w; i <= w; i++) {
        int16_t dy = (curve * i * i) / (w * w);
        setPixel(x + i, y + dy);
    }
}

void DisplaySSD1306::drawHeart(int16_t cx, int16_t cy, int16_t s) {
    for (float t = 0; t < 6.28f; t += 0.05f) {
        float hx = s * 16.0f * sin(t)*sin(t)*sin(t) / 16.0f;
        float hy = -s * (13*cos(t) - 5*cos(2*t) - 2*cos(3*t) - cos(4*t)) / 16.0f;
        setPixel(cx + (int16_t)hx, cy + (int16_t)hy);
    }
}

void DisplaySSD1306::drawZzz(int16_t x, int16_t y, uint8_t frame) {
    // Animated Z's floating up
    const char *zs[] = {"z", "Z", "Z"};
    for (int i = 0; i < 3; i++) {
        int16_t yy = y - i * 8 - (frame % 4);
        if (yy > 0) {
            setCursor(x + i * 6, yy);
            print(zs[i]);
        }
    }
}

void DisplaySSD1306::showExpression(Expression expr) {
    clear();
    
    // Face center: 64, 32
    const int16_t cx = 64, cy = 32;
    const int16_t eye_y = 22, eye_sep = 20;
    const int16_t mouth_y = 45;
    
    switch (expr) {
    case Expression::HAPPY:
        drawEyes(cx - eye_sep, eye_y, cx + eye_sep, eye_y, 6, 6, true);
        drawMouth(cx, mouth_y, 15, 5);  // big smile
        break;
        
    case Expression::SAD:
        drawEyes(cx - eye_sep, eye_y, cx + eye_sep, eye_y, 5, 5, true);
        drawMouth(cx, mouth_y + 4, 12, -4);  // frown
        // Eyebrows angled sad
        drawLine(cx - eye_sep - 6, eye_y - 10, cx - eye_sep + 6, eye_y - 8);
        drawLine(cx + eye_sep - 6, eye_y - 8, cx + eye_sep + 6, eye_y - 10);
        break;
        
    case Expression::ANGRY:
        drawEyes(cx - eye_sep, eye_y, cx + eye_sep, eye_y, 5, 5, true);
        drawMouth(cx, mouth_y, 10, -3);
        // Angry eyebrows V shape
        drawLine(cx - eye_sep - 7, eye_y - 12, cx - eye_sep + 5, eye_y - 7);
        drawLine(cx + eye_sep - 5, eye_y - 7, cx + eye_sep + 7, eye_y - 12);
        break;
        
    case Expression::SURPRISED:
        // Big round eyes
        drawCircle(cx - eye_sep, eye_y, 8, false);
        drawCircle(cx + eye_sep, eye_y, 8, false);
        // Small pupils
        drawCircle(cx - eye_sep, eye_y, 3, true);
        drawCircle(cx + eye_sep, eye_y, 3, true);
        // O mouth
        drawCircle(cx, mouth_y, 6, false);
        break;
        
    case Expression::THINKING:
        // One eye squinting
        drawCircle(cx - eye_sep, eye_y, 5, true);
        drawLine(cx + eye_sep - 6, eye_y, cx + eye_sep + 6, eye_y); // squint
        // Flat mouth, offset
        drawLine(cx - 5, mouth_y, cx + 8, mouth_y);
        // Thinking dots
        drawCircle(cx + 25, mouth_y - 5, 1, true);
        drawCircle(cx + 30, mouth_y - 10, 2, true);
        break;
        
    case Expression::SLEEPING:
        // Closed eyes
        drawEyes(cx - eye_sep, eye_y, cx + eye_sep, eye_y, 6, 6, false);
        // Peaceful mouth
        drawMouth(cx, mouth_y, 8, 2);
        // Zzz
        drawZzz(cx + 28, eye_y, 0);
        break;
        
    case Expression::LOVE:
        // Heart eyes!
        drawHeart(cx - eye_sep, eye_y, 5);
        drawHeart(cx + eye_sep, eye_y, 5);
        drawMouth(cx, mouth_y, 15, 6); // big smile
        break;
        
    case Expression::NEUTRAL:
    default:
        drawEyes(cx - eye_sep, eye_y, cx + eye_sep, eye_y, 5, 5, true);
        drawLine(cx - 8, mouth_y, cx + 8, mouth_y); // flat mouth
        break;
    }
    
    display();
}

void DisplaySSD1306::animateTransition(Expression from, Expression to, uint16_t duration_ms) {
    // Simple blink transition
    showExpression(from);
    delay(duration_ms / 3);
    
    // Close eyes frame
    clear();
    drawEyes(64 - 20, 22, 64 + 20, 22, 6, 6, false);
    display();
    delay(duration_ms / 3);
    
    showExpression(to);
}
