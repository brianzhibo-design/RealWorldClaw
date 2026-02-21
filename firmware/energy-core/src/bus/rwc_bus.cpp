/**
 * RWC Bus - I2C module discovery
 *
 * Protocol:
 *   - Scan I2C addresses 0x10-0x7E
 *   - For each responding device, read register 0x00 (1 byte) = Module ID
 *   - Module ID maps to a known module type (sensor, motor, LED, etc.)
 *   - Maintain a list of active modules; detect additions and removals.
 */

#include "rwc_bus.h"
#include <Wire.h>

static const uint8_t SCAN_ADDR_START = 0x10;
static const uint8_t SCAN_ADDR_END   = 0x7E;
static const uint8_t MODULE_ID_REG   = 0x00; // Pin8 ID register

static const uint8_t MAX_MODULES = 16;
static RWCModule modules[MAX_MODULES];
static uint8_t moduleCount = 0;

// Known module ID -> name mapping
static const char* getModuleName(uint8_t id) {
    switch (id) {
        case 0x01: return "Temperature";
        case 0x02: return "Humidity";
        case 0x03: return "Light";
        case 0x04: return "Motion";
        case 0x05: return "Sound";
        case 0x06: return "Touch";
        case 0x10: return "Motor";
        case 0x11: return "Servo";
        case 0x20: return "LED-Ring";
        case 0x21: return "LED-Matrix";
        case 0x30: return "Relay";
        case 0x40: return "GPS";
        case 0x41: return "Compass";
        case 0xFF: return "Unknown";
        default:   return "Custom";
    }
}

namespace RWCBus {

void init() {
    Wire.begin(RWC_SDA, RWC_SCL);
    Wire.setClock(100000); // 100kHz standard mode
    memset(modules, 0, sizeof(modules));
    moduleCount = 0;
    Serial.println("[Bus] I2C initialized");
}

bool scan() {
    bool newFound = false;

    // Mark all modules as potentially inactive
    for (uint8_t i = 0; i < moduleCount; i++) {
        modules[i].active = false;
    }

    // Scan all addresses
    for (uint8_t addr = SCAN_ADDR_START; addr <= SCAN_ADDR_END; addr++) {
        Wire.beginTransmission(addr);
        uint8_t err = Wire.endTransmission();

        if (err != 0) continue; // No device at this address

        // Device found - try to read module ID
        uint8_t moduleId = 0xFF;
        if (readRegister(addr, MODULE_ID_REG, &moduleId, 1)) {
            // Check if already known
            bool known = false;
            for (uint8_t i = 0; i < moduleCount; i++) {
                if (modules[i].i2cAddress == addr) {
                    modules[i].active = true;
                    known = true;
                    break;
                }
            }

            if (!known && moduleCount < MAX_MODULES) {
                // New module discovered!
                RWCModule& m = modules[moduleCount];
                m.i2cAddress = addr;
                m.moduleId = moduleId;
                m.active = true;
                strncpy(m.name, getModuleName(moduleId), sizeof(m.name) - 1);
                m.name[sizeof(m.name) - 1] = '\0';

                Serial.printf("[Bus] New module: addr=0x%02X id=0x%02X name=%s\n",
                              addr, moduleId, m.name);
                moduleCount++;
                newFound = true;
            }
        }
    }

    // Log removed modules
    for (uint8_t i = 0; i < moduleCount; i++) {
        if (!modules[i].active) {
            Serial.printf("[Bus] Module removed: %s (0x%02X)\n",
                          modules[i].name, modules[i].i2cAddress);
        }
    }

    return newFound;
}

uint8_t getModuleCount() {
    uint8_t count = 0;
    for (uint8_t i = 0; i < moduleCount; i++) {
        if (modules[i].active) count++;
    }
    return count;
}

const RWCModule* getModule(uint8_t index) {
    if (index >= moduleCount) return nullptr;
    return &modules[index];
}

bool readRegister(uint8_t addr, uint8_t reg, uint8_t* data, size_t len) {
    Wire.beginTransmission(addr);
    Wire.write(reg);
    if (Wire.endTransmission(false) != 0) return false;

    if (Wire.requestFrom(addr, (uint8_t)len) != len) return false;
    for (size_t i = 0; i < len; i++) {
        data[i] = Wire.read();
    }
    return true;
}

bool writeRegister(uint8_t addr, uint8_t reg, const uint8_t* data, size_t len) {
    Wire.beginTransmission(addr);
    Wire.write(reg);
    for (size_t i = 0; i < len; i++) {
        Wire.write(data[i]);
    }
    return Wire.endTransmission() == 0;
}

} // namespace RWCBus
