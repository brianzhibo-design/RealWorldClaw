#pragma once
#include <Arduino.h>
#include <functional>
#include <map>
#include "rwc_bus.h"

// Known module types
enum RWCModuleType : uint16_t {
    MOD_UNKNOWN     = 0x0000,
    MOD_SERVO_ARM   = 0x0001,  // 舵机机械臂
    MOD_LED_MATRIX  = 0x0002,  // LED点阵屏
    MOD_SENSOR_ENV  = 0x0003,  // 环境传感器（温湿度+气压）
    MOD_MOTOR_DC    = 0x0004,  // 直流电机驱动
    MOD_RELAY_4CH   = 0x0005,  // 4路继电器
    MOD_OLED_128    = 0x0006,  // 0.96" OLED显示屏
    MOD_RFID_RC522  = 0x0007,  // RFID读卡器
    MOD_AUDIO_I2S   = 0x0008,  // I2S音频模块
};

// Module driver callback: called each loop iteration
using ModuleTickFn = std::function<void(uint8_t port, const RWCPort& info)>;

// Module init callback: called once on discovery
using ModuleInitFn = std::function<bool(uint8_t port, const RWCPort& info)>;

struct ModuleDriver {
    const char* name;
    ModuleInitFn init;
    ModuleTickFn tick;
};

class ModuleRegistry {
public:
    // Register a driver for a module type
    void registerDriver(uint16_t type, const char* name, ModuleInitFn init, ModuleTickFn tick) {
        _drivers[type] = {name, init, tick};
    }

    // Try to initialize module on port, returns true if driver found & init ok
    bool initModule(uint8_t port, const RWCPort& info) {
        auto it = _drivers.find(info.module_type);
        if (it == _drivers.end()) {
            Serial.printf("[REG] No driver for module type 0x%04X on port %d\n", info.module_type, port);
            return false;
        }
        Serial.printf("[REG] Loading driver '%s' for port %d\n", it->second.name, port);
        if (it->second.init && !it->second.init(port, info)) {
            Serial.printf("[REG] Driver '%s' init failed on port %d\n", it->second.name, port);
            return false;
        }
        _active[port] = info.module_type;
        return true;
    }

    // Tick all active modules
    void tickAll(const RWCBus& bus) {
        for (auto& [port, type] : _active) {
            auto it = _drivers.find(type);
            if (it != _drivers.end() && it->second.tick) {
                it->second.tick(port, bus.getPort(port));
            }
        }
    }

    const char* getModuleName(uint16_t type) {
        auto it = _drivers.find(type);
        return it != _drivers.end() ? it->second.name : "unknown";
    }

private:
    std::map<uint16_t, ModuleDriver> _drivers;
    std::map<uint8_t, uint16_t> _active;  // port → type
};
