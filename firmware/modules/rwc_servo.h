#pragma once
#include <Arduino.h>
#include <Wire.h>

// RWC Servo Module Driver
// PCA9685 16-ch PWM, using CH0-CH3 for SG90 servos

class RWCServo {
public:
    RWCServo(uint8_t addr = 0x40, TwoWire &wire = Wire);

    void begin(uint16_t freq = 50);  // 50Hz for servos
    void setAngle(uint8_t channel, float angle);  // 0-180°
    void setPWM(uint8_t channel, uint16_t on, uint16_t off);
    void sleep();
    void wake();

    static constexpr uint8_t MAX_CHANNELS = 4;

private:
    uint8_t _addr;
    TwoWire &_wire;
    void writeReg(uint8_t reg, uint8_t val);
    uint8_t readReg(uint8_t reg);

    // PCA9685 registers
    static constexpr uint8_t REG_MODE1     = 0x00;
    static constexpr uint8_t REG_PRESCALE  = 0xFE;
    static constexpr uint8_t REG_LED0_ON_L = 0x06;
};
