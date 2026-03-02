# Firmware Module Development Guide

This guide explains how to add a new firmware module under `firmware/modules/`.

## 1) Module File Structure

Each module uses a paired header/source pattern:

- `rwc_<module>.h`
- `rwc_<module>.cpp`

Examples in this repo:

- `rwc_sensor.h/.cpp`
- `rwc_servo.h/.cpp`
- `rwc_power.h/.cpp`

A typical header contains:

- public class API (constructor + operations)
- module constants (`static constexpr`)
- private helpers and state

A typical source file contains:

- constructor definition
- bus/device setup logic
- runtime read/write methods
- conversion and validation helpers (CRC, scaling, bounds)

## 2) Common Interface Patterns

RealWorldClaw modules generally follow an **init → read/write → convenience** pattern.

### `begin()` initialization

Use `begin()` to initialize hardware and communication state.

- Configure bus/peripheral mode
- Wake or power-on the device
- Apply safe defaults (frequency/range/precision)

Example references:

- `RWCSensor::begin()` powers BH1750 and enables continuous mode
- `RWCServo::begin(freq)` sets PWM frequency for servo control
- `RWCPower::begin()` prepares ADC reads

### `read*()` methods

Read methods should be deterministic and return explicit failure states.

Recommended style:

- `bool readX(out1, out2)` for operations that can fail
- typed value return for simple reads (`uint16_t readBH1750()`)
- provide aggregated read when useful (`SensorData readAll()`)

### `write*()` methods

For actuator modules, expose constrained write APIs:

- validate ranges before writing hardware values
- encapsulate protocol/register details behind simple methods

Example:

- `RWCServo::setAngle(channel, angle)` maps angles to PWM pulse width

## 3) Step-by-Step: Add a New Module (Example: Fan Module)

This example adds a hypothetical cooling fan controller.

### Step 1 — Create files

Create:

- `firmware/modules/rwc_fan.h`
- `firmware/modules/rwc_fan.cpp`

### Step 2 — Define public API in header

Suggested API surface:

```cpp
class RWCFan {
public:
    RWCFan(uint8_t pwmPin);
    void begin();
    void setSpeedPercent(uint8_t percent);   // 0-100
    uint8_t speedPercent() const;

private:
    uint8_t _pwmPin;
    uint8_t _speedPercent;
};
```

### Step 3 — Implement init and write path

In `rwc_fan.cpp`:

- configure PWM in `begin()`
- clamp input in `setSpeedPercent()`
- convert percent to duty cycle
- cache last speed in `_speedPercent`

### Step 4 — Add optional read/health helpers

Add helpers only if module supports feedback:

- tachometer RPM read
- fault pin/status read
- over-current check

### Step 5 — Integrate and verify

- include the module in your firmware app
- call `begin()` once in setup
- run module methods in loop/task
- verify behavior on target hardware

## 4) Design & Quality Checklist

Before opening a PR:

- [ ] File names follow `rwc_<module>.h/.cpp`
- [ ] `begin()` exists and applies safe defaults
- [ ] Public API is minimal and purpose-focused
- [ ] Read/write paths validate bounds and errors
- [ ] Constants use `static constexpr` where appropriate
- [ ] Comments explain protocol assumptions and units
- [ ] No unrelated refactors

## 5) Reference Modules

Use these as implementation references:

- Sensor data + CRC flow: `firmware/modules/rwc_sensor.h/.cpp`
- PWM actuator control: `firmware/modules/rwc_servo.h/.cpp`
- Analog power telemetry: `firmware/modules/rwc_power.h/.cpp`
