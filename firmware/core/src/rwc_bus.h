#pragma once
#include <Arduino.h>
#include <OneWire.h>
#include <Wire.h>

#define RWC_PORT_COUNT 3
#define RWC_ID_FAMILY 0x42  // RWC module family code

struct RWCPort {
    uint8_t pin_sda;
    uint8_t pin_scl;
    uint8_t pin_tx;
    uint8_t pin_rx;
    uint8_t pin_id;
    bool module_present;
    uint8_t module_id[8];  // 1-Wire ROM (8 bytes)
    uint16_t module_type;  // parsed from ROM
};

class RWCBus {
public:
    RWCBus();
    void begin();
    
    // Scan all ports for connected modules (1-Wire ID)
    uint8_t scanAll();
    
    // Scan single port, returns true if module found
    bool scanPort(uint8_t port);
    
    // Get port info
    const RWCPort& getPort(uint8_t port) const { return _ports[port]; }
    
    // Get module type string from ROM
    static uint16_t parseModuleType(const uint8_t rom[8]);

private:
    RWCPort _ports[RWC_PORT_COUNT];
    OneWire* _ow[RWC_PORT_COUNT];
};
