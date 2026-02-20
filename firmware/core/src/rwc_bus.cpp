#include "rwc_bus.h"

// GPIO assignments per port
static const uint8_t PORT_SDA[RWC_PORT_COUNT] = {8, 8, 8};
static const uint8_t PORT_SCL[RWC_PORT_COUNT] = {9, 9, 9};
static const uint8_t PORT_TX[RWC_PORT_COUNT]  = {43, 11, 35};
static const uint8_t PORT_RX[RWC_PORT_COUNT]  = {44, 12, 37};
static const uint8_t PORT_ID[RWC_PORT_COUNT]  = {10, 13, 14};

RWCBus::RWCBus() {
    for (int i = 0; i < RWC_PORT_COUNT; i++) {
        _ow[i] = nullptr;
    }
}

void RWCBus::begin() {
    // Initialize I2C (shared bus)
    Wire.begin(PORT_SDA[0], PORT_SCL[0]);
    Wire.setClock(400000);  // 400kHz Fast Mode

    // Initialize ports
    for (int i = 0; i < RWC_PORT_COUNT; i++) {
        _ports[i].pin_sda = PORT_SDA[i];
        _ports[i].pin_scl = PORT_SCL[i];
        _ports[i].pin_tx  = PORT_TX[i];
        _ports[i].pin_rx  = PORT_RX[i];
        _ports[i].pin_id  = PORT_ID[i];
        _ports[i].module_present = false;
        memset(_ports[i].module_id, 0, 8);
        _ports[i].module_type = 0;

        // Create OneWire instance for ID pin
        _ow[i] = new OneWire(_ports[i].pin_id);
    }
}

uint8_t RWCBus::scanAll() {
    uint8_t found = 0;
    for (int i = 0; i < RWC_PORT_COUNT; i++) {
        if (scanPort(i)) found++;
    }
    return found;
}

bool RWCBus::scanPort(uint8_t port) {
    if (port >= RWC_PORT_COUNT) return false;
    
    _ow[port]->reset_search();
    uint8_t rom[8];
    
    if (_ow[port]->search(rom)) {
        // Verify CRC
        if (OneWire::crc8(rom, 7) != rom[7]) {
            Serial.printf("[RWC] Port %d: CRC error\n", port);
            _ports[port].module_present = false;
            return false;
        }
        
        memcpy(_ports[port].module_id, rom, 8);
        _ports[port].module_type = parseModuleType(rom);
        _ports[port].module_present = true;
        
        Serial.printf("[RWC] Port %d: Module 0x%04X found (ROM: %02X%02X%02X%02X%02X%02X%02X%02X)\n",
            port, _ports[port].module_type,
            rom[0], rom[1], rom[2], rom[3], rom[4], rom[5], rom[6], rom[7]);
        return true;
    }
    
    _ports[port].module_present = false;
    return false;
}

uint16_t RWCBus::parseModuleType(const uint8_t rom[8]) {
    // Module type encoded in ROM bytes [1:2] (little-endian)
    return (uint16_t)rom[1] | ((uint16_t)rom[2] << 8);
}
