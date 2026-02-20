#include "rwc_power.h"

RWCPower::RWCPower(uint8_t adc_pin) : _adc_pin(adc_pin) {}

void RWCPower::begin() {
    analogReadResolution(12);
    analogSetAttenuation(ADC_11db);
    pinMode(_adc_pin, INPUT);
}

float RWCPower::readVoltage() {
    uint32_t sum = 0;
    for (int i = 0; i < 16; i++) {
        sum += analogRead(_adc_pin);
    }
    float adc_avg = sum / 16.0f;
    float v_adc = (adc_avg / 4095.0f) * VREF;
    return v_adc * DIVIDER_RATIO;
}

uint8_t RWCPower::readPercent() {
    float v = readVoltage();
    if (v >= VBAT_MAX) return 100;
    if (v <= VBAT_MIN) return 0;
    return (uint8_t)((v - VBAT_MIN) / (VBAT_MAX - VBAT_MIN) * 100.0f);
}

bool RWCPower::isLow() {
    return readVoltage() < VBAT_LOW;
}
