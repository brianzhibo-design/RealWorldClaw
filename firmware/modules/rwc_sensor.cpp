#include "rwc_sensor.h"

RWCSensor::RWCSensor(TwoWire &wire) : _wire(wire) {}

void RWCSensor::begin() {
    // BH1750: power on + continuous high-res mode
    _wire.beginTransmission(BH1750_ADDR);
    _wire.write(0x01);  // Power On
    _wire.endTransmission();
    delay(10);
    _wire.beginTransmission(BH1750_ADDR);
    _wire.write(0x10);  // Continuous H-Res Mode (1 lx, 120ms)
    _wire.endTransmission();
}

bool RWCSensor::readSHT30(float &temp, float &hum) {
    // Single-shot, high repeatability
    _wire.beginTransmission(SHT30_ADDR);
    _wire.write(0x24);  // Clock stretching disabled
    _wire.write(0x00);  // High repeatability
    _wire.endTransmission();
    delay(20);

    _wire.requestFrom(SHT30_ADDR, (uint8_t)6);
    if (_wire.available() < 6) return false;

    uint8_t buf[6];
    for (int i = 0; i < 6; i++) buf[i] = _wire.read();

    // Verify CRC
    if (crc8(buf, 2) != buf[2]) return false;
    if (crc8(buf + 3, 2) != buf[5]) return false;

    uint16_t raw_t = (buf[0] << 8) | buf[1];
    uint16_t raw_h = (buf[3] << 8) | buf[4];

    temp = -45.0f + 175.0f * (raw_t / 65535.0f);
    hum  = 100.0f * (raw_h / 65535.0f);
    return true;
}

uint16_t RWCSensor::readBH1750() {
    _wire.requestFrom(BH1750_ADDR, (uint8_t)2);
    if (_wire.available() < 2) return 0;
    uint16_t raw = _wire.read() << 8;
    raw |= _wire.read();
    return (uint16_t)(raw / 1.2f);
}

SensorData RWCSensor::readAll() {
    SensorData d = {0, 0, 0};
    readSHT30(d.temperature, d.humidity);
    d.lux = readBH1750();
    return d;
}

uint8_t RWCSensor::crc8(const uint8_t *data, uint8_t len) {
    uint8_t crc = 0xFF;
    for (uint8_t i = 0; i < len; i++) {
        crc ^= data[i];
        for (uint8_t b = 0; b < 8; b++) {
            crc = (crc & 0x80) ? (crc << 1) ^ 0x31 : (crc << 1);
        }
    }
    return crc;
}
