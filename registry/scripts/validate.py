#!/usr/bin/env python3
"""Registry module manifest validator."""

import sys
import yaml
import json
from pathlib import Path
from jsonschema import validate, ValidationError

# JSON Schema for module manifest validation
MANIFEST_SCHEMA = {
    "type": "object",
    "required": ["module", "capabilities", "hardware"],
    "properties": {
        "module": {
            "type": "object",
            "required": ["id", "name", "version", "type", "author", "license"],
            "properties": {
                "id": {"type": "string", "pattern": "^rwc-[a-z0-9-]+-v[0-9]+$"},
                "name": {"type": "string", "minLength": 1},
                "version": {"type": "string", "pattern": "^[0-9]+\\.[0-9]+\\.[0-9]+$"},
                "type": {"enum": ["sensor", "actuator", "display", "compute", "power"]},
                "author": {"type": "string"},
                "license": {"type": "string"},
                "created_at": {"type": "string", "pattern": "^[0-9]{4}-[0-9]{2}-[0-9]{2}$"}
            }
        },
        "capabilities": {
            "type": "array",
            "minItems": 1,
            "items": {
                "type": "object",
                "required": ["id", "type"],
                "properties": {
                    "id": {"type": "string", "pattern": "^[a-z][a-z0-9_-]*$"},
                    "type": {"enum": ["read", "write", "read-write"]},
                    "unit": {"type": "string"},
                    "range": {"type": "array", "items": {"type": "number"}, "minItems": 2, "maxItems": 2},
                    "accuracy": {"type": "string"},
                    "resolution": {"type": "number"},
                    "interval_ms": {"type": "integer", "minimum": 100}
                }
            }
        },
        "hardware": {
            "type": "object",
            "required": ["bom_cost_usd", "power", "connector"],
            "properties": {
                "bom_cost_usd": {"type": "number", "minimum": 0},
                "power": {"type": "string"},
                "current_max_ma": {"type": "integer", "minimum": 0},
                "connector": {"enum": ["rwc-bus-v0.1"]},
                "dimensions_mm": {"type": "array", "items": {"type": "number"}, "minItems": 3, "maxItems": 3},
                "weight_g": {"type": "number", "minimum": 0}
            }
        },
        "files": {
            "type": "object",
            "properties": {
                "firmware": {"type": "string"},
                "pcb_gerber": {"type": "string"},
                "schematic": {"type": "string"},
                "case_stl": {"type": "string"}
            }
        },
        "compatibility": {
            "type": "object",
            "properties": {
                "rwc_protocol": {"type": "string"},
                "energy_core": {"type": "array", "items": {"type": "string"}}
            }
        }
    }
}

def validate_manifest(manifest_path: Path) -> tuple[bool, str]:
    """Validate a module manifest file."""
    try:
        with open(manifest_path, 'r') as f:
            data = yaml.safe_load(f)
        
        # Schema validation
        validate(instance=data, schema=MANIFEST_SCHEMA)
        
        # Additional business logic checks
        module = data.get('module', {})
        capabilities = data.get('capabilities', [])
        
        # Check ID format matches directory structure
        expected_id = manifest_path.parent.name
        module_id = module.get('id', '')
        if expected_id not in module_id:
            return False, f"Module ID '{module_id}' should contain directory name '{expected_id}'"
        
        # Check capability consistency
        for cap in capabilities:
            if cap.get('type') == 'read' and 'range' not in cap and cap.get('unit') != 'boolean':
                return False, f"Read capability '{cap['id']}' should have a range (unless boolean)"
        
        # Check cost reasonableness
        cost = data.get('hardware', {}).get('bom_cost_usd', 0)
        if cost > 100:
            return False, f"BOM cost ${cost} seems unreasonable (>$100)"
        
        return True, "Valid"
        
    except FileNotFoundError:
        return False, "Manifest file not found"
    except yaml.YAMLError as e:
        return False, f"YAML parsing error: {e}"
    except ValidationError as e:
        return False, f"Schema validation error: {e.message}"
    except Exception as e:
        return False, f"Validation error: {e}"

def main():
    if len(sys.argv) < 2:
        print("Usage: python validate.py <manifest.yaml> [manifest2.yaml ...]")
        print("   or: python validate.py --all  (validate all manifests)")
        sys.exit(1)
    
    if sys.argv[1] == "--all":
        # Find all manifest files
        registry_dir = Path(__file__).parent.parent
        manifest_files = list(registry_dir.rglob("*/manifest.yaml"))
        if not manifest_files:
            print("No manifest files found")
            sys.exit(1)
    else:
        manifest_files = [Path(f) for f in sys.argv[1:]]
    
    print(f"Validating {len(manifest_files)} manifest file(s)...")
    
    errors = 0
    for manifest_file in manifest_files:
        valid, message = validate_manifest(manifest_file)
        status = "✅" if valid else "❌"
        print(f"{status} {manifest_file.relative_to(Path.cwd())}: {message}")
        if not valid:
            errors += 1
    
    print(f"\nValidation complete: {len(manifest_files) - errors} passed, {errors} failed")
    sys.exit(errors)

if __name__ == "__main__":
    main()