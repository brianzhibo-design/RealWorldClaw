#include "rwc_servo.h"

RWCServo::RWCServo(uint8_t addr, TwoWire &wire)
    : _addr(addr), _wire(wire) {}

void RWCServo::begin(uint16_t freq) {
    wake();
    // Set prescaler: prescale = round(25MHz / (4096 * freq)) - 1
    uint8_t prescale = (uint8_t)(25000000.0f / (4096.0f * freq) - 0.5f);
    uint8_t oldmode = readReg(REG_MODE1);
    writeReg(REG_MODE1, (oldmode & 0x7F) | 0x10);  // Sleep
    writeReg(REG_PRESCALE, prescale);
    writeReg(REG_MODE1, oldmode);
    delay(5);
    writeReg(REG_MODE1, oldmode | 0xA0);  // Auto-increment + restart
}

void RWCServo::setAngle(uint8_t channel, float angle) {
    if (channel >= MAX_CHANNELS) return;
    angle = constrain(angle, 0.0f, 180.0f);
    // SG90: 0.5ms (0°) to 2.5ms (180°) at 50Hz (20ms period)
    // pulse_us = 500 + angle * (2000/180)
    float pulse_us = 500.0f + angle * (2000.0f / 180.0f);
    uint16_t tick = (uint16_t)(pulse_us / 20000.0f * 4096.0f);
    setPWM(channel, 0, tick);
}

void RWCServo::setPWM(uint8_t channel, uint16_t on, uint16_t off) {
    uint8_t base = REG_LED0_ON_L + 4 * channel;
    _wire.beginTransmission(_addr);
    _wire.write(base);
    _wire.write(on & 0xFF);
    _wire.write(on >> 8);
    _wire.write(off & 0xFF);
    _wire.write(off >> 8);
    _wire.endTransmission();
}

void RWCServo::sleep() {
    uint8_t mode = readReg(REG_MODE1);
    writeReg(REG_MODE1, mode | 0x10);
}

void RWCServo::wake() {
    writeReg(REG_MODE1, 0x00);
    delay(5);
}

void RWCServo::writeReg(uint8_t reg, uint8_t val) {
    _wire.beginTransmission(_addr);
    _wire.write(reg);
    _wire.write(val);
    _wire.endTransmission();
}

uint8_t RWCServo::readReg(uint8_t reg) {
    _wire.beginTransmission(_addr);
    _wire.write(reg);
    _wire.endTransmission();
    _wire.requestFrom(_addr, (uint8_t)1);
    return _wire.read();
}
