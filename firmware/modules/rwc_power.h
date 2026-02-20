#pragma once
#include <Arduino.h>

// RWC Power Module Driver
// Reads battery voltage via ADC divider on TX-MOSI pin

class RWCPower {
public:
    RWCPower(uint8_t adc_pin = 34);  // Default: GPIO34

    void begin();
    float readVoltage();       // Raw battery voltage (0-4.2V)
    uint8_t readPercent();     // Battery percentage (0-100)
    bool isLow();              // Below 3.3V threshold

private:
    uint8_t _adc_pin;
    static constexpr float VREF = 3.3f;
    static constexpr float DIVIDER_RATIO = 2.0f;  // R1=R2=100K
    static constexpr float VBAT_MIN = 3.0f;
    static constexpr float VBAT_MAX = 4.2f;
    static constexpr float VBAT_LOW = 3.3f;
};
