# RWC Module Registry

The central repository for RealWorldClaw modules — designs, firmware, and metadata.

## Structure

```
registry/
├── modules/           # Module definitions
│   ├── sensors/
│   │   ├── temp-humidity/
│   │   │   ├── manifest.yaml
│   │   │   ├── README.md
│   │   │   ├── firmware/
│   │   │   ├── hardware/
│   │   │   └── models/
│   │   └── ...
│   ├── actuators/
│   └── displays/
├── templates/         # Module templates
└── scripts/           # Registry tools
```

## Module Manifest

Each module must have a `manifest.yaml`:

```yaml
module:
  id: "rwc-temp-humidity-v1"
  name: "Temperature & Humidity Sensor"
  version: "1.0.0"
  type: "sensor"
  author: "RealWorldClaw"
  license: "Apache-2.0"
  
capabilities:
  - id: "temperature"
    type: "read"
    unit: "celsius"
    range: [-40, 80]
    accuracy: "±0.5°C"
    
  - id: "humidity"
    type: "read"
    unit: "percent"
    range: [0, 100]
    accuracy: "±3%"

hardware:
  bom_cost_usd: 3.50
  power: "3.3V"
  current_max_ma: 20
  connector: "rwc-bus-v0.1"
  
files:
  firmware: "firmware/main.ino"
  pcb: "hardware/pcb.kicad_pro"
  case: "models/case.stl"
  assembly: "README.md#assembly"
```

## Verification

Modules are verified through:
- Automated manifest validation
- Hardware simulation tests
- Community review process
- Official compatibility certification (future)

## Adding a Module

1. Fork the repository
2. Create module directory: `registry/modules/{category}/{module-name}/`
3. Add `manifest.yaml` and required files
4. Submit pull request
5. Pass automated validation
6. Community review (48h)
7. Merge → listed in registry