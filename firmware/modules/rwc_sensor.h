#pragma once
#include <Arduino.h>
#include <Wire.h>

// RWC Sensor Module Driver
// SHT30 (temp/humidity) + BH1750 (light)

struct SensorData {
    float temperature;  // °C
    float humidity;     // %RH
    uint16_t lux;       // lx
};

class RWCSensor {
public:
    RWCSensor(TwoWire &wire = Wire);

    void begin();
    bool readSHT30(float &temp, float &hum);
    uint16_t readBH1750();  // Returns lux
    SensorData readAll();

private:
    TwoWire &_wire;
    static constexpr uint8_t SHT30_ADDR  = 0x44;
    static constexpr uint8_t BH1750_ADDR = 0x23;

    uint8_t crc8(const uint8_t *data, uint8_t len);
};
