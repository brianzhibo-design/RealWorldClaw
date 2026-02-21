/**
 * RWC Bus - I2C module discovery and communication
 *
 * Scans the I2C bus to detect connected RWC modules.
 * Each module has a unique ID readable from a register (Pin8 ID protocol).
 */

#pragma once
#include <Arduino.h>

/// Information about a discovered module
struct RWCModule {
    uint8_t i2cAddress;
    uint8_t moduleId;      // Pin8 ID byte
    char name[16];         // Human-readable name
    bool active;           // Currently detected on bus
};

namespace RWCBus {
    /// Initialize I2C bus
    void init();

    /// Scan for modules. Returns true if a NEW module was discovered.
    bool scan();

    /// Get count of currently active modules
    uint8_t getModuleCount();

    /// Get module info by index
    const RWCModule* getModule(uint8_t index);

    /// Read a register from a module
    bool readRegister(uint8_t addr, uint8_t reg, uint8_t* data, size_t len);

    /// Write a register to a module
    bool writeRegister(uint8_t addr, uint8_t reg, const uint8_t* data, size_t len);
}
